'use client';

import { useEffect, useState } from 'react';
import type { EstadoVisual } from '@/lib/tipos';
import { fechaHoraCompleta } from '@/lib/formato';

interface Props {
  estado: EstadoVisual | null;
  minutoAhora: () => number;
  puedeIniciar: boolean;
  ocupado: boolean;
  onIniciar: () => void;
  onDetener: () => void;
  infoAbierta: boolean;
  onInfo: () => void;
}

const ESTADO_TEXTO: Record<string, string> = {
  SIN_CORRIDA: 'Sin corrida',
  EN_CURSO: 'En curso',
  FINALIZADA: 'Finalizada',
  DETENIDA: 'Detenida',
};

/** Barra minima sobre el mapa a pantalla completa: estado, hora simulada y los controles de la corrida. */
export default function BarraMapa({ estado, minutoAhora, puedeIniciar, ocupado, onIniciar, onDetener, infoAbierta, onInfo }: Props) {
  const [, setTic] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTic((x) => x + 1), 500);
    return () => clearInterval(t);
  }, []);
  const enCurso = estado?.estadoCorrida === 'EN_CURSO';
  const hay = !!estado && estado.estadoCorrida !== 'SIN_CORRIDA';
  return (
    <div className="barra-mapa" onPointerDown={(e) => e.stopPropagation()}>
      <span className={'barra-estado' + (enCurso ? ' en-curso' : '')}>{estado ? ESTADO_TEXTO[estado.estadoCorrida] : 'Conectando…'}</span>
      <span className="barra-hora">{hay && estado ? fechaHoraCompleta(estado.inicioMs + minutoAhora() * 60000) : '—'}</span>
      <button className={'btn-flot' + (infoAbierta ? ' activo' : '')} onClick={onInfo} title="Tiempos, ocupación e información de la corrida">Información</button>
      <button className="btn btn-sm btn-start" disabled={!puedeIniciar || ocupado || enCurso} onClick={onIniciar}>Iniciar</button>
      <button className="btn btn-sm btn-stop" disabled={!enCurso || ocupado} onClick={onDetener}>Detener</button>
    </div>
  );
}
