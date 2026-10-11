// Tipos de la API del backend (paquete pe.pucp.paqrap.visualizador y afines).

export type EstadoCorrida = 'SIN_CORRIDA' | 'EN_CURSO' | 'FINALIZADA' | 'DETENIDA';
export type EscenarioId = 'TIEMPO_REAL' | 'SIMULACION_5D' | 'COLAPSO_LOGISTICO';
export type AlgoritmoId = 'GA' | 'ACO';

export interface Kpis {
  registrados: number;
  entregados: number;
  entregadosATiempo: number;
  enCurso: number;
  pendientes: number;
  incumplidos: number;
  cumplimiento: number;
  costo: number;
  km: number;
  flotaActiva: number;
  flotaTotal: number;
  reRuteosBloqueo: number;
  reRuteosAveria: number;
  reasignaciones: number;
  bloqueosVigentes: number;
  pedidosSinUnidad: number;
}

export interface AlmacenVisual {
  id: string;
  nombre: string;
  x: number;
  y: number;
  central: boolean;
  capacidad: number | null;
  stock: number | null;
}

export interface VehiculoVisual {
  id: string;
  tipo: 'AUTO' | 'MOTO' | 'BICICLETA';
  estado: string;
  estadoEtiqueta: string;
  x: number;
  y: number;
  carga: number;
  capacidad: number;
  pedidos: string[];
  holguraMinima: number | null;
  destino: string;
  tray: number[];
  base: string;
}

export interface PedidoVisual {
  id: string;
  x: number;
  y: number;
  cantidad: number;
  plazo: number;
  registroMin: number;
  limiteMin: number;
  estado: string;
  vehiculos: string;
  reprogramado: boolean;
  cliente: string;
}

export interface BloqueoVisual {
  id: string;
  puntos: number[];
  inicioMin: number;
  finMin: number;
}

export interface AlertaVisual {
  id: number;
  tipo: string;
  minuto: number;
  texto: string;
  vehiculo: string | null;
  pedido: string | null;
}

export interface InfoColapso {
  hora: number;
  fecha: string;
  motivo: string;
  cumplimiento: number;
  pedidosIncumplidos: number;
  pedidosSinUnidad: number;
  pedidosRegistrados: number;
  pedidosEntregados: number;
  diasSimulados: number;
}

export interface EstadoVisual {
  version: number;
  idCorrida: string;
  estadoCorrida: EstadoCorrida;
  escenario: EscenarioId;
  escenarioEtiqueta: string;
  algoritmo: AlgoritmoId;
  semilla: number;
  inicioMs: number;
  minutoActual: number;
  minutoFin: number | null;
  factor: number;
  tiempoRealSeg: number;
  diaActual: number;
  totalDias: number | null;
  umbralVerde: number;
  umbralAmbar: number;
  kpis: Kpis;
  almacenes: AlmacenVisual[];
  vehiculos: VehiculoVisual[];
  pedidos: PedidoVisual[];
  bloqueos: BloqueoVisual[];
  tramosManuales: number[][];
  alertas: AlertaVisual[];
  colapso: InfoColapso | null;
  mensaje: string | null;
}

export interface EventoDetalle {
  fecha: string;
  minuto: number;
  tipo: string;
  detalle: string;
}

export interface ParadaDetalle {
  secuencia: number;
  pedido: string;
  cliente: string;
  x: number;
  y: number;
  cantidad: number;
  llegada: string;
  salida: string;
  limite: string;
  estado: string;
  aTiempo: boolean;
}

export interface DetalleVehiculo {
  id: string;
  tipo: string;
  estado: string;
  x: number;
  y: number;
  almacenBase: string;
  capacidad: number;
  carga: number;
  velocidad: number;
  costoKm: number;
  horasAlimentacion: string[];
  turnoActual: string;
  proximoMantenimiento: string;
  averia: string | null;
  ruta: {
    id: string;
    causa: string;
    salida: string;
    regresoEstimado: string;
    almacenSalida: string;
    almacenRetorno: string;
    carga: number;
    paradas: ParadaDetalle[];
  } | null;
  pedidosABordo: string[];
  proximaParada: string;
  eta: string;
  rutasRealizadas: number;
  entregas: number;
  km: number;
  costo: number;
  eventos: EventoDetalle[];
}

