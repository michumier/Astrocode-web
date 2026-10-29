import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { gql, useQuery, ApolloError } from '@apollo/client';
import { BookOpen, ChevronRight, Trophy } from 'lucide-react';
import client from '../../apollo/client';
import { mapTareaToExercise } from '../../utils/tareas';
import { Aviso, BarraSuperior, Boton, Constelacion, Panel } from '../../components/ui';
import type { Estrella } from '../../components/ui';
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

const GET_TASKS_BY_LEVEL = gql`
  query TareasPorNivel($nivelId: ID!) {
    tareasPorNivel(nivelId: $nivelId) {
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

// Puntos para abrir cada planeta y nivel de dificultad de sus ejercicios
export const PLANET_REQUIREMENTS: Record<string, number> = {
  mercurio: 0, venus: 0, tierra: 0, marte: 500, jupiter: 1000, saturno: 1500,
};
const PLANET_LEVEL: Record<string, number> = {
  mercurio: 1, venus: 1, tierra: 1, marte: 2, jupiter: 2, saturno: 3,
};

const formatear = (n: number) => n.toLocaleString('es-ES');
const nombreDe = (clave: string) => PLANETS.find((p) => p.key === clave)?.name || clave;

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
  const [ejerciciosPanel, setEjerciciosPanel] = useState<any[]>([]);
  const [cargandoPanel, setCargandoPanel] = useState(false);
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

  const puntos: number = yo.data?.me?.puntos ?? 0;
  const hechas = useMemo(() => new Set<string>((completadas.data?.tareasCompletadas || []).map((t: any) => t.id)), [completadas.data]);
  const completado = useCallback((id: string) => hechas.has(id), [hechas]);
  const abierto = useCallback((clave: string) => puntos >= PLANET_REQUIREMENTS[clave], [puntos]);

  // El planeta en curso es el más lejano que ya está abierto; el siguiente, el primero que falta
  const enCurso = [...PLANETS].reverse().find((p) => abierto(p.key)) || PLANETS[0];
  const proximo = PLANETS.find((p) => !abierto(p.key));
  const nivelEnCurso = PLANET_LEVEL[enCurso.key];
  const tareasEnCurso = useQuery(GET_TASKS_BY_LEVEL, {
    variables: { nivelId: String(nivelEnCurso) }, fetchPolicy: 'network-only', errorPolicy: 'all', onError: alError,
  });
  const ejerciciosEnCurso = useMemo(() => (tareasEnCurso.data?.tareasPorNivel || []).map(mapTareaToExercise), [tareasEnCurso.data]);
  const siguienteEstrella = ejerciciosEnCurso.find((e: any) => !hechas.has(e.id));
  const estrellas: Estrella[] = useMemo(() => ejerciciosEnCurso.map((e: any) => ({
    id: e.id,
    titulo: e.title,
    estado: hechas.has(e.id) ? 'hecha' : e === siguienteEstrella ? 'siguiente' : 'pendiente',
  })), [ejerciciosEnCurso, hechas, siguienteEstrella]);

  // Al volver a la pestaña (por ejemplo, tras resolver un ejercicio) se refrescan puntos, estrellas y ranking
  const { refetch: refetchCompletadas } = completadas;
  const { refetch: refetchYo } = yo;
  const { refetch: refetchRanking } = ranking;
  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === 'visible') {
        refetchYo();
        refetchCompletadas();
        refetchRanking();
      }
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, [refetchCompletadas, refetchYo, refetchRanking]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  const abrirPlaneta = async (clave: string) => {
    if (!abierto(clave)) {
      const faltan = PLANET_REQUIREMENTS[clave] - puntos;
      setAviso(`${nombreDe(clave)} se abre con ${formatear(PLANET_REQUIREMENTS[clave])} pts. Te faltan ${formatear(faltan)}.`);
      return;
    }
    setPlanetaAbierto(clave);
    setCargandoPanel(true);
    try {
      const { data } = await client.query({
        query: GET_TASKS_BY_LEVEL,
        variables: { nivelId: String(PLANET_LEVEL[clave]) },
        fetchPolicy: 'network-only',
      });
      setEjerciciosPanel((data?.tareasPorNivel || []).map(mapTareaToExercise));
    } catch (error: any) {
      setEjerciciosPanel([]);
      if (error?.message?.includes('autenticado') && onLogout) onLogout();
    } finally {
      setCargandoPanel(false);
    }
  };

  const cerrarPanel = useCallback(() => {
    setPlanetaAbierto(null);
    setEjerciciosPanel([]);
  }, []);

  const abrirEjercicio = (ejercicio: any) => onNavigateToExercise?.(ejercicio);

  const reto = diario.data?.dailyChallenge;
  const retoHecho = reto ? hechas.has(reto.id) : false;
  const yoEnRanking = (nombre: string) => nombre === usuario.nombre_usuario;

  return (
    <div className="mapa-pagina">
      <BarraSuperior puntos={yo.data ? puntos : null} nombre={usuario.nombre_completo || usuario.nombre_usuario}
        alPerfil={onNavigateToProfile} alSalir={onLogout} />

      <main className={`mapa ${planetaAbierto ? 'mapa--panel' : ''}`}>
        <aside className="mapa__columna mapa__izq">
          <Panel titulo={`Constelación de ${enCurso.name}`}
            extra={ejerciciosEnCurso.length > 0 && <span className="mapa__contador"><b>{estrellas.filter((e) => e.estado === 'hecha').length}</b> de {estrellas.length} estrellas</span>}>
            {ejerciciosEnCurso.length > 0 ? (
              <>
                <Constelacion planeta={enCurso.name} estrellas={estrellas} className="mapa__cielo" />
                {siguienteEstrella ? (
                  <button className="mapa__siguiente" onClick={() => abrirEjercicio(siguienteEstrella)}>
                    <i aria-hidden="true" />
                    <span><small>Siguiente estrella</small><strong>{siguienteEstrella.title}</strong></span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                ) : (
                  <p className="mapa__nota">¡Constelación completa! Prueba con otro planeta.</p>
                )}
              </>
            ) : (
              <p className="mapa__nota">{tareasEnCurso.loading ? 'Cargando tus estrellas…' : 'Aún no hay ejercicios en este planeta.'}</p>
            )}
            <div className="mapa__proximo">
              {proximo ? (
                <>
                  <div className="mapa__proximo-fila">
                    <span>Siguiente parada: <b>{proximo.name}</b></span>
                    <span><b>{formatear(puntos)}</b> / {formatear(PLANET_REQUIREMENTS[proximo.key])} pts</span>
                  </div>
                  <div className="mapa__barra" role="progressbar" aria-label={`Puntos para abrir ${proximo.name}`}
                    aria-valuenow={puntos} aria-valuemin={0} aria-valuemax={PLANET_REQUIREMENTS[proximo.key]}>
                    <i style={{ width: `${Math.min(100, (100 * puntos) / PLANET_REQUIREMENTS[proximo.key])}%` }} />
                  </div>
                </>
              ) : (
                <p className="mapa__nota">Has abierto todos los planetas del sistema.</p>
              )}
            </div>
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
              planetRequirements={PLANET_REQUIREMENTS} />
          </div>
          <div className="mapa__pie">
            <h1>Elige tu próximo planeta</h1>
            <div className="mapa__leyenda">
              <span><i />Abierto</span>
              <span><i className="b" />Se abre con puntos</span>
            </div>
          </div>
        </section>

        {planetaAbierto ? (
          <PanelPlaneta planeta={nombreDe(planetaAbierto)} ejercicios={ejerciciosPanel} cargando={cargandoPanel}
            completado={completado} alCerrar={cerrarPanel} alAbrir={abrirEjercicio} />
        ) : (
          <aside className="mapa__columna mapa__der">
            <section className="mapa__diario" aria-labelledby="mapa-diario-titulo">
              <div className="mapa__diario-meta">
                <span>Reto diario</span>
                {reto && <span>+{reto.puntosBase} pts</span>}
                {reto && !retoHecho && <span>Quedan {horasHastaMedianoche()} h</span>}
              </div>
              <h2 id="mapa-diario-titulo">{reto ? reto.titulo : diario.loading ? 'Buscando el reto de hoy…' : 'Hoy no hay reto'}</h2>
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
                <h2 className="ui-panel__titulo">Guía de Python</h2>
                <p className="mapa__nota">Repasa variables, bucles y funciones.</p>
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
