import ComboStatsBar from '../components/ComboStatsBar'
import ComboCard from '../components/ComboCard'
import { combos } from '../lib/mockData'

export default function ComboEngine() {
  return (
    <div className="space-y-6">
      <ComboStatsBar />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {combos.map((combo) => (
          <ComboCard key={combo.id} combo={combo} />
        ))}
      </div>
    </div>
  )
}
