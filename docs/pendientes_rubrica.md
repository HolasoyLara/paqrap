# Pendientes de la rúbrica (91.EvaSw)

Guía: [auditoria_rubrica.md](auditoria_rubrica.md) (archivos y líneas) y [rubrica_evaluacion_sw.md](rubrica_evaluacion_sw.md).
Cada fase termina con `npm run typecheck` (frontend), `mvnw -q -DskipTests compile` (si se tocó el backend) y un commit «Rúbrica fase N: …».

> **Importante:** compile y pruebe el backend con `mvnw -q clean test` (o `clean compile`). Sin `clean`, la extensión Java de VS Code puede dejar clases a medio compilar en `target/` y ocultar errores reales o provocar fallos falsos («Unresolved compilation problem»).

Estado: ⬜ pendiente · 🔄 en curso · ✅ hecho

| Fase | Ítems | Estado |
|---|---|---|
| 1. Solo frontend: tiempos, semáforo de ocupación, KPI globales, tramos, español | C12–C16, C21, C27, C28, G01–G04, B11, C07 | ✅ |
| 2. Backend + frontend: averías por tipo y horarios de la UT | D10–D13 (+ datos para E06, E13) | ✅ |
| 3. Panel izquierdo: pestaña Transporte, filtros de semáforo, rutas de pedido | E01–E07, E13–E15, F01, F03, F07, F08, F15, F16 | ✅ |
| 4. Pestañas Almacenes y Envíos | E18–E22, E31, F05, F06, F09 | ✅ |
| 5. Cierre con la última planificación | G08–G10 | ✅ |
| 6. Mejoras P2 (si hay tiempo) | C30, C08, C05 | ✅ |

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

### Fase 2 ✅
Hecho:
- `EstadoVisual.java`: `VehiculoVisual` + `tipoAveria`, `finAveriaMin`, `salidaMin`, `llegadaProximaMin`, `regresoMin` y `pedidosCarga` (nuevo record `CargaPedido{id, cantidad}`). Solo se agregaron campos al final.
- `MotorSimulacion.construirEstadoVisual`: los llena desde `vs.getAveria()` y la ruta en curso (sin tocar la simulación).
- `tipos.ts`: los mismos campos.
- `MapaOperacion.tsx`: `InsigniaAveria` (insignia con número, tipo 1 amarillo, 2 naranja, 3 morado) mientras está AVERIADA; `InsigniaTaller` (llave) en EN_TALLER.
- Leyenda con los 3 tipos y el taller; tooltip «Avería tipo N · hasta dd/mm/aaaa hh:mm».

### Fase 3 ✅
Hecho:
- `PanelListas.tsx` (nuevo): panel izquierdo plegable con las pestañas Transporte, Almacenes y Envíos. Se abre con el botón «Panel» del mapa y empieza recogido (E01).
  - **Transporte**: ícono, ID, ocupación n/cap (%), píldora, estado (con chip de avería), pedidos a bordo desplegables con su cantidad, «Llega a destino en» y «Salió del origen hace» (E02–E07).
  - Búsqueda «llega en ≤ N min» / «salió hace ≤ N min»; orden ascendente o descendente por unidad, ocupación, hora de llegada y hora de salida (E13–E15).
  - Clic en la fila → centra el mapa en la posición interpolada y selecciona la unidad (F07). Clic en el mapa → el panel cambia a la pestaña correspondiente y resalta y desplaza la fila (F08).
- `MapaOperacion.tsx`: `Filtros.semaforoUT` y `Filtros.semaforoAlmacen` (F15–F16), aplicados al mapa y a las listas; `vehiculoPasaFiltro`, `almacenPasaFiltro` y `vehiculosDePedido`; al seleccionar un pedido se resaltan las rutas de TODAS sus unidades (F01/F03).
- `PantallaPanorama.tsx`: `enfocar(x, y)`, casillas de semáforo también en «Filtros» y prop `foco`.
- `ModalDetalle.tsx` + `page.tsx`: botón «Ver ruta en el mapa» en el detalle del pedido (cambia a Panorama, centra y resalta, aunque se venga de la pestaña Pedidos); muestra `rutas`.
- Limitación: si el pedido aún no tiene unidad, solo se centra el destino (no se dibuja la línea desde el almacén).

