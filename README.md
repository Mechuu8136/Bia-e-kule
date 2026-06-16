# EnergyCity: Monitoring Energii i OZE

Aplikacja webowa do monitorowania zużycia mediów (prąd, woda, ciepło), produkcji energii z instalacji OZE oraz raportowania redukcji emisji CO₂ w obiektach komunalnych. Głównym aktorem systemu jest urzędnik gminny zarządzający wieloma budynkami; dyrektor placówki ma wgląd wyłącznie we własną jednostkę.

Repozytorium: [github.com/Mechuu8136/Bia-e-kule](https://github.com/Mechuu8136/Bia-e-kule)

---

## Specyfikacja projektu

### Wizja i cel

System umożliwia instytucji zarządzającej budynkami publicznymi bieżący monitoring liczników, wizualizację historycznego zużycia, śledzenie produkcji fotowoltaicznej oraz publikację raportów ESG. Aplikacja działa w trybie read-only — bez integracji księgowej i bez zdalnego sterowania infrastrukturą.

### Aktorzy i uprawnienia

| Aktor | Dostęp |
|-------|--------|
| Gość (niezalogowany) | Panel publiczny: aktualności, jakość powietrza, publiczne raporty ESG gminy |
| Mieszkaniec | Statystyki ulubionych obiektów, raporty ESG przypisanych budynków |
| Dyrektor jednostki | Pełne dane liczników i OZE wyłącznie dla przypisanych budynków |
| Urzędnik gminny | Pełny wgląd we wszystkie obiekty, zarządzanie użytkownikami, raporty ESG, konfiguracja |

Kontrola dostępu oparta na rolach (RBAC). Próba odczytu danych nieprzypisanego budynku zwraca HTTP 403.

### Wymagania funkcjonalne (MoSCoW)

**Must have**
- Bezpieczne logowanie (JWT, hasła hashowane bcrypt)
- Tworzenie kont użytkowników i przypisywanie budynków
- Monitor zużycia: woda, prąd, ciepło
- Ograniczenie widoczności: urzędnik — wszystkie budynki, dyrektor — tylko własna jednostka

**Should have**
- Wykresy historycznego zużycia mediów
- Dashboard OZE (produkcja z paneli fotowoltaicznych)
- Generowanie i pobieranie raportów redukcji CO₂ (ESG)
- Publiczne raporty ESG dla gości

**Could have**
- Globalne statystyki i jakość powietrza na panelu gościa
- Ogłoszenia publikowane przez urzędnika

**Won't have**
- Integracja z systemami księgowymi
- Zdalne sterowanie infrastrukturą 

### Wymagania niefunkcjonalne

- **Bezpieczeństwo:** RBAC, bcrypt, odpowiedzi 401/403 przy nieautoryzowanym dostępie
- **Dostępność:** zgodność z WCAG 2.1 AA (nawigacja klawiaturą, kontrast, ARIA)
- **Responsywność:** interfejs od 320 px do 1920 px
- **Wydajność:** agregacja szeregów czasowych w PostgreSQL (`date_trunc`)

### Stos technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Frontend | React, Chart.js |
| Backend | Node.js, NestJS |
| Baza danych | PostgreSQL, TypeORM |
| Infrastruktura | Docker, Docker Compose |
| Dokumentacja API | Swagger (OpenAPI) |

### Schemat bazy danych

| Tabela | Opis |
|--------|------|
| `users` | Konta użytkowników (`role`: gosc, mieszkaniec, dyrektor, urzednik) |
| `buildings` | Budynki komunalne (`type`: szkola, urzad, szpital, inny) |
| `user_buildings` | Przypisania użytkownik–budynek |
| `meters` | Liczniki mediów (`type`: prad, woda, cieplo) |
| `meter_readings` | Odczyty liczników (szeregi czasowe) |
| `solar_panels` | Instalacje fotowoltaiczne |
| `solar_production` | Produkcja energii OZE |
| `esg_reports` | Raporty redukcji CO₂ (globalne lub per budynek) |

Dodatkowe tabele: ogłoszenia, jakość powietrza, klucze API, ustawienia gminy.

### Struktura repozytorium

```
.
├── backend/                    # API NestJS (auth, liczniki, OZE, ESG, integracja zewnętrzna)
├── frontend/                   # Aplikacja React (panel urzędnika, gościa, wykresy)
├── tools/biskupice-simulator/  # Symulator danych gminy do testów lokalnych
├── docker-compose.yml          # PostgreSQL, backend, frontend
├── .env.example                # Zmienne środowiskowe (JWT, CORS, URL API)
└── README.md
```

---

## Wymagania systemowe

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (zalecane — pełny stack)
- Node.js 20+ (tryb deweloperski bez kontenerów aplikacji)
- npm

Opcjonalnie skopiuj `.env.example` do `.env` i ustaw `JWT_SECRET` przed uruchomieniem produkcyjnym.

---

## Uruchomienie (Docker)

```bash
docker compose up -d --build
```

| Usługa | Adres |
|--------|-------|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Swagger | http://localhost:5000/api/docs |
| PostgreSQL (host) | localhost:5435 |

Przy pierwszym starcie backend wykonuje migracje bazy danych.

```bash
# Logi backendu
docker compose logs -f backend_api

# Zatrzymanie (dane w bazie zostają)
docker compose down

# Reset bazy od zera
docker compose down -v
```

### Pierwsza konfiguracja

Aplikacja startuje bez wbudowanych danych gminy.

1. Otwórz http://localhost:3000
2. Uzupełnij kreator: nazwa gminy, konto administratora (urzędnik)
3. Zapisz wyświetlony klucz API integracji — nie będzie ponownie widoczny w całości
4. Utwórz konta dyrektorów i mieszkańców w panelu **Użytkownicy**

Dane pomiarowe nie są seedowane automatycznie. Dostarcz je przez API integracyjne lub symulator (poniżej).

---

## Uruchomienie deweloperskie

### 1. Baza danych

```bash
docker compose up -d postgres_db
```

Poczekaj ok. 10 sekund na uruchomienie PostgreSQL.

### 2. Backend

```bash
cd backend
npm install
npm run start:dev
```

Backend: http://localhost:5000 — migracje uruchamiane automatycznie przy starcie.

Zmienne środowiskowe w `backend/.env`:

```
DATABASE_URL=postgres://admin:super_secret_password@localhost:5435/energycity_metrics
JWT_SECRET=change-me-in-development
PORT=5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend: http://localhost:3000

---

## Dane testowe

Zalecany symulator gminy Biskupice — działa na hoście, symuluje zewnętrzny system integracyjny:

```bash
cd tools/biskupice-simulator
npm install
```

Windows (PowerShell):

```powershell
$env:API_KEY="ec_..."   # klucz z kreatora konfiguracji
$env:API_URL="http://localhost:5000/api"
npm run seed
```

Linux/macOS:

```bash
export API_KEY=ec_...
export API_URL=http://localhost:5000/api
npm run seed
```

Komenda `seed` wykonuje provision budynków, liczników, OZE oraz kont testowych. Komenda `sync` odczytuje stan z aplikacji.

Konta tworzone przez symulator (hasło: `password`):

- `dyrektor@biskupice.test` — dyrektor szkoły
- `mieszkaniec@biskupice.test` — mieszkaniec

Szczegóły: [tools/biskupice-simulator/README.md](tools/biskupice-simulator/README.md)

### API integracyjne

Nagłówek: `X-API-KEY`. Klucze tworzy urzędnik w panelu **Klucze API**.

Zapis danych:

- `POST /api/external/provision` — budynki, liczniki, panele PV, użytkownicy
- `POST /api/external/meter-readings`
- `POST /api/external/solar-production`
- `POST /api/external/air-quality`
- `POST /api/external/announcements`

Odczyt:

- `GET /api/external/status`
- `GET /api/external/buildings`
- `GET /api/external/meters`
- `GET /api/external/users`

Pełna dokumentacja endpointów: http://localhost:5000/api/docs

---

## Dokumentacja API

Swagger UI: http://localhost:5000/api/docs

- Użytkownicy aplikacji: autoryzacja **Bearer JWT** (przycisk Authorize)
- Integracja zewnętrzna: schemat **api-key**, nagłówek `X-API-KEY`

---

## Rozwiązywanie problemów

**Backend nie startuje**
- Sprawdź status kontenerów: `docker compose ps`
- Zweryfikuj `DATABASE_URL`, `JWT_SECRET`, `PORT` w `backend/.env`
- Upewnij się, że port 5000 jest wolny
- Błąd migracji na starym schemacie: `docker compose down -v`, uruchom ponownie

**Frontend nie łączy się z API**
- Backend musi być dostępny pod http://localhost:5000
- W trybie deweloperskim ustaw `REACT_APP_API_URL=http://localhost:5000/api`

**Brak danych po konfiguracji**
- Uruchom `tools/biskupice-simulator` (sekcja powyżej)
- Utwórz użytkowników w panelu **Użytkownicy**
- Sprawdź klucz API w panelu **Klucze API**

---
