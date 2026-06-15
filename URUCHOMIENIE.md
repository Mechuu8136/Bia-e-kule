# EnergyCity - Instrukcje Uruchomienia

## 1. Uruchomić bazę danych (PostgreSQL)

```bash
docker-compose up -d postgres_db
```

Czekaj ~10 sekund aby baza się uruchomiła.

## 2. Uruchomić Backend (NestJS)

```bash
cd backend
npm install  # jeśli nie zostało zainstalowane
npm run start:dev
```

Backend będzie dostępny na: `http://localhost:5000`

## 3. Uruchomić Frontend (React)

W nowym terminalu:

```bash
cd frontend
npm install  # jeśli nie zostało zainstalowane
npm start
```

Frontend będzie dostępny na: `http://localhost:3000`

## 4. Logowanie - Testowe Konta

Po otwarciu aplikacji widoczny jest **panel publiczny gościa** (aktualności, jakość powietrza, raporty ESG).
Kliknij **„Zaloguj się”** w prawym górnym rogu, aby przejść do panelu użytkownika.

### Administrator (Urzędnik)
- Email: `admin@example.com`
- Hasło: `password`
- **Uprawnienia**: Widzi wszystko, może tworzyć liczniki, panele i raporty

### Mieszkaniec
- Email: `mieszkaniec@example.com`
- Hasło: `password`
- **Uprawnienia**: Wybiera ulubione budynki, widzi trendy miesięczne (bez liczników)

### Dyrektor Szkoły
- Email: `dyrektor@example.com`
- Hasło: `password`
- **Uprawnienia**: Widzi tylko swoje budynki

## 5. Funkcje do Przetestowania

### 🌐 Panel gościa (bez logowania)
- [ ] Otworzyć aplikację — widoczny panel publiczny
- [ ] Przeczytać aktualności gminy
- [ ] Sprawdzić jakość powietrza (PM2.5, PM10, wykres 7 dni)
- [ ] Pobrać publiczny raport ESG (PDF)
- [ ] Kliknąć „Zaloguj się” i zalogować się jako użytkownik

### 📊 Monitor Zużycia
- [ ] Zmienić budynek w selektorze
- [ ] Sprawdzić wykresy dla prądu, wody, ciepła
- [ ] Przełączyć między "30 dni" a "Rok"

### ☀️ Dashboard OZE
- [ ] Przeglądać panele słoneczne
- [ ] Sprawdzić produkcję energii na wykresach
- [ ] Zobaczyć statystyki (liczba paneli, całkowita moc)

### 📊 Raporty ESG
- [ ] Wybrać kartę "Budynki" lub "Gmina"
- [ ] Przeglądać istniejące raporty redukcji CO2
- [ ] (Jako admin) Kliknąć "+ Nowy raport" i dodać raport
- [ ] Sprawdzić statystyki redukcji CO2

### 👥 Zarządzanie użytkownikami (tylko urzędnik)
- [ ] Zalogować się jako `admin@example.com`
- [ ] Otworzyć kartę "Użytkownicy" w nawigacji
- [ ] Kliknąć "+ Nowy użytkownik" i utworzyć konto dyrektora
- [ ] Przypisać dyrektorowi co najmniej jeden budynek
- [ ] Edytować przypisanie budynków istniejącemu użytkownikowi
- [ ] Wylogować się i zalogować nowym kontem — sprawdzić ograniczony widok budynków

## 6. Dodawanie Testowych Danych

Aby dodać testowych użytkowników, liczniki, panele itd.:

- **Panel UI (zalecane):** zaloguj się jako urzędnik → zakładka **Użytkownicy**
- **API:** użyj curl/Postman (przykłady poniżej)
- **Auto-seed:** przy pierwszym uruchomieniu backend tworzy dane demo (buildings, liczniki, panele)

### Przykład: Dodanie nowego użytkownika (API)

```bash
# Zaloguj się jako urzędnik i pobierz token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'

# Utwórz dyrektora z przypisaniem budynku
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "dyrektor.szpital@example.com",
    "password": "haslo123",
    "role": "dyrektor",
    "building_ids": ["BUILDING_ID"]
  }'

# Lista użytkowników (tylko urzędnik)
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Aktualizacja przypisania budynków
curl -X PATCH http://localhost:5000/api/users/USER_ID/buildings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "building_ids": ["BUILDING_ID_1", "BUILDING_ID_2"]
  }'
```

### Przykład: Dodanie licznika (jako admin)

```bash
# Najpierw zaloguj się i pobierz token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'

# Następnie dodaj licznik
curl -X POST http://localhost:5000/api/meters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "building_id": "BUILDING_ID",
    "type": "prad",
    "serial_number": "12345",
    "unit": "kWh"
  }'
```

## 7. Dostępność (WCAG 2.1 AA)

Aplikacja obsługuje:
- ✅ Nawigacja za pomocą klawiatury (Tab, Enter)
- ✅ Focus indicators (outline 3px)
- ✅ Kontrast 4.5:1
- ✅ ARIA labels
- ✅ Tryb ciemny (`prefers-color-scheme: dark`)
- ✅ Wysoki kontrast (`prefers-contrast: more`)
- ✅ Redukcja animacji (`prefers-reduced-motion: reduce`)

## 8. Rozwiązywanie Problemów

### Backend się nie uruchamia
- Sprawdzić czy baza danych jest dostępna: `docker-compose ps`
- Sprawdzić .env - czy DATABASE_URL, JWT_SECRET i PORT są ustawione
- Sprawdzić czy port 5000 nie jest zajęty

### Frontend się nie ładuje
- Sprawdzić czy backend jest dostępny na http://localhost:5000
- Sprawdzić czy REACT_APP_API_URL w .env frontendu jest ustawiony na http://localhost:5000/api
- Wyczyscić cache przeglądarki (Ctrl+Shift+Delete)

### Brak danych w aplikacji
- Logowanie działa - sprawdzić czy pojawia się rola w navbar
- Jeśli brak liczników/paneli - dodać je poprzez API (patrz punkt 6)
- Sprawdzić czy baza danych ma dane: `docker exec energycity_db psql -U admin -d energycity_metrics -c "SELECT * FROM meters;"`

## 9. API Documentation

Swagger dostępny na: `http://localhost:5000/api/docs`

## 10. Zatrzymanie aplikacji

```bash
# Backend - Ctrl+C w terminalu
# Frontend - Ctrl+C w terminalu
# Baza danych
docker-compose down
```
