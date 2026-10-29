import React, { useEffect, useRef } from 'react';
import { Star } from 'lucide-react';
import Boton from './Boton';
import './ui.css';

export interface DatoPremio {
  valor: React.ReactNode;
  etiqueta: string;
}

interface PropsEnhorabuena {
  titulo: string;
  subtitulo?: React.ReactNode;
  datos?: DatoPremio[];
  // Lo propio de cada vista (revelación del sabotaje, insignias, estrellas…)
  children?: React.ReactNode;
  alVolver: () => void;
  // Escape, el fondo y el botón secundario: quien la abre decide adónde vuelve el foco
  alCerrar: () => void;
  textoCerrar?: string;
}

// Insignia de la enhorabuena: estrella en oro dentro de un aro cosido en turquesa
const Insignia = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10.5" stroke="var(--ac-turquesa)" strokeWidth="1.4" strokeDasharray="2.2 1.6" />
    <path d="M12 6.2l1.6 3.6 3.9.4-2.9 2.6.8 3.8L12 14.7l-3.4 1.9.8-3.8-2.9-2.6 3.9-.4z" fill="var(--ac-oro)" />
  </svg>
);

const Enhorabuena: React.FC<PropsEnhorabuena> = ({ titulo, subtitulo, datos, children, alVolver, alCerrar, textoCerrar = 'Quedarme aquí' }) => {
  const caja = useRef<HTMLDivElement>(null);
  // La función puede cambiar en cada render: el efecto usa siempre la última
  const cerrar = useRef(alCerrar);
  cerrar.current = alCerrar;

  // Al abrirse, el foco va a «Volver al mapa»; Escape la cierra
  useEffect(() => {
    caja.current?.querySelector('button')?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar.current(); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, []);

  return (
    <div className="ui-premio-fondo" onClick={(e) => { if (e.target === e.currentTarget) alCerrar(); }}>
      <div className="ui-premio" role="dialog" aria-modal="true" aria-labelledby="ui-premio-titulo" ref={caja}>
        <Insignia />
        <h2 id="ui-premio-titulo">{titulo}</h2>
        {subtitulo && <p className="ui-premio__sub">{subtitulo}</p>}
        {datos && datos.length > 0 && (
          <div className="ui-premio__datos">
            {datos.map((d) => <div key={d.etiqueta}><b>{d.valor}</b><span>{d.etiqueta}</span></div>)}
          </div>
        )}
        {children}
        <div className="ui-premio__botones">
          <Boton variante="primario" tamano="grande" onClick={alVolver}>Volver al mapa</Boton>
          <Boton variante="fantasma" onClick={alCerrar}>{textoCerrar}</Boton>
        </div>
      </div>
    </div>
  );
};

// Nota de una misión o reto: de 0 a 3 estrellas
export const Calificacion: React.FC<{ estrellas: number; tamano?: number; className?: string }> = ({ estrellas, tamano = 18, className }) => (
  <span className={`ui-calificacion${className ? ` ${className}` : ''}`} role="img" aria-label={`${estrellas} de 3 estrellas`}>
    {[0, 1, 2].map((i) => (
      <Star key={i} size={tamano} aria-hidden="true" className={i < estrellas ? 'llena' : ''} fill={i < estrellas ? 'currentColor' : 'none'} />
    ))}
  </span>
);

export default Enhorabuena;
