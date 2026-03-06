export default function ComboCard({ combo }) {
  return (
    <div className="glass-card p-6 hover-scale">
      <div className="mb-4">
        <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Bundle #{combo.id}</p>
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {combo.items.map((item, idx) => (
            <div key={idx} className="flex items-center">
              <span className="px-2 py-1 rounded-md bg-slate-800 text-sm font-semibold text-slate-200">
                {item}
              </span>
              {idx < combo.items.length - 1 && <span className="mx-2 text-slate-400">+</span>}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-4">Ordered together {combo.confidence}% of the time</p>

      <div className="grid grid-cols-2 gap-4 mb-4 p-3 rounded-lg bg-slate-800/50">
        <div>
          <p className="text-xs text-slate-400">AOV Lift</p>
          <p className="text-lg font-bold text-emerald-400">+₹{combo.aovLift}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Margin Score</p>
          <div className="flex gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < combo.marginScore ? 'bg-orange-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors">
          Add to Menu
        </button>
        <button className="flex-1 px-4 py-2 rounded-lg border border-orange-500 text-orange-400 hover:bg-orange-500/10 font-semibold text-sm transition-colors">
          Preview
        </button>
      </div>
    </div>
  )
}
