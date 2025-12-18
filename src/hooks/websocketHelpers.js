// Constants
export const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000]
export const MAX_RECONNECT_ATTEMPTS = 10
export const BATCH_INTERVAL = 100
export const PING_INTERVAL = 20000

export const TIMEFRAME_INTERVALS = {
  '1': 1,
  '3': 3,
  '5': 5,
  '15': 15,
  '30': 30,
  '60': 60,
  '120': 120,
  '240': 240,
  'D': 1440,
}

// Helper functions
export const processKlineData = (kline) => ({
  time: Math.floor(kline.start / 1000),
  open: parseFloat(kline.open),
  high: parseFloat(kline.high),
  low: parseFloat(kline.low),
  close: parseFloat(kline.close),
  volume: parseFloat(kline.volume),
})

export const createWebSocketMessage = (op, args) => 
  JSON.stringify({ op, args })

export const calculatePriceChange = (currentPrice, firstPrice) => 
  ((currentPrice - firstPrice) / firstPrice) * 100

export const calculateVolume = (klines) => 
  klines.reduce((sum, k) => sum + (k.volume * k.close), 0)
