import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Crear el enlace HTTP
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

// Crear el enlace de autenticación
const authLink = setContext((operation, { headers }) => {
  console.log(`Apollo Client: Preparando solicitud para operación: ${operation.operationName}`);
  
  // Obtener el token del localStorage en el momento de la solicitud
  const token = localStorage.getItem('token');
  
  // Si no hay token, retornar las cabeceras sin modificar
  if (!token) {
    console.warn(`Apollo Client: No hay token de autenticación disponible para la operación ${operation.operationName}`);
    return { headers };
  }
  
  try {
    // Decodificar el token para verificar si ha expirado
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const timeToExpiration = tokenData.exp - currentTime;
    
    console.log(`Apollo Client: Verificando token para operación ${operation.operationName}:`);
    console.log(`- Tiempo actual: ${new Date(currentTime * 1000).toLocaleString()}`);
    console.log(`- Token expira: ${new Date(tokenData.exp * 1000).toLocaleString()}`);
    console.log(`- Diferencia: ${timeToExpiration} segundos (${(timeToExpiration / 60).toFixed(2)} minutos)`);
    console.log(`- Tiempo a expiración en minutos: ${(timeToExpiration / 60).toFixed(2)}`);
    console.log(`- Payload del token:`, JSON.stringify(tokenData, null, 2));
    console.log(`- Valor del token: ${token ? token.substring(0, 20) + '...' : 'No presente'}`);
    
    if (tokenData.exp && tokenData.exp <= currentTime) {
      // Token expirado, eliminarlo
      console.warn(`Apollo Client: Token EXPIRADO para operación ${operation.operationName}, eliminando de localStorage`);
      console.warn(`- Tiempo expiración: ${tokenData.exp}, Tiempo actual: ${currentTime}, Diferencia: ${tokenData.exp - currentTime}`);
      console.warn(`- Tiempo expirado hace ${Math.abs(timeToExpiration)} segundos (${Math.abs(timeToExpiration / 60).toFixed(2)} minutos)`);
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      console.warn(`Apollo Client: Token expirado eliminado del localStorage para operación ${operation.operationName}`);
      return { headers };
    } else {
      // Token válido, agregarlo a las cabeceras
      console.log(`Apollo Client: Token VÁLIDO para operación ${operation.operationName}`);
      console.log(`- Expira en: ${new Date(tokenData.exp * 1000).toLocaleString()} (en ${(timeToExpiration / 60).toFixed(2)} minutos)`);
      
      // Crear nuevas cabeceras con el token de autorización
      // Asegurarse de que el token se envía correctamente con el formato 'Bearer '
      const newHeaders = {
        ...headers,
        authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      };
      
      console.log(`Apollo Client: Cabeceras configuradas para ${operation.operationName}: ${Object.keys(newHeaders).join(', ')}`);
      console.log(`Apollo Client: Authorization header presente: ${newHeaders.authorization ? 'Sí' : 'No'}`);
      console.log(`Apollo Client: Valor del Authorization header: ${newHeaders.authorization ? newHeaders.authorization.substring(0, 20) + '...' : 'No presente'}`);
      
      return { headers: newHeaders };
    }
  } catch (error) {
    console.error(`Apollo Client: Error al verificar el token en authLink para operación ${operation.operationName}:`, error);
    console.error(`Apollo Client: Token inválido o malformado:`, token);
    console.error(`Apollo Client: Se eliminará el token inválido del localStorage`);
    // Si hay un error al verificar el token, eliminarlo
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    console.error(`Apollo Client: Token inválido eliminado del localStorage para operación ${operation.operationName}`);
    return { headers };
  }
});

// Configurar Apollo Client con autenticación
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          tareasCompletadas: {
            merge(existing, incoming) {
              return incoming; // Siempre usar los datos más recientes
            }
          }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only', // No usar caché para consultas
      nextFetchPolicy: 'cache-first' // Usar caché después de la primera consulta
    },
    query: {
      fetchPolicy: 'network-only', // No usar caché para consultas
      errorPolicy: 'all'
    }
  }
});

export default client;