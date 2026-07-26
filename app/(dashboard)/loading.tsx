export default function DashboardLoading() {
  return (
    <div className="flex h-full flex-col p-8">
      {/* Header Skeleton */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse mb-2"></div>
          <div className="h-4 w-64 rounded bg-gray-100 animate-pulse"></div>
        </div>
        <div className="h-10 w-32 rounded-lg bg-gray-200 animate-pulse"></div>
      </div>

      {/* Generic content skeleton (e.g., Kanban or List) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4 h-full">
        {[1, 2, 3, 4].map((col) => (
          <div key={col} className="flex flex-col gap-4 rounded-xl bg-gray-50 p-4">
            <div className="h-6 w-24 rounded bg-gray-200 animate-pulse mb-2"></div>
            
            {/* Skeleton Cards */}
            {[1, 2, 3].map((card) => (
              <div key={card} className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between mb-3">
                  <div className="h-5 w-16 rounded bg-gray-200 animate-pulse"></div>
                  <div className="h-5 w-20 rounded-full bg-gray-100 animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-gray-100 animate-pulse"></div>
                  <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
