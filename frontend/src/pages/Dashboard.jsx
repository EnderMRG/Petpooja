import StatCard from '../components/StatCard'
import TopItemsChart from '../components/TopItemsChart'
import CategoryBreakdown from '../components/CategoryBreakdown'
import TodaysCombos from '../components/TodaysCombos'
import { dashboardStats } from '../lib/mockData'

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Stat Cards Grid - 4 columns on desktop, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-max">
        {dashboardStats.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            unit={stat.unit || ''}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Charts Section - Top Items takes 2 cols, Category takes 1 col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopItemsChart />
        </div>
        <div>
          <CategoryBreakdown />
        </div>
      </div>

      {/* Today's Combos Section */}
      <TodaysCombos />
    </div>
  )
}
