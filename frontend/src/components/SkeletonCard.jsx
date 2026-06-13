export default function SkeletonCard() {
  return (
    <div className="bg-white/5 rounded-2xl p-5 animate-pulse">
      <div className="h-5 bg-white/10 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-white/10 rounded w-1/2 mb-2"></div>
      <div className="flex gap-2 mb-3">
        <div className="h-6 bg-white/10 rounded-full w-24"></div>
        <div className="h-6 bg-white/10 rounded-full w-20"></div>
      </div>
      <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
      <div className="h-10 bg-white/10 rounded-xl w-full"></div>
    </div>
  )
}
