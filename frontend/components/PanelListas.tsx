'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { EstadoVisual, VehiculoVisual } from '@/lib/tipos';
import {
  BORDE_VACIO, claseOcupacion, COLOR_AVERIA, COLOR_OCUPACION, ETIQUETA_OCUPACION, numero, type SemaforoOcupacion,
} from '@/lib/formato';
import { posicionEnTrayectoria } from '@/lib/useEstadoSimulacion';
import { type Filtros, ocupacionVehiculo, type Seleccion, vehiculoPasaFiltro } from './MapaOperacion';
import { IconoMini } from './Iconos';

export type PestanaPanel = 'transporte' | 'almacenes' | 'envios';

interface Props {
  estado: EstadoVisual;
  minutoAhora: () => number;
  seleccion: Seleccion | null;
  onAbrir: (s: Seleccion) => void;
  enfocar: (x: number, y: number) => void;
  filtros: Filtros;
  setFiltros: (f: Filtros) => void;
  pestana: PestanaPanel;
  setPestana: (p: PestanaPanel) => void;
  onCerrar: () => void;
}

const COLORES: SemaforoOcupacion[] = ['vacio', 'verde', 'ambar', 'rojo'];

/** Casillas de los 4 colores de ocupacion (F15-F16); el mismo estado filtra la lista y el mapa. */
export function FiltroSemaforo({ valor, onCambio, titulo }: {
  valor: Record<SemaforoOcupacion, boolean>; onCambio: (v: Record<SemaforoOcupacion, boolean>) => void; titulo: string;
}) {
  return (
    <div className="filtro-semaforo">
      <span className="hint">{titulo}:</span>
      {COLORES.map((c) => (
        <label key={c} className="filtro-color" title={ETIQUETA_OCUPACION[c]}>
          <input type="checkbox" checked={valor[c]} onChange={(e) => onCambio({ ...valor, [c]: e.target.checked })} />
          <span className="punto-color" style={{ background: COLOR_OCUPACION[c], borderColor: c === 'vacio' ? BORDE_VACIO : COLOR_OCUPACION[c] }} />
          {ETIQUETA_OCUPACION[c]}
        </label>
      ))}
    </div>
  );
}

type ClaveOrden = 'id' | 'ocupacion' | 'salida' | 'llegada';

/** Encabezado que ordena al pulsarlo (ascendente / descendente). */
function Th({ clave, orden, setOrden, children, num }: {
  clave: ClaveOrden; orden: { clave: ClaveOrden; asc: boolean }; setOrden: (o: { clave: ClaveOrden; asc: boolean }) => void;
  children: React.ReactNode; num?: boolean;
}) {
  const activo = orden.clave === clave;
  return (
    <th className={'th-orden' + (num ? ' num' : '') + (activo ? ' activo' : '')}
      onClick={() => setOrden({ clave, asc: activo ? !orden.asc : true })}
      title="Ordenar (pulse de nuevo para invertir)">
      {children} {activo ? (orden.asc ? '▲' : '▼') : '↕'}
    </th>
  );
}

const minTexto = (m: number | null) => (m == null ? '—' : `${numero(Math.max(0, Math.round(m)))} min`);

/** Posicion actual (interpolada) de una unidad. */
export function posicionActual(v: VehiculoVisual, minuto: number): [number, number] {
  return (v.tray.length ? posicionEnTrayectoria(v.tray, minuto) : null) ?? [v.x, v.y];
}

