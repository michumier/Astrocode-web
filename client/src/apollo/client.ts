import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Crear el enlace HTTP
const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

// Crear el enlace de autenticación
const authLink = setContext((_, { headers }) => {
  // Obtener el token del localStorage
  const token = localStorage.getItem('token');
  
  // Retornar las cabeceras con el token
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

// Configurar Apollo Client con autenticación
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;