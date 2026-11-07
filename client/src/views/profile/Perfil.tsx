import React, { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Flag, Gauge, Lock, LucideIcon, Orbit, Puzzle, Rocket, ShieldCheck, Sparkles, Trophy, Wrench } from 'lucide-react';
import { Aviso, Boton, Constelacion, Etiqueta } from '../../components/ui';
import { GET_RUTA, estrellasDe, motivoBloqueo, planetaEnCurso } from '../../utils/ruta';
import type { PlanetaRuta } from '../../utils/ruta';
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

export interface Hito {
  id: string;
  titulo: string;
  texto: string;
  conseguido: boolean;
  Icono: LucideIcon;
}

const formatear = (n: number) => n.toLocaleString('es-ES');

// Hitos que salen de lo que el alumno ha hecho de verdad (nada inventado).
// `abiertos`: planetas de la ruta que ya puede jugar; `conquistados`: cuántos ha completado.
export const calcularHitos = (completadas: { tipo: string }[], abiertos: Set<string>, conquistados: number): Hito[] => {
  const hay = (tipo: string) => completadas.some((t) => t.tipo === tipo);
  return [
    { id: 'despegue', titulo: 'Despegue', texto: 'Resuelve tu primer ejercicio', conseguido: completadas.length > 0, Icono: Rocket },
    { id: 'piloto', titulo: 'Piloto', texto: 'Supera una misión de pilotaje', conseguido: hay('pilotaje'), Icono: Gauge },
    { id: 'sabotajes', titulo: 'Cazasabotajes', texto: 'Repara un sistema saboteado', conseguido: hay('sabotaje'), Icono: Wrench },
    { id: 'insolito', titulo: 'Mente insólita', texto: 'Supera un reto insólito', conseguido: hay('reto'), Icono: Puzzle },
    { id: 'constelacion', titulo: 'Constelación completa', texto: 'Conquista tu primer planeta', conseguido: conquistados > 0, Icono: Sparkles },
    { id: 'marte', titulo: 'Rumbo a Marte', texto: 'Abre Marte conquistando los tres primeros planetas', conseguido: abiertos.has('marte'), Icono: Orbit },
    { id: 'saturno', titulo: 'Hasta Saturno', texto: 'Abre Saturno, el último planeta', conseguido: abiertos.has('saturno'), Icono: Trophy },
  ];
};

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
  const rutaQ = useQuery(GET_RUTA, { skip: !me, fetchPolicy: 'cache-and-network', errorPolicy: 'all' });
  const ruta: PlanetaRuta[] = useMemo(() => rutaQ.data?.ruta || [], [rutaQ.data]);

  const completadas: { id: string; tipo: string }[] = useMemo(() => data?.tareasCompletadas || [], [data]);

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

  const enCurso = planetaEnCurso(ruta);
  const rumbo = enCurso?.estado === 'abierto' ? enCurso : undefined;
  const despues = rumbo ? ruta.find((p) => p.orden === rumbo.orden + 1) : undefined;
  const progreso = rumbo && rumbo.total ? rumbo.hechos / rumbo.total : 1;
  const abiertos = new Set(ruta.filter((p) => p.estado !== 'bloqueado').map((p) => p.clave));
  const hitos = calcularHitos(completadas, abiertos, ruta.filter((p) => p.estado === 'conquistado').length);
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
          <div className="perfil__barra" role="progressbar" aria-label={rumbo ? `Conquista de ${rumbo.nombre}` : 'Ruta completa'}
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progreso * 100)}>
            <span style={{ width: `${progreso * 100}%` }} />
          </div>
          <p>
            {rumbo
              ? <>Te faltan <strong>{rumbo.total - rumbo.hechos} {rumbo.total - rumbo.hechos === 1 ? 'paso' : 'pasos'}</strong> para conquistar {rumbo.nombre}{despues ? <> y abrir {despues.nombre}</> : null}.</>
              : ruta.length ? <>Has conquistado <strong>todos los planetas</strong>.</> : 'Cargando tu ruta…'}
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
          {ruta.map((p) => {
            const cerrado = p.estado === 'bloqueado';
            return (
              <li key={p.clave} className={`perfil__planeta${cerrado ? ' cerrado' : ''}`}>
                <div className="perfil__planeta-cabecera">
                  <span className={`ss-cuerpo ss-${p.clave} perfil__astro`} aria-hidden="true" />
                  <h3>{p.nombre}</h3>
                  {p.estado === 'conquistado'
                    ? <Etiqueta tono="oro" icono={<Flag size={13} aria-hidden="true" />}>Conquistado</Etiqueta>
                    : cerrado
                      ? <Etiqueta icono={<Lock size={13} aria-hidden="true" />}>Cerrado</Etiqueta>
                      : <Etiqueta tono="turquesa">{p.hechos} de {p.total}</Etiqueta>}
                </div>
                {cerrado
                  ? <p className="perfil__cerrado">{motivoBloqueo(ruta, p.clave)}</p>
                  : <Constelacion planeta={p.nombre} estrellas={estrellasDe(p)} className="perfil__cielo" />}
              </li>
            );
          })}
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
