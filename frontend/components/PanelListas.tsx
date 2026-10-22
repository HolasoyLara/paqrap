'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { EstadoVisual, VehiculoVisual } from '@/lib/tipos';
import {
  BORDE_VACIO, claseOcupacion, COLOR_AVERIA, COLOR_OCUPACION, ETIQUETA_OCUPACION, ETIQUETA_SEMAFORO, fechaHoraCorta, numero,
  semaforo, type SemaforoOcupacion,
} from '@/lib/formato';
import { posicionEnTrayectoria } from '@/lib/useEstadoSimulacion';
import {
  almacenPasaFiltro, type Filtros, ocupacionAlmacen, ocupacionVehiculo, type Seleccion, vehiculoPasaFiltro,
} from './MapaOperacion';
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

/** Lista de almacenes (E18-E22, F05-F06). */
function ListaAlmacenes({ estado, minutoAhora, seleccion, onAbrir, enfocar, filtros, setFiltros }: Props) {
  const [horas, setHoras] = useState(4);
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const filaSel = useRef<HTMLTableRowElement>(null);
  const ahora = minutoAhora();
  const { umbralVerde: verde, umbralAmbar: ambar } = estado;
  const idSel = seleccion?.tipo === 'almacen' ? seleccion.id : null;
  const hora = (m: number) => fechaHoraCorta(estado.inicioMs + m * 60000);

  useEffect(() => {
    filaSel.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [idSel]);

  const filas = estado.almacenes.filter((a) => almacenPasaFiltro(a, filtros, verde, ambar));
  return (
    <>
      <FiltroSemaforo titulo="Ocupación" valor={filtros.semaforoAlmacen} onCambio={(v) => setFiltros({ ...filtros, semaforoAlmacen: v })} />
      <div className="busqueda-tiempo">
        <span className="hint">Ventana de tiempo:</span>
        <select value={horas} onChange={(e) => setHoras(Number(e.target.value))}>
          {[1, 2, 4, 8].map((h) => <option key={h} value={h}>{h} h</option>)}
        </select>
      </div>
      <p className="hint" style={{ margin: '4px 0 6px' }}>Clic en una fila para ubicar el almacén en el mapa y ver su detalle.</p>
      <div className="tabla-panel">
        <table className="daily-table tabla-compacta">
          <thead>
            <tr>
              <th>Almacén</th><th>Ocupación</th><th className="num">En tránsito</th>
              <th className="num">Por salir (próx. {horas} h)</th><th className="num">Entregados (últ. {horas} h)</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((a) => {
              const o = ocupacionAlmacen(a, verde, ambar);
              const porSalir = a.porSalir.filter((p) => p.minuto >= ahora && p.minuto <= ahora + horas * 60);
              const entregados = a.entregados.filter((p) => p.minuto >= ahora - horas * 60 && p.minuto <= ahora);
              const sel = a.id === idSel;
              const abierto = abiertos.has(a.id);
              return (
                <Fragment key={a.id}>
                  <tr ref={sel ? filaSel : undefined} className={'fila-click' + (sel ? ' fila-sel' : '')}
                    onClick={() => { enfocar(a.x, a.y); onAbrir({ tipo: 'almacen', id: a.id }); }}>
                    <td>
                      <span className="celda-ut">
                        <IconoMini tipo="almacen" color={o ? COLOR_OCUPACION[o.sem] : '#0f3d5c'} borde={o?.sem === 'vacio' ? BORDE_VACIO : undefined} />
                        <b>{a.nombre}</b>
                        {(porSalir.length > 0 || entregados.length > 0) && (
                          <button className="btn-desplegar" title="Ver pedidos" onClick={(e) => {
                            e.stopPropagation();
                            setAbiertos((s) => { const n = new Set(s); if (n.has(a.id)) n.delete(a.id); else n.add(a.id); return n; });
                          }}>{abierto ? '▾' : '▸'}</button>
                        )}
                      </span>
                    </td>
                    <td className="num-tab">
                      {o == null ? <>Sin límite<div className="hint">almacén central</div></> : (
                        <>{numero(a.stock ?? 0)}/{numero(a.capacidad ?? 0)} ({Math.round(o.pct)} %)<br />
                          <span className={claseOcupacion(o.sem)}>{ETIQUETA_OCUPACION[o.sem]}</span></>
                      )}
                    </td>
                    <td className="num">{a.pedidosEnTransito}</td>
                    <td className="num">{porSalir.length}</td>
                    <td className="num">{entregados.length}</td>
                  </tr>
                  {abierto && (
                    <tr className="fila-detalle">
                      <td colSpan={5}>
                        {porSalir.length > 0 && <div><span className="hint">Por salir: </span>
                          {porSalir.map((p, i) => (
                            <button key={'s' + i} className="chip-pedido" onClick={() => onAbrir({ tipo: 'pedido', id: p.pedido })}>{p.pedido} · sale {hora(p.minuto)}</button>
                          ))}</div>}
                        {entregados.length > 0 && <div><span className="hint">Entregados: </span>
                          {entregados.map((p, i) => (
                            <span key={'e' + i} className="chip-pedido">{p.pedido} · {hora(p.minuto)}</span>
                          ))}</div>}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!filas.length && <tr><td colSpan={5} className="empty-hint">Ningún almacén cumple los filtros.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Lista de envios (E31, F09): una fila por pedido activo que se expande en una fila por parte. */
function ListaEnvios({ estado, minutoAhora, seleccion, onAbrir, enfocar }: Props) {
  const [texto, setTexto] = useState('');
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const filaSel = useRef<HTMLTableRowElement>(null);
  const ahora = minutoAhora();
  const idSel = seleccion?.tipo === 'pedido' ? seleccion.id : null;
  const hora = (m: number | null) => (m == null ? '—' : fechaHoraCorta(estado.inicioMs + m * 60000));

  useEffect(() => {
    if (idSel) setAbiertos((s) => (s.has(idSel) ? s : new Set(s).add(idSel)));
    filaSel.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [idSel]);

  const q = texto.trim().toLowerCase();
  const filas = estado.pedidos
    .filter((p) => !q || p.id.toLowerCase().includes(q) || p.cliente.toLowerCase().includes(q) || p.vehiculos.toLowerCase().includes(q))
    .sort((a, b) => a.limiteMin - b.limiteMin);
  const visibles = filas.slice(0, 300);

  /** F09: enfoca la unidad que lleva el pedido o, si aun no sale, su destino. */
  const enfocarPedido = (id: string, x: number, y: number, vehiculo: string | null) => {
    const v = vehiculo ? estado.vehiculos.find((u) => u.id === vehiculo) : null;
    if (v) {
      const [vx, vy] = posicionActual(v, minutoAhora());
      enfocar(vx, vy);
    } else {
      enfocar(x, y);
    }
    onAbrir({ tipo: 'pedido', id });
  };

  return (
    <>
      <div className="busqueda-tiempo">
        <input style={{ width: 220 }} placeholder="Buscar por pedido, cliente o unidad" value={texto} onChange={(e) => setTexto(e.target.value)} />
      </div>
      <p className="hint" style={{ margin: '4px 0 6px' }}>
        {filas.length} pedidos activos{filas.length > visibles.length ? ` (se muestran ${visibles.length}; use la búsqueda)` : ''} · ordenados por hora límite
      </p>
      <div className="tabla-panel">
        <table className="daily-table tabla-compacta">
          <thead>
            <tr><th>Pedido</th><th>Destino</th><th className="num">Paq.</th><th>Estado</th><th>Unidad</th></tr>
          </thead>
          <tbody>
            {visibles.map((p) => {
              const h = ((p.limiteMin - ahora) / (p.plazo * 60)) * 100;
              const sem = semaforo(h, estado.umbralVerde, estado.umbralAmbar);
              const sel = p.id === idSel;
              const abierto = abiertos.has(p.id);
              const primera = p.partes.find((x) => x.vehiculo)?.vehiculo ?? null;
              return (
                <Fragment key={p.id}>
                  <tr ref={sel ? filaSel : undefined} className={'fila-click' + (sel ? ' fila-sel' : '')}
                    onClick={() => enfocarPedido(p.id, p.x, p.y, primera)}>
                    <td>
                      <span className="celda-ut">
                        <button className="btn-desplegar" title="Ver partes y rutas" onClick={(e) => {
                          e.stopPropagation();
                          setAbiertos((s) => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; });
                        }}>{abierto ? '▾' : '▸'} {p.partes.length}</button>
                        <b>{p.id}</b>
                      </span>
                    </td>
                    <td className="num-tab">({p.x}, {p.y})</td>
                    <td className="num">{p.cantidad}</td>
                    <td>
                      <span className={'semaforo-pill semaforo-' + (p.reprogramado ? 'rojo' : sem)}>{p.reprogramado ? 'Reprogramado' : ETIQUETA_SEMAFORO[sem]}</span>
                      <div className="hint">{p.estado}</div>
                    </td>
                    <td>{p.vehiculos || <span className="hint">Pendiente</span>}</td>
                  </tr>
                  {abierto && p.partes.map((x) => (
                    <tr key={x.id} className="fila-detalle fila-click" onClick={() => enfocarPedido(p.id, p.x, p.y, x.vehiculo)}>
                      <td colSpan={5}>
                        <b>{x.id}</b> · {x.cantidad} paq. · {x.vehiculo
                          ? <>unidad <b>{x.vehiculo}</b> · ruta {x.ruta}: {x.almacen} → ({p.x}, {p.y}) · sale {hora(x.salidaMin)} · llega {hora(x.llegadaMin)} · {x.estado.toLowerCase()}</>
                          : <span className="hint">sin unidad asignada ({x.estado.toLowerCase()})</span>}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
            {!visibles.length && <tr><td colSpan={5} className="empty-hint">No hay pedidos activos que mostrar.</td></tr>}
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
        {pestana === 'almacenes' && <ListaAlmacenes {...props} />}
        {pestana === 'envios' && <ListaEnvios {...props} />}
      </div>
    </aside>
  );
}
