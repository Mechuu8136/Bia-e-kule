import React, { useState, useEffect, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { buildingService, Building } from '../services/buildingService';
import {
  residentService,
  BuildingSummary,
  MediaTypeSummary,
} from '../services/residentService';
import { getBuildingTypeLabel, getRoleLabel } from '../utils/roleLabels';
import { formatMonthLabel, formatNumber } from '../utils/chartFormatters';
import './MyBuildings.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MEDIA_ICONS: Record<string, string> = {
  prad: '⚡',
  woda: '💧',
  cieplo: '🔥',
};

const formatYoY = (percent: number | null): { text: string; className: string } => {
  if (percent === null) {
    return { text: 'Brak danych rok do roku', className: 'yoy-neutral' };
  }
  const rounded = Math.round(percent);
  if (rounded < 0) {
    return { text: `${Math.abs(rounded)}% mniej niż rok temu`, className: 'yoy-down' };
  }
  if (rounded > 0) {
    return { text: `${rounded}% więcej niż rok temu`, className: 'yoy-up' };
  }
  return { text: 'Bez zmian rok do roku', className: 'yoy-neutral' };
};

const MediaInfographicCard: React.FC<{ media: MediaTypeSummary }> = ({ media }) => {
  const yoy = formatYoY(media.yearOverYearChangePercent);

  return (
    <div className="infographic-card">
      <div className="infographic-icon">{MEDIA_ICONS[media.type] ?? '📊'}</div>
      <h3>{media.label}</h3>
      <p className="infographic-value">{formatNumber(media.currentMonthTotal, 0)}</p>
      <p className="infographic-unit">{media.unit} — bieżący miesiąc</p>
      <span className={`yoy-badge ${yoy.className}`}>{yoy.text}</span>
    </div>
  );
};

