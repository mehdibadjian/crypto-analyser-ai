'use client';

import { useEffect, useState } from 'react';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface IndicatorData {
  timestamp: number;
  value: number;
}

interface TechnicalIndicatorsProps {
  symbol: string;
}

export default function TechnicalIndicators({ symbol }: TechnicalIndicatorsProps) {
  const [smaData, setSmaData] = useState<IndicatorData[]>([]);
  const [emaData, setEmaData] = useState<IndicatorData[]>([]);
  const [rsiData, setRsiData] = useState<IndicatorData[]>([]);
  const [macdData, setMacdData] = useState<IndicatorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIndicatorData = async () => {
      try {
        const response = await fetch(`/api/indicators/${symbol}`);
        const data = await response.json();

        setSmaData(data.sma);
        setEmaData(data.ema);
        setRsiData(data.rsi);
        setMacdData(data.macd);
      } catch (error) {
        console.error('Error fetching indicator data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIndicatorData();
  }, [symbol]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Technical Indicators',
      },
    },
  };

  const chartData = {
    labels: smaData.map((d) => new Date(d.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'SMA (14)',
        data: smaData.map((d) => d.value),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'EMA (14)',
        data: emaData.map((d) => d.value),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'RSI (14)',
        data: rsiData.map((d) => d.value),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'MACD',
        data: macdData.map((d) => d.value),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
      },
    ],
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {loading ? (
        <div>Loading indicators...</div>
      ) : (
        <Line options={chartOptions} data={chartData} />
      )}
    </div>
  );
}
