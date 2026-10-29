import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ESCALA, Pareja, pulsosTotales, reproducir, Reproduccion } from './audio';

const CLAVE_VOLUMEN = 'astrocode-radio-volumen';

const leerVolumen = () => {
  try {
    const v = Number(localStorage.getItem(CLAVE_VOLUMEN));
    return Number.isFinite(v) && localStorage.getItem(CLAVE_VOLUMEN) !== null ? v : 0.6;
  } catch {
    return 0.6;
  }
};

// Reproduce una señal cada vez y da el progreso (0..1) para el cabezal y el teletipo
export function useReproductor() {
  const [sonando, setSonando] = useState<string | null>(null);
  const [progreso, setProgreso] = useState(0);
  const [volumen, setVolumenEstado] = useState(leerVolumen);
  const actual = useRef<Reproduccion | null>(null);
  const marco = useRef(0);

  const parar = useCallback(() => {
    actual.current?.parar();
    actual.current = null;
  }, []);

  useEffect(() => () => {
    cancelAnimationFrame(marco.current);
    actual.current?.parar();
  }, []);

  const tocar = useCallback((id: string, senal: Pareja[]) => {
    parar();
    const r = reproducir(senal, volumen, () => {
      cancelAnimationFrame(marco.current);
      setSonando((s) => (s === id ? null : s));
      setProgreso(0);
    });
    if (!r) return;
    actual.current = r;
    setSonando(id);
    const paso = () => {
      setProgreso(Math.max(0, Math.min(1, (r.ahora() - r.inicio) / r.duracion)));
      marco.current = requestAnimationFrame(paso);
    };
    marco.current = requestAnimationFrame(paso);
  }, [parar, volumen]);

  const setVolumen = (v: number) => {
    setVolumenEstado(v);
    try { localStorage.setItem(CLAVE_VOLUMEN, String(v)); } catch { /* sin almacenamiento */ }
  };

  // Estable entre renders: el osciloscopio no se reinicia en cada fotograma
  const analizador = useCallback(() => actual.current?.analizador ?? null, []);

  return { sonando, progreso, volumen, setVolumen, tocar, parar, analizador };
}

interface PropsPista {
  titulo: string;
  senal: Pareja[];
  // Elemento que no coincide (se marca en rojo)
  diferencia?: number | null;
  // Pulsos de la otra pista, para que las dos compartan escala
  pulsos?: number;
  progreso?: number | null;
}

const ALTO = 60;

// Una pista tipo «piano roll»: cada pitido es una barra a la altura de su nota; la estática, gris
export const Pista: React.FC<PropsPista> = ({ titulo, senal, diferencia, pulsos, progreso }) => {
  const total = Math.max(pulsos ?? 0, pulsosTotales(senal), 1);
  let t = 0;
  const barras = senal.map(([nota, d], i) => {
    const x = t;
    t += d;
    return { nota, d, x, i };
  });
  const diferente = diferencia !== null && diferencia !== undefined ? barras[diferencia] : null;
  return (
    <div className="radio-pista">
      <span className="radio-pista-titulo">{titulo}</span>
      <svg viewBox={`0 0 ${total} ${ALTO}`} preserveAspectRatio="none" role="img"
        aria-label={`${titulo}: ${senal.length} sonidos y silencios, ${total} pulsos`}>
        <line x1={0} y1={ALTO - 4} x2={total} y2={ALTO - 4} className="radio-base" />
        {barras.map(({ nota, d, x, i }) => {
          if (nota === 'silencio') return null;
          if (nota === 'estatica') {
            return <rect key={i} x={x} y={6} width={d} height={ALTO - 12} className="radio-estatica" />;
          }
          const nivel = Math.max(0, ESCALA.indexOf(nota));
          const y = ALTO - 10 - (nivel / (ESCALA.length - 1)) * (ALTO - 22);
          return <rect key={i} x={x + 0.08} y={y - 4} width={Math.max(d - 0.16, 0.3)} height={8} rx={0.6}
            className={`radio-pitido ${i === diferencia ? 'mal' : ''}`} />;
        })}
        {diferente && (
          <rect x={diferente.x} y={0} width={Math.max(diferente.d, 0.6)} height={ALTO} className="radio-diferencia" />
        )}
        {diferencia !== null && diferencia !== undefined && !diferente && (
          <rect x={t} y={0} width={Math.max(total - t, 0.6)} height={ALTO} className="radio-diferencia" />
        )}
        {progreso !== null && progreso !== undefined && (
          <line x1={progreso * total} y1={0} x2={progreso * total} y2={ALTO} className="radio-cabezal" />
        )}
      </svg>
    </div>
  );
};

// Osciloscopio: dibuja la onda que está sonando
export const Osciloscopio: React.FC<{ analizador: () => AnalyserNode | null; activo: boolean }> = ({ analizador, activo }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx || !canvas.current) return;
    const { width, height } = canvas.current;
    let marco = 0;
    const dibujar = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = '#5cc8c2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const a = analizador();
      if (a && activo) {
        const datos = new Uint8Array(a.fftSize);
        a.getByteTimeDomainData(datos);
        datos.forEach((v, i) => {
          const x = (i / datos.length) * width;
          const y = (v / 255) * height;
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        });
        marco = requestAnimationFrame(dibujar);
      } else {
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
      }
      ctx.stroke();
    };
    dibujar();
    return () => cancelAnimationFrame(marco);
  }, [analizador, activo]);
  return <canvas ref={canvas} className="radio-osciloscopio" width={600} height={60} aria-hidden="true" />;
};

export const Volumen: React.FC<{ volumen: number; setVolumen: (v: number) => void }> = ({ volumen, setVolumen }) => (
  <label className="radio-volumen">
    🔈
    <input type="range" min={0} max={1} step={0.05} value={volumen} onChange={(e) => setVolumen(Number(e.target.value))}
      aria-label="Volumen" />
  </label>
);
