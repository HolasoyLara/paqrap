# Guía para armar el CPA (`41.acs.catalog.pruebas.acept.v01.pdf`)

Esta guía es para el equipo: explica **qué poner en el PDF** del Catálogo de Pruebas de Aceptación (CPA) de la semana 10.
El PDF debe subirse al repositorio con el nombre `41.acs.catalog.pruebas.acept.v01.pdf`. El requisito del curso es que
**los casos de prueba estén derivados usando, al menos, clases de equivalencia**. Todo lo de abajo ya está calculado con los
valores reales del sistema; solo hay que pasarlo al formato del documento del curso (si el curso da plantilla, úsenla y
traspasen estas tablas a ella).

> Los valores límite y mensajes de esta guía salen del código y de las pruebas automáticas del repositorio
> (`ReglasCursoTest`, `MotorSimulacionTest`, `ApiIntegracionTest`) y del documento de Preguntas y Respuestas.
> Antes de entregar, **ejecuten cada caso en el sistema desplegado** y anoten el resultado real en la columna «Resultado».

---

## 1. Estructura sugerida del PDF

1. **Portada**: nombre del documento, versión v01, curso 1INF54 2026-2, equipo 1A, integrantes y fecha.
2. **Introducción**: objetivo del CPA y alcance (el visualizador y el servicio de simulación PaqRap).
3. **Entorno de prueba**: URL del sistema desplegado en AWS, navegador usado, fecha y versión (commit) de la solución.
4. **Método**: explicar que los casos se derivan con **partición en clases de equivalencia** (y valores límite como refuerzo).
5. **Catálogo de casos** (sección 3 de esta guía), agrupado por función.
6. **Matriz de trazabilidad**: caso de prueba → requisito de la Lista de Exigencias (columna «Req.»).
7. **Resumen de resultados**: cantidad de casos ejecutados, aprobados y fallidos.
8. **Anexos**: capturas de pantalla de los casos más importantes.

### Formato de cada caso (una fila de tabla)

| Campo | Qué escribir |
|---|---|
| **ID** | `CP-xx` correlativo |
| **Función** | pantalla o funcionalidad (Parámetros, Panorama, Pedidos, Cierre, Averías, Archivos…) |
| **Clase de equivalencia** | `V1`, `V2`… (válida) o `I1`, `I2`… (inválida), con su descripción |
| **Entrada** | datos exactos que se ingresan |
| **Resultado esperado** | lo que debe hacer o mostrar el sistema |
| **Req.** | código de la Lista de Exigencias (p. ej. A13, B22, C10, D7) |
| **Resultado** | Aprobado / Fallido + fecha (se llena al ejecutar) |

**Regla para derivar casos:** por cada variable de entrada, se listan sus clases válidas e inválidas; se escribe **un caso por
cada clase inválida** (para no mezclar errores) y **uno o más casos que cubran varias clases válidas a la vez**.

---

## 2. Clases de equivalencia por variable de entrada

### 2.1 Pedido nuevo (pantalla Pedidos o clic en el mapa en «Operación día a día»)

| Variable | Clases válidas | Clases inválidas |
|---|---|---|
| Coordenada X | V1: entero de 0 a 70 | I1: menor que 0 · I2: mayor que 70 |
| Coordenada Y | V2: entero de 0 a 50 | I3: menor que 0 · I4: mayor que 50 |
| Cantidad de paquetes | V3: entero de 1 a 1000 | I5: 0 o negativo · I6: mayor que 1000 |
| Tipo de entrega | V4: Regular 36 h · V5: Priorizada 4 h · V6: 8 h · V7: 12 h · V8: 18 h | I7: tipo inexistente (solo por API) |
| Escenario | V9: «Operación día a día» (acepta registro manual) | I8: «Simulación 5D» o «Colapso» (no admite registro manual) |

Valores límite que conviene probar: X = 0, 70 · Y = 0, 50 · cantidad = 1, 1000, y los inválidos contiguos −1, 71, 51, 0, 1001.

### 2.2 Parámetros de la corrida

