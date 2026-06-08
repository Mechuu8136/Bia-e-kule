import React, { useState, useEffect } from 'react';
import { solarService, SolarPanel } from '../services/solarService';
import { buildingService, Building } from '../services/buildingService';
import { SolarProductionChart } from './SolarProductionChart';
import {
  getAccessScopeMessage,
  getBuildingTypeLabel,
  getRoleLabel,
} from '../utils/roleLabels';
import './OZEDashboard.css';

interface OZEDashboardProps {
  userRole: string;
}

export const OZEDashboard: React.FC<OZEDashboardProps> = ({ userRole }) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [panels, setPanels] = useState<SolarPanel[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [loadingPanels, setLoadingPanels] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoadingBuildings(true);
        setError(null);
        const response = await buildingService.getAllBuildings();
        setBuildings(response.data);
        if (response.data.length > 0) {
          setSelectedBuildingId(response.data[0].id);
        }
      } catch (err) {
        setError('Błąd przy ładowaniu budynków');
        console.error(err);
      } finally {
        setLoadingBuildings(false);
      }
    };

    fetchBuildings();
  }, []);

  useEffect(() => {
    const fetchPanels = async () => {
      if (!selectedBuildingId) {
        setPanels([]);
        return;
      }

      try {
        setLoadingPanels(true);
        const response = await solarService.getPanelsByBuilding(selectedBuildingId);
        setPanels(response.data);
        setError(null);
      } catch (err) {
        setError('Błąd przy ładowaniu paneli fotowoltaicznych');
        console.error(err);
      } finally {
        setLoadingPanels(false);
      }
    };

    fetchPanels();
  }, [selectedBuildingId]);

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);
  const totalCapacity = panels.reduce((sum, p) => sum + Number(p.capacity_kwp), 0);

  if (loadingBuildings) {
    return (
      <div className="oze-dashboard" role="status" aria-live="polite" aria-label="Ładowanie dashboardu OZE">
        <div className="loading">Ładowanie budynków...</div>
      </div>
    );
  }

  return (
    <div className="oze-dashboard">
      <header className="dashboard-header">
        <h1>☀️ Dashboard OZE</h1>
        <p>Monitoring produkcji energii ze źródeł odnawialnych na budynkach gminy</p>
        {userRole && (
          <p className="dashboard-role-info">
            Zalogowano jako: <strong>{getRoleLabel(userRole)}</strong>
          </p>
        )}
      </header>

      {error && (
        <div className="error-banner" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <div className="access-scope-banner" role="status">
        {getAccessScopeMessage(userRole, buildings.length)}
      </div>

      {buildings.length === 0 ? (
        <div className="no-data" role="status">
          <p>Brak dostępnych budynków dla Twojej roli.</p>
        </div>
      ) : (
        <>
          <div className="building-selector">
            <label htmlFor="oze-building-select">Wybierz budynek:</label>
            <select
              id="oze-building-select"
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
            >
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name} — {building.address}
                </option>
              ))}
            </select>
          </div>

          {selectedBuilding && (
            <div className="oze-summary" aria-label="Podsumowanie instalacji OZE">
              <div className="summary-card">
                <span className="summary-label">Typ obiektu</span>
                <span className="summary-value">{getBuildingTypeLabel(selectedBuilding.type)}</span>
              </div>
              <div className="summary-card">
                <span className="summary-label">Instalacje PV</span>
                <span className="summary-value">{panels.length}</span>
              </div>
              <div className="summary-card highlight">
                <span className="summary-label">Całkowita moc</span>
                <span className="summary-value">{totalCapacity.toFixed(2)} kWp</span>
              </div>
            </div>
          )}

          {loadingPanels ? (
            <div className="loading" role="status" aria-live="polite">
              Ładowanie paneli...
            </div>
          ) : panels.length === 0 ? (
            <div className="no-data" role="status">
              <p>Brak paneli fotowoltaicznych dla wybranego budynku</p>
            </div>
          ) : (
            <div className="panels-grid">
              {panels.map((panel, index) => (
                <article key={panel.id} className="panel-card" aria-label={`Instalacja PV ${index + 1}`}>
                  <div className="panel-header">
                    <h3>Instalacja PV {index + 1}</h3>
                    <span className="panel-capacity">{panel.capacity_kwp} kWp</span>
                  </div>
                  <div className="panel-info">
                    <p>
                      <strong>Data instalacji:</strong>{' '}
                      {new Date(panel.installation_date).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                  <SolarProductionChart panelId={panel.id} panelCapacity={Number(panel.capacity_kwp)} />
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
