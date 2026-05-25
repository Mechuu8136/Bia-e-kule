# 1. Wybór obrazu bazowego
FROM node:20-alpine

# 2. Ustawienie katalogu roboczego wewnątrz kontenera
WORKDIR /app

# 3. Kopiowanie plików zależności i ich instalacja
COPY package*.json ./
RUN npm install

# 4. Kopiowanie pozostałego kodu źródłowego
COPY . .

# 5. Informacja, na jakim porcie działa aplikacja
EXPOSE 5000

# 6. Komenda uruchamiająca aplikację w trybie deweloperskim
CMD ["npm", "run", "dev"]