'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, enlaces } from '@/lib/api';
import type { Experimento } from '@/lib/tipos';
import { numero } from '@/lib/formato';

interface Props {
  onAviso: (texto: string, tipo?: 'ok' | 'error') => void;
}

const COLOR: Record<string, string> = { GA: '#0f3d5c', ACO: '#c98a10' };
const NOMBRE: Record<string, string> = { GA: 'Genético (GA)', ACO: 'Colonia de Hormigas (ACO)' };

/** Barras agrupadas por instancia (una barra por algoritmo). */
function Barras({ exp, metrica, etiqueta, formato }: { exp: Experimento; metrica: string; etiqueta: string; formato: (v: number) => string }) {
  const algs = exp.solicitud.algoritmos;
  const instancias = Array.from(new Set(exp.corridas.map((c) => c.instancia))).sort((a, b) => a - b);
  const valores = exp.corridas.map((c) => c.indicadores[metrica] ?? 0);
  if (!instancias.length) return null;
  const max = Math.max(...valores, 1e-9);
  const ancho = 640, alto = 190, izq = 8, abajo = 26, grupo = (ancho - izq) / instancias.length;
  const barra = Math.min(34, (grupo - 14) / algs.length);
  return (
    <div>
      <h4>{etiqueta}</h4>
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="barras-svg" style={{ width: '100%', maxWidth: 700 }} role="img" aria-label={etiqueta}>
        <line x1={izq} y1={alto - abajo} x2={ancho} y2={alto - abajo} stroke="#dbe3ec" />
        {instancias.map((i, gi) => (
          <g key={i}>
            {algs.map((a, ai) => {
              const c = exp.corridas.find((x) => x.instancia === i && x.algoritmo === a);
              if (!c) return null;
              const v = c.indicadores[metrica] ?? 0;
              const h = ((alto - abajo - 18) * v) / max;
              const x = izq + gi * grupo + (grupo - barra * algs.length) / 2 + ai * barra;
              return (
                <g key={a}>
                  <rect x={x} y={alto - abajo - h} width={barra - 3} height={h} rx={3} fill={COLOR[a] ?? '#5b6b78'}>
                    <title>{`${NOMBRE[a] ?? a} · instancia ${i}: ${formato(v)}`}</title>
                  </rect>
                </g>
              );
            })}
            <text x={izq + gi * grupo + grupo / 2} y={alto - 8} textAnchor="middle">Inst. {i}</text>
          </g>
        ))}
      </svg>
      <div className="legend" style={{ marginTop: 4 }}>
        {algs.map((a) => <div className="legend-item" key={a}><span className="legend-swatch" style={{ background: COLOR[a] }} />{NOMBRE[a] ?? a}</div>)}
      </div>
    </div>
  );
}

