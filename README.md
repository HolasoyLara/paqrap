# PaqRap: solución final

Sistema de planificación, simulación y monitoreo de entregas de **PaqRap**, del curso 1INF54 Proyecto de Diseño y Desarrollo de Software (2026-2, equipo 1A).

La solución integra:

- el **Algoritmo 1 del equipo**, genético, versión del 24-sep (`paqrap-algoritmo1-genetico-24sep.zip`);
- un segundo algoritmo, **colonia de hormigas (ACS)**, para la comparación que exige el curso;
- el visualizador diseñado en el **prototipo v04** (`01.definicion.prototipo.v04.pdf` y `paqrap-visualizador-prototipo.html`);

todo alineado con la **Lista de Exigencias v02**.

| Capa | Tecnología |
|---|---|
| Backend | Java 21 + Spring Boot 3.5. Contiene la API REST, el motor de simulación por eventos, el planificador (GA / ACO) y la persistencia JPA (H2 en archivo o PostgreSQL). |
| Frontend | Next.js 15 + React 19. Es el visualizador del prototipo v04: mapa SVG animado a pantalla completa con panel lateral de detalle, KPI, cierre y pedidos. La experimentación GA vs ACO queda disponible solo por la API. |
| Entrega | El ejecutable único `dist/paqrap-app.jar` sirve la API y la web. Además se puede levantar con Docker / docker compose, publicar en Vercel (visualizador) + Render (API) para pruebas, o en AWS (ECS Fargate o EC2). |

---

## 1. Uso rápido en Windows

Para usar el sistema basta con dar **doble clic** en el lanzador; no hace falta abrir ningún programa.

| Archivo | Qué hace |
|---|---|
| **`INICIAR.bat`** | Inicia PaqRap en segundo plano (sin ventanas) y abre el navegador en http://localhost:8080. Si el equipo no tiene Java 21, la primera vez descarga uno portable. |
| **`DETENER.bat`** | Cierra la corrida en curso, guarda su cierre en el historial y apaga el servicio. |
| `COMPILAR.bat` | Recompila el visualizador y el backend y regenera `dist/paqrap-app.jar`. Solo hace falta si se cambia el código; si falta Java 21 o Node.js, los descarga portables. |
| `INICIAR-DOCKER.bat` / `DETENER-DOCKER.bat` | Levanta o baja la versión en contenedores. Requiere Docker Desktop. |
| `DESPLEGAR-VERCEL.bat` | Publica el visualizador en Vercel; pide la URL del backend (ver §6.2). |
| `DESPLEGAR-AWS.bat` | Publica todo en AWS (ECS Fargate + balanceador). Requiere AWS CLI configurado y Docker (ver §6.3). |

Detalles:

- **Dónde se guarda lo que generan los scripts.** Todo queda en una sola carpeta, `%LOCALAPPDATA%\PaqRap`, fuera de OneDrive. Ahí van:
  - Java y Node portables, si hicieron falta;
  - Maven y sus dependencias;
  - la base H2 con el historial de corridas y experimentos;
  - las bitácoras y los temporales;
  - la carpeta de compilación.

  Se puede borrar cuando se quiera, porque se vuelve a crear sola. Para usar otra carpeta, defina la variable `PAQRAP_LOCAL`.
- **Bitácora del servicio:** `%LOCALAPPDATA%\PaqRap\logs\paqrap.log`.
- **Puerto.** Si el 8080 está ocupado, `INICIAR.bat` toma el siguiente libre (8081, 8082…) y `DETENER.bat` lo recuerda. Para fijar uno: `INICIAR.bat -Puerto 9090`.
- **Otros dispositivos de la red** pueden abrir `http://<IP-de-esta-PC>:8080` y ven la misma corrida (C5, C6). La primera vez, Windows puede pedir permiso en el firewall para Java.

### Linux / macOS

Requisitos: `bash` y `curl` (o `wget`). Java 21 y Node se descargan portables si faltan.

```bash
bash scripts/linux/iniciar.sh            # inicia en segundo plano y abre el navegador (puerto opcional: iniciar.sh 9090)
bash scripts/linux/detener.sh
bash scripts/linux/compilar.sh           # recompila (opcional: --con-pruebas)
bash scripts/linux/iniciar-docker.sh     # y detener-docker.sh
bash scripts/linux/desplegar-vercel.sh https://url-del-backend
bash deploy/aws/desplegar-aws.sh us-east-1 paqrap
```

En Linux y macOS los datos y las bitácoras quedan en `~/.local/share/paqrap`.

---

## 2. Pantallas (prototipo v04)

