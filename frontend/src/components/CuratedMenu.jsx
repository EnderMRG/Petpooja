import { useState, useEffect, useCallback } from 'react'
import apiFetch from '../utils/apiFetch'

const TIER_CONFIG = {
    'Must Keep': { color: '#10b981', bg: '#ecfdf5', icon: '⭐', border: '#bbf7d0' },
    'Strong Performer': { color: '#3b82f6', bg: '#eff6ff', icon: '💪', border: '#bfdbfe' },
    'Moderate': { color: '#f59e0b', bg: '#fffbeb', icon: '📊', border: '#fde68a' },
    'Consider Removing': { color: '#ef4444', bg: '#fef2f2', icon: '⚠️', border: '#fecaca' },
}

const CLASS_CONFIG = {
    'Star': { color: '#f59e0b', bg: '#fffbeb' },
    'Hidden Star': { color: '#8b5cf6', bg: '#f5f3ff' },
    'Plowhorse': { color: '#3b82f6', bg: '#eff6ff' },
    'Dog': { color: '#94a3b8', bg: '#f8fafc' },
}

const catColor = (cat) => {
    const map = { Burgers: '#ef4444', Pizzas: '#f97316', Starters: '#eab308', Beverages: '#06b6d4', Desserts: '#ec4899', 'Main Course': '#8b5cf6', Sides: '#10b981' }
    return map[cat] || '#94a3b8'
}

export default function CuratedMenu() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filterTier, setFilterTier] = useState('All')
    const [filterCat, setFilterCat] = useState('All')
    const [sortBy, setSortBy] = useState('score')
    const [view, setView] = useState('table') // 'table' | 'cards'

    const fetchCurated = useCallback(async () => {
        setLoading(true)
        try {
            const res = await apiFetch('/menu/curated')
            const d = await res.json()
            setData(d)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchCurated() }, [fetchCurated])

    const items = data?.items || []
    const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))]
    const tiers = ['All', 'Must Keep', 'Strong Performer', 'Moderate', 'Consider Removing']

    const filtered = items
        .filter(i => filterTier === 'All' || i.tier === filterTier)
        .filter(i => filterCat === 'All' || i.category === filterCat)
        .sort((a, b) => {
            if (sortBy === 'score') return b.composite_score - a.composite_score
            if (sortBy === 'margin') return b.margin - a.margin
            if (sortBy === 'orders') return b.order_count - a.order_count
            if (sortBy === 'revenue') return b.total_revenue - a.total_revenue
            if (sortBy === 'price') return b.selling_price - a.selling_price
            return 0
        })

    // Download as JSON
    const downloadJSON = () => {
        const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `curated_menu_${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    // Download as printable HTML (opens print dialog)
    const downloadPDF = () => {
        const tiersOrder = ['Must Keep', 'Strong Performer', 'Moderate', 'Consider Removing']
        const grouped = {}
        tiersOrder.forEach(t => { grouped[t] = [] })
        filtered.forEach(i => {
            if (grouped[i.tier]) grouped[i.tier].push(i)
        })

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Petpooja Curated Menu Report</title>
<style>
  body { font-family: Arial, sans-serif; color: #111; margin: 20px; font-size: 12px; }
  h1 { font-size: 20px; color: #f97415; margin-bottom: 4px; }
  .meta { color: #888; font-size: 11px; margin-bottom: 20px; }
  h2 { font-size: 14px; font-weight: bold; margin: 18px 0 6px; padding: 4px 10px; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #f1f5f9; padding: 6px 8px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #e2e8f0; }
  td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
  tr:hover td { background: #f8fafc; }
  .score-bar { display: inline-block; height: 8px; border-radius: 4px; background: #f97415; }
  .rec { font-style: italic; color: #555; font-size: 11px; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<h1>🍽️ Petpooja — Curated Menu Report</h1>
<div class="meta">Generated: ${new Date().toLocaleString('en-IN')} · ${filtered.length} items · Based on full transaction history</div>
${tiersOrder.map(tier => {
            const tItems = grouped[tier]
            if (!tItems?.length) return ''
            const colors = { 'Must Keep': '#10b981', 'Strong Performer': '#3b82f6', 'Moderate': '#f59e0b', 'Consider Removing': '#ef4444' }
            return `
<h2 style="background:${colors[tier]}15; color:${colors[tier]};">${tier} (${tItems.length})</h2>
<table>
  <thead><tr>
    <th>#</th><th>Item</th><th>Category</th><th>Price</th><th>Margin</th><th>Orders</th><th>Revenue</th><th>Score</th><th>Recommendation</th>
  </tr></thead>
  <tbody>
    ${tItems.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${item.name}</strong></td>
      <td>${item.category}</td>
      <td>₹${item.selling_price}</td>
      <td>₹${item.margin} (${item.margin_pct}%)</td>
      <td>${item.order_count}</td>
      <td>₹${item.total_revenue.toLocaleString('en-IN')}</td>
      <td><strong>${item.composite_score}</strong>/100</td>
      <td class="rec">${item.recommendation}</td>
    </tr>`).join('')}
  </tbody>
</table>`
        }).join('')}
