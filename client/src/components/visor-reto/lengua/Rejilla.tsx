import React from 'react';
import { PALETA, textoSobre } from '../paleta';
import './Lengua.css';

interface PropsRejilla {
  celdas: number[][];
  titulo?: string;
  numeros?: boolean;
  // Celdas marcadas como incorrectas ("fila,columna")
  errores?: Set<string>;
  // Cuántas celdas se ven ya (para la animación de pintado); por defecto, todas
  visibles?: number;
  // Tamaño máximo de la rejilla en píxeles (ancho)
  maximo?: number;
}

// Rejilla de colores de la paleta común. Cada celda lleva su nombre de color como título
// (y su número si se activa «ver números»): la información nunca depende solo del color.
const Rejilla: React.FC<PropsRejilla> = ({ celdas, titulo, numeros = false, errores, visibles, maximo = 220 }) => {
  const filas = celdas.length;
  const cols = celdas[0]?.length || 0;
  const lado = Math.max(10, Math.min(32, Math.floor(maximo / Math.max(cols, 1))));
  return (
    <figure className="rejilla">
      {titulo && <figcaption>{titulo}</figcaption>}
      <div
        className="rejilla-celdas"
        style={{ gridTemplateColumns: `repeat(${cols}, ${lado}px)`, gridAutoRows: `${lado}px` }}
        role="img"
        aria-label={`${titulo || 'Rejilla'}: ${filas} filas por ${cols} columnas`}
      >
        {celdas.flatMap((fila, f) =>
          fila.map((v, c) => {
            const i = f * cols + c;
            const pintada = visibles === undefined || i < visibles;
            const error = errores?.has(`${f},${c}`);
            return (
              <span
                key={i}
                className={`rejilla-celda ${error && pintada ? 'celda-mal' : ''}`}
                style={{
                  background: pintada ? PALETA[v]?.color : 'transparent',
                  color: textoSobre(v),
                  fontSize: Math.max(9, lado * 0.45),
                }}
                title={`(${f}, ${c}) ${PALETA[v]?.nombre ?? v}`}
              >
                {numeros && pintada ? v : ''}
              </span>
            );
          })
        )}
      </div>
    </figure>
  );
};

export default Rejilla;
