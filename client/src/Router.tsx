import React, { useState, useEffect } from 'react';
import LoginApp from './views/login/App';
import Dashboard from './views/dashboard/Dashboard';
import Exercise from './views/exercises/Exercise';
import PythonGuide from './views/python-guide/PythonGuide';

const Router: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'login' | 'home' | 'exercise' | 'python-guide'>('login');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  useEffect(() => {
    // Verificar si el usuario está autenticado al cargar la aplicación
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');
    
    if (token && usuario) {
      setIsAuthenticated(true);
      // Si está autenticado, ir a Home
      setCurrentView('home');
      window.history.pushState(null, '', '/Home');
    } else {
      // Si no está autenticado, ir a Login
      setCurrentView('login');
      window.history.pushState(null, '', '/Login');
    }
    
    setLoading(false);
  }, []);

  // Función para manejar el login exitoso
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentView('home');
    window.history.pushState(null, '', '/Home');
  };

  // Función para manejar el logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setIsAuthenticated(false);
    setCurrentView('login');
    window.history.pushState(null, '', '/Login');
  };

  // Función para navegar al ejercicio
  const handleNavigateToExercise = (exercise?: any) => {
    if (exercise) {
      setSelectedExercise(exercise);
    }
    setCurrentView('exercise');
  };

  // Función para volver al dashboard
  const handleBackToDashboard = () => {
    setCurrentView('home');
    window.history.pushState(null, '', '/Home');
  };

  // Función para navegar a la guía de Python
  const handleNavigateToPythonGuide = () => {
    setCurrentView('python-guide');
    window.history.pushState(null, '', '/python-guide');
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
      {currentView === 'login' ? (
        <LoginApp onLoginSuccess={handleLoginSuccess} />
      ) : currentView === 'home' ? (
        <Dashboard 
          onLogout={handleLogout} 
          onNavigateToExercise={handleNavigateToExercise}
          onNavigateToPythonGuide={handleNavigateToPythonGuide}
        />
      ) : currentView === 'exercise' ? (
        <Exercise 
          onBackToDashboard={handleBackToDashboard} 
          exerciseData={selectedExercise}
        />
      ) : (
        <PythonGuide onBackToDashboard={handleBackToDashboard} />
      )}
    </>
  );
};

export default Router;