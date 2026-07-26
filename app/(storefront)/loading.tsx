export default function StorefrontLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Skeleton Header */}
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="h-24 w-24 rounded-full bg-gray-200 animate-pulse mb-4"></div>
        <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse"></div>
      </div>

      {/* Skeleton Category Tabs */}
      <div className="flex overflow-x-auto pb-4 mb-8 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-10 w-24 flex-shrink-0 rounded-full bg-gray-200 animate-pulse"></div>
        ))}
      </div>

      {/* Skeleton Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="h-48 w-full bg-gray-200 animate-pulse"></div>
            <div className="flex flex-1 flex-col p-6">
              <div className="h-6 w-3/4 rounded bg-gray-200 animate-pulse mb-2"></div>
              <div className="h-4 w-full rounded bg-gray-100 animate-pulse mb-1"></div>
              <div className="h-4 w-5/6 rounded bg-gray-100 animate-pulse mb-4"></div>
              <div className="mt-auto flex items-center justify-between">
                <div className="h-6 w-16 rounded bg-gray-200 animate-pulse"></div>
                <div className="h-10 w-24 rounded-lg bg-gray-200 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
