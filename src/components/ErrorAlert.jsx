const ErrorAlert = ({ message }) => {
  if (!message) return null

  return (
    <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <span className="text-red-400 text-xl">⚠️</span>
        <div>
          <p className="text-red-200 font-semibold">Connection Error</p>
          <p className="text-red-300 text-sm mt-1">{message}</p>
          <p className="text-red-400 text-xs mt-2">Checking server connection...</p>
        </div>
      </div>
    </div>
  )
}

export default ErrorAlert
