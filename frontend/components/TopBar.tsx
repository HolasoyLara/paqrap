'use client';

import { useEffect, useState } from 'react';
import type { EstadoVisual } from '@/lib/tipos';
import { duracion, fechaLarga, horaMinuto } from '@/lib/formato';

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

/**
 * Encabezado permanente (prototipo v04): nombre del escenario activo, fecha
 * calendario de la simulacion, dia y hora simulados, cronometro de tiempo real
 * y los unicos controles de la corrida: iniciar y detener.
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
  let fecha = '—';
  let reloj = 'Día 1 · 00:00';
  if (estado) {
    const ms = estado.inicioMs + minutoAhora() * 60000;
    const inicioDia = Math.floor(estado.inicioMs / 86400000) * 86400000;
    const dia = Math.floor((ms - inicioDia) / 86400000) + 1;
    const diaMostrado = estado.totalDias ? Math.min(dia, estado.totalDias) : dia;
    fecha = fechaLarga(ms);
    reloj = (estado.totalDias ? `Día ${diaMostrado} de ${estado.totalDias}` : `Día ${diaMostrado}`) + ' · ' + horaMinuto(ms);
  }
  const segundosReales = estado ? (enCurso ? base.seg + (performance.now() - base.desde) / 1000 : estado.tiempoRealSeg) : 0;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand">PaqRap</div>
        <div className="scenario">
          Visualizador · Escenario: {escenarioTexto} · {algoritmoTexto}
          {estado && estado.estadoCorrida !== 'SIN_CORRIDA' ? ` · semilla ${estado.semilla}` : ''}
        </div>
      </div>
      <div className="topbar-right">
        <div className="sim-clock" aria-live="polite">
          <span className="clock-state">{estado ? ESTADO_TEXTO[estado.estadoCorrida] : 'Conectando…'}</span>
          <span className="clock-date">{fecha}</span>
          <span>{reloj}</span>
          <span className="clock-wall">Tiempo real: {duracion(segundosReales)}{enCurso && estado ? ` · ×${formatoFactor(estado.factor)}` : ''}</span>
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