function ListaTransporte({ estado, minutoAhora, seleccion, onAbrir, enfocar, filtros, setFiltros }: Props) {
  const [orden, setOrden] = useState<{ clave: ClaveOrden; asc: boolean }>({ clave: 'id', asc: true });
  const [busqueda, setBusqueda] = useState<{ modo: 'llega' | 'salio'; n: string }>({ modo: 'llega', n: '' });
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const filaSel = useRef<HTMLTableRowElement>(null);
  const ahora = minutoAhora();
  const { umbralVerde: verde, umbralAmbar: ambar } = estado;
  const idSel = seleccion?.tipo === 'vehiculo' ? seleccion.id : null;

  const filas = useMemo(() => {
    const limite = busqueda.n.trim() === '' ? null : Number(busqueda.n);
    const lista = estado.vehiculos
      .filter((v) => vehiculoPasaFiltro(v, filtros, verde, ambar))
      .map((v) => {
        const o = ocupacionVehiculo(v, verde, ambar);
        const llegaEn = v.llegadaProximaMin != null ? v.llegadaProximaMin - ahora : null;
        const salioHace = v.salidaMin != null ? ahora - v.salidaMin : null;
        return { v, o, llegaEn, salioHace };
      })
      .filter((f) => {
        if (limite == null || Number.isNaN(limite)) return true;
        const val = busqueda.modo === 'llega' ? f.llegaEn : f.salioHace;
        return val != null && val <= limite;
      });
    const valor = (f: (typeof lista)[number]): number | string | null => {
      switch (orden.clave) {
        case 'ocupacion': return f.o.pct;
        case 'salida': return f.v.salidaMin;
        case 'llegada': return f.v.llegadaProximaMin;
        default: return f.v.id;
      }
    };
    return lista.sort((a, b) => {
      const va = valor(a);
      const vb = valor(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1; // sin dato, siempre al final
      if (vb == null) return -1;
      const c = typeof va === 'string' ? va.localeCompare(String(vb)) : va - (vb as number);
      return orden.asc ? c : -c;
    });
  }, [estado.vehiculos, filtros, verde, ambar, ahora, busqueda, orden]);

  // F08: al seleccionar la unidad en el mapa, su fila se resalta y se desplaza a la vista
  useEffect(() => {
    filaSel.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [idSel]);

  const alternar = (id: string) => setAbiertos((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  return (
    <>
      <FiltroSemaforo titulo="Ocupación" valor={filtros.semaforoUT} onCambio={(v) => setFiltros({ ...filtros, semaforoUT: v })} />
      <div className="busqueda-tiempo">
        <select value={busqueda.modo} onChange={(e) => setBusqueda({ ...busqueda, modo: e.target.value as 'llega' | 'salio' })}>
          <option value="llega">Llega a destino en ≤</option>
          <option value="salio">Salió del origen hace ≤</option>
        </select>
        <input type="number" min={0} placeholder="N" value={busqueda.n} onChange={(e) => setBusqueda({ ...busqueda, n: e.target.value })} />
        <span className="hint">min</span>
        {busqueda.n && <button className="btn btn-sm btn-ghost" onClick={() => setBusqueda({ ...busqueda, n: '' })}>Limpiar</button>}
      </div>
      <p className="hint" style={{ margin: '4px 0 6px' }}>{filas.length} de {estado.vehiculos.length} unidades · clic en una fila para ubicarla en el mapa</p>
      <div className="tabla-panel">
        <table className="daily-table tabla-compacta">
          <thead>
            <tr>
              <Th clave="id" orden={orden} setOrden={setOrden}>Unidad</Th>
              <Th clave="ocupacion" orden={orden} setOrden={setOrden}>Ocupación</Th>
              <th>Estado</th>
              <Th clave="llegada" orden={orden} setOrden={setOrden} num>Llega a destino en</Th>
              <Th clave="salida" orden={orden} setOrden={setOrden} num>Salió del origen hace</Th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ v, o, llegaEn, salioHace }) => {
              const sel = v.id === idSel;
              const abierto = abiertos.has(v.id);
              return (
                <Fragment key={v.id}>
                  <tr className={'fila-click' + (sel ? ' fila-sel' : '')} onClick={() => {
                    const [x, y] = posicionActual(v, minutoAhora());
                    enfocar(x, y);
                    onAbrir({ tipo: 'vehiculo', id: v.id });
                  }} ref={sel ? filaSel : undefined}>
                    <td>
                      <span className="celda-ut">
                        <IconoMini tipo="vehiculo" forma={v.tipo} color={COLOR_OCUPACION[o.sem]} borde={o.sem === 'vacio' ? BORDE_VACIO : undefined} />
                        <b>{v.id}</b>
                        {v.pedidosCarga.length > 0 && (
                          <button className="btn-desplegar" title="Ver pedidos a bordo" onClick={(e) => { e.stopPropagation(); alternar(v.id); }}>
                            {abierto ? '▾' : '▸'} {v.pedidosCarga.length}
                          </button>
                        )}
                      </span>
                    </td>
                    <td className="num-tab">
                      {v.carga}/{v.capacidad} ({Math.round(o.pct)} %)<br />
                      <span className={claseOcupacion(o.sem)}>{ETIQUETA_OCUPACION[o.sem]}</span>
                    </td>
                    <td>
                      {v.estadoEtiqueta}
                      {v.tipoAveria != null && <span className="chip-averia" style={{ background: COLOR_AVERIA[v.tipoAveria] }}>Tipo {v.tipoAveria}</span>}
                      {v.destino && <div className="hint">{v.destino}</div>}
                    </td>
                    <td className="num">{minTexto(llegaEn)}</td>
                    <td className="num">{minTexto(salioHace)}</td>
                  </tr>
                  {abierto && (
                    <tr className="fila-detalle">
                      <td colSpan={5}>
                        {v.pedidosCarga.map((p) => (
                          <button key={p.id} className="chip-pedido" onClick={() => onAbrir({ tipo: 'pedido', id: p.id })}>
                            {p.id} · {p.cantidad} paq.
                          </button>
                        ))}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!filas.length && <tr><td colSpan={5} className="empty-hint">Ninguna unidad cumple los filtros.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/**
 * Panel izquierdo plegable de Panorama (E01): listas de Transporte, Almacenes y Envios, vinculadas con el mapa en
 * ambos sentidos (F05-F09) y con los filtros de semaforo compartidos (F15-F16).
 */
export default function PanelListas(props: Props) {
  const { pestana, setPestana, onCerrar } = props;
  return (
    <aside className="panel-listas" onPointerDown={(e) => e.stopPropagation()} aria-label="Listas de la operación">
      <div className="panel-listas-cab">
        <nav className="panel-tabs">
          {([['transporte', 'Transporte'], ['almacenes', 'Almacenes'], ['envios', 'Envíos']] as const).map(([id, t]) => (
            <button key={id} className={'panel-tab' + (pestana === id ? ' activo' : '')} onClick={() => setPestana(id)}>{t}</button>
          ))}
        </nav>
        <button className="modal-close" type="button" aria-label="Recoger panel" onClick={onCerrar}>×</button>
      </div>
      <div className="panel-listas-cuerpo">
        {pestana === 'transporte' && <ListaTransporte {...props} />}
        {pestana === 'almacenes' && <p className="empty-hint">Lista de almacenes: pendiente (fase 4).</p>}
        {pestana === 'envios' && <p className="empty-hint">Lista de envíos: pendiente (fase 4).</p>}
      </div>
    </aside>
  );
}
