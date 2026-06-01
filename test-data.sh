#!/bin/bash

# Skrypt do dodawania testowych danych do EnergyCity
# Uruchom: bash test-data.sh

API_URL="http://localhost:5000/api"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="password"

echo "🔐 Logowanie jako admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Błąd logowania!"
  echo "Sprawdź czy:"
  echo "1. Backend jest uruchomiony (http://localhost:5000)"
  echo "2. Baza danych jest dostępna"
  echo "3. Admin@example.com istnieje w bazie"
  exit 1
fi

echo "✅ Token admin: ${ADMIN_TOKEN:0:20}..."

# Funkcja do dodawania budynku
add_building() {
  local name=$1
  local address=$2
  local type=$3

  echo -n "Dodawanie budynku: $name... "
  BUILDING_RESPONSE=$(curl -s -X POST "$API_URL/buildings" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{\"name\":\"$name\",\"address\":\"$address\",\"type\":\"$type\"}")

  BUILDING_ID=$(echo $BUILDING_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

  if [ ! -z "$BUILDING_ID" ]; then
    echo "✅ ($BUILDING_ID)"
    echo $BUILDING_ID
  else
    echo "❌"
  fi
}

# Funkcja do dodawania licznika
add_meter() {
  local building_id=$1
  local type=$2
  local serial=$3

  echo -n "  Dodawanie licznika: $type ($serial)... "
  curl -s -X POST "$API_URL/meters" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{\"building_id\":\"$building_id\",\"type\":\"$type\",\"serial_number\":\"$serial\",\"unit\":\"kWh\"}" > /dev/null
  echo "✅"
}

# Funkcja do dodawania panelu
add_solar_panel() {
  local building_id=$1
  local capacity=$2

  echo -n "  Dodawanie panelu: $capacity kWp... "
  curl -s -X POST "$API_URL/solar-panels" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{\"building_id\":\"$building_id\",\"capacity_kwp\":$capacity,\"installation_date\":\"2023-01-15\"}" > /dev/null
  echo "✅"
}

echo ""
echo "📍 Dodawanie budynków testowych..."

# Szkoła
SCHOOL_ID=$(add_building "Szkoła Podstawowa nr 1" "ul. Kopernika 10, Warszawa" "szkola")
add_meter "$SCHOOL_ID" "prad" "PRAD-001"
add_meter "$SCHOOL_ID" "woda" "WODA-001"
add_meter "$SCHOOL_ID" "cieplo" "CIEPLO-001"
add_solar_panel "$SCHOOL_ID" 25.5

# Urząd
OFFICE_ID=$(add_building "Urząd Gminy" "ul. Urzędnika 5, Warszawa" "urzad")
add_meter "$OFFICE_ID" "prad" "PRAD-002"
add_meter "$OFFICE_ID" "woda" "WODA-002"
add_solar_panel "$OFFICE_ID" 15.0

# Szpital
HOSPITAL_ID=$(add_building "Szpital Miejski" "ul. Zdrowotna 20, Warszawa" "szpital")
add_meter "$HOSPITAL_ID" "prad" "PRAD-003"
add_meter "$HOSPITAL_ID" "woda" "WODA-003"
add_meter "$HOSPITAL_ID" "cieplo" "CIEPLO-003"
add_solar_panel "$HOSPITAL_ID" 40.0

echo ""
echo "✅ Testowe dane zostały dodane!"
echo ""
echo "🎯 Możesz teraz:"
echo "1. Zalogować się jako admin@example.com / password"
echo "2. Przeglądać liczniki w 'Monitor Zużycia'"
echo "3. Przeglądać panele w 'Dashboard OZE'"
echo "4. Dodawać raporty w 'Raporty ESG'"
echo ""