1. **Parámetros (V-1)**
   - Escenario, fecha y hora de inicio, duración objetivo y tipos de entrega incluidos. El algoritmo queda fijo en GA y la semilla en 20260902 (misma fecha + mismos archivos = misma corrida); ACO y otras semillas se eligen por la API.
   - Umbrales del semáforo (C10); flota, almacenes y turnos.
   - Parámetros avanzados: velocidades y costos, plazos, ventana de planificación, aceleración y umbrales del colapso, averías por día y parámetros de cada algoritmo.
   - Archivos de entrada: se muestran los publicados por el curso, con cuántas líneas válidas y errores tiene cada uno. Se pueden subir archivos propios de ventas, bloqueos, averías o mantenimiento, que se validan línea por línea. Ventas y bloqueos son mensuales: para un periodo que cruza de mes (caso del 30 de septiembre) se pueden subir 2 archivos a la vez, uno por mes.

2. **Panorama (V-2)**, el mapa en vivo de la ciudad de 70 × 50 km, a pantalla completa ("mapa libre"). Las métricas, la leyenda, los filtros y la búsqueda de pedido empiezan recogidos y se abren con la barra flotante de arriba a la izquierda. Muestra:
   - los vehículos animados, con un ícono por tipo y la distinción entre operativos y averiados;
   - las rutas planificadas y los almacenes con su semáforo de stock;
   - los pedidos con su semáforo de plazo (verde, ámbar o rojo) y las calles bloqueadas;
   - bajo cada almacén, su stock en números y porcentaje con el color del semáforo; al pasar el mouse se ven también las unidades que están en él y las que arriban con su hora estimada;
   - el panel de KPI, filtros (solo críticos, por tipo de unidad, etc.), zoom con la rueda y desplazamiento arrastrando.

   Al hacer clic se abre el detalle en un **panel lateral** que no tapa el mapa (se cierra con la × o Esc):
   - **en un vehículo** se ve su carga, su ruta con una tarjeta por pedido (en orden de entrega), la pausa de alimentación solo si ya ocurrió, y su historial, y se puede registrar una avería de tipo 1, 2 o 3;
   - **en un pedido** se ve su estado, plazo, unidad y trazabilidad, y se puede editar o cancelar;
   - **en un almacén** se ven su stock y sus unidades;
   - **en un tramo de calle** se bloquea o se reabre ese tramo, y se replanifica;
   - **en un punto del mapa**, durante la operación día a día, se registra un pedido ahí.

   Hay alertas visuales de reasignación (C22) y de colapso.

3. **Cierre (V-3)**: resultados del periodo, con exportación CSV (D22). Incluye:
   - cumplimiento (D15), costo (D16), kilómetros y costo por tipo de vehículo (D17) y utilización de la flota (D18);
   - incidencias (D19), verificación de la política de entrega (D25) y detalle de la ejecución (D24);
   - cumplimiento por día y momento del colapso (D21);
   - historial de corridas.

4. **Pedidos**: registro manual (operación día a día), carga masiva, seguimiento por código, búsqueda por código o cliente, estado y tipo, edición o cancelación antes del despacho y exportación CSV.

5. **Experimentación (solo API)**: compara GA y ACO sobre **las mismas instancias** (B23, D20) con `POST /api/experimentos`.
   - Se ejecutan N fechas de inicio × 2 algoritmos, sin interfaz y a máxima velocidad.
   - Devuelve media ± desviación estándar, una **prueba t pareada**, CSV e historial de experimentos (C25).
   - La pestaña del visualizador se quitó en la última entrega; el servicio sigue disponible.

---

## 3. Escenarios (B18-B22, D12-D14)

| Escenario | Inicio por defecto | Velocidad del reloj | Cuándo termina |
|---|---|---|---|
| **Simulación del periodo (5D)** | 2026-09-01 00:00 | 5 días en la duración objetivo: 45 min por defecto, configurable entre 30 y 60 (B22). Con 45 min avanza ×160. | Al terminar el periodo |
| **Operación día a día** | ahora (hora de Lima) | 1 : 1 (tiempo real) | Cuando el usuario la detiene |
| **Colapso logístico** | 2027-03-01 00:00 | ×160, configurable | Se detiene sola al detectar el colapso |

El colapso se declara cuando se cumple alguna de estas condiciones (ambos umbrales se configuran en Parámetros):

- hay **3 o más pedidos incumplidos** al mismo tiempo; o
- hay **15 o más pedidos sin unidad** que ya no pueden esperar a la siguiente ventana.

Reglas del dominio que se modelan:

