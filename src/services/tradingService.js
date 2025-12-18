const API_BASE_URL = 'https://busticket.ink/api';

export const tradingService = {
  async getWallet() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/trading/wallet`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get wallet');
      }

      return data.data; // Returns PortfolioDto
    } catch (error) {
      console.error('Get wallet error:', error);
      throw error;
    }
  },

  async buy(symbol, price, quantity, orderType = 'MARKET', limitPrice = null) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const body = {
        symbol,
        price,
        quantity,
        orderType,
      };

      // Add limitPrice for LIMIT orders
      if (orderType === 'LIMIT' && limitPrice) {
        body.limitPrice = limitPrice;
      }

      const response = await fetch(`${API_BASE_URL}/trading/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Buy order failed');
      }

      return data.data; // Returns TradeResponseDto
    } catch (error) {
      console.error('Buy error:', error);
      throw error;
    }
  },

  async sell(symbol, price, quantity, orderType = 'MARKET', limitPrice = null) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const body = {
        symbol,
        price,
        quantity,
        orderType,
      };

      // Add limitPrice for LIMIT orders
      if (orderType === 'LIMIT' && limitPrice) {
        body.limitPrice = limitPrice;
      }

      const response = await fetch(`${API_BASE_URL}/trading/sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Sell order failed');
      }

      return data.data; // Returns TradeResponseDto
    } catch (error) {
      console.error('Sell error:', error);
      throw error;
    }
  },

  async getOrders(pageNumber = 1, pageSize = 50) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(
        `${API_BASE_URL}/trading/orders?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get orders');
      }

      return data.data; // Returns OrderHistoryDto
    } catch (error) {
      console.error('Get orders error:', error);
      throw error;
    }
  },

  async getPendingOrders() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/trading/pending-orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get pending orders');
      }

      return data.data; // Returns List<OrderDto>
    } catch (error) {
      console.error('Get pending orders error:', error);
      throw error;
    }
  },

  async cancelOrder(orderId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${API_BASE_URL}/trading/cancel/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel order');
      }

      return data;
    } catch (error) {
      console.error('Cancel order error:', error);
      throw error;
    }
  },
};
