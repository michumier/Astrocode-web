import React, { useState, useEffect } from 'react';
import LoginApp from './views/login/App';
import Dashboard from './views/dashboard/Dashboard';
import Exercise from './views/exercises/Exercise';

const Router: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'exercise'>('dashboard');

  useEffect(() => {
    // Verificar si el usuario está autenticado al cargar la aplicación
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');
    
    if (token && usuario) {
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  // Función para manejar el login exitoso
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Función para manejar el logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setIsAuthenticated(false);
    setCurrentView('dashboard');
  };

  // Función para navegar al ejercicio
  const handleNavigateToExercise = () => {
    setCurrentView('exercise');
  };

  // Función para volver al dashboard
  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0c1445 0%, #1a237e 50%, #283593 100%)',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        Cargando...
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        currentView === 'dashboard' ? (
          <Dashboard 
            onLogout={handleLogout} 
            onNavigateToExercise={handleNavigateToExercise}
          />
        ) : (
          <Exercise onBackToDashboard={handleBackToDashboard} />
        )
      ) : (
        <LoginApp onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
};

export default Router;