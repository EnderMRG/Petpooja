import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { menuCategoryBreakdown } from '../lib/mockData'

const COLORS = ['#FF6B35', '#A78BFA', '#FB923C', '#64748B']

export default function CategoryBreakdown() {
  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-bold text-white mb-6">Menu Categories</h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={menuCategoryBreakdown}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {menuCategoryBreakdown.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              background: '#1a1a2e', 
              border: '1px solid #FF6B35',
              borderRadius: '8px',
              color: '#F1F5F9'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
