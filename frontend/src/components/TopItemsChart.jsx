import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { topItemsData } from '../lib/mockData'

export default function TopItemsChart() {
  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-bold text-white mb-6">Top 10 Items by Contribution Margin</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={topItemsData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
          <XAxis dataKey="name" stroke="#64748B" angle={-45} textAnchor="end" height={100} style={{ fontSize: '12px' }} />
          <YAxis stroke="#64748B" style={{ fontSize: '12px' }} />
          <Tooltip 
            contentStyle={{ 
              background: '#1a1a2e', 
              border: '1px solid #FF6B35', 
              borderRadius: '8px',
              color: '#F1F5F9'
            }}
            formatter={(value) => [`${value}%`, 'Margin']}
          />
          <Bar dataKey="margin" fill="#FF6B35" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
