export interface Indicators {
  sma: number
  ema: number
  rsi: number
  macd: {
    MACD: number
    signal: number
    histogram: number
  }
}
