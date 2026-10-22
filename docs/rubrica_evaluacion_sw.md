# Rúbrica de evaluación del software (91.EvaSw) aplicada a PaqRap

**Fuente:** `c1inf54.98.Eq2B.Eval.Sw_1.xlsx`, hoja `91.EvaSw`, columna «Sw en vivo». Es la plantilla del profesor Abraham Dávila, llenada para el equipo 2B de otro horario, evaluado el 20/10/2026 por Pedro Vega. Las notas de esa evaluación (columna H) **son de otro equipo**; aquí se citan solo como pista.
**Para qué sirve este archivo:** copiarlo en `docs/` del repositorio y dárselo a Claude Code como lista de requisitos.

## Cómo leer la rúbrica en PaqRap

La plantilla es genérica: varios ítems hablan de aeropuertos, vuelos y maletas. Equivalencias:

| Rúbrica | PaqRap |
|---|---|
| almacén principal / aeropuerto | almacén central (27, 14) |
| almacén de paso | almacenes intermedios Nor-Oeste y Este |
| unidad de transporte (UT) | auto, moto o bicicleta (TA, TM, TB) |
| envío / pedido | pedido (incluidas sus partes en entregas parciales) |
| producto / maleta | paquete del producto P |
| vuelo / cancelación | no aplica (los ítems de cancelaciones están marcados «No») |

**Semáforo + vacío** (hoja Datos, celda G24): se colorea por **carga u ocupación**. Vacío = sin carga; verde = poca carga (mucho espacio libre); ámbar = carga importante; rojo = mucha carga o lleno. Los rangos los define cada equipo, y en todos los escenarios debería poder filtrarse por esos colores, **incluido el vacío**.
> ⚠️ **Choque con nuestro diseño.** Hoy el color de un vehículo depende de la **holgura de plazo** de sus pedidos (62.std.gui §6; interaccion_componentes §3.5), y nuestro estándar prohíbe una cuarta categoría. La rúbrica pide colorear por **ocupación** y con **vacío**. Hay que decidirlo en equipo antes de programar. Opción sugerida: mantener el semáforo de plazo para los **pedidos** y agregar el semáforo de ocupación + vacío para **unidades y almacenes**.

**Elemento como no disponible** (hoja Datos, G23): controles deshabilitados, colapsados, recogidos u ocultos para que no estorben la vista del escenario.

## Leyenda del estado estimado

Estimado solo a partir del README de la solución, **sin ver el código ni probar el sistema**:
- ✔ parece cubierto
- ? hay que verificarlo
- ✘ probablemente falta

| Prioridad | Significado |
|---|---|
| **P1** | Ítem «Sí» que probablemente falta: corregir primero |
| **P2** | Ítem «Sí» por verificar o mejorar |
| **Op** | Opcional según la rúbrica |
| **Saber** | No es código: hay que saber explicarlo en la sesión |

---

## A. General (preguntas al equipo)

| Ítem | Qué piden | Estado | Prioridad |
|---|---|---|---|
| A10–A12 | Nombre del algoritmo planificador, nivel de avance y estudiantes asignados | GA (README §4) | Saber |
| A13–A15 | Tecnologías del visualizador, avance y estudiantes asignados | Next.js 15 + React 19, mapa SVG (README) | Saber |
| A16 | ¿Vieron el video de la simulación consumiendo datos? (nombres de quiénes sí y quiénes no) | — | Saber |
| A17 | Tiempo de ejecución del algoritmo, **Ta** | ? El README da «cómputo del planificador 0.38 s» para todo el 5D; falta saber cuánto toma cada ventana | Saber |
| A18 | Salto del algoritmo, **Sa** | ? Ventanas de 60 min simulados (README §4); confirmar en el código | Saber |
| A19 | Salto del eje del consumo, **Sc** | ? Confirmar en el código cada cuánto avanza el motor (la Corrida intenta avanzar cada 100 ms reales; interaccion_componentes §5) | Saber |
| A20–A21 | ¿Front y back desplegados? | Confirmar la URL de AWS | Saber |
| A22 | **Diagrama**: cómo se consumen los datos en bloques Sc por cada bloque Sa | ✘ No existe (al otro equipo le pusieron «Parcial» por esto) | P1 (diagrama) |
| A23 | **Diagrama**: cómo interactúan varios navegadores en la simulación del periodo; probar con más de 2 | ✘ El diagrama de interaccion_componentes no es específico; el otro equipo solo probó con 2 | P1 (diagrama) |

## B. Configuración

