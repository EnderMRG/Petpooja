export default function ComboStatsBar() {
  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center text-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <span className="text-slate-300">
            Analyzed <span className="font-bold text-white">2,400</span> transactions
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          <span className="text-slate-300">
            Found <span className="font-bold text-white">47</span> associations
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">✨</span>
          <span className="text-slate-300">
            <span className="font-bold text-orange-400">3</span> recommended bundles
          </span>
        </div>
      </div>
    </div>
  )
}
