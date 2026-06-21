FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY database ./database

CMD ["npm", "run", "db:migrate"]