import { useState, useEffect, useCallback } from 'react'
import apiFetch from '../utils/apiFetch'

const STATUS_CONFIG = {
    received: { label: 'New', color: '#f97415', bg: 'rgba(249,116,21,0.08)', next: 'preparing', nextLabel: 'Start Preparing', icon: 'inbox' },
    preparing: { label: 'Preparing', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', next: 'ready', nextLabel: 'Mark as Ready', icon: 'skillet' },
    ready: { label: 'Ready', color: '#10b981', bg: 'rgba(16,185,129,0.08)', next: 'completed', nextLabel: 'Complete & Close', icon: 'check_circle' },
}

export default function KitchenDisplay({ user, onLogout, embedded = false }) {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [lastRefresh, setLastRefresh] = useState(null)

    const fetchOrders = useCallback(async () => {
        try {
            const res = await apiFetch('/orders/active')
            const data = await res.json()
            setOrders(data.orders || [])
            setLastRefresh(new Date())
        } catch { /* silent */ } finally { setLoading(false) }
    }, [])

    useEffect(() => {
        fetchOrders()
        const iv = setInterval(fetchOrders, 10000)
        return () => clearInterval(iv)
    }, [fetchOrders])

    const updateStatus = async (orderId, newStatus) => {
        try {
            await apiFetch(`/orders/${orderId}/status`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
            await fetchOrders()
        } catch { /* silent */ }
    }

    const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter)
    const counts = {
        received: orders.filter(o => o.status === 'received').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
    }

    /* â”€â”€ Order card â€” always uses light/app theme â”€â”€ */
    const OrderCard = ({ order }) => {
        const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.received
        const ts = order.timestamp ? new Date(order.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''
        const elapsed = order.timestamp ? Math.floor((Date.now() - new Date(order.timestamp)) / 60000) : 0

        return (
            <div className="glass-card" style={{
                padding: 18, display: 'flex', flexDirection: 'column', gap: 14,
                borderTop: `3px solid ${cfg.color}`, transition: 'all 0.3s',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)' }}>{order.order_id}</div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 2 }}>Received at {ts}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 99, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{cfg.icon}</span>
                            {cfg.label}
                        </span>
                        {elapsed > 0 && (
                            <div style={{ color: elapsed > 15 ? 'var(--accent-red)' : 'var(--text-tertiary)', fontSize: 11, marginTop: 4 }}>
                                â± {elapsed}m ago{elapsed > 15 ? ' âš ' : ''}
                            </div>
                        )}
                    </div>
                </div>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {(order.items || []).map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: 'var(--bg-elevated)', borderRadius: 9 }}>
                            <span style={{ color: cfg.color, fontWeight: 800, fontSize: 15, minWidth: 28 }}>×{item.qty || 1}</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>{item.name}</span>
                            {item.modifiers?.length > 0 && (
                                <span style={{ color: 'var(--text-tertiary)', fontSize: 12, marginLeft: 'auto' }}>{item.modifiers.join(' · ')}</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Action button */}
                {cfg.next && (
                    <button onClick={() => updateStatus(order.order_id, cfg.next)}
                        style={{ padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`, color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', transition: 'opacity 0.2s', boxShadow: `0 3px 12px ${cfg.color}30` }}>
                        {cfg.nextLabel} â†’
                    </button>
                )}
            </div>
        )
    }

    /* â”€â”€ Filter tab row + refresh button â”€â”€ */
    const FilterBar = () => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                    { key: 'all', label: 'All', count: orders.length, color: 'var(--text-secondary)' },
                    { key: 'received', label: 'New', count: counts.received, color: '#f97415' },
                    { key: 'preparing', label: 'Preparing', count: counts.preparing, color: '#f59e0b' },
                    { key: 'ready', label: 'Ready', count: counts.ready, color: '#10b981' },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setFilter(tab.key)}
                        style={{ padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${filter === tab.key ? tab.color : 'var(--border-subtle)'}`, background: filter === tab.key ? `${tab.color}12` : '#fff', color: filter === tab.key ? tab.color : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
                        {tab.label}
                        <span style={{ background: filter === tab.key ? `${tab.color}20` : 'var(--bg-elevated)', color: filter === tab.key ? tab.color : 'var(--text-tertiary)', padding: '1px 7px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>{tab.count}</span>
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={fetchOrders}
                    style={{ padding: '7px 12px', background: '#fff', border: '1.5px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>refresh</span>
                    {lastRefresh ? lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Refresh'}
                </button>
                {!embedded && onLogout && (
                    <button onClick={onLogout}
                        style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.06)', border: '1.5px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>logout</span>
                        Sign Out
                    </button>
                )}
            </div>
        </div>
    )

    /* â”€â”€ Order board â”€â”€ */
    const Board = () => (
        <>
            {loading ? (
                <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 60 }}>Loading ordersâ€¦</div>
            ) : filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 80 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--text-tertiary)' }}>check_circle</span>
                    <div style={{ fontWeight: 700, marginTop: 12, color: 'var(--text-secondary)', fontSize: 16 }}>All caught up!</div>
                    <div style={{ fontSize: 13, marginTop: 4, color: 'var(--text-tertiary)' }}>No {filter !== 'all' ? filter : 'active'} orders right now.</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
                    {filteredOrders.map(order => <OrderCard key={order.order_id} order={order} />)}
                </div>
            )}
        </>
    )

    /* â”€â”€ Embedded in manager dashboard â€” no wrapper â”€â”€ */
    if (embedded) {
        return (
            <div style={{ fontFamily: 'inherit' }}>
                <FilterBar />
                <Board />
            </div>
        )
    }

    /* â”€â”€ Standalone: Kitchen role full page â€” uses the same app layout â”€â”€ */
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: "'Inter', 'Segoe UI', sans-serif", color: 'var(--text-primary)' }}>
            {/* Top bar â€” matches app topbar style */}
            <div style={{ background: '#fff', borderBottom: '1px solid var(--border-subtle)', padding: '0 28px', height: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'sticky', top: 0, zIndex: 10 }}>
                {/* Logo / branding */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={onLogout}>
                        <img src="/petpoja.png" alt="Petpooja" style={{ width: 28, objectFit: 'contain' }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>Kitchen Display</div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{user?.restaurant_name} · Auto-refreshes every 10s</div>
                    </div>
                </div>

                {/* Right controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Stat chips */}
                    {[
                        { label: 'New', count: counts.received, color: '#f97415' },
                        { label: 'Preparing', count: counts.preparing, color: '#f59e0b' },
                        { label: 'Ready', count: counts.ready, color: '#10b981' },
                    ].map(s => (
                        <div key={s.label} style={{ padding: '5px 12px', borderRadius: 99, background: `${s.color}10`, border: `1px solid ${s.color}30`, fontSize: 13, fontWeight: 700, color: s.color }}>
                            {s.count} {s.label}
                        </div>
                    ))}
                    <span style={{ color: 'var(--border-subtle)' }}>|</span>
                    <div style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                        Kitchen Staff
                    </div>
                    <button onClick={fetchOrders}
                        style={{ padding: '6px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'inherit' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>refresh</span>
                        {lastRefresh ? lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Refresh'}
                    </button>
                    <button onClick={onLogout}
                        style={{ padding: '6px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-tertiary)', fontSize: 13, fontFamily: 'inherit' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>logout</span>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div style={{ padding: '24px 28px' }}>
                {/* Page header */}
                <div style={{ marginBottom: 20 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.02em' }}>Kitchen Display System</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        {orders.length === 0 ? 'No active orders' : `${orders.length} active order${orders.length !== 1 ? 's' : ''} â€” click to update status`}
                    </p>
                </div>
                <FilterBar />
                <Board />
            </div>
        </div>
    )
}

