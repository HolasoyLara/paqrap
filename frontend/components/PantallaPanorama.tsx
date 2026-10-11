'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { EstadoVisual } from '@/lib/tipos';
import { fechaHoraCorta, numero, semaforo, soles } from '@/lib/formato';
import MapaOperacion, {
  acercar, centrarEn, FILTROS_POR_DEFECTO, type Filtros, type Seleccion, type Vista, VISTA_COMPLETA, vistaDeZona,
} from './MapaOperacion';
import Tooltip, { type TooltipApi } from './Tooltip';
import { IconoMini } from './Iconos';

interface Props {
  estado: EstadoVisual;
  minutoAhora: () => number;
  seleccion: Seleccion | null;
  onAbrir: (s: Seleccion) => void;
  onAviso: (texto: string, tipo?: 'ok' | 'error') => void;
  refrescar: () => void;
}

const TIPOS_RAPIDOS: [string, string][] = [
  ['REGULAR_36H', 'Regular · 36 h'],
  ['PRIORIZADA_4H', 'Priorizada · 4 h'],
  ['PRIORIZADA_8H', 'Priorizada · 8 h'],
  ['PRIORIZADA_12H', 'Priorizada · 12 h'],
  ['PRIORIZADA_18H', 'Priorizada · 18 h'],
];

