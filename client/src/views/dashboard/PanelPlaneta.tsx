import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bomb, CircleCheck, Code, Dna, FlaskConical, Languages, Palette, Radio, Rocket, ScanSearch, Vault, Wrench, X } from 'lucide-react';
import { Boton, Constelacion, Etiqueta, tonoDeNivel } from '../../components/ui';
import type { Estrella } from '../../components/ui';
import { etiquetaFormato } from '../../components/visor-reto/etiquetas';

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
  planeta: string;
  ejercicios: any[];
  cargando: boolean;
  completado: (id: string) => boolean;
  alCerrar: () => void;
  alAbrir: (ejercicio: any) => void;
}

// Hoja lateral con los ejercicios de un planeta: el sistema solar sigue a la vista
const PanelPlaneta: React.FC<PropsPanel> = ({ planeta, ejercicios, cargando, completado, alCerrar, alAbrir }) => {
  const [grupo, setGrupo] = useState('todo');
  const titulo = useRef<HTMLHeadingElement>(null);

  // Al abrirse, el foco va al título (lectores de pantalla y teclado); Escape lo cierra
  useEffect(() => {
    titulo.current?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') alCerrar(); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [planeta, alCerrar]);

  useEffect(() => setGrupo('todo'), [planeta]);

  const siguiente = ejercicios.find((e) => !completado(e.id));
  const hechos = ejercicios.filter((e) => completado(e.id)).length;
  const estrellas: Estrella[] = useMemo(() => ejercicios.map((e) => ({
    id: e.id,
    titulo: e.title,
    estado: completado(e.id) ? 'hecha' : e === siguiente ? 'siguiente' : 'pendiente',
  })), [ejercicios, completado, siguiente]);

  const grupos = GRUPOS.filter((g) => g.id === 'todo' || ejercicios.some((e) => grupoDe(e) === g.id))
    .map((g) => ({ ...g, cuantos: g.id === 'todo' ? ejercicios.length : ejercicios.filter((e) => grupoDe(e) === g.id).length }));
  const visibles = grupo === 'todo' ? ejercicios : ejercicios.filter((e) => grupoDe(e) === grupo);

  return (
    <aside className="panel-planeta" aria-labelledby="panel-planeta-titulo">
      <div className="panel-planeta__cabecera">
        <div>
          <h2 id="panel-planeta-titulo" ref={titulo} tabIndex={-1}>{planeta}</h2>
          <p>{cargando ? 'Cargando ejercicios…' : `${hechos} de ${ejercicios.length} hechos`}</p>
        </div>
        <Boton variante="fantasma" soloIcono aria-label="Cerrar y volver al mapa" onClick={alCerrar}
          icono={<X size={22} aria-hidden="true" />} className="panel-planeta__cerrar" />
      </div>
      {!cargando && ejercicios.length > 0 && (
        <Constelacion planeta={planeta} estrellas={estrellas} className="panel-planeta__cielo" />
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
            const hecho = completado(e.id);
            const esSiguiente = e === siguiente;
            return (
              <li key={e.id} className={`panel-planeta__item ${esSiguiente ? 'siguiente' : ''}`}>
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
