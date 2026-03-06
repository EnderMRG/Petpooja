import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const TIME_FILTERS = ['Today', 'This Week', 'All Time']

function generateReceiptText(order) {
    const w = 44
    const dash = '─'.repeat(w)
    const doubleDash = '═'.repeat(w)
    const pad = (l, r, fill = ' ') => {
        const space = w - l.length - String(r).length
        return l + fill.repeat(Math.max(1, space)) + r
    }
    const center = (text) => {
        const s = Math.max(0, Math.floor((w - text.length) / 2))
        return ' '.repeat(s) + text
    }
    const time = order.timestamp ? new Date(order.timestamp) : new Date()
    const dateStr = time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

    let lines = [
        center('🔥 THE CURRY HOUSE 🔥'),
        center('42, MG Road, Koramangala'),
        center('Bangalore - 560034'),
        center('GSTIN: 29AABCU9603R1ZM'),
        center(`Tel: +91 98765 43210`),
        doubleDash,
        center('** TAX INVOICE **'),
        doubleDash,
        pad(`Order: #${order.order_id?.slice(-6) || '0000'}`, `Table: T${Math.floor(Math.random() * 12) + 1}`),
        pad(`Date: ${dateStr}`, `Time: ${timeStr}`),
        pad(`Cashier: Rahul`, `Type: ${order.language_detected || 'English'}`),
        dash,
        pad('ITEM', 'QTY   AMOUNT'),
        dash,
    ]

    let subtotal = 0
    for (const item of (order.items || [])) {
        const qty = item.qty || 1
        const amount = item.price * qty
        subtotal += amount
        lines.push(pad(item.name, `${qty}   ₹${amount}`))
        if (item.modifiers?.length) {
            lines.push(`  → ${item.modifiers.join(', ')}`)
        }
    }

    const cgst = Math.round(subtotal * 0.025)
    const sgst = Math.round(subtotal * 0.025)
    const total = subtotal + cgst + sgst
    const savings = Math.round(total * 0.05)

    lines = lines.concat([
        dash,
        pad('Subtotal', `₹${subtotal}`),
        pad('CGST @2.5%', `₹${cgst}`),
        pad('SGST @2.5%', `₹${sgst}`),
        doubleDash,
        pad('GRAND TOTAL', `₹${total}`),
        doubleDash,
        '',
        center(`You saved ₹${savings} on this order!`),
        '',
        dash,
        center('Payment: UPI (GPay) ✓'),
        center(`Status: ${order.status === 'confirmed' ? 'PAID' : 'PENDING'}`),
        dash,
        '',
        center('Thank you for dining with us!'),
        center('Visit again soon 😊'),
        '',
        center('--- Powered by Petpooja Copilot ---'),
        '',
    ])

    return lines.join('\n')
}

