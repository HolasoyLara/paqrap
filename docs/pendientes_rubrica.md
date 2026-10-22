# Pendientes de la rúbrica (91.EvaSw)

Guía: [auditoria_rubrica.md](auditoria_rubrica.md) (archivos y líneas) y [rubrica_evaluacion_sw.md](rubrica_evaluacion_sw.md).
Cada fase termina con `npm run typecheck` (frontend), `mvnw -q -DskipTests compile` (si se tocó el backend) y un commit «Rúbrica fase N: …».

Estado: ⬜ pendiente · 🔄 en curso · ✅ hecho

| Fase | Ítems | Estado |
|---|---|---|
| 1. Solo frontend: tiempos, semáforo de ocupación, KPI globales, tramos, español | C12–C16, C21, C27, C28, G01–G04, B11, C07 | ✅ |
| 2. Backend + frontend: averías por tipo y horarios de la UT | D10–D13 (+ datos para E06, E13) | 🔄 |
| 3. Panel izquierdo: pestaña Transporte, filtros de semáforo, rutas de pedido | E01–E07, E13–E15, F01, F03, F07, F08, F15, F16 | ⬜ |
| 4. Pestañas Almacenes y Envíos | E18–E22, E31, F05, F06, F09 | ⬜ |
| 5. Cierre con la última planificación | G08–G10 | ⬜ |
| 6. Mejoras P2 (si hay tiempo) | C30, C08, C05 | ⬜ |

## Detalle por fase

### Fase 1 ✅
Hecho:
- `lib/formato.ts`: `semaforoOcupacion`, `COLOR_OCUPACION`, `ETIQUETA_OCUPACION`, `claseOcupacion`, `COLOR_BLOQUEO` (#8e24aa), `ETIQUETA_EVENTO` (movido aquí), `etiquetaCodigo`, formatos `fechaHoraCompleta`, `ahoraLimaTexto`, `transcurridoSimulado`, `transcurridoReal`.
- `TopBar.tsx`: bloque 2×2 con los 4 tiempos (C12–C16); factor ×N en una etiqueta aparte; KPIs globales siempre visibles «Ocupación de flota» y «Ocupación de almacenes» (G01–G04).
- `MapaOperacion.tsx`: UT y almacenes intermedios coloreados por ocupación con vacío (C21, C27); punto de urgencia de plazo en la esquina; bloqueos en magenta; funciones exportadas `ocupacionVehiculo`, `ocupacionAlmacen` y `urgenciaVehiculo`.
- `Iconos.tsx`: glifos con color configurable (para el vacío) y `GlifoLlave`.
- `Tooltip.tsx`: «Ocupación: n / cap (x %)» con píldora; «Urgencia de plazo» (C28).
- `PantallaPanorama.tsx`: leyenda con los 4 estados de ocupación, el central «sin límite», la urgencia y los bloqueos; se quitó `map-overlay-hora`.
- `ModalDetalle.tsx`: ruta como lista de tramos origen → destino con salida y llegada (B11); «Llegada estimada»; ocupación en la UT y en el almacén.
- C07: «Rutas recalculadas», eventos del Cierre con etiquetas en español y banner de error sin términos técnicos (`page.tsx`).
### Fase 2
Archivos: `backend/.../visualizador/EstadoVisual.java` (VehiculoVisual), `backend/.../simulacion/MotorSimulacion.java` (construirEstadoVisual), `frontend/lib/tipos.ts`, `MapaOperacion.tsx`, `Tooltip.tsx`.

### Fase 3
Archivos: `frontend/components/PanelListas.tsx` (nuevo), `PantallaPanorama.tsx`, `MapaOperacion.tsx` (Filtros), `ModalDetalle.tsx`, `app/page.tsx`.

### Fase 4
Archivos: `EstadoVisual.java` (AlmacenVisual, PedidoVisual), `MotorSimulacion.java`, `PanelListas.tsx`, `ModalDetalle.tsx`.

### Fase 5
Archivos: `CierreCorrida.java`, `MotorSimulacion.java` (generarCierre), `api/ReportesCsv.java`, `PantallaCierre.tsx`, `tipos.ts`.

### Fase 6
Archivos: `MapaOperacion.tsx`, `app/globals.css`.

## Casos para probar a mano
(se completa al final)
