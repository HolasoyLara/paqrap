'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EstadoVisual, VehiculoVisual } from '@/lib/tipos';
import { COLOR_SEMAFORO, semaforo } from '@/lib/formato';
import { posicionEnTrayectoria } from '@/lib/useEstadoSimulacion';
import { GlifoAlmacen, GlifoPaquete, GlifoVehiculo } from './Iconos';

// Reticula oficial de la ciudad: 70 x 50 km, origen (0,0) en la esquina inferior izquierda (P4).
export const ANCHO_KM = 70;
export const ALTO_KM = 50;
const MARGEN = 2;
const VB_W = ANCHO_KM + 2 * MARGEN;
const VB_H = ALTO_KM + 2 * MARGEN;
const NAVY = '#0f3d5c';
const GRIS = '#8695a3';

/** Vista del mapa en coordenadas del SVG (y invertida): centro y ancho visible en km. */
export interface Vista {
  cx: number;
  cy: number;
  ancho: number;
}

export const VISTA_COMPLETA: Vista = { cx: ANCHO_KM / 2, cy: ALTO_KM / 2, ancho: VB_W };

export function vistaDeZona(zona: string): Vista {
  const w = VB_W * 0.58;
  const h = VB_H * 0.58;
  switch (zona) {
    case 'noroeste':
      return { cx: -MARGEN + w / 2, cy: -MARGEN + h / 2, ancho: w };
    case 'noreste':
      return { cx: ANCHO_KM + MARGEN - w / 2, cy: -MARGEN + h / 2, ancho: w };
    case 'suroeste':
      return { cx: -MARGEN + w / 2, cy: ALTO_KM + MARGEN - h / 2, ancho: w };
    case 'sureste':
      return { cx: ANCHO_KM + MARGEN - w / 2, cy: ALTO_KM + MARGEN - h / 2, ancho: w };
    default:
      return VISTA_COMPLETA;
  }
}

export interface Seleccion {
  tipo: 'vehiculo' | 'pedido' | 'almacen';
  id: string;
}

export interface Filtros {
  soloCriticos: boolean;
  mostrarPedidos: boolean;
  mostrarBloqueos: boolean;
  rutas: 'todas' | 'seleccionada' | 'ninguna';
  tipos: Record<string, boolean>;
  unidadesEnAlmacen: boolean;
}

export const FILTROS_POR_DEFECTO: Filtros = {
  soloCriticos: false,
  mostrarPedidos: true,
  mostrarBloqueos: true,
  rutas: 'todas',
  tipos: { AUTO: true, MOTO: true, BICICLETA: true },
  unidadesEnAlmacen: false,
};

interface Props {
  estado: EstadoVisual;
  minutoAhora: () => number;
  vista: Vista;
  onVista: (v: Vista) => void;
  filtros: Filtros;
  seleccion: Seleccion | null;
  onAbrir: (s: Seleccion) => void;
  onHover: (s: Seleccion | null, clientX: number, clientY: number) => void;
  onClicTramo: (x1: number, y1: number, x2: number, y2: number) => void;
  onClicCruce: ((x: number, y: number, clientX: number, clientY: number) => void) | null;
}

const EN_BASE = new Set(['EN_ALMACEN', 'MANTENIMIENTO', 'EN_TALLER']);

function colorVehiculo(v: VehiculoVisual, verde: number, ambar: number): string {
  if (v.estado === 'AVERIADA' || v.estado === 'EN_TALLER') return GRIS;
  if (v.holguraMinima == null) return NAVY;
  return COLOR_SEMAFORO[semaforo(v.holguraMinima, verde, ambar)];
}

const sy = (y: number) => ALTO_KM - y;

/** Reticula de calles (1 km) con ejes cada 10 km; solo se vuelve a dibujar al cambiar el zoom. */
const Reticula = memo(function Reticula({ escala }: { escala: number }) {
  const lineas: React.ReactNode[] = [];
  for (let x = 0; x <= ANCHO_KM; x++) {
    const mayor = x % 10 === 0;
    lineas.push(
      <line key={`v${x}`} x1={x} y1={0} x2={x} y2={ALTO_KM} stroke={mayor ? '#c3cfda' : '#e4eaf0'}
        strokeWidth={mayor ? 1.3 : 1} vectorEffect="non-scaling-stroke" />,
    );
  }
  for (let y = 0; y <= ALTO_KM; y++) {
    const mayor = y % 10 === 0;
    lineas.push(
      <line key={`h${y}`} x1={0} y1={sy(y)} x2={ANCHO_KM} y2={sy(y)} stroke={mayor ? '#c3cfda' : '#e4eaf0'}
        strokeWidth={mayor ? 1.3 : 1} vectorEffect="non-scaling-stroke" />,
    );
  }
  const fs = 10 * escala;
  for (let x = 0; x <= ANCHO_KM; x += 10) {
    lineas.push(<text key={`tx${x}`} x={x} y={ALTO_KM + 1.4 * (fs / 1)} fontSize={fs} textAnchor="middle" fill="#8695a3">{x}</text>);
  }
  for (let y = 10; y <= ALTO_KM; y += 10) {
    lineas.push(<text key={`ty${y}`} x={-0.6} y={sy(y) + fs * 0.35} fontSize={fs} textAnchor="end" fill="#8695a3">{y}</text>);
  }
  return <g>{lineas}</g>;
});