| Ítem | Qué piden | Estado | Prioridad |
|---|---|---|---|
| B01 | Explicar cómo se configura el mapa en la pantalla principal | ✔ | Saber |
| B04 | Establecer o actualizar los atributos de las UT (ubicación, capacidad…) | ? Parámetros avanzados tiene cantidades, capacidad, velocidad y costo. Al otro equipo le faltaban atributos; revisar si falta la ubicación o el estado | P2 |
| B05 | Atributos de los bloqueos de tramos (origen-destino, inicio y fin) | ✔ Archivo + bloqueo manual | Saber |
| B07–B09 | Atributos de las averías tipo 1, 2 y 3 | ✔ Archivo `##d##h##m:TTNN:tipo` y panel del vehículo | Saber |
| B11 | Atributos de los tramos que recorre la UT (origen, destino, horarios) | ? Al otro equipo le pusieron «Nada/Poco». Revisar si el panel del vehículo muestra cada tramo con su hora de salida y de llegada | P1 |
| B13 | Cómo se carga la data histórica y futura | ✔ 36 meses en el JAR, subida de archivos y `PAQRAP_DATOS_EXTERNOS` (README §7 y §9) | Saber |
| B14 | Fechas y horas usadas en las pruebas de la simulación del periodo | 01/09/2026 00:00; 30/09/2026 (2 archivos); colapso 01/03/2027 | Saber |
| B15 | ¿Se usan los datos sin reducir registros? | ✔ Según el README §9; confirmar | Saber |
| B16 | ¿La carga de datos distintos de las ventas es independiente de los escenarios? | ✔ probable | Saber |

## C. Mapa base (todos los escenarios)

| Ítem | Qué piden | Estado | Prioridad |
|---|---|---|---|
| C02 | El inicio pide fecha y hora a nivel de minuto | ✔ | — |
| C03–C04 | Tiempo hasta que se ve el mapa y hasta que se mueve el transporte | Medir | Saber |
| C05 | Otros visualizadores en distintos momentos y dispositivos | ? Al otro equipo le faltó que se vea bien en otro dispositivo (**responsive**) | P1 |
| C06 | Consultas independientes por visualizador | ✔ | — |
| C07 | Todo en español, sin mezclar con inglés | ? Revisar todos los textos | P2 |
| C08 | Zoom continuo y suave, no a saltos | ? Rueda del mouse; verificar suavidad | P2 |
| C09–C11 | Pantalla principal completa, todos los elementos a la vez, pantalla limpia | ✔ Mapa a pantalla completa y controles recogidos | — |
| **C12** | Fecha-hora **simulada** a nivel de minuto (5D y colapso) | ? Hoy: «martes 01 sep 2026» + «Día 1 de 5 · 00:00» | P1 |
| **C13** | Tiempo **transcurrido simulado** a nivel de minuto | ? | P1 |
| **C14** | Fecha-hora **actual** (momento presente) a nivel de minuto | ✘ No se muestra | P1 |
| **C15** | Tiempo **transcurrido real** hasta el momento actual | ? Existe «Tiempo real: hh:mm:ss»; revisar el formato | P1 |
| C16 | Los 4 datos de tiempo bien ubicados, del tamaño adecuado y con contraste | Depende de C12–C15 | P1 |
| C17–C20 | Almacenes en su lugar, con ícono idóneo en tamaño y forma y con contraste | ✔ probable | P2 |
| **C21** | Ícono del almacén coloreado con semáforo + **vacío** según su stock u ocupación | ? Hay semáforo de stock, sin vacío; revisar el sentido (ver el ⚠️ de arriba) | P1 |
| C22 | Stock del almacén en números o %, fijo o al pasar el mouse | ✔ | — |
| C23–C26 | UT en su lugar, con ícono idóneo y con contraste | ✔ probable | P2 |
| **C27** | Ícono de la UT coloreado con semáforo + **vacío** según su ocupación | ✘ Hoy el color es por holgura de plazo | P1 |
| **C28** | Ocupación de la UT en números o %, fija o al pasar el mouse | ? Está en el panel; revisar el tooltip | P1 |
| C29 | Desplazamiento fluido de las UT | ✔ Interpolación | — |
| **C30** | El ícono de la UT se orienta según la dirección del movimiento | ? | P2 |
| C31 | Línea del tramo origen-destino al inicio del recorrido | ? | P2 |
| C33 | Grosor y estilo adecuados de esa línea | ? | P2 |
| **C34** | La línea se borra o cambia de estilo después de recorrida (para no saturar la pantalla) | ? | P2 |

## D. Circunstancias (bloqueos y averías en el mapa)

| Ítem | Qué piden | Estado | Prioridad |
|---|---|---|---|
| D01–D04 | Cada bloqueo en el mapa, con color idóneo, contraste y visible solo durante su vigencia | ✔ probable | P2 |
| **D10–D13** | Cada avería **según su tipo 1, 2 o 3**: diferenciable, con color idóneo, contraste y visible el tiempo previsto | ✘ El README solo distingue operativo frente a averiado | P1 |

## E. Panel

