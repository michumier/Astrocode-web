import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bomb, CircleCheck, Code, Dna, Flag, FlaskConical, Languages, Lock, Palette, Radio, Rocket, ScanSearch, Vault, Wrench, X } from 'lucide-react';
import { Boton, Constelacion, Etiqueta, tonoDeNivel } from '../../components/ui';
import { etiquetaFormato } from '../../components/visor-reto/etiquetas';
import { ejerciciosDe, estrellasDe } from '../../utils/ruta';
import type { PlanetaRuta } from '../../utils/ruta';

// Icono de cada tipo y formato de ejercicio (iconos de trazo, nunca emojis)
const ICONOS_FORMATO: Record<string, React.ElementType> = {
  bomba: Bomb, lengua: Languages, camara: Vault, impostor: ScanSearch, nebulosa: Palette,
  radio: Radio, colonia: Dna, diagnostico: FlaskConical,
};

export const iconoDeEjercicio = (ejercicio: any): React.ElementType => {
  if (ejercicio.tipo === 'pilotaje') return Rocket;
  if (ejercicio.tipo === 'sabotaje') return Wrench;
  if (ejercicio.tipo === 'reto') return ICONOS_FORMATO[ejercicio.formato] || FlaskConical;
  return Code;
};

const GRUPOS = [
  { id: 'todo', texto: 'Todo' },
  { id: 'codigo', texto: 'Ejercicios' },
  { id: 'reto', texto: 'Retos' },
  { id: 'pilotaje', texto: 'Misiones' },
];

const grupoDe = (ejercicio: any) => (ejercicio.tipo === 'reto' || ejercicio.tipo === 'pilotaje' ? ejercicio.tipo : 'codigo');

const tipoLegible = (ejercicio: any) => {
  if (ejercicio.tipo === 'reto') return `Reto · ${etiquetaFormato(ejercicio.formato)}`;
  if (ejercicio.tipo === 'pilotaje') return 'Misión de pilotaje';
  return ejercicio.categoria || 'Ejercicio';
};

interface PropsPanel {
  planeta?: PlanetaRuta;
  cargando: boolean;
  alCerrar: () => void;
  alAbrir: (ejercicio: any) => void;
}

// Hoja lateral con la ruta de un planeta: los pasos en orden, y solo se abre el siguiente.
// El sistema solar sigue a la vista.
const PanelPlaneta: React.FC<PropsPanel> = ({ planeta, cargando, alCerrar, alAbrir }) => {
  const [grupo, setGrupo] = useState('todo');
  const titulo = useRef<HTMLHeadingElement>(null);

  // Al abrirse, el foco va al título (lectores de pantalla y teclado); Escape lo cierra
  useEffect(() => {
    titulo.current?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') alCerrar(); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [planeta?.clave, alCerrar]);

  useEffect(() => setGrupo('todo'), [planeta?.clave]);

  const nombre = planeta?.nombre || '';
  // Cada ejercicio con su número de paso dentro del planeta (el orden de la ruta)
  const ejercicios = useMemo(() => ejerciciosDe(planeta).map((e, i) => ({ ...e, paso: i + 1 })), [planeta]);
  const estrellas = useMemo(() => estrellasDe(planeta), [planeta]);
  const hechos = ejercicios.filter((e) => e.estado === 'hecho').length;

  const grupos = GRUPOS.filter((g) => g.id === 'todo' || ejercicios.some((e) => grupoDe(e) === g.id))
    .map((g) => ({ ...g, cuantos: g.id === 'todo' ? ejercicios.length : ejercicios.filter((e) => grupoDe(e) === g.id).length }));
  const visibles = grupo === 'todo' ? ejercicios : ejercicios.filter((e) => grupoDe(e) === grupo);

  return (
    <aside className="panel-planeta" aria-labelledby="panel-planeta-titulo">
      <div className="panel-planeta__cabecera">
        <div>
          <h2 id="panel-planeta-titulo" ref={titulo} tabIndex={-1}>{nombre}</h2>
          {planeta && <p className="panel-planeta__tema">{planeta.tema}</p>}
          <p>
            {cargando ? 'Cargando la ruta…' : planeta?.estado === 'conquistado'
              ? <span className="panel-planeta__conquistado"><Flag size={14} aria-hidden="true" />Conquistado · {hechos} de {ejercicios.length}</span>
              : `${hechos} de ${ejercicios.length} hechos · +${planeta?.bonus ?? 0} pts al conquistarlo`}
          </p>
        </div>
        <Boton variante="fantasma" soloIcono aria-label="Cerrar y volver al mapa" onClick={alCerrar}
          icono={<X size={22} aria-hidden="true" />} className="panel-planeta__cerrar" />
      </div>
      {!cargando && ejercicios.length > 0 && (
        <Constelacion planeta={nombre} estrellas={estrellas} className="panel-planeta__cielo" />
      )}
      {grupos.length > 2 && (
        <div className="panel-planeta__filtros" role="group" aria-label="Filtrar por tipo">
          {grupos.map((g) => (
            <button key={g.id} className={`panel-planeta__filtro ${grupo === g.id ? 'activo' : ''}`} aria-pressed={grupo === g.id}
              onClick={() => setGrupo(g.id)}>
              {g.texto} · {g.cuantos}
            </button>
          ))}
        </div>
      )}
      {cargando ? (
        <p className="panel-planeta__vacio">Cargando ejercicios…</p>
      ) : visibles.length === 0 ? (
        <p className="panel-planeta__vacio">No hay ejercicios en este planeta todavía.</p>
      ) : (
        <ul className="panel-planeta__lista">
          {visibles.map((e) => {
            const Icono = iconoDeEjercicio(e);
            const hecho = e.estado === 'hecho';
            const esSiguiente = e.estado === 'siguiente';
            const bloqueado = e.estado === 'bloqueado';
            return (
              <li key={e.id} className={`panel-planeta__item ${esSiguiente ? 'siguiente' : ''} ${bloqueado ? 'bloqueado' : ''}`}>
                <span className="panel-planeta__paso" aria-label={`Paso ${e.paso}`}>{e.paso}</span>
                <span className={`panel-planeta__icono panel-planeta__icono--${grupoDe(e)}`}><Icono size={20} aria-hidden="true" /></span>
                <div className="panel-planeta__texto">
                  <strong>{e.title}</strong>
                  <span className="panel-planeta__meta">
                    <Etiqueta tono={tonoDeNivel(e.difficulty)}>{e.difficulty}</Etiqueta>
                    <span>{e.points} pts</span>
                    <span>{tipoLegible(e)}</span>
                  </span>
                </div>
                {hecho ? (
                  <span className="panel-planeta__accion">
                    <span className="panel-planeta__hecho"><CircleCheck size={18} aria-hidden="true" />Hecho</span>
                    <Boton variante="fantasma" tamano="peq" onClick={() => alAbrir(e)} aria-label={`Repetir ${e.title}`}>Repetir</Boton>
                  </span>
                ) : bloqueado ? (
                  <span className="panel-planeta__bloqueado" title="Completa antes los pasos anteriores">
                    <Lock size={16} aria-hidden="true" /><span className="ac-oculto">Bloqueado: completa antes los pasos anteriores</span>
                  </span>
                ) : (
                  <Boton variante={esSiguiente ? 'primario' : 'secundario'} onClick={() => alAbrir(e)} aria-label={`Empezar ${e.title}`}>
                    Empezar
                  </Boton>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
};

export default PanelPlaneta;
