import { NextResponse } from 'next/server';

// Rate limiting configuration
const RATE_LIMIT = 3; // Max requests per minute
const RATE_LIMIT_WINDOW = 1000 * 60; // 1 minute
const MAX_RETRIES = 3;
const BASE_BACKOFF = 1000; // 1 second

// Rate limit tracking
const rateLimit = new Map<string, number[]>();

function getRateLimitKey(request: Request): string {
  const apiKey = request.headers.get('x-api-key') || 'default';
  const clientIP = request.headers.get('x-forwarded-for') || 'default';
  return `${apiKey}:${clientIP}`;
}

function calculateRetryAfter(requests: number[], now: number): number {
  const oldestRequest = requests[0];
  return Math.ceil((RATE_LIMIT_WINDOW - (now - oldestRequest)) / 1000);
}

function getRateLimitHeaders(
  requests: number[],
  limit: number,
  now: number
): Record<string, string> {
  const remaining = Math.max(0, limit - requests.length);
  const resetTime = requests.length > 0 ? requests[0] + RATE_LIMIT_WINDOW : now;
  
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString()
  };
}

interface CoinData {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  platforms?: Record<string, string>;
  chain?: string;
  insights?: {
    buyRating: number;
    sellRating: number;
    reasons: string[];
  };
}

function generateInsights(coin: CoinData) {
  const buyRating = Math.min(
    5,
    Math.max(
      1,
      Math.round(
        (coin.price_change_percentage_24h > 0 ? 3 : 1) +
          (coin.total_volume > 100000000 ? 2 : 0) +
          (coin.market_cap > 1000000000 ? 1 : 0)
      )
    )
  );

  const sellRating = Math.min(
    5,
    Math.max(
      1,
      Math.round(
        (coin.price_change_percentage_24h < 0 ? 3 : 1) +
          (coin.total_volume > 100000000 ? 1 : 0) +
          (coin.market_cap > 1000000000 ? 1 : 0)
      )
    )
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

export async function GET(request: Request) {
  // Rate limit check
  const now = Date.now();
  const rateLimitKey = getRateLimitKey(request);
  
  if (!rateLimit.has(rateLimitKey)) {
    rateLimit.set(rateLimitKey, []);
  }
  
  let requests = rateLimit.get(rateLimitKey)!;
  requests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (requests.length >= RATE_LIMIT) {
    const retryAfter = calculateRetryAfter(requests, now);
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Please wait ${retryAfter} seconds before making another request`
      },
      {
        status: 429,
        headers: getRateLimitHeaders(requests, RATE_LIMIT, now)
      }
    );
  }
  
  requests.push(now);
  rateLimit.set(rateLimitKey, requests);
  
  try {
    // Using CoinGecko's free API with pagination
    const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
    const searchParams = new URLSearchParams({
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: '10',
      page: '1',
      sparkline: 'false'
    });
    
    // Get and validate pagination params from request URL
    const { searchParams: requestParams } = new URL(request.url);
    
    // Validate page number
    let page = parseInt(requestParams.get('page') || '1');
    page = isNaN(page) || page < 1 ? 1 : Math.min(page, 10); // Max 10 pages
    
    // Validate per_page value
    let perPage = parseInt(requestParams.get('per_page') || '10');
    perPage = isNaN(perPage) || perPage < 1 ? 10 : Math.min(perPage, 100); // Max 100 items
    
    searchParams.set('page', page.toString());
    searchParams.set('per_page', perPage.toString());

    const response = await fetch(`${url.toString()}?${searchParams.toString()}`, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cryptocurrency data');
    }

    const data: CoinData[] = await response.json();
    
    // Add pagination metadata to response
    const totalPages = Math.ceil(100 / Number(perPage)); // CoinGecko returns max 100 results

    const result = {
      data: data.map((coin) => {
        const insights = generateInsights(coin);
        return {
          name: coin.name,
          symbol: coin.symbol,
          price: coin.current_price,
          priceChange24h: coin.price_change_percentage_24h,
          volume24h: coin.total_volume,
          marketCap: coin.market_cap,
          lastUpdated: new Date().toISOString(),
          insights: insights
        };
      }),
      pagination: {
        currentPage: Number(page),
        perPage: Number(perPage),
        totalPages: Math.ceil(100 / Number(perPage)), // CoinGecko returns max 100 results
        totalItems: 100
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cryptocurrency data' }, { status: 500 });
  }
}