| Variable | Clases válidas | Clases inválidas |
|---|---|---|
| Escenario | V1: Simulación 5D · V2: Día a día · V3: Colapso logístico | — (lista cerrada) |
| Fecha de inicio | V4: fecha con archivos de ventas disponibles (2026-01 a 2028-12) · V5: fecha que cruza de mes (p. ej. 30/09) con 2 archivos subidos | I1: mes sin archivo de ventas · I2: día del periodo sin pedidos (el sistema **advierte**) |
| Duración objetivo (min reales) | V6: 30 a 60 | I3: menor que 30 · I4: mayor que 60 (el sistema corrige al rango) |
| Días del periodo | V7: 1 a 30 (por defecto 5) | I5: 0 o mayor que 30 |
| Umbrales del semáforo | V8: verde ≥ ámbar, ambos entre 0 y 100 | I6: verde menor que ámbar · I7: fuera de 0–100 |

### 2.3 Archivos de entrada

| Archivo | Clases válidas | Clases inválidas |
|---|---|---|
| Ventas `##d##h##m:x,y,cliente,cantidad,plazo` | V1: línea con formato correcto dentro de la ciudad (ej. `11d13h31m:45,43,c9167,12,36`) · V2: dos archivos de meses distintos a la vez | I1: formato distinto (falta un campo, separador erróneo) · I2: coordenada fuera de 0–70 / 0–50 · I3: archivo vacío |
| Bloqueos `##d##h##m-##d##h##m:x1,y1,x2,y2,…` | V3: poligonal abierta con inicio y fin (ej. `01d06h00m-01d15h00m:31,21,34,21`) | I4: línea sin fin · I5: coordenadas fuera de la ciudad |
| Mantenimiento `aaaammdd:TTNN` | V4: `20260901:TA01` | I6: `2026-09-02:TB01` (formato de fecha distinto) · I7: día inexistente (`20260931:TA01`) |

Comportamiento esperado ante líneas inválidas: se **informan como error** (con número de línea y motivo) y solo se conservan
las líneas válidas; si el archivo no trae ninguna válida, no se usa.

### 2.4 Averías (se registran desde el vehículo en el visualizador)

| Variable | Clases válidas | Clases inválidas |
|---|---|---|
| Tipo de avería | V1: Tipo 1 (2 h en el lugar y continúa) · V2: Tipo 2 (4 h en el lugar; disponible al fin del turno siguiente) · V3: Tipo 3 (4 h en el lugar; fuera mínimo 2 días; vuelve en el turno 15:00–23:00) | I1: tipo distinto de 1, 2 o 3 (solo por API) |
| Estado de la unidad | V4: en ruta con pedidos · V5: en almacén sin carga | I2: unidad ya averiada (no se registra otra avería encima) |
| Momento | V6: durante un turno · V7: cerca del cambio de turno (07:00, 15:00, 23:00) | — |

Resultado esperado para Tipo 2 y 3 con carga: los pedidos a bordo se **vuelven a planificar** (transbordo) y se registran en la
trazabilidad del pedido; el mapa muestra el vehículo averiado en gris.

### 2.5 Flota y jornada

| Variable | Clases válidas | Clases inválidas |
|---|---|---|
| Tipo de vehículo | V1: Auto (capacidad 24) · V2: Moto (8) · V3: Bicicleta (4) | — |
| Pedido frente a la capacidad | V4: cantidad ≤ capacidad (una sola unidad) · V5: cantidad > capacidad (entrega parcial en varias unidades, 1 h de acondicionamiento por entrega) | — |
| Hora del día (alimentación) | V6: antes de la pausa (no se muestran horas de alimentación) · V7: después de la pausa (se muestra la pausa ya realizada) | — |
| Mantenimiento preventivo | V8: unidad con mantenimiento ese día (fuera de 00:00 a 23:59) · V9: sin mantenimiento | — |

---

## 3. Catálogo de casos de prueba (puntos de partida)

> Estos son los casos mínimos. Pueden agregar más; la tabla debe quedar con **al menos un caso por clase** (válida o inválida).
> La columna «Resultado» se completa al ejecutar.

### 3.1 Parámetros y archivos

