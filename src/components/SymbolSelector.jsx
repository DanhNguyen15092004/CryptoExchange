const SymbolSelector = ({ symbols, selected, onSelect, disabled }) => {
  return (
    <div className="flex gap-2 md:gap-3 flex-wrap">
      {symbols.map((crypto) => (
        <button
          key={crypto.symbol}
          onClick={() => onSelect(crypto.symbol)}
          disabled={disabled}
          className={`px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            selected === crypto.symbol
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50'
              : 'bg-slate-800 hover:bg-slate-700'
          }`}
        >
          <span className="mr-1">{crypto.icon}</span>
          {crypto.name}
          <span className="ml-2 text-xs text-slate-400 hidden md:inline">
            {crypto.symbol}
          </span>
        </button>
      ))}
    </div>
  )
}

export default SymbolSelector
