const ROLE_LABELS: Record<string, string> = {
  urzednik: 'Urzędnik gminy',
  dyrektor: 'Dyrektor jednostki',
  mieszkaniec: 'Mieszkaniec',
  gosc: 'Gość',
};

const BUILDING_TYPE_LABELS: Record<string, string> = {
  szkola: 'Szkoła',
  urzad: 'Urząd',
  szpital: 'Szpital',
  inny: 'Inny',
};

export const getRoleLabel = (role: string): string =>
  ROLE_LABELS[role] ?? role;

export const getBuildingTypeLabel = (type: string): string =>
  BUILDING_TYPE_LABELS[type] ?? type;

export const getAccessScopeMessage = (role: string, buildingCount: number): string => {
  if (role === 'urzednik') {
    return `Widzisz dane ze wszystkich budynków w gminie (${buildingCount}).`;
  }
  if (role === 'dyrektor') {
    return buildingCount > 0
      ? 'Widzisz dane tylko ze swojej przypisanej jednostki.'
      : 'Brak przypisanego budynku — skontaktuj się z urzędnikiem gminy.';
  }
  return '';
};
