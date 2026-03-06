import { todaysCombos } from '../lib/mockData'

export default function TodaysCombos() {
  return (
    <div className="col-span-2">
      <h2 className="text-lg font-bold text-white mb-6">Today's Top Combos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {todaysCombos.map((combo) => (
          <div key={combo.id} className="glass-card p-6 hover-scale">
            <div className="mb-4">
              <div className="flex flex-wrap items-center gap-2">
                {combo.items.map((item, idx) => (
                  <div key={idx}>
                    <span className="text-sm font-semibold text-slate-200">{item}</span>
                    {idx < combo.items.length - 1 && <span className="text-slate-400 mx-1">+</span>}
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-xs text-slate-400 mb-3">{combo.confidence}</p>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-400">AOV Lift</p>
                <p className="text-lg font-bold text-emerald-400">₹{combo.aovLift}</p>
              </div>
            </div>

            <button className="w-full px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors">
              Promote
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
