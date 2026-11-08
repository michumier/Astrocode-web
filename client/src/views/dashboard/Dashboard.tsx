import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { gql, useQuery, ApolloError } from '@apollo/client';
import { BookOpen, ChevronRight, Trophy } from 'lucide-react';
import { limpiarTitulo, mapTareaToExercise } from '../../utils/tareas';
import { GET_RUTA, ejerciciosDe, estrellasDe, motivoBloqueo, planetaEnCurso } from '../../utils/ruta';
import type { PlanetaRuta } from '../../utils/ruta';
import { Aviso, BarraSuperior, Boton, Constelacion, Panel } from '../../components/ui';
import SalaDeMaquinas from './SalaDeMaquinas';
import PanelPlaneta from './PanelPlaneta';
import SolarSystem, { PLANETS } from '../../components/solar-system/SolarSystem';
import Starfield from '../../components/solar-system/Starfield';
import './Mapa.css';

const GET_COMPLETED_TASKS = gql`
  query GetCompletedTasks {
    tareasCompletadas {
      id
    }
  }
`;

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    me {
      puntos
    }
  }
`;

const GET_TOP_USERS = gql`
  query GetTopUsers {
    ranking(limite: 5) {
      id
      nombre_usuario
      puntos
      posicion
    }
  }
`;

const GET_DAILY_CHALLENGE = gql`
  query DailyChallenge {
    dailyChallenge {
      id
      tipo
      formato
      titulo
      descripcion
      puntosBase
      codigoBase
      resultadoEsperado
      categoria {
        nombre
      }
      nivel {
        nombre
      }
    }
  }
