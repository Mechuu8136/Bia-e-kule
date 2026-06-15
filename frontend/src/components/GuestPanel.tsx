import React, { useEffect, useState } from 'react';
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
import {
  publicService,
  PublicAnnouncement,
  AirQualitySnapshot,
  AirQualityTrendPoint,
  PublicEsgReport,
  PublicEsgStatistics,
} from '../services/publicService';
import { formatNumber } from '../utils/chartFormatters';
import './GuestPanel.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface GuestPanelProps {
  onLoginClick: () => void;
}

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const levelClass = (level: string): string => `air-quality-level level-${level}`;

const AIR_ICONS: Record<string, string> = {
  dobra: '😊',
  umiarkowana: '😐',
  niezdrowa: '😷',
};

export const GuestPanel: React.FC<GuestPanelProps> = ({ onLoginClick }) => {
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [airCurrent, setAirCurrent] = useState<AirQualitySnapshot | null>(null);
  const [airTrend, setAirTrend] = useState<AirQualityTrendPoint[]>([]);
  const [esgReports, setEsgReports] = useState<PublicEsgReport[]>([]);
  const [esgStats, setEsgStats] = useState<PublicEsgStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [annRes, airRes, esgRes, statsRes] = await Promise.all([
          publicService.getAnnouncements(),
          publicService.getAirQuality(),
          publicService.getGlobalEsgReports(),
          publicService.getGlobalEsgStatistics(),
        ]);
        setAnnouncements(annRes.data);
        setAirCurrent(airRes.data.current);
        setAirTrend(airRes.data.trend);
        setEsgReports(esgRes.data);
        setEsgStats(statsRes.data);
      } catch (err) {
        setError('Nie udało się załadować danych publicznych. Sprawdź, czy backend działa.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const airChartData = {
    labels: airTrend.map((p) =>
      new Date(p.date).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric' }),
    ),
    datasets: [
      {
        label: 'PM2.5 (µg/m³)',
        data: airTrend.map((p) => p.pm25),
        backgroundColor: 'rgba(25, 118, 210, 0.7)',
        borderColor: '#1976d2',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="guest-panel">
      <header className="guest-header" role="banner">
        <div className="guest-header-inner">
          <div className="guest-logo">
            <h1>EnergyCity</h1>
            <p>Monitoring energii i jakości środowiska — Gmina Choroszcz</p>
          </div>
          <button
            type="button"
            className="btn-login-header"
            onClick={onLoginClick}
            aria-label="Zaloguj się do panelu użytkownika"
          >
            Zaloguj się
          </button>
        </div>
      </header>

      <main className="guest-main" role="main">
        <section className="guest-hero" aria-labelledby="hero-heading">
          <h2 id="hero-heading">Witamy w EnergyCity</h2>
          <p>
            Publiczny panel gminy — aktualności, jakość powietrza i raporty ekologiczne.
            Zaloguj się, aby uzyskać dostęp do szczegółowych danych swojej placówki lub
            obserwowanych budynków.
          </p>
        </section>

        {loading && (
          <div className="guest-loading" role="status" aria-live="polite">
            Ładowanie danych...
          </div>
        )}

        {error && (
          <div className="guest-error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="guest-section" aria-labelledby="news-heading">
              <h2 id="news-heading">📢 Aktualności</h2>
              {announcements.length === 0 ? (
                <p className="empty-hint">Brak ogłoszeń.</p>
              ) : (
                <div className="announcements-list">
                  {announcements.map((item) => (
                    <article key={item.id} className="announcement-card">
                      <h3>{item.title}</h3>
                      <time className="announcement-date" dateTime={item.published_at}>
                        {formatDate(item.published_at)}
                      </time>
                      <p>{item.body}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="guest-section" aria-labelledby="air-heading">
              <h2 id="air-heading">🌿 Jakość powietrza</h2>
              <div className="air-quality-panel">
                <div className="air-quality-current" role="status">
                  {airCurrent ? (
                    <>
                      <div className="air-quality-icon" aria-hidden="true">
                        {AIR_ICONS[airCurrent.level] ?? '🌿'}
                      </div>
                      <span className={levelClass(airCurrent.level)}>
                        {airCurrent.level_label}
                      </span>
                      <p style={{ fontSize: '0.85rem', color: '#666', margin: '8px 0' }}>
                        {airCurrent.station_name}
                      </p>
                      <div className="air-metrics">
                        <div className="air-metric">
                          <div className="air-metric-value">{airCurrent.pm25}</div>
                          <div className="air-metric-label">PM2.5 µg/m³</div>
                        </div>
                        <div className="air-metric">
                          <div className="air-metric-value">{airCurrent.pm10}</div>
                          <div className="air-metric-label">PM10 µg/m³</div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#999', marginTop: 12 }}>
                        Ostatni pomiar: {formatDate(airCurrent.timestamp)}
                      </p>
                    </>
                  ) : (
                    <p className="empty-hint">Brak danych o jakości powietrza.</p>
                  )}
                </div>

                <div className="air-quality-chart">
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>
                    Trend PM2.5 — ostatnie 7 dni
                  </h3>
                  {airTrend.length > 0 ? (
                    <div role="img" aria-label="Wykres jakości powietrza PM2.5 za ostatnie 7 dni">
                      <Bar
                        data={airChartData}
                        options={{
                          responsive: true,
                          plugins: { legend: { display: false } },
                          scales: { y: { beginAtZero: true, title: { display: true, text: 'µg/m³' } } },
                        }}
                      />
                    </div>
                  ) : (
                    <p className="empty-hint">Brak danych historycznych.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="guest-section" aria-labelledby="esg-heading">
              <h2 id="esg-heading">📊 Raporty ESG gminy</h2>
              {esgStats && (
                <div className="esg-public-summary" aria-label="Podsumowanie raportów ESG">
                  <div className="esg-stat-card">
                    <div className="esg-stat-value">
                      {formatNumber(esgStats.totalCo2Reduction, 0)}
                    </div>
                    <div className="esg-stat-label">kg CO₂ zredukowane łącznie</div>
                  </div>
                  <div className="esg-stat-card">
                    <div className="esg-stat-value">{esgStats.totalReports}</div>
                    <div className="esg-stat-label">raportów publicznych</div>
                  </div>
                </div>
              )}

              {esgReports.length === 0 ? (
                <p className="empty-hint">Brak publicznych raportów ESG.</p>
              ) : (
                <ul className="esg-reports-list">
                  {esgReports.map((report) => (
                    <li key={report.id}>
                      <span>
                        Raport z {formatDate(report.created_at)} — redukcja{' '}
                        <strong>{formatNumber(Number(report.co2_reduction_kg), 0)} kg CO₂</strong>
                      </span>
                      {report.document_url ? (
                        <a href={report.document_url} target="_blank" rel="noopener noreferrer">
                          Pobierz PDF
                        </a>
                      ) : (
                        <span style={{ color: '#999' }}>Brak pliku</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="guest-footer" role="contentinfo">
        <p>&copy; 2026 EnergyCity — Panel publiczny gminy. Dane mają charakter informacyjny.</p>
      </footer>
    </div>
  );
};
