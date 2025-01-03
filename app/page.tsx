'use client';

import CryptoDisplay from '../components/CryptoDisplay';

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Cryptocurrency Analyzer</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <CryptoDisplay />
      </div>
      <div className="mt-8 text-sm text-gray-600">
        Disclaimer: This is not financial advice. Cryptocurrency investments are subject to market risk.
      </div>
    </main>
  );
}