- **Ciudad:** retícula de 70 × 50 km con calles de doble sentido.
- **Almacenes:**
  - central (27, 14), con stock infinito;
  - Nor-Oeste (12, 38) y Este (57, 27), con 1 000 unidades cada uno y recarga a las 23:59:59.
- **Flota:**

  | Tipo | Unidades | Capacidad | Velocidad | Costo |
  |---|---|---|---|---|
  | Autos | 10 | 24 paquetes | 40 km/h | S/ 8/km |
  | Motos | 15 | 8 paquetes | 25 km/h | S/ 6/km |
  | Bicicletas | 12 | 4 paquetes | 12 km/h | S/ 3/km |

- **Entrega:** 1 h de servicio en el destino; se cumple si se llega antes de la hora límite.
- **Turnos:** 07:00, 15:00 y 23:00, con refrigerio de 1 h escalonado por unidad.
- **Mantenimiento preventivo:** según el archivo publicado, que se repite cada dos meses.
- **Bloqueos:** vienen de archivo o se marcan a mano en el mapa.
- **Averías:** de tipo 1, 2 o 3 (desde la interfaz, desde archivo o generadas al azar).
- **Pedidos:**
  - se entregan en partes cuando superan la capacidad (P13);
  - se reprograman con registro del cambio (A21);
  - la carga en tránsito se reasigna al pedido más crítico (B11).

---

## 4. Algoritmos (B2, B3, B17, B21)

Ambos implementan la interfaz `AlgoritmoMetaheuristico` (patrón Strategy). Se eligen por parámetro, sin recompilar (B21). Minimizan la **misma función objetivo**: el costo por km (S/ 8, 6 y 3) más penalizaciones por llegar fuera de plazo, por no volver antes del mantenimiento y por dejar pedidos sin atender (B17).

- **GA, Algoritmo 1 del equipo.** Trabaja en dos etapas:
  1. Asigna pedidos a vehículos por inserción más barata (*cheapest insertion*). Respeta la capacidad, el stock de cada almacén (B16), el plazo, el refrigerio y el mantenimiento.
  2. Hace una búsqueda genética sobre el orden de visita: cruce OX, mutación por intercambio, selección por torneo y elitismo.

  Valores por defecto: población 30, 60 generaciones, cruce 0.85, mutación 0.15 y torneo 4.
- **ACO (Ant Colony System).** Cada hormiga construye una solución completa con la regla pseudoaleatoria proporcional; la heurística η combina cercanía y urgencia. Actualiza la feromona en forma local y global, y aplica búsqueda local 2-opt sobre la mejor hormiga.

  Valores por defecto: 10 hormigas, 25 iteraciones, α = 1, β = 2, evaporación ρ = 0.1 y q0 = 0.9.

**Cómo se planifica:**

- Se trabaja en ventanas de 60 minutos.
- Además se replanifica de inmediato ante:
  - un pedido nuevo;
  - un bloqueo (B9);
  - una avería (B10), con transbordo de la carga en averías de tipo 2 y 3;
  - la recarga de los almacenes.
- La semilla de cada ventana es la semilla de la corrida más el número de ventana, así que **misma semilla + mismos archivos = misma corrida**.

---

## 5. Arquitectura

```
 Navegador (cualquier dispositivo)                                     
   Visualizador Next.js: mapa SVG, KPI, cierre, pedidos
        |  GET /api/simulacion/estado cada 1 s (estado compartido) + acciones REST
        v
 Spring Boot (puerto 8080), que también sirve la web estática del visualizador
   api/           controladores REST y reportes CSV
   simulacion/    MotorSimulacion (eventos), Corrida (reloj), ServicioSimulacion,
                  ServicioExperimentacion, FuenteDatos (archivos del curso y subidos)
   planificador/  AlgoritmoGenetico, AlgoritmoColoniaHormigas, RedVial, Replanificación,
                  ReasignacionCarga, EntregasParciales
   flota/         vehículos, almacenes, turnos, averías, bloqueos, mantenimiento
   registro/      pedidos, clientes, seguimiento
   visualizador/  objetos de estado y detalle para el mapa
   persistencia/  JPA: corridas, eventos, historial de rutas, experimentos (H2 o PostgreSQL)
```

**Una sola corrida compartida.** La corrida visual vive en memoria del servicio y la comparten todos los navegadores conectados: todos ven la misma operación, pero cada uno tiene su propio zoom, filtros y selección. Por eso el servicio se despliega con **una instancia**. El historial (corridas, eventos, rutas, experimentos) se persiste en la base de datos.

