# Symulator Gminy Biskupice

Niezależne narzędzie testowe symulujące **zewnętrzny system gminy**.
Wszystkie dane trafiają do EnergyCity **wyłącznie przez API integracyjne** (`/api/external/*`).

## Wymagania

1. Uruchomiona aplikacja EnergyCity (backend + frontend + PostgreSQL)
2. Ukończony **kreator pierwszej konfiguracji** w przeglądarce
3. Klucz API z kreatora (lub z panelu „Klucze API”)

## Szybki start

```bash
cd tools/biskupice-simulator
set API_URL=http://localhost:5000/api
set API_KEY=ec_...   # klucz z kreatora konfiguracji
npm run seed         # provision + dane historyczne (~30 dni)
npm run sync         # odczyt stanu (wymiana dwukierunkowa)
```

## Komendy

| Komenda | Opis |
|---------|------|
| `npm run seed` | Rejestruje budynki, liczniki, PV, **użytkowników testowych**, aktualności, jakość powietrza i szereg czasowy |
| `npm run sync` | Odczytuje status, listę budynków i liczników z aplikacji |
| `npm run live` | Wysyła pojedynczą paczkę „bieżących” odczytów |

Zmienna `HISTORY_DAYS` (domyślnie 30) kontroluje głębokość historii.

## Architektura

```
Symulator Biskupice          EnergyCity (white-label)
      │                              │
      ├── POST /external/provision ──┤  struktura + użytkownicy
      ├── POST /external/meter-readings
      ├── POST /external/solar-production
      ├── POST /external/air-quality
      ├── POST /external/announcements
      ├── GET  /external/status  ◄───┤  odczyt stanu
      └── GET  /external/users     ◄─┘
```

Profil gminy: `biskupice-profile.js` — można skopiować jako szablon dla innej gminy.
