import React, { useEffect } from 'react';
import { PropsVisor } from '../VisorGenerico';
import { Pareja, pulsosTotales } from './audio';
import { Osciloscopio, Pista, useReproductor, Volumen } from './Pista';
import './Radio.css';

const describir = (p?: Pareja) => (p ? `("${p[0]}", ${p[1]})` : '—');

// R1 y R2: tu transmisión frente a la señal objetivo
const Transmision: React.FC<{ final: any; reproductor: ReturnType<typeof useReproductor> }> = ({ final, reproductor }) => {
  const { sonando, progreso, tocar } = reproductor;
  const tuya: Pareja[] = final.respuesta || [];
  const objetivo: Pareja[] = final.objetivo || [];
  const pulsos = Math.max(pulsosTotales(tuya), pulsosTotales(objetivo));
  const d = final.diferencia;
  return (
    <>
      <div className="radio-botones">
        <button className="radio-boton" onClick={() => tocar('tuya', tuya)} disabled={!tuya.length}>
          {sonando === 'tuya' ? '📡 Sonando…' : '🔊 Escuchar tu señal'}
        </button>
        <button className="radio-boton secundario" onClick={() => tocar('objetivo', objetivo)}>
          {sonando === 'objetivo' ? '📡 Sonando…' : '🎧 Escuchar la señal objetivo'}
        </button>
      </div>
      <Pista titulo="Objetivo" senal={objetivo} pulsos={pulsos} diferencia={d}
        progreso={sonando === 'objetivo' ? progreso : null} />
      <Pista titulo="Tu señal" senal={tuya} pulsos={pulsos} diferencia={d}
        progreso={sonando === 'tuya' ? progreso : null} />
      {d !== null && d !== undefined && (
        <p className="radio-nota">
          Primera diferencia en la posición <strong>{d}</strong>: esperaba <code>{describir(objetivo[d])}</code>,
          llegó <code>{describir(tuya[d])}</code>.
        </p>
      )}
    </>
  );
};

// R3: la señal dañada y tu texto, que aparece letra a letra como un teletipo
const Recepcion: React.FC<{ escena: any; final: any; exito: boolean; reproductor: ReturnType<typeof useReproductor> }> = ({
  escena, final, exito, reproductor,
}) => {
  const { sonando, progreso, tocar } = reproductor;
  const texto: string = final.respuesta ?? '';
  const visibles = sonando === 'senal' ? Math.floor(progreso * texto.length) : texto.length;
  const d: number | null = final.diferencia;
  return (
    <>
      <div className="radio-botones">
        <button className="radio-boton" onClick={() => tocar('senal', escena.senal)}>
          {sonando === 'senal' ? '📡 Sonando…' : '🔊 Escuchar la señal recibida'}
        </button>
      </div>
      <Pista titulo="Recibida" senal={escena.senal} progreso={sonando === 'senal' ? progreso : null} />
      <div className="radio-teletipo" aria-label={`Tu texto: ${texto}`}>
        <span className="radio-teletipo-etiqueta">📠 Tu texto</span>
        <span className="radio-teletipo-texto">
          {texto.slice(0, visibles).split('').map((c, i) => (
            <span key={i} className={!exito && d !== null && i >= d ? 'mal' : ''}>{c === ' ' ? ' ' : c}</span>
          ))}
          {visibles < texto.length && <span className="radio-cursor">▌</span>}
          {!texto && <em>(vacío)</em>}
        </span>
      </div>
      {!exito && final.esperado && (
        <p className="radio-nota">El mensaje era <strong>«{final.esperado}»</strong>.</p>
      )}
    </>
  );
};

const VisorRadio: React.FC<PropsVisor> = ({ escena, fotogramas, exito, idVuelo }) => {
  const reproductor = useReproductor();
  const final = fotogramas[fotogramas.length - 1];
  const { parar } = reproductor;
  useEffect(() => parar, [idVuelo, parar]);

  if (!final || final.fase !== 'fin') {
    return <div className="radio-visor fallo"><p>La transmisión no llegó a terminar.</p></div>;
  }
  return (
    <div className={`radio-visor ${exito ? 'exito' : 'fallo'}`}>
      <div className="radio-cabecera">
        <span>{exito ? '📡 Señal recibida en la Tierra' : '📻 La señal no es la esperada'}</span>
        <Volumen volumen={reproductor.volumen} setVolumen={reproductor.setVolumen} />
      </div>
      {escena.variante === 'descifrar'
        ? <Recepcion escena={escena} final={final} exito={exito} reproductor={reproductor} />
        : <Transmision final={final} reproductor={reproductor} />}
      <Osciloscopio analizador={reproductor.analizador} activo={!!reproductor.sonando} />
    </div>
  );
};

export default VisorRadio;
