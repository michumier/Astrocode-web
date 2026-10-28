import React, { useEffect, useMemo, useRef } from 'react';

const CELDA = 12;

export interface DatosMapa {
  lado: number;
  rocas: number[];
  base: number[];
  objetivo: number[];
  inicial: number[];
}

interface PropsMapa {
  mapa: DatosMapa;
  // Una cadena con un carácter por celda ('1' viva); sin ella se dibuja la colonia inicial
  celdas?: string;
  alarma?: boolean;
  titulo: string;
}

// El mapa de la colonia en canvas: rocas, base (rayada en rojo), zona verde y células que brillan
const MapaColonia: React.FC<PropsMapa> = ({ mapa, celdas, alarma, titulo }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { lado } = mapa;
  const conjuntos = useMemo(() => ({
    rocas: new Set(mapa.rocas), base: new Set(mapa.base), objetivo: new Set(mapa.objetivo), inicial: new Set(mapa.inicial),
  }), [mapa]);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const px = lado * CELDA;
    ctx.fillStyle = '#060b10';
    ctx.fillRect(0, 0, px, px);
    for (let i = 0; i < lado * lado; i++) {
      const x = (i % lado) * CELDA;
      const y = Math.floor(i / lado) * CELDA;
      if (conjuntos.rocas.has(i)) {
        ctx.fillStyle = '#5b5f6b';
        ctx.fillRect(x + 1, y + 1, CELDA - 2, CELDA - 2);
      } else if (conjuntos.base.has(i)) {
        ctx.fillStyle = alarma ? '#7a0f16' : '#3a1218';
        ctx.fillRect(x, y, CELDA, CELDA);
        ctx.strokeStyle = 'rgba(255, 82, 82, 0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + CELDA);
        ctx.lineTo(x + CELDA, y);
        ctx.stroke();
      } else if (conjuntos.objetivo.has(i)) {
        ctx.fillStyle = '#0d2a17';
        ctx.fillRect(x, y, CELDA, CELDA);
      }
      const viva = celdas ? celdas[i] === '1' : conjuntos.inicial.has(i);
      if (viva) {
        ctx.save();
        ctx.shadowColor = '#5cffd0';
        ctx.shadowBlur = 6;
        ctx.fillStyle = conjuntos.base.has(i) ? '#ff5252' : '#5cffd0';
        ctx.beginPath();
        ctx.arc(x + CELDA / 2, y + CELDA / 2, CELDA / 2 - 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    // Borde discontinuo de la zona verde
    const filas = mapa.objetivo.map((i) => Math.floor(i / lado));
    const cols = mapa.objetivo.map((i) => i % lado);
    if (filas.length) {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#3ddc84';
      ctx.lineWidth = 2;
      const x0 = Math.min(...cols) * CELDA;
      const y0 = Math.min(...filas) * CELDA;
      ctx.strokeRect(x0 + 1, y0 + 1, (Math.max(...cols) + 1) * CELDA - x0 - 2, (Math.max(...filas) + 1) * CELDA - y0 - 2);
      ctx.restore();
    }
  }, [lado, conjuntos, mapa.objetivo, celdas, alarma]);

  return (
    <canvas ref={canvas} className={`colonia-mapa ${alarma ? 'alarma' : ''}`} width={lado * CELDA} height={lado * CELDA}
      role="img" aria-label={titulo} />
  );
};

export default MapaColonia;
