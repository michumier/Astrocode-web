import React, { forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

export interface PlanetParticlesHandle {
  explode: (x: number, y: number) => void;
}

const COLORS = [
  '#4fc3f7', '#2196f3', '#ff7043', '#ff9800',
  '#ffb74d', '#ce93d8', '#81c784', '#64b5f6',
  '#f06292', '#ffd54f', '#4dd0e1', '#aed581'
];

const PARTICLE_COUNT = 60;

const PlanetParticles = forwardRef<PlanetParticlesHandle, { className?: string }>(({ className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useImperativeHandle(ref, () => ({
    explode(x: number, y: number) {
      const particles: Particle[] = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.3;
        const speed = 2 + Math.random() * 5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 4,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 1,
          decay: 0.008 + Math.random() * 0.015,
        });
      }
      particlesRef.current = particles;
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(animate);
    }
  }));

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    let alive = false;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      alive = true;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    if (alive) {
      animFrameRef.current = requestAnimationFrame(animate);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 50 }}
    />
  );
});

PlanetParticles.displayName = 'PlanetParticles';

export default PlanetParticles;
