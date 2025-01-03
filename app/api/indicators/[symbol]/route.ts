import { NextResponse } from 'next/server';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

// Enhanced Rate Limiting
const rateLimit = new Map();
const RATE_LIMIT = 3; // Max requests per minute
const RATE_LIMIT_WINDOW = 1000 * 60; // 1 minute
const MAX_RETRIES = 3;
const BASE_BACKOFF = 1000; // 1 second

interface RateLimitState {
  timestamps: number[];
  retryCount: number;
  lastRetryAt: number;
}

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

interface MACDData {
  MACD: number | null;
  signal: number | null;
  histogram: number | null;
}

interface IndicatorResponse {
  sma: number | null;
  ema: number | null;
  rsi: number | null;
  macd: MACDData;
  error?: string;
}

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  const { symbol } = params;
  
  // Validate symbol
  if (!symbol || typeof symbol !== 'string' || symbol.length < 2 || symbol.length > 10) {
    return NextResponse.json(
      { error: 'Invalid symbol format' },
      { status: 400 }
    );
  }
  
  // Enhanced rate limit check
  const now = Date.now();
  const rateLimitKey = getRateLimitKey(request);
  
  if (!rateLimit.has(rateLimitKey)) {
    rateLimit.set(rateLimitKey, {
      timestamps: [],
      retryCount: 0,
      lastRetryAt: 0
    });
  }
  
  const rateLimitState = rateLimit.get(rateLimitKey);
  rateLimitState.timestamps = rateLimitState.timestamps.filter(
    (timestamp: number) => now - timestamp < RATE_LIMIT_WINDOW
  );
  
  if (rateLimitState.timestamps.length >= RATE_LIMIT) {
    const retryAfter = calculateRetryAfter(rateLimitState.timestamps, now);
    
    // Apply exponential backoff
    if (rateLimitState.retryCount < MAX_RETRIES) {
      rateLimitState.retryCount++;
      rateLimitState.lastRetryAt = now;
      
      const backoff = Math.min(
        BASE_BACKOFF * Math.pow(2, rateLimitState.retryCount),
        30000 // Max 30 seconds
      );
      
      await new Promise((resolve) => setTimeout(resolve, backoff));
      
      // Retry after backoff
      rateLimitState.timestamps = rateLimitState.timestamps.filter(
        (timestamp: number) => now - timestamp < RATE_LIMIT_WINDOW
      );
      
      if (rateLimitState.timestamps.length < RATE_LIMIT) {
        rateLimitState.timestamps.push(now);
        rateLimit.set(rateLimitKey, rateLimitState);
        // Continue with request processing
      } else {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Please wait ${retryAfter} seconds before making another request`,
            retryAfter,
            retryCount: rateLimitState.retryCount
          },
          {
            status: 429,
            headers: getRateLimitHeaders(
              rateLimitState.timestamps,
              RATE_LIMIT,
              now
            )
          }
        );
      }
    } else {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Maximum retries reached. Please wait ${retryAfter} seconds before making another request`,
          retryAfter,
          retryCount: rateLimitState.retryCount
        },
        {
          status: 429,
          headers: getRateLimitHeaders(
            rateLimitState.timestamps,
            RATE_LIMIT,
            now
          )
        }
      );
    }
  }
  
  rateLimitState.timestamps.push(now);
  rateLimit.set(rateLimitKey, rateLimitState);
  
  // Check cache
  const cacheKey = `indicators:${symbol}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (now - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }
  }

  try {
    // Fetch SMA (Simple Moving Average)
    // Retry up to 3 times with exponential backoff
    const fetchWithRetry = async (url: string, retries = 3, backoff = 300) => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res;
      } catch (error) {
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, backoff));
        return fetchWithRetry(url, retries - 1, backoff * 2);
      }
    };

    // Try Alpha Vantage first
    let sma: number | null = null;
    try {
      const smaRes = await fetchWithRetry(
        `https://www.alphavantage.co/query?function=SMA&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      const smaData = await smaRes.json();
      
      if (smaData['Note']) {
        throw new Error(smaData['Note']);
      }
      
      if (smaData['Technical Analysis: SMA']) {
        sma = parseFloat(smaData['Technical Analysis: SMA'][Object.keys(smaData['Technical Analysis: SMA'])[0]].SMA);
      }
    } catch (error) {
      console.error('Alpha Vantage SMA Error:', error);
    }

    // Fetch EMA
    let ema: number | null = null;
    try {
      const emaRes = await fetch(
        `https://www.alphavantage.co/query?function=EMA&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      const emaData = await emaRes.json();
      if (emaData['Technical Analysis: EMA']) {
        ema = parseFloat(emaData['Technical Analysis: EMA'][Object.keys(emaData['Technical Analysis: EMA'])[0]].EMA);
      }
    } catch (error) {
      console.error('Alpha Vantage EMA Error:', error);
    }

    // Fetch RSI
    let rsi: number | null = null;
    try {
      const rsiRes = await fetch(
        `https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      const rsiData = await rsiRes.json();
      if (rsiData['Technical Analysis: RSI']) {
        rsi = parseFloat(rsiData['Technical Analysis: RSI'][Object.keys(rsiData['Technical Analysis: RSI'])[0]].RSI);
      }
    } catch (error) {
      console.error('Alpha Vantage RSI Error:', error);
    }

    // Fetch MACD
    const macd: MACDData = {
      MACD: null,
      signal: null,
      histogram: null
    };
    try {
      const macdRes = await fetch(
        `https://www.alphavantage.co/query?function=MACD&symbol=${symbol}&interval=daily&series_type=close&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      const macdData = await macdRes.json();
      if (macdData['Technical Analysis: MACD']) {
        const latestMACD = macdData['Technical Analysis: MACD'][Object.keys(macdData['Technical Analysis: MACD'])[0]];
        macd.MACD = parseFloat(latestMACD.MACD) || null;
        macd.signal = parseFloat(latestMACD.MACD_Signal) || null;
        macd.histogram = parseFloat(latestMACD.MACD_Hist) || null;
      }
    } catch (error) {
      console.error('Alpha Vantage MACD Error:', error);
    }

    const responseData: IndicatorResponse = {
      sma,
      ema,
      rsi,
      macd
    };

    // If all indicators failed, return error
    if (sma === null && ema === null && rsi === null && macd.MACD === null) {
      responseData.error = 'Unable to fetch indicators for this symbol';
    }
    
    // Update cache
    cache.set(cacheKey, {
      timestamp: now,
      data: responseData
    });
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Alpha Vantage API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch indicators from Alpha Vantage',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
