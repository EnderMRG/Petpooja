import { useState, useEffect, useMemo } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts'

const BADGE_MAP = {
    Star: 'badge-star',
    'Hidden Star': 'badge-hidden-star',
    Plowhorse: 'badge-plowhorse',
    Dog: 'badge-dog',
}

const BADGE_EMOJI = {
    Star: '⭐',
    'Hidden Star': '💎',
    Plowhorse: '🐴',
    Dog: '🐕',
}

const VELOCITY_CLASS = {
    'Fast Mover': 'velocity-fast',
    Moderate: 'velocity-moderate',
    'Slow Seller': 'velocity-slow',
}

const BAR_COLORS = [
    '#7c3aed', '#6d28d9', '#8b5cf6', '#a78bfa',
    '#3b82f6', '#2563eb', '#06b6d4', '#0891b2',
    '#10b981', '#059669',
]

export default function RevenueTable() {
    const [items, setItems] = useState([])
    const [hiddenStars, setHiddenStars] = useState([])
    const [risks, setRisks] = useState([])
    const [priceSuggestions, setPriceSuggestions] = useState([])
    const [sortKey, setSortKey] = useState('margin')
    const [sortDir, setSortDir] = useState('desc')
    const [filterCategory, setFilterCategory] = useState('All')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch('/menu/analysis').then(r => r.json()),
            fetch('/menu/hidden-stars').then(r => r.json()),
            fetch('/menu/risks').then(r => r.json()),
            fetch('/menu/price-suggestions').then(r => r.json()),
        ]).then(([analysis, hs, rk, ps]) => {
            setItems(analysis.items || [])
            setHiddenStars(hs.hidden_stars || [])
            setRisks(rk.risk_items || [])
            setPriceSuggestions(ps.suggestions || [])
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    const categories = useMemo(() => {
        const cats = new Set(items.map(i => i.category))
        return ['All', ...Array.from(cats).sort()]
    }, [items])

    const filteredItems = useMemo(() => {
        let filtered = items
        if (filterCategory !== 'All') {
            filtered = filtered.filter(i => i.category === filterCategory)
        }
        return [...filtered].sort((a, b) => {
            const mul = sortDir === 'desc' ? -1 : 1
            return (a[sortKey] - b[sortKey]) * mul
        })
    }, [items, filterCategory, sortKey, sortDir])

    const top10Margin = useMemo(() =>
        [...items].sort((a, b) => b.margin - a.margin).slice(0, 10).map(i => ({
            name: i.name.length > 18 ? i.name.slice(0, 16) + '…' : i.name,
            margin: i.margin,
        }))
        , [items])

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
        else { setSortKey(key); setSortDir('desc') }
    }

    const classificationCounts = useMemo(() => {
        const counts = { Star: 0, 'Hidden Star': 0, Plowhorse: 0, Dog: 0 }
        items.forEach(i => { if (counts[i.classification] !== undefined) counts[i.classification]++ })
        return counts
    }, [items])

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="space-y-6">
            {/* ─── Summary Cards ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Stars', count: classificationCounts.Star, emoji: '⭐', gradient: 'from-amber-600/20 to-amber-500/5', border: 'border-amber-500/20' },
                    { label: 'Hidden Stars', count: classificationCounts['Hidden Star'], emoji: '💎', gradient: 'from-purple-600/20 to-purple-500/5', border: 'border-purple-500/20', pulse: true },
                    { label: 'Plowhorses', count: classificationCounts.Plowhorse, emoji: '🐴', gradient: 'from-orange-600/20 to-orange-500/5', border: 'border-orange-500/20' },
                    { label: 'Dogs', count: classificationCounts.Dog, emoji: '🐕', gradient: 'from-slate-600/20 to-slate-500/5', border: 'border-slate-500/20' },
                ].map(card => (
                    <div key={card.label} className={`glass-card p-5 bg-gradient-to-br ${card.gradient} border ${card.border} ${card.pulse ? 'pulse-card' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{card.emoji}</span>
                            <span className="text-3xl font-bold text-white">{card.count}</span>
                        </div>
                        <p className="text-sm text-slate-400">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* ─── Top 10 Margin Chart ─── */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4">
                    📈 Top 10 Items by Contribution Margin
                </h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={top10Margin} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => `₹${v}`} />
                            <YAxis dataKey="name" type="category" width={140} tick={{ fill: '#e2e8f0', fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, color: '#f1f5f9' }}
                                formatter={(v) => [`₹${v}`, 'Margin']}
                            />
                            <Bar dataKey="margin" radius={[0, 6, 6, 0]} barSize={20}>
                                {top10Margin.map((_, i) => (
                                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ─── Price Suggestions ─── */}
            {priceSuggestions.length > 0 && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4">💡 Price Optimization Suggestions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
                        {priceSuggestions.slice(0, 8).map(s => (
                            <div key={s.item_id} className={`p-4 rounded-xl border ${s.action === 'INCREASE_PRICE' ? 'border-orange-500/20 bg-orange-500/5' :
                                    s.action === 'PROMOTE' ? 'border-purple-500/20 bg-purple-500/5' :
                                        'border-slate-500/20 bg-slate-500/5'
                                }`}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">{s.name}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.action === 'INCREASE_PRICE' ? 'bg-orange-500/20 text-orange-400' :
                                            s.action === 'PROMOTE' ? 'bg-purple-500/20 text-purple-400' :
                                                'bg-slate-500/20 text-slate-400'
                                        }`}>{s.action.replace('_', ' ')}</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">{s.reason}</p>
                                {s.suggested_price && (
                                    <p className="text-xs mt-1 text-emerald-400">Suggested: ₹{s.suggested_price} (current ₹{s.current_price})</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Menu Matrix Table ─── */}
            <div className="glass-card p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <h3 className="text-lg font-semibold">📋 Menu Profitability Matrix</h3>
                    <div className="flex gap-2 flex-wrap">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${filterCategory === cat
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[480px] overflow-y-auto rounded-xl">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th className="cursor-pointer hover:text-white" onClick={() => handleSort('selling_price')}>Price {sortKey === 'selling_price' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                                <th className="cursor-pointer hover:text-white" onClick={() => handleSort('food_cost')}>Cost {sortKey === 'food_cost' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                                <th className="cursor-pointer hover:text-white" onClick={() => handleSort('margin')}>Margin {sortKey === 'margin' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                                <th className="cursor-pointer hover:text-white" onClick={() => handleSort('margin_pct')}>Margin % {sortKey === 'margin_pct' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                                <th className="cursor-pointer hover:text-white" onClick={() => handleSort('order_count')}>Orders {sortKey === 'order_count' ? (sortDir === 'desc' ? '↓' : '↑') : ''}</th>
                                <th>Velocity</th>
                                <th>Classification</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => (
                                <tr key={item.item_id}>
                                    <td>
                                        <div>
                                            <span className="font-medium text-white">{item.name}</span>
                                            <span className="block text-xs text-slate-500">{item.category}</span>
                                        </div>
                                    </td>
                                    <td className="text-slate-300">₹{item.selling_price}</td>
                                    <td className="text-slate-400">₹{item.food_cost}</td>
                                    <td className="font-semibold text-emerald-400">₹{item.margin}</td>
                                    <td className="text-slate-300">{item.margin_pct}%</td>
                                    <td className="text-slate-300">{item.order_count}</td>
                                    <td><span className={VELOCITY_CLASS[item.velocity]}>{item.velocity}</span></td>
                                    <td>
                                        <span className={`badge ${BADGE_MAP[item.classification]}`}>
                                            {BADGE_EMOJI[item.classification]} {item.classification}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
