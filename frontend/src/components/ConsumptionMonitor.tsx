import React, { useState, useEffect } from 'react';
import { meterService, MeterType, Meter } from '../services/meterService';
import { buildingService, Building } from '../services/buildingService';
import { MeterChart } from './MeterChart';
import './ConsumptionMonitor.css';

export const ConsumptionMonitor: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [meters, setMeters] = useState<Meter[]>([]);
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
    const fetchMeters = async () => {
      if (!selectedBuildingId) return;

      try {
        setLoading(true);
        const response = await meterService.getMetersByBuilding(selectedBuildingId);
        setMeters(response.data);
        setError(null);
      } catch (err) {
        setError('Błąd przy ładowaniu liczników');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeters();
  }, [selectedBuildingId]);

  const getMetersByType = (type: MeterType) => meters.filter((m) => m.type === type);

  const renderMeterCharts = (type: MeterType, label: string) => {
    const typeMeters = getMetersByType(type);
    if (typeMeters.length === 0) return null;

    return (
      <div key={type} className="meter-section">
        <h3>{label}</h3>
        <div className="meter-charts-grid">
          {typeMeters.map((meter) => (
            <div key={meter.id} className="meter-chart-wrapper">
              <div className="meter-info">
                <span className="meter-serial">Nr: {meter.serial_number}</span>
              </div>
              <MeterChart meterId={meter.id} meterType={type} unit={meter.unit} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading">Ładowanie...</div>;

  return (
    <div className="consumption-monitor">
      <div className="monitor-header">
        <h1>Monitor Zużycia</h1>
        <p>Wizualizacja danych z liczników energii, wody i ciepła</p>
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

      <div className="monitor-content">
        {meters.length === 0 ? (
          <div className="no-data">
            <p>Brak liczników dla wybranego budynku</p>
          </div>
        ) : (
          <>
            {renderMeterCharts(MeterType.PRAD, '⚡ Prąd (kWh)')}
            {renderMeterCharts(MeterType.WODA, '💧 Woda (m³)')}
            {renderMeterCharts(MeterType.CIEPLO, '🔥 Ciepło (GJ)')}
          </>
        )}
      </div>
    </div>
  );
};
