# 1. Wybieramy oficjalny, lekki obraz ze środowiskiem Node.js
FROM node:18-alpine
# 2. Tworzymy katalog, w którym będzie żyła nasza aplikacja wewnątrz kontenera
WORKDIR /app
# 3. Kopiujemy package.json i instalujemy zależności
COPY package*.json ./
RUN npm install
# 4. Kopiujemy resztę kodu źródłowego
COPY . .
# 5. Informujemy Dockera, na jakim porcie nasłuchuje aplikacja
EXPOSE 3000
# 6. Definiujemy komendę, która uruchomi się podczas startu kontenera
CMD ["npm", "start"]
