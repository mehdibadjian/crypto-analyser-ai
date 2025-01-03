'use client';

import { useState, useEffect } from 'react';

interface CryptoData {
  name: string;
  symbol: string;
  price: number;
  priceChange24h?: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
  chain: string;
  insights: {
    buyRating: number; // 1-5
    sellRating: number; // 1-5
    reasons: string[];
  };
}

export default function CryptoDisplay() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [sortBy, setSortBy] = useState<'price' | 'volume' | 'change' | 'gainer' | 'loser'>('volume');
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/crypto');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
        if (!data || typeof data !== 'object') {
          console.error('Invalid API response format:', data);
          throw new Error('Invalid API response format');
        }
        
        // Validate response structure
        if (!Array.isArray(data)) {
          console.error('Invalid API response format:', data);
          throw new Error('Expected array of cryptocurrency data');
        }
        
        // Validate each coin's data
        const validData = data.filter(coin => 
          typeof coin?.volume24h === 'number' &&
          typeof coin?.marketCap === 'number' &&
          typeof coin?.price === 'number' &&
          typeof coin?.priceChange24h === 'number'
        );
        
        if (validData.length === 0) {
          throw new Error('No valid cryptocurrency data found');
        }
        
        setCryptoData(validData);
      } catch (err: any) {
        console.error('Fetch error:', {
          message: err?.message,
          stack: err?.stack,
          response: err?.response
        });
        setError(err?.message || 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3600000); // Refresh every hour
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading cryptocurrency data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!cryptoData || cryptoData.length === 0) return <div>No data available</div>;

  // Sort the data based on current sortBy state
  // Filter and sort data
  const filteredData = cryptoData.filter(coin => 
    selectedChain === 'all' || coin.chain === selectedChain
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'price') return b.price - a.price;
    if (sortBy === 'volume') return b.volume24h - a.volume24h;
    if (sortBy === 'gainer') return (b.priceChange24h ?? 0) - (a.priceChange24h ?? 0);
    if (sortBy === 'loser') return (a.priceChange24h ?? 0) - (b.priceChange24h ?? 0);
    return (b.priceChange24h ?? 0) - (a.priceChange24h ?? 0);
  });

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Top Cryptocurrencies</h1>
      
      <div className="mb-4 flex gap-4 flex-wrap">
        <div>
          <label className="mr-2">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'price' | 'volume' | 'change' | 'gainer' | 'loser')}
            className="p-2 border rounded"
          >
            <option value="volume">Volume</option>
            <option value="price">Price</option>
            <option value="change">24h Change</option>
            <option value="gainer">Top Gainer</option>
            <option value="loser">Top Loser</option>
          </select>
        </div>
        <div>
          <label className="mr-2">Filter by Chain:</label>
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">All Chains</option>
            <option value="ethereum">Ethereum</option>
            <option value="binance-smart-chain">Binance</option>
            <option value="polygon-pos">Polygon</option>
            <option value="solana">Solana</option>
            <option value="avalanche">Avalanche</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedData.map((coin) => (
          <div key={coin.symbol} className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">
              {coin.name} ({coin.symbol.toUpperCase()})
            </h2>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">Chain:</span>
                <span className="capitalize">{coin.chain.replace(/-/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Price:</span>
                <span>${coin.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">24h Change:</span>
                <span className={`${coin.priceChange24h === undefined ? 'text-gray-600' : (coin.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600')}`}>
                  {coin.priceChange24h?.toFixed(2) ?? 'N/A'}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Volume:</span>
                <span>${coin.volume24h?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Market Cap:</span>
                <span>${coin.marketCap.toLocaleString()}</span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between">
                  <span className="font-medium">Buy Rating:</span>
                  <span className="flex items-center">
                    {Array.from({ length: coin.insights.buyRating }).map((_, i) => (
                      <span key={i} className="text-green-500">★</span>
                    ))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sell Rating:</span>
                  <span className="flex items-center">
                    {Array.from({ length: coin.insights.sellRating }).map((_, i) => (
                      <span key={i} className="text-red-500">★</span>
                    ))}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-sm">
                <div className="font-medium">Insights:</div>
                <ul className="list-disc list-inside">
                  {coin.insights.reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Last updated: {new Date(coin.lastUpdated).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-xs text-gray-400">
        Disclaimer: This is not financial advice. Cryptocurrency investments are subject to market risks.
      </div>
    </div>
  );
}
