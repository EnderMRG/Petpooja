import { useState } from 'react'
import { orders } from '../lib/mockData'

export default function OrderHistory() {
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState('today')

  const toggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
  }

  const getStatusBadgeStyle = (status) => {
    const styles = {
      'Completed': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      'Pending': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
      'Cancelled': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' }
    }
    return styles[status] || styles['Completed']
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold text-slate-400">Filter by:</p>
        {['today', 'week', 'all'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedPeriod === period
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700'
            }`}
          >
            {period === 'today' && 'Today'}
            {period === 'week' && 'This Week'}
            {period === 'all' && 'All Time'}
          </button>
        ))}
      </div>

      {/* Orders Timeline */}
      <div className="space-y-3">
        {orders.map((order, index) => {
          const statusStyle = getStatusBadgeStyle(order.status)
          const isExpanded = expandedOrderId === order.id
          
          return (
            <div key={order.id} className="glass-card overflow-hidden">
              {/* Order Header */}
              <button
                onClick={() => toggleExpand(order.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  {/* Timeline Dot */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-500/60"></div>
                    {index < orders.length - 1 && (
                      <div className="w-0.5 h-12 bg-slate-700/50 mt-2"></div>
                    )}
                  </div>

                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-white">{order.id}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        {order.status}
                      </span>
                      <span className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded-full">
                        {order.language}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{order.items.slice(0, 2).join(', ')}{order.items.length > 2 ? `...` : ''}</p>
                  </div>

                  {/* Time & Total */}
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">₹{order.total}</p>
                    <p className="text-xs text-slate-400">{order.time}</p>
                  </div>
                </div>

                {/* Expand Icon */}
                <div className={`ml-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-slate-700/50 bg-slate-800/20 p-5 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Items</p>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-b-0">
                          <p className="text-sm text-slate-300">{item}</p>
                          <p className="text-xs text-slate-400">x1</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700/30">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-slate-300">Total:</p>
                      <p className="text-lg font-bold text-orange-400">₹{order.total}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button className="flex-1 px-4 py-2 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 text-sm font-medium transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors">
                      Duplicate Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
