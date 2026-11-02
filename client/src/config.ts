// URL de la API GraphQL: la define REACT_APP_API_URL al compilar (docker-compose.yml en local, el proyecto de Vercel en la nube)
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/graphql';