</body></html>`

        const win = window.open('', '_blank')
        win.document.write(html)
        win.document.close()
        setTimeout(() => win.print(), 500)
    }

    const ScoreBar = ({ score }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${score}%`, height: '100%', borderRadius: 3, background: score >= 70 ? '#10b981' : score >= 50 ? '#3b82f6' : score >= 30 ? '#f59e0b' : '#ef4444', transition: 'width 0.5s' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, minWidth: 28, color: 'var(--text-secondary)' }}>{score}</span>
        </div>
    )

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* â”€â”€â”€ Header Info Banner â”€â”€â”€ */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: 16, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span className="material-symbols-outlined" style={{ color: '#f97415', fontSize: 28 }}>auto_awesome</span>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>AI-Curated Menu</h2>
                    </div>
                    <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 480 }}>
                        Items ranked by composite score using <strong style={{ color: '#cbd5e1' }}>margin (30%)</strong>, <strong style={{ color: '#cbd5e1' }}>popularity (35%)</strong>, <strong style={{ color: '#cbd5e1' }}>revenue (25%)</strong>, and <strong style={{ color: '#cbd5e1' }}>margin % (10%)</strong> — derived from your full transaction history.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                    <button onClick={downloadJSON} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'white', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                        JSON
                    </button>
                    <button onClick={downloadPDF} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, border: 'none', background: '#f97415', color: 'white', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
                        Download PDF
                    </button>
                </div>
            </div>

            {/* â”€â”€â”€ Tier Summary Cards â”€â”€â”€ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {['Must Keep', 'Strong Performer', 'Moderate', 'Consider Removing'].map(tier => {
                    const cfg = TIER_CONFIG[tier]
                    const count = data?.tiers_summary?.[tier] || 0
                    return (
                        <div key={tier} onClick={() => setFilterTier(filterTier === tier ? 'All' : tier)}
                            style={{ background: filterTier === tier ? cfg.bg : 'white', border: `1.5px solid ${filterTier === tier ? cfg.border : 'var(--border-subtle)'}`, borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: 22 }}>{cfg.icon}</div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 8 }}>{tier}</div>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{count}</div>
                                </div>
                                {filterTier === tier && <span className="material-symbols-outlined" style={{ color: cfg.color, fontSize: 18 }}>check_circle</span>}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* â”€â”€â”€ Filters & Controls â”€â”€â”€ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {categories.map(c => (
                        <button key={c} onClick={() => setFilterCat(c)} style={{
                            padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                            border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                            borderColor: filterCat === c ? 'var(--primary)' : 'var(--border-subtle)',
                            background: filterCat === c ? 'var(--primary-dim)' : 'white',
                            color: filterCat === c ? 'var(--primary)' : 'var(--text-tertiary)',
                        }}>{c}</button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', fontSize: 13, fontFamily: 'inherit', background: 'white', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <option value="score">Sort by Score</option>
                        <option value="margin">Sort by Margin</option>
                        <option value="orders">Sort by Orders</option>
                        <option value="revenue">Sort by Revenue</option>
                        <option value="price">Sort by Price</option>
                    </select>
                    <div style={{ display: 'flex', borderRadius: 10, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                        {[['table', 'table_rows'], ['cards', 'grid_view']].map(([v, icon]) => (
                            <button key={v} onClick={() => setView(v)} style={{
                                padding: '8px 12px', background: view === v ? 'var(--primary)' : 'white',
                                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: view === v ? 'white' : 'var(--text-tertiary)' }}>{icon}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* â”€â”€â”€ Count â”€â”€â”€ */}
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                Showing <strong>{filtered.length}</strong> of <strong>{items.length}</strong> items
                {filterTier !== 'All' && <> · Tier: <span style={{ color: TIER_CONFIG[filterTier]?.color, fontWeight: 600 }}>{filterTier}</span></>}
                {filterCat !== 'All' && <> · Category: <strong>{filterCat}</strong></>}
            </div>

            {/* â”€â”€â”€ Table View â”€â”€â”€ */}
            {view === 'table' && (
                <div className="glass-card" style={{ overflow: 'hidden', borderRadius: 12 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: 20, width: 36 }}>#</th>
                                <th>Item</th>
                                <th>Category</th>
                                <th style={{ textAlign: 'right' }}>Price</th>
                                <th style={{ textAlign: 'right' }}>Margin</th>
                                <th style={{ textAlign: 'right' }}>Orders</th>
                                <th style={{ textAlign: 'right' }}>Revenue</th>
                                <th style={{ textAlign: 'center' }}>Class</th>
                                <th style={{ textAlign: 'center' }}>Tier</th>
                                <th style={{ minWidth: 140 }}>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((item, idx) => {
                                const tierCfg = TIER_CONFIG[item.tier] || {}
                                const clsCfg = CLASS_CONFIG[item.classification] || {}
                                return (
                                    <tr key={item.item_id}>
                                        <td style={{ paddingLeft: 20, fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 700 }}>{idx + 1}</td>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, maxWidth: 280 }}>{item.recommendation}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${catColor(item.category)}15`, color: catColor(item.category) }}>{item.category}</span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 13 }}>₹{item.selling_price}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 13, fontWeight: 700 }}>₹{item.margin}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.margin_pct}%</div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{item.order_count}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 13 }}>₹{item.total_revenue.toLocaleString('en-IN')}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: clsCfg.bg, color: clsCfg.color }}>{item.classification}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: tierCfg.bg, color: tierCfg.color, border: `1px solid ${tierCfg.border}` }}>{item.tier}</span>
                                        </td>
                                        <td style={{ minWidth: 140 }}>
                                            <ScoreBar score={item.composite_score} />
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    <div style={{ padding: '12px 20px', background: '#fafafa', borderTop: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--text-tertiary)' }}>
                        Generated at {data?.generated_at ? new Date(data.generated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                    </div>
                </div>
            )}

            {/* â”€â”€â”€ Card View â”€â”€â”€ */}
            {view === 'cards' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {filtered.map((item, idx) => {
                        const tierCfg = TIER_CONFIG[item.tier] || {}
                        return (
                            <div key={item.item_id} className="glass-card" style={{ padding: 20, border: `1.5px solid ${tierCfg.border || 'var(--border-subtle)'}`, position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: tierCfg.bg, color: tierCfg.color }}>
                                    {tierCfg.icon} {item.tier}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>#{idx + 1} · {item.category}</div>
                                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, paddingRight: 80 }}>{item.name}</div>

                                <ScoreBar score={item.composite_score} />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                                    {[
                                        ['Price', `₹${item.selling_price}`],
                                        ['Margin', `₹${item.margin} (${item.margin_pct}%)`],
                                        ['Orders', `${item.order_count}`],
                                        ['Revenue', `₹${item.total_revenue.toLocaleString('en-IN')}`],
                                    ].map(([k, v]) => (
                                        <div key={k} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{k}</div>
                                            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{v}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                                    {item.recommendation}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

