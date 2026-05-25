# 1. Obraz bazowy
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Uruchomienie lokalnego serwera deweloperskiego (np. Vite lub CRA)
CMD ["npm", "run", "dev"]