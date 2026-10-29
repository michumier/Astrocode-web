import React, { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Gauge, Lock, LucideIcon, Orbit, Puzzle, Rocket, ShieldCheck, Sparkles, Trophy, Wrench } from 'lucide-react';
import { Aviso, Boton, Constelacion, Etiqueta } from '../../components/ui';
import type { Estrella } from '../../components/ui';
import { PLANETS } from '../../components/solar-system/SolarSystem';
import {
  NIVEL_PLANETA, ORDEN_PLANETAS, PUNTOS_PLANETA, ejerciciosDelPlaneta, planetaActual, siguientePlaneta,
} from '../../utils/planetas';
import PaginaAlumno from '../comun/PaginaAlumno';
import './Perfil.css';

export const GET_PERFIL = gql`
  query PerfilAlumno {
    me {
      id
      nombre_usuario
      correo_electronico
      nombre_completo
      puntos
      rol
      creado_el
    }
    tareasCompletadas {
      id
      tipo
    }
  }
`;

export const GET_NIVEL = gql`
  query TareasDelNivel($nivelId: ID!) {
    tareasPorNivel(nivelId: $nivelId) {
      id
      tipo
      titulo
    }
  }
`;

export interface Hito {
  id: string;
  titulo: string;
  texto: string;
  conseguido: boolean;
  Icono: LucideIcon;
}

const formatear = (n: number) => n.toLocaleString('es-ES');

// Hitos que salen de lo que el alumno ha hecho de verdad (nada inventado)
export const calcularHitos = (completadas: { tipo: string }[], puntos: number, planetasCompletos: number): Hito[] => {
  const hay = (tipo: string) => completadas.some((t) => t.tipo === tipo);
  return [
    { id: 'despegue', titulo: 'Despegue', texto: 'Resuelve tu primer ejercicio', conseguido: completadas.length > 0, Icono: Rocket },
    { id: 'piloto', titulo: 'Piloto', texto: 'Supera una misión de pilotaje', conseguido: hay('pilotaje'), Icono: Gauge },
    { id: 'sabotajes', titulo: 'Cazasabotajes', texto: 'Repara un sistema saboteado', conseguido: hay('sabotaje'), Icono: Wrench },
    { id: 'insolito', titulo: 'Mente insólita', texto: 'Supera un reto insólito', conseguido: hay('reto'), Icono: Puzzle },
    { id: 'marte', titulo: 'Rumbo a Marte', texto: `Llega a ${formatear(PUNTOS_PLANETA.marte)} puntos`, conseguido: puntos >= PUNTOS_PLANETA.marte, Icono: Orbit },
    { id: 'constelacion', titulo: 'Constelación completa', texto: 'Enciende todas las estrellas de un planeta', conseguido: planetasCompletos > 0, Icono: Sparkles },
    { id: 'saturno', titulo: 'Hasta Saturno', texto: `Llega a ${formatear(PUNTOS_PLANETA.saturno)} puntos`, conseguido: puntos >= PUNTOS_PLANETA.saturno, Icono: Trophy },
  ];
};

const nombreDe = (clave: string) => PLANETS.find((p) => p.key === clave)?.name || clave;

const fecha = (texto?: string | null) => {
  const d = texto ? new Date(texto) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
};

interface PropsPerfil {
  onLogout?: () => void;
}

