const PriceCard = ({ title, value, subtitle, color = 'blue', hoverColor = 'blue' }) => {
  return (
    <div className={`bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700 hover:border-${hoverColor}-500/50 transition-colors`}>
      <div className="text-slate-400 text-xs md:text-sm mb-2">{title}</div>
      <div className={`text-xl md:text-2xl font-bold text-${color}-400`}>
        {value || '-'}
      </div>
      {subtitle && (
        <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
      )}
    </div>
  )
}

export default PriceCard
