import React, { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { Boton } from '../../components/ui';
import CodigoResaltado from '../../components/code-editor/CodigoResaltado';
import PaginaAlumno from '../comun/PaginaAlumno';
import { Concepto, NIVELES_GUIA, RECURSOS } from './contenido';
import './Guia.css';

// Copia el ejemplo y lo dice durante un momento
const Copiar: React.FC<{ codigo: string; titulo: string }> = ({ codigo, titulo }) => {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch { /* sin portapapeles: no pasa nada */ }
  };
  return (
    <Boton variante="fantasma" tamano="peq" onClick={copiar} aria-label={copiado ? 'Copiado' : `Copiar el ejemplo de ${titulo}`}
      icono={copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}>
      {copiado ? 'Copiado' : 'Copiar'}
    </Boton>
  );
};

const Tarjeta: React.FC<{ concepto: Concepto }> = ({ concepto }) => (
  <article className="guia__concepto" id={`guia-${concepto.id}`} aria-labelledby={`guia-${concepto.id}-titulo`}>
    <h2 id={`guia-${concepto.id}-titulo`}>{concepto.titulo}</h2>
    {concepto.texto.map((p) => <p key={p}>{p}</p>)}
    <div className="guia__ejemplo">
      <div className="guia__ejemplo-barra">
        <span>Ejemplo</span>
        <Copiar codigo={concepto.codigo} titulo={concepto.titulo} />
      </div>
      <CodigoResaltado codigo={concepto.codigo} className="guia__codigo" />
    </div>
  </article>
);

interface PropsGuia {
  onLogout?: () => void;
}

const Guia: React.FC<PropsGuia> = ({ onLogout }) => {
  const [nivel, setNivel] = useState(NIVELES_GUIA[0].id);
  const actual = NIVELES_GUIA.find((n) => n.id === nivel) || NIVELES_GUIA[0];

  return (
    <PaginaAlumno titulo="Guía de Python" subtitulo="Lo esencial de Python con ejemplos que puedes copiar y probar en tus ejercicios." onLogout={onLogout}>
      <div className="guia__niveles" role="tablist" aria-label="Nivel">
        {NIVELES_GUIA.map((n) => (
          <button key={n.id} type="button" role="tab" id={`guia-tab-${n.id}`} aria-selected={n.id === nivel} aria-controls="guia-panel"
            onClick={() => setNivel(n.id)}>
            {n.nombre}
          </button>
        ))}
      </div>

      <div className="guia__cuerpo" id="guia-panel" role="tabpanel" aria-labelledby={`guia-tab-${actual.id}`}>
        <nav className="guia__indice" aria-label={`Índice: ${actual.titulo.toLowerCase()}`}>
          <p>{actual.titulo}</p>
          <ul>
            {actual.conceptos.map((c) => <li key={c.id}><a href={`#guia-${c.id}`}>{c.titulo}</a></li>)}
          </ul>
        </nav>
        <div className="guia__conceptos">
          {actual.conceptos.map((c) => <Tarjeta key={c.id} concepto={c} />)}
        </div>
      </div>

      <section className="guia__recursos" aria-labelledby="guia-recursos">
        <h2 id="guia-recursos">Para seguir aprendiendo</h2>
        <ul>
          {RECURSOS.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noopener noreferrer">
                <span>
                  <strong>{r.nombre}</strong>
                  <small>{r.descripcion}</small>
                </span>
                <ExternalLink size={18} aria-hidden="true" />
                <span className="ac-oculto">(se abre en otra pestaña)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </PaginaAlumno>
  );
};

export default Guia;