**Modos de despliegue:**

| Modo | Qué corre | URL |
|---|---|---|
| Local (`INICIAR.bat`) | `dist/paqrap-app.jar`: API + web | http://localhost:8080 |
| Docker compose | `backend`: API + web; `frontend`: servidor Next.js que reenvía `/api` al backend | http://localhost:8080 y http://localhost:3000 |
| Pruebas en la nube | Render: contenedor del backend; Vercel: visualizador con `BACKEND_URL` apuntando a Render | `https://<proyecto>.vercel.app` |
| AWS | ECS Fargate + Application Load Balancer, o EC2 con docker compose | URL del balanceador |

---

## 6. Despliegue

### 6.1 Docker (local)

Opción A: doble clic en `INICIAR-DOCKER.bat`.

Opción B: en una terminal ubicada en esta carpeta, ejecute:

```bash
docker compose up -d --build
```

Luego abra http://localhost:3000 (visualizador Next.js) o http://localhost:8080 (API + visualizador). Los datos persisten en el volumen `paqrap-datos`. Para apagar: `DETENER-DOCKER.bat` o `docker compose down`.

El backend tiene su propio `backend/Dockerfile`, de varias etapas:

1. compila el visualizador estático con Node 22;
2. compila el JAR con el JDK 21;
3. lo ejecuta con un JRE 21, como usuario sin privilegios y con *healthcheck*.

Esa imagen es la que usan Render y AWS.

### 6.2 Pruebas en la nube: Render (API) + Vercel (visualizador)

Vercel solo ejecuta el visualizador Next.js; **la API Java se publica aparte** (Render o AWS). El visualizador reenvía `/api/*` a `BACKEND_URL`, así que el navegador no necesita CORS.

1. **Suba el contenido de `Resultado` a un repositorio de GitHub**, como raíz del repositorio.
2. **Backend en Render** (gratis, para pruebas):
   1. En Render: *New → Blueprint*; elija el repositorio. Render usa `render.yaml` y crea el servicio `paqrap-backend` (Docker).
   2. Espere a que `https://paqrap-backend.onrender.com/api/salud` responda `{"estado":"OK",...}`. Esa URL también sirve el sistema completo.
   3. El plan gratuito se duerme tras 15 minutos sin tráfico: la primera visita tarda alrededor de 1 minuto y el historial se pierde al reiniciarse. Para conservarlo, defina `SPRING_DATASOURCE_URL` con una base PostgreSQL.
3. **Visualizador en Vercel.** Elija una de estas opciones:
   - **Con el script:** ejecute `DESPLEGAR-VERCEL.bat` (o `scripts/linux/desplegar-vercel.sh`) y escriba la URL del backend. La primera vez la CLI de Vercel pide iniciar sesión en el navegador; para no tener que hacerlo, defina antes `VERCEL_TOKEN`. Queda publicado en producción; `-Preliminar` hace un despliegue de vista previa.
   - **Desde el panel de Vercel:**
     1. *Add New → Project* e importe el repositorio.
     2. En **Root Directory** ponga `frontend`; el framework se detecta como Next.js.
     3. Agregue la variable de entorno `BACKEND_URL` = URL de Render (o del balanceador de AWS).
     4. Pulse *Deploy*. Cada *push* vuelve a desplegar.

### 6.3 AWS (producción)

**Opción A (recomendada): ECS Fargate + Application Load Balancer**, con `DESPLEGAR-AWS.bat`. También puede usar `deploy/aws/desplegar-aws.ps1` o `deploy/aws/desplegar-aws.sh`.

- **Requisitos:** AWS CLI v2 configurado (`aws configure`) y Docker en marcha.
- **Qué hace el script:**
  1. Crea el repositorio ECR `paqrap`.
  2. Construye la imagen completa para `linux/amd64` y la sube.
  3. Crea o actualiza la pila CloudFormation `paqrap` (`deploy/aws/paqrap-ecs-fargate.yml`), que contiene:
     - una VPC propia con 2 subredes públicas;
     - un ALB con HTTP 80, y HTTPS 443 si se pasa `-CertificadoArn` con un certificado de ACM;
     - un clúster ECS con 1 tarea Fargate (1 vCPU, 2 GB; parámetros `ContainerCpu`/`ContainerMemory`), con verificación de salud en `/api/salud`;
     - bitácoras en CloudWatch (14 días).
  4. Muestra la URL pública.
