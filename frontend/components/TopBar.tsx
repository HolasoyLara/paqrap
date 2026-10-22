'use client';

import { useEffect, useState } from 'react';
import type { EstadoVisual } from '@/lib/tipos';
import {
  ahoraLimaTexto, COLOR_OCUPACION, ETIQUETA_OCUPACION, fechaHoraCompleta, numero, porcentaje, semaforoOcupacion,
  type SemaforoOcupacion, transcurridoReal, transcurridoSimulado,
} from '@/lib/formato';

interface Props {
  estado: EstadoVisual | null;
  minutoAhora: () => number;
  escenarioTexto: string;
  algoritmoTexto: string;
  puedeIniciar: boolean;
  ocupado: boolean;
  onIniciar: () => void;
  onDetener: () => void;
}

const ESTADO_TEXTO: Record<string, string> = {
  SIN_CORRIDA: 'Corrida: detenida',
  EN_CURSO: 'Corrida: en curso',
  FINALIZADA: 'Corrida: finalizada',
  DETENIDA: 'Corrida: detenida',
};

/** Unidades fuera de servicio: no cuentan en la ocupacion global de la flota (G01). */
const FUERA_DE_SERVICIO = new Set(['AVERIADA', 'EN_TALLER', 'MANTENIMIENTO']);

function KpiGlobal({ etiqueta, pct, sem, sub }: { etiqueta: string; pct: number; sem: SemaforoOcupacion; sub: string }) {
  return (
    <div className="kpi-global" title={`${etiqueta}: ${ETIQUETA_OCUPACION[sem]}`}>
      <span className={'kpi-global-dot ocup-' + sem} style={{ background: COLOR_OCUPACION[sem] }} />
      <div>
        <div className="kpi-global-label">{etiqueta}</div>
        <div className="kpi-global-valor">{numero(pct, 0)} % <span>· {ETIQUETA_OCUPACION[sem]}</span></div>
        <div className="kpi-global-sub">{sub}</div>
      </div>
    </div>
  );
}

/**
 * Encabezado permanente: escenario activo, los 4 tiempos de la rubrica (C12-C16) en un bloque 2x2,
 * los indicadores globales de ocupacion (G01-G04) y los unicos controles de la corrida: iniciar y detener.
 */
export default function TopBar({ estado, minutoAhora, escenarioTexto, algoritmoTexto, puedeIniciar, ocupado, onIniciar, onDetener }: Props) {
  const [, setTic] = useState(0);
  const [base, setBase] = useState({ seg: 0, desde: 0 });

  useEffect(() => {
    const t = setInterval(() => setTic((x) => x + 1), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (estado) setBase({ seg: estado.tiempoRealSeg, desde: performance.now() });
  }, [estado]);

  const enCurso = estado?.estadoCorrida === 'EN_CURSO';
  const hayCorrida = !!estado && estado.estadoCorrida !== 'SIN_CORRIDA';
  const minuto = estado ? minutoAhora() : 0;
  const simulada = estado && hayCorrida ? fechaHoraCompleta(estado.inicioMs + minuto * 60000) : '—';
  let diaTexto = '';
  if (estado && hayCorrida) {
    const ms = estado.inicioMs + minuto * 60000;
    const inicioDia = Math.floor(estado.inicioMs / 86400000) * 86400000;
    const dia = Math.floor((ms - inicioDia) / 86400000) + 1;
    const diaMostrado = estado.totalDias ? Math.min(dia, estado.totalDias) : dia;
    diaTexto = estado.totalDias ? `Día ${diaMostrado} de ${estado.totalDias}` : `Día ${diaMostrado}`;
  }
  const segundosReales = estado ? (enCurso ? base.seg + (performance.now() - base.desde) / 1000 : estado.tiempoRealSeg) : 0;

  // indicadores globales de ocupacion (G01-G04)
  let flota: { pct: number; carga: number; cap: number } | null = null;
  let almacenes: { pct: number; stock: number; cap: number } | null = null;
  if (estado && hayCorrida) {
    let carga = 0, cap = 0;
    for (const v of estado.vehiculos) {
      if (FUERA_DE_SERVICIO.has(v.estado)) continue;
      carga += v.carga;
      cap += v.capacidad;
    }
    flota = { pct: porcentaje(carga, cap), carga, cap };
    let stock = 0, capA = 0;
    for (const a of estado.almacenes) {
      if (a.central || a.capacidad == null) continue;
      stock += a.stock ?? 0;
      capA += a.capacidad;
    }
    almacenes = { pct: porcentaje(stock, capA), stock, cap: capA };
  }
  const verde = estado?.umbralVerde ?? 50;
  const ambar = estado?.umbralAmbar ?? 20;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand">PaqRap</div>
        <div className="scenario">
          Visualizador · Escenario: {escenarioTexto} · {algoritmoTexto}
          {hayCorrida ? ` · semilla ${estado!.semilla}` : ''}
        </div>
        <div className="scenario">
          <span className="clock-state">{estado ? ESTADO_TEXTO[estado.estadoCorrida] : 'Conectando…'}</span>
          {diaTexto && <> · {diaTexto}</>}
          {enCurso && estado ? <span className="chip-factor">Aceleración ×{formatoFactor(estado.factor)}</span> : null}
        </div>
      </div>
      <div className="topbar-right">
        {flota && almacenes && (
          <div className="kpis-globales">
            <KpiGlobal etiqueta="Ocupación de flota" pct={flota.pct} sem={semaforoOcupacion(flota.pct, verde, ambar)}
              sub={`${numero(flota.carga)} / ${numero(flota.cap)} paq. · unidades operativas`} />
            <KpiGlobal etiqueta="Ocupación de almacenes" pct={almacenes.pct} sem={semaforoOcupacion(almacenes.pct, verde, ambar)}
              sub={`${numero(almacenes.stock)} / ${numero(almacenes.cap)} · intermedios (central sin límite)`} />
          </div>
        )}
        <div className="reloj-2x2" aria-live="polite">
          <div className="reloj-celda"><span>Fecha y hora simulada</span><b>{simulada}</b></div>
          <div className="reloj-celda"><span>Transcurrido simulado</span><b>{hayCorrida ? transcurridoSimulado(minuto) : '—'}</b></div>
          <div className="reloj-celda"><span>Fecha y hora actual</span><b>{ahoraLimaTexto()}</b></div>
          <div className="reloj-celda"><span>Transcurrido real</span><b>{hayCorrida ? transcurridoReal(segundosReales) : '—'}</b></div>
        </div>
        <button className="btn btn-start" disabled={!puedeIniciar || ocupado || enCurso} onClick={onIniciar}>Iniciar corrida</button>
        <button className="btn btn-stop" disabled={!enCurso || ocupado} onClick={onDetener}>Detener corrida</button>
      </div>
    </header>
  );
}

function formatoFactor(f: number): string {
  return f >= 10 ? Math.round(f).toString() : f.toFixed(1);
}
