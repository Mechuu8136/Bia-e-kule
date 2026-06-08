import React, { useState, useEffect } from 'react';
import { meterService, MeterType, Meter } from '../services/meterService';
import { buildingService, Building } from '../services/buildingService';
import { MeterChart } from './MeterChart';
import {
  getAccessScopeMessage,
  getBuildingTypeLabel,
  getRoleLabel,
} from '../utils/roleLabels';
import './ConsumptionMonitor.css';

interface ConsumptionMonitorProps {
  userRole: string;
}

const METER_SECTIONS: { type: MeterType; label: string; icon: string }[] = [
  { type: MeterType.PRAD, label: 'Prąd', icon: '⚡' },
  { type: MeterType.WODA, label: 'Woda', icon: '💧' },
  { type: MeterType.CIEPLO, label: 'Ciepło', icon: '🔥' },
];

export const ConsumptionMonitor: React.FC<ConsumptionMonitorProps> = ({ userRole }) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [loadingMeters, setLoadingMeters] = useState(false);
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
    const fetchMeters = async () => {
      if (!selectedBuildingId) {
        setMeters([]);
        return;
      }

      try {
        setLoadingMeters(true);
        const response = await meterService.getMetersByBuilding(selectedBuildingId);
        setMeters(response.data);
        setError(null);
      } catch (err) {
        setError('Błąd przy ładowaniu liczników');
        console.error(err);
      } finally {
        setLoadingMeters(false);
      }
    };

    fetchMeters();
  }, [selectedBuildingId]);

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);
  const getMetersByType = (type: MeterType) => meters.filter((m) => m.type === type);

  const renderMeterCharts = (type: MeterType, label: string, icon: string) => {
    const typeMeters = getMetersByType(type);
    if (typeMeters.length === 0) return null;

    return (
      <section key={type} className="meter-section" aria-labelledby={`section-${type}`}>
        <h3 id={`section-${type}`}>
          {icon} {label}
        </h3>
        <div className="meter-charts-grid">
          {typeMeters.map((meter) => (
            <article key={meter.id} className="meter-chart-wrapper" aria-label={`Licznik ${label}`}>
              <div className="meter-info">
                <span className="meter-serial">Nr seryjny: {meter.serial_number}</span>
                <span className="meter-unit">Jednostka: {meter.unit}</span>
              </div>
              <MeterChart meterId={meter.id} meterType={type} unit={meter.unit} />
            </article>
          ))}
        </div>
      </section>
    );
  };

  if (loadingBuildings) {
    return (
      <div className="consumption-monitor" role="status" aria-live="polite" aria-label="Ładowanie monitora zużycia">
        <div className="loading">Ładowanie budynków...</div>
      </div>
    );
  }

  return (
    <div className="consumption-monitor">
      <header className="monitor-header">
        <h1>Monitor Zużycia</h1>
        <p>Wizualizacja danych z liczników prądu, wody i ciepła</p>
        {userRole && (
          <p className="monitor-role-info">
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
          <p>
            <small>
              {userRole === 'dyrektor'
                ? 'Poproś urzędnika o przypisanie Twojej jednostki.'
                : 'Skontaktuj się z administratorem systemu.'}
            </small>
          </p>
        </div>
      ) : (
        <>
          <div className="building-selector">
            <label htmlFor="building-select">Wybierz budynek:</label>
            <select
              id="building-select"
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              aria-describedby="building-select-hint"
            >
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name} — {building.address}
                </option>
              ))}
            </select>
            <span id="building-select-hint" className="sr-only">
              Lista budynków dostępnych dla Twojej roli
            </span>
          </div>

          {selectedBuilding && (
            <div className="building-summary" aria-label="Podsumowanie wybranego budynku">
              <div className="summary-card">
                <span className="summary-label">Typ obiektu</span>
                <span className="summary-value">{getBuildingTypeLabel(selectedBuilding.type)}</span>
              </div>
              <div className="summary-card">
                <span className="summary-label">Liczba liczników</span>
                <span className="summary-value">{meters.length}</span>
              </div>
              {METER_SECTIONS.map(({ type, icon, label }) => {
                const count = getMetersByType(type).length;
                if (count === 0) return null;
                return (
                  <div key={type} className="summary-card">
                    <span className="summary-label">{icon} {label}</span>
                    <span className="summary-value">{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="monitor-content">
            {loadingMeters ? (
              <div className="loading" role="status" aria-live="polite">
                Ładowanie liczników...
              </div>
            ) : meters.length === 0 ? (
              <div className="no-data" role="status">
                <p>Brak liczników dla wybranego budynku</p>
              </div>
            ) : (
              METER_SECTIONS.map(({ type, label, icon }) =>
                renderMeterCharts(type, label, icon)
              )
            )}
          </div>
        </>
      )}
    </div>
  );
};
