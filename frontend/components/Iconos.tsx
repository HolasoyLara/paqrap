// Iconos tematicos del mapa (prototipo v04): insignia de color (semaforo) con un glifo
// blanco que representa la figura real: auto, moto o bicicleta, paquete y edificio.
// Se dibujan centrados en (0, 0) en "pixeles de icono" y el mapa los escala para que
// conserven su tamano en pantalla con cualquier zoom.

export function GlifoVehiculo({ tipo }: { tipo: string }) {
  if (tipo === 'AUTO') {
    return (
      <g className="glifo-relleno" fill="#fff">
        <rect x={-7} y={-1} width={14} height={5} rx={1.5} />
        <path d="M -4,-1 L -2.5,-4.5 L 2.5,-4.5 L 4,-1 Z" />
        <circle cx={-4} cy={4} r={1.8} />
        <circle cx={4} cy={4} r={1.8} />
      </g>
    );
  }
  if (tipo === 'MOTO') {
    return (
      <g>
        <path d="M -5,4 L -1,-1 L 3,-1 L 5,4" fill="none" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M -1,-1 L -1,-3.5 L 1.5,-3.5" fill="none" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={-5} cy={4} r={2.3} fill="#fff" />
        <circle cx={5} cy={4} r={2.3} fill="#fff" />
      </g>
    );
  }
  return (
    <g fill="none" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={-4.6} cy={3.2} r={3.1} />
      <circle cx={4.6} cy={3.2} r={3.1} />
      <path d="M -4.6,3.2 L -1,-2 L 4.6,3.2 M -1,-2 L 1,-2 M -1,-2 L -2.3,3.2" />
    </g>
  );
}

export function GlifoPaquete() {
  return (
    <g fill="none" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x={-6} y={-5.5} width={12} height={11} rx={1.2} />
      <path d="M -6,-1.5 L 6,-1.5 M 0,-5.5 L 0,5.5" />
    </g>
  );
}

export function GlifoAlmacen() {
  return (
    <g>
      <path d="M -10,-1 L 0,-10 L 10,-1 Z" fill="none" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
      <rect x={-8.5} y={-1} width={17} height={11} fill="none" stroke="#fff" strokeWidth={1.6} />
      <rect x={-2.3} y={3} width={4.6} height={7} fill="#fff" />
    </g>
  );
}

/** Icono en miniatura para leyendas y tablas (fuera del mapa). */
export function IconoMini({ tipo, color, forma = 'circulo' }: { tipo: 'vehiculo' | 'pedido' | 'almacen'; color: string; forma?: string }) {
  return (
    <svg width={18} height={18} viewBox="-13 -13 26 26" aria-hidden>
      {tipo === 'almacen' ? <rect x={-12} y={-12} width={24} height={24} rx={6} fill={color} /> : <circle r={12} fill={color} />}
      {tipo === 'vehiculo' ? <GlifoVehiculo tipo={forma} /> : tipo === 'pedido' ? <GlifoPaquete /> : <GlifoAlmacen />}
    </svg>
  );
}
