import { useState, useCallback, useEffect } from 'react'
import CryptoChart from './components/CryptoChart'
import ConnectionStatus from './components/ConnectionStatus'
import SymbolSelector from './components/SymbolSelector'
import TimeframeSelector from './components/TimeframeSelector'
import ErrorAlert from './components/ErrorAlert'
import PriceCard from './components/PriceCard'
import LoadingSpinner from './components/LoadingSpinner'
import AuthModal from './components/AuthModal'
import TradingPanel from './components/TradingPanel'
import Portfolio from './components/Portfolio'
import PendingOrders from './components/PendingOrders'
import { useServerWebSocket } from './hooks/useServerWebSocket'
import { AuthProvider, useAuth } from './contexts/AuthContext'

const TIMEFRAMES = [
  { value: '1', label: '1m' },
  { value: '3', label: '3m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
  { value: 'D', label: '1D' },
]

function MainApp() {
  const { user, logout, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalView, setAuthModalView] = useState('login');
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [refreshPendingOrders, setRefreshPendingOrders] = useState(0);
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [timeframe, setTimeframe] = useState('1')
  const [cryptoList, setCryptoList] = useState([
    { symbol: 'BTCUSDT', name: 'Bitcoin', icon: '₿' },
    { symbol: 'ETHUSDT', name: 'Ethereum', icon: 'Ξ' },
    { symbol: 'BNBUSDT', name: 'BNB', icon: '◆' },
    { symbol: 'SOLUSDT', name: 'Solana', icon: '◎' },
  ])

  const { chartData, currentPrice, priceChange24h, volume24h, connectionStatus, error } = 
    useServerWebSocket(symbol, timeframe)

  useEffect(() => {
    fetch('https://busticket.ink/api/price/symbols')
      .then(res => res.json())
      .then(data => {
        setCryptoList(data)
        console.log('📊 Available symbols:', data)
      })
      .catch(err => console.error('Error fetching symbols:', err))
  }, [])

  const handleChartError = useCallback((errorMsg) => {
    console.error('Chart error:', errorMsg)
  }, [])

  const openLoginModal = () => {
    setAuthModalView('login');
    setShowAuthModal(true);
  };

  const openRegisterModal = () => {
    setAuthModalView('register');
    setShowAuthModal(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner symbol="AUTH" />
      </div>
    );
  }

  const loading = chartData.length === 0 && connectionStatus !== 'error'
  const currentSymbol = cryptoList.find(c => c.symbol === symbol)
  const currentTimeframe = TIMEFRAMES.find(t => t.value === timeframe)

  const formatPrice = (price) => 
    price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const formatVolume = (volume) => 
    volume ? `$${(volume / 1000000).toFixed(2)}M` : '-'

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Crypto Exchange
            </h1>
            <p className="text-slate-400 text-sm md:text-base">
              Real-time data via SignalR from Server
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="text-right hidden md:block">
                  <div className="text-xs text-slate-400">Xin chào</div>
                  <div className="text-sm font-semibold text-blue-400">{user.email}</div>
                </div>
                <button
                  onClick={() => setShowPortfolio(true)}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition font-medium text-sm flex items-center gap-2"
                >
                  <span>💼</span>
                  <span className="hidden sm:inline">Portfolio</span>
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium text-sm"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={openLoginModal}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-medium text-sm"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={openRegisterModal}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition font-medium text-sm"
                >
                  Đăng ký
                </button>
              </>
            )}
            <ConnectionStatus status={connectionStatus} />
          </div>
        </header>

        {/* Symbol Selector */}
        <SymbolSelector 
          symbols={cryptoList} 
          selected={symbol} 
          onSelect={setSymbol} 
          disabled={loading} 
        />

        {/* Timeframe Selector */}
        <TimeframeSelector 
          timeframes={TIMEFRAMES} 
          selected={timeframe} 
          onSelect={setTimeframe} 
          disabled={loading} 
        />

        {/* Error Alert */}
        {error && <ErrorAlert message={error} />}

        {/* Chart and Trading Container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Trading Panel - Left Side */}
          <div className="lg:col-span-1 order-2 lg:order-1 space-y-6">
            <TradingPanel 
              symbol={symbol} 
              currentPrice={currentPrice}
              onOrderPlaced={() => setRefreshPendingOrders(prev => prev + 1)}
            />
            {user && <PendingOrders key={refreshPendingOrders} />}
          </div>

          {/* Chart Container - Right Side */}
          <div className="lg:col-span-3 order-1 lg:order-2">
        <div className="bg-slate-800 rounded-xl shadow-2xl p-4 md:p-6 border border-slate-700">
          <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                {currentSymbol?.icon} {symbol}
              </h2>
              <div className="text-xs text-slate-400 mt-1">
                Live from Server • {currentTimeframe?.label}
              </div>
            </div>
            
            {currentPrice && (
              <div className="text-left md:text-right">
                <div className="text-xs md:text-sm text-slate-400">Current Price</div>
                <div className="text-2xl md:text-3xl font-bold text-green-400">
                  ${formatPrice(currentPrice)}
                </div>
                <div className={`text-sm font-semibold ${priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {priceChange24h >= 0 ? '↑' : '↓'} {Math.abs(priceChange24h).toFixed(2)}% (24h)
                </div>
              </div>
            )}
          </div>
          
          {loading ? (
            <LoadingSpinner symbol={symbol} />
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-96 md:h-[500px]">
              <div className="text-center">
                <p className="text-slate-400 text-lg">📊 No chart data available</p>
                <p className="text-slate-500 text-sm mt-2">Waiting for data from Server...</p>
              </div>
            </div>
          ) : (
            <CryptoChart symbol={symbol} data={chartData} onError={handleChartError} />
          )}
        </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <PriceCard 
            title="Current Price" 
            value={currentPrice ? `$${formatPrice(currentPrice)}` : '-'}
            subtitle={currentPrice && "Real-time from Server"}
            color="blue"
          />
          
          <PriceCard 
            title="24h Change" 
            value={currentPrice ? `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%` : '-'}
            subtitle={currentPrice && (priceChange24h >= 0 ? 'Bullish trend' : 'Bearish trend')}
            color={priceChange24h >= 0 ? 'green' : 'red'}
            hoverColor="purple"
          />
          
          <PriceCard 
            title="24h Volume" 
            value={formatVolume(volume24h)}
            subtitle={volume24h && "Trading volume"}
            color="purple"
            hoverColor="green"
          />
        </div>

        {/* Chart Info Footer */}
        <footer className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span>🔌 SignalR: Server Hub</span>
              <span className="hidden md:inline">📊 Candles: {chartData.length}</span>
              <span className="font-semibold text-blue-400">📈 {currentTimeframe?.label}</span>
            </div>
            <div>
              <span className="text-slate-500">
                Status: <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-yellow-400'}>
                  {connectionStatus}
                </span>
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Portfolio Modal */}
      <Portfolio 
        isOpen={showPortfolio}
        onClose={() => setShowPortfolio(false)}
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultView={authModalView}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App