export interface DetallePedido {
  id: string;
  cliente: string;
  x: number;
  y: number;
  cantidad: number;
  tipoEntrega: string;
  plazo: number;
  registro: string;
  limite: string;
  estado: string;
  holgura: number;
  vehiculos: string[];
  almacenes: string[];
  rutas: string[];
  entregaReal: string | null;
  aTiempo: boolean | null;
  reprogramado: boolean;
  canal: string;
  observaciones: string | null;
  partes: { id: string; cantidad: number; estado: string }[];
  modificable: boolean;
  eventos: EventoDetalle[];
}

export interface DetalleAlmacen {
  id: string;
  nombre: string;
  x: number;
  y: number;
  central: boolean;
  capacidad: number | null;
  stock: number | null;
  porcentaje: number | null;
  despachadoHoy: number;
  recarga: string;
  vehiculosEnAlmacen: string[];
  vehiculosEnCamino: string[];
}

export interface Configuracion {
  escenarios: { id: EscenarioId; etiqueta: string; descripcion: string; fechaInicioPorDefecto: string }[];
  algoritmos: { id: AlgoritmoId; etiqueta: string; parametros: Record<string, number> }[];
  tiposEntrega: { id: string; etiqueta: string; plazoHoras: number }[];
  flota: { tipo: string; etiqueta: string; letra: string; cantidad: number; capacidad: number; costoKm: number; velocidad: number; codigos: string }[];
  almacenes: { id: string; nombre: string; rol: string; x: number; y: number; capacidad: string; recarga: string }[];
  turnos: { rango: string; alimentacion: string }[];
  reglaAlimentacion: string;
  tiposAveria: { tipo: number; etiqueta: string; transbordo: boolean }[];
  umbrales: { verde: number; ambar: number };
  ciudad: { anchoKm: number; altoKm: number };
  parametrosPorDefecto: ParametrosCorrida;
  operacionPorDefecto: ParametrosOperacion;
  datosDisponibles: { primerMes: string; ultimoMes: string; meses: number };
}

export interface ParametrosOperacion {
  velocidadAuto: number;
  velocidadMoto: number;
  velocidadBicicleta: number;
  costoKmAuto: number;
  costoKmMoto: number;
  costoKmBicicleta: number;
  capacidadAuto: number;
  capacidadMoto: number;
  capacidadBicicleta: number;
  cantidadAutos: number;
  cantidadMotos: number;
  cantidadBicicletas: number;
  capacidadAlmacenIntermedio: number;
  horasCambioTurno: number[];
  duracionAlimentacionH: number;
  tiempoServicioH: number;
  plazoRegularH: number;
  plazoPriorizada4H: number;
  plazoPriorizada8H: number;
  plazoPriorizada12H: number;
  plazoPriorizada18H: number;
  [clave: string]: unknown;
}

export interface ParametrosCorrida {
  escenario: EscenarioId;
  algoritmo: AlgoritmoId;
  semilla: number;
  fechaInicio: string | null;
  umbrales: { verde: number; ambar: number };
  diasSimulacion: number;
  duracionObjetivoMin: number;
  factorAceleracionColapso: number;
  ventanaPlanificacionMin: number;
  umbralColapsoVencidos: number;
  umbralColapsoBacklog: number;
  averiasPorDia: number;
  generarAverias: boolean;
  parametrosAlgoritmo: Record<string, number>;
  operacion: ParametrosOperacion;
}

export interface ResumenArchivo {
  tipo: string;
  nombre: string;
  descripcion: string;
  registros: number;
  lineas: number;
  errores: number;
  valido: boolean;
  personalizado: boolean;
  detalleErrores: { numeroLinea: number; contenido: string; motivo: string }[];
}

