import { useState } from 'react';
import Login from './Login';
import Register from './Register';

function AuthModal({ isOpen, onClose, defaultView = 'login' }) {
  const [view, setView] = useState(defaultView);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {view === 'login' ? (
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Đăng Nhập
              </h2>
              <p className="text-slate-400 mt-2">Chào mừng trở lại!</p>
            </div>
            <Login 
              onSwitchToRegister={() => setView('register')}
              onClose={onClose}
            />
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Chưa có tài khoản?{' '}
                <button
                  onClick={() => setView('register')}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition"
                >
                  Đăng ký ngay
                </button>
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Đăng Ký
              </h2>
              <p className="text-slate-400 mt-2">Tạo tài khoản mới</p>
            </div>
            <Register 
              onSwitchToLogin={() => setView('login')}
              onClose={onClose}
            />
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Đã có tài khoản?{' '}
                <button
                  onClick={() => setView('login')}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition"
                >
                  Đăng nhập ngay
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
