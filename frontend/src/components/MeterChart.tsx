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
import { meterService, MeterType, AggregatedData } from '../services/meterService';
import './MeterChart.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface MeterChartProps {
  meterId: string;
  meterType: MeterType;
  unit: string;
}

export const MeterChart: React.FC<MeterChartProps> = ({ meterId, meterType, unit }) => {
  const [data, setData] = useState<AggregatedData[]>([]);
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
          ? meterService.aggregateReadingsByDay(
              meterId,
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0]
            )
          : meterService.aggregateReadingsByMonth(
              meterId,
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0]
            ));

        setData(response.data);
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

  if (loading) return <div className="meter-chart-loading">Ładowanie...</div>;
  if (error) return <div className="meter-chart-error">{error}</div>;

  const getMeterTypeLabel = (type: MeterType): string => {
    const labels = {
      [MeterType.PRAD]: 'Prąd',
      [MeterType.WODA]: 'Woda',
      [MeterType.CIEPLO]: 'Ciepło',
    };
    return labels[type];
  };

  const getChartColor = (type: MeterType): string => {
    const colors = {
      [MeterType.PRAD]: 'rgb(255, 193, 7)',
      [MeterType.WODA]: 'rgb(33, 150, 243)',
      [MeterType.CIEPLO]: 'rgb(244, 67, 54)',
    };
    return colors[type];
  };

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: `${getMeterTypeLabel(meterType)} - Średnia (${unit})`,
        data: data.map((d) => d.avg),
        borderColor: getChartColor(meterType),
        backgroundColor: getChartColor(meterType) + '20',
        tension: 0.1,
      },
      {
        label: `${getMeterTypeLabel(meterType)} - Suma (${unit})`,
        data: data.map((d) => d.sum),
        borderColor: getChartColor(meterType),
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
        text: `${getMeterTypeLabel(meterType)} - ${timeRange === 'day' ? '30 dni' : 'Ostatni rok'}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: unit,
        },
      },
    },
  };

  return (
    <div className="meter-chart-container">
      <div className="meter-chart-controls">
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
