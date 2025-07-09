import React, { useState, useEffect } from 'react';
import LoginApp from './views/login/App';
import Dashboard from './views/dashboard/Dashboard';
import Exercise from './views/exercises/Exercise';
import PythonGuide from './views/python-guide/PythonGuide';
import Profile from './views/profile/Profile';

const Router: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'login' | 'home' | 'exercise' | 'python-guide' | 'profile'>('login');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  useEffect(() => {
    // Verificar si el usuario está autenticado al cargar la aplicación
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');
    
    console.log('Router: Verificando autenticación...');
    console.log('Router: Token presente:', token ? 'Sí' : 'No');
    console.log('Router: Usuario presente:', usuario ? 'Sí' : 'No');
    
    if (token && usuario) {
      // Verificar que el token sea válido
      try {
        // Decodificar el token para verificar si ha expirado
        // Esto es una verificación básica, el servidor hará la validación completa
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Formato de token inválido');
        }
        
        const tokenData = JSON.parse(atob(tokenParts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const timeToExpiration = tokenData.exp - currentTime;
        
        console.log('Router: Verificando token:');
        console.log(`Router: Tiempo actual: ${new Date(currentTime * 1000).toLocaleString()}`);
        console.log(`Router: Token expira: ${new Date(tokenData.exp * 1000).toLocaleString()}`);
        console.log(`Router: Diferencia: ${timeToExpiration} segundos (${(timeToExpiration / 60).toFixed(2)} minutos)`);
        console.log(`Router: Token payload:`, JSON.stringify(tokenData, null, 2));
        console.log(`Router: Valor del token: ${token ? token.substring(0, 20) + '...' : 'No presente'}`);
        
        if (tokenData.exp && tokenData.exp > currentTime) {
          // Token válido
          console.log('Router: Token VÁLIDO, autenticando usuario');
          console.log(`Router: Token expira en: ${new Date(tokenData.exp * 1000).toLocaleString()} (en ${(timeToExpiration / 60).toFixed(2)} minutos)`);
          setIsAuthenticated(true);
          // Si está autenticado, ir a Home
          setCurrentView('home');
          window.history.pushState(null, '', '/Home');
        } else {
          // Token expirado
          console.warn('Router: Token EXPIRADO, redirigiendo a login');
          console.warn(`Router: Tiempo expiración: ${tokenData.exp}, Tiempo actual: ${currentTime}, Diferencia: ${tokenData.exp - currentTime}`);
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          setIsAuthenticated(false);
          setCurrentView('login');
          window.history.pushState(null, '', '/Login');
        }
      } catch (error) {
        console.error('Router: Error al verificar el token:', error);
        console.error('Router: Token inválido o malformado:', token);
        // Si hay un error al verificar el token, ir a Login
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setIsAuthenticated(false);
        setCurrentView('login');
        window.history.pushState(null, '', '/Login');
      }
    } else {
      // Si no está autenticado, ir a Login
      if (!token) console.warn('Router: No hay token en localStorage');
      if (!usuario) console.warn('Router: No hay usuario en localStorage');
      console.log('Router: No hay autenticación válida, redirigiendo a login');
      setIsAuthenticated(false);
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

  // Función para navegar al perfil
  const handleNavigateToProfile = () => {
    setCurrentView('profile');
    window.history.pushState(null, '', '/profile');
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
          onNavigateToProfile={handleNavigateToProfile}
        />
      ) : currentView === 'exercise' ? (
        <Exercise 
          onBackToDashboard={handleBackToDashboard} 
          exerciseData={selectedExercise}
        />
      ) : currentView === 'profile' ? (
        <Profile onBackToDashboard={handleBackToDashboard} />
      ) : (
        <PythonGuide onBackToDashboard={handleBackToDashboard} />
      )}
    </>
  );
};

export default Router;