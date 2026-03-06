import { useState, useEffect } from 'react'

const TIME_FILTERS = ['Today', 'This Week', 'All Time']

export default function OrderHistory() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [timeFilter, setTimeFilter] = useState('All Time')
    const [expandedId, setExpandedId] = useState(null)

    useEffect(() => {
        fetch('/voice/orders').then(r => r.json()).then(d => {
            setOrders((d.orders || []).reverse())
            setLoading(false)
        })
    }, [])

    const filtered = orders.filter(order => {
        if (timeFilter === 'All Time') return true
        const orderDate = new Date(order.timestamp)
        const now = new Date()
        if (timeFilter === 'Today') {
            return orderDate.toDateString() === now.toDateString()
        }
        if (timeFilter === 'This Week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return orderDate >= weekAgo
        }
        return true
    })

    const totalSales = filtered.reduce((s, o) => s + (o.total || 0), 0)
    const avgOrderValue = filtered.length > 0 ? Math.round(totalSales / filtered.length) : 0

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: 4, borderRadius: 12, border: '1px solid var(--border-subtle)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    {TIME_FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setTimeFilter(f)}
                            style={{
                                padding: '8px 24px',
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: timeFilter === f ? 700 : 500,
                                background: timeFilter === f ? 'var(--primary)' : 'transparent',
                                color: timeFilter === f ? 'white' : 'var(--text-secondary)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                boxShadow: timeFilter === f ? '0 2px 6px rgba(249, 116, 21, 0.2)' : 'none',
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>filter_list</span>
                    More Filters
                </button>
            </div>

            {/* Empty State */}
            {filtered.length === 0 && (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📋</div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No orders yet</p>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Place an order via the Voice Orders tab to see it here</p>
                </div>
            )}

            {/* Orders Table */}
            {filtered.length > 0 && (
                <div className="glass-card" style={{ overflow: 'hidden', borderRadius: 12 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: 24 }}>Order ID</th>
                                <th>Time</th>
                                <th>Items Summary</th>
                                <th>Total Amount</th>
                                <th style={{ textAlign: 'center' }}>Language</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ width: 40 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((order, idx) => {
                                const isExpanded = expandedId === order.order_id
                                const itemsSummary = order.items?.map(i => i.name).join(', ') || 'No items'
                                const time = order.timestamp ? new Date(order.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''

                                return (
                                    <>
                                        <tr
                                            key={order.order_id || idx}
                                            onClick={() => setExpandedId(isExpanded ? null : order.order_id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td style={{ fontWeight: 700, color: 'var(--text-primary)', paddingLeft: 24 }}>#{order.order_id?.slice(-4) || idx}</td>
                                            <td style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>{time}</td>
                                            <td style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemsSummary}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{order.total}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                                                    {order.language_detected || 'English'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                                                    background: order.status === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                    color: order.status === 'confirmed' ? 'var(--accent-green)' : 'var(--accent-blue)',
                                                }}>
                                                    {order.status === 'confirmed' ? 'Confirmed' : 'KOT Sent'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <span className="material-symbols-outlined" style={{ color: 'var(--text-tertiary)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                                            </td>
                                        </tr>

                                        {/* Expanded Row */}
                                        {isExpanded && (
                                            <tr key={`${order.order_id}-detail`} style={{ background: 'rgba(249, 116, 21, 0.03)' }}>
                                                <td colSpan={7} style={{ padding: 24 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, fontSize: 14 }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                            <p style={{ fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid rgba(249, 116, 21, 0.15)', paddingBottom: 4, marginBottom: 4 }}>Item Breakdown</p>
                                                            {order.items?.map((item, i) => (
                                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span>{item.name} × {item.qty || 1}</span>
                                                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>₹{item.price * (item.qty || 1)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                            <p style={{ fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid rgba(249, 116, 21, 0.15)', paddingBottom: 4, marginBottom: 4 }}>Order Information</p>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)' }}>
                                                                <span>Payment Method:</span>
                                                                <span style={{ color: 'var(--text-primary)' }}>UPI (GPay)</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)' }}>
                                                                <span>Customer:</span>
                                                                <span style={{ color: 'var(--text-primary)' }}>Walk-in</span>
                                                            </div>
                                                            {order.upsell_accepted && (
                                                                <p style={{ fontSize: 12, color: 'var(--primary)', marginTop: 8 }}>💎 Upsell item accepted</p>
                                                            )}
                                                            <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                                                                <button style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                                                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>print</span>
                                                                    PRINT BILL
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )
                            })}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div style={{ padding: '12px 24px', background: '#fafafa', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Showing 1 to {filtered.length} of {filtered.length} orders</p>
                    </div>
                </div>
            )}

            {/* Stats Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Total Sales Today</p>
                            <h4 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>₹{totalSales.toLocaleString('en-IN')}</h4>
                        </div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                            <span className="material-symbols-outlined">receipt_long</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Total Orders</p>
                            <h4 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{filtered.length}</h4>
                        </div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
                            <span className="material-symbols-outlined">avg_pace</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Avg Order Value</p>
                            <h4 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>₹{avgOrderValue}</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
