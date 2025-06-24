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
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onNavigateToExercise }) => {
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

  useEffect(() => {
    fetchTopUsers();
  }, []);

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
      const response = await fetch('http://localhost:4001/graphql', {
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
        setError('No se puede conectar al servidor (puerto 4001)');
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
    if (onNavigateToExercise) {
      onNavigateToExercise();
    }
  };

  const handleViewFullRanking = () => {
    setShowFullRanking(true);
  };

  const handlePlanetClick = async (planetName: string) => {
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
      const response = await fetch('http://localhost:4001/graphql', {
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
      console.log('Raw data from API:', data.data.tareasPorNivel);
      const mappedExercises = data.data.tareasPorNivel.map((tarea: any) => {
        console.log('Mapping tarea:', tarea.titulo, 'puntosBase:', tarea.puntosBase, 'type:', typeof tarea.puntosBase);
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
        console.log('Mapped exercise points:', mappedExercise.points);
        return mappedExercise;
      });
      console.log('Final mapped exercises:', mappedExercises);
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

        {/* Solar System Animation */}
        <div className="solar-system">
          {/* Sol en el centro */}
          <div className="sun"></div>
          
          {/* Tierra - Nivel Fácil */}
          <div className="orbit orbit-earth">
            <div 
              className={`planet earth ${selectedPlanet === 'tierra' ? 'selected' : ''}`}
              onClick={() => handlePlanetClick('tierra')}
            >
              <span className="planet-label">Tierra</span>
            </div>
          </div>
          
          {/* Marte - Nivel Intermedio */}
          <div className="orbit orbit-mars">
            <div 
              className={`planet mars ${selectedPlanet === 'marte' ? 'selected' : ''}`}
              onClick={() => handlePlanetClick('marte')}
            >
              <span className="planet-label">Marte</span>
            </div>
          </div>
          
          {/* Saturno - Nivel Difícil */}
          <div className="orbit orbit-saturn">
            <div 
              className={`planet saturn ${selectedPlanet === 'saturno' ? 'selected' : ''}`}
              onClick={() => handlePlanetClick('saturno')}
            >
              <div className="saturn-rings"></div>
              <span className="planet-label">Saturno</span>
            </div>
          </div>
        </div>

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
                      className="start-exercise-btn"
                      onClick={() => {
                        console.log('Iniciando ejercicio:', selectedExercise.title);
                        console.log('Código base:', selectedExercise.codigoBase);
                        console.log('Resultado esperado:', selectedExercise.resultadoEsperado);
                        if (onNavigateToExercise) {
                          onNavigateToExercise(selectedExercise);
                        }
                      }}
                    >
                      Comenzar
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