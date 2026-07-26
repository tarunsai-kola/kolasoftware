export default function SuperAdminLoading() {
  return (
    <div className="flex h-full flex-col space-y-8 animate-pulse p-4">
      {/* Header */}
      <div>
        <div className="h-8 w-64 rounded bg-gray-200 mb-2"></div>
        <div className="h-4 w-48 rounded bg-gray-100"></div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="h-4 w-24 rounded bg-gray-200 mb-4"></div>
            <div className="h-10 w-32 rounded bg-gray-300"></div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <div className="h-4 w-32 rounded bg-gray-200"></div>
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div>
                  <div className="h-4 w-40 rounded bg-gray-200 mb-2"></div>
                  <div className="h-3 w-24 rounded bg-gray-100"></div>
                </div>
              </div>
              <div className="h-6 w-20 rounded-full bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
