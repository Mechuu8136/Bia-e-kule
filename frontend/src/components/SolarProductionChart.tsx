import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem,
} from 'chart.js';
import {
  solarService,
  AggregatedProduction,
  ProductionStatistics,
} from '../services/solarService';
import { formatChartDate, formatNumber } from '../utils/chartFormatters';
import './SolarProductionChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SOLAR_COLOR = 'rgb(255, 143, 0)';

interface SolarProductionChartProps {
  panelId: string;
  panelCapacity: number;
}

export const SolarProductionChart: React.FC<SolarProductionChartProps> = ({
  panelId,
  panelCapacity,
}) => {
  const [data, setData] = useState<AggregatedProduction[]>([]);
  const [statistics, setStatistics] = useState<ProductionStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'month'>('month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const endDate = new Date();
        const startDate = new Date();

        if (timeRange === 'day') {
          startDate.setDate(endDate.getDate() - 30);
        } else {
          startDate.setFullYear(endDate.getFullYear() - 1);
        }

        const start = startDate.toISOString().split('T')[0];
        const end = endDate.toISOString().split('T')[0];

        const [chartResponse, statsResponse] = await Promise.all([
          timeRange === 'day'
            ? solarService.aggregateProductionByDay(panelId, start, end)
            : solarService.aggregateProductionByMonth(panelId, start, end),
          solarService.getProductionStatistics(panelId),
        ]);

        setData(chartResponse.data);
        setStatistics(statsResponse.data);
        setError(null);
      } catch (err) {
        setError('Błąd przy ładowaniu danych produkcji');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [panelId, timeRange]);

  if (loading) {
    return (
      <div className="solar-chart-loading" role="status" aria-live="polite">
        Ładowanie wykresu produkcji...
      </div>
    );
  }

  if (error) {
    return (
      <div className="solar-chart-error" role="alert">
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="solar-chart-empty" role="status">
        Brak danych produkcji w wybranym okresie
      </div>
    );
  }

  const rangeLabel = timeRange === 'day' ? 'ostatnie 30 dni' : 'ostatni rok';
  const periodTotal = data.reduce((sum, d) => sum + d.totalProduction, 0);
  const periodAvg = data.length > 0 ? periodTotal / data.length : 0;

  const chartData = {
    labels: data.map((d) => formatChartDate(d.date, timeRange)),
    datasets: [
      {
        label: 'Średnia produkcja (kWh)',
        data: data.map((d) => d.avgProduction),
        borderColor: SOLAR_COLOR,
        backgroundColor: 'rgba(255, 143, 0, 0.15)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Suma produkcji (kWh)',
        data: data.map((d) => d.totalProduction),
        borderColor: SOLAR_COLOR,
        borderDash: [6, 4],
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.2,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: `Produkcja energii — ${rangeLabel} (moc: ${panelCapacity} kWp)`,
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: TooltipItem<'line'>) => {
            const value = tooltipItem.parsed.y;
            if (value == null) return '';
            return `${tooltipItem.dataset.label}: ${formatNumber(value)} kWh`;
          },
        },
      },
    },
    scales: {
      x: { ticks: { maxRotation: 45, minRotation: 0 } },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'kWh' },
        ticks: {
          callback: (value: string | number) => formatNumber(Number(value)),
        },
      },
    },
  };

  return (
    <div className="solar-production-chart">
      <div className="solar-chart-stats" aria-label="Statystyki produkcji">
        <div className="stat-card">
          <span className="stat-label">Produkcja w okresie</span>
          <span className="stat-value">{formatNumber(periodTotal)} kWh</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Średnia w okresie</span>
          <span className="stat-value">{formatNumber(periodAvg)} kWh</span>
        </div>
        {statistics && statistics.totalReadings > 0 && (
          <>
            <div className="stat-card">
              <span className="stat-label">Suma całkowita</span>
              <span className="stat-value">{formatNumber(statistics.totalProduction)} kWh</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Rekord dzienny</span>
              <span className="stat-value">{formatNumber(statistics.maxProduction)} kWh</span>
            </div>
          </>
        )}
      </div>

      <div className="solar-chart-controls" role="group" aria-label="Zakres czasu wykresu">
        <button
          type="button"
          className={`btn-range ${timeRange === 'day' ? 'btn-active' : ''}`}
          onClick={() => setTimeRange('day')}
          aria-pressed={timeRange === 'day'}
        >
          30 dni
        </button>
        <button
          type="button"
          className={`btn-range ${timeRange === 'month' ? 'btn-active' : ''}`}
          onClick={() => setTimeRange('month')}
          aria-pressed={timeRange === 'month'}
        >
          Rok
        </button>
      </div>

      <div role="img" aria-label={`Wykres produkcji energii za ${rangeLabel}`}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};
