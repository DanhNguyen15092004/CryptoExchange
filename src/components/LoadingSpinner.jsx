const LoadingSpinner = ({ symbol }) => {
  return (
    <div className="flex items-center justify-center h-96 md:h-[500px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Connecting to Server...</p>
        <p className="text-slate-500 text-sm mt-2">Loading {symbol} data</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
