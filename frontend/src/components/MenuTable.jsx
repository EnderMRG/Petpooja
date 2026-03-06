import { useState } from 'react'
import { menuItems } from '../lib/mockData'

export default function MenuTable({ filter, searchTerm }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  // Filter items
  let filteredItems = menuItems
  
  if (filter === 'star') {
    filteredItems = filteredItems.filter(item => item.status === 'Star')
  } else if (filter === 'hidden') {
    filteredItems = filteredItems.filter(item => item.status === 'Hidden Star')
  } else if (filter === 'plowhorse') {
    filteredItems = filteredItems.filter(item => item.status === 'Plowhorse')
  } else if (filter === 'dog') {
    filteredItems = filteredItems.filter(item => item.status === 'Dog')
  }

  if (searchTerm) {
    filteredItems = filteredItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // Sort items
  if (sortConfig.key) {
    filteredItems = [...filteredItems].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (typeof aValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return sortConfig.direction === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    })
  }

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getStatusColor = (status) => {
    const colors = {
      'Star': '#FF6B35',
      'Hidden Star': '#A78BFA',
      'Plowhorse': '#FB923C',
      'Dog': '#64748B'
    }
    return colors[status] || '#94A3B8'
  }

  const getStatusBg = (status) => {
    const colors = {
      'Star': '#FF6B3515',
      'Hidden Star': '#A78BFA15',
      'Plowhorse': '#FB923C15',
      'Dog': '#64748B15'
    }
    return colors[status] || '#64748B15'
  }

  return (
    <div className="glass-card overflow-hidden">
      <table className="data-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')} className="cursor-pointer hover:text-orange-400">Item Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
            <th onClick={() => handleSort('category')} className="cursor-pointer hover:text-orange-400">Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
            <th onClick={() => handleSort('price')} className="cursor-pointer hover:text-orange-400">Price {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
            <th onClick={() => handleSort('cost')} className="cursor-pointer hover:text-orange-400">Cost {sortConfig.key === 'cost' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
            <th onClick={() => handleSort('margin')} className="cursor-pointer hover:text-orange-400">Margin {sortConfig.key === 'margin' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
            <th>Velocity</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item) => (
            <tr key={item.id} className={item.status === 'Hidden Star' ? 'border-l-2 border-orange-500' : ''}>
              <td className="font-semibold">{item.name}</td>
              <td>
                <span className="px-2 py-1 rounded-md bg-slate-800 text-xs text-slate-300">
                  {item.category}
                </span>
              </td>
              <td>₹{item.price}</td>
              <td>₹{item.cost}</td>
              <td>
                <span className="font-semibold text-emerald-400">{item.margin.toFixed(1)}%</span>
              </td>
              <td>
                <span className={`font-semibold ${
                  item.velocity === 'Fast' ? 'text-emerald-400' : 
                  item.velocity === 'Moderate' ? 'text-amber-400' : 
                  'text-red-400'
                }`}>
                  {item.velocity}
                </span>
              </td>
              <td>
                <span 
                  className="px-2 py-1 rounded-md text-xs font-semibold"
                  style={{ 
                    background: getStatusBg(item.status),
                    color: getStatusColor(item.status)
                  }}
                >
                  {item.status}
                </span>
              </td>
              <td>
                <button className="px-3 py-1 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors">
                  {item.status === 'Hidden Star' ? 'Promote' : 'Edit'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
