import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { gql, useQuery, useApolloClient } from '@apollo/client';
import LoginApp from './views/login/App';
import Dashboard from './views/dashboard/Dashboard';
import PythonGuide from './views/python-guide/PythonGuide';
import Profile from './views/profile/Profile';
import FullRanking from './views/ranking/FullRanking';
import { GET_TAREA, mapTareaToExercise } from './utils/tareas';
import { esSimulacion } from './components/visor-reto/etiquetas';

// Carga diferida: el editor (CodeMirror) y el panel de admin solo se descargan cuando se usan
const Exercise = lazy(() => import('./views/exercises/Exercise'));
const VistaReto = lazy(() => import('./views/reto/VistaReto'));
const AdminPanel = lazy(() => import('./views/admin/AdminPanel'));

const GET_ROL = gql`
  query RolActual {
    me {
      id
      rol
    }
  }
`;

// Comprobación local del token (la validación real la hace el servidor)
const tokenValido = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token || !localStorage.getItem('usuario')) return false;
  try {
    const partes = token.split('.');
    if (partes.length !== 3) return false;
    const datos = JSON.parse(atob(partes[1]));
    return !!datos.exp && datos.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
};

const borrarSesion = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
};

const Pantalla: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    height: '100vh',
    background: 'linear-gradient(135deg, #0c1445 0%, #1a237e 50%, #283593 100%)',
    color: 'white',
    fontSize: '1.3rem',
    textAlign: 'center',
    padding: '0 16px'
  }}>
    {children}
  </div>
);

// Rutas que exigen sesión (y opcionalmente un rol)
const RutaProtegida: React.FC<{ autenticado: boolean; roles?: string[]; children: React.ReactElement }> = ({ autenticado, roles, children }) => {
  const location = useLocation();
  const { data, loading } = useQuery(GET_ROL, { skip: !autenticado || !roles, fetchPolicy: 'cache-first' });

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }
  if (roles) {
    if (loading) return <Pantalla>Cargando...</Pantalla>;
    if (!roles.includes(data?.me?.rol)) return <Navigate to="/" replace />;
  }
  return children;
};

// /ejercicio/:id → usa el ejercicio que viene del dashboard o lo pide a la API (recarga / enlace directo)
const RutaEjercicio: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const desdeDashboard = (location.state as any)?.exercise;
  const usarEstado = desdeDashboard && String(desdeDashboard.id) === String(id);
  const { data, loading, error } = useQuery(GET_TAREA, { variables: { id }, skip: usarEstado });

  const volver = () => navigate('/');

  if (usarEstado) {
    return esSimulacion(desdeDashboard.tipo)
      ? <VistaReto key={id} tareaId={String(id)} onBack={volver} />
      : <Exercise key={id} onBackToDashboard={volver} exerciseData={desdeDashboard} />;
  }
  if (loading) return <Pantalla>Cargando ejercicio...</Pantalla>;
  if (error || !data?.tarea) {
    const bloqueado = error?.graphQLErrors?.some((e) => e.extensions?.code === 'FORBIDDEN');
    return (
      <Pantalla>
        <p>
          {bloqueado
            ? '🔒 Este sabotaje se desbloquea al completar el ejercicio original.'
            : 'No se ha encontrado este ejercicio.'}
        </p>
        <button onClick={volver} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
          Volver al inicio
        </button>
      </Pantalla>
    );
  }
  if (esSimulacion(data.tarea.tipo)) return <VistaReto key={id} tareaId={String(id)} onBack={volver} />;
  return <Exercise key={id} onBackToDashboard={volver} exerciseData={mapTareaToExercise(data.tarea)} />;
};

const Rutas: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [autenticado, setAutenticado] = useState(() => {
    const ok = tokenValido();
    if (!ok) borrarSesion();
    return ok;
  });

  // Al marcar la sesión, la ruta /login redirige sola a la página que se pidió (o a /)
  const handleLoginSuccess = () => setAutenticado(true);
  const destinoTrasLogin = (location.state as any)?.desde || '/';

  const apollo = useApolloClient();

  const handleLogout = () => {
    borrarSesion();
    // Que el siguiente usuario no vea datos (rol, puntos...) en caché del anterior
    apollo.clearStore();
    setAutenticado(false);
    navigate('/login', { replace: true });
  };

  const protegida = (elemento: React.ReactElement, roles?: string[]) => (
    <RutaProtegida autenticado={autenticado} roles={roles}>{elemento}</RutaProtegida>
  );

  return (
    <Suspense fallback={<Pantalla>Cargando...</Pantalla>}>
    <Routes>
      <Route
        path="/login"
        element={autenticado ? <Navigate to={destinoTrasLogin} replace /> : <LoginApp onLoginSuccess={handleLoginSuccess} />}
      />
      <Route
        path="/"
        element={protegida(
          <Dashboard
            onLogout={handleLogout}
            onNavigateToExercise={(ejercicio?: any) => {
              if (ejercicio?.id) navigate(`/ejercicio/${ejercicio.id}`, { state: { exercise: ejercicio } });
            }}
            onNavigateToPythonGuide={() => navigate('/guia')}
            onNavigateToProfile={() => navigate('/perfil')}
          />
        )}
      />
      <Route path="/ejercicio/:id" element={protegida(<RutaEjercicio />)} />
      <Route path="/guia" element={protegida(<PythonGuide onBackToDashboard={() => navigate('/')} />)} />
      <Route path="/ranking" element={protegida(<FullRanking onBack={() => navigate('/')} />)} />
      <Route
        path="/perfil"
        element={protegida(<Profile onBackToDashboard={() => navigate('/')} onNavigateToAdmin={() => navigate('/admin')} />)}
      />
      <Route path="/admin" element={protegida(<AdminPanel onBack={() => navigate('/perfil')} />, ['admin'])} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
};

const Router: React.FC = () => (
  <BrowserRouter>
    <Rutas />
  </BrowserRouter>
);

export default Router;