/** Experimentacion numerica entre las dos metaheuristicas (B23, D20, C25, D23). */
export default function PantallaExperimentacion({ onAviso }: Props) {
  const [form, setForm] = useState({
    escenario: 'SIMULACION_5D', fechaInicio: '2026-09-01T00:00', instancias: 5, diasEntreInstancias: 5, semillaBase: 20260902,
    averiasPorDia: 0.6, diasMaximosColapso: 60, ga: true, aco: true,
  });
  const [lista, setLista] = useState<{ id: string; estado: string; descripcion: string; creadoMs: number; progreso: number }[]>([]);
  const [actual, setActual] = useState<Experimento | null>(null);
  const [lanzando, setLanzando] = useState(false);

  const cargarLista = useCallback(async () => {
    try {
      setLista(await api.experimentos());
    } catch {
      setLista([]);
    }
  }, []);

  useEffect(() => {
    cargarLista();
  }, [cargarLista]);

  useEffect(() => {
    if (!actual || (actual.estado !== 'EN_CURSO' && actual.estado !== 'EN_COLA')) return;
    const t = setInterval(async () => {
      try {
        const e = await api.experimento(actual.id);
        setActual(e);
        if (e.estado !== 'EN_CURSO' && e.estado !== 'EN_COLA') cargarLista();
      } catch {
        // reintenta en el siguiente ciclo
      }
    }, 2000);
    return () => clearInterval(t);
  }, [actual, cargarLista]);

  const lanzar = async () => {
    const algoritmos = [form.ga ? 'GA' : null, form.aco ? 'ACO' : null].filter(Boolean);
    if (!algoritmos.length) {
      onAviso('Elija al menos un algoritmo.', 'error');
      return;
    }
    setLanzando(true);
    try {
      const e = await api.lanzarExperimento({
        escenario: form.escenario, fechaInicio: form.fechaInicio + ':00', instancias: form.instancias,
        diasEntreInstancias: form.diasEntreInstancias, semillaBase: form.semillaBase, algoritmos,
        averiasPorDia: form.averiasPorDia, diasMaximosColapso: form.diasMaximosColapso,
      });
      setActual(e);
      onAviso(`Experimento ${e.id} en marcha: ${e.totalCorridas} corridas sin animación.`, 'ok');
      cargarLista();
    } catch (err) {
      onAviso(err instanceof Error ? err.message : 'No se pudo lanzar el experimento', 'error');
    } finally {
      setLanzando(false);
    }
  };

  const ver = async (id: string) => {
    try {
      setActual(await api.experimento(id));
    } catch (err) {
      onAviso(err instanceof Error ? err.message : 'No se pudo cargar el experimento', 'error');
    }
  };

  const colapso = form.escenario === 'COLAPSO_LOGISTICO';
  return (
    <section>
      <h2>Experimentación numérica</h2>
      <p className="note">
        Compara las dos metaheurísticas del Planificador (Algoritmo Genético y Colonia de Hormigas) sobre las mismas instancias: los
        mismos archivos de ventas y bloqueos, la misma fecha de inicio y la misma semilla de averías. Cada corrida se ejecuta sin
        animación (lo más rápido posible) y se compara costo, cumplimiento, kilometraje y tiempo de cómputo con una prueba t pareada.
        En el escenario de colapso se mide además cuántos días aguanta la operación con cada algoritmo (B24).
      </p>

      <div className="card">
        <h3>Nuevo experimento</h3>
        <div className="fila-campos">
          <label>Escenario
            <select value={form.escenario} onChange={(e) => setForm({ ...form, escenario: e.target.value,
              fechaInicio: e.target.value === 'COLAPSO_LOGISTICO' ? '2027-03-01T00:00' : '2026-09-01T00:00' })}>
              <option value="SIMULACION_5D">Simulación del periodo (5 días)</option>
              <option value="COLAPSO_LOGISTICO">Simulación hasta el colapso logístico</option>
            </select>
          </label>
          <label>Fecha de inicio de la primera instancia<input type="datetime-local" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} /></label>
          <label>Instancias<input type="number" min={1} max={30} value={form.instancias} onChange={(e) => setForm({ ...form, instancias: Number(e.target.value) })} /></label>
          <label>Días entre instancias<input type="number" min={1} max={60} value={form.diasEntreInstancias} onChange={(e) => setForm({ ...form, diasEntreInstancias: Number(e.target.value) })} /></label>
          <label>Semilla base<input type="number" value={form.semillaBase} onChange={(e) => setForm({ ...form, semillaBase: Number(e.target.value) })} /></label>
          <label>Averías por día<input type="number" min={0} max={10} step={0.1} value={form.averiasPorDia} onChange={(e) => setForm({ ...form, averiasPorDia: Number(e.target.value) })} /></label>
          {colapso && <label>Máximo de días por corrida<input type="number" min={1} max={365} value={form.diasMaximosColapso} onChange={(e) => setForm({ ...form, diasMaximosColapso: Number(e.target.value) })} /></label>}
          <div>
            <label><input type="checkbox" checked={form.ga} onChange={(e) => setForm({ ...form, ga: e.target.checked })} />Algoritmo Genético (GA)</label>
            <label><input type="checkbox" checked={form.aco} onChange={(e) => setForm({ ...form, aco: e.target.checked })} />Colonia de Hormigas (ACO)</label>
          </div>
        </div>
        <div className="start-bar">
          <button className="btn btn-start" onClick={lanzar} disabled={lanzando}>Ejecutar experimento</button>
          <span className="hint">Cada instancia es un periodo distinto de los datos publicados. Corre en segundo plano y no afecta a la corrida visual.</span>
        </div>
      </div>

      {actual && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Experimento {actual.id}</h3>
          <p className="hint">{actual.descripcion} · estado: <b>{actual.estado.toLowerCase()}</b> · {actual.corridasHechas} de {actual.totalCorridas} corridas</p>
          <div className="progreso"><div style={{ width: `${Math.round(actual.progreso * 100)}%` }} /></div>
          {actual.mensaje && <p className="error-texto" style={{ marginTop: 8 }}>{actual.mensaje}</p>}
          {actual.conclusion && <div className="isa-note"><b>Conclusión:</b> {actual.conclusion}</div>}

          {actual.resumen.length > 0 && (
            <>
              <h3 style={{ marginTop: 18 }}>Resumen estadístico (media ± desviación estándar)</h3>
              <div className="tabla-scroll">
                <table className="daily-table">
                  <thead>
                    <tr>
                      <th>Métrica</th>
                      {actual.solicitud.algoritmos.map((a) => <th key={a} className="num">{NOMBRE[a] ?? a}</th>)}
                      <th className="num">Dif. media</th><th className="num">t</th><th className="num">p (t pareada)</th><th>Mejor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actual.resumen.map((m) => (
                      <tr key={m.metrica}>
                        <td>{m.etiqueta} <span className="hint">({m.menorEsMejor ? 'menor es mejor' : 'mayor es mejor'})</span></td>
                        {actual.solicitud.algoritmos.map((a) => (
                          <td key={a} className="num">{numero(m.porAlgoritmo[a]?.media ?? 0, 2)} ± {numero(m.porAlgoritmo[a]?.desviacion ?? 0, 2)}</td>
                        ))}
                        <td className="num">{m.prueba ? numero(m.prueba.diferenciaMedia, 2) : '—'}</td>
                        <td className="num">{m.prueba && Number.isFinite(m.prueba.estadisticoT) ? numero(m.prueba.estadisticoT, 2) : '—'}</td>
                        <td className="num">{m.prueba ? numero(m.prueba.valorP, 4) : '—'}</td>
                        <td>{m.mejor ? <span className={'semaforo-pill ' + (m.significativo ? 'semaforo-verde' : 'semaforo-gris')}>{m.mejor}{m.significativo ? ' (p<0.05)' : ''}</span> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {actual.corridas.length > 0 && (
            <div className="grid-2col" style={{ marginTop: 16 }}>
              <Barras exp={actual} metrica="costo" etiqueta="Costo total por instancia (S/)" formato={(v) => 'S/ ' + numero(v)} />
              <Barras exp={actual} metrica={colapso ? 'diasHastaColapso' : 'cumplimiento'} etiqueta={colapso ? 'Días hasta el colapso por instancia' : 'Cumplimiento por instancia (%)'}
                formato={(v) => numero(v, 2)} />
            </div>
          )}

          {actual.corridas.length > 0 && (
            <>
              <h3 style={{ marginTop: 18 }}>Corridas</h3>
              <div className="tabla-scroll" style={{ maxHeight: 360 }}>
                <table className="daily-table">
                  <thead>
                    <tr><th>Inst.</th><th>Algoritmo</th><th>Inicio</th><th className="num">Pedidos</th><th className="num">Cumplimiento</th><th className="num">Costo</th><th className="num">Km</th><th className="num">Cómputo (ms)</th>{colapso && <th>Colapso</th>}</tr>
                  </thead>
                  <tbody>
                    {actual.corridas.map((c) => (
                      <tr key={c.instancia + c.algoritmo}>
                        <td>{c.instancia}</td><td>{c.algoritmo}</td><td>{c.fechaInicio.replace('T', ' ').slice(0, 16)}</td>
                        <td className="num">{numero(c.indicadores.pedidos ?? 0)}</td>
                        <td className="num">{numero(c.indicadores.cumplimiento ?? 0, 2)} %</td>
                        <td className="num">S/ {numero(c.indicadores.costo ?? 0)}</td>
                        <td className="num">{numero(c.indicadores.km ?? 0)}</td>
                        <td className="num">{numero(c.indicadores.tiempoComputoMs ?? 0)}</td>
                        {colapso && <td>{c.colapso ?? '—'}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="start-bar">
                <a className="btn btn-primary" href={enlaces.experimentoCsv(actual.id)}>Exportar resultados (CSV)</a>
              </div>
            </>
          )}
        </div>
      )}

      <div className="separador" />
      <h3>Experimentos anteriores (C25)</h3>
      {lista.length === 0 ? <p className="empty-hint">Todavía no se ha ejecutado ningún experimento.</p> : (
        <table className="daily-table">
          <thead><tr><th>Experimento</th><th>Descripción</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {lista.map((e) => (
              <tr key={e.id}>
                <td>{e.id}</td><td>{e.descripcion}</td>
                <td><span className="chip-estado">{e.estado.toLowerCase()}{e.estado === 'EN_CURSO' ? ` · ${Math.round(e.progreso * 100)} %` : ''}</span></td>
                <td><button className="btn btn-sm btn-ghost" onClick={() => ver(e.id)}>Ver</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
