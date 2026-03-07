import { useState, useEffect, useMemo } from 'react'
import apiFetch from '../utils/apiFetch'

const STATUS_MAP = {
    Star: { badge: 'badge-star', label: 'Star', icon: 'star' },
    'Hidden Star': { badge: 'badge-hidden', label: 'Hidden Star', icon: 'auto_awesome' },
    Plowhorse: { badge: 'badge-plowhorse', label: 'Plowhorse', icon: 'warning' },
    Dog: { badge: 'badge-dog', label: 'Dog', icon: 'skull' },
}

const VELOCITY_MAP = {
    'Fast Mover': 'badge-fast',
    Moderate: 'badge-moderate',
    'Slow Seller': 'badge-slow',
}

const VELOCITY_LABELS = {
    'Fast Mover': 'Fast',
    Moderate: 'Moderate',
    'Slow Seller': 'Slow',
}

const FILTERS = ['All', 'Star', 'Hidden Star', 'Plowhorse', 'Dog']

export default function MenuIntelligence() {
    const [items, setItems] = useState([])
    const [filter, setFilter] = useState('All')
    const [search, setSearch] = useState('')
    const [sortKey, setSortKey] = useState('margin')
    const [sortDir, setSortDir] = useState('desc')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiFetch('/menu/analysis').then(r => r.json()).then(d => {
            setItems(d.items || [])
            setLoading(false)
        })
    }, [])

    const filtered = useMemo(() => {
        let list = items
        if (filter !== 'All') list = list.filter(i => i.classification === filter)
        if (search.trim()) list = list.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
        return [...list].sort((a, b) => {
            const m = sortDir === 'desc' ? -1 : 1
            return (a[sortKey] - b[sortKey]) * m
        })
    }, [items, filter, search, sortKey, sortDir])

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
        else { setSortKey(key); setSortDir('desc') }
    }

    const sortArrow = (key) => sortKey === key ? (sortDir === 'desc' ? ' â†“' : ' â†‘') : ''

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* â”€â”€â”€ Filters & Search â”€â”€â”€ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', overflowX: 'auto', paddingBottom: 4 }}>
                    {FILTERS.map(f => (
                        <button key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                            {f === 'All' ? 'All Items' : f === 'Hidden Star' ? '💎 Hidden Stars' : f === 'Star' ? '⭐ Stars' : f === 'Plowhorse' ? '🐎 Plowhorses' : '🐕 Dogs'}
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative', maxWidth: 320 }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>search</span>
                    <input
                        className="search-input"
                        placeholder="Search menu item..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* â”€â”€â”€ Table â”€â”€â”€ */}
            <div className="glass-card" style={{ overflow: 'hidden', borderRadius: 12 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: 24 }}>Item Name</th>
                                <th>Category</th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('selling_price')}>Selling Price{sortArrow('selling_price')}</th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('food_cost')}>Food Cost{sortArrow('food_cost')}</th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('margin')}>Contribution Margin{sortArrow('margin')}</th>
                                <th style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => handleSort('order_count')}>Velocity{sortArrow('order_count')}</th>
                                <th>Menu Status</th>
                                <th style={{ textAlign: 'right', paddingRight: 24 }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(item => {
                                const status = STATUS_MAP[item.classification]
                                return (
                                    <tr key={item.item_id} className={item.classification === 'Hidden Star' ? 'hidden-star-row' : ''}>
                                        <td style={{ fontWeight: 500, color: 'var(--text-primary)', paddingLeft: 24 }}>{item.name}</td>
                                        <td><span className="badge-category">{item.category}</span></td>
                                        <td style={{ color: 'var(--text-secondary)' }}>₹{item.selling_price}</td>
                                        <td style={{ color: 'var(--text-tertiary)' }}>₹{item.food_cost}</td>
                                        <td>
                                            <div style={{ fontWeight: 500, color: item.classification === 'Dog' ? '#f43f5e' : 'var(--accent-green)' }}>₹{item.margin}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.margin_pct}% margin</div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`badge ${VELOCITY_MAP[item.velocity]}`}>
                                                {VELOCITY_LABELS[item.velocity] || item.velocity}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, color: status?.badge === 'badge-star' ? 'var(--primary)' : status?.badge === 'badge-hidden' ? '#d97706' : status?.badge === 'badge-plowhorse' ? '#64748b' : '#94a3b8' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{status?.icon}</span>
                                                {status?.label}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', paddingRight: 24 }}>
                                            {item.classification === 'Star' && (
                                                <button className="btn-primary btn-sm">Promote</button>
                                            )}
                                            {item.classification === 'Hidden Star' && (
                                                <button className="btn-outline btn-sm" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>Review Pricing</button>
                                            )}
                                            {item.classification === 'Plowhorse' && (
                                                <button className="btn-outline btn-sm">Optimize</button>
                                            )}
                                            {item.classification === 'Dog' && (
                                                <button className="btn-outline btn-sm" style={{ borderColor: '#fda4af', color: '#f43f5e' }}>Review</button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-subtle)', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Showing {filtered.length} of {items.length} menu items</p>
                </div>
            </div>

            {/* â”€â”€â”€ Insight Cards â”€â”€â”€ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                <div className="insight-card ai">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>tips_and_updates</span>
                        <h4 style={{ fontSize: 14, fontWeight: 600 }}>AI Recommendation</h4>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Hidden Star items have high margins but moderate sales. Try highlighting them in the "Chef's Specials" section to convert them into Stars.
                    </p>
                </div>
                <div className="insight-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--text-tertiary)' }}>trending_up</span>
                        <h4 style={{ fontSize: 14, fontWeight: 600 }}>Category Performance</h4>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Main Course items are your primary revenue driver (52%), followed by Appetizers (28%). Beverages show the highest potential for growth.
                    </p>
                </div>
                <div className="insight-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--text-tertiary)' }}>warning</span>
                        <h4 style={{ fontSize: 14, fontWeight: 600 }}>Cost Alert</h4>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Raw material costs for Dairy have increased by 12% this week. This impacts margins for multiple menu items.
                    </p>
                </div>
            </div>
        </div>
    )
}

