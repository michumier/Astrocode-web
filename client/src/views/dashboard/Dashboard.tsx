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
  onNavigateToExercise?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onNavigateToExercise }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullRanking, setShowFullRanking] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [showExercisePanel, setShowExercisePanel] = useState(false);

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

  const handlePlanetClick = (planetName: string) => {
    setSelectedPlanet(planetName);
    setShowExercisePanel(true);
    console.log(`Planeta seleccionado: ${planetName}`);
  };

  const handleCloseExercisePanel = () => {
    setShowExercisePanel(false);
    setSelectedPlanet(null);
  };

  const getExercisesByPlanet = (planet: string) => {
    const exercises = {
      tierra: [
        { id: 1, title: "Variables y Tipos de Datos", difficulty: "Fácil", points: 50 },
        { id: 2, title: "Operadores Básicos", difficulty: "Fácil", points: 75 },
        { id: 3, title: "Estructuras Condicionales", difficulty: "Fácil", points: 100 },
        { id: 4, title: "Bucles Simples", difficulty: "Fácil", points: 125 },
        { id: 5, title: "Funciones Básicas", difficulty: "Fácil", points: 150 }
      ],
      marte: [
        { id: 6, title: "Arrays y Listas", difficulty: "Intermedio", points: 200 },
        { id: 7, title: "Objetos y Clases", difficulty: "Intermedio", points: 250 },
        { id: 8, title: "Algoritmos de Ordenamiento", difficulty: "Intermedio", points: 300 },
        { id: 9, title: "Recursión", difficulty: "Intermedio", points: 350 },
        { id: 10, title: "Estructuras de Datos", difficulty: "Intermedio", points: 400 }
      ],
      saturno: [
        { id: 11, title: "Algoritmos Avanzados", difficulty: "Difícil", points: 500 },
        { id: 12, title: "Programación Dinámica", difficulty: "Difícil", points: 600 },
        { id: 13, title: "Grafos y Árboles", difficulty: "Difícil", points: 700 },
        { id: 14, title: "Optimización", difficulty: "Difícil", points: 800 },
        { id: 15, title: "Algoritmos de Búsqueda", difficulty: "Difícil", points: 900 }
      ]
    };
    return exercises[planet as keyof typeof exercises] || [];
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
            {selectedPlanet && getExercisesByPlanet(selectedPlanet).map((exercise) => (
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
                <button className="start-exercise-btn">
                  Comenzar
                </button>
              </div>
            ))}
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