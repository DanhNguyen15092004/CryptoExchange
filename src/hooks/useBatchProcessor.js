import { useCallback } from 'react'
import { BATCH_INTERVAL } from './websocketHelpers'

export const useBatchProcessor = (refs, setState) => {
  const { batchQueueRef, batchTimeoutRef } = refs
  const { setChartData, setCurrentPrice } = setState

  const processBatch = useCallback(() => {
    if (batchQueueRef.current.length === 0) return

    const candles = [...batchQueueRef.current]
    batchQueueRef.current = []

    if (candles.length > 0) {
      setCurrentPrice(candles[candles.length - 1].close)
    }

    setChartData(prevData => {
      let updatedData = [...prevData]

      candles.forEach(newCandle => {
        if (updatedData.length === 0) {
          updatedData = [newCandle]
          return
        }

        const lastIndex = updatedData.length - 1
        const lastCandle = updatedData[lastIndex]

        if (lastCandle.time === newCandle.time) {
          updatedData[lastIndex] = newCandle
        } else if (newCandle.time > lastCandle.time) {
          updatedData.push(newCandle)
        }
      })

      return updatedData.sort((a, b) => a.time - b.time).slice(-200)
    })
  }, [batchQueueRef, setChartData, setCurrentPrice])

  const updateChartData = useCallback((newCandle) => {
    batchQueueRef.current.push(newCandle)

    if (!batchTimeoutRef.current) {
      batchTimeoutRef.current = setTimeout(() => {
        processBatch()
        batchTimeoutRef.current = null
      }, BATCH_INTERVAL)
    }
  }, [batchQueueRef, batchTimeoutRef, processBatch])

  return { updateChartData }
}
