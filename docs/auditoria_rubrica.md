# Auditoría del código frente a la rúbrica 91.EvaSw (ítems P1 y P2)

**Fecha:** 22/10/2026
**Base:** [rubrica_evaluacion_sw.md](rubrica_evaluacion_sw.md) y [README.md](../README.md), contrastados con el código de `backend/` y `frontend/`. No se ejecutó el sistema: todo sale de leer el código.
**Alcance:** solo los ítems marcados **P1** y **P2** en la rúbrica. No se modificó ningún archivo.

Leyenda: ✔ **Cubierto** · ◐ **Parcial** · ✘ **Falta**

Columna «Capa»: **F** = basta con cambiar el frontend (los datos ya llegan en `GET /api/simulacion/estado`); **B+F** = hace falta agregar campos o servicios en el backend.

---

## Resumen

| Ítem | Prio | Estado | Capa | En una línea |
|---|---|---|---|---|
| A22 | P1 | ✘ | Doc | No hay diagrama de consumo Sc por bloque Sa |
| A23 | P1 | ✘ | Doc | No hay diagrama de varios navegadores |
| B04 | P2 | ◐ | F (+B) | Se configuran atributos por **tipo**, no por unidad (ubicación, estado) |
| B11 | P1 | ◐ | F | El panel del vehículo lista paradas con su llegada, pero no tramos con salida y llegada |
| C05 | P1 | ◐ | F | Hay media queries, pero sin zoom táctil y el panel tapa el mapa en móvil |
| C07 | P2 | ◐ | F (+B) | Casi todo en español; quedan «ETA», «Stock», «KPI» y enums crudos |
| C08 | P2 | ◐ | F | El zoom va a saltos de ×1.15, sin animación |
| C12 | P1 | ◐ | F | Fecha y hora simuladas al minuto, pero partidas en dos textos y sin rótulo |
| C13 | P1 | ✘ | F | No se muestra el tiempo simulado transcurrido |
| C14 | P1 | ✘ | F | No se muestra la fecha y hora actual |
| C15 | P1 | ◐ | F | Existe «Tiempo real: hh:mm:ss», con rótulo ambiguo |
| C16 | P1 | ◐ | F | Depende de C12–C15 |
| C17–C20 | P2 | ✔ | — | Almacenes con ícono de edificio, tamaño fijo en pantalla y contraste |
| C21 | P1 | ◐ | F | Semáforo por stock, sin «vacío», con el sentido invertido y los umbrales del plazo |
| C23–C26 | P2 | ✔ | — | Íconos de auto, moto y bicicleta, con contraste |
| C27 | P1 | ✘ | F | El color de la UT depende de la holgura de plazo, no de la ocupación |
| C28 | P1 | ◐ | F | El tooltip muestra «carga / capacidad» sin %, y sin color de ocupación |
| C30 | P2 | ✘ | F | El ícono no gira según la dirección |
| C31, C33 | P2 | ✔ | — | Ruta punteada con grosor distinto si está seleccionada |
| C34 | P2 | ✔ | — | El tramo ya recorrido se recorta |
| D01–D04 | P2 | ✔ | — | Bloqueos vigentes en rojo; ver la observación sobre el color |
| D10–D13 | P1 | ✘ | B+F | Las averías no se distinguen por tipo en el mapa |
| E02–E05 | P1 | ✘ | F (+B) | No hay lista de UT |
| E06–E07 | P1 | ✘ | B+F | Faltan minutos al destino y desde el origen |
| E13–E15 | P1 | ✘ | B+F | No se puede ordenar (no hay lista ni horas de salida y llegada) |
| E18–E22 | P1 | ✘ | B+F | No hay lista de almacenes ni conteos de pedidos por almacén |
| E31 | P1 | ◐ | B+F | La tabla de Pedidos no tiene ruta ni horas de salida y llegada, y está fuera del mapa |
| F01, F03 | P1 | ◐ | F | Buscar un pedido centra el mapa y resalta la ruta del **primer** vehículo; no hay botón «ver ruta» |
| F05–F06 | P1 | ◐ | F | Mapa → panel sí; panel → mapa no |
| F07–F08 | P1 | ◐ | F | Mapa → panel sí; panel → mapa no |
| F09 | P1 | ✘ | F | Seleccionar un envío no enfoca el mapa |
| F15–F16 | P1 | ✘ | F | No hay filtro por semáforo (ni «vacío») para UT ni almacenes |
| G01–G02 | P1 | ✘ | F | No hay indicador global de ocupación de la flota |
| G03–G04 | P1 | ◐ | F | Hay KPI de stock por almacén; falta el global como semáforo |
| G06 | P2 | ✔ | — | La arquitectura lo permite; falta probarlo con 3 o más navegadores |
| G08–G10 | P1 | ◐ | F (+B) | El Cierre no muestra la última planificación (rutas vigentes) |

