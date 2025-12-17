import { useState, useEffect, useRef, useCallback } from 'react';

// Bybit WebSocket hook for real-time candlestick data
export const useBybitWebSocket = (symbol, timeframe = '1') => {
  const [chartData, setChartData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange24h, setPriceChange24h] = useState(0);
  const [volume24h, setVolume24h] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const mountedRef = useRef(true);
  const initialDataLoadedRef = useRef(false);
  const currentSubscriptionRef = useRef(null); // Track current subscription

  // Process kline data from Bybit
  const processKlineData = useCallback((kline) => {
    return {
      time: Math.floor(kline.start / 1000), // Convert ms to seconds
      open: parseFloat(kline.open),
      high: parseFloat(kline.high),
      low: parseFloat(kline.low),
      close: parseFloat(kline.close),
      volume: parseFloat(kline.volume),
    };
  }, []);

  // Update chart data with new candle
  const updateChartData = useCallback((newCandle) => {
    setChartData(prevData => {
      // If no data, start with this candle
      if (prevData.length === 0) {
        return [newCandle];
      }

      const lastCandle = prevData[prevData.length - 1];

      // Update existing candle if same timestamp
      if (lastCandle.time === newCandle.time) {
        return [...prevData.slice(0, -1), newCandle];
      }

      // Add new candle if timestamp is newer
      if (newCandle.time > lastCandle.time) {
        const updatedData = [...prevData, newCandle]
          .sort((a, b) => a.time - b.time)
          .slice(-200); // Keep last 200 candles
        return updatedData;
      }

      // Ignore older candles
      return prevData;
    });
  }, []);

  // Subscribe to a symbol/timeframe
  const subscribe = useCallback((ws, sym, tf) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const topic = `kline.${tf}.${sym}`;
    
    // Unsubscribe from previous topic if exists
    if (currentSubscriptionRef.current) {
      const unsubscribeMsg = {
        op: 'unsubscribe',
        args: [currentSubscriptionRef.current]
      };
      ws.send(JSON.stringify(unsubscribeMsg));
      console.log(`🔕 Unsubscribed from ${currentSubscriptionRef.current}`);
    }

    // Subscribe to new topic
    const subscribeMsg = {
      op: 'subscribe',
      args: [topic]
    };
    ws.send(JSON.stringify(subscribeMsg));
    currentSubscriptionRef.current = topic;
    console.log(`📊 Subscribed to ${topic}`);
  }, []);

  // Connect to Bybit WebSocket (only once)
  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return;
    }

    try {
      setConnectionStatus('connecting');
      setError(null);

      // Bybit public WebSocket endpoint
      const ws = new WebSocket('wss://stream.bybit.com/v5/public/spot');
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        
        console.log('✅ Connected to Bybit WebSocket');
        setConnectionStatus('connected');

        // Subscribe to initial symbol/timeframe
        subscribe(ws, symbol, timeframe);

        // Setup ping/pong to keep connection alive
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ op: 'ping' }));
          }
        }, 20000); // Ping every 20 seconds
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const data = JSON.parse(event.data);

          // Handle pong response
          if (data.op === 'pong') {
            return;
          }

          // Handle subscription confirmation
          if (data.op === 'subscribe') {
            console.log('✅ Subscription confirmed:', data);
            return;
          }

          // Handle kline data
          if (data.topic && data.topic.startsWith('kline') && data.data) {
            const klines = Array.isArray(data.data) ? data.data : [data.data];

            klines.forEach(kline => {
              const candle = processKlineData(kline);
              
              // Update current price
              setCurrentPrice(candle.close);
              
              // Update chart
              updateChartData(candle);

              // Calculate 24h change (simplified)
              if (!initialDataLoadedRef.current) {
                initialDataLoadedRef.current = true;
              }
            });
          }

        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('❌ WebSocket error:', err);
        setError('WebSocket connection error');
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;

        console.log('🔌 WebSocket disconnected');
        setConnectionStatus('disconnected');

        // Clear ping interval
        if (pingIntervalRef.current) {
       ubscribl(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect after 3 seconds
        if (mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };

    } catch (err) {
      console.error('❌ Error connecting to WebSocket:', err);
      setError(err.message);
      setConnectionStatus('error');
    }
  }, [symbol, timeframe, processKlineData, updateChartData]);

  // Fetch historical data from Bybit REST API
  const fetchHistoricalData = useCallback(async () => {
    try {
      const intervals = {
        '1': 1,
        '3': 3,
        '5': 5,
        '15': 15,
        '30': 30,
        '60': 60,
        '120': 120,
        '240': 240,
        'D': 1440,
      };

      const interval = intervals[timeframe] || 1;
      const limit = 200;
      const endTime = Date.now();
      const startTime = endTime - (interval * 60 * 1000 * limit);

      const url = `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${timeframe}&start=${startTime}&end=${endTime}&limit=${limit}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.retCode === 0 && result.result && result.result.list) {
        const klines = result.result.list.map(k => ({
          time: Math.floor(parseInt(k[0]) / 1000), // timestamp in seconds
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5]),
        })).sort((a, b) => a.time - b.time);

        setChartData(klines);
        
        if (klines.length > 0) {
          const latest = klines[klines.length - 1];
          setCurrentPrice(latest.close);
          
          // Calculate 24h change
          const first = klines[0];
          const change = ((latest.close - first.open) / first.open) * 100;
          setPriceChange24h(change);
          
          // Sum volume
          const totalVolume = klines.reduce((sum, k) => sum + (k.volume * k.close), 0);
          setVolume24h(totalVolume);
        }

        console.log(`📊 Loaded ${klines.length} historical candles`);
      }
    } catch (err) {
      console.error('❌ Error fetching historical data:', err);
    }
  }, [symbol, timeframe]);

  // Initialize WebSocket connection once
  useEffect(() => {
    mountedRef.current = true;

    // Connect to WebSocket (only once)
    connect();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;

      if (wsRef.current) {
        console.log('🔌 Closing WebSocket connection');
        wsRef.current.close();
        wsRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [connect]);

  // Handle symbol/timeframe changes (without disconnecting)
  useEffect(() => {
    initialDataLoadedRef.current = false;

    // Reset state for new symbol
    console.log(`🔄 Switching to ${symbol} ${timeframe}`);
    setChartData([]);
    setCurrentPrice(null);
    setPriceChange24h(0);
    setVolume24h(0);

    // Load historical data
    fetchHistoricalData();

    // Subscribe to new symbol/timeframe (if WebSocket is ready)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      subscribe(wsRef.current, symbol, timeframe);
    }

  }, [symbol, timeframe, fetchHistoricalData, subscribe]);

  return {
    chartData,
    currentPrice,
    priceChange24h,
    volume24h,
    connectionStatus,
    error,
  };
};
