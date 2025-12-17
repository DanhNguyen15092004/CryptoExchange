import { useState, useMemo, useCallback } from 'react'
import CryptoChart from './components/CryptoChart'
import { useBybitWebSocket } from './hooks/useBybitWebSocket'

function App() {
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [timeframe, setTimeframe] = useState('1')

  // Connect to Bybit WebSocket for real-time data
  const {
    chartData,
    currentPrice,
    priceChange24h,
    volume24h,
    connectionStatus,
    error,
  } = useBybitWebSocket(symbol, timeframe)

  // Handle chart errors (memoized to prevent re-renders)
  const handleChartError = useCallback((errorMsg) => {
    console.error('Chart error:', errorMsg)
  }, [])

  const cryptoList = useMemo(() => [
    { symbol: 'BTCUSDT', name: 'Bitcoin', icon: '₿' },
    { symbol: 'ETHUSDT', name: 'Ethereum', icon: 'Ξ' },
    { symbol: 'SOLUSDT', name: 'Solana', icon: '◎' },
  ], [])

  // Timeframe options for Bybit
  const timeframes = useMemo(() => [
    { value: '1', label: '1m' },
    { value: '3', label: '3m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '30', label: '30m' },
    { value: '60', label: '1h' },
    { value: '240', label: '4h' },
    { value: 'D', label: '1D' },
  ], [])

  // Connection status indicator
  const statusColor = useMemo(() => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500 animate-pulse'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }, [connectionStatus])

  const loading = chartData.length === 0 && connectionStatus !== 'error'

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Crypto Price Charts
              </h1>
              <p className="text-slate-400 text-sm md:text-base">Real-time data from Bybit WebSocket</p>
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
              <div className={`w-2 h-2 rounded-full ${statusColor}`} />
              <span className="text-xs text-slate-400 capitalize hidden md:inline">
                {connectionStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Crypto Selector */}
        <div className="mb-6 flex gap-2 md:gap-3 flex-wrap">
          {cryptoList.map((crypto) => (
            <button
              key={crypto.symbol}
              onClick={() => setSymbol(crypto.symbol)}
              disabled={loading}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                symbol === crypto.symbol
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <span className="mr-1">{crypto.icon}</span>
              {crypto.name}
              <span className="ml-2 text-xs text-slate-400 hidden md:inline">{crypto.symbol}</span>
            </button>
          ))}
        </div>

        {/* Timeframe Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 font-medium">Timeframe:</span>
            <div className="flex gap-2 flex-wrap">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    timeframe === tf.value
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-500 rounded-lg p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <span className="text-red-400 text-xl">⚠️</span>
              <div>
                <p className="text-red-200 font-semibold">Connection Error</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
                <p className="text-red-400 text-xs mt-2">
                  Checking Bybit WebSocket connection...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chart Container */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-4 md:p-6 border border-slate-700">
          <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                {cryptoList.find(c => c.symbol === symbol)?.icon} {symbol}
              </h2>
              <div className="text-xs text-slate-400 mt-1">
                Live from Bybit • {timeframes.find(t => t.value === timeframe)?.label}
              </div>
            </div>
            
            {currentPrice && (
              <div className="text-left md:text-right">
                <div className="text-xs md:text-sm text-slate-400">Current Price</div>
                <div className="text-2xl md:text-3xl font-bold text-green-400">
                  ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-sm font-semibold ${priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {priceChange24h >= 0 ? '↑' : '↓'} {Math.abs(priceChange24h).toFixed(2)}% (24h)
                </div>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-96 md:h-[500px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-slate-400">Connecting to Bybit...</p>
                <p className="text-slate-500 text-sm mt-2">Loading {symbol} data</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-96 md:h-[500px]">
              <div className="text-center">
                <p className="text-slate-400 text-lg">📊 No chart data available</p>
                <p className="text-slate-500 text-sm mt-2">Waiting for data from Bybit...</p>
              </div>
            </div>
          ) : (
            <CryptoChart 
              symbol={symbol} 
              data={chartData} 
              onError={handleChartError}
            />
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6">
          <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700 hover:border-blue-500/50 transition-colors">
            <div className="text-slate-400 text-xs md:text-sm mb-2">Current Price</div>
            <div className="text-xl md:text-2xl font-bold text-blue-400">
              {currentPrice ? `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
            </div>
            {currentPrice && (
              <div className="text-xs text-slate-500 mt-1">
                Real-time from Bybit
              </div>
            )}
          </div>
          
          <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700 hover:border-purple-500/50 transition-colors">
            <div className="text-slate-400 text-xs md:text-sm mb-2">24h Change</div>
            <div className={`text-xl md:text-2xl font-bold ${priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {currentPrice ? `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%` : '-'}
            </div>
            {currentPrice && (
              <div className="text-xs text-slate-500 mt-1">
                {priceChange24h >= 0 ? 'Bullish' : 'Bearish'} trend
              </div>
            )}
          </div>
          
          <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700 hover:border-green-500/50 transition-colors">
            <div className="text-slate-400 text-xs md:text-sm mb-2">24h Volume</div>
            <div className="text-xl md:text-2xl font-bold text-purple-400">
              {volume24h ? `$${(volume24h / 1000000).toFixed(2)}M` : '-'}
            </div>
            {volume24h && (
              <div className="text-xs text-slate-500 mt-1">
                Trading volume
              </div>
            )}
          </div>
        </div>

        {/* Chart Info */}
        <div className="mt-6 bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span>🔌 WebSocket: Bybit</span>
              <span className="hidden md:inline">📊 Candles: {chartData.length}</span>
              <span className="font-semibold text-blue-400">📈 {timeframes.find(t => t.value === timeframe)?.label}</span>
            </div>
            <div>
              <span className="text-slate-500">
                Status: <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-yellow-400'}>
                  {connectionStatus}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
