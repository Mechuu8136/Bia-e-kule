/**
 * Symulator Gminy Biskupice
 *
 * Niezależne narzędzie testowe — provisionuje strukturę i wstrzykuje dane
 * wyłącznie przez API integracyjne EnergyCity (bez bezpośredniego dostępu do bazy).
 *
 * Wymaga: skonfigurowanej aplikacji EnergyCity + klucz API (z kreatora pierwszego uruchomienia).
 *
 *   cp .env.example .env   # uzupełnij API_KEY
 *   npm run seed
 */

require('dotenv').config();

const profile = require('./biskupice-profile');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const API_KEY = process.env.API_KEY || process.env.DEMO_API_KEY;
const HISTORY_DAYS = Number(process.env.HISTORY_DAYS || 30);

function randomInRange(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function daysAgo(days, hour = 12) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

async function api(method, path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'X-API-KEY': API_KEY } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${method} ${path} → ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

function buildHistoricalMeterReadings() {
  const readings = [];
  for (let day = HISTORY_DAYS; day >= 0; day--) {
    const isWinter = [0, 1, 2, 10, 11].includes(new Date(daysAgo(day)).getMonth());
    for (const meter of profile.meters) {
      let value;
      if (meter.type === 'prad') {
        value = randomInRange(isWinter ? 90 : 60, isWinter ? 180 : 140);
      } else if (meter.type === 'woda') {
        value = randomInRange(10, 35);
      } else {
        value = randomInRange(isWinter ? 12 : 4, isWinter ? 28 : 14);
      }
      readings.push({
        serialNumber: meter.serialNumber,
        timestamp: daysAgo(day),
        value,
      });
    }
  }
  return readings;
}

function buildHistoricalSolarProduction() {
  const production = [];
  for (let day = HISTORY_DAYS; day >= 0; day--) {
    const month = new Date(daysAgo(day)).getMonth();
    const isSummer = month >= 4 && month <= 8;
    for (const panel of profile.solarPanels) {
      const base = panel.capacityKwp * (isSummer ? 4.2 : 1.1);
      production.push({
        panelSerialNumber: panel.serialNumber,
        timestamp: daysAgo(day, 13),
        energyProducedKwh: randomInRange(base * 0.5, base * 1.1),
      });
    }
  }
  return production;
}

function buildAirQualityReadings() {
  const readings = [];
  for (let day = 6; day >= 0; day--) {
    readings.push({
      stationName: profile.airQualityStation,
      pm25: randomInRange(6, 28),
      pm10: randomInRange(12, 42),
      timestamp: daysAgo(day, 10),
    });
  }
  return readings;
}

async function chunkPost(path, key, items, chunkSize = 100) {
  let totalAccepted = 0;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const result = await api('POST', path, { [key]: chunk });
    totalAccepted += result.accepted ?? chunk.length;
    if (result.errors?.length) {
      console.warn('  Ostrzeżenia:', result.errors.slice(0, 3));
    }
  }
  return totalAccepted;
}

async function cmdSeed() {
  if (!API_KEY) {
    console.error('Brak API_KEY. Ustaw klucz z kreatora konfiguracji EnergyCity.');
    process.exit(1);
  }

  console.log(`\n🏘️  Symulator Gminy Biskupice → ${API_URL}`);
  console.log('1/5 Provision struktury (budynki, liczniki, PV, użytkownicy)...');
  const provision = await api('POST', '/external/provision', {
    buildings: profile.buildings,
    meters: profile.meters,
    solarPanels: profile.solarPanels,
    users: profile.users,
  });
  console.log('   ', provision);
  if (provision.users?.length) {
    console.log('   Konta testowe:');
    profile.users.forEach((u) => console.log(`     - ${u.email} / ${u.password} (${u.role})`));
  }

  console.log('2/5 Aktualności...');
  const ann = await api('POST', '/external/announcements', {
    announcements: profile.announcements,
  });
  console.log('   ', ann);

  console.log('3/5 Jakość powietrza (7 dni)...');
  const air = await api('POST', '/external/air-quality', {
    readings: buildAirQualityReadings(),
  });
  console.log('   ', air);

  console.log(`4/5 Odczyty liczników (ostatnie ${HISTORY_DAYS + 1} dni)...`);
  const meterReadings = buildHistoricalMeterReadings();
  const metersAccepted = await chunkPost(
    '/external/meter-readings',
    'readings',
    meterReadings,
    80,
  );
  console.log(`    Zaakceptowano: ${metersAccepted}`);

  console.log(`5/5 Produkcja OZE (ostatnie ${HISTORY_DAYS + 1} dni)...`);
  const solarData = buildHistoricalSolarProduction();
  const solarAccepted = await chunkPost(
    '/external/solar-production',
    'production',
    solarData,
    80,
  );
  console.log(`    Zaakceptowano: ${solarAccepted}`);

  console.log('\n✓ Seed Biskupice zakończony. Uruchom: npm run sync\n');
}

async function cmdSync() {
  if (!API_KEY) {
    console.error('Brak API_KEY.');
    process.exit(1);
  }

  console.log(`\n↔️  Synchronizacja (odczyt stanu) — ${API_URL}\n`);

  const status = await api('GET', '/external/status');
  console.log('Status systemu:', status);

  const buildings = await api('GET', '/external/buildings');
  console.log(`\nBudynki (${buildings.length}):`);
  buildings.forEach((b) => console.log(`  - [${b.external_code}] ${b.name}`));

  const meters = await api('GET', '/external/meters');
  console.log(`\nLiczniki (${meters.length}):`);
  meters.forEach((m) => console.log(`  - ${m.serial_number} (${m.type})`));

  const users = await api('GET', '/external/users');
  console.log(`\nUżytkownicy (${users.length}):`);
  users.forEach((u) => console.log(`  - ${u.email} (${u.role})`));
}

async function cmdLive() {
  console.log('Tryb live — pojedyncza paczka bieżących odczytów...');
  process.env.HISTORY_DAYS = '0';
  await cmdSeed();
}

const command = process.argv[2] || 'seed';

(async () => {
  try {
    if (command === 'sync') await cmdSync();
    else if (command === 'live') await cmdLive();
    else if (command === 'seed') await cmdSeed();
    else {
      console.log('Użycie: node index.js [seed|sync|live]');
      process.exit(1);
    }
  } catch (err) {
    console.error('Błąd symulatora:', err.message);
    process.exit(1);
  }
})();
