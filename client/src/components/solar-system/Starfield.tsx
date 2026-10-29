import React, { useRef, useEffect } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  layer: number;
}

const LAYERS = [
  { count: 80, sizeRange: [0.5, 1.2], alphaRange: [0.2, 0.6], speed: 0.02 },
  { count: 50, sizeRange: [1.0, 2.0], alphaRange: [0.3, 0.8], speed: 0.05 },
  { count: 20, sizeRange: [1.5, 3.0], alphaRange: [0.5, 1.0], speed: 0.1 },
];

const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Con «reducir movimiento» se pinta una vez, quieto, y solo se repinta al cambiar de tamaño
    const quieto = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (quieto) animate(0);
    };
    window.addEventListener('resize', resize);

    // Generate stars
    const stars: Star[] = [];
    LAYERS.forEach((layer, layerIndex) => {
      for (let i = 0; i < layer.count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: layer.sizeRange[0] + Math.random() * (layer.sizeRange[1] - layer.sizeRange[0]),
          alpha: layer.alphaRange[0] + Math.random() * (layer.alphaRange[1] - layer.alphaRange[0]),
          twinkleSpeed: 0.5 + Math.random() * 2,
          twinklePhase: Math.random() * Math.PI * 2,
          layer: layerIndex,
        });
      }
    });
    starsRef.current = stars;

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    if (!quieto) window.addEventListener('mousemove', handleMouse);

    // Animation
    let startTime = performance.now();
    const animate = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const star of stars) {
        const layer = LAYERS[star.layer];
        const parallaxX = mouseRef.current.x * layer.speed * 100;
        const parallaxY = mouseRef.current.y * layer.speed * 100;

        const twinkle = quieto ? 0.85 : Math.sin(elapsed * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
        const alpha = star.alpha * twinkle;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(
          star.x + parallaxX,
          star.y + parallaxY,
          star.size,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      if (!quieto) animFrameRef.current = requestAnimationFrame(animate);
    };
    resize();
    if (!quieto) animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        // inset y no 100vw: así no mide la barra de desplazamiento ni provoca scroll horizontal
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default Starfield;
