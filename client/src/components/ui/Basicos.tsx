import React, { useId } from 'react';
import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react';
import './ui.css';

// ---------- Etiqueta ----------
type Tono = 'neutro' | 'facil' | 'intermedio' | 'dificil' | 'turquesa' | 'oro';

// Etiqueta de dificultad a partir del nombre del nivel que da la API («Fácil», «Intermedio», «Difícil»)
export const tonoDeNivel = (nivel?: string | null): Tono => {
  const n = (nivel || '').toLowerCase();
  if (n.startsWith('f')) return 'facil';
  if (n.startsWith('i')) return 'intermedio';
  if (n.startsWith('d')) return 'dificil';
  return 'neutro';
};

export const Etiqueta: React.FC<{ tono?: Tono; icono?: React.ReactNode; children: React.ReactNode; className?: string }> = ({
  tono = 'neutro', icono, children, className,
}) => (
  <span className={['ui-etiqueta', `ui-etiqueta--${tono}`, className].filter(Boolean).join(' ')}>
    {icono}
    {children}
  </span>
);

// ---------- Panel ----------
export const Panel: React.FC<{
  titulo?: React.ReactNode;
  // Algo pequeño a la derecha del título (un contador, un enlace)
  extra?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  'aria-label'?: string;
}> = ({ titulo, extra, className, children, ...resto }) => {
  const id = useId();
  return (
    <section className={['ui-panel', className].filter(Boolean).join(' ')} aria-labelledby={titulo ? id : undefined} {...resto}>
      {(titulo || extra) && (
        <div className="ui-panel__cabecera">
          {titulo && <h2 className="ui-panel__titulo" id={id}>{titulo}</h2>}
          {extra}
        </div>
      )}
      {children}
    </section>
  );
};

// ---------- Campo ----------
type PropsCampo = React.InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  error?: string | null;
  ayuda?: string;
  // Algo pegado al final del campo, dentro de él (por ejemplo, «mostrar contraseña»)
  accesorio?: React.ReactNode;
};

export const Campo: React.FC<PropsCampo> = ({ etiqueta, error, ayuda, accesorio, id, className, ...input }) => {
  const propio = useId();
  const idCampo = id || propio;
  const idDescripcion = error || ayuda ? `${idCampo}-desc` : undefined;
  return (
    <div className={['ui-campo', error && 'ui-campo--error', className].filter(Boolean).join(' ')}>
      <label htmlFor={idCampo}>{etiqueta}</label>
      {accesorio ? (
        <div className="ui-campo__caja">
          <input id={idCampo} aria-invalid={error ? true : undefined} aria-describedby={idDescripcion} {...input} />
          <span className="ui-campo__accesorio">{accesorio}</span>
        </div>
      ) : (
        <input id={idCampo} aria-invalid={error ? true : undefined} aria-describedby={idDescripcion} {...input} />
      )}
      {error ? <span className="ui-campo__error" id={idDescripcion} role="alert">{error}</span>
        : ayuda ? <span className="ui-campo__ayuda" id={idDescripcion}>{ayuda}</span> : null}
    </div>
  );
};

// Texto largo y desplegable con la misma etiqueta, ayuda y error que Campo
type PropsArea = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { etiqueta: string; error?: string | null; ayuda?: string; codigo?: boolean };

export const CampoArea: React.FC<PropsArea> = ({ etiqueta, error, ayuda, codigo, id, className, ...area }) => {
  const propio = useId();
  const idCampo = id || propio;
  const idDescripcion = error || ayuda ? `${idCampo}-desc` : undefined;
  return (
    <div className={['ui-campo', codigo && 'ui-campo--codigo', error && 'ui-campo--error', className].filter(Boolean).join(' ')}>
      <label htmlFor={idCampo}>{etiqueta}</label>
      <textarea id={idCampo} aria-invalid={error ? true : undefined} aria-describedby={idDescripcion} spellCheck={codigo ? false : undefined} {...area} />
      {error ? <span className="ui-campo__error" id={idDescripcion} role="alert">{error}</span>
        : ayuda ? <span className="ui-campo__ayuda" id={idDescripcion}>{ayuda}</span> : null}
    </div>
  );
};

type PropsSelector = React.SelectHTMLAttributes<HTMLSelectElement> & { etiqueta: string; ayuda?: string };

export const CampoSelector: React.FC<PropsSelector> = ({ etiqueta, ayuda, id, className, children, ...select }) => {
  const propio = useId();
  const idCampo = id || propio;
  return (
    <div className={['ui-campo', 'ui-campo--selector', className].filter(Boolean).join(' ')}>
      <label htmlFor={idCampo}>{etiqueta}</label>
      <select id={idCampo} aria-describedby={ayuda ? `${idCampo}-desc` : undefined} {...select}>{children}</select>
      {ayuda && <span className="ui-campo__ayuda" id={`${idCampo}-desc`}>{ayuda}</span>}
    </div>
  );
};

// ---------- Aviso ----------
type TonoAviso = 'exito' | 'info' | 'atencion' | 'error';
const ICONOS_AVISO: Record<TonoAviso, React.ReactNode> = {
  exito: <CircleCheck size={22} aria-hidden="true" />,
  info: <Info size={22} aria-hidden="true" />,
  atencion: <TriangleAlert size={22} aria-hidden="true" />,
  error: <CircleX size={22} aria-hidden="true" />,
};

export const Aviso: React.FC<{ tono?: TonoAviso; titulo: React.ReactNode; icono?: React.ReactNode; children?: React.ReactNode; className?: string }> = ({
  tono = 'info', titulo, icono, children, className,
}) => (
  <div className={['ui-aviso', `ui-aviso--${tono}`, className].filter(Boolean).join(' ')} role={tono === 'error' ? 'alert' : 'status'}>
    <span className="ui-aviso__icono">{icono ?? ICONOS_AVISO[tono]}</span>
    <div>
      <strong className="ui-aviso__titulo">{titulo}</strong>
      {children && <span className="ui-aviso__texto">{children}</span>}
    </div>
  </div>
);
