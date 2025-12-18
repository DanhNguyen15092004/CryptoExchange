import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tradingService } from '../services/tradingService';

function TradingPanel({ symbol, currentPrice, onOrderPlaced }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState(currentPrice || '');
  const [orderType, setOrderType] = useState('market'); // 'market' or 'limit'
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [percentage, setPercentage] = useState(0);
  const [success, setSuccess] = useState('');

  // Fetch wallet khi user đăng nhập
  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  // Update price khi currentPrice thay đổi
  useEffect(() => {
    if (currentPrice && orderType === 'market') {
      setPrice(currentPrice);
    }
  }, [currentPrice, orderType]);

  const fetchWallet = async () => {
    try {
      const data = await tradingService.getWallet();
      setWallet(data);
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    }
  };

  // Lấy balance USDT
  const getUsdtBalance = () => {
    if (!wallet || !wallet.wallets) return 0;
    const usdtWallet = wallet.wallets.find(w => w.symbol === 'USDT');
    return usdtWallet ? usdtWallet.balance : 0;
  };

  // Lấy balance của coin hiện tại (BTC, ETH, etc)
  const getCoinBalance = () => {
    if (!wallet || !wallet.wallets) return 0;
    const coinSymbol = symbol.replace('USDT', '');
    const coinWallet = wallet.wallets.find(w => w.symbol === coinSymbol);
    return coinWallet ? coinWallet.balance : 0;
  };

  // Tính số lượng coin dựa trên % USDT (cho mua)
  const calculateAmountFromPercentage = (percent) => {
    const usdtBalance = getUsdtBalance();
    const currentPriceValue = orderType === 'market' ? currentPrice : parseFloat(price || currentPrice);
    
    if (!currentPriceValue || currentPriceValue <= 0) return 0;
    
    const usdtAmount = (usdtBalance * percent) / 100;
    const coinAmount = usdtAmount / currentPriceValue;
    
    return coinAmount;
  };

  // Tính số lượng coin dựa trên % balance coin (cho bán)
  const calculateSellAmountFromPercentage = (percent) => {
    const coinBalance = getCoinBalance();
    return (coinBalance * percent) / 100;
  };

  // Handle slider change
  const handlePercentageChange = (percent) => {
    setPercentage(percent);
    
    if (activeTab === 'buy') {
      const calculatedAmount = calculateAmountFromPercentage(percent);
      setAmount(calculatedAmount > 0 ? calculatedAmount.toFixed(8) : '');
    } else {
      const calculatedAmount = calculateSellAmountFromPercentage(percent);
      setAmount(calculatedAmount > 0 ? calculatedAmount.toFixed(8) : '');
    }
  };

  // Handle manual amount change
  const handleAmountChange = (value) => {
    setAmount(value);
    // Reset percentage khi user nhập thủ công
    setPercentage(0);
  };

  const handleTrade = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const tradeAmount = parseFloat(amount);
      
      if (!tradeAmount || tradeAmount <= 0) {
        throw new Error('Invalid amount');
      }

      let tradePrice, limitPrice;
      
      if (orderType === 'market') {
        tradePrice = currentPrice;
        limitPrice = null;
      } else {
        // Limit order
        limitPrice = parseFloat(price);
        if (!limitPrice || limitPrice <= 0) {
          throw new Error('Invalid limit price');
        }
        tradePrice = currentPrice; // Use current market price for reference
      }

      let result;
      const orderTypeUpper = orderType.toUpperCase();
      
      if (activeTab === 'buy') {
        result = await tradingService.buy(symbol, tradePrice, tradeAmount, orderTypeUpper, limitPrice);
        if (orderTypeUpper === 'MARKET') {
          setSuccess(`✅ Đã mua ${tradeAmount.toFixed(8)} ${symbol.replace('USDT', '')} thành công!`);
        } else {
          setSuccess(`✅ Đã đặt lệnh limit mua ${tradeAmount.toFixed(8)} ${symbol.replace('USDT', '')} tại giá ${limitPrice}!`);
        }
      } else {
        result = await tradingService.sell(symbol, tradePrice, tradeAmount, orderTypeUpper, limitPrice);
        if (orderTypeUpper === 'MARKET') {
          setSuccess(`✅ Đã bán ${tradeAmount.toFixed(8)} ${symbol.replace('USDT', '')} thành công!`);
        } else {
          setSuccess(`✅ Đã đặt lệnh limit bán ${tradeAmount.toFixed(8)} ${symbol.replace('USDT', '')} tại giá ${limitPrice}!`);
        }
      }

      console.log('Trade result:', result);
      
      // Refresh wallet sau khi giao dịch
      await fetchWallet();
      
      // Notify parent to refresh pending orders
      if (onOrderPlaced) {
        onOrderPlaced();
      }
      
      // Reset form
      setAmount('');
      setPercentage(0);
      if (orderType === 'limit') {
        setPrice('');
      }
      
      // Clear success message sau 5s
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Giao dịch thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-slate-300 mb-2">
            Đăng nhập để giao dịch
          </h3>
          <p className="text-slate-400 text-sm">
            Bạn cần đăng nhập để mua/bán crypto
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-700/50 px-4 py-3 border-b border-slate-600">
        <h3 className="text-lg font-bold text-white">Giao dịch {symbol}</h3>
      </div>

      {/* Buy/Sell Tabs */}
      <div className="grid grid-cols-2 border-b border-slate-600">
        <button
          onClick={() => setActiveTab('buy')}
          className={`py-3 font-semibold transition ${
            activeTab === 'buy'
              ? 'bg-green-500/20 text-green-400 border-b-2 border-green-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Mua
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`py-3 font-semibold transition ${
            activeTab === 'sell'
              ? 'bg-red-500/20 text-red-400 border-b-2 border-red-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          Bán
        </button>
      </div>

      {/* Trading Form */}
      <div className="p-4">
        {error && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500 rounded text-red-400 text-xs">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-3 p-2 bg-green-500/10 border border-green-500 rounded text-green-400 text-xs">
            {success}
          </div>
        )}

        {/* Balance Display */}
        <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">
              {activeTab === 'buy' ? 'USDT khả dụng:' : `${symbol.replace('USDT', '')} khả dụng:`}
            </span>
            <span className="text-white font-bold">
              {activeTab === 'buy' 
                ? getUsdtBalance().toFixed(2) 
                : getCoinBalance().toFixed(8)
              }
            </span>
          </div>
        </div>

        <form onSubmit={handleTrade} className="space-y-4">
          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Loại lệnh
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('market')}
                className={`py-2 px-3 rounded-lg font-medium transition ${
                  orderType === 'market'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Market
              </button>
              <button
                type="button"
                onClick={() => setOrderType('limit')}
                className={`py-2 px-3 rounded-lg font-medium transition ${
                  orderType === 'limit'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Price (only for limit orders) */}
          {orderType === 'limit' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Giá (USDT)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                placeholder={currentPrice?.toString() || '0'}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Số lượng {symbol.replace('USDT', '')}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              step="0.00000001"
              placeholder="0.00"
              required
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Percentage Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Chọn nhanh</span>
              <span>{percentage}%</span>
            </div>
            
            {/* Slider */}
            <input
              type="range"
              min="0"
              max="100"
              value={percentage}
              onChange={(e) => handlePercentageChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, ${
                  activeTab === 'buy' ? '#10b981' : '#ef4444'
                } 0%, ${
                  activeTab === 'buy' ? '#10b981' : '#ef4444'
                } ${percentage}%, #374151 ${percentage}%, #374151 100%)`
              }}
            />
            
            {/* Percentage Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  type="button"
                  onClick={() => handlePercentageChange(percent)}
                  className={`py-1.5 px-2 rounded text-xs font-medium transition ${
                    percentage === percent
                      ? activeTab === 'buy'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          {/* Current Price Display */}
          {currentPrice && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Giá hiện tại:</span>
              <span className="text-white font-semibold">
                ${currentPrice.toLocaleString()}
              </span>
            </div>
          )}

          {/* Total */}
          {amount && (
            <div className="flex justify-between text-sm border-t border-slate-600 pt-3">
              <span className="text-slate-400">Tổng cộng:</span>
              <span className="text-white font-bold">
                ${((orderType === 'market' ? currentPrice : parseFloat(price || currentPrice)) * parseFloat(amount)).toFixed(2)}
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !amount || !price}
            className={`w-full py-3 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
              activeTab === 'buy'
                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang xử lý...
              </span>
            ) : (
              <>
                {activeTab === 'buy' ? '🟢 Mua' : '🔴 Bán'} {symbol.replace('USDT', '')}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Info Footer */}
      <div className="bg-slate-700/30 px-4 py-2 border-t border-slate-600">
        <p className="text-xs text-slate-400 text-center">
          ⚡ Giao dịch nhanh chóng và an toàn
        </p>
      </div>
    </div>
  );
}

export default TradingPanel;
