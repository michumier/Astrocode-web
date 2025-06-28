import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const initializeProfile = async () => {
      await loadUserData();
      loadUserStats();
    };
    initializeProfile();
  }, []);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Intentar obtener datos frescos desde la API
        const userQuery = `
          query GetMe {
            me {
              id
              nombre_usuario
              correo_electronico
              nombre_completo
              puntos
              creado_el
            }
          }
        `;

        const response = await fetch('http://localhost:4000/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ query: userQuery })
        });

        const result = await response.json();
        console.log('Usuario desde API:', result);
        
        if (result.data && result.data.me) {
          const updatedUser = result.data.me;
          console.log('Datos del usuario actualizados:', {
            puntos: updatedUser.puntos,
            tipo_puntos: typeof updatedUser.puntos,
            creado_el: updatedUser.creado_el,
            tipo_fecha: typeof updatedUser.creado_el
          });
          setUserData(updatedUser);
          // Actualizar localStorage con datos frescos
          localStorage.setItem('usuario', JSON.stringify(updatedUser));
        } else {
          console.log('No se pudieron obtener datos del usuario desde la API');
        }
      } else {
        // Fallback a localStorage si no hay token
        const usuario = localStorage.getItem('usuario');
        if (usuario) {
          const parsedUser = JSON.parse(usuario);
          setUserData(parsedUser);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback a localStorage en caso de error
      try {
        const usuario = localStorage.getItem('usuario');
        if (usuario) {
          const parsedUser = JSON.parse(usuario);
          setUserData(parsedUser);
        }
      } catch (fallbackError) {
        console.error('Error loading fallback user data:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Obtener estadísticas de ejercicios completados por el usuario
      const statsQuery = `
        query GetUserStats {
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

      const response = await fetch('http://localhost:4001/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query: statsQuery })
      });

      const result = await response.json();
      
      if (result.data) {
        const tareasCompletadas = result.data.tareasCompletadas || [];
        const todasLasTareas = result.data.tareas || [];
        
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
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      // En caso de error, mantener valores por defecto
    }
  };

  const getUserInitials = () => {
    if (!userData) return 'U';
    const name = userData.nombre_completo || userData.nombre_usuario || 'Usuario';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) {
        console.log('No date string provided');
        return 'Fecha no disponible';
      }
      
      console.log('Formatting date:', dateString, 'Type:', typeof dateString);
      
      // Convertir a string si no lo es
      const dateStr = String(dateString);
      
      // Manejar diferentes formatos de fecha
      let date: Date;
      
      // Si es formato YYYY-MM-DD HH:MM:SS (como 2025-06-19 19:47:37)
      if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(dateStr)) {
        // Extraer solo la parte de la fecha (YYYY-MM-DD)
        const datePart = dateStr.split(' ')[0];
        date = new Date(datePart + 'T00:00:00');
      }
      // Si es un timestamp numérico
      else if (/^\d+$/.test(dateStr)) {
        const timestamp = parseInt(dateStr);
        // Si es timestamp en segundos, convertir a milisegundos
        date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
      }
      // Si contiene 'T' (formato ISO)
      else if (dateStr.includes('T')) {
        date = new Date(dateStr);
      }
      // Si contiene '-' pero no espacio (formato YYYY-MM-DD)
      else if (dateStr.includes('-') && !dateStr.includes(' ')) {
        date = new Date(dateStr + 'T00:00:00');
      }
      // Si contiene '/' (formato MM/DD/YYYY o DD/MM/YYYY)
      else if (dateStr.includes('/')) {
        date = new Date(dateStr);
      }
      // Intentar parsear directamente
      else {
        date = new Date(dateStr);
      }
      
      console.log('Parsed date:', date);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.log('Invalid date after parsing');
        return 'Fecha no disponible';
      }
      
      const formatted = date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      console.log('Formatted date:', formatted);
      return formatted;
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', dateString);
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