import React, { useState, useEffect } from 'react';
import { gql, useQuery, ApolloClient, InMemoryCache } from '@apollo/client';
import client from '../../apollo/client';
import './Dashboard.css';
import FullRanking from '../ranking/FullRanking';

// GraphQL queries
const GET_COMPLETED_TASKS = gql`
  query GetCompletedTasks {
    tareasCompletadas {
      id
    }
  }
`;

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    me {
      puntos
    }
  }
`;

const GET_TOP_USERS = gql`
  query GetTopUsers {
    usuarios {
      id
      nombre_usuario
      puntos
      nombre_completo
    }
  }
`;

const GET_TASKS_BY_LEVEL = gql`
  query TareasPorNivel($nivelId: ID!) {
    tareasPorNivel(nivelId: $nivelId) {
      id
      titulo
      descripcion
      puntosBase
      codigoBase
      resultadoEsperado
      categoria {
        nombre
      }
      nivel {
        nombre
      }
    }
  }
`;

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
  onNavigateToExercise?: (exercise?: any) => void;
  onNavigateToPythonGuide?: () => void;
  onNavigateToProfile?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onNavigateToExercise, onNavigateToPythonGuide, onNavigateToProfile }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullRanking, setShowFullRanking] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [showExercisePanel, setShowExercisePanel] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  // Usar Apollo Client para obtener tareas completadas
  const { loading: loadingCompletedTasks, data: completedTasksData, refetch: refetchCompletedTasks } = useQuery(GET_COMPLETED_TASKS, {
    fetchPolicy: 'network-only', // Siempre obtener datos frescos del servidor
    errorPolicy: 'all', // Manejar errores sin fallar completamente
    context: () => {
      // Obtener el token actual en el momento de la consulta
      const token = localStorage.getItem('token');
      
      // Verificar el token antes de la consulta
      if (!token) {
        console.warn('GET_COMPLETED_TASKS: No hay token de autenticación');
        // Si no hay token, no tiene sentido hacer la consulta
        if (onLogout) {
          console.warn('GET_COMPLETED_TASKS: No hay token, redirigiendo a login');
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            onLogout();
          }, 100);
        }
        return { headers: {} };
      }
      
      try {
        // Verificar que el token sea válido
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Formato de token inválido');
        }
        
        const tokenData = JSON.parse(atob(tokenParts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const timeToExpiration = tokenData.exp - currentTime;
        
        console.log('GET_COMPLETED_TASKS: Verificando token:');
        console.log(`- Tiempo actual: ${new Date(currentTime * 1000).toLocaleString()}`);
        console.log(`- Token expira: ${new Date(tokenData.exp * 1000).toLocaleString()}`);
        console.log(`- Diferencia: ${timeToExpiration} segundos (${(timeToExpiration / 60).toFixed(2)} minutos)`);
        console.log(`- Tiempo a expiración en minutos: ${(timeToExpiration / 60).toFixed(2)}`);
        console.log(`- Payload del token:`, JSON.stringify(tokenData, null, 2));
        console.log(`- Valor del token: ${token ? token.substring(0, 20) + '...' : 'No presente'}`);
        
        if (tokenData.exp && tokenData.exp <= currentTime) {
          console.warn('GET_COMPLETED_TASKS: Token EXPIRADO, será rechazado por el servidor');
          console.warn(`- Tiempo expiración: ${tokenData.exp}, Tiempo actual: ${currentTime}, Diferencia: ${tokenData.exp - currentTime}`);
          console.warn(`- Tiempo expirado hace ${Math.abs(timeToExpiration)} segundos (${Math.abs(timeToExpiration / 60).toFixed(2)} minutos)`);
          
          // Token expirado, redirigir a login
          if (onLogout) {
            setTimeout(() => {
              localStorage.removeItem('token');
              localStorage.removeItem('usuario');
              onLogout();
            }, 100);
          }
          return { headers: {} };
        } else {
          console.log('GET_COMPLETED_TASKS: Token VÁLIDO');
          console.log(`- Expira en: ${new Date(tokenData.exp * 1000).toLocaleString()} (en ${(timeToExpiration / 60).toFixed(2)} minutos)`);
        }
      } catch (error) {
        console.error('GET_COMPLETED_TASKS: Error al verificar el token:', error);
        console.error('GET_COMPLETED_TASKS: Token inválido o malformado:', token);
        console.error('GET_COMPLETED_TASKS: Se eliminará el token inválido del localStorage');
        
        // Token inválido, redirigir a login
        if (onLogout) {
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            onLogout();
          }, 100);
        }
        return { headers: {} };
      }
      
      console.log('GET_COMPLETED_TASKS: Token usado:', token ? 'Presente' : 'Ausente');
      console.log(`GET_COMPLETED_TASKS: Valor del token: ${token ? token.substring(0, 20) + '...' : 'No presente'}`);
      
      // Asegurarse de que el token se envía correctamente en el encabezado
      // Verificar si el token ya tiene el prefijo 'Bearer '
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      console.log(`GET_COMPLETED_TASKS: Authorization header: ${authHeader.substring(0, 20)}...`);
      
      return {
        headers: {
          authorization: authHeader
        }
      };
    },
    onCompleted: (data) => {
      if (data?.tareasCompletadas) {
        const completedTaskIds = data.tareasCompletadas.map((task: any) => task.id);
        setCompletedTasks(completedTaskIds);
        console.log(`GET_COMPLETED_TASKS: Recibidas ${completedTaskIds.length} tareas completadas`);
      } else {
        console.warn('GET_COMPLETED_TASKS: No se recibieron datos de tareas completadas');
        setCompletedTasks([]);
      }
    },
    onError: (error) => {
      console.error('GET_COMPLETED_TASKS: Error:', error);
      console.error('GET_COMPLETED_TASKS: Mensaje de error:', error.message);
      // Si hay un error de autenticación, establecer una lista vacía
      setCompletedTasks([]);
      
      // Verificar si es un error de autenticación
      if (error.message.includes('autenticado') && onLogout) {
        console.warn('GET_COMPLETED_TASKS: Error de autenticación detectado, redirigiendo a login');
        // Eliminar token y usuario del localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        // Redirigir a login después de un pequeño retraso para asegurar que el localStorage se actualice
        setTimeout(() => {
          onLogout();
        }, 100);
      }
    }
  });

  // Usar Apollo Client para obtener puntos del usuario
  const { loading: loadingUserPoints, data: userPointsData, refetch: refetchUserPoints } = useQuery(GET_CURRENT_USER, {
    fetchPolicy: 'network-only', // Siempre obtener datos frescos del servidor
    errorPolicy: 'all', // Manejar errores sin fallar completamente
    context: () => {
      // Obtener el token actual en el momento de la consulta
      const token = localStorage.getItem('token');
      
      // Verificar el token antes de la consulta
      if (!token) {
        console.warn('GET_CURRENT_USER: No hay token de autenticación');
        // Si no hay token, no tiene sentido hacer la consulta
        if (onLogout) {
          console.warn('GET_CURRENT_USER: No hay token, redirigiendo a login');
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            onLogout();
          }, 100);
        }
        return { headers: {} };
      }
      
      try {
        // Verificar que el token sea válido
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Formato de token inválido');
        }
        
        const tokenData = JSON.parse(atob(tokenParts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const timeToExpiration = tokenData.exp - currentTime;
        
        console.log('GET_CURRENT_USER: Verificando token:');
        console.log(`- Tiempo actual: ${new Date(currentTime * 1000).toLocaleString()}`);
        console.log(`- Token expira: ${new Date(tokenData.exp * 1000).toLocaleString()}`);
        console.log(`- Diferencia: ${timeToExpiration} segundos (${(timeToExpiration / 60).toFixed(2)} minutos)`);
        console.log(`- Payload del token:`, JSON.stringify(tokenData, null, 2));
        
        if (tokenData.exp && tokenData.exp <= currentTime) {
          console.warn('GET_CURRENT_USER: Token EXPIRADO, será rechazado por el servidor');
          console.warn(`- Tiempo expiración: ${tokenData.exp}, Tiempo actual: ${currentTime}, Diferencia: ${tokenData.exp - currentTime}`);
          
          // Token expirado, redirigir a login
          if (onLogout) {
            setTimeout(() => {
              localStorage.removeItem('token');
              localStorage.removeItem('usuario');
              onLogout();
            }, 100);
          }
          return { headers: {} };
        } else {
          console.log('GET_CURRENT_USER: Token VÁLIDO');
          console.log(`- Expira en: ${new Date(tokenData.exp * 1000).toLocaleString()} (en ${(timeToExpiration / 60).toFixed(2)} minutos)`);
        }
      } catch (error) {
        console.error('GET_CURRENT_USER: Error al verificar el token:', error);
        console.error('GET_CURRENT_USER: Token inválido o malformado:', token);
        
        // Token inválido, redirigir a login
        if (onLogout) {
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            onLogout();
          }, 100);
        }
        return { headers: {} };
      }
      
      console.log('GET_CURRENT_USER: Token usado:', token ? 'Presente' : 'Ausente');
      console.log(`GET_CURRENT_USER: Valor del token: ${token ? token.substring(0, 20) + '...' : 'No presente'}`);
      
      // Asegurarse de que el token se envía correctamente en el encabezado
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      console.log(`GET_CURRENT_USER: Authorization header: ${authHeader.substring(0, 20)}...`);
      
      return {
        headers: {
          authorization: authHeader
        }
      };
    },
    onCompleted: (data) => {
      if (data?.me?.puntos !== undefined) {
        setUserPoints(data.me.puntos);
        console.log('GET_CURRENT_USER: Puntos del usuario:', data.me.puntos);
      } else {
        console.warn('GET_CURRENT_USER: No se recibieron datos de puntos del usuario');
        setUserPoints(0);
      }
    },
    onError: (error) => {
      console.error('GET_CURRENT_USER: Error:', error);
      console.error('GET_CURRENT_USER: Mensaje de error:', error.message);
      // Si hay un error de autenticación, establecer puntos a 0
      setUserPoints(0);
      
      // Verificar si es un error de autenticación
      if (error.message.includes('autenticado') && onLogout) {
        console.warn('GET_CURRENT_USER: Error de autenticación detectado, redirigiendo a login');
        // Eliminar token y usuario del localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        // Redirigir a login después de un pequeño retraso para asegurar que el localStorage se actualice
        setTimeout(() => {
          onLogout();
        }, 100);
      }
    }
  });

  // Usar Apollo Client para obtener los usuarios principales
  const { loading: loadingTopUsers, data: topUsersData, refetch: refetchTopUsers } = useQuery(GET_TOP_USERS, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all', // Manejar errores sin fallar completamente
    context: () => {
      // Obtener el token actual en el momento de la consulta
      const token = localStorage.getItem('token');
      
      // Verificar el token antes de la consulta
      if (!token) {
        console.warn('GET_TOP_USERS: No hay token de autenticación');
      } else {
        try {
          // Verificar que el token sea válido
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Formato de token inválido');
          }
          
          const tokenData = JSON.parse(atob(tokenParts[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const timeToExpiration = tokenData.exp - currentTime;
          
          console.log('GET_TOP_USERS: Verificando token:');
          console.log(`- Payload del token:`, JSON.stringify(tokenData, null, 2));
          
          if (tokenData.exp && tokenData.exp <= currentTime) {
            console.warn('GET_TOP_USERS: Token expirado, será rechazado por el servidor');
          } else {
            console.log('GET_TOP_USERS: Token válido, expira en:', new Date(tokenData.exp * 1000).toLocaleString());
            console.log(`- Tiempo a expiración: ${(timeToExpiration / 60).toFixed(2)} minutos`);
          }
        } catch (error) {
          console.error('GET_TOP_USERS: Error al verificar el token:', error);
        }
      }
      
      console.log('GET_TOP_USERS: Token usado:', token ? 'Presente' : 'Ausente');
      
      // Asegurarse de que el token se envía correctamente en el encabezado
      const authHeader = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';
      console.log(`GET_TOP_USERS: Authorization header: ${authHeader ? authHeader.substring(0, 20) + '...' : 'No presente'}`);
      
      return {
        headers: {
          authorization: authHeader
        }
      };
    },
    onCompleted: (data) => {
      if (data?.usuarios) {
        // Ordenar usuarios por puntuación y tomar los top 5
        const sortedUsers = [...data.usuarios]
          .sort((a: User, b: User) => b.puntos - a.puntos)
          .slice(0, 5);
        
        const formattedData = sortedUsers.map((user: User, index: number) => ({
          rank: index + 1,
          name: user.nombre_usuario,
          score: user.puntos
        }));
        
        console.log(`GET_TOP_USERS: Recibidos ${data.usuarios.length} usuarios, mostrando top 5`);
        setLeaderboardData(formattedData);
        setLoading(false);
      } else {
        console.warn('GET_TOP_USERS: No se recibieron datos de usuarios');
        setLeaderboardData([]);
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('GET_TOP_USERS: Error:', error);
      console.error('GET_TOP_USERS: Mensaje de error:', error.message);
      setError(`Error GraphQL: ${error.message || 'Error desconocido'}`);
      // Datos de fallback
      setLeaderboardData([
        { rank: 1, name: 'Williams', score: 2500 },
        { rank: 2, name: 'Johnson', score: 2300 },
        { rank: 3, name: 'Smith', score: 2100 },
        { rank: 4, name: 'Brown', score: 1900 },
        { rank: 5, name: 'Jones', score: 1700 }
      ]);
      setLoading(false);
      
      // Verificar si es un error de autenticación
      if (error.message.includes('autenticado') && onLogout) {
        console.warn('GET_TOP_USERS: Error de autenticación detectado, redirigiendo a login');
        // Eliminar token y usuario del localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        // Redirigir a login después de un pequeño retraso para asegurar que el localStorage se actualice
        setTimeout(() => {
          onLogout();
        }, 100);
      }
    }
  });

  // Ya no necesitamos useEffect para cargar datos iniciales, los hooks useQuery se encargan de eso
  
  // Actualizar datos cuando el componente se vuelve visible
  useEffect(() => {
    // Esta función se ejecutará cuando el componente se monte o cuando
    // el usuario regrese al Dashboard después de completar un ejercicio
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetchUserPoints(); // Actualizar puntos del usuario
        refetchCompletedTasks(); // Actualizar tareas completadas
        refetchTopUsers(); // Actualizar ranking de usuarios
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Limpiar el event listener cuando el componente se desmonte
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetchCompletedTasks, refetchUserPoints, refetchTopUsers]); // Añadir todos los refetch como dependencias

  // Las funciones fetchCompletedTasks, fetchUserPoints y fetchTopUsers han sido reemplazadas por hooks useQuery de Apollo Client

  const handleStartChallenge = () => {
    console.log('Starting daily challenge...');
    // TODO: Implementar lógica para obtener el desafío diario
    // Por ahora, comentamos esta funcionalidad hasta que se implemente correctamente
    console.warn('Desafío diario no implementado aún');
    // if (onNavigateToExercise) {
    //   onNavigateToExercise();
    // }
  };

  const handleViewFullRanking = () => {
    setShowFullRanking(true);
  };

  const planetRequirements = {
    'tierra': 0,     // Siempre disponible
    'marte': 500,    // Requiere 500 puntos (aproximadamente 3-5 ejercicios fáciles)
    'saturno': 1500  // Requiere 1500 puntos (aproximadamente 2-3 ejercicios difíciles + varios intermedios)
  };

  const isPlanetUnlocked = (planetName: string): boolean => {
    const requiredPoints = planetRequirements[planetName as keyof typeof planetRequirements];
    return userPoints >= requiredPoints;
  };

  const isTaskCompleted = (taskId: string): boolean => {
    return completedTasks.includes(taskId);
  };

  const handlePlanetClick = async (planetName: string) => {
    if (!isPlanetUnlocked(planetName)) {
      setShowAccessDenied(true);
      setTimeout(() => setShowAccessDenied(false), 3000);
      return;
    }

    setSelectedPlanet(planetName);
    setShowExercisePanel(true);
    setLoadingExercises(true);
    console.log(`Planeta seleccionado: ${planetName}`);
    
    try {
      const exerciseData = await getExercisesByPlanet(planetName);
      setExercises(exerciseData);
    } catch (error) {
      console.error('Error loading exercises:', error);
      setExercises([]);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleCloseExercisePanel = () => {
    setShowExercisePanel(false);
    setSelectedPlanet(null);
    setExercises([]);
    setShowExerciseDetail(false);
    setSelectedExercise(null);
  };

  // Función para obtener ejercicios por planeta usando Apollo Client
  const getExercisesByPlanet = async (planet: string) => {
    try {
      // Mapear planetas a niveles de dificultad
      const planetLevelMap: { [key: string]: number } = {
        'tierra': 1,   // Fácil
        'marte': 2,    // Intermedio
        'saturno': 3   // Difícil
      };

      const nivelId = planetLevelMap[planet];
      if (!nivelId) {
        console.error(`Nivel no encontrado para el planeta: ${planet}`);
        return [];
      }

      console.log(`getExercisesByPlanet: Iniciando obtención de ejercicios para planeta ${planet} (nivel ${nivelId})`);
      
      // Verificar el token justo antes de la consulta para asegurar que sea el más reciente
      const token = localStorage.getItem('token');
      
      // Verificar el token antes de la consulta
      if (!token) {
        console.error('getExercisesByPlanet: No hay token de autenticación');
        if (onLogout) {
          console.warn('getExercisesByPlanet: No hay token, redirigiendo a login');
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          setTimeout(() => {
            onLogout();
          }, 100);
        }
        return [];
      }
      
      try {
        // Decodificar el token para verificar si ha expirado
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const timeToExpiration = tokenData.exp - currentTime;
        
        console.log('getExercisesByPlanet: Verificando token:');
        console.log(`- Tiempo actual: ${new Date(currentTime * 1000).toLocaleString()}`);
        console.log(`- Token expira: ${new Date(tokenData.exp * 1000).toLocaleString()}`);
        console.log(`- Diferencia: ${timeToExpiration} segundos (${(timeToExpiration / 60).toFixed(2)} minutos)`);
        console.log(`- Tiempo a expiración en minutos: ${(timeToExpiration / 60).toFixed(2)}`);
        console.log(`- Payload del token:`, JSON.stringify(tokenData, null, 2));
        console.log(`- Valor del token: ${token ? token.substring(0, 20) + '...' : 'No presente'}`);
        
        if (tokenData.exp && tokenData.exp <= currentTime) {
          console.warn('getExercisesByPlanet: Token EXPIRADO, redirigiendo a login');
          console.warn(`- Tiempo expiración: ${tokenData.exp}, Tiempo actual: ${currentTime}, Diferencia: ${tokenData.exp - currentTime}`);
          console.warn(`- Tiempo expirado hace ${Math.abs(timeToExpiration)} segundos (${Math.abs(timeToExpiration / 60).toFixed(2)} minutos)`);
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          if (onLogout) {
            setTimeout(() => {
              onLogout();
            }, 100);
          }
          return [];
        } else {
          console.log(`getExercisesByPlanet: Token VÁLIDO`);
          console.log(`- Expira en: ${new Date(tokenData.exp * 1000).toLocaleString()} (en ${(timeToExpiration / 60).toFixed(2)} minutos)`);
        }
      } catch (error) {
        console.error('getExercisesByPlanet: Error al verificar el token:', error);
        console.error('getExercisesByPlanet: Token inválido o malformado:', token);
        console.error('getExercisesByPlanet: Se eliminará el token inválido del localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        if (onLogout) {
          setTimeout(() => {
            onLogout();
          }, 100);
        }
        return [];
      }

      // Usar el cliente Apollo global en lugar de crear uno nuevo
      console.log(`getExercisesByPlanet: Obteniendo ejercicios para nivel: ${nivelId}`);
      
      // Obtener el token nuevamente justo antes de la consulta
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        console.error('getExercisesByPlanet: Token no disponible al momento de la consulta');
        if (onLogout) {
          setTimeout(() => {
            onLogout();
          }, 100);
        }
        return [];
      }
      
      console.log(`getExercisesByPlanet: Token usado para GET_TASKS_BY_LEVEL: ${currentToken ? 'Presente' : 'Ausente'}`);
      console.log(`getExercisesByPlanet: Valor del token: ${currentToken ? currentToken.substring(0, 20) + '...' : 'No presente'}`);
      
      const { data } = await client.query({
        query: GET_TASKS_BY_LEVEL,
        variables: { nivelId: nivelId.toString() },
        fetchPolicy: 'network-only', // Asegurar datos frescos
        context: {
          headers: {
            authorization: `Bearer ${currentToken}`
          }
        }
      });
      
      if (!data || !data.tareasPorNivel) {
        console.error('getExercisesByPlanet: No se recibieron datos de tareas');
        return [];
      }

      // Transformar los datos para que coincidan con el formato esperado
      console.log(`getExercisesByPlanet: Recibidos ${data.tareasPorNivel.length} ejercicios`);
      
      const mappedExercises = data.tareasPorNivel.map((tarea: any) => ({
        id: tarea.id,
        title: tarea.titulo,
        difficulty: tarea.nivel?.nombre || 'Desconocido',
        points: tarea.puntosBase || tarea.puntos || 0,
        description: tarea.descripcion,
        codigoBase: tarea.codigoBase,
        resultadoEsperado: tarea.resultadoEsperado,
        categoria: tarea.categoria?.nombre || 'General'
      }));
      
      return mappedExercises;
    } catch (error: any) {
      console.error('getExercisesByPlanet: Error fetching exercises:', error);
      
      // Verificar si es un error de autenticación
      if (error.message && error.message.includes('autenticado') && onLogout) {
        console.warn('getExercisesByPlanet: Error de autenticación detectado, redirigiendo a login');
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setTimeout(() => {
          onLogout();
        }, 100);
      }
      
      return [];
    }
  };

  const handleBackFromRanking = () => {
    setShowFullRanking(false);
  };

  const handleLogout = () => {
    setMenuClosing(true);
    setTimeout(() => {
      setShowUserMenu(false);
      setMenuClosing(false);
      if (onLogout) {
        onLogout();
      }
    }, 200); // Duración de la animación
  };

  const handleGoToProfile = () => {
    setMenuClosing(true);
    setTimeout(() => {
      setShowUserMenu(false);
      setMenuClosing(false);
      if (onNavigateToProfile) {
        onNavigateToProfile();
      }
    }, 200); // Duración de la animación
  };

  const getUserInitials = () => {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      try {
        const userData = JSON.parse(usuario);
        const name = userData.nombre_completo || userData.nombre_usuario || 'Usuario';
        return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
      } catch (error) {
        return 'U';
      }
    }
    return 'U';
  };

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-avatar-container')) {
        setMenuClosing(true);
        setTimeout(() => {
          setShowUserMenu(false);
          setMenuClosing(false);
        }, 200); // Duración de la animación
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

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
          <div className="user-avatar-container">
            <div className="user-avatar" onClick={() => {
              if (showUserMenu) {
                setMenuClosing(true);
                setTimeout(() => {
                  setShowUserMenu(false);
                  setMenuClosing(false);
                }, 200); // Duración de la animación
              } else {
                setShowUserMenu(true);
              }
            }}>
              <div className="avatar-circle">
                {getUserInitials()}
              </div>
            </div>
            {showUserMenu && (
              <div className={`user-menu ${menuClosing ? 'menu-closing' : ''}`}>
                <div className="user-menu-item" onClick={handleGoToProfile}>
                  <span>👤</span>
                </div>
                <div className="user-menu-item" onClick={handleLogout}>
                  <span>🔓</span>
                </div>
              </div>
            )}
          </div>
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

        {/* Central Content */}
        <div className="central-content">
          {/* Access Denied Message */}
          {showAccessDenied && (
            <div className="access-denied-message">
              ¡Necesitas más puntos para desbloquear este planeta!
            </div>
          )}

          {/* Solar System Animation */}
          <div className="solar-system">
          {/* Sol en el centro */}
          <div className="sun"></div>
          
          {/* Tierra - Nivel Fácil */}
          <div className="orbit orbit-earth">
            <div 
              className={`planet earth ${selectedPlanet === 'tierra' ? 'selected' : ''} ${isPlanetUnlocked('tierra') ? 'unlocked' : 'locked'}`}
              onClick={() => handlePlanetClick('tierra')}
            >
              <span className="planet-label">Tierra</span>
              {!isPlanetUnlocked('tierra') && <span className="lock-icon">🔒</span>}
            </div>
          </div>
          
          {/* Marte - Nivel Intermedio */}
          <div className="orbit orbit-mars">
            <div 
              className={`planet mars ${selectedPlanet === 'marte' ? 'selected' : ''} ${isPlanetUnlocked('marte') ? 'unlocked' : 'locked'}`}
              onClick={() => handlePlanetClick('marte')}
              title={!isPlanetUnlocked('marte') ? `Requiere ${planetRequirements.marte} puntos` : ''}
            >
              <span className="planet-label">Marte</span>
              {!isPlanetUnlocked('marte') && <span className="lock-icon">🔒</span>}
              {!isPlanetUnlocked('marte') && <span className="points-required">{planetRequirements.marte}pts</span>}
            </div>
          </div>
          
          {/* Saturno - Nivel Difícil */}
          <div className="orbit orbit-saturn">
            <div 
              className={`planet saturn ${selectedPlanet === 'saturno' ? 'selected' : ''} ${isPlanetUnlocked('saturno') ? 'unlocked' : 'locked'}`}
              onClick={() => handlePlanetClick('saturno')}
              title={!isPlanetUnlocked('saturno') ? `Requiere ${planetRequirements.saturno} puntos` : ''}
            >
              <div className="saturn-rings"></div>
              <span className="planet-label">Saturno</span>
              {!isPlanetUnlocked('saturno') && <span className="lock-icon">🔒</span>}
              {!isPlanetUnlocked('saturno') && <span className="points-required">{planetRequirements.saturno}pts</span>}
            </div>
          </div>
          </div>

          {/* Planet Selection Message */}
          <div className="planet-selection-message">
            <h2>Elige tu planeta de aventura</h2>
          </div>
        </div>

        {/* Right Side Content */}
        <div className="right-side-content">
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

          {/* Python Guide */}
          <div className="python-guide-container">
            <div className="python-guide">
              <h2 className="guide-title">Guía de Python</h2>
              <p className="guide-description">Aprende los fundamentos de Python desde cero</p>
              <button 
                className="start-guide-btn"
                onClick={onNavigateToPythonGuide}
              >
                Explorar
              </button>
            </div>
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
            {!showExerciseDetail ? (
              loadingExercises ? (
                <div className="loading-exercises">Cargando ejercicios...</div>
              ) : exercises.length > 0 ? (
                exercises.map((exercise) => (
                  <div key={exercise.id} className={`exercise-item ${isTaskCompleted(exercise.id) ? 'completed' : ''}`}>
                    <div className="exercise-info">
                      <h3 className="exercise-title">{exercise.title}</h3>
                      <div className="exercise-meta">
                        <span className={`exercise-difficulty ${exercise.difficulty.toLowerCase()}`}>
                          {exercise.difficulty}
                        </span>
                        <span className="exercise-points">{exercise.points} pts</span>
                        {isTaskCompleted(exercise.id) && <span className="completed-badge">✓ Completado</span>}
                      </div>
                    </div>
                    <button 
                      className="view-exercise-btn"
                      onClick={() => {
                        setSelectedExercise(exercise);
                        setShowExerciseDetail(true);
                      }}
                    >
                      VER
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-exercises">No hay ejercicios disponibles para este nivel.</div>
              )
            ) : (
              /* Exercise Detail View */
              <div className="exercise-detail">
                <button 
                  className="back-to-list-btn"
                  onClick={() => {
                    setShowExerciseDetail(false);
                    setSelectedExercise(null);
                  }}
                >
                  ← Volver a la lista
                </button>
                {selectedExercise && (
                  <div className="exercise-detail-content">
                    <h2 className="exercise-detail-title">{selectedExercise.title}</h2>
                    <p className="exercise-detail-type">{selectedExercise.categoria}</p>
                    <div className="exercise-detail-meta">
                      <span className={`exercise-difficulty ${selectedExercise.difficulty.toLowerCase()}`}>
                        {selectedExercise.difficulty}
                      </span>
                      <span className="exercise-points">{selectedExercise.points} pts</span>
                      {isTaskCompleted(selectedExercise.id) && <span className="completed-badge">✓ Completado</span>}
                    </div>
                    <hr className="exercise-detail-separator" />
                    <div className="exercise-detail-description">
                      {selectedExercise.description || 'No hay descripción disponible para este ejercicio.'}
                    </div>
                    <button 
                      className={`start-exercise-btn ${!isPlanetUnlocked(selectedPlanet || '') ? 'disabled' : ''}`}
                      onClick={() => {
                        if (!selectedPlanet || !isPlanetUnlocked(selectedPlanet)) {
                          setShowAccessDenied(true);
                          setTimeout(() => setShowAccessDenied(false), 3000);
                          return;
                        }
                        console.log('=== DEBUG DASHBOARD ===');
                        // Debug logs removed to reduce console noise
                        console.log('=== FIN DEBUG ===');
                        if (onNavigateToExercise) {
                          onNavigateToExercise(selectedExercise);
                        }
                      }}
                      disabled={!isPlanetUnlocked(selectedPlanet || '')}
                    >
                      {!isPlanetUnlocked(selectedPlanet || '') ? 
                        `Requiere ${planetRequirements[selectedPlanet as keyof typeof planetRequirements] || 0} puntos` : 
                        isTaskCompleted(selectedExercise.id) ? 'Ver de nuevo' : 'Comenzar'
                      }
                    </button>
                  </div>
                )}
              </div>
            )}
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