| ID | Clase | Entrada | Resultado esperado | Req. |
|---|---|---|---|---|
| CP-01 | V1 + V4 | Escenario 5D, inicio 01/09/2026 00:00, archivos publicados | Los archivos aparecen «Validado» y el botón *Iniciar corrida* se habilita | A9 |
| CP-02 | I2 | Escenario 5D, inicio 30/09/2026 con los datos publicados | Aparece la advertencia «Sin pedidos el 30/09…» | A9 |
| CP-03 | V5 | Mismo inicio 30/09 y subir 2 archivos de ventas (septiembre y octubre) a la vez | Ambos se validan; la advertencia desaparece; la descripción muestra los pedidos de los 5 días | A9 |
| CP-04 | I3 | Duración objetivo = 20 | El sistema usa 30 (límite inferior) | B22 |
| CP-05 | I4 | Duración objetivo = 90 | El sistema usa 60 (límite superior) | B22 |
| CP-06 | V8 | Umbral verde 50 y ámbar 20 | La corrida usa esos umbrales en el semáforo | C10 |
| CP-07 | I6 | Verde 20 y ámbar 50 | El sistema corrige: ámbar no puede superar a verde | C10 |
| CP-08 | I1 | Línea de ventas con un campo faltante | Se informa «línea con formato inválido»; se omite esa línea | A9 |
| CP-09 | I2 | Línea de ventas con `x = 71` | Se informa error de cobertura; se omite | A13 A17 |
| CP-10 | V3 | Línea de bloqueos `01d06h00m-01d15h00m:31,21,34,21` | Se acepta; el tramo aparece bloqueado en el mapa entre 06:00 y 15:00 del día 1 | D6 |
| CP-11 | I6 | Mantenimiento con `2026-09-02:TB01` | Se informa error de formato | D6 |

### 3.2 Pedidos

| ID | Clase | Entrada | Resultado esperado | Req. |
|---|---|---|---|---|
| CP-12 | V1, V2, V3, V4, V9 | X=30, Y=20, 5 paquetes, Regular 36 h, día a día | Pedido registrado con ID; se asigna a una unidad disponible | A1 A2 A3 |
| CP-13 | V1/V2 límites | X=0, Y=0 y X=70, Y=50, 1 paquete | Ambos se aceptan | A13 |
| CP-14 | I2 | X=71 | Rechazo: «fuera de la zona de cobertura» | A13 |
| CP-15 | I4 | Y=51 | Rechazo: «fuera de la zona de cobertura» | A13 |
| CP-16 | I1, I3 | X=−1 o Y=−1 | Rechazo: fuera de cobertura | A13 |
| CP-17 | I5 | Cantidad = 0 | Rechazo: «la cantidad debe estar entre 1 y 1000» | A13 A17 |
| CP-18 | I6 | Cantidad = 1001 | Rechazo: mismo mensaje | A13 A17 |
| CP-19 | V5–V8 | Un pedido de cada tipo priorizado (4, 8, 12 y 18 h) | El plazo mostrado coincide con el tipo | D10 |
| CP-20 | I8 | Intentar registrar un pedido con escenario 5D | No se permite el registro manual | B18 B19 B20 |
| CP-21 | V4 | Pedido de 3 paquetes asignado a una bicicleta | Se entrega en una sola unidad | B6 B7 |
| CP-22 | V5 | Pedido de 30 paquetes | Se divide en entregas parciales; cada entrega cuenta 1 h de acondicionamiento | A4 A22 B7 |
| CP-23 | — | Editar un pedido **antes** del despacho | Se actualiza | A6 |
| CP-24 | — | Cancelar un pedido antes del despacho | Queda «Cancelado» | A7 |
| CP-25 | — | Editar un pedido **ya despachado** | No se permite | A6 |

### 3.3 Mapa, panel lateral y semáforos

