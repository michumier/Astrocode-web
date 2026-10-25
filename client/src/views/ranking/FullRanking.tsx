import React from 'react';
import { gql, useQuery } from '@apollo/client';
import './FullRanking.css';

const GET_RANKING = gql`
  query GetRanking {
    ranking(limite: 100) {
      id
      nombre_usuario
      puntos
      posicion
    }
  }
`;

interface RankingUser {
  id: string;
  nombre_usuario: string;
  puntos: number;
  posicion: number;
}

interface FullRankingProps {
  onBack: () => void;
}

const FullRanking: React.FC<FullRankingProps> = ({ onBack }) => {
  const { data, loading, error } = useQuery(GET_RANKING, { fetchPolicy: 'network-only' });
  const users: RankingUser[] = data?.ranking || [];

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
              const rank = user.posicion;
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
          <div className="ranking-error">No se pudo cargar el ranking. Inténtalo de nuevo más tarde.</div>
        )}
      </div>
    </div>
  );
};

export default FullRanking;