import { useState, useEffect } from 'react';
import { tradingService } from '../services/tradingService';

function Portfolio({ isOpen, onClose }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchWallet();
    }
  }, [isOpen]);

  const fetchWallet = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await tradingService.getWallet();
      setWallet(data);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin ví');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Portfolio
            </h2>
            <p className="text-slate-400 text-sm mt-1">Tổng quan tài sản của bạn</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-slate-400">Đang tải...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-center">
              {error}
            </div>
          ) : wallet ? (
            <div className="space-y-6">
              {/* Total Value */}
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-6 text-center">
                <div className="text-sm text-slate-400 mb-2">Tổng giá trị</div>
                <div className="text-4xl font-bold text-white mb-1">
                  ${wallet.totalValue?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-slate-400">USDT</div>
              </div>

              {/* Wallets List */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span>💰</span>
                  Tài sản ({wallet.wallets?.length || 0})
                </h3>

                {wallet.wallets && wallet.wallets.length > 0 ? (
                  <div className="space-y-3">
                    {wallet.wallets.map((w) => (
                      <div
                        key={w.symbol}
                        className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                              {w.symbol.substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{w.symbol}</div>
                              <div className="text-xs text-slate-400">
                                {new Date(w.updatedAt).toLocaleString('vi-VN')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-white">
                              {w.balance.toFixed(w.symbol === 'USDT' ? 2 : 8)}
                            </div>
                            <div className="text-sm text-slate-400">
                              ≈ ${w.usdValue?.toFixed(2) || w.balance.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <div className="text-4xl mb-3">📭</div>
                    <p>Chưa có tài sản nào</p>
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchWallet}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Làm mới
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Portfolio;
