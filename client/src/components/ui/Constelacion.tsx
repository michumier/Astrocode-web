import React, { useMemo } from 'react';
import './ui.css';

// Cada ejercicio de un planeta es una estrella: las hechas se encienden y se unen en turquesa,
// las pendientes esperan apagadas y la siguiente titila en oro. La figura de cada planeta es
// siempre la misma (se calcula a partir de su nombre), así que el alumno la reconoce.
export type EstadoEstrella = 'hecha' | 'siguiente' | 'pendiente';

export interface Estrella {
  id: string;
  titulo: string;
  estado: EstadoEstrella;
}

export const ANCHO = 280;
export const ALTO = 176;
const MARGEN = 20;
const DISTANCIA_MINIMA = 26;

// Generador pseudoaleatorio con semilla (mulberry32): misma semilla, misma constelación
function aleatorio(semilla: string) {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) {
    h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t + 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Punto {
  x: number;
  y: number;
  r: number;
}

// Las estrellas avanzan de izquierda a derecha subiendo y bajando, sin pisarse
export function colocarEstrellas(semilla: string, cantidad: number): Punto[] {
  const azar = aleatorio(semilla);
  const puntos: Punto[] = [];
  const util = ANCHO - 2 * MARGEN;
  let y = MARGEN + azar() * (ALTO - 2 * MARGEN);
  for (let i = 0; i < cantidad; i++) {
    let mejor: Punto | null = null;
    for (let intento = 0; intento < 30; intento++) {
      const base = cantidad === 1 ? ANCHO / 2 : MARGEN + (util * i) / (cantidad - 1);
      const x = Math.min(ANCHO - MARGEN, Math.max(MARGEN, base + (azar() - 0.5) * (util / Math.max(cantidad, 2)) * 0.8));
      const candidataY = Math.min(ALTO - MARGEN, Math.max(MARGEN, y + (azar() - 0.5) * ALTO * 0.75));
      const punto = { x, y: candidataY, r: 4.5 + azar() * 2.5 };
      mejor = punto;
      if (puntos.every((p) => Math.hypot(p.x - punto.x, p.y - punto.y) >= DISTANCIA_MINIMA)) break;
    }
    puntos.push(mejor as Punto);
    y = (mejor as Punto).y;
  }
  return puntos;
}

// Polvo de estrellas de fondo, también fijo por planeta
function polvo(semilla: string) {
  const azar = aleatorio(`${semilla}·polvo`);
  return Array.from({ length: 10 }, () => ({ x: azar() * ANCHO, y: azar() * ALTO, r: 0.6 + azar() * 0.7 }));
}

interface PropsConstelacion {
  // Nombre del planeta: decide la figura y aparece en la descripción accesible
  planeta: string;
  estrellas: Estrella[];
  className?: string;
}

const Constelacion: React.FC<PropsConstelacion> = ({ planeta, estrellas, className }) => {
  const puntos = useMemo(() => colocarEstrellas(planeta, estrellas.length), [planeta, estrellas.length]);
  const fondo = useMemo(() => polvo(planeta), [planeta]);
  const hechas = estrellas.filter((e) => e.estado === 'hecha').length;
  const siguiente = estrellas.find((e) => e.estado === 'siguiente');
  const descripcion = `Constelación de ${planeta}: ${hechas} de ${estrellas.length} ejercicios hechos` +
    (siguiente ? `; el siguiente es ${siguiente.titulo}` : '');

  return (
    <svg className={['ui-constelacion', className].filter(Boolean).join(' ')} viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label={descripcion}>
      <g fill="var(--ac-estrella)" opacity="0.35">
        {fondo.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} />)}
      </g>
      {puntos.slice(1).map((p, i) => {
        const a = puntos[i];
        const encendida = estrellas[i].estado === 'hecha' && estrellas[i + 1].estado === 'hecha';
        return (
          <line key={`l${i}`} x1={a.x} y1={a.y} x2={p.x} y2={p.y} strokeLinecap="round"
            stroke={encendida ? 'var(--ac-turquesa)' : 'var(--ac-tenue)'}
            strokeWidth={encendida ? 2 : 1.4} strokeDasharray={encendida ? undefined : '3 5'} />
        );
      })}
      {estrellas.map((e, i) => {
        const p = puntos[i];
        if (e.estado === 'pendiente') {
          return (
            <circle key={e.id} cx={p.x} cy={p.y} r={4.5} fill="var(--ac-noche)" stroke="var(--ac-tenue)" strokeWidth={1.5}>
              <title>{e.titulo}</title>
            </circle>
          );
        }
        return (
          <g key={e.id}>
            <title>{e.titulo}</title>
            <circle cx={p.x} cy={p.y} r={e.estado === 'siguiente' ? 5 : p.r} fill="var(--ac-estrella)" />
            {e.estado === 'siguiente' && (
              <circle className="ui-constelacion__siguiente" cx={p.x} cy={p.y} r={10} fill="none" stroke="var(--ac-oro)" strokeWidth={2} />
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default Constelacion;