const BuildingOverview: React.FC<{
  buildingId: string;
  onBack: () => void;
}> = ({ buildingId, onBack }) => {
  const [summary, setSummary] = useState<BuildingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await residentService.getBuildingSummary(buildingId);
        setSummary(res.data);
      } catch (err) {
        setError('Nie udało się załadować podglądu budynku');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [buildingId]);

  if (loading) {
    return <div className="loading" role="status">Ładowanie podglądu...</div>;
  }

  if (error || !summary) {
    return <div className="error-banner" role="alert">{error ?? 'Brak danych'}</div>;
  }

  const solarChart = {
    labels: summary.solar.monthlyProduction.map((m) => formatMonthLabel(m.month)),
    datasets: [
      {
        label: 'Produkcja PV (kWh)',
        data: summary.solar.monthlyProduction.map((m) => m.total),
        backgroundColor: 'rgba(255, 193, 7, 0.7)',
        borderColor: 'rgb(255, 160, 0)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <section className="resident-overview" aria-labelledby="overview-heading">
      <button type="button" className="btn-card btn-remove" onClick={onBack} style={{ marginBottom: 16 }}>
        ← Wróć do listy
      </button>

      <header className="resident-overview-header">
        <h2 id="overview-heading">{summary.building.name}</h2>
        <p>{getBuildingTypeLabel(summary.building.type)} — {summary.building.address}</p>
      </header>

      <div className="infographic-grid">
        {summary.media.map((m) => (
          <MediaInfographicCard key={m.type} media={m} />
        ))}
        <div className="infographic-card">
          <div className="infographic-icon">☀️</div>
          <h3>Energia słoneczna</h3>
          <p className="infographic-value">{formatNumber(summary.solar.last12MonthsTotal, 0)}</p>
          <p className="infographic-unit">kWh wyprodukowane (12 mies.)</p>
        </div>
      </div>

      {summary.solar.monthlyProduction.length > 0 && (
        <div className="chart-section">
          <h3>Produkcja z paneli — ujęcie miesięczne</h3>
          <div role="img" aria-label="Wykres miesięcznej produkcji energii słonecznej">
            <Bar
              data={solarChart}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>
      )}

      {summary.esgReports.length > 0 && (
        <div className="chart-section">
          <h3>Raporty ESG do pobrania</h3>
          <ul className="esg-download-list">
            {summary.esgReports.map((report) => (
              <li key={report.id}>
                <span>
                  Redukcja CO₂: <strong>{formatNumber(Number(report.co2_reduction_kg), 0)} kg</strong>
                </span>
                {report.document_url ? (
                  <a href={report.document_url} target="_blank" rel="noopener noreferrer">
                    Pobierz raport PDF
                  </a>
                ) : (
                  <span>Brak pliku PDF</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export const MyBuildingsResident: React.FC = () => {
  const [favorites, setFavorites] = useState<Building[]>([]);
  const [catalog, setCatalog] = useState<Building[]>([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [viewingBuildingId, setViewingBuildingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [favRes, catRes] = await Promise.all([
        residentService.getFavorites(),
        residentService.getCatalog(),
      ]);
      setFavorites(favRes.data);
      setCatalog(catRes.data);
    } catch (err) {
      setError('Nie udało się załadować budynków');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddFavorite = async () => {
    if (!selectedCatalogId) return;
    try {
      await residentService.addFavorite(selectedCatalogId);
      setSuccess('Dodano budynek do ulubionych');
      setSelectedCatalogId('');
      await loadData();
    } catch (err) {
      setError('Nie udało się dodać budynku');
      console.error(err);
    }
  };

  const handleRemoveFavorite = async (buildingId: string) => {
    try {
      await residentService.removeFavorite(buildingId);
      if (viewingBuildingId === buildingId) setViewingBuildingId(null);
      await loadData();
    } catch (err) {
      setError('Nie udało się usunąć budynku');
      console.error(err);
    }
  };

  const availableToAdd = catalog.filter(
    (b) => !favorites.some((f) => f.id === b.id),
  );

  if (loading) {
    return (
      <div className="my-buildings" role="status" aria-live="polite">
        <div className="loading">Ładowanie...</div>
      </div>
    );
  }

  if (viewingBuildingId) {
    return (
      <div className="my-buildings my-buildings-resident">
        <BuildingOverview
          buildingId={viewingBuildingId}
          onBack={() => setViewingBuildingId(null)}
        />
      </div>
    );
  }

  return (
    <div className="my-buildings my-buildings-resident">
      <header className="my-buildings-header resident-header">
        <h1>🏘️ Moje budynki</h1>
        <p>Obserwuj ulubione placówki w gminie — ogólne trendy bez szczegółów technicznych</p>
        <p className="role-hint">Zalogowano jako: <strong>{getRoleLabel('mieszkaniec')}</strong></p>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}
      {success && (
        <div className="info-banner resident-banner" role="status">{success}</div>
      )}

      <div className="info-banner resident-banner" role="status">
        Wybierz dowolne budynki, które Cię interesują. Zobaczysz trendy zużycia i produkcję OZE
        w ujęciu miesięcznym — bez numerów liczników i odczytów godzinowych.
      </div>

      {availableToAdd.length > 0 && (
        <section className="catalog-section" aria-labelledby="catalog-heading">
          <h2 id="catalog-heading">Dodaj budynek do obserwowanych</h2>
          <div className="catalog-picker">
            <select
              value={selectedCatalogId}
              onChange={(e) => setSelectedCatalogId(e.target.value)}
              aria-label="Wybierz budynek z katalogu gminy"
            >
              <option value="">— wybierz budynek —</option>
              {availableToAdd.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({getBuildingTypeLabel(b.type)})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-add"
              onClick={handleAddFavorite}
              disabled={!selectedCatalogId}
            >
              + Dodaj
            </button>
          </div>
        </section>
      )}

      {favorites.length === 0 ? (
        <div className="empty-state">
          <p>Nie obserwujesz jeszcze żadnych budynków.</p>
          <p>Dodaj szkołę, urząd lub inny obiekt z listy powyżej.</p>
        </div>
      ) : (
        <div className="buildings-grid">
          {favorites.map((building) => (
            <article key={building.id} className="building-card">
              <h2>{building.name}</h2>
              <p className="building-type">{getBuildingTypeLabel(building.type)}</p>
              <p className="building-address">{building.address}</p>
              <span className="building-badge favorite">Obserwowany</span>
              <div className="building-card-actions">
                <button
                  type="button"
                  className="btn-card btn-view"
                  onClick={() => setViewingBuildingId(building.id)}
                >
                  Zobacz podgląd
                </button>
                <button
                  type="button"
                  className="btn-card btn-remove"
                  onClick={() => handleRemoveFavorite(building.id)}
                >
                  Usuń
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