- **Base de datos opcional:** PostgreSQL en RDS, con los parámetros `DatasourceUrl`, `DatasourceUsuario` y `DatasourceClave` de la plantilla.
- **Actualizar:** vuelva a ejecutar el script.
- **Eliminar:** `aws cloudformation delete-stack --stack-name paqrap` y luego borre el repositorio ECR. El balanceador y Fargate generan costo mientras existan.

**Opción C (recomendada para cuenta student): una sola instancia EC2, sin Docker ni roles IAM en su PC.**, con `DESPLEGAR-AWS-EC2.bat` (o `deploy/aws/desplegar-ec2.ps1`).

- **Requisitos:** AWS CLI v2 con credenciales vigentes (`aws configure`) y el proyecto subido a un repositorio **público** de GitHub.
- **Qué hace:** crea la pila `paqrap-ec2` (`deploy/aws/paqrap-ec2.yml`): VPC pública mínima, un grupo de seguridad con el puerto 80 y una instancia EC2 `t3.small`. La instancia clona el repositorio, agrega 2 GB de swap, construye la imagen con Docker Compose y la publica en el puerto 80.
- **Tiempo:** 2-3 minutos la pila y 10-15 minutos la compilación dentro de la instancia. Revise `http://<dns>/api/salud`.
- **Costo:** una instancia `t3.small` encendida. Para pausar, detenga la instancia desde la consola de EC2; al volver a encenderla, la IP pública cambia.
- **Eliminar:** `aws cloudformation delete-stack --stack-name paqrap-ec2`.

**Opción B: una instancia EC2 con Docker Compose (manual).**

1. Cree una instancia Amazon Linux 2023 (t3.small o mayor) con los puertos 80 y 3000 abiertos.
2. Pegue `deploy/aws/ec2-user-data.sh` como *User data*, después de poner la URL de su repositorio en `REPO_URL`.
3. Al terminar, el sistema queda en `http://<ip>/` y en `http://<ip>:3000`.

Para tener el visualizador en Vercel con la API en AWS, use la URL del balanceador como `BACKEND_URL`.

---

## 7. Configuración (variables de entorno)

| Variable | Por defecto | Uso |
|---|---|---|
| `PORT` | `8080` | Puerto del backend. |
| `PAQRAP_DATOS_DIR` | `./datos-app` | Carpeta de la base H2. Los scripts usan `%LOCALAPPDATA%\PaqRap\datos`; Docker, `/data`. |
| `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | H2 en archivo | Para usar PostgreSQL, por ejemplo `jdbc:postgresql://host:5432/paqrap`. |
| `PAQRAP_DATOS_EXTERNOS` | `./datos-externos` | Carpeta opcional con `ventas.AAAAMM.txt`, `bloqueo.AAMM.txt`, etc. Tienen prioridad sobre los archivos empaquetados, así que permiten agregar meses sin recompilar. |
| `PAQRAP_CORS_ORIGENES` | `*` | Orígenes que pueden llamar a la API desde otro dominio. Solo hace falta si se usa `NEXT_PUBLIC_API_URL`. |
| `JAVA_OPTS` | (imagen Docker) | Opciones de la JVM. |
| `BACKEND_URL` (frontend) | `http://localhost:8080` | Destino del reenvío `/api/*` en Vercel y Docker. Se fija al compilar. |
| `NEXT_PUBLIC_API_URL` (frontend) | vacío | Si se define, el navegador llama directamente a esa URL en lugar de usar el reenvío. |
| `PAQRAP_LOCAL` (scripts) | `%LOCALAPPDATA%\PaqRap` | Carpeta de trabajo de los scripts. |
| `VERCEL_TOKEN` (scripts) | — | Token para publicar en Vercel sin iniciar sesión. |

---

## 8. API REST

