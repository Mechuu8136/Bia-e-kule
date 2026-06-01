import React, { useState, useEffect } from 'react';
import { esgService, EsgReport } from '../services/esgService';
import { buildingService, Building } from '../services/buildingService';
import './ESGReports.css';

export const ESGReports: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [reports, setReports] = useState<EsgReport[]>([]);
  const [globalReports, setGlobalReports] = useState<EsgReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'building' | 'global'>('building');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    co2_reduction_kg: '',
    document_url: '',
  });

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
    const fetchReports = async () => {
      try {
        setLoading(true);

        if (activeTab === 'global') {
          const response = await esgService.getGlobalReports();
          setGlobalReports(response.data);
        } else if (selectedBuildingId) {
          const response = await esgService.getReportsByBuilding(selectedBuildingId);
          setReports(response.data);
        }

        setError(null);
      } catch (err) {
        setError('Błąd przy ładowaniu raportów');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [selectedBuildingId, activeTab]);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await esgService.createReport(
        activeTab === 'building' ? selectedBuildingId : null,
        parseFloat(formData.co2_reduction_kg),
        formData.document_url || undefined
      );

      setFormData({ co2_reduction_kg: '', document_url: '' });
      setShowForm(false);

      if (activeTab === 'global') {
        const response = await esgService.getGlobalReports();
        setGlobalReports(response.data);
      } else if (selectedBuildingId) {
        const response = await esgService.getReportsByBuilding(selectedBuildingId);
        setReports(response.data);
      }
    } catch (err) {
      setError('Błąd przy tworzeniu raportu');
      console.error(err);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Na pewno usunąć raport?')) return;

    try {
      await esgService.deleteReport(reportId);

      if (activeTab === 'global') {
        const response = await esgService.getGlobalReports();
        setGlobalReports(response.data);
      } else if (selectedBuildingId) {
        const response = await esgService.getReportsByBuilding(selectedBuildingId);
        setReports(response.data);
      }
    } catch (err) {
      setError('Błąd przy usuwaniu raportu');
      console.error(err);
    }
  };

  const currentReports = activeTab === 'global' ? globalReports : reports;
  const totalCo2 = currentReports.reduce((sum, r) => sum + Number(r.co2_reduction_kg), 0);

  if (loading) return <div className="loading">Ładowanie...</div>;

  return (
    <div className="esg-reports">
      <div className="esg-header">
        <h1>📊 Raporty ESG - Redukcja CO2</h1>
        <p>Monitorowanie redukcji emisji dwutlenku węgla</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="esg-tabs">
        <button
          className={`tab ${activeTab === 'building' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('building')}
        >
          Budynki
        </button>
        <button
          className={`tab ${activeTab === 'global' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('global')}
        >
          Gmina
        </button>
      </div>

      {activeTab === 'building' && (
        <div className="building-selector">
          <label htmlFor="building-select">Wybierz budynek:</label>
          <select
            id="building-select"
            value={selectedBuildingId || ''}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
          >
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="esg-summary">
        <div className="summary-card">
          <h3>Liczba raportów</h3>
          <span className="summary-value">{currentReports.length}</span>
        </div>
        <div className="summary-card highlight">
          <h3>Całkowita redukcja CO2</h3>
          <span className="summary-value">{totalCo2.toFixed(2)} kg</span>
        </div>
      </div>

      <button className="btn-create" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Anuluj' : '+ Nowy raport'}
      </button>

      {showForm && (
        <form className="report-form" onSubmit={handleCreateReport}>
          <div className="form-group">
            <label htmlFor="co2">Redukcja CO2 (kg):</label>
            <input
              id="co2"
              type="number"
              step="0.01"
              required
              value={formData.co2_reduction_kg}
              onChange={(e) => setFormData({ ...formData, co2_reduction_kg: e.target.value })}
              placeholder="Np. 1500.50"
            />
          </div>

          <div className="form-group">
            <label htmlFor="url">Link do dokumentu (opcjonalnie):</label>
            <input
              id="url"
              type="url"
              value={formData.document_url}
              onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <button type="submit" className="btn-submit">
            Zapisz raport
          </button>
        </form>
      )}

      <div className="reports-list">
        {currentReports.length === 0 ? (
          <div className="no-data">Brak raportów</div>
        ) : (
          currentReports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-header">
                <div>
                  <h4>
                    Redukcja CO2: <strong>{report.co2_reduction_kg} kg</strong>
                  </h4>
                  <p className="report-date">
                    {new Date(report.created_at).toLocaleDateString('pl-PL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteReport(report.id)}
                  title="Usuń raport"
                >
                  ✕
                </button>
              </div>
              {report.document_url && (
                <a href={report.document_url} target="_blank" rel="noopener noreferrer" className="report-link">
                  📄 Pobierz dokument
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
