FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Exponer el puerto 3000 que usa React por defecto
EXPOSE 3000

# Servidor de desarrollo con recarga automática (docker-compose monta src/ y public/)
CMD ["npm", "start"]