### Fase 4 ✅
Hecho:
- `EstadoVisual.java`:
  - `AlmacenVisual` + `pedidosEnTransito`, `porSalir` y `entregados` (records `PedidoHora{pedido, minuto}`);
  - `PedidoVisual` + `partes` (record `ParteVisual{id, vehiculo, ruta, almacen, cantidad, salidaMin, llegadaMin, estado}`). Solo se agregaron campos.
- `MotorSimulacion.java`: los llena en `construirEstadoVisual`. Para «entregados» se agregó un registro solo de salida (`entregasRecientes`, últimas 24 h), alimentado en `entregar()`; no cambia la simulación.
- `PanelListas.tsx`:
  - **Almacenes**: ocupación n/cap (%), píldora, en tránsito, por salir en las próximas x h y entregados en las últimas x h (selector 1/2/4/8 h); el central dice «Sin límite»; detalle desplegable con los pedidos. Clic → centra y abre el detalle (F05); clic en el mapa → resalta la fila (F06).
  - **Envíos**: una fila por pedido activo (destino, paquetes, semáforo de plazo, estado, unidades) que se despliega por parte (unidad, ruta, almacén → destino, cantidad, salida y llegada). Clic → centra la unidad que lo lleva o, si está pendiente, el destino (F09).
- Detalle del pedido: muestra `partes` y `rutas` (fase 3).
- Limitaciones:
  - un pedido pendiente aún no tiene almacén de origen (lo decide el planificador), así que F09 centra el destino;
  - la lista de envíos muestra solo los pedidos activos (los entregados están en la pestaña Pedidos), hasta 300 filas, con buscador.

### Fase 5 ✅
Hecho:
- `CierreCorrida.java`: nuevo campo al final `ultimaPlanificacion` (`UltimaPlanificacion{fecha, causa, rutas}`, `RutaVigente`, `ParadaPlan`).
- `MotorSimulacion.java`: guarda la hora y la causa de la última llamada a `planificar()` (solo como salida) y `ultimaPlanificacion()` arma las rutas vigentes en `generarCierre`. Sirve igual para 5D, día a día (al detener) y colapso.
- `ReportesCsv.java`: sección «Ultima planificacion estable» en el CSV del cierre (tolera cierres antiguos sin el campo).
- `PantallaCierre.tsx`: sección «Última planificación estable (fecha simulada)» con una tabla por unidad: ruta, salida, paradas pendientes con llegada y regreso.

### Fase 6 ✅
Hecho:
- C30, `MapaOperacion.tsx` (`orientacionGlifo`): el glifo de la UT (no el círculo) se voltea cuando va hacia la izquierda y gira ±90° en los tramos verticales; se actualiza en cada cuadro. Se asume que el glifo original «mira» a la derecha; si en pantalla se ve al revés, invertir `scale(-1,1)` (moverlo al caso `dx > 0`).
- C08: zoom con la rueda proporcional a `deltaY` (`Math.exp(delta*0.0015)`, que equivale a la fórmula del enunciado aplicada al ancho visible) y animación de 150 ms con desaceleración; los pasos seguidos se acumulan.
- C05:
  - zoom con pellizco (dos punteros) en el mapa;
  - por debajo de 820 px, el detalle pasa a hoja inferior del 50 % de alto;
  - el panel de listas, el reloj 2×2 y los KPIs globales se reacomodan.

## Verificación hecha (22/10/2026)
- `npm run typecheck` y `npx next build` sin errores.
- `mvnw -q clean test`: 17 pruebas, 0 fallos, 1 omitida (la de exploración, como antes).
- **No se probó en el navegador**: los casos de abajo están pendientes de revisión manual.