| Ítem | Qué piden | Estado | Prioridad |
|---|---|---|---|
| E01 | Paneles contraídos al inicio, en ubicaciones idóneas | ✔ | — |
| **E02–E05** | **Lista de transporte**: todas las UT con ocupación en número o %, semáforo + vacío, y acceso a los pedidos y paquetes que lleva | ✘ No hay lista de UT | P1 |
| **E06–E07** | Buscar UT por distancia **en minutos** al destino y al origen (distinguir llegada y salida) | ✘ | P1 |
| **E13–E15** | Ordenar la lista de UT por ocupación, hora de salida y hora de llegada (ascendente y descendente) | ✘ | P1 |
| E08–E12, E16, E17 | Distancia en km, filtros por tipo, origen y semáforo, ordenar por distancia | ✘ | Op |
| **E18–E22** | **Lista de almacenes**: ocupación en número o %, semáforo + vacío, pedidos en tránsito, por salir en las siguientes x horas y entregados en las últimas x horas | ✘ No hay lista de almacenes | P1 |
| **E31** | **Lista de envíos**: destino, ruta, UT, cantidad, hora de salida y de llegada; si un pedido va en varias UT, todas sus rutas | ? La pestaña Pedidos tiene una tabla, pero sin ruta ni horas de salida y llegada, y fuera del mapa | P1 |
| E32–E33 | Filtro de pedidos entregados en las últimas 4 h y por entregar en las siguientes 4 h | ✘ | Op |

## F. Vinculación mapa-panel (en ambos sentidos)

| Ítem | Qué piden | Estado | Prioridad |
|---|---|---|---|
| **F01, F03** | Botón del panel que muestra en el mapa la ruta de un paquete o pedido por su ID | ? La búsqueda centra el mapa; falta dibujar la ruta | P1 |
| F02, F04 | Ruta anterior con sus escalas | — | Op |
| **F05–F06** | Seleccionar un almacén en el panel enfoca el mapa, y viceversa | ✘ Depende de la lista de almacenes | P1 |
| **F07–F08** | Seleccionar una UT en el panel enfoca el mapa, y viceversa | ✘ Depende de la lista de UT | P1 |
| **F09** | Seleccionar un envío en el panel enfoca el almacén o la UT en el mapa | ✘ Depende de la lista de envíos | P1 |
| **F15–F16** | Filtrar por semáforo (incluido vacío) almacenes y UT en el panel, con efecto en el mapa | ✘ Hoy hay filtros «solo críticos» y por tipo | P1 |
| F17–F18 | Otros filtros de almacenes y de UT con efecto en el mapa | ? El filtro por tipo podría cubrir F18 | Op |

## G. Cierre e indicadores globales

| Ítem | Qué piden | Estado | Prioridad |
|---|---|---|---|
| **G01–G02** | Indicador global de **ocupación de la flota** en conjunto, como semáforo | ✘ El KPI muestra flota activa/total, no ocupación | P1 |
| **G03–G04** | Indicador global de **ocupación de los almacenes** en conjunto, como semáforo | ? Hay KPI de stock por almacén intermedio; falta el global como semáforo | P1 |
| G05 | Tiempo de permanencia mínima de las maletas en los aeropuertos | No tiene equivalente directo en PaqRap; preguntar | Saber |
| G06 | Al menos 2 navegadores en 2 dispositivos, con interacción independiente, para un único planificador en 5D | ✔ Probar con 3 o más | P2 |
| **G08–G10** | Reporte de la **última planificación estable** al terminar el 5D, al cerrar el día a día y al terminar el colapso | ? El Cierre muestra indicadores; revisar que muestre el plan (rutas vigentes) | P1 |
| G11–G18 | Percepción global: completo, apropiado, claro, factible, fortalezas y mejoras | — | — |

---

## Orden sugerido de trabajo

1. **Decisión de equipo:** semáforo de ocupación + vacío para UT y almacenes (ver el ⚠️).
2. **Encabezado de tiempos (C12–C16):** cambio pequeño, solo del frontend.
3. **Colores por ocupación + vacío** en el mapa (C21, C27, C28) y **averías por tipo** (D10–D13).
4. **Panel con 3 listas**: transporte, almacenes y envíos (E02–E07, E13–E15, E18–E22, E31). Es el bloque más grande y puede necesitar campos nuevos en la API.
5. **Vinculación mapa ↔ panel y filtros por semáforo** (F01, F03, F05–F09, F15, F16).
6. **Indicadores globales de ocupación** (G01–G04) y **reporte de la última planificación** (G08–G10).
7. **P2:** responsive (C05), textos en español (C07), orientación del ícono y líneas recorridas (C30–C34), atributos de las UT (B04) y tramos con horarios (B11).
8. **Diagramas A22 y A23** y la preparación de las respuestas «Saber» (Ta, Sa y Sc).
