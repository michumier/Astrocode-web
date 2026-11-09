import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { BookOpen, Check, CircleCheck, Copy, ExternalLink, Lock } from 'lucide-react';
import { Boton } from '../../components/ui';
import CodigoResaltado from '../../components/code-editor/CodigoResaltado';
import PaginaAlumno from '../comun/PaginaAlumno';
import { GET_RUTA } from '../../utils/ruta';
import type { PlanetaRuta } from '../../utils/ruta';
import { Concepto, PARA_IR_MAS_ALLA, RECURSOS } from './contenido';
import '../../components/solar-system/SolarSystem.css';
import './Biblioteca.css';

// Biblioteca (fase 14): las lecciones de la ruta para repasar, agrupadas por planeta, y
// «Para ir más allá» con los temas que no entran en la ruta. Sustituye a la antigua Guía de Python.

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
  <article className="biblioteca__concepto" id={`biblioteca-${concepto.id}`} aria-labelledby={`biblioteca-${concepto.id}-titulo`}>
    <h3 id={`biblioteca-${concepto.id}-titulo`}>{concepto.titulo}</h3>
    <p className="biblioteca__cuando">{concepto.cuando}</p>
    {concepto.texto.map((p) => <p key={p}>{p}</p>)}
    <div className="biblioteca__ejemplo">
      <div className="biblioteca__ejemplo-barra">
        <span>Ejemplo</span>
        <Copiar codigo={concepto.codigo} titulo={concepto.titulo} />
      </div>
      <CodigoResaltado codigo={concepto.codigo} etiqueta={`Ejemplo: ${concepto.titulo}`} className="biblioteca__codigo" />
    </div>
  </article>
);

// Las lecciones de un planeta: las vistas se repasan, la siguiente se puede empezar y el resto espera
const LeccionesDe: React.FC<{ planeta: PlanetaRuta }> = ({ planeta }) => {
  const lecciones = planeta.pasos.filter((s) => s.tipo === 'leccion' && s.leccion);
  if (!lecciones.length) return null;
  const vistas = lecciones.filter((s) => s.estado === 'hecho').length;
  return (
    <section className="biblioteca__planeta" aria-labelledby={`biblioteca-${planeta.clave}`}>
      <div className="biblioteca__planeta-cabecera">
        <span className={`ss-cuerpo ss-${planeta.clave} biblioteca__astro`} aria-hidden="true" />
        <h3 id={`biblioteca-${planeta.clave}`}>{planeta.nombre}</h3>
        <span className="biblioteca__tema">{planeta.tema}</span>
        <span className="biblioteca__cuenta">{vistas} de {lecciones.length}</span>
      </div>
      <ul className="biblioteca__lecciones">
        {lecciones.map((s) => {
          const l = s.leccion!;
          const vista = s.estado === 'hecho';
          const abierta = vista || s.estado === 'siguiente' || s.estado === 'pendiente';
          return (
            <li key={l.id} className={`biblioteca__leccion ${vista ? 'vista' : ''} ${abierta ? '' : 'cerrada'}`}>
              <span className="biblioteca__leccion-icono" aria-hidden="true">
                {vista ? <CircleCheck size={18} /> : abierta ? <BookOpen size={18} /> : <Lock size={16} />}
              </span>
              <span className="biblioteca__leccion-titulo">{l.titulo}</span>
              {abierta ? (
                <Boton a={`/leccion/${l.id}`} variante={vista ? 'fantasma' : 'secundario'} tamano="peq"
                  aria-label={`${vista ? 'Repasar' : 'Empezar'} ${l.titulo}`}>
                  {vista ? 'Repasar' : 'Empezar'}
                </Boton>
              ) : (
                <span className="biblioteca__pendiente">Aún no has llegado</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

interface PropsBiblioteca {
  onLogout?: () => void;
}

const Biblioteca: React.FC<PropsBiblioteca> = ({ onLogout }) => {
  const { data, loading, error } = useQuery(GET_RUTA, { fetchPolicy: 'cache-and-network', errorPolicy: 'all' });
  const ruta: PlanetaRuta[] = data?.ruta || [];
  const todas = ruta.flatMap((p) => p.pasos.filter((s) => s.tipo === 'leccion'));
  const vistas = todas.filter((s) => s.estado === 'hecho').length;

  return (
    <PaginaAlumno titulo="Biblioteca" onLogout={onLogout}
      subtitulo="Las lecciones de tu ruta para repasar cuando quieras, y algunos temas para ir más allá.">
      <section className="biblioteca__seccion" aria-labelledby="biblioteca-lecciones">
        <div className="biblioteca__seccion-cabecera">
          <h2 id="biblioteca-lecciones">Tus lecciones</h2>
          {todas.length > 0 && <span className="biblioteca__cuenta">{vistas} de {todas.length} vistas</span>}
        </div>
        {loading && !data ? (
          <p className="biblioteca__nota">Cargando tus lecciones…</p>
        ) : error && !data ? (
          <p className="biblioteca__nota">No se han podido cargar las lecciones. Inténtalo de nuevo en un momento.</p>
        ) : (
          <div className="biblioteca__planetas">
            {ruta.map((p) => <LeccionesDe key={p.clave} planeta={p} />)}
          </div>
        )}
      </section>

      <section className="biblioteca__seccion" aria-labelledby="biblioteca-mas-alla">
        <div className="biblioteca__seccion-cabecera">
          <h2 id="biblioteca-mas-alla">Para ir más allá</h2>
        </div>
        <p className="biblioteca__nota">Temas que no entran en la ruta pero que te vas a encontrar pronto. No dan puntos: son para seguir por tu cuenta.</p>
        <div className="biblioteca__cuerpo">
          <nav className="biblioteca__indice" aria-label="Índice: para ir más allá">
            <ul>
              {PARA_IR_MAS_ALLA.map((c) => <li key={c.id}><a href={`#biblioteca-${c.id}`}>{c.titulo}</a></li>)}
            </ul>
          </nav>
          <div className="biblioteca__conceptos">
            {PARA_IR_MAS_ALLA.map((c) => <Tarjeta key={c.id} concepto={c} />)}
          </div>
        </div>
      </section>

      <section className="biblioteca__recursos" aria-labelledby="biblioteca-recursos">
        <h2 id="biblioteca-recursos">Para seguir aprendiendo</h2>
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

export default Biblioteca;