## Lo que falta (para otra persona)
1. **Probar a mano** todos los casos de abajo y corregir lo visual (tamaños o solapes en pantallas pequeñas).
2. **Recompilar el JAR** con `COMPILAR.bat` (o `scripts/linux/compilar.sh`) antes de desplegar: el `dist/paqrap-app.jar` actual no tiene estos cambios.
3. **F09 con pedido pendiente**: hoy centra el destino porque el almacén de origen se decide al planificar. Si se quiere centrar «el almacén probable», usar el almacén con stock más cercano (`estado.almacenes`) en `ListaEnvios.enfocarPedido` (`PanelListas.tsx`).
4. **F01 para pedidos sin unidad**: no se dibuja la línea almacén → destino. Se haría en `MapaOperacion.tsx` dibujando una línea discontinua cuando `seleccion.tipo === 'pedido'` y `vehiculosDePedido(...)` está vacío.
5. **B04** (atributos por unidad en Parámetros): no se hizo; preparar la explicación de que se configuran por tipo.
6. **C07**: quedan textos técnicos en Parámetros y en algunos mensajes del backend (errores de validación). Revisar con la app abierta.
7. **Diagramas A22 y A23** (ver los datos de Sa, Sc y Ta en [auditoria_rubrica.md](auditoria_rubrica.md)): no se hicieron.

## Casos para probar a mano
Iniciar una corrida 5D (01/09/2026 00:00) y abrir Panorama.
1. **Encabezado**: se ven los 4 tiempos rotulados al minuto; «Transcurrido simulado» avanza unas 2,7 h por cada minuto real a ×160; «Fecha y hora actual» coincide con el reloj de Lima.
2. **KPIs globales**: «Ocupación de flota» y «Ocupación de almacenes» se ven en todas las pestañas y cambian de color.
3. **Colores**: una UT en el almacén se ve **vacía** (blanca con borde gris oscuro); al cargar pasa a verde, ámbar o rojo según n/cap. Los almacenes intermedios bajan de color al despachar y suben al recargar a las 23:59:59. El central queda azul con «sin límite».
4. **Urgencia**: aparece un punto ámbar o rojo en la esquina de una UT que lleva un pedido en riesgo; el tooltip dice «Urgencia de plazo».
5. **Averías**: en el detalle de una UT en ruta, «Tipo 1/2/3» → la UT se pone gris con la insignia 1 (amarilla), 2 (naranja) o 3 (morada); el tooltip dice «Avería tipo N · hasta …». Con «Mostrar unidades en almacén», la UT en taller muestra la llave.
6. **Bloqueos**: se ven en magenta y la leyenda coincide.
7. **Panel → Transporte**:
   - ordenar por Ocupación, Llega y Salió (▲/▼);
   - escribir 30 en «Llega a destino en ≤» filtra la lista;
   - desplegar ▸ muestra los pedidos con su cantidad;
   - clic en una fila centra el mapa en la UT y abre su detalle; clic en una UT del mapa resalta su fila.
8. **Filtros de semáforo**: desmarcar «Vacío» oculta las UT vacías en la lista **y** en el mapa; lo mismo para almacenes (pestaña Almacenes o «Filtros»).
9. **Panel → Almacenes**: cambiar 1/2/4/8 h cambia «por salir» y «entregados»; clic centra el almacén y abre su detalle; clic en el almacén del mapa resalta la fila.
10. **Panel → Envíos**: buscar un pedido; desplegar sus partes (unidad, ruta, salida y llegada); clic centra la UT que lo lleva.
11. **Ver ruta en el mapa**: desde la pestaña Pedidos, abrir un pedido dividido (sufijos -1, -2) → «Ver ruta en el mapa» → va a Panorama, centra y resalta las rutas de **todas** sus unidades.
12. **Detalle de la UT**: sección «Tramos de la ruta» con origen → destino, «sale» y «llega».
13. **Cierre**: detener la corrida → sección «Última planificación estable (fecha)» con las rutas vigentes; el CSV trae la misma sección. Repetir con colapso y con día a día.
14. **Zoom y móvil**: la rueda acerca de forma suave; en un celular (o en las herramientas de desarrollador a 375 px), el pellizco hace zoom y el detalle aparece como hoja inferior.
15. **Varios navegadores (G06/A23)**: abrir 3 o más dispositivos; cada uno tiene su propio panel, filtros y zoom.
