'use client';
import { useEffect, useState } from 'react';
import { Indicators } from '@lib/types/indicators';

export default function IndicatorsPage() {
  const [indicators, setIndicators] = useState<Indicators | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIndicators() {
      try {
        const response = await fetch('/api/indicators/BTC');
        if (!response.ok) {
          throw new Error('Failed to fetch indicators');
        }
        const data: Indicators = await response.json();
        setIndicators(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchIndicators();
  }, []);

  if (loading) return <div>Loading indicators...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!indicators) return <div>No indicator data available</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Technical Indicators</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <IndicatorCard title="SMA" value={indicators.sma} />
        <IndicatorCard title="EMA" value={indicators.ema} />
        <IndicatorCard title="RSI" value={indicators.rsi} />
        <IndicatorCard title="MACD" value={indicators.macd} />
      </div>
    </div>
  );
}

interface IndicatorCardProps {
  title: string;
  value: number | { MACD: number; signal: number; histogram: number };
}

function IndicatorCard({ title, value }: IndicatorCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-gray-600 dark:text-gray-400">
        {typeof value === 'number'
          ? value.toFixed(2)
          : value
            ? `MACD: ${value.MACD?.toFixed(2) ?? 'N/A'}, Signal: ${value.signal?.toFixed(2) ?? 'N/A'}, Hist: ${value.histogram?.toFixed(2) ?? 'N/A'}`
            : 'No data available'}
      </p>
    </div>
  );
}
