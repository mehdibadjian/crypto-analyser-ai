'use client';

import { useEffect, useState, useCallback } from 'react';
import { CryptoDisplay } from '../components/CryptoDisplay';
import { CryptoCurrency } from '../lib/types';
import { getTopTokens } from '../lib/cryptoService';

const CHAINS = [
  { id: 'ethereum-ecosystem', name: 'Ethereum' },
  { id: 'binance-smart-chain', name: 'Binance Smart Chain' },
  { id: 'polygon-ecosystem', name: 'Polygon' },
  { id: 'solana-ecosystem', name: 'Solana' },
  { id: 'arbitrum-ecosystem', name: 'Arbitrum' }
];

export default function Home() {
  const [selectedChain, setSelectedChain] = useState(CHAINS[0].id);
  const [tokens, setTokens] = useState<CryptoCurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadTokens = useCallback(async () => {
    if (!hasMore) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newTokens = await getTopTokens(selectedChain, 20, page);
      setTokens(prev => [...prev, ...newTokens]);
      setHasMore(newTokens.length > 0);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('429')) {
          setError('API rate limit exceeded. Please try again in a minute.');
        } else {
          setError('Failed to fetch tokens. Please try again.');
        }
      }
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loading) {
        return;
      }
      setPage(prev => prev + 1);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading]);

  useEffect(() => {
    // Reset tokens and page when chain changes
    setTokens([]);
    setPage(1);
    setHasMore(true);
    loadTokens();
  }, [selectedChain]);

  useEffect(() => {
    if (page > 1) {
      loadTokens();
    }
  }, [page]);

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Cryptocurrency Analyzer</h1>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokens.map((token) => (
          <CryptoDisplay key={`${token.symbol}-${token.name}`} crypto={token} />
        ))}
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <CryptoDisplay key={`loading-${i}`} />
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Disclaimer: This is not financial advice. Cryptocurrency investments are subject to market
        risk.
      </div>
    </main>
  );
}
