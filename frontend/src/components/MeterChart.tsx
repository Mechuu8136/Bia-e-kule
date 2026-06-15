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
  meterService,
  MeterType,
  AggregatedData,
  MeterStatistics,
} from '../services/meterService';
import { formatChartDate, formatNumber } from '../utils/chartFormatters';
import './MeterChart.css';

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

interface MeterChartProps {
  meterId: string;
  meterType: MeterType;
  unit: string;
  detailedMode?: boolean;
}

const METER_LABELS: Record<MeterType, string> = {
  [MeterType.PRAD]: 'Prąd',
  [MeterType.WODA]: 'Woda',
  [MeterType.CIEPLO]: 'Ciepło',
};

const METER_COLORS: Record<MeterType, string> = {
  [MeterType.PRAD]: 'rgb(255, 193, 7)',
  [MeterType.WODA]: 'rgb(33, 150, 243)',
  [MeterType.CIEPLO]: 'rgb(244, 67, 54)',
};

export const MeterChart: React.FC<MeterChartProps> = ({
  meterId,
  meterType,
  unit,
  detailedMode = false,
}) => {
  const [data, setData] = useState<AggregatedData[]>([]);
  const [statistics, setStatistics] = useState<MeterStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'month'>(
    detailedMode ? 'day' : 'month',
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const endDate = new Date();
        const startDate = new Date();

        if (timeRange === 'hour') {
          startDate.setDate(endDate.getDate() - 7);
        } else if (timeRange === 'day') {
          startDate.setDate(endDate.getDate() - 30);
        } else {
          startDate.setFullYear(endDate.getFullYear() - 1);
        }

        const start = startDate.toISOString();
        const end = endDate.toISOString();

        const chartRequest =
          timeRange === 'hour'
            ? meterService.aggregateReadingsByHour(meterId, start, end)
            : timeRange === 'day'
              ? meterService.aggregateReadingsByDay(meterId, start.split('T')[0], end.split('T')[0])
              : meterService.aggregateReadingsByMonth(meterId, start.split('T')[0], end.split('T')[0]);

        const [chartResponse, statsResponse] = await Promise.all([
          chartRequest,
          meterService.getMeterStatistics(meterId),
        ]);

        setData(chartResponse.data);
        setStatistics(statsResponse.data);
        setError(null);
      } catch (err) {
        setError('Błąd przy ładowaniu danych');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [meterId, timeRange]);

  if (loading) {
    return (
      <div className="meter-chart-loading" role="status" aria-live="polite">
        Ładowanie wykresu...
      </div>
    );
  }

  if (error) {
    return (
      <div className="meter-chart-error" role="alert">
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="meter-chart-empty" role="status">
        Brak odczytów w wybranym okresie
      </div>
    );
  }

  const color = METER_COLORS[meterType];
  const typeLabel = METER_LABELS[meterType];
  const rangeLabel =
    timeRange === 'hour' ? 'ostatnie 7 dni (godzinowo)' : timeRange === 'day' ? 'ostatnie 30 dni' : 'ostatni rok';

  const chartData = {
    labels: data.map((d) => formatChartDate(d.date, timeRange)),
    datasets: [
      {
        label: `Średnie zużycie (${unit})`,
        data: data.map((d) => d.avg),
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.15)'),
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: `Suma zużycia (${unit})`,
        data: data.map((d) => d.sum),
        borderColor: color,
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
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${typeLabel} — ${rangeLabel}`,
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem: TooltipItem<'line'>) => {
            const value = tooltipItem.parsed.y;
            if (value == null) return '';
            return `${tooltipItem.dataset.label}: ${formatNumber(value)} ${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: unit,
        },
        ticks: {
          callback: (value: string | number) => formatNumber(Number(value)),
        },
      },
    },
  };

  return (
    <div className="meter-chart-container">
      {statistics && statistics.totalReadings > 0 && (
        <div className="meter-stats" aria-label="Statystyki licznika">
          <div className="stat-item">
            <span className="stat-label">Średnia</span>
            <span className="stat-value">{formatNumber(statistics.avgValue)} {unit}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Min</span>
            <span className="stat-value">{formatNumber(statistics.minValue)} {unit}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Max</span>
            <span className="stat-value">{formatNumber(statistics.maxValue)} {unit}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Odczyty</span>
            <span className="stat-value">{statistics.totalReadings}</span>
          </div>
        </div>
      )}

      <div className="meter-chart-controls" role="group" aria-label="Zakres czasu wykresu">
        {detailedMode && (
          <button
            type="button"
            className={`btn-range ${timeRange === 'hour' ? 'btn-active' : ''}`}
            onClick={() => setTimeRange('hour')}
            aria-pressed={timeRange === 'hour'}
          >
            Godzinowo
          </button>
        )}
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

      <div role="img" aria-label={`Wykres zużycia ${typeLabel} za ${rangeLabel}`}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};
