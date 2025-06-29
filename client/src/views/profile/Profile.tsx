import React, { useState, useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import './Profile.css';

interface ProfileProps {
  onBackToDashboard: () => void;
}

interface UserData {
  id: string;
  nombre_usuario: string;
  correo_electronico: string;
  nombre_completo?: string;
  puntos: number;
  creado_el: string;
}

// GraphQL query para estadísticas del usuario
const GET_USER_STATS = gql`
  query GetUserStats {
    me {
      id
      nombre_usuario
      correo_electronico
      nombre_completo
      puntos
      creado_el
    }
    tareasCompletadas {
      id
      nivel {
        nombre
      }
    }
    tareas {
      id
      nivel {
        nombre
      }
    }
  }
`;

interface UserStats {
  ejerciciosCompletados: number;
  ejerciciosFaciles: number;
  ejerciciosIntermedios: number;
  ejerciciosDificiles: number;
  totalEjercicios: number;
  totalEjerciciosFaciles: number;
  totalEjerciciosIntermedios: number;
  totalEjerciciosDificiles: number;
}

const Profile: React.FC<ProfileProps> = ({ onBackToDashboard }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    ejerciciosCompletados: 0,
    ejerciciosFaciles: 0,
    ejerciciosIntermedios: 0,
    ejerciciosDificiles: 0,
    totalEjercicios: 0,
    totalEjerciciosFaciles: 0,
    totalEjerciciosIntermedios: 0,
    totalEjerciciosDificiles: 0
  });
  const [loading, setLoading] = useState(true);

  // Query para obtener estadísticas actualizadas
  const { data: statsData, loading: queryLoading, refetch: refetchStats } = useQuery(GET_USER_STATS, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000 // Actualizar cada 30 segundos
  });

  // Los datos del usuario ahora se obtienen desde el query GraphQL
  // useEffect(() => {
  //   loadUserData();
  // }, []);

  // Actualizar estadísticas cuando lleguen los datos de Apollo
  useEffect(() => {
    if (statsData) {
      updateUserStats(statsData);
      setLoading(false);
    }
  }, [statsData]);

  // Actualizar loading state
  useEffect(() => {
    setLoading(queryLoading);
  }, [queryLoading]);

  const loadUserData = () => {
    try {
      const usuario = localStorage.getItem('usuario');
      if (usuario) {
        const parsedUser = JSON.parse(usuario);
        setUserData(parsedUser);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStats = (data: any) => {
    try {
      // Actualizar datos del usuario
      if (data.me) {
        setUserData(data.me);
      }
      
      const tareasCompletadas = data.tareasCompletadas || [];
      const todasLasTareas = data.tareas || [];
      
      // Contar ejercicios completados por dificultad
      const ejerciciosFaciles = tareasCompletadas.filter((t: any) => t.nivel.nombre === 'Fácil').length;
      const ejerciciosIntermedios = tareasCompletadas.filter((t: any) => t.nivel.nombre === 'Intermedio').length;
      const ejerciciosDificiles = tareasCompletadas.filter((t: any) => t.nivel.nombre === 'Difícil').length;
      
      // Contar total de ejercicios por dificultad
      const totalEjerciciosFaciles = todasLasTareas.filter((t: any) => t.nivel.nombre === 'Fácil').length;
      const totalEjerciciosIntermedios = todasLasTareas.filter((t: any) => t.nivel.nombre === 'Intermedio').length;
      const totalEjerciciosDificiles = todasLasTareas.filter((t: any) => t.nivel.nombre === 'Difícil').length;
      
      const stats: UserStats = {
        ejerciciosCompletados: tareasCompletadas.length,
        ejerciciosFaciles,
        ejerciciosIntermedios,
        ejerciciosDificiles,
        totalEjercicios: todasLasTareas.length,
        totalEjerciciosFaciles,
        totalEjerciciosIntermedios,
        totalEjerciciosDificiles
      };
      
      setUserStats(stats);
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  };

  // Función para refrescar estadísticas manualmente
  const refreshStats = () => {
    refetchStats();
  };

  const getUserInitials = () => {
    if (!userData) return 'U';
    const name = userData.nombre_completo || userData.nombre_usuario || 'Usuario';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  const getPlanetLevel = (points: number) => {
    if (points >= 1500) return { name: 'Saturno', icon: '🪐', color: '#ffd700' };
    if (points >= 500) return { name: 'Marte', icon: '🔴', color: '#ff6b6b' };
    return { name: 'Tierra', icon: '🌍', color: '#4ecdc4' };
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-error">
        <p>Error al cargar los datos del usuario</p>
        <button onClick={onBackToDashboard} className="back-btn">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const planetLevel = getPlanetLevel(userData.puntos);

  return (
    <div className="profile-container">
      {/* Header */}
      <header className="profile-header">
        <button onClick={onBackToDashboard} className="back-btn">
          ← Volver al Dashboard
        </button>
        <h1 className="profile-title">Mi Perfil</h1>
      </header>

      {/* Main Content */}
      <main className="profile-main">
        {/* User Info Card */}
        <div className="profile-card user-info-card">
          <div className="user-avatar-large">
            <div className="avatar-circle-large">
              {getUserInitials()}
            </div>
          </div>
          <div className="user-details">
            <h2 className="user-name">{userData.nombre_completo || userData.nombre_usuario}</h2>
            <p className="user-email">{userData.correo_electronico}</p>
            <div className="user-level">
              <span className="planet-icon" style={{ color: planetLevel.color }}>
                {planetLevel.icon}
              </span>
              <span className="planet-name">Nivel {planetLevel.name}</span>
            </div>
            <div className="user-points">
              <span className="points-value">{userData.puntos}</span>
              <span className="points-label">puntos</span>
            </div>
            <p className="member-since">
              Miembro desde {formatDate(userData.creado_el)}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="profile-card stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-value">{userStats.ejerciciosCompletados}</div>
            <div className="stat-label">Ejercicios Completados</div>
          </div>

          <div className="profile-card stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{userStats.totalEjercicios > 0 ? Math.round((userStats.ejerciciosCompletados / userStats.totalEjercicios) * 100) : 0}%</div>
            <div className="stat-label">Progreso General</div>
          </div>
        </div>

        {/* Exercise Breakdown */}
        <div className="profile-card exercise-breakdown">
          <h3 className="card-title">Ejercicios por Dificultad</h3>
          <div className="difficulty-stats">
            <div className="difficulty-item">
              <div className="difficulty-bar">
                <div className="difficulty-fill easy" style={{ width: `${userStats.totalEjerciciosFaciles > 0 ? (userStats.ejerciciosFaciles / userStats.totalEjerciciosFaciles) * 100 : 0}%` }}></div>
              </div>
              <div className="difficulty-info">
                <span className="difficulty-label">Fácil</span>
                <span className="difficulty-count">{userStats.ejerciciosFaciles}/{userStats.totalEjerciciosFaciles}</span>
              </div>
            </div>

            <div className="difficulty-item">
              <div className="difficulty-bar">
                <div className="difficulty-fill medium" style={{ width: `${userStats.totalEjerciciosIntermedios > 0 ? (userStats.ejerciciosIntermedios / userStats.totalEjerciciosIntermedios) * 100 : 0}%` }}></div>
              </div>
              <div className="difficulty-info">
                <span className="difficulty-label">Intermedio</span>
                <span className="difficulty-count">{userStats.ejerciciosIntermedios}/{userStats.totalEjerciciosIntermedios}</span>
              </div>
            </div>

            <div className="difficulty-item">
              <div className="difficulty-bar">
                <div className="difficulty-fill hard" style={{ width: `${userStats.totalEjerciciosDificiles > 0 ? (userStats.ejerciciosDificiles / userStats.totalEjerciciosDificiles) * 100 : 0}%` }}></div>
              </div>
              <div className="difficulty-info">
                <span className="difficulty-label">Difícil</span>
                <span className="difficulty-count">{userStats.ejerciciosDificiles}/{userStats.totalEjerciciosDificiles}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="profile-card achievements">
          <h3 className="card-title">Logros Recientes</h3>
          <div className="achievements-grid">
            <div className="achievement-item">
              <div className="achievement-icon">🏆</div>
              <div className="achievement-text">
                <div className="achievement-name">Primer Ejercicio</div>
                <div className="achievement-desc">Completaste tu primer ejercicio</div>
              </div>
            </div>
            <div className="achievement-item">
              <div className="achievement-icon">⭐</div>
              <div className="achievement-text">
                <div className="achievement-name">Racha de 7 días</div>
                <div className="achievement-desc">Mantuviste una racha de una semana</div>
              </div>
            </div>
            <div className="achievement-item">
              <div className="achievement-icon">🚀</div>
              <div className="achievement-text">
                <div className="achievement-name">Explorador Espacial</div>
                <div className="achievement-desc">Desbloqueaste un nuevo planeta</div>
              </div>
            </div>
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

export default Profile;