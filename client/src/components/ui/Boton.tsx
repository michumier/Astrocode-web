import React from 'react';
import { Link } from 'react-router-dom';
import './ui.css';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro' | 'oscuro';
type Tamano = 'peq' | 'normal' | 'grande';

interface PropsComunes {
  variante?: Variante;
  tamano?: Tamano;
  icono?: React.ReactNode;
  // Botón solo con icono: entonces `aria-label` es obligatorio
  soloIcono?: boolean;
  anchoCompleto?: boolean;
  className?: string;
  children?: React.ReactNode;
}

type PropsBoton = PropsComunes & React.ButtonHTMLAttributes<HTMLButtonElement> & { cargando?: boolean; a?: undefined };
// Con `a` es un enlace de la propia web (react-router) con aspecto de botón
type PropsEnlace = PropsComunes & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { a: string; cargando?: undefined };

export const clasesBoton = ({ variante = 'secundario', tamano = 'normal', soloIcono, anchoCompleto, className }: PropsComunes) =>
  [
    'ui-boton',
    `ui-boton--${variante}`,
    tamano !== 'normal' && `ui-boton--${tamano}`,
    soloIcono && 'ui-boton--icono',
    anchoCompleto && 'ui-boton--ancho',
    className,
  ].filter(Boolean).join(' ');

const Boton: React.FC<PropsBoton | PropsEnlace> = (props) => {
  const { variante, tamano, icono, soloIcono, anchoCompleto, className, children, ...resto } = props;
  const clases = clasesBoton({ variante, tamano, soloIcono, anchoCompleto, className });

  if (props.a !== undefined) {
    const { a, cargando, ...enlace } = resto as PropsEnlace;
    return (
      <Link to={a} className={clases} {...enlace}>
        {icono}
        {!soloIcono && children}
      </Link>
    );
  }

  const { cargando, type, disabled, ...boton } = resto as PropsBoton;
  return (
    <button type={type ?? 'button'} className={clases} disabled={disabled || cargando} aria-busy={cargando || undefined} {...boton}>
      {cargando ? <span className="ui-giro" aria-hidden="true" /> : icono}
      {!soloIcono && children}
    </button>
  );
};

export default Boton;