**Conteo (36 filas):** 6 cubiertos · 16 parciales · 14 faltan.

---

## Decisión previa (bloquea C21, C27, C28, E04, E20, F15, F16, G01–G04)

El ⚠️ de la rúbrica sigue vigente en el código:

- [MapaOperacion.tsx:82-86](../frontend/components/MapaOperacion.tsx#L82-L86) colorea la UT con `holguraMinima` (plazo).
- [formato.ts:38-42](../frontend/lib/formato.ts#L38-L42) `semaforo()` asume que **más es mejor** (≥ verde → verde). Para ocupación es al revés: más carga → rojo.
- Los umbrales `umbralVerde` y `umbralAmbar` son los del plazo; no hay umbrales de ocupación.

**Propuesta:** crear en `formato.ts` una función `semaforoOcupacion(pct)` que devuelva `'vacio' | 'verde' | 'ambar' | 'rojo'` con umbrales propios (por ejemplo, 0 % = vacío, < 50 % verde, < 85 % ámbar y el resto rojo), más un color gris claro o un contorno sin relleno para «vacío». Conviene que los umbrales sean configurables en Parámetros (se agregan a `ParametrosCorrida` y a `EstadoVisual`). El semáforo de plazo se mantiene para los pedidos.

---

## A. General

### A22 (P1) · Diagrama: consumo en bloques Sc por cada bloque Sa · ✘ Falta
- **Hoy:** `docs/` solo tiene la guía del PDF y la rúbrica; no hay diagramas en el repositorio.
- **Datos para el diagrama, sacados del código:**
  - **Sa** = ventana de planificación de 60 min simulados: `ventanaPlanificacionMin = 60.0` en [ParametrosCorrida.java:40](../backend/src/main/java/pe/pucp/paqrap/simulacion/ParametrosCorrida.java#L40), acotada entre 5 y 240.
  - **Sc (motor)**: el hilo de la corrida avanza cada `PASO_MS = 100` ms reales y publica el estado cada `PUBLICACION_MS = 250` ms ([Corrida.java:24-25](../backend/src/main/java/pe/pucp/paqrap/simulacion/Corrida.java#L24-L25)). A ×160, 100 ms reales ≈ 16 s simulados.
  - **Sc (navegador)**: consulta `GET /api/simulacion/estado` cada 1000 ms ([page.tsx:65](../frontend/app/page.tsx#L65)) e interpola en cada cuadro con `requestAnimationFrame` ([useEstadoSimulacion.ts:48-56](../frontend/lib/useEstadoSimulacion.ts#L48-L56)).
  - **Ta**: el cierre ya trae `tiempoComputoPlanificadorMs` y `planificaciones`, así que Ta promedio = uno ÷ otro ([PantallaCierre.tsx:145](../frontend/components/PantallaCierre.tsx#L145)).
- **Qué hacer:** un diagrama de secuencia o línea de tiempo: ventana Sa → planificador (Ta) → N pasos Sc del motor → publicación → sondeo del navegador. Guardarlo en `docs/`.

### A23 (P1) · Diagrama: varios navegadores en la simulación del periodo · ✘ Falta
- **Hoy:** la arquitectura del README §5 lo describe en texto: una corrida en memoria y N navegadores que consultan cada 1 s, cada uno con su zoom, filtros y selección locales ([PantallaPanorama.tsx:62-65](../frontend/components/PantallaPanorama.tsx#L62-L65)).
- **Qué hacer:** un diagrama con 3 o más navegadores (PC, celular, tablet) → `GET /estado` (lectura compartida) y acciones `POST` (bloqueo, avería) que afectan a todos, y dejar registro de una prueba con 3 o más dispositivos.

---

## B. Configuración

### B04 (P2) · Atributos de las UT · ◐ Parcial
- **Hoy:** en Parámetros avanzados se fijan cantidad, capacidad, velocidad y costo **por tipo** ([PantallaParametros.tsx:225-236](../frontend/components/PantallaParametros.tsx#L225-L236); tabla de flota en las líneas 164-168). No hay atributos por unidad: almacén o ubicación inicial, estado (disponible o en mantenimiento), etc. La base de cada unidad la decide el backend.
- **Qué cambiar:** agregar en Parámetros una tabla editable por unidad (TA01…TB12) con almacén inicial y estado inicial, y llevarla a `ParametrosOperacion` en el backend. Si no da el tiempo, preparar la explicación de por qué los atributos se definen por tipo.

### B11 (P1) · Tramos que recorre la UT (origen, destino, horarios) · ◐ Parcial
- **Hoy:** el panel del vehículo ([ModalDetalle.tsx:189-221](../frontend/components/ModalDetalle.tsx#L189-L221)) muestra la cabecera de la ruta (sale de X a hh:mm, regresa a Y a hh:mm) y una tarjeta por parada con **llegada** y **límite**. El backend ya manda la **salida** de cada parada (`ParadaDetalle.salida`, [DetalleVisual.java:16-18](../backend/src/main/java/pe/pucp/paqrap/visualizador/DetalleVisual.java#L16-L18)), pero el frontend no la usa.
- **Qué cambiar (solo frontend):** presentar la ruta como lista de **tramos**: «Almacén X (sale hh:mm) → (x, y) pedido P (llega hh:mm, sale hh:mm) → … → Almacén Y (llega hh:mm)». Origen y destino de cada tramo salen de la parada anterior y de la siguiente.

---

## C. Mapa base

### C05 (P1) · Otros dispositivos (responsive) · ◐ Parcial
- **Hoy:**
  - hay `viewport` en [layout.tsx](../frontend/app/layout.tsx) y media queries a 1100 y 820 px ([globals.css:287-302](../frontend/app/globals.css#L287-L302));
  - el mapa usa eventos *pointer* y `touch-action: none` ([globals.css:159](../frontend/app/globals.css#L159)), así que se puede arrastrar con el dedo;
  - el zoom solo funciona con la rueda o con los botones +/−: **no hay pellizco** (pinch);
  - en móvil el panel lateral ocupa `100vw` y tapa el mapa entero;
  - el reloj del encabezado tiene `min-width: 200px` y el encabezado se apila.
- **Qué cambiar:** zoom con pellizco (dos punteros) en `MapaOperacion`; en pantallas angostas, panel lateral como hoja inferior (*bottom sheet*) de unos 50 % de alto; probar en un celular real y en las herramientas de desarrollador a 375 px.

### C07 (P2) · Todo en español · ◐ Parcial
- **Hoy:** la interfaz está casi toda en español. Quedan:
  - «ETA» ([ModalDetalle.tsx:172](../frontend/components/ModalDetalle.tsx#L172)) → «Llegada estimada»;
  - «Stock» en mapa, tooltip y panel ([MapaOperacion.tsx:454](../frontend/components/MapaOperacion.tsx#L454), [Tooltip.tsx](../frontend/components/Tooltip.tsx), [ModalDetalle.tsx:303](../frontend/components/ModalDetalle.tsx#L303)) → «Existencias» o «Inventario» (decidirlo en equipo);
  - «Re-ruteos» → «Rutas recalculadas»;
  - en el Cierre se muestran valores crudos del backend: `eventosPorTipo` como `reasignacion`, `transbordo`, sin tildes ([PantallaCierre.tsx:231](../frontend/components/PantallaCierre.tsx#L231)), `h.estado.toLowerCase()` → «finalizada» o «detenida» (aceptable) y `k.tipo` en la tabla de km por tipo;
  - mensajes técnicos («backend», «Spring Boot», «Vercel», «BACKEND_URL») en el banner de error ([page.tsx:251-256](../frontend/app/page.tsx#L251-L256)).
- **Qué cambiar:** pasar los enums por `ETIQUETA_EVENTO` (que ya existe en `ModalDetalle`) y moverlo a `formato.ts`; reescribir el banner como «No hay conexión con el servidor de PaqRap…».

### C08 (P2) · Zoom continuo y suave · ◐ Parcial
- **Hoy:** cada paso de la rueda multiplica por 1.15 y los botones por 1.25 ([MapaOperacion.tsx:329-348](../frontend/components/MapaOperacion.tsx#L329-L348), [MapaOperacion.tsx:512-514](../frontend/components/MapaOperacion.tsx#L512-L514)), sin interpolación: se ve a saltos.
- **Qué cambiar:** usar un factor proporcional a `deltaY` (por ejemplo `Math.exp(deltaY * 0.0015)`, que con *touchpad* da zoom continuo) y animar la transición de la vista con `requestAnimationFrame` durante unos 150 ms.

### C12 (P1) · Fecha y hora simuladas al minuto · ◐ Parcial
- **Hoy:** en [TopBar.tsx:46-53](../frontend/components/TopBar.tsx#L46-L53) aparece «martes 01 sep 2026» en un `span` y «Día 1 de 5 · 00:00» en otro; además, sobre el mapa, «Hora simulada: 01/09 00:00» sin año ([PantallaPanorama.tsx:250](../frontend/components/PantallaPanorama.tsx#L250)). El dato está al minuto, pero no hay un solo texto rotulado.
- **Qué cambiar:** un bloque «**Fecha y hora simulada:** 01/09/2026 00:00» y, aparte, el día del periodo.

### C13 (P1) · Tiempo simulado transcurrido · ✘ Falta
- **Hoy:** solo se ve «Día N · hh:mm», que es la hora del día y no la duración transcurrida.
- **Qué cambiar (solo frontend):** `minutoAhora()` ya da los minutos simulados desde el inicio; mostrarlo como «**Transcurrido simulado:** 1 d 07 h 42 min».

### C14 (P1) · Fecha y hora actual · ✘ Falta
- **Hoy:** no se muestra el reloj de pared. `ahoraLima()` existe en [formato.ts:56-60](../frontend/lib/formato.ts#L56-L60), pero solo se usa para el formulario.
- **Qué cambiar:** «**Fecha y hora actual:** 22/10/2026 15:04» con un intervalo de 1 s (el `setTic` de TopBar ya refresca cada 500 ms).

### C15 (P1) · Tiempo real transcurrido · ◐ Parcial
- **Hoy:** «Tiempo real: 00:12:34 · ×160» ([TopBar.tsx:70](../frontend/components/TopBar.tsx#L70)), que viene de `tiempoRealSeg` (desde el inicio de la corrida) extrapolado. El valor es correcto.
- **Qué cambiar:** rotularlo «**Transcurrido real:** 00 h 12 min» (o hh:mm:ss) y separar el factor ×160 a otra etiqueta.

### C16 (P1) · Los 4 tiempos bien ubicados y legibles · ◐ Parcial
- **Hoy:** los tiempos están dispersos (encabezado y esquina del mapa) y la información varía entre ambos.
- **Qué cambiar:** un solo bloque de 2 × 2 en el encabezado (simulada, transcurrido simulado, actual, transcurrido real) con fuente monoespaciada y el mismo tamaño para los cuatro; quitar o alinear el `map-overlay-hora`. Revisar que en móvil quede en 2 filas.

### C17–C20 (P2) · Almacenes: ubicación, ícono y contraste · ✔ Cubierto
- **Hoy:** el rectángulo redondeado con glifo de edificio se mantiene del mismo tamaño en pantalla con cualquier zoom (`scale(escala)`), con nombre y stock debajo y halo blanco ([MapaOperacion.tsx:440-464](../frontend/components/MapaOperacion.tsx#L440-L464)).
- **Observación:** el central se pinta azul marino, igual que las UT sin carga. Al implementar «vacío» conviene que el central tenga un color o forma propia.

### C21 (P1) · Ícono del almacén con semáforo + vacío por ocupación · ◐ Parcial
- **Hoy:** el color depende de `stock / capacidad` con `semaforo(pct, verde, ambar)`: **mucho stock = verde**, con los umbrales del plazo y sin categoría vacío ([MapaOperacion.tsx:441-442](../frontend/components/MapaOperacion.tsx#L441-L442)). El central no tiene semáforo.
- **Qué cambiar:** usar `semaforoOcupacion` (ver «Decisión previa»). Definir en equipo qué es «ocupación» en un almacén intermedio (stock / capacidad) y en el central (por ejemplo, unidades estacionadas, o «no aplica» explicado en la leyenda). Actualizar la leyenda ([PantallaPanorama.tsx:234](../frontend/components/PantallaPanorama.tsx#L234)).

### C23–C26 (P2) · UT: ubicación, ícono y contraste · ✔ Cubierto
- **Hoy:** círculo con glifo blanco de auto, moto o bicicleta, borde blanco y tamaño fijo en pantalla ([MapaOperacion.tsx:483-498](../frontend/components/MapaOperacion.tsx#L483-L498), [Iconos.tsx](../frontend/components/Iconos.tsx)).

### C27 (P1) · Ícono de la UT con semáforo + vacío por ocupación · ✘ Falta
- **Hoy:** `colorVehiculo()` usa `holguraMinima`; gris si está averiada y azul marino si no lleva pedidos ([MapaOperacion.tsx:82-86](../frontend/components/MapaOperacion.tsx#L82-L86)).
- **Qué cambiar (solo frontend):** `VehiculoVisual` ya trae `carga` y `capacidad` ([EstadoVisual.java:58-61](../backend/src/main/java/pe/pucp/paqrap/visualizador/EstadoVisual.java#L58-L61)). Colorear con `semaforoOcupacion(100 * carga / capacidad)`. Si se conserva la urgencia de plazo, mostrarla de otro modo (por ejemplo, un anillo o punto rojo cuando hay un pedido crítico a bordo). La avería necesita una marca aparte (ver D10–D13), porque hoy reemplaza al color.

### C28 (P1) · Ocupación de la UT en número o % · ◐ Parcial
- **Hoy:** el tooltip muestra «Carga: 12 / 24 paquetes» y un «Semáforo» que es el de **plazo** ([Tooltip.tsx:44-54](../frontend/components/Tooltip.tsx#L44-L54)); el panel lateral tiene una barra de carga ([ModalDetalle.tsx:161-164](../frontend/components/ModalDetalle.tsx#L161-L164)).
- **Qué cambiar:** «Ocupación: 12 / 24 (50 %)» con el color de ocupación, y rotular el otro como «Urgencia de plazo».

### C30 (P2) · Orientación del ícono según el movimiento · ✘ Falta
- **Hoy:** `transformVehiculo` solo hace `translate` y `scale` ([MapaOperacion.tsx:192-201](../frontend/components/MapaOperacion.tsx#L192-L201)).
- **Qué cambiar:** en `posicionEnTrayectoria` devolver también el segmento actual (dx, dy) y, como las calles son ortogonales, voltear el glifo (`scale(-1,1)`) cuando va hacia la izquierda, o rotarlo ±90° en vertical. Conviene rotar o voltear solo el **glifo** y no el círculo, para que se siga leyendo.

### C31, C33 (P2) · Línea del tramo y su estilo · ✔ Cubierto
- **Hoy:** se dibuja la ruta restante de cada UT con trayectoria, punteada (`7 5`), de 2 px, y de 3.2 px con opacidad 0.95 si está seleccionada ([MapaOperacion.tsx:417-435](../frontend/components/MapaOperacion.tsx#L417-L435)). El filtro «Rutas» permite todas, solo la seleccionada o ninguna.
- **Observación:** con 37 unidades, «todas (tenues)» puede saturar la vista; considerar «solo la seleccionada» como valor por defecto.

### C34 (P2) · Borrar o cambiar el estilo de lo recorrido · ✔ Cubierto
- **Hoy:** la polilínea se recorta desde la posición actual de la unidad ([MapaOperacion.tsx:420-428](../frontend/components/MapaOperacion.tsx#L420-L428)) y el backend envía solo la trayectoria restante (`restanteCompacto`).

---

## D. Circunstancias

### D01–D04 (P2) · Bloqueos visibles durante su vigencia · ✔ Cubierto
- **Hoy:** el backend envía solo `red.bloqueosVigentes(t)` ([MotorSimulacion.java:1436-1444](../backend/src/main/java/pe/pucp/paqrap/simulacion/MotorSimulacion.java#L1436-L1444)) y el frontend los dibuja como polilínea roja de 5 px; los manuales van en marrón y punteados ([MapaOperacion.tsx:399-415](../frontend/components/MapaOperacion.tsx#L399-L415)).
- **Observación:** el rojo del bloqueo (`#c0392b`) es el mismo del semáforo rojo. Si las UT pasan a colorearse por ocupación, habrá más rojo en pantalla; conviene un color exclusivo para bloqueos (por ejemplo, negro con franjas, o magenta).

### D10–D13 (P1) · Averías diferenciadas por tipo 1, 2 y 3 · ✘ Falta
- **Hoy:**
  - `VehiculoVisual` solo trae `estado` (`AVERIADA` o `EN_TALLER`), **sin el tipo** ([EstadoVisual.java:58-61](../backend/src/main/java/pe/pucp/paqrap/visualizador/EstadoVisual.java#L58-L61));
  - en el mapa, toda avería se ve gris ([MapaOperacion.tsx:83](../frontend/components/MapaOperacion.tsx#L83));
  - el tipo solo aparece como texto en el panel lateral (`averia`, [MotorSimulacion.java:1530](../backend/src/main/java/pe/pucp/paqrap/simulacion/MotorSimulacion.java#L1530));
  - según `VehiculoSim.estadoEn`, la unidad está `AVERIADA` hasta `horaFinInmovilizacion` en el lugar y luego `EN_TALLER` (en el almacén) hasta `horaDisponible`.
- **Qué cambiar:**
  - **Backend:** agregar a `VehiculoVisual` los campos `tipoAveria` (1/2/3 o null) y `finAveriaMin`, que se llenan desde `vs.getAveria()`.
  - **Frontend:** una marca distinta por tipo sobre el ícono (por ejemplo, insignia «1», «2» o «3» con colores amarillo, naranja y morado, o triángulo, rombo y cruz), visible mientras dure `AVERIADA`; en taller, otra marca en el almacén. Agregarlas a la leyenda.

---

## E. Panel

> El panel con listas es el bloque más grande. Recomendación: un panel lateral izquierdo plegable en Panorama con 3 pestañas (**Transporte**, **Almacenes**, **Envíos**), que se alimente de `estado` (ya se refresca cada 1 s) y comparta la `seleccion` con el mapa.

### E02–E05 (P1) · Lista de transporte · ✘ Falta
- **Hoy:** no hay lista de UT. Los datos base ya llegan en `estado.vehiculos`: id, tipo, estado, carga, capacidad, `pedidos` (IDs a bordo) y destino.
- **Qué cambiar:**
  - **Frontend:** una tabla con ícono, ID, ocupación (n/cap y %), píldora de semáforo de ocupación con vacío, estado y pedidos a bordo desplegables.
  - **Backend (para E05, «paquetes que lleva»):** hoy `pedidos` es una lista de IDs; si se quieren los paquetes por pedido sin abrir el detalle, cambiarla a `[{id, cantidad}]` en `VehiculoVisual`. Si no, basta con enlazar cada ID al detalle del pedido.

### E06–E07 (P1) · Distancia en minutos al destino y al origen · ✘ Falta
- **Hoy:** `tray` trae `[x, y, minuto, …]` de la trayectoria **restante**, así que se conoce el minuto de llegada al final (regreso), pero no qué punto es la siguiente parada ni la hora de salida del origen.
- **Qué cambiar:**
  - **Backend:** agregar a `VehiculoVisual` los campos `salidaMin` (`r.getHoraInicio()`), `llegadaProximaMin` (`r.siguienteParada().getHoraLlegada()`) y `regresoMin` (`r.getHoraRegreso()`).
  - **Frontend:** columnas «A destino: X min» y «Desde origen: Y min», más un buscador o filtro «llega en ≤ N min» y «salió hace ≤ N min».

### E13–E15 (P1) · Ordenar la lista de UT · ✘ Falta
- **Depende de:** E02 y E06 (hacen falta `salidaMin` y `llegadaProximaMin` o `regresoMin`).
- **Qué cambiar:** encabezados que se puedan pulsar, con orden ascendente y descendente, por ocupación, hora de salida y hora de llegada.

### E18–E22 (P1) · Lista de almacenes · ✘ Falta
- **Hoy:** `estado.almacenes` trae id, nombre, capacidad, stock y `arriban` (texto «TA03 · fecha»). No hay conteos de pedidos por almacén.
- **Qué cambiar:**
  - **Backend:** en `AlmacenVisual` agregar `pedidosEnTransito` (partes en rutas activas cuyo `almacenSalida` es este almacén), `pedidosPorSalir` (lista con la hora prevista de salida, para filtrar por las siguientes x horas en el navegador) y `entregadosRecientes` (lista o conteo con la hora de entrega, para las últimas x horas). Hoy esa información está en `RutaEnCurso` y en el historial de rutas, dentro de `MotorSimulacion`.
  - **Frontend:** una tabla con ocupación, semáforo con vacío, en tránsito, por salir en las próximas [x] h y entregados en las últimas [x] h, con un selector de x.

### E31 (P1) · Lista de envíos · ◐ Parcial
- **Hoy:**
  - la pestaña **Pedidos** ([PantallaPedidos.tsx:476-495](../frontend/components/PantallaPedidos.tsx#L476-L495)) tiene código, cliente, destino, paquetes, tipo, registro, límite, estado, unidad y entrega real; **sin ruta ni horas de salida y llegada estimada**, y está fuera del mapa;
  - si el pedido va en varias UT, la columna «Unidad» las une con comas, pero no muestra la parte que lleva cada una;
  - `DetallePedido` ya trae `rutas: string[]` y `partes[]`, pero el panel lateral **no muestra `rutas`** ([ModalDetalle.tsx:243-261](../frontend/components/ModalDetalle.tsx#L243-L261)).
- **Qué cambiar:**
  - **Backend:** en `FilaPedido` (o en una vista nueva dentro del estado) agregar, por cada parte, `{idParte, vehiculo, idRuta, cantidad, salida, llegadaEstimada}`.
  - **Frontend:** una pestaña «Envíos» dentro del panel de Panorama, con una fila por pedido que se expande por parte, y mostrar `rutas` y las partes en el detalle del pedido.

---

## F. Vinculación mapa-panel

### F01, F03 (P1) · Mostrar en el mapa la ruta de un pedido o paquete · ◐ Parcial
- **Hoy:** «Buscar pedido» centra el mapa en el destino y abre el detalle ([PantallaPanorama.tsx:78-93](../frontend/components/PantallaPanorama.tsx#L78-L93)). Al seleccionar un pedido se resalta la ruta del vehículo, pero solo del **primero** (`p.vehiculos.split(', ')[0]`, [MapaOperacion.tsx:352-357](../frontend/components/MapaOperacion.tsx#L352-L357)). Si el pedido aún no tiene unidad, no se dibuja nada. No hay un botón «Ver ruta en el mapa» en el panel.
- **Qué cambiar:** resaltar las rutas de **todos** los vehículos del pedido; dibujar un marcador del almacén de origen y una línea hasta el destino si el pedido está pendiente; agregar en el detalle del pedido el botón «Ver ruta en el mapa», que hace `centrarEn` y activa el resaltado aunque se venga de otra pestaña.

### F05–F06 (P1) · Almacén: panel ↔ mapa · ◐ Parcial
- **Hoy:** **mapa → panel** funciona: clic en el almacén y se abre su detalle. **Panel → mapa** no existe, porque no hay lista de almacenes y el detalle no centra el mapa.
- **Qué cambiar:** al elegir un almacén en la lista (E18), `setVista(centrarEn(v, a.x, a.y))` + `setSeleccion`. Para eso hay que subir `vista` o exponer un callback `enfocar(x, y)` desde `PantallaPanorama`.

### F07–F08 (P1) · UT: panel ↔ mapa · ◐ Parcial
- **Hoy:** **mapa → panel** funciona: clic en la UT abre el detalle y resalta su ruta. Desde el detalle de un almacén se puede abrir una UT ([ModalDetalle.tsx:311-313](../frontend/components/ModalDetalle.tsx#L311-L313)), pero el mapa no se centra en ella.
- **Qué cambiar:** al elegir una UT en la lista (E02), centrar en su posición interpolada (`posicionEnTrayectoria(v.tray, minutoAhora())`). Opcional: modo «seguir unidad» que recentra en cada cuadro.

### F09 (P1) · Envío en el panel → enfocar almacén o UT · ✘ Falta
- **Hoy:** en la pestaña Pedidos, un clic en la fila abre el detalle, pero se queda en esa pestaña (sin mapa) y no enfoca nada. Las tarjetas de parada del panel del vehículo abren el pedido, sin centrar.
- **Qué cambiar:** desde la lista de envíos (E31), centrar en la UT que lo lleva o, si está pendiente, en su almacén de origen.

### F15–F16 (P1) · Filtrar por semáforo, incluido vacío · ✘ Falta
- **Hoy:** los filtros ([PantallaPanorama.tsx:177-205](../frontend/components/PantallaPanorama.tsx#L177-L205)) son: zona, «Solo pedidos en riesgo o críticos», mostrar pedidos, bloqueos y unidades en almacén, tipo de vehículo y rutas. No hay filtro por color para UT ni almacenes.
- **Qué cambiar:** en `Filtros` ([MapaOperacion.tsx:49-65](../frontend/components/MapaOperacion.tsx#L49-L65)) agregar `semaforoUT: Record<'vacio'|'verde'|'ambar'|'rojo', boolean>` y `semaforoAlmacen` (lo mismo), aplicarlos en `vehiculosVisibles` y en el `map` de almacenes, y poner casillas de verificación con los 4 colores en el panel de filtros y en las listas (el mismo estado, para que lista y mapa coincidan).

---

## G. Cierre e indicadores globales

### G01–G02 (P1) · Ocupación global de la flota como semáforo · ✘ Falta
- **Hoy:** el KPI «Flota activa n / N» cuenta las unidades operativas ([PantallaPanorama.tsx:212](../frontend/components/PantallaPanorama.tsx#L212)).
- **Qué cambiar (solo frontend):** `Σ carga / Σ capacidad` sobre `estado.vehiculos` (o solo sobre las operativas; decidirlo y rotularlo), mostrado como KPI con `sem={semaforoOcupacion(...)}`. Conviene que se vea siempre, no solo con «Métricas» abierto (por ejemplo, junto al bloque de tiempos).

### G03–G04 (P1) · Ocupación global de los almacenes como semáforo · ◐ Parcial
- **Hoy:** hay un KPI por intermedio («Stock Nor-Oeste» y «Stock Este») con semáforo de stock y otro del central «Sin límite» ([PantallaPanorama.tsx:213-220](../frontend/components/PantallaPanorama.tsx#L213-L220)).
- **Qué cambiar:** un KPI global `Σ stock / Σ capacidad` de los intermedios (el central queda fuera porque no tiene límite; aclararlo en el subtítulo), con el semáforo de ocupación.

### G06 (P2) · 2 o más navegadores independientes en 5D · ✔ Cubierto (falta la prueba)
- **Hoy:** el estado se comparte (`Corrida.getUltimoEstado()`) y la vista, los filtros y la selección son locales a cada navegador.
- **Qué hacer:** probar con 3 o más dispositivos y registrar la evidencia (también sirve para A23).

### G08–G10 (P1) · Reporte de la última planificación estable · ◐ Parcial
- **Hoy:** el Cierre ([PantallaCierre.tsx](../frontend/components/PantallaCierre.tsx)) muestra indicadores, cumplimiento por día, km por tipo, utilización, incidencias y parámetros, **pero no el plan** (rutas vigentes con sus paradas). El backend ya tiene `GET /api/corridas/{id}/rutas` (historial de rutas con su causa, README §8), pero `frontend/lib/api.ts` no lo usa. El cierre se genera igual en los 3 escenarios (fin del 5D, Detener en día a día, colapso), así que un solo cambio cubre G08, G09 y G10.
- **Qué cambiar:**
  - **Backend (recomendado):** agregar a `CierreCorrida` una lista `ultimaPlanificacion` con las rutas vigentes al momento del cierre (vehículo, almacén de salida, paradas con hora, regreso) y la hora de esa planificación. Esa información vive en `vehiculos[*].getRuta()` dentro de `MotorSimulacion.generarCierre`.
  - **Frontend:** una sección «Última planificación (hh:mm simulada)» con una tabla por vehículo; opcionalmente, un mini mapa estático con esas rutas.

---

## Orden de trabajo sugerido (ajustado a lo que se vio en el código)

1. **Decisión de equipo** sobre el semáforo de ocupación con vacío y sus umbrales.
2. **Solo frontend, rápidos:** tiempos C12–C16, C27, C28, C21, G01–G04 y B11 (la salida por parada ya llega).
3. **Backend + frontend:** campos nuevos en `VehiculoVisual` (`tipoAveria`, `finAveriaMin`, `salidaMin`, `llegadaProximaMin`, `regresoMin`) → D10–D13 y E06–E07, E13–E15.
4. **Panel de 3 pestañas** en Panorama (E02–E05, E18–E22, E31), con los campos nuevos en `AlmacenVisual` y en la vista de envíos.
5. **Vinculación y filtros:** callback `enfocar(x, y)` + filtros de semáforo compartidos (F01, F03, F05–F09, F15–F16).
6. **Cierre con la última planificación** (G08–G10).
7. **P2:** C05 (pellizco y hoja inferior), C07, C08, C30, B04.
8. **Diagramas A22 y A23**, con los valores de Sa, Sc y Ta indicados arriba.
