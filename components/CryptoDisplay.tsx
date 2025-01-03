import { CryptoCurrency } from '../lib/types';
import { useState } from 'react';

interface CryptoDisplayProps {
  crypto?: CryptoCurrency;
}

export function CryptoDisplay({ crypto }: CryptoDisplayProps) {
  const [indicators, setIndicators] = useState<{
    sma?: number;
    ema?: number;
    rsi?: number;
    macd?: {
      MACD: number;
      signal: number;
      histogram: number;
    };
  } | null>(null);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);

  const handleShowIndicators = async () => {
    if (!crypto || indicators !== null) {
      setShowIndicators(true);
      return;
    }

    setLoadingIndicators(true);
    try {
      const response = await fetch(`/api/indicators/${crypto.symbol}`);
      if (!response.ok) throw new Error('Failed to fetch indicators');
      const data = await response.json();
      setIndicators(data);
      setShowIndicators(true);
    } catch (error) {
      console.error('Error fetching indicators:', error);
    } finally {
      setLoadingIndicators(false);
    }
  };

  if (!crypto) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-20 bg-gray-200 rounded mt-1 animate-pulse" />
          </div>
        </div>
        <div className="mt-4">
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 rounded mt-1 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-4">
        <img src={crypto.image} alt={crypto.name} className="w-10 h-10" />
        <div>
          <h2 className="text-xl font-semibold">{crypto.name}</h2>
          <p className="text-gray-500">{crypto.symbol.toUpperCase()}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold">${crypto.current_price.toLocaleString()}</p>
          <p
            className={`text-sm ${
              crypto.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {crypto.price_change_percentage_24h?.toFixed(2)}%
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p>Market Cap</p>
            <p className="font-medium">${crypto.market_cap.toLocaleString()}</p>
          </div>
          <div>
            <p>Volume (24h)</p>
            <p className="font-medium">${crypto.total_volume.toLocaleString()}</p>
          </div>
          <div>
            <p>Circulating Supply</p>
            <p className="font-medium">
              {crypto.circulating_supply.toLocaleString()} {crypto.symbol.toUpperCase()}
            </p>
          </div>
        </div>

        {!showIndicators ? (
          <button
            onClick={handleShowIndicators}
            className="mt-4 w-full py-2 px-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Show Technical Indicators
          </button>
        ) : loadingIndicators ? (
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : (
          indicators && (
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p
                    className="text-gray-500 font-medium"
                    title="Simple Moving Average - Average price over a period"
                  >
                    SMA
                  </p>
                  <p
                    className={`font-semibold ${
                      indicators.sma && crypto.current_price > indicators.sma
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {indicators.sma?.toFixed(2) || 'N/A'}
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p
                    className="text-gray-500 font-medium"
                    title="Exponential Moving Average - Weighted average price"
                  >
                    EMA
                  </p>
                  <p
                    className={`font-semibold ${
                      indicators.ema && crypto.current_price > indicators.ema
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {indicators.ema?.toFixed(2) || 'N/A'}
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p
                    className="text-gray-500 font-medium"
                    title="Relative Strength Index - Momentum indicator (30-70 range)"
                  >
                    RSI
                  </p>
                  <p
                    className={`font-semibold ${
                      indicators.rsi
                        ? indicators.rsi > 70
                          ? 'text-red-600'
                          : indicators.rsi < 30
                            ? 'text-green-600'
                            : 'text-gray-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {indicators.rsi?.toFixed(0) || 'N/A'}
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p
                    className="text-gray-500 font-medium"
                    title="Moving Average Convergence Divergence - Trend indicator"
                  >
                    MACD
                  </p>
                  <p
                    className={`font-semibold ${
                      indicators.macd
                        ? indicators.macd.MACD > indicators.macd.signal
                          ? 'text-green-600'
                          : 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {indicators.macd ? `${indicators.macd?.MACD?.toFixed(2)}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
