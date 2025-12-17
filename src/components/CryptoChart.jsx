import React, { useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { createChart } from 'lightweight-charts';

const CryptoChart = memo(({ symbol, data, onError }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const hasInitialFitRef = useRef(false); // Track if we've done initial fit

  // Zoom and pan controls
  const handleZoomIn = useCallback(() => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const currentRange = timeScale.getVisibleLogicalRange();
    if (!currentRange) return;
    
    const delta = (currentRange.to - currentRange.from) * 0.2;
    timeScale.setVisibleLogicalRange({
      from: currentRange.from + delta,
      to: currentRange.to - delta,
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!chartRef.current) return;
    const timeScale = chartRef.current.timeScale();
    const currentRange = timeScale.getVisibleLogicalRange();
    if (!currentRange) return;
    
    const delta = (currentRange.to - currentRange.from) * 0.2;
    timeScale.setVisibleLogicalRange({
      from: currentRange.from - delta,
      to: currentRange.to + delta,
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    if (!chartRef.current) return;
    chartRef.current.timeScale().fitContent();
  }, []);

  // Memoize chart options to prevent unnecessary re-creation
  const chartOptions = useMemo(() => ({
    width: 0,
    height: 500,
    layout: {
      background: { color: '#1e293b' },
      textColor: '#d1d5db',
    },
    grid: {
      vertLines: { color: '#334155' },
      horzLines: { color: '#334155' },
    },
    crosshair: {
      mode: 1,
      vertLine: {
        width: 1,
        color: '#758696',
        style: 3,
      },
      horzLine: {
        width: 1,
        color: '#758696',
        style: 3,
      },
    },
    rightPriceScale: {
      borderColor: '#334155',
      scaleMargins: {
        top: 0.1,
        bottom: 0.1,
      },
    },
    timeScale: {
      borderColor: '#334155',
      timeVisible: true,
      secondsVisible: false,
      rightOffset: 12,
      barSpacing: 10,
      minBarSpacing: 2,
      fixLeftEdge: false, // Cho phép scroll sang trái
      fixRightEdge: false, // Cho phép scroll sang phải
      lockVisibleTimeRangeOnResize: true,
      rightBarStaysOnScroll: true,
      borderVisible: true,
      visible: true,
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false,
    },
    handleScale: {
      axisPressedMouseMove: {
        time: true,
        price: true,
      },
      mouseWheel: true,
      pinch: true,
    },
    kineticScroll: {
      touch: true, // Cuộn mượt trên mobile
      mouse: false,
    },
  }), []);

  // Memoize series options
  const seriesOptions = useMemo(() => ({
    upColor: '#10b981',
    downColor: '#ef4444',
    borderUpColor: '#10b981',
    borderDownColor: '#ef4444',
    wickUpColor: '#10b981',
    wickDownColor: '#ef4444',
    borderVisible: true,
    wickVisible: true,
  }), []);

  // Initialize chart once
  useEffect(() => {
    if (!chartContainerRef.current) {
      console.error('❌ Chart container not found');
      onError?.('Chart container not available');
      return;
    }

    try {
      console.log('🎨 Initializing chart for', symbol);

      // Create chart with initial width
      const containerWidth = chartContainerRef.current.clientWidth;
      const chart = createChart(chartContainerRef.current, {
        ...chartOptions,
        width: containerWidth,
      });

      chartRef.current = chart;

      // Add candlestick series
      const candlestickSeries = chart.addCandlestickSeries(seriesOptions);
      seriesRef.current = candlestickSeries;

      // Setup ResizeObserver for responsive behavior
      resizeObserverRef.current = new ResizeObserver(entries => {
        if (entries.length === 0 || !chartRef.current) return;
        
        const { width, height } = entries[0].contentRect;
        chartRef.current.applyOptions({ 
          width: Math.max(width, 300),
          height: Math.max(height, 300),
        });
      });

      resizeObserverRef.current.observe(chartContainerRef.current);

      console.log('✅ Chart initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing chart:', error);
      onError?.(error.message);
    }

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up chart');
      
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      
      seriesRef.current = null;
      hasInitialFitRef.current = false; // Reset on cleanup
    };
  }, [symbol, chartOptions, seriesOptions]);

  // Update data when it changes
  useEffect(() => {
    if (!seriesRef.current || !data || data.length === 0) {
      // Clear chart if no data
      if (seriesRef.current && data && data.length === 0) {
        console.log('🧹 Clearing chart data');
        seriesRef.current.setData([]);
        hasInitialFitRef.current = false; // Reset when clearing
      }
      return;
    }

    try {
      console.log(`📊 Updating chart for ${symbol} with`, data.length, 'candles');
      
      // Validate and process data
      const processedData = data
        .filter(d => {
          // Validate basic structure
          if (!d.time || typeof d.open !== 'number' || typeof d.high !== 'number' || 
              typeof d.low !== 'number' || typeof d.close !== 'number') {
            return false;
          }
          
          // Validate price relationships
          if (d.high < d.low || d.close > d.high || d.close < d.low || 
              d.open > d.high || d.open < d.low) {
            console.warn('⚠️ Invalid candle data:', d);
            return false;
          }
          
          return true;
        })
        .map(d => ({
          time: Math.floor(d.time), // Ensure integer timestamp in seconds
          open: parseFloat(d.open.toFixed(2)),
          high: parseFloat(d.high.toFixed(2)),
          low: parseFloat(d.low.toFixed(2)),
          close: parseFloat(d.close.toFixed(2)),
        }));

      if (processedData.length === 0) {
        console.error('❌ No valid data after processing');
        onError?.('No valid chart data');
        return;
      }

      // Sort by time
      const sortedData = processedData.sort((a, b) => a.time - b.time);
      
      // Remove duplicates (keep last occurrence for same timestamp)
      const uniqueData = [];
      const timeMap = new Map();
      
      sortedData.forEach(candle => {
        timeMap.set(candle.time, candle);
      });
      
      timeMap.forEach(candle => uniqueData.push(candle));
      uniqueData.sort((a, b) => a.time - b.time);
      
      console.log(`📊 Processed: ${data.length} → ${uniqueData.length} candles (removed ${data.length - uniqueData.length} duplicates)`);
      
      seriesRef.current.setData(uniqueData);
      
      // Only auto-fit on first data load, preserve user's zoom after that
      if (chartRef.current && !hasInitialFitRef.current) {
        chartRef.current.timeScale().fitContent();
        hasInitialFitRef.current = true;
        console.log('📐 Initial fit content');
      }

      console.log(`✅ Chart updated successfully for ${symbol}`);
      console.log('First candle:', sortedData[0]);
      console.log('Last candle:', sortedData[sortedData.length - 1]);

    } catch (error) {
      console.error('❌ Error updating chart data:', error);
      onError?.(error.message);
    }
  }, [data, symbol, onError]);

  return (
    <div className="w-full h-full min-h-[500px] relative">
      {/* Chart Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded shadow-lg transition-colors"
          title="Phóng to (Zoom In)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded shadow-lg transition-colors"
          title="Thu nhỏ (Zoom Out)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>
        <button
          onClick={handleResetZoom}
          className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded shadow-lg transition-colors"
          title="Reset view"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div 
        ref={chartContainerRef} 
        className="w-full h-full"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
});

CryptoChart.displayName = 'CryptoChart';

export default CryptoChart;