const Perfil: React.FC<PropsPerfil> = ({ onLogout }) => {
  const { data, loading, error } = useQuery(GET_PERFIL, { fetchPolicy: 'cache-and-network', errorPolicy: 'all' });
  const me = data?.me;
  const puntos: number = me?.puntos ?? 0;
  const abierto = (p: string) => puntos >= PUNTOS_PLANETA[p];
  // Solo se piden los niveles que tienen algún planeta abierto
  const nivelAbierto = (n: number) => ORDEN_PLANETAS.some((p) => NIVEL_PLANETA[p] === n && abierto(p));
  const n1 = useQuery(GET_NIVEL, { variables: { nivelId: '1' }, skip: !me || !nivelAbierto(1), errorPolicy: 'all' });
  const n2 = useQuery(GET_NIVEL, { variables: { nivelId: '2' }, skip: !me || !nivelAbierto(2), errorPolicy: 'all' });
  const n3 = useQuery(GET_NIVEL, { variables: { nivelId: '3' }, skip: !me || !nivelAbierto(3), errorPolicy: 'all' });

  const completadas: { id: string; tipo: string }[] = useMemo(() => data?.tareasCompletadas || [], [data]);

  const planetas = useMemo(() => {
    const hechas = new Set(completadas.map((t) => t.id));
    const porNivel: Record<number, any[]> = { 1: n1.data?.tareasPorNivel || [], 2: n2.data?.tareasPorNivel || [], 3: n3.data?.tareasPorNivel || [] };
    return ORDEN_PLANETAS.map((clave) => {
      const ejercicios = ejerciciosDelPlaneta(clave, porNivel[NIVEL_PLANETA[clave]]);
      let siguiente = false;
      const estrellas: Estrella[] = ejercicios.map((e) => {
        if (hechas.has(e.id)) return { id: e.id, titulo: e.titulo, estado: 'hecha' };
        if (!siguiente) { siguiente = true; return { id: e.id, titulo: e.titulo, estado: 'siguiente' }; }
        return { id: e.id, titulo: e.titulo, estado: 'pendiente' };
      });
      return { clave, nombre: nombreDe(clave), estrellas, hechas: estrellas.filter((e) => e.estado === 'hecha').length };
    });
  }, [completadas, n1.data, n2.data, n3.data]);

  if (loading && !me) return <PaginaAlumno titulo="Tu perfil" onLogout={onLogout}><p className="perfil__cargando">Cargando tu perfil…</p></PaginaAlumno>;
  if (!me) {
    return (
      <PaginaAlumno titulo="Tu perfil" onLogout={onLogout}>
        <Aviso tono="error" titulo="No se pudo cargar tu perfil">
          {error?.networkError ? 'No hay conexión con el servidor.' : 'Inténtalo de nuevo en un momento.'}
        </Aviso>
      </PaginaAlumno>
    );
  }

  const actual = planetaActual(puntos);
  const siguiente = siguientePlaneta(puntos);
  const desde = PUNTOS_PLANETA[actual];
  const progreso = siguiente ? Math.min(1, (puntos - desde) / (PUNTOS_PLANETA[siguiente] - desde)) : 1;
  const completos = planetas.filter((p) => abierto(p.clave) && p.estrellas.length > 0 && p.hechas === p.estrellas.length).length;
  const hitos = calcularHitos(completadas, puntos, completos);
  const conseguidos = hitos.filter((h) => h.conseguido).length;
  const desdeCuando = fecha(me.creado_el);
  const nombre = me.nombre_completo || me.nombre_usuario;

  return (
    <PaginaAlumno titulo="Tu perfil" onLogout={onLogout}
      extra={me.rol === 'admin' && <Boton variante="secundario" a="/admin" icono={<ShieldCheck size={18} aria-hidden="true" />}>Panel de administración</Boton>}>

      <section className="perfil__ficha" aria-label="Tus datos">
        <div className="perfil__quien">
          <span className="perfil__avatar" aria-hidden="true">{nombre.trim().charAt(0).toUpperCase()}</span>
          <div>
            <h2>{nombre}</h2>
            <p className="perfil__usuario">@{me.nombre_usuario} · {me.correo_electronico}</p>
            {desdeCuando && <p className="perfil__desde">En AstroCode desde el {desdeCuando}</p>}
          </div>
        </div>
        <div className="perfil__rumbo">
          <div className="perfil__puntos"><b>{formatear(puntos)}</b><span>puntos</span></div>
          <div className="perfil__barra" role="progressbar" aria-label={siguiente ? `Camino a ${nombreDe(siguiente)}` : 'Todos los planetas abiertos'}
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progreso * 100)}>
            <span style={{ width: `${progreso * 100}%` }} />
          </div>
          <p>
            {siguiente
              ? <>Te faltan <strong>{formatear(PUNTOS_PLANETA[siguiente] - puntos)} puntos</strong> para abrir {nombreDe(siguiente)}.</>
              : <>Has abierto <strong>todos los planetas</strong>.</>}
          </p>
        </div>
      </section>

      <section className="perfil__cifras" aria-label="Resumen">
        <div><b>{completadas.length}</b><span>ejercicios resueltos</span></div>
        <div><b>{completadas.filter((t) => t.tipo === 'pilotaje' || t.tipo === 'reto').length}</b><span>misiones y retos</span></div>
        <div><b>{completadas.filter((t) => t.tipo === 'sabotaje').length}</b><span>sabotajes reparados</span></div>
        <div><b>{conseguidos} de {hitos.length}</b><span>hitos</span></div>
      </section>

      <section className="perfil__seccion" aria-labelledby="perfil-constelaciones">
        <h2 id="perfil-constelaciones">Tus constelaciones</h2>
        <ul className="perfil__planetas">
          {planetas.map((p) => (
            <li key={p.clave} className={`perfil__planeta${abierto(p.clave) ? '' : ' cerrado'}`}>
              <div className="perfil__planeta-cabecera">
                <span className={`ss-cuerpo ss-${p.clave} perfil__astro`} aria-hidden="true" />
                <h3>{p.nombre}</h3>
                {abierto(p.clave)
                  ? <Etiqueta tono={p.estrellas.length > 0 && p.hechas === p.estrellas.length ? 'oro' : 'turquesa'}>{p.hechas} de {p.estrellas.length}</Etiqueta>
                  : <Etiqueta icono={<Lock size={13} aria-hidden="true" />}>{formatear(PUNTOS_PLANETA[p.clave])} pts</Etiqueta>}
              </div>
              {abierto(p.clave) && p.estrellas.length > 0
                ? <Constelacion planeta={p.nombre} estrellas={p.estrellas} className="perfil__cielo" />
                : <p className="perfil__cerrado">{abierto(p.clave) ? 'Cargando sus estrellas…' : `Se abre al llegar a ${formatear(PUNTOS_PLANETA[p.clave])} puntos.`}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="perfil__seccion" aria-labelledby="perfil-hitos">
        <h2 id="perfil-hitos">Hitos</h2>
        <ul className="perfil__hitos">
          {hitos.map(({ id, titulo, texto, conseguido, Icono }) => (
            <li key={id} className={conseguido ? 'conseguido' : ''}>
              <span className="perfil__hito-icono" aria-hidden="true">{conseguido ? <Icono size={22} /> : <Lock size={18} />}</span>
              <div>
                <strong>{titulo}<span className="ac-oculto">{conseguido ? ' (conseguido)' : ' (pendiente)'}</span></strong>
                <span>{texto}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </PaginaAlumno>
  );
};

export default Perfil;