function downloadReceipt(order) {
    const text = generateReceiptText(order)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Receipt_${order.order_id || 'order'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

export default function OrderHistory() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [timeFilter, setTimeFilter] = useState('All Time')
    const [expandedId, setExpandedId] = useState(null)
    const [receiptOrder, setReceiptOrder] = useState(null)

    useEffect(() => {
        fetch('/voice/orders').then(r => r.json()).then(d => {
            const sorted = (d.orders || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            setOrders(sorted)
            setLoading(false)
        })
    }, [])

    const filtered = orders.filter(order => {
        if (timeFilter === 'All Time') return true
        const orderDate = new Date(order.timestamp)
        const now = new Date()
        if (timeFilter === 'Today') return orderDate.toDateString() === now.toDateString()
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
            {/* Stats Summary Cards (moved to top) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Total Revenue</p>
                            <h4 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>₹{totalSales.toLocaleString('en-IN')}</h4>
                        </div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                            <span className="material-symbols-outlined">receipt_long</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Total Orders</p>
                            <h4 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{filtered.length}</h4>
                        </div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
                            <span className="material-symbols-outlined">avg_pace</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Avg Order Value</p>
                            <h4 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>₹{avgOrderValue}</h4>
                        </div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                            <span className="material-symbols-outlined">trending_up</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Upsell Rate</p>
                            <h4 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{filtered.length > 0 ? Math.round(filtered.filter(o => o.upsell_accepted).length / filtered.length * 100) : 0}%</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: 4, borderRadius: 12, border: '1px solid var(--border-subtle)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    {TIME_FILTERS.map(f => (
                        <button key={f} onClick={() => setTimeFilter(f)} style={{
                            padding: '8px 24px', borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
                            fontWeight: timeFilter === f ? 700 : 500,
                            background: timeFilter === f ? 'var(--primary)' : 'transparent',
                            color: timeFilter === f ? 'white' : 'var(--text-secondary)',
                            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                            boxShadow: timeFilter === f ? '0 2px 6px rgba(249, 116, 21, 0.2)' : 'none',
                        }}>{f}</button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { if (filtered.length === 0) return; const allText = filtered.map(o => generateReceiptText(o)).join('\n\n\n'); const blob = new Blob([allText], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'All_Receipts.txt'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url) }} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                        Download All
                    </button>
                </div>
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
                                <th>Date & Time</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th style={{ textAlign: 'center' }}>Language</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'center' }}>Receipt</th>
                                <th style={{ width: 40 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((order, idx) => {
                                const isExpanded = expandedId === order.order_id
                                const itemsSummary = order.items?.map(i => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join(', ') || 'No items'
                                const time = order.timestamp ? new Date(order.timestamp) : null
                                const dateStr = time ? time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''
                                const timeStr = time ? time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''

                                return (
                                    <>
                                        <tr key={order.order_id || idx}
                                            onClick={() => setExpandedId(isExpanded ? null : order.order_id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td style={{ fontWeight: 700, color: 'var(--text-primary)', paddingLeft: 24, fontFamily: 'monospace' }}>#{order.order_id?.slice(-6) || idx}</td>
                                            <td>
                                                <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{dateStr}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{timeStr}</div>
                                            </td>
                                            <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {itemsSummary}
                                            </td>
                                            <td style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>₹{order.total}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                                                    background: order.language_detected === 'English' ? 'var(--accent-blue-dim)' : order.language_detected === 'Hindi' ? 'rgba(139,92,246,0.1)' : 'var(--primary-dim)',
                                                    color: order.language_detected === 'English' ? 'var(--accent-blue)' : order.language_detected === 'Hindi' ? '#7c3aed' : 'var(--primary)',
                                                }}>{order.language_detected || 'English'}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                                                    background: order.status === 'confirmed' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                                                    color: order.status === 'confirmed' ? 'var(--accent-green)' : 'var(--accent-blue)',
                                                }}>{order.status === 'confirmed' ? '✓ Confirmed' : 'KOT Sent'}</span>
                                            </td>
                                            <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                                <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                                    <button onClick={() => setReceiptOrder(order)} title="View Receipt" style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>receipt_long</span>
                                                    </button>
                                                    <button onClick={() => downloadReceipt(order)} title="Download Receipt" style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--accent-green)' }}>download</span>
                                                    </button>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="material-symbols-outlined" style={{ color: 'var(--text-tertiary)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none', fontSize: 20 }}>expand_more</span>
                                            </td>
                                        </tr>

                                        {/* Expanded Detail Row */}
                                        {isExpanded && (
                                            <tr key={`${order.order_id}-detail`} style={{ background: 'rgba(249, 116, 21, 0.03)' }}>
                                                <td colSpan={8} style={{ padding: 24 }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, fontSize: 14 }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                            <p style={{ fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid rgba(249, 116, 21, 0.15)', paddingBottom: 4, marginBottom: 4 }}>Item Breakdown</p>
                                                            {order.items?.map((item, i) => (
                                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div>
                                                                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                                                                        <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}> × {item.qty || 1}</span>
                                                                        {item.modifiers?.length > 0 && (
                                                                            <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 2 }}>→ {item.modifiers.join(', ')}</div>
                                                                        )}
                                                                    </div>
                                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{item.price * (item.qty || 1)}</span>
                                                                </div>
                                                            ))}
                                                            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ fontWeight: 700 }}>Subtotal</span>
                                                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{order.total}</span>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                            <p style={{ fontWeight: 700, color: 'var(--text-secondary)', borderBottom: '1px solid rgba(249, 116, 21, 0.15)', paddingBottom: 4, marginBottom: 4 }}>Order Information</p>
                                                            {[
                                                                ['Payment', 'UPI (GPay)'],
                                                                ['Customer', 'Walk-in'],
                                                                ['Language', order.language_detected || 'English'],
                                                                ['Confidence', order.items?.[0]?.match_confidence ? `${Math.round(order.items[0].match_confidence)}%` : 'N/A'],
                                                            ].map(([k, v]) => (
                                                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-tertiary)' }}>
                                                                    <span>{k}:</span>
                                                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
                                                                </div>
                                                            ))}
                                                            {order.upsell_accepted && (
                                                                <p style={{ fontSize: 12, color: 'var(--primary)', marginTop: 8 }}>💎 Upsell suggestion accepted</p>
                                                            )}
                                                            <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 8 }}>
                                                                <button onClick={() => setReceiptOrder(order)} style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, background: 'var(--primary-dim)', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: 8 }}>
                                                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>receipt_long</span>
                                                                    VIEW RECEIPT
                                                                </button>
                                                                <button onClick={() => downloadReceipt(order)} style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, background: 'var(--accent-green-dim)', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: 8 }}>
                                                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
                                                                    DOWNLOAD
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

                    <div style={{ padding: '12px 24px', background: '#fafafa', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Showing {filtered.length} of {orders.length} orders</p>
                    </div>
                </div>
            )}

            {/* Receipt Preview Modal (portal) */}
            {receiptOrder && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.target === e.currentTarget && setReceiptOrder(null)}>
                    <div style={{ background: '#1a1a1a', borderRadius: 20, padding: 0, width: 440, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '16px 24px', background: '#242424', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#f97415' }}>receipt_long</span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Receipt #{receiptOrder.order_id?.slice(-6)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => downloadReceipt(receiptOrder)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #444', background: '#333', color: '#10B981', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
                                    Download
                                </button>
                                <button onClick={() => setReceiptOrder(null)} style={{ padding: '6px', borderRadius: 8, border: '1px solid #444', background: '#333', color: '#999', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                                </button>
                            </div>
                        </div>
                        {/* Receipt Content */}
                        <div style={{ padding: '24px 32px', maxHeight: 'calc(90vh - 60px)', overflow: 'auto' }}>
                            <pre style={{
                                fontFamily: "'Courier New', 'Consolas', monospace",
                                fontSize: 13.5,
                                lineHeight: 1.6,
                                color: '#e0e0e0',
                                whiteSpace: 'pre',
                                margin: 0,
                                background: 'none',
                                letterSpacing: '0.02em',
                            }}>
                                {generateReceiptText(receiptOrder)}
                            </pre>
                        </div>
                    </div>
                </div>
                , document.body)}
        </div>
    )
}