`;

const formatear = (n: number) => n.toLocaleString('es-ES');

const horasHastaMedianoche = () => {
  const ahora = new Date();
  const fin = new Date(ahora);
  fin.setHours(24, 0, 0, 0);
  return Math.max(1, Math.ceil((fin.getTime() - ahora.getTime()) / 3600000));
};

const usuarioGuardado = (): { nombre_usuario?: string; nombre_completo?: string } => {
  try {
    return JSON.parse(localStorage.getItem('usuario') || '{}');
  } catch {
    return {};
  }
};

interface DashboardProps {
  onLogout?: () => void;
  onNavigateToExercise?: (exercise?: any) => void;
  onNavigateToPythonGuide?: () => void;
  onNavigateToProfile?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onNavigateToExercise, onNavigateToPythonGuide, onNavigateToProfile }) => {
  const [planetaAbierto, setPlanetaAbierto] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const usuario = useMemo(usuarioGuardado, []);

  // Si la sesión ya no vale, de vuelta al acceso (el cliente de Apollo pone el token en cada petición)
  const alError = useCallback((error: ApolloError) => {
    if (error.message.includes('autenticado') && onLogout) onLogout();
  }, [onLogout]);

  const completadas = useQuery(GET_COMPLETED_TASKS, { fetchPolicy: 'network-only', errorPolicy: 'all', onError: alError });
  const yo = useQuery(GET_CURRENT_USER, { fetchPolicy: 'network-only', errorPolicy: 'all', onError: alError });
  const ranking = useQuery(GET_TOP_USERS, { fetchPolicy: 'network-only', errorPolicy: 'all', onError: alError });
  const diario = useQuery(GET_DAILY_CHALLENGE, { fetchPolicy: 'network-only', errorPolicy: 'all' });

  const rutaQ = useQuery(GET_RUTA, { fetchPolicy: 'network-only', errorPolicy: 'all', onError: alError });

  const puntos: number = yo.data?.me?.puntos ?? 0;
  const hechas = useMemo(() => new Set<string>((completadas.data?.tareasCompletadas || []).map((t: any) => t.id)), [completadas.data]);
  const ruta: PlanetaRuta[] = useMemo(() => rutaQ.data?.ruta || [], [rutaQ.data]);
  const planetaDe = useCallback((clave: string) => ruta.find((p) => p.clave === clave), [ruta]);
  // Mientras carga la ruta, solo Mercurio se ve abierto (es el que tiene todo el mundo)
  const abierto = useCallback((clave: string) => (planetaDe(clave)?.estado ?? (clave === 'mercurio' ? 'abierto' : 'bloqueado')) !== 'bloqueado', [planetaDe]);
  const conquistado = useCallback((clave: string) => planetaDe(clave)?.estado === 'conquistado', [planetaDe]);
  const bloqueo = useCallback((clave: string) => motivoBloqueo(ruta, clave), [ruta]);

  // El planeta en curso: el primero abierto que aún no está conquistado
  const enCurso = planetaEnCurso(ruta);
  const nombreEnCurso = enCurso?.nombre || PLANETS[0].name;
  const ejerciciosEnCurso = useMemo(() => ejerciciosDe(enCurso), [enCurso]);
  const estrellas = useMemo(() => estrellasDe(enCurso), [enCurso]);
  const siguienteEstrella = ejerciciosEnCurso.find((e) => e.estado === 'siguiente');
  const siguientePlaneta = enCurso ? ruta.find((p) => p.orden === enCurso.orden + 1) : undefined;

  // Al volver a la pestaña (por ejemplo, tras resolver un ejercicio) se refrescan puntos, estrellas y ranking
  const { refetch: refetchCompletadas } = completadas;
  const { refetch: refetchYo } = yo;
  const { refetch: refetchRanking } = ranking;
  const { refetch: refetchRuta } = rutaQ;
  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === 'visible') {
        refetchYo();
        refetchCompletadas();
        refetchRanking();
        refetchRuta();
      }
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, [refetchCompletadas, refetchYo, refetchRanking, refetchRuta]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  const abrirPlaneta = (clave: string) => {
    if (!abierto(clave)) {
      setAviso(bloqueo(clave));
      return;
    }
    setPlanetaAbierto(clave);
  };

  const cerrarPanel = useCallback(() => {
    const planeta = planetaAbierto;
    setPlanetaAbierto(null);
    if (planeta) setTimeout(() => document.querySelector<HTMLButtonElement>(`.ss-${planeta}`)?.focus(), 0);
  }, [planetaAbierto]);

  const abrirEjercicio = (ejercicio: any) => onNavigateToExercise?.(ejercicio);

  const reto = diario.data?.dailyChallenge;
  const retoHecho = reto ? hechas.has(reto.id) : false;
  const yoEnRanking = (nombre: string) => nombre === usuario.nombre_usuario;

  return (
    <div className="mapa-pagina">
      <BarraSuperior puntos={yo.data ? puntos : null} nombre={usuario.nombre_completo || usuario.nombre_usuario}
        alPerfil={onNavigateToProfile} alSalir={onLogout} />

      <main className={`mapa ${planetaAbierto ? 'mapa--panel' : ''}`}>
        <aside className="mapa__columna mapa__izq" aria-label="Tu viaje">
          <Panel titulo={`Constelación de ${nombreEnCurso}`}
            extra={ejerciciosEnCurso.length > 0 && <span className="mapa__contador"><b>{estrellas.filter((e) => e.estado === 'hecha').length}</b> de {estrellas.length} estrellas</span>}>
            {enCurso && <p className="mapa__tema">{enCurso.tema}</p>}
            {ejerciciosEnCurso.length > 0 ? (
              <>
                <Constelacion planeta={nombreEnCurso} estrellas={estrellas} className="mapa__cielo" />
                {siguienteEstrella ? (
                  <button className="mapa__siguiente" onClick={() => abrirEjercicio(siguienteEstrella)}>
                    <i aria-hidden="true" />
                    <span><small>Siguiente estrella</small><strong>{siguienteEstrella.title}</strong></span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                ) : (
                  <p className="mapa__nota">¡{nombreEnCurso} conquistado! Has completado toda la ruta.</p>
                )}
              </>
            ) : (
              <p className="mapa__nota">{rutaQ.loading ? 'Cargando tu ruta…' : 'Aún no hay ejercicios en este planeta.'}</p>
            )}
            {enCurso && enCurso.estado === 'abierto' && (
              <div className="mapa__proximo">
                <div className="mapa__proximo-fila">
                  <span>Conquista <b>{enCurso.nombre}</b>{siguientePlaneta ? <> y se abre <b>{siguientePlaneta.nombre}</b></> : null}</span>
                  <span>+{formatear(enCurso.bonus)} pts</span>
                </div>
                <div className="mapa__barra" role="progressbar" aria-label={`Pasos completados de ${enCurso.nombre}`}
                  aria-valuenow={enCurso.hechos} aria-valuemin={0} aria-valuemax={enCurso.total}>
                  <i style={{ width: `${enCurso.total ? (100 * enCurso.hechos) / enCurso.total : 0}%` }} />
                </div>
              </div>
            )}
          </Panel>

          <Panel titulo="Ranking" className="mapa__ranking">
            {ranking.loading && !ranking.data ? (
              <p className="mapa__nota">Cargando…</p>
            ) : ranking.error && !ranking.data ? (
              <p className="mapa__nota">No se ha podido cargar el ranking.</p>
            ) : (
              <ol>
                {(ranking.data?.ranking || []).map((u: any) => (
                  <li key={u.id} className={`${u.posicion <= 3 ? 'podio' : ''} ${yoEnRanking(u.nombre_usuario) ? 'yo' : ''}`}>
                    <span className="n">{u.posicion}</span>
                    <span className="nombre">{yoEnRanking(u.nombre_usuario) ? `Tú · ${u.nombre_usuario}` : u.nombre_usuario}</span>
                    <span className="p">{formatear(u.puntos)}</span>
                  </li>
                ))}
              </ol>
            )}
            <Boton a="/ranking" variante="fantasma" icono={<Trophy size={16} aria-hidden="true" />}>Ver ranking completo</Boton>
          </Panel>
        </aside>

        <section className="mapa__centro" aria-label="Sistema solar: elige un planeta">
          {aviso && (
            <div className="mapa__aviso">
              <Aviso tono="atencion" titulo={aviso} />
            </div>
          )}
          <div className="mapa__escala">
            <SolarSystem selectedPlanet={planetaAbierto} onPlanetSelect={abrirPlaneta} isPlanetUnlocked={abierto}
              isPlanetConquered={conquistado} motivoBloqueo={bloqueo} />
          </div>
          <div className="mapa__pie">
            <h1>Elige tu próximo planeta</h1>
            <div className="mapa__leyenda">
              <span><i />Abierto</span>
              <span><i className="b" />Conquista el anterior para abrirlo</span>
            </div>
          </div>
        </section>

        {planetaAbierto ? (
          <PanelPlaneta planeta={planetaDe(planetaAbierto)} cargando={rutaQ.loading && !rutaQ.data}
            alCerrar={cerrarPanel} alAbrir={abrirEjercicio} />
        ) : (
          <aside className="mapa__columna mapa__der" aria-label="Retos y ranking">
            <section className="mapa__diario" aria-labelledby="mapa-diario-titulo">
              <div className="mapa__diario-meta">
                <span>Reto diario</span>
                {reto && <span>+{reto.puntosBase} pts</span>}
                {reto && !retoHecho && <span>Quedan {horasHastaMedianoche()} h</span>}
              </div>
              <h2 id="mapa-diario-titulo">{reto ? limpiarTitulo(reto.titulo) : diario.loading ? 'Buscando el reto de hoy…' : 'Hoy no hay reto'}</h2>
              <p>{reto ? (retoHecho ? 'Ya lo has resuelto hoy. Puedes repetirlo cuando quieras.' : 'Un reto nuevo cada día. Resuélvelo antes de medianoche.')
                : diario.loading ? '' : 'Vuelve mañana: cada día hay uno nuevo.'}</p>
              {reto && (
                <Boton variante="oscuro" tamano="grande" onClick={() => abrirEjercicio(mapTareaToExercise(reto))}>
                  {retoHecho ? 'Repetir el reto' : 'Empezar reto'}
                </Boton>
              )}
            </section>

            <SalaDeMaquinas />

            <Panel className="mapa__guia">
              <div>
                <h2 className="ui-panel__titulo">Biblioteca</h2>
                <p className="mapa__nota">Repasa las lecciones que ya has visto.</p>
              </div>
              <Boton variante="fantasma" onClick={onNavigateToPythonGuide} icono={<BookOpen size={16} aria-hidden="true" />}>Abrir</Boton>
            </Panel>
          </aside>
        )}
      </main>

      <Starfield />
    </div>
  );
};

export default Dashboard;
