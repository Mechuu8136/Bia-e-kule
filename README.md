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
├── .env.example                # Docker Compose — skopiuj do .env
├── backend/.env.example        # Backend lokalny (npm run start:dev)
├── frontend/.env.example       # Frontend lokalny (npm start)
└── README.md
```

---

## Wymagania systemowe

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — zalecane uruchomienie pełnego stacku
- Node.js 20+ i npm — tylko tryb deweloperski lub symulator danych

---

## Konfiguracja środowiska

Przed pierwszym uruchomieniem skopiuj pliki `.env.example` do `.env`. Pliki `.env` są ignorowane przez git i nie trafiają do release — odbiorca release tworzy je lokalnie na podstawie przykładów.

### Docker Compose (zalecane)

W katalogu głównym projektu:

```bash
cp .env.example .env          # Linux/macOS
copy .env.example .env        # Windows
```

| Zmienna | Opis | Domyślnie |
|---------|------|-----------|
| `JWT_SECRET` | Klucz podpisywania tokenów JWT. **Zmień przed produkcją** (min. 32 losowe znaki). | `change-me-in-production-...` |
| `REACT_APP_API_URL` | Adres API dla frontendu (wbudowywany przy `docker compose build`). | `http://localhost:5000/api` |
| `CORS_ORIGINS` | Dozwolone originy przeglądarki, lista po przecinku. | `http://localhost:3000,...` |

Po zmianie `REACT_APP_API_URL` przebuduj frontend: `docker compose up -d --build frontend_app`.

Dane PostgreSQL w Dockerze (ustawione w `docker-compose.yml`, nie w `.env`):

| Parametr | Wartość |
|----------|---------|
| Użytkownik | `admin` |
| Hasło | `super_secret_password` |
| Baza | `energycity_metrics` |
| Port na hoście | `5435` |

### Tryb deweloperski (backend i frontend poza Dockerem)

**Backend** — skopiuj `backend/.env.example` do `backend/.env`:

| Zmienna | Opis |
|---------|------|
| `DATABASE_URL` | Połączenie z PostgreSQL (`localhost:5435` gdy baza z Docker Compose) |
| `JWT_SECRET` | Klucz JWT |
| `PORT` | Port API (domyślnie `5000`) |
| `NODE_ENV` | `development` |
| `CORS_ORIGINS` | Originy frontendu dev server |

**Frontend** — skopiuj `frontend/.env.example` do `frontend/.env`:

| Zmienna | Opis |
|---------|------|
| `REACT_APP_API_URL` | Adres backendu (`http://localhost:5000/api`) |

**Symulator danych** — opcjonalnie `tools/biskupice-simulator/.env.example` → `.env` (`API_URL`, `API_KEY`).

---

## Uruchomienie (Docker)

```bash
cp .env.example .env    # pierwsze uruchomienie — ustaw JWT_SECRET
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

### 1. Konfiguracja

```bash
cp .env.example .env                    # opcjonalnie, jeśli używasz tylko postgres z Docker
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
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
cp .env.example .env    # uzupełnij API_KEY po kreatorze konfiguracji
npm run seed
```

Alternatywnie ustaw zmienne w shellu:

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
- Zweryfikuj `backend/.env` (tryb dev) lub `.env` w katalogu głównym (Docker)
- Upewnij się, że port 5000 jest wolny
- Błąd migracji na starym schemacie: `docker compose down -v`, uruchom ponownie

**Frontend nie łączy się z API**
- Backend musi być dostępny pod http://localhost:5000
- Sprawdź `REACT_APP_API_URL` w `frontend/.env` (dev) lub `.env` + przebudowa obrazu (Docker)

**Brak danych po konfiguracji**
- Uruchom `tools/biskupice-simulator` (sekcja powyżej)
- Utwórz użytkowników w panelu **Użytkownicy**
- Sprawdź klucz API w panelu **Klucze API**

---