| ID | Clase | Entrada | Resultado esperado | Req. |
|---|---|---|---|---|
| CP-26 | — | Abrir Panorama con la corrida en curso | El mapa ocupa toda la pantalla; métricas, leyenda y filtros están recogidos al inicio | C1 C2 C16 |
| CP-27 | — | Pasar el mouse sobre un almacén intermedio | Muestra stock en números y %, semáforo, unidades en el almacén y unidades que arriban | C7 C8 C9 C10 (criterios 7, 8 y 11 de la rúbrica) |
| CP-28 | — | Clic en un vehículo | Se abre el **panel lateral** (no tapa el mapa) con carga, ruta y pedidos | C17 C18 C19 (panel lateral, rúbrica del mapa) |
| CP-29 | V6 | Abrir un vehículo antes de su hora de comida | No aparece la fila «Pausa de alimentación» | D4 D5 |
| CP-30 | V7 | Abrir el mismo vehículo después de su hora de comida | Aparece la pausa ya realizada con fecha y hora | D4 D5 |
| CP-31 | — | Vehículo con 2 o más pedidos | Una tarjeta por pedido, en orden de entrega, con la parada actual resaltada | C18 (rúbrica del mapa) |
| CP-32 | — | Clic en un tramo de calle | Se bloquea manualmente; al repetir, se reabre; las rutas afectadas se recalculan | D6 |
| CP-33 | — | Cambiar umbrales con la corrida en curso | El color de los pedidos cambia desde la siguiente actualización | C10 |

### 3.4 Averías y mantenimiento

| ID | Clase | Entrada | Resultado esperado | Req. |
|---|---|---|---|---|
| CP-34 | V1, V4 | Avería Tipo 1 a un vehículo en ruta | Se detiene 2 h y luego continúa con su carga | D7 |
| CP-35 | V2, V4 | Avería Tipo 2 a un vehículo con pedidos | Se queda hasta 4 h en el lugar; los pedidos se replanifican; vuelve al fin del turno siguiente | D7 |
| CP-36 | V3, V4 | Avería Tipo 3 a un vehículo con pedidos | Fuera mínimo 2 días; vuelve en el turno 15:00–23:00; pedidos replanificados | D7 |
| CP-37 | V5 | Avería a un vehículo en el almacén | Queda no disponible según el tipo; no hay pedidos afectados | D7 |
| CP-38 | I2 | Avería a una unidad ya averiada | No se registra otra avería encima | D7 |
| CP-39 | V8 | Unidad con mantenimiento programado ese día | No recibe rutas de 00:00 a 23:59 | P19 (Preguntas y Respuestas) |

### 3.5 Cierre y reportes

| ID | Clase | Entrada | Resultado esperado | Req. |
|---|---|---|---|---|
| CP-40 | — | Terminar una simulación 5D del 01/09 | Pestaña Cierre con cumplimiento, costo, kilómetros por tipo, utilización de flota e incidencias | D15–D19 |
| CP-41 | — | Exportar el cierre a CSV | Se descarga un CSV con los datos del cierre | D22 |
| CP-42 | — | Verificar la política de entrega | Indica si todos los pedidos entregados llegaron dentro de su plazo | D25 |
| CP-43 | — | Detener una corrida manualmente | Se guarda el cierre y aparece en el historial de corridas | D24 |

### 3.6 Desempeño de la simulación del periodo (para la evaluación de la semana 10)

| ID | Entrada | Resultado esperado | Req. |
|---|---|---|---|
| CP-44 | Simulación 5D desde el 01/09/2026, 45 min objetivo, algoritmo GA | Avanza ×160; termina en ~45 min reales; cumplimiento alto (referencia: 795 pedidos, ~100 %) | B22 C13 |
| CP-45 | Simulación 5D desde el 30/09/2026 con los 2 archivos subidos | Corre los 5 días cruzando de mes sin error; todos los días tienen pedidos | A9 B22 |
| CP-46 | Colapso logístico desde 01/03/2027 | Se detiene sola al detectar el colapso y lo informa con fecha y motivo | B24 C14 |

---

## 4. Qué entregar y cómo

1. Armar el PDF con las secciones de la 1 (estructura) y las tablas de la 3 completadas con el **resultado real**.
2. Agregar capturas para al menos: CP-03, CP-26/27/28, CP-31, CP-35 y CP-44.
3. Guardarlo como `41.acs.catalog.pruebas.acept.v01.pdf` y subirlo al repositorio.
4. Si algún caso falla, **no lo borren**: regístrenlo como «Fallido» con la observación; es mejor mostrarlo que ocultarlo.

> Nota: los códigos de requisito (A, B, C, D) se tomaron de la trazabilidad del README (sección 12). Confirmen cada uno contra la
> Lista de Exigencias v02 oficial y corrijan la columna «Req.» donde difiera; los casos del mapa se apoyan además en los criterios
> de la rúbrica de la profesora.