function puntosTray(tray: number[], desde: [number, number] | null): string {
  const pts: string[] = [];
  if (desde) pts.push(`${desde[0]},${sy(desde[1])}`);
  for (let i = 0; i < tray.length; i += 3) pts.push(`${tray[i]},${sy(tray[i + 1])}`);
  return pts.join(' ');
}

export default function MapaOperacion(props: Props) {
  const { estado, minutoAhora, vista, onVista, filtros, seleccion } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lineaHoverRef = useRef<SVGLineElement>(null);
  const vehiculosRef = useRef(new Map<string, SVGGElement>());
  const [tam, setTam] = useState({ w: 1000, h: 700 });
  const [arrastrando, setArrastrando] = useState(false);
  const arrastre = useRef<{ x: number; y: number; vista: Vista; movido: boolean } | null>(null);

  // el SVG llena todo el contenedor (pantalla completa): se mide su tamano real y el viewBox toma su proporcion
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entradas) => {
      const r = entradas[0]?.contentRect;
      if (r && r.width && r.height) setTam({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // la vista garantiza que se vea al menos la region pedida; si el contenedor es mas ancho o mas alto, muestra mas ciudad
  const altoVista = (vista.ancho * VB_H) / VB_W;
  const proporcion = tam.w / Math.max(1, tam.h);
  const anchoVis = proporcion > VB_W / VB_H ? altoVista * proporcion : vista.ancho;
  const altoVis = anchoVis / proporcion;
  const viewBox = `${vista.cx - anchoVis / 2} ${vista.cy - altoVis / 2} ${anchoVis} ${altoVis}`;
  const escala = anchoVis / Math.max(240, tam.w); // km por pixel
  const escalaRef = useRef(escala);
  escalaRef.current = escala;
  const verde = estado.umbralVerde;
  const ambar = estado.umbralAmbar;
  const minuto = minutoAhora();

  // ---------------- animacion de las unidades ----------------
  const vehiculosVisibles = useMemo(
    () =>
      estado.vehiculos.filter((v) => {
        if (!filtros.tipos[v.tipo]) return false;
        if (EN_BASE.has(v.estado) && v.tray.length === 0) return filtros.unidadesEnAlmacen;
        return true;
      }),
    [estado.vehiculos, filtros],
  );

  const posicionBase = useMemo(() => {
    // unidades en un almacen (si se muestran): en anillos alrededor del almacen
    const m = new Map<string, [number, number]>();
    const porBase = new Map<string, VehiculoVisual[]>();
    for (const v of vehiculosVisibles) {
      if (v.tray.length > 0 || !EN_BASE.has(v.estado)) continue;
      const k = `${v.x},${v.y}`;
      if (!porBase.has(k)) porBase.set(k, []);
      porBase.get(k)!.push(v);
    }
    porBase.forEach((lista) => {
      lista.forEach((v, i) => {
        const anillo = Math.floor(i / 12);
        const enAnillo = Math.min(12, lista.length - anillo * 12);
        const ang = (2 * Math.PI * (i % 12)) / enAnillo;
        const radioPx = 30 + anillo * 24;
        m.set(v.id, [Math.cos(ang) * radioPx, Math.sin(ang) * radioPx]);
      });
    });
    return m;
  }, [vehiculosVisibles]);

  const transformVehiculo = useCallback(
    (v: VehiculoVisual, m: number, s: number) => {
      const p = v.tray.length ? posicionEnTrayectoria(v.tray, m) ?? [v.x, v.y] : [v.x, v.y];
      const off = posicionBase.get(v.id);
      const x = p[0] + (off ? off[0] * s : 0);
      const y = sy(p[1]) + (off ? off[1] * s : 0);
      return `translate(${x},${y}) scale(${s})`;
    },
    [posicionBase],
  );

  useEffect(() => {
    let raf = 0;
    const paso = () => {
      const m = minutoAhora();
      const s = escalaRef.current;
      for (const v of vehiculosVisibles) {
        const g = vehiculosRef.current.get(v.id);
        if (g) g.setAttribute('transform', transformVehiculo(v, m, s));
      }
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [vehiculosVisibles, minutoAhora, transformVehiculo]);

  // ---------------- interaccion ----------------
  const aKm = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return [p.x, ALTO_KM - p.y];
  }, []);

  /** Tramo de calle mas cercano al punto (en km) y su distancia en pixeles. */
  const tramoCercano = useCallback((x: number, y: number) => {
    const s = escalaRef.current;
    let mejor: { t: [number, number, number, number]; px: number } | null = null;
    const yr = Math.round(y);
    const x0 = Math.floor(x);
    if (yr >= 0 && yr <= ALTO_KM && x0 >= 0 && x0 < ANCHO_KM) {
      mejor = { t: [x0, yr, x0 + 1, yr], px: Math.abs(y - yr) / s };
    }
    const xr = Math.round(x);
    const y0 = Math.floor(y);
    if (xr >= 0 && xr <= ANCHO_KM && y0 >= 0 && y0 < ALTO_KM) {
      const px = Math.abs(x - xr) / s;
      if (!mejor || px < mejor.px) mejor = { t: [xr, y0, xr, y0 + 1], px };
    }
    return mejor;
  }, []);

  const objetivo = (e: React.PointerEvent | React.MouseEvent) =>
    (e.target as Element).closest('[data-tipo]') as SVGElement | null;

  const ocultarLinea = () => lineaHoverRef.current?.setAttribute('visibility', 'hidden');

  const alMover = (e: React.PointerEvent) => {
    const a = arrastre.current;
    if (a) {
      const dx = e.clientX - a.x;
      const dy = e.clientY - a.y;
      if (!a.movido && Math.hypot(dx, dy) > 4) {
        a.movido = true;
        setArrastrando(true);
        props.onHover(null, 0, 0);
      }
      if (a.movido) {
        const f = escalaRef.current;
        onVista(limitar({ cx: a.vista.cx - dx * f, cy: a.vista.cy - dy * f, ancho: a.vista.ancho }));
        ocultarLinea();
        return;
      }
    }
    const t = objetivo(e);
    if (t) {
      props.onHover({ tipo: t.dataset.tipo as Seleccion['tipo'], id: t.dataset.id! }, e.clientX, e.clientY);
      ocultarLinea();
      return;
    }
    props.onHover(null, 0, 0);
    const km = aKm(e.clientX, e.clientY);
    const linea = lineaHoverRef.current;
    if (!km || !linea) return;
    const s = escalaRef.current;
    const cruceCerca = props.onClicCruce && Math.hypot(km[0] - Math.round(km[0]), km[1] - Math.round(km[1])) / s <= 7;
    const tr = tramoCercano(km[0], km[1]);
    if (!cruceCerca && tr && tr.px <= 8) {
      linea.setAttribute('x1', String(tr.t[0]));
      linea.setAttribute('y1', String(sy(tr.t[1])));
      linea.setAttribute('x2', String(tr.t[2]));
      linea.setAttribute('y2', String(sy(tr.t[3])));
      linea.setAttribute('visibility', 'visible');
    } else {
      ocultarLinea();
    }
  };

  const alPresionar = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    arrastre.current = { x: e.clientX, y: e.clientY, vista, movido: false };
  };

  const alSoltar = (e: React.PointerEvent) => {
    const a = arrastre.current;
    arrastre.current = null;
    setArrastrando(false);
    if (!a || a.movido) return;
    const t = objetivo(e);
    if (t) {
      props.onAbrir({ tipo: t.dataset.tipo as Seleccion['tipo'], id: t.dataset.id! });
      return;
    }
    const km = aKm(e.clientX, e.clientY);
    if (!km) return;
    const s = escalaRef.current;
    const nx = Math.round(km[0]);
    const ny = Math.round(km[1]);
    if (props.onClicCruce && Math.hypot(km[0] - nx, km[1] - ny) / s <= 7 && nx >= 0 && nx <= ANCHO_KM && ny >= 0 && ny <= ALTO_KM) {
      props.onClicCruce(nx, ny, e.clientX, e.clientY);
      return;
    }
    const tr = tramoCercano(km[0], km[1]);
    if (tr && tr.px <= 8) props.onClicTramo(tr.t[0], tr.t[1], tr.t[2], tr.t[3]);
  };

  const vistaRef = useRef(vista);
  vistaRef.current = vista;
  const onVistaRef = useRef(onVista);
  onVistaRef.current = onVista;

  // zoom con la rueda, centrado en el cursor
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const alRodar = (e: WheelEvent) => {
      e.preventDefault();
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const p = pt.matrixTransform(ctm.inverse());
      const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
      const v = vistaRef.current;
      const nuevoAncho = Math.max(VB_W / 14, Math.min(VB_W, v.ancho * factor));
      const r = nuevoAncho / v.ancho;
      onVistaRef.current(limitar({ cx: p.x - (p.x - v.cx) * r, cy: p.y - (p.y - v.cy) * r, ancho: nuevoAncho }));
    };
    svg.addEventListener('wheel', alRodar, { passive: false });
    return () => svg.removeEventListener('wheel', alRodar);
  }, []);

  // ---------------- capas ----------------
  const idSel = seleccion?.tipo === 'vehiculo' ? seleccion.id : null;
  const vehiculoDePedido = useMemo(() => {
    if (seleccion?.tipo !== 'pedido') return null;
    const p = estado.pedidos.find((x) => x.id === seleccion.id);
    return p?.vehiculos ? p.vehiculos.split(', ')[0] : null;
  }, [seleccion, estado.pedidos]);
  const vehiculoResaltado = idSel ?? vehiculoDePedido;

  const rutas = useMemo(() => {
    if (filtros.rutas === 'ninguna') return [];
    return vehiculosVisibles
      .filter((v) => v.tray.length >= 6)
      .filter((v) => filtros.rutas === 'todas' || v.id === vehiculoResaltado)
      .map((v) => ({ id: v.id, sel: v.id === vehiculoResaltado }))
      .sort((a, b) => Number(a.sel) - Number(b.sel));
  }, [vehiculosVisibles, filtros.rutas, vehiculoResaltado]);

  const conteoEnAlmacen = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of estado.vehiculos) {
      if (v.tray.length === 0 && EN_BASE.has(v.estado)) {
        const a = estado.almacenes.find((x) => Math.abs(x.x - v.x) < 1e-6 && Math.abs(x.y - v.y) < 1e-6);
        if (a) m.set(a.id, (m.get(a.id) ?? 0) + 1);
      }
    }
    return m;
  }, [estado.vehiculos, estado.almacenes]);

  return (
    <div
      ref={wrapRef}
      className={'map-wrap' + (arrastrando ? ' arrastrando' : '')}
      onPointerMove={alMover}
      onPointerDown={alPresionar}
      onPointerUp={alSoltar}
      onPointerLeave={() => {
        arrastre.current = null;
        setArrastrando(false);
        props.onHover(null, 0, 0);
        ocultarLinea();
      }}
    >
      <svg ref={svgRef} viewBox={viewBox} preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%' }}
        xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa de la ciudad con la operación en curso">
        <rect x={-50} y={-50} width={VB_W + 100} height={VB_H + 100} fill="#fbfcfe" />
        <Reticula escala={Math.round(escala * 1000) / 1000} />

        {filtros.mostrarBloqueos &&
          estado.bloqueos.map((b) => {
            const pts: string[] = [];
            for (let i = 0; i < b.puntos.length; i += 2) pts.push(`${b.puntos[i]},${sy(b.puntos[i + 1])}`);
            return (
              <polyline key={b.id} points={pts.join(' ')} fill="none" stroke="#c0392b" strokeWidth={5}
                strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={0.9}>
                <title>{`Calle bloqueada (${b.id}) — dato real del curso`}</title>
              </polyline>
            );
          })}
        {estado.tramosManuales.map((t) => (
          <line key={t.join('-')} x1={t[0]} y1={sy(t[1])} x2={t[2]} y2={sy(t[3])} stroke="#a15b16" strokeWidth={6}
            strokeDasharray="5 4" vectorEffect="non-scaling-stroke">
            <title>Calle bloqueada manualmente (clic para reabrir)</title>
          </line>
        ))}

        {rutas.map((r) => {
          const v = estado.vehiculos.find((x) => x.id === r.id)!;
          const desde = posicionEnTrayectoria(v.tray, minuto);
          let resto = v.tray;
          // recorta lo ya recorrido para que la ruta empiece en la unidad
          for (let i = 0; i < v.tray.length; i += 3) {
            if (v.tray[i + 2] > minuto) {
              resto = v.tray.slice(i);
              break;
            }
            if (i + 3 >= v.tray.length) resto = v.tray.slice(i);
          }
          const opacidad = vehiculoResaltado ? (r.sel ? 0.95 : 0.15) : 0.45;
          return (
            <polyline key={`ruta-${r.id}`} points={puntosTray(resto, desde)} fill="none" stroke={NAVY}
              strokeWidth={r.sel ? 3.2 : 2} strokeDasharray="7 5" strokeLinecap="round" strokeLinejoin="round"
              vectorEffect="non-scaling-stroke" opacity={opacidad} />
          );
        })}

        <line ref={lineaHoverRef} x1={0} y1={0} x2={0} y2={0} stroke={NAVY} strokeOpacity={0.35} strokeWidth={8}
          strokeLinecap="round" vectorEffect="non-scaling-stroke" visibility="hidden" pointerEvents="none" />

        {estado.almacenes.map((a) => {
          const pct = a.capacidad ? (100 * (a.stock ?? 0)) / a.capacidad : null;
          const color = pct == null ? NAVY : COLOR_SEMAFORO[semaforo(pct, verde, ambar)];
          const sel = seleccion?.tipo === 'almacen' && seleccion.id === a.id;
          const n = conteoEnAlmacen.get(a.id) ?? 0;
          return (
            <g key={a.id} className="map-select-hit" data-tipo="almacen" data-id={a.id}
              transform={`translate(${a.x},${sy(a.y)}) scale(${escala})`}>
              <rect x={-13} y={-13} width={26} height={26} rx={6} fill={color} stroke={sel ? NAVY : '#fff'} strokeWidth={sel ? 3 : 1.5} />
              <GlifoAlmacen />
              <text y={27} textAnchor="middle" fontSize={10} fontWeight={700} fill="#0a2c43" stroke="#fbfcfe" strokeWidth={3} paintOrder="stroke">
                {a.nombre}
              </text>
              {n > 0 && (
                <g transform="translate(14,-14)">
                  <circle r={8} fill="#fff" stroke={NAVY} strokeWidth={1.2} />
                  <text y={3.2} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={NAVY}>{n}</text>
                </g>
              )}
            </g>
          );
        })}

        {filtros.mostrarPedidos &&
          estado.pedidos.map((p) => {
            const h = ((p.limiteMin - minuto) / (p.plazo * 60)) * 100;
            const sem = semaforo(h, verde, ambar);
            if (filtros.soloCriticos && sem === 'verde') return null;
            const sel = seleccion?.tipo === 'pedido' && seleccion.id === p.id;
            return (
              <g key={p.id} className="map-select-hit" data-tipo="pedido" data-id={p.id}
                transform={`translate(${p.x},${sy(p.y)}) scale(${escala})`}>
                <circle r={9} fill={COLOR_SEMAFORO[sem]} stroke={sel ? NAVY : '#fff'} strokeWidth={sel ? 3 : 1.5} />
                <g transform="scale(0.78)">
                  <GlifoPaquete />
                </g>
              </g>
            );
          })}

        {vehiculosVisibles.map((v) => {
          const sel = vehiculoResaltado === v.id;
          const color = colorVehiculo(v, verde, ambar);
          const atenuado = v.estado === 'ALIMENTACION' || v.estado === 'MANTENIMIENTO' || (vehiculoResaltado && !sel);
          return (
            <g key={v.id} ref={(el) => {
              if (el) vehiculosRef.current.set(v.id, el);
              else vehiculosRef.current.delete(v.id);
            }}
              className="map-select-hit" data-tipo="vehiculo" data-id={v.id} transform={transformVehiculo(v, minuto, escala)}
              opacity={atenuado ? 0.6 : 1}>
              <circle r={12} fill={color} stroke={sel ? '#0a2c43' : '#fff'} strokeWidth={sel ? 3 : 1.5} />
              <GlifoVehiculo tipo={v.tipo} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function limitar(v: Vista): Vista {
  return {
    ancho: v.ancho,
    cx: Math.max(-MARGEN, Math.min(ANCHO_KM + MARGEN, v.cx)),
    cy: Math.max(-MARGEN, Math.min(ALTO_KM + MARGEN, v.cy)),
  };
}

export function acercar(v: Vista, factor: number): Vista {
  return limitar({ ...v, ancho: Math.max(VB_W / 14, Math.min(VB_W, v.ancho / factor)) });
}

export function centrarEn(v: Vista, x: number, y: number, anchoMax = VB_W / 1.8): Vista {
  return limitar({ cx: x, cy: ALTO_KM - y, ancho: Math.min(v.ancho, anchoMax) });
}

export const ANCHO_VISTA_COMPLETA = VB_W;
