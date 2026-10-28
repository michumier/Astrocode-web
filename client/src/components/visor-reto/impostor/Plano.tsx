import React, { useMemo } from 'react';

export interface Pasillo {
  a: string;
  b: string;
  solo_denegado?: boolean;
}

export interface RutaPlano {
  salas: string[];
  tipo: 'ida' | 'vuelta';
  ok: boolean;
}

interface PropsPlano {
  salas: string[];
  pasillos: Pasillo[];
  // Sala del crimen (en rojo) y sala iluminada por el foco (el acusado)
  crimen?: string;
  foco?: string | null;
  // Nombres que se dibujan dentro de cada sala
  ocupantes?: Record<string, string[]>;
  rutas?: RutaPlano[];
  oscuro?: boolean;
  titulo: string;
}

const ANCHO_MINIMO = 440;
const SEPARACION = 100;
const ALTO = 240;

// Coloca las salas por capas de distancia al comedor (un recorrido en anchura, como en el reto)
export function colocar(salas: string[], pasillos: Pasillo[]) {
  const vecinos: Record<string, string[]> = Object.fromEntries(salas.map((s) => [s, []]));
  pasillos.forEach(({ a, b }) => {
    vecinos[a]?.push(b);
    vecinos[b]?.push(a);
  });
  const capa: Record<string, number> = { [salas[0]]: 0 };
  const orden = [salas[0]];
  for (let i = 0; i < orden.length; i++) {
    [...vecinos[orden[i]]].sort().forEach((v) => {
      if (capa[v] === undefined) {
        capa[v] = capa[orden[i]] + 1;
        orden.push(v);
      }
    });
  }
  salas.forEach((s) => {
    if (capa[s] === undefined) {
      capa[s] = 0;
      orden.push(s);
    }
  });
  const capas = Math.max(...Object.values(capa));
  const porCapa: Record<number, string[]> = {};
  orden.forEach((s) => (porCapa[capa[s]] = [...(porCapa[capa[s]] || []), s]));
  // Con estaciones alargadas el plano se ensancha (el SVG escala) para que las salas no se pisen
  const ancho = Math.max(ANCHO_MINIMO, 100 + capas * SEPARACION);
  const pos: Record<string, { x: number; y: number }> = {};
  Object.entries(porCapa).forEach(([c, lista]) => {
    lista.forEach((s, i) => {
      pos[s] = {
        x: 50 + (capas ? (Number(c) * (ancho - 100)) / capas : (ancho - 100) / 2),
        // Las capas de una sola sala van en zigzag: así un pasillo largo no queda en una única línea
        y: ((i + 1) * ALTO) / (lista.length + 1) + (lista.length === 1 ? (Number(c) % 2 ? 32 : -32) : 0),
      };
    });
  });
  return { pos, ancho };
}

const Plano: React.FC<PropsPlano> = ({ salas, pasillos, crimen, foco, ocupantes, rutas, oscuro, titulo }) => {
  const { pos, ancho } = useMemo(() => colocar(salas, pasillos), [salas, pasillos]);
  const tramo = (ruta: RutaPlano) =>
    ruta.salas.slice(1).map((s, i) => [ruta.salas[i], s] as const).filter(([a, b]) => pos[a] && pos[b]);

  return (
    <svg className={`impostor-plano ${oscuro ? 'oscuro' : ''}`} viewBox={`0 0 ${ancho} ${ALTO}`} role="img" aria-label={titulo}>
      {pasillos.map(({ a, b, solo_denegado }) => (
        <g key={`${a}-${b}`}>
          <line x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y}
            className={`impostor-pasillo ${solo_denegado ? 'denegado' : ''}`} />
          {solo_denegado && (
            <text x={(pos[a].x + pos[b].x) / 2} y={(pos[a].y + pos[b].y) / 2 - 4} className="impostor-pasillo-nota">
              solo en DENEGADO
            </text>
          )}
        </g>
      ))}
      {rutas?.map((ruta, r) =>
        tramo(ruta).map(([a, b], i) => (
          <line key={`${r}-${i}`} x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y}
            className={`impostor-ruta ${ruta.tipo} ${ruta.ok ? 'ok' : 'mal'}`}
            style={{ animationDelay: `${(ruta.tipo === 'vuelta' ? 0.6 : 0) + i * 0.15}s` }} />
        ))
      )}
      {salas.map((s) => (
        <g key={s} className={`impostor-sala ${s === crimen ? 'crimen' : ''} ${s === foco ? 'foco' : ''}`}>
          {s === foco && <circle cx={pos[s].x} cy={pos[s].y} r={44} className="impostor-foco" />}
          <rect x={pos[s].x - 40} y={pos[s].y - 13} width={80} height={26} rx={8} />
          <text x={pos[s].x} y={pos[s].y + 4}>{s === crimen ? `⚠ ${s}` : s}</text>
          {!!ocupantes?.[s]?.length && (
            <text x={pos[s].x} y={pos[s].y + 24} className="impostor-ocupante">
              {ocupantes[s].length <= 2 ? ocupantes[s].join(' · ') : `${ocupantes[s][0]} +${ocupantes[s].length - 1}`}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};

export default Plano;
