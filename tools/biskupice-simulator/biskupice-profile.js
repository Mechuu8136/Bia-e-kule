/**
 * Profil testowej gminy Biskupice — dane wysyłane wyłącznie przez API integracyjne.
 */
module.exports = {
  municipalityName: 'Gmina Biskupice',
  airQualityStation: 'Stacja pomiarowa — Biskupice centrum',

  buildings: [
    {
      externalCode: 'BISK-SCHOOL',
      name: 'Szkoła Podstawowa w Biskupicach',
      address: 'ul. Szkolna 3, Biskupice',
      type: 'szkola',
    },
    {
      externalCode: 'BISK-OFFICE',
      name: 'Urząd Gminy Biskupice',
      address: 'ul. Główna 1, Biskupice',
      type: 'urzad',
    },
    {
      externalCode: 'BISK-CULTURE',
      name: 'Dom Kultury Biskupice',
      address: 'ul. Parkowa 7, Biskupice',
      type: 'inny',
    },
  ],

  meters: [
    { serialNumber: 'BISK-PRAD-001', buildingExternalCode: 'BISK-SCHOOL', type: 'prad', unit: 'kWh' },
    { serialNumber: 'BISK-WODA-001', buildingExternalCode: 'BISK-SCHOOL', type: 'woda', unit: 'm³' },
    { serialNumber: 'BISK-PRAD-002', buildingExternalCode: 'BISK-OFFICE', type: 'prad', unit: 'kWh' },
    { serialNumber: 'BISK-WODA-002', buildingExternalCode: 'BISK-OFFICE', type: 'woda', unit: 'm³' },
    { serialNumber: 'BISK-PRAD-003', buildingExternalCode: 'BISK-CULTURE', type: 'prad', unit: 'kWh' },
  ],

  solarPanels: [
    {
      serialNumber: 'BISK-PV-SCHOOL',
      buildingExternalCode: 'BISK-SCHOOL',
      capacityKwp: 22.5,
      installationDate: '2024-03-15',
    },
    {
      serialNumber: 'BISK-PV-OFFICE',
      buildingExternalCode: 'BISK-OFFICE',
      capacityKwp: 12.0,
      installationDate: '2023-09-01',
    },
  ],

  announcements: [
    {
      title: 'Biskupice — program termomodernizacji szkoły',
      body: 'Gmina Biskupice rozpoczyna kolejny etap termomodernizacji budynku szkoły podstawowej.',
      is_published: true,
    },
    {
      title: 'Nowa instalacja PV na urzędzie gminy',
      body: 'Na dachu urzędu uruchomiono panele fotowoltaiczne monitorowane w systemie EnergyCity.',
      is_published: true,
    },
  ],

  users: [
    {
      email: 'dyrektor@biskupice.test',
      password: 'password',
      role: 'dyrektor',
      assignedBuildingExternalCodes: ['BISK-SCHOOL'],
    },
    {
      email: 'mieszkaniec@biskupice.test',
      password: 'password',
      role: 'mieszkaniec',
      favoriteBuildingExternalCodes: ['BISK-SCHOOL', 'BISK-CULTURE'],
    },
  ],
};
