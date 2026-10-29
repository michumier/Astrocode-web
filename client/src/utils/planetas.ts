// Planetas del mapa: cuánto cuestan, qué nivel de ejercicios tienen y cómo se reparten
// los ejercicios cuando varios planetas comparten nivel (Mercurio, Venus y Tierra el 1;
// Marte y Júpiter el 2; Saturno el 3).
export const ORDEN_PLANETAS = ['mercurio', 'venus', 'tierra', 'marte', 'jupiter', 'saturno'];

export const PUNTOS_PLANETA: Record<string, number> = {
  mercurio: 0, venus: 0, tierra: 0, marte: 500, jupiter: 1000, saturno: 1500,
};

export const NIVEL_PLANETA: Record<string, number> = {
  mercurio: 1, venus: 1, tierra: 1, marte: 2, jupiter: 2, saturno: 3,
};

export const planetasDelNivel = (nivel: number) => ORDEN_PLANETAS.filter((p) => NIVEL_PLANETA[p] === nivel);

const grupo = (ejercicio: any) => (ejercicio.tipo === 'reto' || ejercicio.tipo === 'pilotaje' ? ejercicio.tipo : 'codigo');

// Trozo i de n de una lista, en partes seguidas y lo más iguales posible (las primeras, una más)
const trozo = <T,>(lista: T[], i: number, n: number): T[] => {
  const base = Math.floor(lista.length / n);
  const resto = lista.length % n;
  const inicio = i * base + Math.min(i, resto);
  return lista.slice(inicio, inicio + base + (i < resto ? 1 : 0));
};

// Ejercicios de un planeta a partir de los de su nivel. Cada tipo (ejercicios, retos, misiones) se
// ordena por id y se trocea en partes seguidas: el primer planeta se queda lo más básico y cada
// planeta recibe su mezcla de tipos. Siempre da lo mismo para los mismos ejercicios.
export function ejerciciosDelPlaneta(planeta: string, ejerciciosDelNivel: any[]): any[] {
  const companeros = planetasDelNivel(NIVEL_PLANETA[planeta]);
  const posicion = companeros.indexOf(planeta);
  if (posicion < 0) return [];
  const porId = [...ejerciciosDelNivel].sort((a, b) => Number(a.id) - Number(b.id));
  return ['codigo', 'reto', 'pilotaje'].flatMap((g) => trozo(porId.filter((e) => grupo(e) === g), posicion, companeros.length));
}

// Planeta más lejano que los puntos ya abren y el siguiente que falta (null si están todos)
export const planetaActual = (puntos: number) =>
  [...ORDEN_PLANETAS].reverse().find((p) => puntos >= PUNTOS_PLANETA[p]) || ORDEN_PLANETAS[0];

export const siguientePlaneta = (puntos: number) => ORDEN_PLANETAS.find((p) => puntos < PUNTOS_PLANETA[p]) || null;
