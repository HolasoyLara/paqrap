'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { ahoraLima, aInputFecha } from '@/lib/formato';
import type { CierreCorrida, Configuracion, ParametrosCorrida, ResumenArchivo } from '@/lib/tipos';
import { useEstadoSimulacion } from '@/lib/useEstadoSimulacion';
import TopBar from '@/components/TopBar';
import PantallaParametros from '@/components/PantallaParametros';
import PantallaPanorama from '@/components/PantallaPanorama';
import PantallaCierre from '@/components/PantallaCierre';
import PantallaPedidos from '@/components/PantallaPedidos';
import ModalDetalle from '@/components/ModalDetalle';
import Toasts, { type AvisoLocal } from '@/components/Toasts';
import type { Seleccion } from '@/components/MapaOperacion';

type Pestana = 'parametros' | 'panorama' | 'cierre' | 'pedidos';

const PESTANAS: [Pestana, string][] = [
  ['parametros', '1 · Parámetros'],
  ['panorama', '2 · Panorama'],
  ['cierre', '3 · Cierre'],
  ['pedidos', '4 · Pedidos'],
];

/** Semilla fija de la corrida (la misma que el valor por defecto del backend). Ya no se configura desde la pantalla. */
const SEMILLA_FIJA = 20260902;
/** Algoritmo de ruteo fijo: el Algoritmo Genetico (GA). Ya no se configura desde la pantalla. */
const ALGORITMO_FIJO = 'GA' as const;

function formularioInicial(c: Configuracion): ParametrosCorrida {
  const p = c.parametrosPorDefecto;
  const ga = c.algoritmos.find((a) => a.id === ALGORITMO_FIJO);
  const esc5d = c.escenarios.find((e) => e.id === 'SIMULACION_5D');
  return {
    ...p,
    escenario: 'SIMULACION_5D',
    algoritmo: ALGORITMO_FIJO,
    semilla: SEMILLA_FIJA,
    fechaInicio: aInputFecha(esc5d?.fechaInicioPorDefecto ?? '2026-09-01T00:00'),
    umbrales: { verde: c.umbrales.verde, ambar: c.umbrales.ambar },
    parametrosAlgoritmo: { ...(ga?.parametros ?? {}) },
    operacion: { ...c.operacionPorDefecto },
  };
}

function conSegundos(f: string | null): string | null {
  if (!f) return null;
  return f.length === 16 ? f + ':00' : f;
}

/**
 * PaqRap · Visualizador. Una sola pagina con las pantallas del prototipo v04
 * (V-1 Parametros, V-2 Panorama, V-3 Cierre) mas Pedidos (Modulo A). Todos los dispositivos ven la misma corrida; la zona,
 * el zoom, los filtros y la seleccion son locales a cada uno (C5, C6).
 */
