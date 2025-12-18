const TimeframeSelector = ({ timeframes, selected, onSelect, disabled }) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-400 font-medium">Timeframe:</span>
      <div className="flex gap-2 flex-wrap">
        {timeframes.map((tf) => (
          <button
            key={tf.value}
            onClick={() => onSelect(tf.value)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              selected === tf.value
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default TimeframeSelector
