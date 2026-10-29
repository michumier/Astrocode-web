import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { DIBUJOS, SEGUNDOS_POR_TICK, EstadoVisor } from './dibujos';
import './VisorMision.css';

interface VisorMisionProps {
  mision: string;
  escena: any;
  fotogramas: any[];
  exito: boolean;
  // Cambia en cada lanzamiento para reiniciar la reproducción
  idVuelo: number;
  // Avisa del tick que se está viendo (para resaltar el registro de vuelo)
  onTick?: (tick: number) => void;
}

const VELOCIDADES = [0.5, 1, 2, 4];

const VisorMision: React.FC<VisorMisionProps> = ({ mision, escena, fotogramas, exito, idVuelo, onTick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [indice, setIndice] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(true);
  const [velocidad, setVelocidad] = useState(1);
  const ultimo = fotogramas.length - 1;

  // Estado de la animación en refs (el bucle no debe depender de renders de React)
  const posicion = useRef(0);           // ticks (con decimales)
  const finAlcanzado = useRef<number | null>(null);
  const reproduciendoRef = useRef(true);
  const velocidadRef = useRef(1);
  reproduciendoRef.current = reproduciendo;
  velocidadRef.current = velocidad;

  const movimientoReducido = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Nuevo vuelo: volver al principio y reproducir
  useEffect(() => {
    posicion.current = 0;
    finAlcanzado.current = null;
    setIndice(0);
    setReproduciendo(true);
  }, [idVuelo]);

  // Canvas nítido en pantallas de alta densidad y adaptado al ancho
  useEffect(() => {
    const canvas = canvasRef.current;
    const contenedor = contenedorRef.current;
    if (!canvas || !contenedor) return;
    let anchoActual = -1;
    let pendiente = 0;
    const ajustar = () => {
      const ancho = contenedor.clientWidth;
      // Solo importa el ancho: cambiar la altura del canvas cambia la del contenedor
      // y, si se reaccionara a eso, el observador entraría en bucle
      if (ancho === anchoActual) return;
      anchoActual = ancho;
      const alto = Math.round(Math.min(Math.max(ancho * 0.75, 280), 460));
      const dpr = window.devicePixelRatio || 1;
      canvas.width = ancho * dpr;
      canvas.height = alto * dpr;
      canvas.style.height = `${alto}px`;
    };
    ajustar();
    const observador = new ResizeObserver(() => {
      cancelAnimationFrame(pendiente);
      pendiente = requestAnimationFrame(ajustar);
    });
    observador.observe(contenedor);
    return () => {
      cancelAnimationFrame(pendiente);
      observador.disconnect();
    };
  }, []);

  // Bucle de animación
  useEffect(() => {
    const dibujar = DIBUJOS[mision];
    if (!dibujar || fotogramas.length === 0) return;
    let anterior = performance.now();
    let id = 0;
    let indiceMostrado = -1;

    const paso = (ahora: number) => {
      // La marca de tiempo del primer fotograma puede ser anterior a performance.now() del arranque:
      // sin el max() el intervalo saldría negativo y la posición quedaría por debajo de 0
      const dt = Math.max(0, Math.min(ahora - anterior, 250)) / 1000;
      anterior = Math.max(anterior, ahora);
      if (reproduciendoRef.current && posicion.current < ultimo) {
        posicion.current = Math.min(ultimo, posicion.current + (dt * velocidadRef.current) / SEGUNDOS_POR_TICK[mision]);
      }
      if (posicion.current >= ultimo && finAlcanzado.current === null) finAlcanzado.current = ahora;
      if (posicion.current < ultimo) finAlcanzado.current = null;

      posicion.current = Math.max(0, Math.min(posicion.current, ultimo));
      const i = Math.floor(posicion.current);
      if (i !== indiceMostrado) {
        indiceMostrado = i;
        setIndice(i);
        onTick?.(i);
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const estado: EstadoVisor = {
          escena,
          fotogramas,
          indice: i,
          fraccion: movimientoReducido ? 0 : posicion.current - i,
          terminado: finAlcanzado.current !== null,
          exito,
          tiempoFinal: finAlcanzado.current === null ? 0 : ahora - finAlcanzado.current,
          movimientoReducido,
        };
        dibujar({ ctx, ancho: canvas.width / dpr, alto: canvas.height / dpr }, estado);
      }
      id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [mision, escena, fotogramas, exito, ultimo, movimientoReducido, onTick]);

  const irA = (i: number) => {
    posicion.current = Math.max(0, Math.min(ultimo, i));
    finAlcanzado.current = null;
    setIndice(Math.floor(posicion.current));
  };

  return (
    <div className="visor-mision">
      <div ref={contenedorRef} className="visor-lienzo">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Simulación de la misión: ${exito ? 'superada' : 'fallida'} en ${ultimo} ticks`}
        />
      </div>
      <div className="visor-controles">
        <button onClick={() => irA(0)} title="Volver al principio" aria-label="Volver al principio"><SkipBack size={16} aria-hidden="true" /></button>
        <button
          onClick={() => {
            if (posicion.current >= ultimo) irA(0);
            setReproduciendo((r) => !r || posicion.current >= ultimo);
          }}
          aria-label={reproduciendo ? 'Pausa' : 'Reproducir'}
          className="visor-play"
        >
          {reproduciendo && indice < ultimo ? <Pause size={16} aria-hidden="true" fill="currentColor" /> : <Play size={16} aria-hidden="true" fill="currentColor" />}
        </button>
        <button onClick={() => { setReproduciendo(false); irA(Math.floor(posicion.current) + 1); }} title="Avanzar un tick" aria-label="Avanzar un tick"><SkipForward size={16} aria-hidden="true" /></button>
        <input
          type="range"
          min={0}
          max={ultimo}
          value={indice}
          onChange={(e) => { setReproduciendo(false); irA(Number(e.target.value)); }}
          aria-label="Línea de tiempo"
        />
        <span className="visor-tick">{indice}/{ultimo}</span>
        <select value={velocidad} onChange={(e) => setVelocidad(Number(e.target.value))} aria-label="Velocidad">
          {VELOCIDADES.map((v) => <option key={v} value={v}>×{v}</option>)}
        </select>
      </div>
      {mision === 'aterrizaje' && <GraficaVuelo fotogramas={fotogramas} indice={indice} />}
    </div>
  );
};

// Altura y velocidad a lo largo del vuelo (SVG ligero)
const GraficaVuelo: React.FC<{ fotogramas: any[]; indice: number }> = ({ fotogramas, indice }) => {
  const ancho = 600;
  const alto = 90;
  const n = Math.max(fotogramas.length - 1, 1);
  const maxH = Math.max(...fotogramas.map((f) => f.h), 1);
  const maxV = Math.max(...fotogramas.map((f) => Math.abs(f.v)), 2);
  const linea = (valor: (f: any) => number) =>
    fotogramas.map((f, i) => `${i === 0 ? 'M' : 'L'}${((i / n) * ancho).toFixed(1)},${valor(f).toFixed(1)}`).join(' ');
  const yLimite = alto - (2 / maxV) * (alto - 10) - 5;
  return (
    <svg className="grafica-vuelo" viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="none" role="img"
      aria-label="Gráfica de altura (azul) y velocidad de caída (naranja) durante el vuelo">
      <line x1="0" x2={ancho} y1={yLimite} y2={yLimite} className="grafica-limite" />
      <path d={linea((f) => alto - (f.h / maxH) * (alto - 10) - 5)} className="grafica-altura" />
      <path d={linea((f) => alto - (Math.abs(Math.min(f.v, 0)) / maxV) * (alto - 10) - 5)} className="grafica-velocidad" />
      <line x1={(indice / n) * ancho} x2={(indice / n) * ancho} y1="0" y2={alto} className="grafica-cursor" />
    </svg>
  );
};

export default VisorMision;
