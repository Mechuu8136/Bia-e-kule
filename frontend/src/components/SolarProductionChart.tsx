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
} from 'chart.js';
import { solarService, AggregatedProduction } from '../services/solarService';
import './SolarProductionChart.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface SolarProductionChartProps {
  panelId: string;
  panelCapacity: number;
}

export const SolarProductionChart: React.FC<SolarProductionChartProps> = ({
  panelId,
  panelCapacity,
}) => {
  const [data, setData] = useState<AggregatedProduction[]>([]);
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

        const response = await (timeRange === 'day'
          ? solarService.aggregateProductionByDay(
              panelId,
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0]
            )
          : solarService.aggregateProductionByMonth(
              panelId,
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0]
            ));

        setData(response.data);
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

  if (loading) return <div className="solar-chart-loading">Ładowanie...</div>;
  if (error) return <div className="solar-chart-error">{error}</div>;

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: 'Produkcja (kWh) - Średnia',
        data: data.map((d) => d.avgProduction),
        borderColor: 'rgb(255, 193, 7)',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Produkcja (kWh) - Suma',
        data: data.map((d) => d.totalProduction),
        borderColor: 'rgb(255, 193, 7)',
        borderDash: [5, 5],
        backgroundColor: 'transparent',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Produkcja energii (${timeRange === 'day' ? '30 dni' : 'Ostatni rok'}) - Moc: ${panelCapacity} kWp`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'kWh',
        },
      },
    },
  };

  const totalProduction = data.reduce((sum, d) => sum + d.totalProduction, 0);
  const avgProduction = data.length > 0 ? data.reduce((sum, d) => sum + d.avgProduction, 0) / data.length : 0;

  return (
    <div className="solar-production-chart">
      <div className="solar-chart-stats">
        <div className="stat-card">
          <span className="stat-label">Całkowita produkcja</span>
          <span className="stat-value">{totalProduction.toFixed(2)} kWh</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Średnia produkcja</span>
          <span className="stat-value">{avgProduction.toFixed(2)} kWh</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Moc paneli</span>
          <span className="stat-value">{panelCapacity} kWp</span>
        </div>
      </div>

      <div className="solar-chart-controls">
        <button
          className={`btn ${timeRange === 'day' ? 'btn-active' : ''}`}
          onClick={() => setTimeRange('day')}
        >
          30 dni
        </button>
        <button
          className={`btn ${timeRange === 'month' ? 'btn-active' : ''}`}
          onClick={() => setTimeRange('month')}
        >
          Rok
        </button>
      </div>

      <Line data={chartData} options={options} />
    </div>
  );
};
