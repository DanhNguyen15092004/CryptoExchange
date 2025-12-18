const API_BASE_URL = 'https://busticket.ink/api';

export const authService = {
  async register(email, password, confirmPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Lưu token vào localStorage
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('email', data.data.email);
        localStorage.setItem('expiresAt', data.data.expiresAt);
      }

      return data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Lưu token vào localStorage
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('email', data.data.email);
        localStorage.setItem('expiresAt', data.data.expiresAt);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('expiresAt');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getEmail() {
    return localStorage.getItem('email');
  },

  isAuthenticated() {
    const token = this.getToken();
    const expiresAt = localStorage.getItem('expiresAt');
    
    if (!token || !expiresAt) {
      return false;
    }

    // Kiểm tra token còn hạn không
    const expiryDate = new Date(expiresAt);
    return expiryDate > new Date();
  },
};
