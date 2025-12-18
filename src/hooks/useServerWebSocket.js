import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

// Custom hook to connect to server's SignalR hub for real-time price data
export const useServerWebSocket = (symbol, timeframe = '1') => {
  const [chartData, setChartData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange24h, setPriceChange24h] = useState(0);
  const [volume24h, setVolume24h] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);

  const connectionRef = useRef(null);
  const mountedRef = useRef(true);
  const initialDataLoadedRef = useRef(false);
  const currentSubscriptionRef = useRef(null);
  const batchQueueRef = useRef([]);
  const batchTimeoutRef = useRef(null);

  const BATCH_INTERVAL = 100; // Process batched messages every 100ms

  // Process batched candles (reduces state updates)
  const processBatch = useCallback(() => {
    if (batchQueueRef.current.length === 0) return;

    const candles = [...batchQueueRef.current];
    batchQueueRef.current = [];

    // Update current price with the latest candle
    if (candles.length > 0) {
      const latestCandle = candles[candles.length - 1];
      setCurrentPrice(latestCandle.close);
    }

    // Batch update chart data
    setChartData(prevData => {
      let updatedData = [...prevData];

      candles.forEach(newCandle => {
        if (updatedData.length === 0) {
          updatedData = [newCandle];
          return;
        }

        const lastIndex = updatedData.length - 1;
        const lastCandle = updatedData[lastIndex];

        // Update existing candle if same timestamp
        if (lastCandle.time === newCandle.time) {
          updatedData[lastIndex] = newCandle;
        }
        // Add new candle if timestamp is newer
        else if (newCandle.time > lastCandle.time) {
          updatedData.push(newCandle);
        }
      });

      // Sort and keep last 200 candles
      return updatedData
        .sort((a, b) => a.time - b.time)
        .slice(-200);
    });
  }, []);

  const updateChartData = useCallback((newCandle) => {
    batchQueueRef.current.push(newCandle);

    if (!batchTimeoutRef.current) {
      batchTimeoutRef.current = setTimeout(() => {
        processBatch();
        batchTimeoutRef.current = null;
      }, BATCH_INTERVAL);
    }
  }, [processBatch]);

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
          time: Math.floor(parseInt(k[0]) / 1000),
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

  // Connect to SignalR Hub
  const connect = useCallback(async () => {
    if (!mountedRef.current) return;
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      console.log('✅ SignalR already connected');
      return;
    }

    try {
      setConnectionStatus('connecting');
      setError(null);

      // Create SignalR connection với negotiate bình thường
      const connection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5000/pricehub', {
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            // Exponential backoff: 0, 2, 10, 30 seconds
            if (retryContext.elapsedMilliseconds < 60000) {
              return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
            }
            return null; // Stop retrying after 1 minute
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      connectionRef.current = connection;

      // Handle reconnecting
      connection.onreconnecting((error) => {
        console.log('🔄 SignalR reconnecting...', error);
        setConnectionStatus('connecting');
      });

      // Handle reconnected
      connection.onreconnected((connectionId) => {
        console.log('✅ SignalR reconnected:', connectionId);
        setConnectionStatus('connected');
        
        // Resubscribe after reconnection
        if (currentSubscriptionRef.current) {
          const { symbol: sub_symbol, timeframe: sub_timeframe } = currentSubscriptionRef.current;
          connection.invoke('SubscribeToSymbol', sub_symbol, sub_timeframe)
            .catch(err => console.error('❌ Error resubscribing:', err));
        }
      });

      // Handle close
      connection.onclose((error) => {
        console.log('🔌 SignalR connection closed', error);
        setConnectionStatus('disconnected');
      });

      // Handle incoming kline data
      connection.on('ReceiveKline', (candle) => {
        if (!mountedRef.current) return;

        const processedCandle = {
          time: Number(candle.time),
          open: Number(candle.open),
          high: Number(candle.high),
          low: Number(candle.low),
          close: Number(candle.close),
          volume: Number(candle.volume),
        };

        updateChartData(processedCandle);

        if (!initialDataLoadedRef.current) {
          initialDataLoadedRef.current = true;
        }
      });

      // Start connection
      await connection.start();
      console.log('✅ Connected to SignalR Hub');
      setConnectionStatus('connected');

      // Subscribe to initial symbol/timeframe
      await connection.invoke('SubscribeToSymbol', symbol, timeframe);
      currentSubscriptionRef.current = { symbol, timeframe };
      console.log(`📊 Subscribed to ${symbol}_${timeframe}`);

    } catch (err) {
      console.error('❌ Error connecting to SignalR:', err);
      setError(err.message);
      setConnectionStatus('error');
    }
  }, [symbol, timeframe, updateChartData]);

  // Subscribe to new symbol/timeframe
  const subscribe = useCallback(async (newSymbol, newTimeframe) => {
    const connection = connectionRef.current;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      console.warn('⚠️ Cannot subscribe: connection not ready');
      return;
    }

    try {
      // Unsubscribe from current subscription
      if (currentSubscriptionRef.current) {
        const { symbol: oldSymbol, timeframe: oldTimeframe } = currentSubscriptionRef.current;
        await connection.invoke('UnsubscribeFromSymbol', oldSymbol, oldTimeframe);
        console.log(`🔕 Unsubscribed from ${oldSymbol}_${oldTimeframe}`);
      }

      // Subscribe to new symbol/timeframe
      await connection.invoke('SubscribeToSymbol', newSymbol, newTimeframe);
      currentSubscriptionRef.current = { symbol: newSymbol, timeframe: newTimeframe };
      console.log(`📊 Subscribed to ${newSymbol}_${newTimeframe}`);
    } catch (err) {
      console.error('❌ Error subscribing:', err);
    }
  }, []);

  // Initialize connection
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;

      if (connectionRef.current) {
        console.log('🔌 Stopping SignalR connection');
        connectionRef.current.stop();
        connectionRef.current = null;
      }

      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }
    };
  }, [connect]);

  // Handle symbol/timeframe changes
  useEffect(() => {
    initialDataLoadedRef.current = false;

    console.log(`🔄 Switching to ${symbol} ${timeframe}`);
    setChartData([]);
    setCurrentPrice(null);
    setPriceChange24h(0);
    setVolume24h(0);

    // Load historical data
    fetchHistoricalData();

    // Subscribe to new symbol/timeframe
    if (connectionRef.current?.state === signalR.HubConnectionState.Connected) {
      subscribe(symbol, timeframe);
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
