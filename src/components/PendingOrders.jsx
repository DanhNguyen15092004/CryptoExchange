import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { tradingService } from '../services/tradingService';

function PendingOrders({ onOrderCancelled }) {
  const { user } = useAuth();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchPendingOrders();
      // Auto refresh every 5 seconds
      const interval = setInterval(fetchPendingOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      const data = await tradingService.getPendingOrders();
      console.log('📋 Pending orders fetched:', data);
      setPendingOrders(data || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch pending orders:', err);
      setError('Không thể tải danh sách lệnh chờ');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Bạn có chắc muốn hủy lệnh này?')) return;

    try {
      setCancellingId(orderId);
      await tradingService.cancelOrder(orderId);
      await fetchPendingOrders();
      if (onOrderCancelled) {
        onOrderCancelled();
      }
    } catch (err) {
      alert('Không thể hủy lệnh: ' + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return null;
  }

  if (pendingOrders.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">Lệnh Limit đang chờ</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-slate-400 text-sm">
            Không có lệnh limit nào đang chờ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-700/50 px-4 py-3 border-b border-slate-600 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">
          Lệnh Limit đang chờ ({pendingOrders.length})
        </h3>
        <button
          onClick={fetchPendingOrders}
          disabled={loading}
          className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-sm font-medium transition disabled:opacity-50"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Orders List */}
      <div className="divide-y divide-slate-700">
        {pendingOrders.map((order) => (
          <div key={order.id} className="p-4 hover:bg-slate-700/30 transition">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      order.side === 'BUY'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {order.side}
                  </span>
                  <span className="text-white font-bold">{order.symbol}</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                    LIMIT
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <span className="text-slate-400">Giá limit:</span>
                    <span className="text-white font-bold ml-1">
                      ${order.limitPrice?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Số lượng:</span>
                    <span className="text-white font-bold ml-1">
                      {order.quantity}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Tổng:</span>
                    <span className="text-white font-bold ml-1">
                      ${order.totalAmount?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Thời gian:</span>
                    <span className="text-slate-300 ml-1 text-xs">
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleCancelOrder(order.id)}
                disabled={cancellingId === order.id}
                className="ml-4 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancellingId === order.id ? 'Đang hủy...' : 'Hủy'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="p-3 text-center text-slate-400 text-sm">
          Đang cập nhật...
        </div>
      )}
    </div>
  );
}

export default PendingOrders;
