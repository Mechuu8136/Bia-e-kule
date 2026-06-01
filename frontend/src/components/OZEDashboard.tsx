import React, { useState, useEffect } from 'react';
import { solarService, SolarPanel } from '../services/solarService';
import { buildingService, Building } from '../services/buildingService';
import { SolarProductionChart } from './SolarProductionChart';
import './OZEDashboard.css';

export const OZEDashboard: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [panels, setPanels] = useState<SolarPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
        const response = await buildingService.getAllBuildings();
        setBuildings(response.data);
        if (response.data.length > 0) {
          setSelectedBuildingId(response.data[0].id);
        }
      } catch (err) {
        setError('Błąd przy ładowaniu budynków');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  useEffect(() => {
    const fetchPanels = async () => {
      if (!selectedBuildingId) return;

      try {
        setLoading(true);
        const response = await solarService.getPanelsByBuilding(selectedBuildingId);
        setPanels(response.data);
        setError(null);
      } catch (err) {
        setError('Błąd przy ładowaniu paneli');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPanels();
  }, [selectedBuildingId]);

  const totalCapacity = panels.reduce((sum, p) => sum + p.capacity_kwp, 0);

  if (loading) return <div className="loading">Ładowanie...</div>;

  return (
    <div className="oze-dashboard">
      <div className="dashboard-header">
        <h1>☀️ Dashboard OZE</h1>
        <p>Monitoring produkcji energii ze źródeł odnawialnych</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="building-selector">
        <label htmlFor="building-select">Wybierz budynek:</label>
        <select
          id="building-select"
          value={selectedBuildingId}
          onChange={(e) => setSelectedBuildingId(e.target.value)}
        >
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name} - {building.address}
            </option>
          ))}
        </select>
      </div>

      {panels.length === 0 ? (
        <div className="no-data">
          <p>Brak paneli fotowoltaicznych dla wybranego budynku</p>
        </div>
      ) : (
        <>
          <div className="capacity-summary">
            <div className="capacity-card">
              <h3>Liczba paneli</h3>
              <span className="capacity-value">{panels.length}</span>
            </div>
            <div className="capacity-card">
              <h3>Całkowita moc</h3>
              <span className="capacity-value">{totalCapacity.toFixed(2)} kWp</span>
            </div>
          </div>

          <div className="panels-grid">
            {panels.map((panel) => (
              <div key={panel.id} className="panel-card">
                <div className="panel-header">
                  <h3>Panel {panels.indexOf(panel) + 1}</h3>
                  <span className="panel-capacity">{panel.capacity_kwp} kWp</span>
                </div>
                <div className="panel-info">
                  <p>
                    <strong>Data instalacji:</strong>{' '}
                    {new Date(panel.installation_date).toLocaleDateString('pl-PL')}
                  </p>
                </div>
                <SolarProductionChart panelId={panel.id} panelCapacity={panel.capacity_kwp} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