| Método y ruta | Descripción |
|---|---|
| `GET /api/salud` · `GET /api/config` | Salud del servicio y configuración por defecto (escenarios, flota, almacenes, umbrales). |
| `GET /api/datos/archivos` · `POST /api/datos/archivos/{tipo}` · `DELETE /api/datos/archivos/{tipo}` | Archivos de entrada (`ventas`, `bloqueos`, `averias`, `mantenimiento`, `todos`). |
| `POST /api/simulacion/iniciar` · `POST /api/simulacion/detener` | Inicia una corrida (el cuerpo es `ParametrosCorrida`) o la detiene (devuelve el cierre). |
| `GET /api/simulacion/estado` | Estado compartido para el mapa: vehículos con su trayectoria, pedidos, almacenes, bloqueos, KPI y alertas. |
| `GET /api/simulacion/{vehiculos\|pedidos\|almacenes}/{id}` | Detalle para los modales. |
| `POST /api/simulacion/bloqueos` · `POST /api/simulacion/averias` | Bloquear o reabrir un tramo, y registrar una avería (`{"vehiculo":"TA03","tipo":2}`). |
| `PUT /api/simulacion/umbrales` · `PUT /api/simulacion/velocidades` | Semáforo y velocidades en caliente. |
| `GET /api/simulacion/cierre` · `GET /api/simulacion/cierre/csv` | Cierre (V-3). |
| `GET /api/pedidos?q=&estado=&tipo=&desde=&hasta=` · `POST /api/pedidos` · `PUT /api/pedidos/{id}` · `DELETE /api/pedidos/{id}` · `POST /api/pedidos/lote` · `GET /api/pedidos/exportar` · `GET /api/pedidos/{id}` | Registro y seguimiento de pedidos. |
| `GET /api/corridas` · `GET /api/corridas/{id}` · `GET /api/corridas/{id}/csv` · `GET /api/corridas/{id}/rutas` · `GET /api/corridas/{id}/eventos` | Historial de corridas, rutas con la causa del cambio (B25) e incidencias. |
| `POST /api/experimentos` · `GET /api/experimentos` · `GET /api/experimentos/{id}` · `GET /api/experimentos/{id}/csv` | Experimentación GA vs ACO. |

Ejemplo: iniciar una simulación 5D con el ACO.

```bash
curl -X POST http://localhost:8080/api/simulacion/iniciar -H "Content-Type: application/json" -d "{\"escenario\":\"SIMULACION_5D\",\"algoritmo\":\"ACO\",\"semilla\":20260902}"
```

---

## 9. Datos de entrada

Los datos publicados por el curso vienen dentro del JAR, en `backend/src/main/resources/datos/`:

- 36 meses de ventas (`ventas.202601.txt` … `ventas.202812.txt`);
- 36 meses de bloqueos (`bloqueo.2601.txt` …);
- el plan de mantenimiento `mant.preventivo.09.10.txt`.

| Archivo | Formato de cada línea | Ejemplo |
|---|---|---|
| Ventas / carga masiva | `##d##h##m:x,y,cliente,cantidad,plazoHoras` | `01d00h26m:26,15,c0497,06,36` |
| Bloqueos | `##d##h##m-##d##h##m:x1,y1,x2,y2,...` (poligonal abierta) | `01d06h00m-01d15h00m:31,21,34,21` |
| Mantenimiento | `aaaammdd:TTNN` (se repite cada 2 meses) | `20260901:TA01` |
| Averías (formato propio, ver §11) | `##d##h##m:TTNN:tipo` (día relativo al mes de inicio) | `02d10h30m:TA03:2` |

---

## 10. Pruebas y verificación

En Windows, para correr las pruebas del backend:

```bash
cd backend
.\mvnw.cmd test
```

En Linux o macOS, desde la carpeta `backend`, use `./mvnw test`.

| Prueba | Qué verifica |
|---|---|
| `MotorSimulacionTest` | Escenario 5D completo con los datos reales de setiembre de 2026, con el GA y con el ACO. Comprueba el fin del periodo, la cantidad de pedidos y que el cumplimiento sea mayor a 95 %. |
| `ApiIntegracionTest` | Recorrido de punta a punta por la API: configuración, archivos, corrida día a día con un pedido manual, y cierre. |
| `ReasignacionCargaTest` | Avería de tipo 2 con un pedido de 4 h que ya no puede reponerse desde el almacén: otra unidad en camino lo atiende primero (B10, B11). |
| `ExploracionColapsoTest` | Exploración de fechas de colapso. No corre por defecto; se activa con `-Dpaqrap.explorar=true`. |

Verificación hecha sobre esta entrega (10-oct-2026, Windows 11):

- `COMPILAR.bat` de punta a punta: Node portable, `npm ci`, exportación estática de Next.js y Maven generan `dist/paqrap-app.jar`.
- `INICIAR.bat`:
  - arranca en unos 10 s, con el proceso Java oculto;
  - la web responde en `/`, la API en `/api/*`, y una corrida 5D avanza a ×160;
  - `DETENER.bat` la cierra, el puerto queda libre y la corrida detenida aparece en el historial después de reiniciar.
