const ConnectionStatus = ({ status }) => {
  const statusConfig = {
    connected: { color: 'bg-green-500', label: 'Connected' },
    connecting: { color: 'bg-yellow-500 animate-pulse', label: 'Connecting' },
    error: { color: 'bg-red-500', label: 'Error' },
    disconnected: { color: 'bg-gray-500', label: 'Disconnected' }
  }

  const config = statusConfig[status] || statusConfig.disconnected

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-xs text-slate-400 capitalize hidden md:inline">
        {config.label}
      </span>
    </div>
  )
}

export default ConnectionStatus
