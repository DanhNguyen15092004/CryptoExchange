import { useEffect, useCallback } from 'react'
import { useWebSocketRefs, useWebSocketState } from './useWebSocketState'
import { useBatchProcessor } from './useBatchProcessor'
import {
  RECONNECT_DELAYS,
  MAX_RECONNECT_ATTEMPTS,
  PING_INTERVAL,
  TIMEFRAME_INTERVALS,
  processKlineData,
  createWebSocketMessage,
  calculatePriceChange,
  calculateVolume,
} from './websocketHelpers'

export const useBybitWebSocket = (symbol, timeframe = '1') => {
  const state = useWebSocketState()
  const refs = useWebSocketRefs()
  const { updateChartData } = useBatchProcessor(refs, state)

  const subscribe = useCallback((ws, sym, tf) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    const topic = `kline.${tf}.${sym}`
    const { currentSubscriptionRef } = refs
    
    if (currentSubscriptionRef.current) {
      ws.send(createWebSocketMessage('unsubscribe', [currentSubscriptionRef.current]))
      console.log(`🔕 Unsubscribed from ${currentSubscriptionRef.current}`)
    }

    ws.send(createWebSocketMessage('subscribe', [topic]))
    currentSubscriptionRef.current = topic
    console.log(`📊 Subscribed to ${topic}`)
  }, [refs])

  const setupPing = useCallback((ws) => {
    const { pingIntervalRef, lastMessageTimeRef, mountedRef } = refs
    
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
    
    pingIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN && mountedRef.current) {
        ws.send(createWebSocketMessage('ping'))
        lastMessageTimeRef.current = Date.now()
      }
    }, PING_INTERVAL)
  }, [refs])

  const handleReconnect = useCallback(() => {
    const { reconnectAttemptsRef, reconnectTimeoutRef, mountedRef } = refs
    const { setError, setConnectionStatus } = state

    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error(`❌ Max reconnect attempts reached`)
      setError(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`)
      setConnectionStatus('error')
      return
    }

    const delayIndex = Math.min(reconnectAttemptsRef.current, RECONNECT_DELAYS.length - 1)
    const delay = RECONNECT_DELAYS[delayIndex]

    console.log(`🔄 Reconnecting in ${delay}ms (${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`)

    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        reconnectAttemptsRef.current++
        connect()
      }
    }, delay)
  }, [refs, state])

  const connect = useCallback(() => {
    const { wsRef, mountedRef, reconnectAttemptsRef, lastMessageTimeRef, initialDataLoadedRef } = refs
    const { setConnectionStatus, setError } = state

    if (!mountedRef.current || (wsRef.current?.readyState === WebSocket.OPEN)) {
      return
    }

    try {
      setConnectionStatus('connecting')
      setError(null)

      const ws = new WebSocket('wss://stream.bybit.com/v5/public/spot')
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        console.log('✅ Connected to Bybit WebSocket')
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0
        subscribe(ws, symbol, timeframe)
        setupPing(ws)
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        lastMessageTimeRef.current = Date.now()

        try {
          const data = JSON.parse(event.data)

          if (data.op === 'pong' || data.op === 'subscribe') return

          if (data.topic?.startsWith('kline') && data.data) {
            const klines = Array.isArray(data.data) ? data.data : [data.data]
            klines.forEach(kline => {
              updateChartData(processKlineData(kline))
              if (!initialDataLoadedRef.current) {
                initialDataLoadedRef.current = true
              }
            })
          }
        } catch (err) {
          console.error('❌ Error parsing message:', err)
        }
      }

      ws.onerror = () => {
        console.error('❌ WebSocket error')
        setError('WebSocket connection error')
        setConnectionStatus('error')
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        console.log('🔌 WebSocket disconnected')
        setConnectionStatus('disconnected')
        
        const { pingIntervalRef } = refs
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }
        
        if (mountedRef.current) handleReconnect()
      }
    } catch (err) {
      console.error('❌ Error connecting:', err)
      setError(err.message)
      setConnectionStatus('error')
    }
  }, [symbol, timeframe, refs, state, subscribe, setupPing, handleReconnect, updateChartData])

  const fetchHistoricalData = useCallback(async () => {
    const { setChartData, setCurrentPrice, setPriceChange24h, setVolume24h } = state

    try {
      const interval = TIMEFRAME_INTERVALS[timeframe] || 1
      const limit = 200
      const endTime = Date.now()
      const startTime = endTime - (interval * 60 * 1000 * limit)
      const url = `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${timeframe}&start=${startTime}&end=${endTime}&limit=${limit}`

      const response = await fetch(url)
      const result = await response.json()

      if (result.retCode === 0 && result.result?.list) {
        const klines = result.result.list
          .map(k => ({
            time: Math.floor(parseInt(k[0]) / 1000),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
          }))
          .sort((a, b) => a.time - b.time)

        setChartData(klines)
        
        if (klines.length > 0) {
          const latest = klines[klines.length - 1]
          const first = klines[0]
          
          setCurrentPrice(latest.close)
          setPriceChange24h(calculatePriceChange(latest.close, first.open))
          setVolume24h(calculateVolume(klines))
        }

        console.log(`📊 Loaded ${klines.length} historical candles`)
      }
    } catch (err) {
      console.error('❌ Error fetching historical data:', err)
    }
  }, [symbol, timeframe, state])

  useEffect(() => {
    const { mountedRef } = refs
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      const { wsRef, reconnectTimeoutRef, pingIntervalRef, batchTimeoutRef } = refs

      if (wsRef.current) {
        console.log('🔌 Closing WebSocket')
        wsRef.current.close()
        wsRef.current = null
      }

      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      if (batchTimeoutRef.current) clearTimeout(batchTimeoutRef.current)
    }
  }, [connect, refs])

  useEffect(() => {
    const { initialDataLoadedRef, wsRef } = refs
    const { setChartData, setCurrentPrice, setPriceChange24h, setVolume24h } = state

    initialDataLoadedRef.current = false
    console.log(`🔄 Switching to ${symbol} ${timeframe}`)

    setChartData([])
    setCurrentPrice(null)
    setPriceChange24h(0)
    setVolume24h(0)

    fetchHistoricalData()

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      subscribe(wsRef.current, symbol, timeframe)
    }
  }, [symbol, timeframe, fetchHistoricalData, subscribe, refs, state])

  return {
    chartData: state.chartData,
    currentPrice: state.currentPrice,
    priceChange24h: state.priceChange24h,
    volume24h: state.volume24h,
    connectionStatus: state.connectionStatus,
    error: state.error,
    reconnectAttempts: refs.reconnectAttemptsRef.current,
    lastMessageTime: refs.lastMessageTimeRef.current,
  }
}
