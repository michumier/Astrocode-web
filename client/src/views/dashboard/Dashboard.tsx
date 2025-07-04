import React, { useState, useEffect } from 'react';
import { gql, useQuery, useApolloClient } from '@apollo/client';
import './Dashboard.css';
import FullRanking from '../ranking/FullRanking';

interface User {
  id: string;
  nombre_usuario: string;
  puntos: number;
  nombre_completo?: string;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
}

// GraphQL query para verificar tareas completadas
const TAREAS_COMPLETADAS = gql`
  query TareasCompletadas {
    tareasCompletadas {
      id
      titulo
    }
  }
`;

// GraphQL query para obtener datos del usuario actual
const ME_QUERY = gql`
  query GetCurrentUser {
    me {
      id
      nombre_usuario
      puntos
      nombre_completo
    }
  }
`;

interface DashboardProps {
  onLogout?: () => void;
  onNavigateToExercise?: (exercise?: any) => void;
  onNavigateToPythonGuide?: () => void;
  onNavigateToProfile?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onNavigateToExercise, onNavigateToPythonGuide, onNavigateToProfile }) => {
  // Obtener cliente Apollo para consultas manuales
  const client = useApolloClient();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullRanking, setShowFullRanking] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [showExercisePanel, setShowExercisePanel] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  // Query para obtener tareas completadas
  const { data: tareasCompletadasData } = useQuery(TAREAS_COMPLETADAS, {
    fetchPolicy: 'cache-and-network'
  });
  
  // Query para obtener datos del usuario actual
  const { data: userData } = useQuery(ME_QUERY, {
    fetchPolicy: 'cache-and-network'
  });

  useEffect(() => {
    fetchTopUsers();
    fetchUserPoints();
  }, []);

  // Actualizar ejercicios completados cuando lleguen los datos
  useEffect(() => {
    if (tareasCompletadasData?.tareasCompletadas) {
      const completedIds = new Set<string>(
        tareasCompletadasData.tareasCompletadas.map((tc: any) => tc.id.toString())
      );
      console.log("✅ Tareas completadas: " + tareasCompletadasData.tareasCompletadas.length + " ejercicios");
      setCompletedExercises(completedIds);
    } else {
      console.warn("⚠️ No se pudieron obtener las tareas completadas", tareasCompletadasData);
    }
  }, [tareasCompletadasData]);

  // Actualizar puntos del usuario cuando lleguen los datos
  useEffect(() => {
    if (userData?.me?.puntos !== undefined) {
      console.log("🔢 Puntos del usuario actualizados via useQuery: " + userData.me.puntos + " puntos");
      setUserPoints(userData.me.puntos);
    } else {
      console.warn("⚠️ No se pudieron obtener los puntos del usuario via useQuery", userData);
      // No establecer puntos a 0 aquí, ya que podría sobrescribir valores válidos
    }
  }, [userData]);

  const fetchUserPoints = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("🔐 Token:", token);

      if (!token) {
        console.warn("⚠️ No hay token disponible para obtener puntos del usuario");
        return;
      }

      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `
            query GetCurrentUser {
              me {
                puntos
              }
            }
          `
        })
      });

      if (!response.ok) {
        console.error(`❌ Error en la respuesta HTTP: ${response.status} ${response.statusText}`);
        return;
      }

      const result = await response.json();
      console.log("📊 Respuesta de puntos del usuario:", result);
      
      if (result.errors) {
        console.error("❌ Errores GraphQL al obtener puntos:", result.errors);
        return;
      }
      
      if (result.data?.me?.puntos !== undefined) {
        console.log("🔢 Puntos obtenidos via fetch:", result.data.me.puntos);
        setUserPoints(result.data.me.puntos);
      } else {
        console.warn("⚠️ No se encontraron puntos en la respuesta:", result);
      }
    } catch (error) {
      console.error('❌ Error al obtener puntos del usuario:', error);
    }
  };

  const fetchTopUsers = async () => {
    const query = `
      query GetTopUsers {
        usuarios {
          id
          nombre_usuario
          puntos
          nombre_completo
        }
      }
    `;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        setError(`Error GraphQL: ${result.errors[0]?.message || 'Error desconocido'}`);
        // Datos de fallback
        setLeaderboardData([
          { rank: 1, name: 'Williams', score: 2500 },
          { rank: 2, name: 'Johnson', score: 2300 },
          { rank: 3, name: 'Smith', score: 2100 },
          { rank: 4, name: 'Brown', score: 1900 },
          { rank: 5, name: 'Jones', score: 1700 }
        ]);
      } else if (result.data?.usuarios) {
        // Ordenar usuarios por puntuación y tomar los top 5
        const sortedUsers = result.data.usuarios
          .sort((a: User, b: User) => b.puntos - a.puntos)
          .slice(0, 5);
        
        const formattedData = sortedUsers.map((user: User, index: number) => ({
          rank: index + 1,
          name: user.nombre_usuario,
          score: user.puntos
        }));
        
        setLeaderboardData(formattedData);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      if (error.message.includes('Failed to fetch')) {
        setError('No se puede conectar al servidor (puerto 4000)');
      } else if (error.message.includes('HTTP error')) {
        setError(`Error del servidor: ${error.message}`);
      } else {
        setError(`Error de conexión: ${error.message}`);
      }
      // Datos de fallback
      setLeaderboardData([
        { rank: 1, name: 'Williams', score: 2500 },
        { rank: 2, name: 'Johnson', score: 2300 },
        { rank: 3, name: 'Smith', score: 2100 },
        { rank: 4, name: 'Brown', score: 1900 },
        { rank: 5, name: 'Jones', score: 1700 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const DAILY_CHALLENGE = gql`
    query DailyChallenge {
      dailyChallenge {
        id
        titulo
        descripcion
        categoria {
          id
          nombre
        }
        nivel {
          id
          nombre
        }
        fechaVencimiento
        puntosBase
        puntosBonus
        codigoBase
        resultadoEsperado
      }
    }
  `;
  const { data: dailyChallengeData, loading: loadingDailyChallenge, error: errorDailyChallenge, refetch: refetchDailyChallenge } = useQuery(DAILY_CHALLENGE, { fetchPolicy: 'network-only' });
  const handleStartChallenge = async () => {
    console.log('Starting daily challenge...');
    try {
      const { data } = await refetchDailyChallenge();
      if (data && data.dailyChallenge) {
        if (onNavigateToExercise) {
          onNavigateToExercise(data.dailyChallenge);
        }
      } else {
        alert('No hay reto diario disponible para hoy.');
      }
    } catch (err) {
      alert('Error al obtener el reto diario.');
      console.error(err);
    }
  };
  const handleViewFullRanking = () => {
    setShowFullRanking(true);
  };

  const planetRequirements = {
    'tierra': 0,     // Siempre disponible
    'marte': 500,    // Requiere 500 puntos (aproximadamente 3-5 ejercicios fáciles)
    'saturno': 1000  // Requiere 1500 puntos (aproximadamente 2-3 ejercicios difíciles + varios intermedios)
  };

  const isPlanetUnlocked = (planetName: string): boolean => {
    const requiredPoints = planetRequirements[planetName as keyof typeof planetRequirements];
    const isUnlocked = userPoints >= requiredPoints;
    console.log(`🪐 Planeta ${planetName}: ${isUnlocked ? 'DESBLOQUEADO' : 'BLOQUEADO'} (${userPoints}/${requiredPoints} puntos)`);
    return isUnlocked;
  };

  const handlePlanetClick = async (planetName: string) => {
    if (!isPlanetUnlocked(planetName)) {
      console.warn(`🔒 Acceso denegado al planeta ${planetName}: Se requieren ${planetRequirements[planetName as keyof typeof planetRequirements]} puntos, usuario tiene ${userPoints}`);
      setShowAccessDenied(true);
      setTimeout(() => setShowAccessDenied(false), 3000);
      return;
    }

    setSelectedPlanet(planetName);
    setShowExercisePanel(true);
    setLoadingExercises(true);
    console.log(`🚀 Planeta seleccionado: ${planetName}`);
    
    try {
      const exerciseData = await getExercisesByPlanet(planetName);
      console.log(`📋 Cargados ${exerciseData.length} ejercicios para el planeta ${planetName}`);
      setExercises(exerciseData);
    } catch (error) {
      console.error('❌ Error loading exercises:', error);
      setExercises([]);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleCloseExercisePanel = () => {
    setShowExercisePanel(false);
    setSelectedPlanet(null);
    setExercises([]);
    setShowExerciseDetail(false);
    setSelectedExercise(null);
  };

  // Definir la consulta GraphQL para obtener tareas por nivel
  const TAREAS_POR_NIVEL = gql`
    query TareasPorNivel($nivelId: ID!) {
      tareasPorNivel(nivelId: $nivelId) {
        id
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

  const getExercisesByPlanet = async (planet: string) => {
    try {
      // Mapear planetas a niveles de dificultad
      const planetLevelMap: { [key: string]: number } = {
        'tierra': 1,   // Fácil
        'marte': 2,    // Intermedio
        'saturno': 3   // Difícil
      };

      const nivelId = planetLevelMap[planet];
      if (!nivelId) {
        console.warn(`⚠️ Planeta ${planet} no tiene un nivel asignado`);
        return [];
      }

      console.log(`🔍 Buscando ejercicios para nivel ${nivelId} (planeta ${planet})`);
      
      // Usar Apollo Client para la consulta
      const { data } = await client.query({
        query: TAREAS_POR_NIVEL,
        variables: { nivelId: nivelId.toString() },
        fetchPolicy: 'network-only' // Asegurar datos actualizados
      });
      
      if (!data || !data.tareasPorNivel || data.tareasPorNivel.length === 0) {
        console.warn(`⚠️ No se encontraron tareas para el nivel ${nivelId}`);
        return [];
      }

      // Transformar los datos para que coincidan con el formato esperado
      const mappedExercises = data.tareasPorNivel.map((tarea: any) => {
        const mappedExercise = {
          id: tarea.id,
          title: tarea.titulo,
          difficulty: tarea.nivel.nombre,
          points: tarea.puntosBase || 0,
          description: tarea.descripcion,
          codigoBase: tarea.codigoBase,
          resultadoEsperado: tarea.resultadoEsperado,
          categoria: tarea.categoria.nombre
        };
        return mappedExercise;
      });
      
      return mappedExercises;
    } catch (error) {
      console.error('❌ Error al obtener ejercicios:', error);
      return [];
    }
  };

  const handleBackFromRanking = () => {
    setShowFullRanking(false);
  };

 

  // Función para ir al perfil
  const handleGoToProfile = () => {
    setShowUserMenu(false);
    if (onNavigateToProfile) {
      onNavigateToProfile();
    }
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    console.log("🚪 Cerrando sesión y limpiando datos...");
    setShowUserMenu(false);
    
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    
    // Limpiar estados locales
    setSelectedPlanet(null);
    setShowExercisePanel(false);
    setExercises([]);
    setSelectedExercise(null);
    setShowExerciseDetail(false);
    setUserPoints(0);
    setCompletedExercises(new Set());
    setLeaderboardData([]);
    
    // Llamar al callback si existe
    if (onLogout) {
      onLogout();
    }
    
    console.log("✅ Sesión cerrada correctamente");
  };



  const getUserInitials = () => {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      try {
        const userData = JSON.parse(usuario);
        const name = userData.nombre_completo || userData.nombre_usuario || 'Usuario';
        return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
      } catch (error) {
        return 'U';
      }
    }
    return 'U';
  };

  // Cerrar menú al hacer click fuera
  /**
    
   
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-avatar-container') && !target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]); */

  // Mostrar FullRanking si showFullRanking es true
  if (showFullRanking) {
    return <FullRanking onBack={handleBackFromRanking} />;
  }

  return (
    <div className={`dashboard ${showExercisePanel ? 'panel-open' : ''}`}>
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-container">
            <img src="/Logo.png" alt="AstroCode Logo" className="dashboard-logo" />
            <h1 className="dashboard-title">AstroCode</h1>
          </div>
          <div className="user-avatar-container">
            <div className="user-avatar" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="avatar-circle">
                {getUserInitials()}
              </div>
            </div>
            {showUserMenu && (
              <div className="user-menu-horizontal">
                <button className="user-menu-btn-horizontal" onClick={handleGoToProfile}>
                  <span role="img" aria-label="Perfil">👤</span>
                </button>
                <button className="user-menu-btn-horizontal" onClick={handleLogout}>
                  <span role="img" aria-label="Cerrar sesión">🚪</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`dashboard-main ${showExercisePanel ? 'with-panel' : ''}`}>
        {/* Leaderboard */}
        <div className="leaderboard-container">
          <div className="leaderboard">
            <h2 className="leaderboard-title">Leaderboard</h2>
            <div className="leaderboard-list">
              {loading ? (
                <div className="loading-leaderboard">Cargando...</div>
              ) : (
                leaderboardData.map((entry) => (
                  <div key={entry.rank} className="leaderboard-item">
                    <span className="rank">{entry.rank}</span>
                    <span className="name">{entry.name}</span>
                    <span className="score">{entry.score} pts</span>
                  </div>
                ))
              )}
            </div>
            {error && (
              <div className="leaderboard-error">{error}</div>
            )}
            <button 
              className="view-full-ranking-btn"
              onClick={handleViewFullRanking}
            >
              View Full Ranking
            </button>
          </div>
        </div>

        {/* Central Content */}
        <div className="central-content">
          {/* Access Denied Message */}
          {showAccessDenied && (
            <div className="access-denied-message">
              ¡Necesitas más puntos para desbloquear este planeta!
            </div>
          )}

          {/* Solar System Animation */}
          <div className="solar-system">
          {/* Sol en el centro */}
          <div className="sun"></div>
          
          {/* Tierra - Nivel Fácil */}
          <div className="orbit orbit-earth">
            <div 
              className={`planet earth ${selectedPlanet === 'tierra' ? 'selected' : ''} ${isPlanetUnlocked('tierra') ? 'unlocked' : 'locked'}`}
              onClick={() => handlePlanetClick('tierra')}
            >
              <span className="planet-label">Tierra</span>
              {!isPlanetUnlocked('tierra') && <span className="lock-icon">🔒</span>}
            </div>
          </div>
          
          {/* Marte - Nivel Intermedio */}
          <div className="orbit orbit-mars">
            <div 
              className={`planet mars ${selectedPlanet === 'marte' ? 'selected' : ''} ${isPlanetUnlocked('marte') ? 'unlocked' : 'locked'}`}
              onClick={() => handlePlanetClick('marte')}
              title={!isPlanetUnlocked('marte') ? `Requiere ${planetRequirements.marte} puntos` : ''}
            >
              <span className="planet-label">Marte</span>
              {!isPlanetUnlocked('marte') && <span className="lock-icon">🔒</span>}
              {!isPlanetUnlocked('marte') && <span className="points-required">{planetRequirements.marte}pts</span>}
            </div>
          </div>
          
          {/* Saturno - Nivel Difícil */}
          <div className="orbit orbit-saturn">
            <div 
              className={`planet saturn ${selectedPlanet === 'saturno' ? 'selected' : ''} ${isPlanetUnlocked('saturno') ? 'unlocked' : 'locked'}`}
              onClick={() => handlePlanetClick('saturno')}
              title={!isPlanetUnlocked('saturno') ? `Requiere ${planetRequirements.saturno} puntos` : ''}
            >
              <div className="saturn-rings"></div>
              <span className="planet-label">Saturno</span>
              {!isPlanetUnlocked('saturno') && <span className="lock-icon">🔒</span>}
              {!isPlanetUnlocked('saturno') && <span className="points-required">{planetRequirements.saturno}pts</span>}
            </div>
          </div>
          </div>

          {/* Planet Selection Message */}
          <div className="planet-selection-message">
            <h2>Elige tu planeta de aventura</h2>
          </div>
        </div>

        {/* Right Side Content */}
        <div className="right-side-content">
          {/* Daily Challenge */}
          <div className="daily-challenge-container">
            <div className="daily-challenge">
              <h2 className="challenge-title">Reto diario</h2>
              <p className="challenge-description">Resuelve el reto diario</p>
              <button 
                className="start-challenge-btn"
                onClick={handleStartChallenge}
              >
                Start
              </button>
            </div>
          </div>

          {/* Python Guide */}
          <div className="python-guide-container">
            <div className="python-guide">
              <h2 className="guide-title">Guía de Python</h2>
              <p className="guide-description">Aprende los fundamentos de Python desde cero</p>
              <button 
                className="start-guide-btn"
                onClick={onNavigateToPythonGuide}
              >
                Explorar
              </button>
            </div>
          </div>
        </div>

        {/* Exercise Panel */}
        <div className={`exercise-panel ${showExercisePanel ? 'open' : ''}`}>
          <div className="exercise-panel-header">
            <h2 className="exercise-panel-title">
              Ejercicios - {selectedPlanet ? selectedPlanet.charAt(0).toUpperCase() + selectedPlanet.slice(1) : ''}
            </h2>
            <button className="close-panel-btn" onClick={handleCloseExercisePanel}>
              ✕
            </button>
          </div>
          <div className="exercise-panel-content">
            {!showExerciseDetail ? (
              loadingExercises ? (
                <div className="loading-exercises">Cargando ejercicios...</div>
              ) : exercises.length > 0 ? (
                exercises.map((exercise) => {
                  console.log("🧪 Checking exercise ID:", exercise.id, "Completed:", completedExercises.has(exercise.id));
                  const isCompleted = completedExercises.has(exercise.id.toString());
                  return (
                    <div key={exercise.id} className={`exercise-item ${isCompleted ? 'completed' : ''}`}>
                      <div className="exercise-info">
                        <h3 className="exercise-title">
                          {exercise.title}
                          {isCompleted && <span className="completed-badge"></span>}
                        </h3>
                        <div className="exercise-meta">
                          <span className={`exercise-difficulty ${exercise.difficulty.toLowerCase()}`}>
                            {exercise.difficulty}
                          </span>
                          <span className="exercise-points">{exercise.points} pts</span>
                        </div>
                      </div>
                      <button 
                        className={`view-exercise-btn ${isCompleted ? 'completed' : ''}`}
                        onClick={() => {
                          if (!isCompleted) {
                            setSelectedExercise(exercise);
                            setShowExerciseDetail(true);
                          }
                        }}
                        disabled={isCompleted}
                      >
                        {isCompleted ? 'COMPLETADO' : 'VER'}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="no-exercises">No hay ejercicios disponibles para este nivel.</div>
              )
            ) : (
              /* Exercise Detail View */
              <div className="exercise-detail">
                <button 
                  className="back-to-list-btn"
                  onClick={() => {
                    setShowExerciseDetail(false);
                    setSelectedExercise(null);
                  }}
                >
                  ← Volver a la lista
                </button>
                {selectedExercise && (
                  <div className="exercise-detail-content">
                    <h2 className="exercise-detail-title">{selectedExercise.title}</h2>
                    <p className="exercise-detail-type">{selectedExercise.categoria}</p>
                    <div className="exercise-detail-meta">
                      <span className={`exercise-difficulty ${selectedExercise.difficulty.toLowerCase()}`}>
                        {selectedExercise.difficulty}
                      </span>
                      <span className="exercise-points">{selectedExercise.points} pts</span>
                    </div>
                    <hr className="exercise-detail-separator" />
                    <div className="exercise-detail-description">
                      {selectedExercise.description || 'No hay descripción disponible para este ejercicio.'}
                    </div>
                    <button 
                      className={`start-exercise-btn ${!isPlanetUnlocked(selectedPlanet || '') ? 'disabled' : ''}`}
                      onClick={() => {
                        if (!selectedPlanet || !isPlanetUnlocked(selectedPlanet)) {
                          setShowAccessDenied(true);
                          setTimeout(() => setShowAccessDenied(false), 3000);
                          return;
                        }
                       
                        if (onNavigateToExercise) {
                          onNavigateToExercise(selectedExercise);
                        }
                      }}
                      disabled={!isPlanetUnlocked(selectedPlanet || '')}
                    >
                      {!isPlanetUnlocked(selectedPlanet || '') ? 
                        `Requiere ${planetRequirements[selectedPlanet as keyof typeof planetRequirements] || 0} puntos` : 
                        'Comenzar'
                      }
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Stars Background */}
      <div className="stars">
        {Array.from({ length: 100 }, (_, i) => (
          <div 
            key={i} 
            className="star" 
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;