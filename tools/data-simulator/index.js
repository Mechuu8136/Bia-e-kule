/**
 * Symulator integracji zewnętrznej — wysyła paczki odczytów przez HTTP POST.
 *
 * Użycie:
 *   API_URL=http://localhost:5000/api API_KEY=ec_... npm start
 *
 * Klucz demo jest logowany przy pierwszym starcie backendu (szukaj DEMO_API_KEY w logach).
 */

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const API_KEY = process.env.API_KEY || process.env.DEMO_API_KEY;

const METER_SERIALS = ['PRAD-001', 'WODA-001', 'CIEPLO-001', 'PRAD-002', 'WODA-002'];
const PANEL_SERIALS = ['PV-SCHOOL-001', 'PV-OFFICE-001', 'PV-HOSPITAL-001'];

function randomInRange(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function buildMeterReadings(count = 5) {
  const now = new Date();
  const readings = [];

  for (let i = 0; i < count; i++) {
    const serial = METER_SERIALS[i % METER_SERIALS.length];
    const timestamp = new Date(now.getTime() - i * 15 * 60 * 1000).toISOString();
    readings.push({
      serialNumber: serial,
      timestamp,
      value: serial.startsWith('PRAD') ? randomInRange(5, 25) : randomInRange(0.5, 4),
    });
  }

  return readings;
}

function buildSolarProduction(count = 3) {
  const now = new Date();
  const production = [];

  for (let i = 0; i < count; i++) {
    production.push({
      panelSerialNumber: PANEL_SERIALS[i % PANEL_SERIALS.length],
      timestamp: new Date(now.getTime() - i * 60 * 60 * 1000).toISOString(),
      energyProducedKwh: randomInRange(1, 12),
    });
  }

  return production;
}

async function postJson(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': API_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`${path} → ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

async function main() {
  if (!API_KEY) {
    console.error('Brak API_KEY. Ustaw zmienną środowiskową API_KEY lub DEMO_API_KEY.');
    console.error('Klucz demo pojawia się w logach backendu przy pierwszym uruchomieniu.');
    process.exit(1);
  }

  const isReplay = process.argv.includes('--replay');
  const meterReadings = buildMeterReadings(isReplay ? 3 : 8);
  const solarProduction = buildSolarProduction(3);

  console.log(`→ Wysyłam do ${API_URL}/external/*`);
  console.log(`  Liczniki: ${meterReadings.length} odczytów`);
  console.log(`  OZE: ${solarProduction.length} rekordów`);

  const metersResult = await postJson('/external/meter-readings', { readings: meterReadings });
  console.log('Odpowiedź meter-readings:', metersResult);

  const solarResult = await postJson('/external/solar-production', { production: solarProduction });
  console.log('Odpowiedź solar-production:', solarResult);

  if (isReplay) {
    console.log('\n↻ Ponowne wysłanie tych samych danych (test idempotentności)...');
    const replayMeters = await postJson('/external/meter-readings', { readings: meterReadings });
    console.log('Replay meter-readings:', replayMeters);
  }

  console.log('\n✓ Symulator zakończył pracę.');
}

main().catch((err) => {
  console.error('Błąd symulatora:', err.message);
  process.exit(1);
});