export default function Pagina() {
  const { estado, error, minutoAhora, refrescar } = useEstadoSimulacion(1000);
  const [pestana, setPestana] = useState<Pestana>('parametros');
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [errorConfig, setErrorConfig] = useState<string | null>(null);
  const [form, setForm] = useState<ParametrosCorrida | null>(null);
  const [archivos, setArchivos] = useState<ResumenArchivo[] | null>(null);
  const [errorArchivos, setErrorArchivos] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [cierre, setCierre] = useState<CierreCorrida | null>(null);
  const [avisos, setAvisos] = useState<AvisoLocal[]>([]);
  const primerEstado = useRef(true);
  const estadoPrevio = useRef<string | null>(null);

  // cada pestana empieza arriba
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pestana]);
  const irA = (p: Pestana) => setPestana(p);

  const cargarConfig = useCallback(() => {
    api.configuracion()
      .then((c) => {
        setConfig(c);
        setForm((f) => f ?? formularioInicial(c));
        setErrorConfig(null);
      })
      .catch((e) => setErrorConfig(e instanceof Error ? e.message : 'Sin conexión'));
  }, []);

  useEffect(() => {
    cargarConfig();
  }, [cargarConfig]);

  // si el backend no respondio al principio, se reintenta cuando vuelva
  useEffect(() => {
    if (!config && estado) cargarConfig();
  }, [config, estado, cargarConfig]);

  const aviso = useCallback((texto: string, tipo: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random();
    setAvisos((a) => [...a, { id, texto, tipo }].slice(-3));
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), tipo === 'error' ? 9000 : 6000);
  }, []);

  const recargarArchivos = useCallback(() => {
    if (!form) return;
    setErrorArchivos(null);
    api.archivos(form.escenario, conSegundos(form.fechaInicio) ?? '', form.diasSimulacion)
      .then(setArchivos)
      .catch((e) => {
        setArchivos(null);
        setErrorArchivos(e instanceof Error ? e.message : 'No se pudieron validar los archivos');
      });
  }, [form]);

  const claveArchivos = form ? `${form.escenario}|${form.fechaInicio}|${form.diasSimulacion}` : '';
  useEffect(() => {
    if (!form) return;
    const t = setTimeout(recargarArchivos, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveArchivos]);

  // transiciones de la corrida: al abrir con una corrida en marcha se va al panorama; al terminar, al cierre
  useEffect(() => {
    if (!estado) return;
    const previo = estadoPrevio.current;
    if (primerEstado.current) {
      primerEstado.current = false;
      if (estado.estadoCorrida === 'EN_CURSO') setPestana('panorama');
    } else if (previo === 'EN_CURSO' && (estado.estadoCorrida === 'FINALIZADA' || estado.estadoCorrida === 'DETENIDA')) {
      api.cierre().then(setCierre).catch(() => undefined);
      setPestana('cierre');
      if (estado.colapso) aviso(`Colapso logístico detectado: ${estado.colapso.motivo}.`, 'error');
      else aviso('La corrida terminó. Revise el cierre del periodo.', 'ok');
    }
    estadoPrevio.current = estado.estadoCorrida;
  }, [estado, aviso]);

  const iniciar = async () => {
    if (!form) return;
    setOcupado(true);
    try {
      const fecha = form.escenario === 'TIEMPO_REAL' && !form.fechaInicio ? ahoraLima() : form.fechaInicio;
      await api.iniciar({ ...form, fechaInicio: conSegundos(fecha) });
      setCierre(null);
      setSeleccion(null);
      setPestana('panorama');
      await refrescar();
    } catch (e) {
      aviso(e instanceof Error ? e.message : 'No se pudo iniciar la corrida', 'error');
    } finally {
      setOcupado(false);
    }
  };

  const detener = async () => {
    setOcupado(true);
    try {
      const c = await api.detener();
      setCierre(c);
      setPestana('cierre');
      await refrescar();
    } catch (e) {
      aviso(e instanceof Error ? e.message : 'No se pudo detener la corrida', 'error');
    } finally {
      setOcupado(false);
    }
  };

  const subirArchivo = async (tipo: string, archivo: File) => {
    try {
      const r = await api.subirArchivo(tipo, archivo);
      aviso(r.mensaje + ` (${r.registros} registros${r.errores ? `, ${r.errores} con error` : ''})`, r.valido ? 'ok' : 'error');
      recargarArchivos();
    } catch (e) {
      aviso(e instanceof Error ? e.message : 'No se pudo subir el archivo', 'error');
    }
  };

  const quitarArchivo = async (tipo: string) => {
    try {
      const r = await api.quitarArchivo(tipo);
      aviso(r.mensaje, 'ok');
      recargarArchivos();
    } catch (e) {
      aviso(e instanceof Error ? e.message : 'No se pudo quitar el archivo', 'error');
    }
  };

  const umbralesEnVivo = useCallback((verde: number, ambar: number) => {
    api.umbrales(verde, ambar).then(() => refrescar()).catch(() => undefined);
  }, [refrescar]);

  const enCurso = estado?.estadoCorrida === 'EN_CURSO';
  const escenarioId = enCurso || (estado && estado.estadoCorrida !== 'SIN_CORRIDA') ? estado!.escenario : form?.escenario;
  const algoritmoId = enCurso || (estado && estado.estadoCorrida !== 'SIN_CORRIDA') ? estado!.algoritmo : form?.algoritmo;
  const escenarioTexto = config?.escenarios.find((e) => e.id === escenarioId)?.descripcion ?? '—';
  const algoritmoTexto = config?.algoritmos.find((a) => a.id === algoritmoId)?.etiqueta ?? '';
  const sinBackend = !estado && !!error;

  return (
    <div>
      <TopBar
        estado={estado}
        minutoAhora={minutoAhora}
        escenarioTexto={escenarioTexto}
        algoritmoTexto={algoritmoTexto}
        puedeIniciar={!!form && !!archivos && archivos.every((a) => a.valido)}
        ocupado={ocupado}
        onIniciar={iniciar}
        onDetener={detener}
      />
      <nav className="tabs">
        {PESTANAS.map(([id, etiqueta]) => (
          <button key={id} className={'tab' + (pestana === id ? ' active' : '')} onClick={() => irA(id)}>{etiqueta}</button>
        ))}
      </nav>
      <main>
        {(sinBackend || (errorConfig && !config)) && (
          <div className="banner banner-error">
            <b>No se puede conectar con el backend de PaqRap.</b> {error ?? errorConfig}. Verifique que el servicio Spring Boot esté en
            marcha (scripts <code>INICIAR</code>) o, si este visualizador está publicado en Vercel, que la variable <code>BACKEND_URL</code>
            apunte a la URL pública del backend. Se reintenta automáticamente.
          </div>
        )}
        {estado && error && <div className="banner banner-error">Conexión inestable con el backend: {error}. Reintentando…</div>}

        {pestana === 'parametros' && config && form && (
          <PantallaParametros
            config={config}
            form={form}
            setForm={(f) => setForm(f.escenario === 'TIEMPO_REAL' && form.escenario !== 'TIEMPO_REAL' ? { ...f, fechaInicio: ahoraLima() } : f)}
            archivos={archivos}
            errorArchivos={errorArchivos}
            bloqueado={enCurso}
            ocupado={ocupado}
            puedeIniciar={!!archivos}
            onIniciar={iniciar}
            onSubir={subirArchivo}
            onQuitar={quitarArchivo}
            onUmbralesEnVivo={umbralesEnVivo}
          />
        )}
        {pestana === 'parametros' && (!config || !form) && !sinBackend && <p className="empty-hint">Cargando configuración…</p>}

        {pestana === 'panorama' && estado && (
          <PantallaPanorama
            estado={estado}
            minutoAhora={minutoAhora}
            seleccion={seleccion}
            onAbrir={setSeleccion}
            onAviso={aviso}
            refrescar={refrescar}
          />
        )}
        {pestana === 'cierre' && <PantallaCierre estado={estado} cierreRecibido={cierre} />}
        {pestana === 'pedidos' && (
          <PantallaPedidos estado={estado} onAbrir={setSeleccion} onAviso={aviso} onIrAParametros={() => setPestana('parametros')} />
        )}
      </main>

      {seleccion && estado && (
        <ModalDetalle
          seleccion={seleccion}
          enCurso={enCurso}
          diaADia={estado.escenario === 'TIEMPO_REAL'}
          verde={estado.umbralVerde}
          ambar={estado.umbralAmbar}
          onCerrar={() => setSeleccion(null)}
          onAbrir={setSeleccion}
          onAviso={aviso}
        />
      )}
      <Toasts
        alertas={estado?.alertas ?? []}
        idCorrida={estado?.idCorrida ?? ''}
        avisos={avisos}
        onQuitarAviso={(id) => setAvisos((a) => a.filter((x) => x.id !== id))}
      />
    </div>
  );
}
