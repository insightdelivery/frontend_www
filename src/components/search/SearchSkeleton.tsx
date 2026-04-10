'use client'

export default function SearchSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[900px] animate-pulse space-y-6 py-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-6 w-40 rounded bg-gray-200" />
          <div className="flex gap-4 rounded-lg border border-gray-100 p-3">
            <div className="h-[80px] w-[120px] shrink-0 rounded bg-gray-200" />
            <div className="flex flex-1 flex-col gap-2 py-1">
              <div className="h-4 w-24 rounded bg-gray-100" />
              <div className="h-5 w-3/4 max-w-md rounded bg-gray-200" />
              <div className="h-3 w-32 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
