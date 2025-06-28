import React, { useState, useEffect } from 'react';
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

interface DashboardProps {
  onLogout?: () => void;
  onNavigateToExercise?: (exercise?: any) => void;
  onNavigateToPythonGuide?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onNavigateToExercise, onNavigateToPythonGuide }) => {
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

  useEffect(() => {
    fetchTopUsers();
    fetchUserPoints();
  }, []);

  const fetchUserPoints = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

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

      const result = await response.json();
      if (result.data?.me?.puntos !== undefined) {
        setUserPoints(result.data.me.puntos);
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
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

  const handleStartChallenge = () => {
    console.log('Starting daily challenge...');
    // TODO: Implementar lógica para obtener el desafío diario
    // Por ahora, comentamos esta funcionalidad hasta que se implemente correctamente
    console.warn('Desafío diario no implementado aún');
    // if (onNavigateToExercise) {
    //   onNavigateToExercise();
    // }
  };

  const handleViewFullRanking = () => {
    setShowFullRanking(true);
  };

  const planetRequirements = {
    'tierra': 0,    // Siempre disponible
    'marte': 100,   // Requiere 100 puntos
    'saturno': 250  // Requiere 250 puntos
  };

  const isPlanetUnlocked = (planetName: string): boolean => {
    const requiredPoints = planetRequirements[planetName as keyof typeof planetRequirements];
    return userPoints >= requiredPoints;
  };

  const handlePlanetClick = async (planetName: string) => {
    if (!isPlanetUnlocked(planetName)) {
      setShowAccessDenied(true);
      setTimeout(() => setShowAccessDenied(false), 3000);
      return;
    }

    setSelectedPlanet(planetName);
    setShowExercisePanel(true);
    setLoadingExercises(true);
    console.log(`Planeta seleccionado: ${planetName}`);
    
    try {
      const exerciseData = await getExercisesByPlanet(planetName);
      setExercises(exerciseData);
    } catch (error) {
      console.error('Error loading exercises:', error);
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

  const getExercisesByPlanet = async (planet: string) => {
    try {
      // Mapear planetas a niveles de dificultad
      const planetLevelMap: { [key: string]: number } = {
        'tierra': 1,   // Fácil
        'marte': 2,    // Intermedio
        'saturno': 3   // Difícil
      };

      const nivelId = planetLevelMap[planet];
      if (!nivelId) return [];

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          query: `
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
          `,
          variables: { nivelId: nivelId.toString() }
        })
      });

      const data = await response.json();
      
      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        return [];
      }

      // Transformar los datos para que coincidan con el formato esperado
      console.log('=== DEBUG API RESPONSE ===');
      console.log('Raw data from API:', data.data.tareasPorNivel);
      const mappedExercises = data.data.tareasPorNivel.map((tarea: any) => {
        console.log('=== MAPPING TAREA ===');
        console.log('tarea completa:', tarea);
        console.log('tarea.titulo:', tarea.titulo);
        console.log('tarea.codigoBase:', tarea.codigoBase);
        console.log('tarea.resultadoEsperado:', tarea.resultadoEsperado);
        console.log('tarea.descripcion:', tarea.descripcion);
        console.log('tarea.puntosBase:', tarea.puntosBase, 'type:', typeof tarea.puntosBase);
        
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
        // Debug logs removed to reduce console noise
        return mappedExercise;
      });
      // Debug logs removed to reduce console noise
      return mappedExercises;
    } catch (error) {
      console.error('Error fetching exercises:', error);
      return [];
    }
  };

  const handleBackFromRanking = () => {
    setShowFullRanking(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

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
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar Sesión
          </button>
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
                exercises.map((exercise) => (
                  <div key={exercise.id} className="exercise-item">
                    <div className="exercise-info">
                      <h3 className="exercise-title">{exercise.title}</h3>
                      <div className="exercise-meta">
                        <span className={`exercise-difficulty ${exercise.difficulty.toLowerCase()}`}>
                          {exercise.difficulty}
                        </span>
                        <span className="exercise-points">{exercise.points} pts</span>
                      </div>
                    </div>
                    <button 
                      className="view-exercise-btn"
                      onClick={() => {
                        setSelectedExercise(exercise);
                        setShowExerciseDetail(true);
                      }}
                    >
                      VER
                    </button>
                  </div>
                ))
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
                        console.log('=== DEBUG DASHBOARD ===');
                        // Debug logs removed to reduce console noise
                        console.log('=== FIN DEBUG ===');
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
};

export default Dashboard;