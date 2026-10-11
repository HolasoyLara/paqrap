// Formatos de fecha, hora, dinero y semaforizacion compartidos por las pantallas.
// Las horas de la simulacion viajan como "epoch ms en UTC" de la fecha local, asi que
// siempre se formatean en UTC para no desplazarlas.

const DIAS_SEM = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const dos = (n: number) => (n < 10 ? '0' : '') + n;

export function fechaLarga(ms: number): string {
  const d = new Date(ms);
  return `${DIAS_SEM[d.getUTCDay()]} ${dos(d.getUTCDate())} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function horaMinuto(ms: number): string {
  const d = new Date(ms);
  return `${dos(d.getUTCHours())}:${dos(d.getUTCMinutes())}`;
}

export function fechaHoraCorta(ms: number): string {
  const d = new Date(ms);
  return `${dos(d.getUTCDate())}/${dos(d.getUTCMonth() + 1)} ${dos(d.getUTCHours())}:${dos(d.getUTCMinutes())}`;
}

export function duracion(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${dos(Math.floor(s / 3600))}:${dos(Math.floor((s % 3600) / 60))}:${dos(s % 60)}`;
}

export const soles = (v: number, decimales = 0) =>
  'S/ ' + v.toLocaleString('es-PE', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

export const numero = (v: number, decimales = 0) =>
  v.toLocaleString('es-PE', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

export type Semaforo = 'verde' | 'ambar' | 'rojo';

export function semaforo(porcentaje: number, verde: number, ambar: number): Semaforo {
  if (porcentaje >= verde) return 'verde';
  if (porcentaje >= ambar) return 'ambar';
  return 'rojo';
}

export const COLOR_SEMAFORO: Record<Semaforo, string> = { verde: '#2e7d46', ambar: '#c98a10', rojo: '#c0392b' };
export const ETIQUETA_SEMAFORO: Record<Semaforo, string> = { verde: 'A tiempo', ambar: 'En riesgo', rojo: 'Vencido / crítico' };

export const ETIQUETA_TIPO_VEHICULO: Record<string, string> = { AUTO: 'Auto', MOTO: 'Moto', BICICLETA: 'Bicicleta' };

/** datetime-local (YYYY-MM-DDTHH:mm) a partir de una fecha ISO del backend. */
export function aInputFecha(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 16);
}

/** Fecha/hora actual de Lima (UTC-5) en formato datetime-local. */
export function ahoraLima(): string {
  const ms = Date.now() - 5 * 3600 * 1000;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}T${dos(d.getUTCHours())}:${dos(d.getUTCMinutes())}`;
}
