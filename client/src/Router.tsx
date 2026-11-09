import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { gql, useQuery, useApolloClient } from '@apollo/client';
import Acceso from './views/acceso/Acceso';
import Dashboard from './views/dashboard/Dashboard';
import { GET_TAREA, mapTareaToExercise } from './utils/tareas';
import { esSimulacion } from './components/visor-reto/etiquetas';
import { Lock } from 'lucide-react';
import { Boton } from './components/ui';

// Carga diferida: el editor (CodeMirror) y el panel de admin solo se descargan cuando se usan
const Exercise = lazy(() => import('./views/exercises/Exercise'));
const VistaReto = lazy(() => import('./views/reto/VistaReto'));
const AdminPanel = lazy(() => import('./views/admin/AdminPanel'));
// Páginas secundarias: fuera del primer paquete, que solo necesita el acceso y el mapa
const Biblioteca = lazy(() => import('./views/biblioteca/Biblioteca'));
const Perfil = lazy(() => import('./views/profile/Perfil'));
const Ranking = lazy(() => import('./views/ranking/Ranking'));
const VistaLeccion = lazy(() => import('./views/leccion/VistaLeccion'));
// Muestrario del sistema de diseño de la fase 6: solo en desarrollo
const GuiaDiseno = process.env.NODE_ENV !== 'production' ? lazy(() => import('./views/diseno/GuiaDiseno')) : null;

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
    minHeight: '100vh',
    background: 'var(--ac-noche)',
    color: 'var(--ac-texto)',
    fontFamily: 'var(--ac-ui)',
    fontSize: '1.15rem',
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
    if (loading) return <Pantalla>Cargando…</Pantalla>;
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
  if (loading) return <Pantalla>Cargando ejercicio…</Pantalla>;
  if (error || !data?.tarea) {
    // Candado de la ruta o de un sabotaje: la API dice el motivo («Completa antes los pasos anteriores de…»)
    const bloqueo = error?.graphQLErrors?.find((e) => e.extensions?.code === 'FORBIDDEN');
    return (
      <Pantalla>
        {bloqueo && <Lock size={32} aria-hidden="true" style={{ color: 'var(--ac-oro)' }} />}
        <p style={{ margin: 0, maxWidth: '36ch' }}>
          {bloqueo ? `${bloqueo.message}.` : 'No se ha encontrado este ejercicio.'}
        </p>
        <Boton variante="primario" onClick={volver}>Volver al mapa</Boton>
      </Pantalla>
    );
  }
  if (esSimulacion(data.tarea.tipo)) return <VistaReto key={id} tareaId={String(id)} onBack={volver} />;
  return <Exercise key={id} onBackToDashboard={volver} exerciseData={mapTareaToExercise(data.tarea)} />;
};

// /leccion/:id → la lección; «Siguiente» lleva al paso que viene en la ruta (lección o ejercicio)
const RutaLeccion: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const alSiguiente = (paso: { tipo: string; id: string } | null) => {
    if (!paso) navigate('/');
    else navigate(paso.tipo === 'leccion' ? `/leccion/${paso.id}` : `/ejercicio/${paso.id}`);
  };
  return <VistaLeccion key={id} leccionId={String(id)} onLogout={onLogout} alSiguiente={alSiguiente} />;
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
    <Suspense fallback={<Pantalla>Cargando…</Pantalla>}>
    <Routes>
      <Route
        path="/login"
        element={autenticado ? <Navigate to={destinoTrasLogin} replace /> : <Acceso onLoginSuccess={handleLoginSuccess} />}
      />
      <Route
        path="/"
        element={protegida(
          <Dashboard
            onLogout={handleLogout}
            onNavigateToExercise={(ejercicio?: any) => {
              if (ejercicio?.tipo === 'leccion') navigate(`/leccion/${ejercicio.leccionId}`);
              else if (ejercicio?.id) navigate(`/ejercicio/${ejercicio.id}`, { state: { exercise: ejercicio } });
            }}
            onNavigateToPythonGuide={() => navigate('/biblioteca')}
            onNavigateToProfile={() => navigate('/perfil')}
          />
        )}
      />
      <Route path="/ejercicio/:id" element={protegida(<RutaEjercicio />)} />
      <Route path="/leccion/:id" element={protegida(<RutaLeccion onLogout={handleLogout} />)} />
      <Route path="/biblioteca" element={protegida(<Biblioteca onLogout={handleLogout} />)} />
      {/* La Guía de Python pasó a ser la Biblioteca (fase 14): los enlaces antiguos siguen funcionando */}
      <Route path="/guia" element={<Navigate to="/biblioteca" replace />} />
      <Route path="/ranking" element={protegida(<Ranking onLogout={handleLogout} />)} />
      <Route path="/perfil" element={protegida(<Perfil onLogout={handleLogout} />)} />
      <Route path="/admin" element={protegida(<AdminPanel onLogout={handleLogout} />, ['admin'])} />
      {GuiaDiseno && <Route path="/diseno" element={<GuiaDiseno />} />}
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