function Kpi({ etiqueta, valor, sub, sem }: { etiqueta: string; valor: string; sub: string; sem?: 'verde' | 'ambar' | 'rojo' | null }) {
  return (
    <div className={'kpi' + (sem ? ' kpi-border-' + sem : '')}>
      <div className="kpi-label">{sem && <span className={'kpi-sem-dot ' + sem} />}{etiqueta}</div>
      <div className="kpi-value">{valor}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

/** V-2 · Panorama operativo: franja de KPI, mapa con la operacion en vivo y detalle bajo demanda. */
export default function PantallaPanorama({ estado, minutoAhora, seleccion, onAbrir, onAviso, refrescar }: Props) {
  const [vista, setVista] = useState<Vista>(VISTA_COMPLETA);
  const [zona, setZona] = useState('full');
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_POR_DEFECTO);
  const [verFiltros, setVerFiltros] = useState(false);
  const [leyenda, setLeyenda] = useState(true);
  const [metricas, setMetricas] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const [cantidadMenu, setCantidadMenu] = useState(1);
  const tooltip = useRef<TooltipApi>(null);

  const k = estado.kpis;
  const enCurso = estado.estadoCorrida === 'EN_CURSO';
  const diaADia = estado.escenario === 'TIEMPO_REAL';
  const intermedios = estado.almacenes.filter((a) => !a.central);
  const central = estado.almacenes.find((a) => a.central);

  // zona visible: local a este dispositivo (C6), no se sincroniza con los demas
  useEffect(() => {
    setVista(vistaDeZona(zona));
  }, [zona]);

  useEffect(() => {
    const cerrar = () => setMenu(null);
    if (menu) {
      const t = setTimeout(() => document.addEventListener('click', cerrar), 0);
      return () => {
        clearTimeout(t);
        document.removeEventListener('click', cerrar);
      };
    }
  }, [menu]);

  const buscar = async () => {
    const id = busqueda.trim();
    if (!id) {
      setErrorBusqueda(null);
      return;
    }
    try {
      const p = await api.pedido(id);
      setErrorBusqueda(null);
      setZona('full');
      setVista((v) => centrarEn(v, p.x, p.y));
      onAbrir({ tipo: 'pedido', id: p.id });
    } catch {
      setErrorBusqueda(`No se encontró ningún pedido con ID "${id}".`);
    }
  };

  const alClicTramo = useCallback(async (x1: number, y1: number, x2: number, y2: number) => {
    if (!enCurso) {
      onAviso('Inicie una corrida para bloquear calles desde el mapa.', 'error');
      return;
    }
    try {
      const r = await api.alternarBloqueo(x1, y1, x2, y2);
      onAviso(r.mensaje, 'ok');
      refrescar();
    } catch (e) {
      onAviso(e instanceof Error ? e.message : 'No se pudo bloquear el tramo', 'error');
    }
  }, [enCurso, onAviso, refrescar]);

  const alClicCruce = useCallback((x: number, y: number, clientX: number, clientY: number) => {
    setMenu({ x, y, cx: clientX, cy: clientY });
    setCantidadMenu(1);
  }, []);

  const registrarDesdeMapa = async (tipo: string) => {
    if (!menu) return;
    const { x, y } = menu;
    setMenu(null);
    try {
      const p = await api.registrarPedido({ x, y, cantidad: Math.max(1, cantidadMenu), tipoEntrega: tipo, canal: 'MAPA' });
      onAviso(`Pedido ${p.id} registrado en (${x}, ${y}); se asigna automáticamente a la unidad disponible.`, 'ok');
      refrescar();
    } catch (e) {
      onAviso(e instanceof Error ? e.message : 'No se pudo registrar el pedido', 'error');
    }
  };

  const onHover = useCallback((s: Seleccion | null, x: number, y: number) => tooltip.current?.mostrar(s, x, y), []);

  const semCumplimiento = semaforo(k.cumplimiento, 95, 85);
  return (
    <section>
      <h2>Panorama operativo</h2>
      <p className="note">
        Vista principal en vivo de la corrida. El reloj de la simulación nunca es manipulable directamente por el usuario. Haz clic
        sobre cualquier tramo de calle del mapa para insertar (o quitar) un bloqueo manual y ver cómo el sistema recalcula las rutas
        afectadas; los tramos ya bloqueados por los datos reales del curso no se pueden alterar desde aquí. Pasa el mouse sobre un
        vehículo, un punto de entrega o un almacén para ver su resumen; haz clic sobre él para abrir su detalle completo. Rueda del
        mouse: zoom; arrastrar: desplazar.
      </p>
      <p className="hint" style={{ marginBottom: 12 }}>
        {diaADia
          ? 'En este escenario también puedes hacer clic cerca de un cruce del mapa para insertar un pedido nuevo a mano (eliges el tipo de entrega y se asigna automáticamente a la unidad disponible).'
          : 'La inserción manual de pedidos solo está disponible en el escenario «Operación día a día» — cámbialo en Parámetros (pantalla 1) para probarla.'}
      </p>
      {estado.mensaje && <div className="banner banner-error">{estado.mensaje}</div>}
      {estado.colapso && (
        <div className="banner banner-error">
          <b>Colapso logístico detectado</b> el {estado.colapso.fecha}: {estado.colapso.motivo}. Cumplimiento en ese momento: {numero(estado.colapso.cumplimiento, 1)} %.
        </div>
      )}

      {metricas && (
        <div className="kpi-strip">
          <Kpi etiqueta="Cumplimiento a tiempo" valor={`${numero(k.cumplimiento, 1)} %`} sub={`${numero(k.registrados - k.incumplidos)} de ${numero(k.registrados)} pedidos no vencidos`} sem={k.registrados ? semCumplimiento : null} />
          <Kpi etiqueta="Pedidos" valor={`${numero(k.entregados)} entregados`} sub={`${numero(k.enCurso)} en ruta · ${numero(k.pendientes)} por despachar`} />
          <Kpi etiqueta="Costo acumulado" valor={soles(k.costo)} sub={`${numero(k.km)} km recorridos según tipo de vehículo`} />
          <Kpi etiqueta="Flota activa" valor={`${k.flotaActiva} / ${k.flotaTotal}`} sub="vehículos operativos (sin avería ni mantenimiento)" />
          <Kpi etiqueta="Almacén central" valor="Sin límite" sub="Abastecimiento permanente (sin capacidad máxima)" />
          {intermedios.map((a) => {
            const pct = a.capacidad ? (100 * (a.stock ?? 0)) / a.capacidad : 0;
            return (
              <Kpi key={a.id} etiqueta={`Stock ${a.nombre}`} valor={`${numero(a.stock ?? 0)} / ${numero(a.capacidad ?? 0)}`}
                sub="recarga diaria 23:59:59" sem={semaforo(pct, estado.umbralVerde, estado.umbralAmbar)} />
            );
          })}
          <Kpi etiqueta="Re-ruteos totales" valor={String(k.reRuteosBloqueo + k.reRuteosAveria)}
            sub={`bloqueo: ${k.reRuteosBloqueo} · avería: ${k.reRuteosAveria} · reasignaciones: ${k.reasignaciones}`} />
        </div>
      )}

      <div className="card map-card">
        <div className="map-toolbar">
          <div className="zone-select">
            <label>
              Zona visible del mapa <span className="hint">(vista local a este dispositivo, no se sincroniza)</span>
              <select value={zona} onChange={(e) => setZona(e.target.value)}>
                <option value="full">Vista completa</option>
                <option value="noroeste">Cuadrante noroeste</option>
                <option value="noreste">Cuadrante noreste</option>
                <option value="suroeste">Cuadrante suroeste</option>
                <option value="sureste">Cuadrante sureste</option>
              </select>
            </label>
          </div>
          <div className="track-pedido">
            <label>
              Buscar pedido por ID
              <div className="track-row">
                <input value={busqueda} placeholder="ej. PV2609-0001" onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscar(); } }} />
                <button className="btn btn-ghost" type="button" onClick={buscar}>Buscar</button>
              </div>
            </label>
            {errorBusqueda && <span className="error-texto">{errorBusqueda}</span>}
          </div>
          <div className="zoom-controls">
            <button title="Alejar" onClick={() => setVista((v) => acercar(v, 1 / 1.25))}>−</button>
            <button title="Restablecer zoom" onClick={() => setVista(vistaDeZona(zona))}>100%</button>
            <button title="Acercar" onClick={() => setVista((v) => acercar(v, 1.25))}>+</button>
            <button className="btn-toggle" onClick={() => setLeyenda((x) => !x)}>{leyenda ? 'Ocultar leyenda' : 'Mostrar leyenda'}</button>
            <button className="btn-toggle" onClick={() => setMetricas((x) => !x)}>{metricas ? 'Ocultar métricas' : 'Mostrar métricas'}</button>
            <button className="btn-toggle" onClick={() => setVerFiltros((x) => !x)}>Filtros{verFiltros ? ' ▴' : ' ▾'}</button>
            {verFiltros && (
              <div className="filtros-panel" onClick={(e) => e.stopPropagation()}>
                <label><input type="checkbox" checked={filtros.soloCriticos} onChange={(e) => setFiltros({ ...filtros, soloCriticos: e.target.checked })} />Solo pedidos en riesgo o críticos</label>
                <label><input type="checkbox" checked={filtros.mostrarPedidos} onChange={(e) => setFiltros({ ...filtros, mostrarPedidos: e.target.checked })} />Mostrar pedidos</label>
                <label><input type="checkbox" checked={filtros.mostrarBloqueos} onChange={(e) => setFiltros({ ...filtros, mostrarBloqueos: e.target.checked })} />Mostrar calles bloqueadas</label>
                <label><input type="checkbox" checked={filtros.unidadesEnAlmacen} onChange={(e) => setFiltros({ ...filtros, unidadesEnAlmacen: e.target.checked })} />Mostrar unidades en almacén</label>
                <div className="subtitulo" style={{ marginTop: 4 }}>Tipos de vehículo</div>
                {(['AUTO', 'MOTO', 'BICICLETA'] as const).map((t) => (
                  <label key={t}><input type="checkbox" checked={filtros.tipos[t]} onChange={(e) => setFiltros({ ...filtros, tipos: { ...filtros.tipos, [t]: e.target.checked } })} />
                    {t === 'AUTO' ? 'Autos' : t === 'MOTO' ? 'Motos' : 'Bicicletas'}</label>
                ))}
                <label>Rutas
                  <select value={filtros.rutas} onChange={(e) => setFiltros({ ...filtros, rutas: e.target.value as Filtros['rutas'] })}>
                    <option value="todas">Todas (tenues) y la seleccionada resaltada</option>
                    <option value="seleccionada">Solo la del vehículo seleccionado</option>
                    <option value="ninguna">Ninguna</option>
                  </select>
                </label>
              </div>
            )}
          </div>
        </div>

        <MapaOperacion
          estado={estado}
          minutoAhora={minutoAhora}
          vista={vista}
          onVista={setVista}
          filtros={filtros}
          seleccion={seleccion}
          onAbrir={onAbrir}
          onHover={onHover}
          onClicTramo={alClicTramo}
          onClicCruce={diaADia && enCurso ? alClicCruce : null}
        />

        {leyenda && (
          <div className="legend">
            <div className="legend-item"><IconoMini tipo="pedido" color="#2e7d46" />Paquete = pedido a tiempo</div>
            <div className="legend-item"><IconoMini tipo="pedido" color="#c98a10" />Paquete = pedido en riesgo</div>
            <div className="legend-item"><IconoMini tipo="pedido" color="#c0392b" />Paquete = pedido vencido / crítico</div>
            <div className="legend-item"><IconoMini tipo="vehiculo" color="#0f3d5c" forma="AUTO" /><IconoMini tipo="vehiculo" color="#0f3d5c" forma="MOTO" /><IconoMini tipo="vehiculo" color="#0f3d5c" forma="BICICLETA" />Auto / moto / bicicleta (color = pedido más urgente a bordo)</div>
            <div className="legend-item"><IconoMini tipo="vehiculo" color="#8695a3" forma="AUTO" />Vehículo averiado</div>
            <div className="legend-item"><IconoMini tipo="almacen" color={central ? '#0f3d5c' : '#0f3d5c'} />Edificio = almacén (color = semáforo de su stock; el central no aplica)</div>
            <div className="legend-item"><span className="legend-line" style={{ borderColor: '#c0392b', borderTopWidth: 5 }} />Calle bloqueada (dato real del curso)</div>
            <div className="legend-item"><span className="legend-line dashed" style={{ borderColor: '#a15b16', borderTopWidth: 5 }} />Calle bloqueada manualmente (clic en el mapa)</div>
            <div className="legend-item"><span className="legend-line dashed" style={{ borderColor: '#0f3d5c' }} />Ruta asignada (más tenue = vehículo no seleccionado)</div>
            <div className="legend-item"><span className="hint">Retícula de 70 × 50 km; cada línea es una calle (1 km). Hora simulada: {fechaHoraCorta(estado.inicioMs + minutoAhora() * 60000)}.</span></div>
          </div>
        )}
      </div>

      <Tooltip ref={tooltip} estado={estado} minuto={minutoAhora} />

      {menu && (
        <div className="menu-pedido" style={{ left: menu.cx, top: menu.cy }} onClick={(e) => e.stopPropagation()}>
          <div className="cantidad">
            Nuevo pedido en ({menu.x}, {menu.y}) · paquetes
            <input type="number" min={1} max={200} value={cantidadMenu} onChange={(e) => setCantidadMenu(Number(e.target.value))} />
          </div>
          {TIPOS_RAPIDOS.map(([id, etiqueta]) => (
            <button key={id} className="opcion" onClick={() => registrarDesdeMapa(id)}>{etiqueta}</button>
          ))}
          <button className="opcion" style={{ color: '#8695a3' }} onClick={() => setMenu(null)}>Cancelar</button>
        </div>
      )}
    </section>
  );
}
