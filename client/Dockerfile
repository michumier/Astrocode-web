FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Exponer el puerto 3000 que usa React por defecto
EXPOSE 3000

# Usar npm start en lugar de npm run build
CMD ["npm", "start"]