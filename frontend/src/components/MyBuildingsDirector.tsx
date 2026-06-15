import React, { useState, useEffect } from 'react';
import { buildingService, Building } from '../services/buildingService';
import { getBuildingTypeLabel, getRoleLabel } from '../utils/roleLabels';
import './MyBuildings.css';

export const MyBuildingsDirector: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await buildingService.getAllBuildings();
        setBuildings(res.data);
      } catch (err) {
        setError('Nie udało się załadować przypisanych budynków');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="my-buildings" role="status" aria-live="polite">
        <div className="loading">Ładowanie budynków...</div>
      </div>
    );
  }

  return (
    <div className="my-buildings my-buildings-director">
      <header className="my-buildings-header director-header">
        <h1>🏢 Moje budynki</h1>
        <p>Jednostki przypisane przez urzędnika gminy — zarządzasz nimi operacyjnie</p>
        <p className="role-hint">Zalogowano jako: <strong>{getRoleLabel('dyrektor')}</strong></p>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="info-banner director-banner" role="status">
        Budynki są przypisywane wyłącznie przez urzędnika. Możesz mieć dostęp do więcej niż
        jednej jednostki. Szczegóły techniczne liczników znajdziesz w Monitorze Zużycia.
      </div>

      {buildings.length === 0 ? (
        <div className="empty-state">
          <p>Brak przypisanych budynków.</p>
          <p>Skontaktuj się z urzędnikiem gminy, aby uzyskać dostęp.</p>
        </div>
      ) : (
        <div className="buildings-grid">
          {buildings.map((building) => (
            <article key={building.id} className="building-card director-card">
              <h2>{building.name}</h2>
              <p className="building-type">{getBuildingTypeLabel(building.type)}</p>
              <p className="building-address">{building.address}</p>
              <span className="building-badge assigned">Przypisany</span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
