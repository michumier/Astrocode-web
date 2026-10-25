import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { API_URL } from '../config';

// Crear el enlace HTTP
const httpLink = createHttpLink({
  uri: API_URL,
});

// Crear el enlace de autenticación
const authLink = setContext((_operation, { headers }) => {
  // Obtener el token del localStorage en el momento de la solicitud
  const token = localStorage.getItem('token');
  if (!token) {
    return { headers };
  }

  try {
    // Si el token ha caducado, borrarlo (el servidor hace la validación real)
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    if (tokenData.exp && tokenData.exp <= Math.floor(Date.now() / 1000)) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      return { headers };
    }
  } catch {
    // Token malformado
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    return { headers };
  }

  return {
    headers: {
      ...headers,
      authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    },
  };
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