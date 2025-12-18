import { useState, useRef } from 'react'

export const useWebSocketRefs = () => {
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const pingIntervalRef = useRef(null)
  const mountedRef = useRef(true)
  const initialDataLoadedRef = useRef(false)
  const currentSubscriptionRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const batchQueueRef = useRef([])
  const batchTimeoutRef = useRef(null)
  const lastMessageTimeRef = useRef(Date.now())

  return {
    wsRef,
    reconnectTimeoutRef,
    pingIntervalRef,
    mountedRef,
    initialDataLoadedRef,
    currentSubscriptionRef,
    reconnectAttemptsRef,
    batchQueueRef,
    batchTimeoutRef,
    lastMessageTimeRef,
  }
}

export const useWebSocketState = () => {
  const [chartData, setChartData] = useState([])
  const [currentPrice, setCurrentPrice] = useState(null)
  const [priceChange24h, setPriceChange24h] = useState(0)
  const [volume24h, setVolume24h] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [error, setError] = useState(null)

  return {
    chartData,
    setChartData,
    currentPrice,
    setCurrentPrice,
    priceChange24h,
    setPriceChange24h,
    volume24h,
    setVolume24h,
    connectionStatus,
    setConnectionStatus,
    error,
    setError,
  }
}
