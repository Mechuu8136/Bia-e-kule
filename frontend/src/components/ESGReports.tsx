import React, { useState, useEffect } from 'react';
import { esgService, EsgReport, EsgStatistics } from '../services/esgService';
import { downloadReportFile } from '../services/api';
import { buildingService, Building } from '../services/buildingService';
import {
  getAccessScopeMessage,
  getBuildingTypeLabel,
  getRoleLabel,
} from '../utils/roleLabels';
import { formatNumber } from '../utils/chartFormatters';
import './ESGReports.css';

interface ESGReportsProps {
  userRole: string;
}

export const ESGReports: React.FC<ESGReportsProps> = ({ userRole }) => {
  const isUrzędnik = userRole === 'urzednik';

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [reports, setReports] = useState<EsgReport[]>([]);
  const [globalReports, setGlobalReports] = useState<EsgReport[]>([]);
  const [statistics, setStatistics] = useState<EsgStatistics | null>(null);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'building' | 'global'>('building');
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    co2_reduction_kg: '',
    document_url: '',
    is_public: true,
  });

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
    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        setStatistics(null);

        if (activeTab === 'global') {
          const [reportsRes, statsRes] = await Promise.all([
            esgService.getGlobalReports(),
            esgService.getGlobalStatistics().catch(() => null),
          ]);
          setGlobalReports(reportsRes.data);
          if (statsRes) setStatistics(statsRes.data);
        } else if (selectedBuildingId) {
          const [reportsRes, statsRes] = await Promise.all([
            esgService.getReportsByBuilding(selectedBuildingId),
            esgService.getStatisticsByBuilding(selectedBuildingId).catch(() => null),
          ]);
          setReports(reportsRes.data);
          if (statsRes) setStatistics(statsRes.data);
        }

        setError(null);
      } catch (err) {
        setError('Błąd przy ładowaniu raportów');
        console.error(err);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, [selectedBuildingId, activeTab]);

  const refreshReports = async () => {
    if (activeTab === 'global') {
      const [reportsRes, statsRes] = await Promise.all([
        esgService.getGlobalReports(),
        esgService.getGlobalStatistics().catch(() => null),
      ]);
      setGlobalReports(reportsRes.data);
      if (statsRes) setStatistics(statsRes.data);
    } else if (selectedBuildingId) {
      const [reportsRes, statsRes] = await Promise.all([
        esgService.getReportsByBuilding(selectedBuildingId),
        esgService.getStatisticsByBuilding(selectedBuildingId).catch(() => null),
      ]);
      setReports(reportsRes.data);
      if (statsRes) setStatistics(statsRes.data);
    }
  };

  const handleGenerateReport = async () => {
    if (!isUrzędnik) return;
    if (activeTab === 'building' && !selectedBuildingId) return;

    try {
      setGenerating(true);
      setError(null);
      const end = new Date();
      const start = new Date(end.getFullYear(), 0, 1);
      await esgService.generateReport(
        activeTab === 'building' ? selectedBuildingId : null,
        start.toISOString(),
        end.toISOString(),
        activeTab === 'global' ? formData.is_public : false,
      );
      await refreshReports();
    } catch (err) {
      setError('Błąd przy automatycznym generowaniu raportu');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUrzędnik) return;

    try {
      await esgService.createReport(
        activeTab === 'building' ? selectedBuildingId : null,
        parseFloat(formData.co2_reduction_kg),
        formData.document_url || undefined,
        activeTab === 'global' ? formData.is_public : false,
      );
      setFormData({ co2_reduction_kg: '', document_url: '', is_public: true });
      setShowForm(false);
      await refreshReports();
    } catch (err) {
      setError('Błąd przy tworzeniu raportu — tylko urzędnik może publikować raporty');
      console.error(err);
    }
  };

  const handleTogglePublic = async (report: EsgReport) => {
    if (!isUrzędnik || report.building_id) return;

    try {
      await esgService.updateReport(report.id, { is_public: !report.is_public });
      await refreshReports();
    } catch (err) {
      setError('Błąd przy zmianie widoczności raportu');
      console.error(err);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!isUrzędnik) return;
    if (!window.confirm('Na pewno usunąć raport?')) return;

    try {
      await esgService.deleteReport(reportId);
      await refreshReports();
    } catch (err) {
      setError('Błąd przy usuwaniu raportu');
      console.error(err);
    }
  };

  const currentReports = activeTab === 'global' ? globalReports : reports;
  const totalCo2 = statistics?.totalCo2Reduction ??
    currentReports.reduce((sum, r) => sum + Number(r.co2_reduction_kg), 0);

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  const getReportScopeLabel = (report: EsgReport): string => {
    if (!report.building_id) return 'Raport gminy';
    const building = buildings.find((b) => b.id === report.building_id);
    return building ? building.name : 'Raport budynku';
  };

  if (loadingBuildings) {
    return (
      <div className="esg-reports" role="status" aria-live="polite">
        <div className="loading">Ładowanie raportów ESG...</div>
      </div>
    );
  }

  return (
    <div className="esg-reports">
      <header className="esg-header">
        <h1>📊 Raporty ESG — Redukcja CO₂</h1>
        <p>Monitorowanie i publikacja raportów redukcji emisji dwutlenku węgla</p>
        {userRole && (
          <p className="esg-role-info">
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
        {activeTab === 'global'
          ? isUrzędnik
            ? 'Raporty gminy — zaznacz „Opublikuj na panelu gościa”, aby raport był widoczny publicznie.'
            : 'Raporty gminy opublikowane publicznie — redukcja CO₂ dla całej gminy.'
          : getAccessScopeMessage(userRole, buildings.length)}
      </div>

      <div className="esg-tabs" role="tablist" aria-label="Zakres raportów ESG">
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === 'building' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('building')}
          aria-selected={activeTab === 'building'}
        >
          Budynki
        </button>
        <button
          type="button"
          role="tab"
          className={`tab ${activeTab === 'global' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('global')}
          aria-selected={activeTab === 'global'}
        >
          Gmina
        </button>
      </div>

      {activeTab === 'building' && buildings.length > 0 && (
        <div className="building-selector">
          <label htmlFor="esg-building-select">Wybierz budynek:</label>
          <select
            id="esg-building-select"
            value={selectedBuildingId || ''}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
          >
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name} — {getBuildingTypeLabel(building.type)}
              </option>
            ))}
          </select>
        </div>
      )}

      {activeTab === 'building' && buildings.length === 0 && (
        <div className="no-data" role="status">
          <p>Brak dostępnych budynków dla Twojej roli.</p>
        </div>
      )}

      {(activeTab === 'global' || buildings.length > 0) && (
        <>
          <div className="esg-summary" aria-label="Podsumowanie raportów">
            <div className="summary-card">
              <span className="summary-label">Liczba raportów</span>
              <span className="summary-value">{currentReports.length}</span>
            </div>
            <div className="summary-card highlight">
              <span className="summary-label">Całkowita redukcja CO₂</span>
              <span className="summary-value">{formatNumber(totalCo2)} kg</span>
            </div>
            {selectedBuilding && activeTab === 'building' && (
              <div className="summary-card">
                <span className="summary-label">Wybrany obiekt</span>
                <span className="summary-value summary-value-sm">{selectedBuilding.name}</span>
              </div>
            )}
          </div>

          {isUrzędnik && (
            <div className="esg-actions">
              <button
                type="button"
                className="btn-create"
                onClick={handleGenerateReport}
                disabled={generating || (activeTab === 'building' && !selectedBuildingId)}
              >
                {generating ? 'Generowanie…' : '⚡ Generuj raport (CO₂ + PDF)'}
              </button>
              <button
                type="button"
                className="btn-create btn-create-secondary"
                onClick={() => setShowForm(!showForm)}
                aria-expanded={showForm}
              >
                {showForm ? 'Anuluj ręczny' : '+ Ręczny wpis'}
              </button>
            </div>
          )}

          {showForm && isUrzędnik && (
            <form className="report-form" onSubmit={handleCreateReport}>
              <p className="form-hint">
                Tworzysz raport dla:{' '}
                <strong>
                  {activeTab === 'global'
                    ? 'całej gminy'
                    : selectedBuilding?.name ?? 'wybranego budynku'}
                </strong>
              </p>
              <div className="form-group">
                <label htmlFor="co2">Redukcja CO₂ (kg):</label>
                <input
                  id="co2"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.co2_reduction_kg}
                  onChange={(e) => setFormData({ ...formData, co2_reduction_kg: e.target.value })}
                  placeholder="Np. 1500.50"
                />
              </div>
              <div className="form-group">
                <label htmlFor="url">Link do dokumentu PDF (opcjonalnie):</label>
                <input
                  id="url"
                  type="url"
                  value={formData.document_url}
                  onChange={(e) => setFormData({ ...formData, document_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              {activeTab === 'global' && (
                <div className="form-group form-group-checkbox">
                  <label htmlFor="is-public">
                    <input
                      id="is-public"
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) =>
                        setFormData({ ...formData, is_public: e.target.checked })
                      }
                    />
                    Opublikuj na panelu gościa
                  </label>
                </div>
              )}
              <button type="submit" className="btn-submit">
                Opublikuj raport
              </button>
            </form>
          )}

          <div className="reports-list" role="tabpanel">
            {loadingReports ? (
              <div className="loading" role="status" aria-live="polite">
                Ładowanie raportów...
              </div>
            ) : currentReports.length === 0 ? (
              <div className="no-data" role="status">
                Brak raportów w tej kategorii
              </div>
            ) : (
              currentReports.map((report) => (
                <article key={report.id} className="report-card">
                  <div className="report-header">
                    <div>
                      <div className="report-meta-row">
                        <span className="report-scope">{getReportScopeLabel(report)}</span>
                        {!report.building_id && (
                          <span
                            className={`public-badge ${report.is_public ? 'public-badge-visible' : 'public-badge-hidden'}`}
                          >
                            {report.is_public ? 'Publiczny' : 'Wewnętrzny'}
                          </span>
                        )}
                      </div>
                      <h4>
                        Redukcja CO₂: <strong>{formatNumber(Number(report.co2_reduction_kg))} kg</strong>
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
                    <div className="report-actions">
                      {isUrzędnik && !report.building_id && (
                        <button
                          type="button"
                          className="btn-toggle-public"
                          onClick={() => handleTogglePublic(report)}
                          aria-label={
                            report.is_public
                              ? 'Ukryj raport z panelu gościa'
                              : 'Opublikuj raport na panelu gościa'
                          }
                        >
                          {report.is_public ? 'Ukryj publicznie' : 'Opublikuj publicznie'}
                        </button>
                      )}
                      {isUrzędnik && (
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => handleDeleteReport(report.id)}
                          aria-label="Usuń raport"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  {report.document_url && (
                    <button
                      type="button"
                      className="report-link"
                      onClick={() => downloadReportFile(report.document_url!)}
                    >
                      📄 Pobierz dokument raportu
                    </button>
                  )}
                </article>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