export interface CierreCorrida {
  idCorrida: string;
  escenario: EscenarioId;
  escenarioEtiqueta: string;
  algoritmo: AlgoritmoId;
  semilla: number;
  fechaInicio: string;
  fechaFin: string;
  horasSimuladas: number;
  estado: string;
  motivoFin: string | null;
  inicioRealMs: number;
  finRealMs: number;
  duracionRealSeg: number;
  resumen: {
    pedidosRegistrados: number;
    entregados: number;
    entregadosATiempo: number;
    entregadosTarde: number;
    enCurso: number;
    incumplidosSinEntregar: number;
    cancelados: number;
    cumplimiento: number;
    porcentajeEntregadosATiempo: number;
    costoTotal: number;
    kmTotal: number;
    reRuteosBloqueo: number;
    reRuteosAveria: number;
    reasignaciones: number;
    reprogramaciones: number;
    pedidosDivididos: number;
    paradasRecortadasMantenimiento: number;
    rutasDespachadas: number;
    unidadesEntregadas: number;
    costoPorPedidoEntregado: number;
    tiempoComputoPlanificadorMs: number;
    planificaciones: number;
  };
  cumplimientoPorDia: {
    dia: number;
    fecha: string;
    registrados: number;
    aTiempo: number;
    incumplidos: number;
    enCurso: number;
    cumplimiento: number;
    cumplimientoAcumuladoAlCierre: number | null;
  }[];
  kmPorTipo: { tipo: string; unidades: number; rutas: number; km: number; costo: number }[];
  utilizacionFlota: {
    id: string;
    tipo: string;
    rutas: number;
    entregas: number;
    unidades: number;
    km: number;
    costo: number;
    horasEnRuta: number;
    factorCargaPromedio: number;
  }[];
  incidencias: {
    bloqueosProgramados: number;
    bloqueosManuales: number;
    averias: number;
    detalleAverias: { id: string; vehiculo: string; tipo: string; fecha: string; origen: string; causa: string; pedidosAfectados: number }[];
    eventosPorTipo: Record<string, number>;
  };
  verificacion: {
    pedidosEntregados: number;
    entregadosFueraDePlazo: number;
    pedidosFueraDePlazo: string[];
    pedidosIncumplidos: number;
    politicaCumplida: boolean;
    mensaje: string;
  };
  colapso: InfoColapso | null;
  parametros: Record<string, unknown>;
  fuentes: Record<string, string>;
}

export interface FilaPedido {
  id: string;
  cliente: string;
  x: number;
  y: number;
  cantidad: number;
  tipoEntrega: string;
  plazo: number;
  registro: string;
  limite: string;
  estado: string;
  vehiculos: string;
  entregaReal: string;
  aTiempo: boolean | null;
  reprogramado: boolean;
  canal: string;
  observaciones: string;
  holgura: number;
  modificable: boolean;
}

export interface CorridaHistorial {
  id: string;
  escenario: EscenarioId;
  algoritmo: AlgoritmoId;
  semilla: number;
  fechaInicioSim: string;
  inicioReal: string;
  finReal: string | null;
  estado: string;
  motivoFin: string | null;
  cumplimiento: number | null;
  costoTotal: number | null;
  pedidos: number | null;
  tieneCierre: boolean;
}

export interface ResumenEstadistico {
  n: number;
  media: number;
  desviacion: number;
  minimo: number;
  maximo: number;
}

export interface Experimento {
  id: string;
  estado: 'EN_COLA' | 'EN_CURSO' | 'TERMINADO' | 'ERROR' | 'INTERRUMPIDO';
  descripcion: string;
  totalCorridas: number;
  corridasHechas: number;
  progreso: number;
  creadoMs: number;
  terminadoMs: number | null;
  solicitud: {
    escenario: EscenarioId;
    fechaInicio: string;
    instancias: number;
    diasEntreInstancias: number;
    semillaBase: number;
    algoritmos: AlgoritmoId[];
    averiasPorDia: number;
    diasMaximosColapso: number;
  };
  corridas: {
    algoritmo: AlgoritmoId;
    instancia: number;
    fechaInicio: string;
    semilla: number;
    indicadores: Record<string, number>;
    tiempoRealMs: number;
    colapso: string | null;
  }[];
  resumen: {
    metrica: string;
    etiqueta: string;
    menorEsMejor: boolean;
    porAlgoritmo: Record<string, ResumenEstadistico>;
    prueba: { n: number; diferenciaMedia: number; estadisticoT: number; gradosLibertad: number; valorP: number } | null;
    mejor: string | null;
    significativo: boolean;
  }[];
  conclusion: string | null;
  mensaje: string | null;
}
