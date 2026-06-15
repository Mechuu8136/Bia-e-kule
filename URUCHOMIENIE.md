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

## 4. Pierwsza konfiguracja (white-label)

Aplikacja startuje jako **czysta karta** — bez wbudowanych danych gminy.

1. Otwórz `http://localhost:3000`
2. Uzupełnij **kreator konfiguracji**: nazwa gminy, konto administratora
3. Zapisz wyświetlony **klucz API integracji** (nie będzie ponownie widoczny)
4. Wejdź do panelu administratora

Dane pomiarowe (liczniki, OZE, jakość powietrza) **nie są seedowane** w backendzie.
Dostarczasz je przez API integracyjne lub symulator testowy (patrz sekcja 6).

### Zarządzanie użytkownikami

Po konfiguracji tworzysz konta dyrektorów i mieszkańców w panelu **Użytkownicy**.
Konta testowe (`admin@example.com` itd.) **nie istnieją domyślnie**.

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
- [ ] (Jako admin) Kliknąć "+ Nowy raport" i dodać raport gminy z opcją „Opublikuj na panelu gościa"
- [ ] Wylogować się — sprawdzić, czy publiczny raport widać na panelu gościa
- [ ] (Jako admin) Przełączyć widoczność istniejącego raportu gminy (publiczny / wewnętrzny)
- [ ] Sprawdzić statystyki redukcji CO2

### 👥 Zarządzanie użytkownikami (tylko urzędnik)
- [ ] Zalogować się jako `admin@example.com`
- [ ] Otworzyć kartę "Użytkownicy" w nawigacji
- [ ] Kliknąć "+ Nowy użytkownik" i utworzyć konto dyrektora
- [ ] Przypisać dyrektorowi co najmniej jeden budynek
- [ ] Edytować przypisanie budynków istniejącemu użytkownikowi
- [ ] Wylogować się i zalogować nowym kontem — sprawdzić ograniczony widok budynków

### 📢 Aktualności (tylko urzędnik)
- [ ] Otworzyć kartę "Aktualności" w nawigacji
- [ ] Dodać nową aktualność z opcją publikacji
- [ ] Wylogować się — sprawdzić, czy aktualność jest na panelu gościa
- [ ] Zalogować się ponownie i usunąć testową aktualność

### 🔑 Klucze API (tylko urzędnik)
- [ ] Otworzyć kartę "Klucze API"
- [ ] Utworzyć klucz o zakresie "Cała gmina" — skopiować wyświetlony klucz
- [ ] Sprawdzić listę kluczy (prefiks, data utworzenia)
- [ ] (Opcjonalnie) Przetestować klucz symulatorem `tools/biskupice-simulator`
- [ ] Usunąć testowy klucz

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

### Integracja zewnętrzna (API Keys + dwukierunkowa wymiana)

Klucz API tworzysz w kreatorze pierwszego uruchomienia lub w panelu **Klucze API**.

**Zapis (ingestion):**
- `POST /api/external/provision` — budynki, liczniki, panele PV, **użytkownicy** (dyrektor, mieszkaniec)
- `POST /api/external/meter-readings`
- `POST /api/external/solar-production`
- `POST /api/external/air-quality`
- `POST /api/external/announcements`

**Odczyt (sync):**
- `GET /api/external/status`
- `GET /api/external/buildings`
- `GET /api/external/meters`
- `GET /api/external/users`

```bash
# Utwórz klucz API (jako urzędnik) — jeśli potrzebujesz dodatkowego
curl -X POST http://localhost:5000/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "System miejski",
    "scope": "organization"
  }'
```

### Symulator Gminy Biskupice (zalecane do testów)

Niezależne narzędzie — symuluje zewnętrzny system gminy. **Nie zapisuje nic bezpośrednio do bazy.**

```bash
cd tools/biskupice-simulator
set API_KEY=ec_...          # klucz z kreatora konfiguracji
set API_URL=http://localhost:5000/api
npm run seed                # provision + ~30 dni danych + konta testowe
npm run sync                # odczyt stanu z aplikacji
```

Konta testowe tworzone przez symulator (hasło: `password`):
- `dyrektor@biskupice.test` — dyrektor szkoły
- `mieszkaniec@biskupice.test` — mieszkaniec z ulubionymi budynkami
```

Szczegóły: `tools/biskupice-simulator/README.md`

### Starszy symulator (`tools/data-simulator`)

Wymaga wcześniej zarejestrowanych liczników w bazie. Do nowych instalacji używaj **biskupice-simulator**.

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
- Po pierwszej konfiguracji baza jest pusta — uruchom `tools/biskupice-simulator` (sekcja 6)
- Utwórz użytkowników (dyrektor, mieszkaniec) w panelu **Użytkownicy**
- Sprawdź klucz API w panelu **Klucze API**

## 9. API Documentation

Swagger (OpenAPI) dostępny na: `http://localhost:5000/api/docs`

- Autentykacja użytkowników: **Bearer JWT** (przycisk Authorize)
- Integracja zewnętrzna: **api-key** → nagłówek `X-API-KEY`

## 10. Zatrzymanie aplikacji

```bash
# Backend - Ctrl+C w terminalu
# Frontend - Ctrl+C w terminalu
# Baza danych
docker-compose down
```
