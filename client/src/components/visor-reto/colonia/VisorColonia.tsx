import React, { useEffect, useMemo, useState } from 'react';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { PropsVisor } from '../VisorGenerico';
import MapaColonia from './MapaColonia';
import './Colonia.css';

const MS_GENERACION = 400;
const VELOCIDADES = [1, 2, 4];

const TablaRegla: React.FC<{ tabla: { viva: boolean[]; muerta: boolean[] } }> = ({ tabla }) => (
  <table className="colonia-tabla">
    <caption>📋 Tu regla</caption>
    <thead>
      <tr><th>vecinas</th>{tabla.viva.map((_, n) => <th key={n}>{n}</th>)}</tr>
    </thead>
    <tbody>
      {(['viva', 'muerta'] as const).map((fila) => (
        <tr key={fila}>
          <th>{fila}</th>
          {tabla[fila].map((v, n) => (
            <td key={n} className={v ? 'si' : 'no'} aria-label={`${fila} con ${n} vecinas: ${v ? 'vive' : 'muere'}`}>{v ? '✓' : '✗'}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const VisorColonia: React.FC<PropsVisor> = ({ escena, fotogramas, exito, idVuelo, onTick }) => {
  const final = fotogramas[fotogramas.length - 1];
  const generaciones: string[] = useMemo(() => final?.generaciones || [], [final]);
  const ultima = Math.max(generaciones.length - 1, 0);
  const [g, setG] = useState(0);
  const [jugando, setJugando] = useState(true);
  const [velocidad, setVelocidad] = useState(1);

  useEffect(() => {
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setG(reducido ? ultima : 0);
    setJugando(!reducido);
  }, [idVuelo, ultima]);

  useEffect(() => {
    if (!jugando) return;
    if (g >= ultima) {
      setJugando(false);
      return;
    }
    const t = setTimeout(() => setG((x) => Math.min(x + 1, ultima)), MS_GENERACION / velocidad);
    return () => clearTimeout(t);
  }, [jugando, g, ultima, velocidad]);

  useEffect(() => {
    onTick?.(g);
  }, [g, onTick]);

  const poblacion = useMemo(() => generaciones.map((c) => c.split('').filter((x) => x === '1').length), [generaciones]);
  if (!final || final.fase !== 'fin') {
    return <div className="colonia-visor fallo"><p>La simulación no llegó a empezar.</p></div>;
  }
  const actual = generaciones[g] || '';
  const cubiertas = escena.objetivo.filter((i: number) => actual[i] === '1').length;
  const infectadaAqui = final.infectada !== null && g >= final.infectada;
  const maxPob = Math.max(...poblacion, 1);
  const puntos = poblacion.map((p, i) => `${(i / Math.max(ultima, 1)) * 100},${30 - (p / maxPob) * 28}`).join(' ');

  return (
    <div className={`colonia-visor ${exito ? 'exito' : 'fallo'}`}>
      <div className="colonia-controles">
        <span>Generación <strong>{g}</strong> / {escena.generaciones}</span>
        <button onClick={() => { setJugando(false); setG(0); }} aria-label="Al principio"><SkipBack size={16} aria-hidden="true" /></button>
        <button onClick={() => { if (g >= ultima) setG(0); setJugando((j) => !j); }} aria-label={jugando ? 'Pausa' : 'Reproducir'}>
          {jugando ? <Pause size={16} aria-hidden="true" fill="currentColor" /> : <Play size={16} aria-hidden="true" fill="currentColor" />}
        </button>
        <button onClick={() => { setJugando(false); setG(ultima); }} aria-label="Al final"><SkipForward size={16} aria-hidden="true" /></button>
        <input type="range" min={0} max={ultima} value={g} aria-label="Generación"
          onChange={(e) => { setJugando(false); setG(Number(e.target.value)); }} />
        {VELOCIDADES.map((v) => (
          <button key={v} className={v === velocidad ? 'activa' : ''} onClick={() => setVelocidad(v)}>×{v}</button>
        ))}
      </div>
      <div className="colonia-cuerpo">
        <MapaColonia mapa={escena} celdas={actual} alarma={infectadaAqui} titulo={`Colonia en la generación ${g}`} />
        <div className="colonia-panel">
          <div>
            📈 Población <strong>{poblacion[g]}</strong>
            <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="colonia-grafica" aria-hidden="true">
              <polyline points={puntos} />
              <line x1={(g / Math.max(ultima, 1)) * 100} y1={0} x2={(g / Math.max(ultima, 1)) * 100} y2={32} />
            </svg>
          </div>
          <div>🎯 Zona cubierta: <strong>{Math.round((100 * cubiertas) / escena.objetivo.length)} %</strong>
            {final.cubierta !== null && g >= final.cubierta && <span className="colonia-ok"> ✅ en la generación {final.cubierta}</span>}
          </div>
          <div>🏠 Base: {infectadaAqui ? <strong className="colonia-mal">☣️ infectada</strong> : <strong>intacta ✅</strong>}</div>
          <TablaRegla tabla={final.tabla} />
        </div>
      </div>
      {infectadaAqui && <p className="colonia-aviso">☣️ La colonia alcanzó la base en la generación {final.infectada}.</p>}
    </div>
  );
};

export default VisorColonia;
