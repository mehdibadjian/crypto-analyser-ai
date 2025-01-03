import { CryptoCurrency } from './types';

const API_URL = 'https://api.coingecko.com/api/v3';

export async function getTopTokens(
  chain: string,
  limit: number = 10,
  page: number = 1
): Promise<CryptoCurrency[]> {
  try {
    const url = new URL(`${API_URL}/coins/markets`);
    // url.searchParams.set('category', chain);
    url.searchParams.set('vs_currency', 'usd');
    url.searchParams.set('order', 'market_cap_desc');
    const validatedLimit = limit;
    const validatedPage = Math.max(1, Number(page));
    url.searchParams.set('per_page', validatedLimit.toString());
    url.searchParams.set('page', validatedPage.toString());
    url.searchParams.set('sparkline', 'false');
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    return data.map((token: any) => ({
      name: token.name,
      symbol: token.symbol,
      image: token.image,
      current_price: token.current_price,
      price_change_percentage_24h: token.price_change_percentage_24h,
      market_cap: token.market_cap,
      total_volume: token.total_volume,
      circulating_supply: token.circulating_supply,
    }));
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    throw new Error('Failed to fetch tokens');
  }
}