- Visualizador probado en el navegador: parámetros, animación del mapa, *tooltip*, modales, avería registrada desde la interfaz, bloqueo manual, cierre y pedidos (incluido un registro manual en día a día). El experimento con prueba t se probó por la API.
- Pruebas automáticas del backend (`mvnw test`): 6 ejecutadas, 0 fallos, 1 omitida (la de exploración). Resultados de la simulación 5D del 1 al 5 de setiembre de 2026, con la semilla por defecto y sin reloj:

  | Algoritmo | Pedidos | Entregados a tiempo | Entregados tarde | En curso al cierre | Cumplimiento | Costo | km | Cómputo del planificador |
  |---|---|---|---|---|---|---|---|---|
  | GA | 795 | 782 | 0 | 13 | 100 % | S/ 154 323.60 | 26 970 | 0.38 s |
  | ACO | 795 | 771 | 2 | 22 | 99.75 % | S/ 168 689.27 | 24 563 | 0.70 s |

---

## 11. Decisiones y supuestos

- **Algoritmo 1 (GA).** Se integró la lógica del equipo: asignación, *fitness* y operadores genéticos. Se agregó:
  - salida desde el almacén donde está cada unidad (varios depósitos);
  - stock por almacén (B16);
  - tiempos con refrigerio y bloqueos según la hora;
  - descarte de rutas que no vuelven antes del mantenimiento.
- **Segundo algoritmo (ACO).** Se implementó dentro del proyecto siguiendo el prototipo v04, porque entre los materiales solo estaba el código del Algoritmo 1. Usa las mismas reglas y la misma función objetivo, para que la comparación sea justa.
- **Tipos de avería** (prototipo v04; el enunciado no fija duraciones):
  - **tipo 1:** 2 h detenida y luego sigue su ruta;
  - **tipo 2:** hasta 4 h en el lugar, y en taller hasta el fin del turno siguiente;
  - **tipo 3:** 4 h en el lugar, al menos 48 h en taller, y vuelve a las 15:00.

  En los tipos 2 y 3 la carga se transborda.
- **Averías por archivo.** El curso no publicó un formato, así que se definió `##d##h##m:TTNN:tipo`, con la misma convención de tiempo que ventas y bloqueos. Además se generan averías al azar (0.6 por día por defecto, configurable) sobre unidades en ruta.
- **Colapso.** El enunciado no lo cuantifica. Se adoptaron 3 o más pedidos incumplidos simultáneos, o 15 o más pedidos sin unidad que ya no pueden esperar; ambos valores se configuran en Parámetros. El inicio por defecto (2027-03-01) se eligió explorando con `ExploracionColapsoTest`.
- **Refrigerio** (D5): 1 h. La unidad NN empieza a comer `1 + ((NN − 1) mod 6)` horas después del inicio de cada turno; por ejemplo, TA01 come de 08:00 a 09:00. Así las unidades no paran todas a la vez, y la pausa nunca cae en la primera ni en la última hora del turno. Si la pausa llega en plena ruta, la unidad se detiene 1 h donde esté.
- **Registro manual de pedidos.** Solo está en el escenario **día a día**, porque los escenarios simulados se alimentan de los archivos del curso.
- **Pendientes** (exigencias *deseables* de la LE v02):
  - no se implementó pausar, adelantar ni retroceder la reproducción (C15);
  - no se implementó la notificación al cliente (A16), aunque los hitos sí quedan en la trazabilidad.
  - La grabación en video de los 3 escenarios (C24) es un entregable del equipo: el sistema reproduce los tres.

---

## 12. Trazabilidad con la Lista de Exigencias v02

✔ cumplida · ◐ parcial · ✘ no implementada (todas las no implementadas son *deseables*).

**A. Registro de pedidos y clientes**

| Ítem | Estado | Dónde |
|---|---|---|
| A1 A2 A3 A5 A14 A15 A25 | ✔ | Pantalla Pedidos, clic en el mapa en día a día y `POST /api/pedidos`. La hora límite se calcula como registro + plazo. |
| A4 A22 | ✔ | La capacidad se mide en paquetes. Los pedidos mayores que la capacidad se dividen en entregas parciales sincronizadas (`EntregasParciales`, sufijos `-1..n`). |
| A6 A7 | ✔ | Editar o cancelar antes de asignar o despachar, desde el modal o con `PUT`/`DELETE /api/pedidos/{id}`. |
| A8 A12 A20 A23 | ✔ | Código único (`PVaamm-nnnn`, `PW-n`, `PM-n`, `PL-n`), estado del pedido, seguimiento por código y trazabilidad (almacén, unidad, ruta, hora real). |
| A9 | ✔ | Archivos de ventas y carga masiva (`POST /api/pedidos/lote`). |
| A10 | ✔ | El planificador asigna el almacén con stock y menor costo (varios depósitos). |
| A11 A18 | ✔ / ◐ | Búsqueda por cliente o código, estado, tipo y rango de fechas (API). El historial por cliente se obtiene con esa búsqueda. |
| A13 A17 | ◐ | Se valida la cobertura (70 × 50 km) y la cantidad; el motivo del rechazo se informa, pero no se guarda. |
| A16 | ✘ | Notificación al cliente (deseable). |
| A19 | ✔ | Semáforo por holgura de plazo, con rangos configurables (C10). |
| A21 | ✔ | Reprogramación con registro del cambio. |
| A24 | ✔ | Exportación CSV. |

