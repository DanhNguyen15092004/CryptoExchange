import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra user đã đăng nhập chưa khi load app
    const checkAuth = () => {
      if (authService.isAuthenticated()) {
        setUser({
          email: authService.getEmail(),
          token: authService.getToken(),
        });
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (userData) => {
    const userInfo = {
      email: userData.email,
      token: userData.token,
    };
    setUser(userInfo);
    // Lưu vào localStorage để persist
    localStorage.setItem('token', userData.token);
    localStorage.setItem('email', userData.email);
    if (userData.expiresAt) {
      localStorage.setItem('expiresAt', userData.expiresAt);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
