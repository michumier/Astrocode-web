import React, { useEffect, useRef } from 'react';
import { PALETA } from '../paleta';

const MAGENTA = '#ff2bd6';

interface PropsLienzo {
  imagen: string;       // un carácter (0-9) por píxel, fila a fila
  ancho: number;
  alto: number;
  titulo: string;
  // Filas ya «impresas» por el escáner (por defecto, todas)
  filas?: number;
  // Píxeles que no coinciden con el objetivo (se marcan en magenta)
  distintos?: boolean[] | null;
  marcar?: boolean;
  onPixel?: (p: { x: number; y: number } | null) => void;
}

// Un lienzo de píxeles en canvas (los retos llegan a 100×64 = 6.400 píxeles)
const Lienzo: React.FC<PropsLienzo> = ({ imagen, ancho, alto, titulo, filas = alto, distintos, marcar, onPixel }) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#05070f';
    ctx.fillRect(0, 0, ancho, alto);
    const hasta = Math.min(filas, alto) * ancho;
    for (let i = 0; i < Math.min(hasta, imagen.length); i++) {
      const marcado = marcar && distintos?.[i];
      ctx.fillStyle = marcado ? MAGENTA : PALETA[Number(imagen[i])]?.color || '#000';
      ctx.fillRect(i % ancho, Math.floor(i / ancho), 1, 1);
    }
  }, [imagen, ancho, alto, filas, distintos, marcar]);

  const mover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const caja = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - caja.left) / caja.width) * ancho);
    const y = Math.floor(((e.clientY - caja.top) / caja.height) * alto);
    onPixel?.(x >= 0 && y >= 0 && x < ancho && y < alto ? { x, y } : null);
  };

  return (
    <figure className="nebulosa-lienzo">
      <figcaption>{titulo}</figcaption>
      <div className="nebulosa-marco" style={{ aspectRatio: `${ancho} / ${Math.max(alto, 1)}` }}>
        <canvas ref={canvas} width={ancho} height={alto} role="img" aria-label={`${titulo}: ${ancho}×${alto} píxeles`}
          onMouseMove={onPixel ? mover : undefined} onMouseLeave={onPixel ? () => onPixel(null) : undefined} />
        {filas < alto && <span className="nebulosa-escaner" style={{ top: `${(filas / alto) * 100}%` }} />}
      </div>
    </figure>
  );
};

export default Lienzo;