**B. Planificación y replanificación**

| Ítem | Estado | Dónde |
|---|---|---|
| B1 B4 B5 B6 B7 B8 B17 | ✔ | `ModeloRuteo`, `AlgoritmoGenetico` y `AlgoritmoColoniaHormigas`: plazos, tipo de unidad, velocidades, doble sentido, 1 h de servicio, capacidad y costo. |
| B2 B3 B21 | ✔ | GA y ACO con el patrón Strategy, elegidos por parámetro. |
| B9 B10 B11 B12 | ✔ | Replanificación por bloqueo y por avería, reasignación de carga en tránsito y prioridad por plazo. |
| B13 B14 B15 B16 | ✔ | Turnos, refrigerio, recarga a las 23:59:59 y tope de 1 000 unidades. |
| B18 B19 B20 B22 | ✔ | Los tres escenarios; el 5D dura entre 30 y 60 minutos. |
| B23 B24 | ✔ | Experimentación con prueba t (por API, sin pantalla) y detección del colapso. |
| B25 | ✔ | Historial de rutas con la causa del cambio (`/api/corridas/{id}/rutas`). |

**C. Visualización y monitoreo**

| Ítem | Estado | Dónde |
|---|---|---|
| C1 C2 C3 C4 C11 C12 C20 C21 | ✔ | Mapa SVG animado: unidades por tipo, rutas, almacenes, destinos, bloqueos y averiadas. |
| C5 C6 | ✔ | Web accesible desde cualquier dispositivo, con corrida compartida y vista independiente por usuario. |
| C7 C8 C9 C10 | ✔ | Semáforo verde / ámbar / rojo con umbrales configurables. |
| C13 C14 | ✔ | Reproducción del 5D (30-60 min) y del colapso, que se detiene sola. |
| C15 | ✘ | Pausar, adelantar o retroceder (deseable). |
| C16 C17 C18 C19 C22 C23 | ✔ | KPI, zoom y desplazamiento, detalle de unidad y de pedido, alertas de reasignación y filtros. |
| C24 | — | Video: entregable del equipo. |
| C25 | ✔ | Historial comparativo de experimentos (por API, sin pantalla). |

**D. Flota, turnos, simulación y reportes**

| Ítem | Estado | Dónde |
|---|---|---|
| D1 D2 D3 D10 D11 | ✔ | Flota, velocidades, costos, plazos y turnos configurables en Parámetros. |
| D4 D5 | ✔ | Turnos y refrigerio escalonado automático. |
| D6 D7 | ✔ | Bloqueos y averías desde archivo, desde el mapa o desde el modal de la unidad. |
| D8 D9 | ✔ | Almacén central infinito y recarga diaria de los intermedios. |
| D12 D13 D14 | ✔ | Los tres escenarios a partir de parámetros. |
| D15 D16 D17 D18 D19 D21 D25 | ✔ | Cierre (V-3): cumplimiento, costo, km por tipo, utilización, incidencias, colapso y verificación de la política de entrega. |
| D20 D23 | ✔ | Experimentación (por API): varias instancias, semillas y parámetros. |
| D22 D24 | ✔ | CSV del cierre, de los pedidos, de las corridas y de los experimentos; detalle de cada ejecución. |

---

## 13. Estructura

```
Resultado/
├─ INICIAR.bat · DETENER.bat · COMPILAR.bat           lanzadores de doble clic (Windows)
├─ INICIAR-DOCKER.bat · DETENER-DOCKER.bat · DESPLEGAR-VERCEL.bat · DESPLEGAR-AWS.bat
├─ dist/paqrap-app.jar                                ejecutable único (API + web)
├─ backend/                                           Spring Boot (pom.xml, mvnw, Dockerfile, src/)
├─ frontend/                                          Next.js (app/, components/, lib/, Dockerfile, vercel.json)
├─ scripts/windows/  scripts/linux/                   lógica de los lanzadores
├─ deploy/aws/                                        CloudFormation, scripts de despliegue, user data de EC2
├─ docker-compose.yml · render.yaml
└─ README.md
```
