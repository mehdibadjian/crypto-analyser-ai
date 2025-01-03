import { NextResponse } from 'next/server';

interface CoinData {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  platforms?: Record<string, string>;
}

const CHAINS = ['ethereum', 'binance-smart-chain', 'polygon-pos', 'solana', 'avalanche'];

function generateInsights(coin: CoinData) {
  const buyRating = Math.min(
    5,
    Math.max(
      1,
      Math.round(
        (coin.price_change_percentage_24h > 0 ? 3 : 1) +
          (coin.total_volume > 100000000 ? 2 : 0) +
          (coin.market_cap > 1000000000 ? 1 : 0),
      ),
    ),
  );

  const sellRating = Math.min(
    5,
    Math.max(
      1,
      Math.round(
        (coin.price_change_percentage_24h < 0 ? 3 : 1) +
          (coin.total_volume > 100000000 ? 1 : 0) +
          (coin.market_cap > 1000000000 ? 1 : 0),
      ),
    ),
  );

  const reasons = [];
  if (coin.price_change_percentage_24h > 5) {
    reasons.push('Strong positive momentum');
  } else if (coin.price_change_percentage_24h < -5) {
    reasons.push('Significant price drop');
  }
  if (coin.total_volume > 100000000) {
    reasons.push('High trading volume');
  }
  if (coin.market_cap > 1000000000) {
    reasons.push('Large market cap');
  }

  return {
    buyRating,
    sellRating,
    reasons: reasons.length > 0 ? reasons : ['Neutral market activity'],
  };
}

export async function GET() {
  try {
    const allCoins = [];

    // Fetch data for each chain
    for (const chain of CHAINS) {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false`,
        {
          next: { revalidate: 3600 }, // Revalidate every hour
        },
      );

      if (!response.ok) {
        console.error(`Failed to fetch data for chain ${chain}`);
        continue;
      }

      const data: CoinData[] = await response.json();

      // Add chain information and insights
      const chainCoins = data.map((coin) => ({
        ...coin,
        chain,
        insights: generateInsights(coin),
      }));

      allCoins.push(...chainCoins);
    }

    // Sort all coins by market cap
    const sortedCoins = allCoins.sort((a, b) => b.market_cap - a.market_cap);

    const result = sortedCoins.map((coin) => ({
      name: coin.name,
      symbol: coin.symbol,
      price: coin.current_price,
      priceChange24h: coin.price_change_percentage_24h,
      volume24h: coin.total_volume,
      marketCap: coin.market_cap,
      lastUpdated: new Date().toISOString(),
      chain: coin.chain,
      insights: coin.insights,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cryptocurrency data' }, { status: 500 });
  }
}
