import React from 'react';
import './FullRanking.css';

interface User {
  id: string;
  nombre_usuario: string;
  puntos: number;
  nombre_completo?: string;
}

interface FullRankingProps {
  onBack: () => void;
}

const FullRanking: React.FC<FullRankingProps> = ({ onBack }) => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    const query = `
      query GetAllUsers {
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

      const result = await response.json();
      
      if (result.errors) {
        setError('Error al cargar el ranking completo');
        // Datos de fallback con más usuarios
        setUsers([
          { id: '1', nombre_usuario: 'Williams', puntos: 2500 },
          { id: '2', nombre_usuario: 'Johnson', puntos: 2300 },
          { id: '3', nombre_usuario: 'Smith', puntos: 2100 },
          { id: '4', nombre_usuario: 'Brown', puntos: 1900 },
          { id: '5', nombre_usuario: 'Jones', puntos: 1700 },
          { id: '6', nombre_usuario: 'Davis', puntos: 1500 },
          { id: '7', nombre_usuario: 'Miller', puntos: 1300 },
          { id: '8', nombre_usuario: 'Wilson', puntos: 1100 },
          { id: '9', nombre_usuario: 'Moore', puntos: 900 },
          { id: '10', nombre_usuario: 'Taylor', puntos: 700 }
        ]);
      } else if (result.data?.usuarios) {
        // Ordenar usuarios por puntuación (mayor a menor)
        const sortedUsers = result.data.usuarios
          .sort((a: User, b: User) => b.puntos - a.puntos);
        
        setUsers(sortedUsers);
      }
    } catch (error: any) {
      setError('Error de conexión');
      // Datos de fallback
      setUsers([
         { id: '1', nombre_usuario: 'Williams', puntos: 2500 },
         { id: '2', nombre_usuario: 'Johnson', puntos: 2300 },
         { id: '3', nombre_usuario: 'Smith', puntos: 2100 },
         { id: '4', nombre_usuario: 'Brown', puntos: 1900 },
         { id: '5', nombre_usuario: 'Jones', puntos: 1700 },
         { id: '6', nombre_usuario: 'Davis', puntos: 1500 },
         { id: '7', nombre_usuario: 'Miller', puntos: 1300 },
         { id: '8', nombre_usuario: 'Wilson', puntos: 1100 },
         { id: '9', nombre_usuario: 'Moore', puntos: 900 },
         { id: '10', nombre_usuario: 'Taylor', puntos: 700 }
       ]);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${rank}`;
    }
  };

  return (
    <div className="full-ranking">
      <div className="stars"></div>
      <div className="ranking-container">
        <div className="ranking-header">
          <h1 className="ranking-title">🏆 Ranking Completo</h1>
          <button className="back-btn" onClick={onBack}>
            ← Volver al Dashboard
          </button>
        </div>
        
        {loading ? (
          <div className="loading-ranking">Cargando ranking completo...</div>
        ) : (
          <div className="ranking-list">
            {users.map((user, index) => {
              const rank = index + 1;
              return (
                <div 
                  key={user.id} 
                  className={`ranking-item ${
                    rank <= 3 ? `top-${rank}` : ''
                  }`}
                >
                  <div className="rank-info">
                    <span className="rank-icon">{getRankIcon(rank)}</span>
                    <span className="rank-number">#{rank}</span>
                  </div>
                  <div className="user-info">
                    <span className="username">{user.nombre_usuario}</span>
                    {user.nombre_completo && (
                      <span className="full-name">({user.nombre_completo})</span>
                    )}
                  </div>
                  <div className="score-info">
                     <span className="score">{user.puntos}</span>
                     <span className="score-label">pts</span>
                   </div>
                </div>
              );
            })}
          </div>
        )}
        
        {error && (
          <div className="ranking-error">{error}</div>
        )}
      </div>
    </div>
  );
};

export default FullRanking;