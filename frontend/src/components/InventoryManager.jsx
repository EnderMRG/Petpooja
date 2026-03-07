import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import apiFetch from '../utils/apiFetch'

const CATEGORIES = ['All', 'Dairy', 'Meat', 'Bakery', 'Vegetables', 'Frozen', 'Sauces', 'Oils', 'Spices', 'Beverages']

const catColor = (cat) => {
    const map = { Dairy: '#3b82f6', Meat: '#ef4444', Bakery: '#f59e0b', Vegetables: '#10b981', Frozen: '#6366f1', Sauces: '#ec4899', Oils: '#d97706', Spices: '#8b5cf6', Beverages: '#06b6d4' }
    return map[cat] || '#94a3b8'
}
const catIcon = (cat) => {
    const map = { Dairy: 'water_drop', Meat: 'restaurant', Bakery: 'bakery_dining', Vegetables: 'eco', Frozen: 'ac_unit', Sauces: 'soup_kitchen', Oils: 'water_drop', Spices: 'local_fire_department', Beverages: 'local_cafe' }
    return map[cat] || 'inventory_2'
}

const emptyForm = { name: '', category: 'Dairy', unit: 'kg', current_stock: 0, min_stock: 0, max_stock: 0, cost_per_unit: 0, supplier: '' }

const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
const labelStyle = { fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }

export default function InventoryManager() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [showModal, setShowModal] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [supplierList, setSupplierList] = useState([])

    // Local restock (add qty only)
    const [restockId, setRestockId] = useState(null)
    const [restockQty, setRestockQty] = useState('')

    // Supplier restock request modal
    const [restockReqItem, setRestockReqItem] = useState(null)
    const [restockReqQty, setRestockReqQty] = useState('')
    const [restockSending, setRestockSending] = useState(false)

    // Restock log
    const [restockLog, setRestockLog] = useState([])
    const [showLog, setShowLog] = useState(false)

    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [toast, setToast] = useState(null)

    const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }

    const fetchItems = useCallback(async () => {
        try {
            const res = await apiFetch('/inventory/items')
            const data = await res.json()
            setItems(data.items || [])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [])

    const fetchSuppliers = useCallback(async () => {
        try {
            const res = await apiFetch('/inventory/suppliers')
            const data = await res.json()
            setSupplierList(data.suppliers || [])
        } catch (e) { console.error(e) }
    }, [])

    const fetchRestockLog = useCallback(async () => {
        try {
            const res = await apiFetch('/inventory/restock-requests')
            const data = await res.json()
            setRestockLog(data.requests || [])
        } catch (e) { console.error(e) }
    }, [])

    useEffect(() => {
        fetchItems()
        fetchSuppliers()
        fetchRestockLog()
    }, [fetchItems, fetchSuppliers, fetchRestockLog])

    // â”€â”€ Add / Edit â”€â”€
    const handleSubmit = async () => {
        const url = editItem ? `/inventory/items/${editItem.ingredient_id}` : '/inventory/items'
        const method = editItem ? 'PUT' : 'POST'
        try {
            const res = await apiFetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (res.ok) {
                showToast(editItem ? 'Item updated!' : 'Item added!')
                setShowModal(false); setEditItem(null); setForm(emptyForm); fetchItems()
            }
        } catch (e) { showToast('Operation failed', false) }
    }

    // â”€â”€ Local Restock (add qty) â”€â”€
    const handleRestock = async () => {
        if (!restockQty || isNaN(restockQty)) return
        try {
            const res = await apiFetch(`/inventory/items/${restockId}/restock?qty=${restockQty}`, { method: 'PATCH' })
            if (res.ok) { showToast('Stock updated!'); setRestockId(null); setRestockQty(''); fetchItems() }
        } catch (e) { showToast('Restock failed', false) }
    }

    // â”€â”€ Supplier Restock Request â”€â”€
    const openRestockRequest = (item) => {
        const suggestedQty = item.max_stock > 0
            ? Math.max(0, item.max_stock - item.current_stock)
            : item.min_stock * 2 - item.current_stock
        setRestockReqItem(item)
        setRestockReqQty(Math.ceil(Math.max(1, suggestedQty)).toString())
    }

    const handleSendRestockRequest = async () => {
        if (!restockReqQty || isNaN(restockReqQty) || !restockReqItem) return
        setRestockSending(true)
        try {
            const res = await apiFetch('/inventory/restock-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ingredient_id: restockReqItem.ingredient_id,
                    qty_requested: parseFloat(restockReqQty),
                }),
            })
            const data = await res.json()
            if (res.ok) {
                const status = data.log?.status
                const msg = status === 'acknowledged'
                    ? `âœ“ Restock order sent & acknowledged by ${restockReqItem.supplier}!`
                    : `Restock order sent (no supplier ack)`
                showToast(msg)
                setRestockReqItem(null)
                fetchRestockLog()
                setShowLog(true)
            } else {
                showToast('Failed to send restock request', false)
            }
        } catch (e) { showToast('Network error', false) }
        finally { setRestockSending(false) }
    }

    // â”€â”€ Delete â”€â”€
    const handleDelete = async (id) => {
        try {
            const res = await apiFetch(`/inventory/items/${id}`, { method: 'DELETE' })
            if (res.ok) { showToast('Item removed'); setDeleteConfirm(null); fetchItems() }
        } catch (e) { showToast('Delete failed', false) }
    }

    const openEdit = (item) => {
        setEditItem(item)
        setForm({
            name: item.name, category: item.category, unit: item.unit,
            current_stock: item.current_stock, min_stock: item.min_stock,
            max_stock: item.max_stock || 0,
            cost_per_unit: item.cost_per_unit, supplier: item.supplier || ''
        })
        setShowModal(true)
    }
    const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true) }

    const filtered = items.filter(i => {
        const matchCat = category === 'All' || i.category === category
        const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || (i.supplier || '').toLowerCase().includes(search.toLowerCase())
        return matchCat && matchSearch
    })

    const lowStock = items.filter(i => i.current_stock <= i.min_stock)
    const totalValue = items.reduce((s, i) => s + i.current_stock * i.cost_per_unit, 0)
    const uniqueSuppliers = new Set(items.map(i => i.supplier).filter(Boolean)).size

    const statusBadgeStyle = (ok) => ({
        padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
        background: ok ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)',
        color: ok ? 'var(--accent-green)' : 'var(--accent-red)',
    })

    const logStatusColor = (s) => ({
        acknowledged: '#10b981', sent: '#f59e0b', sent_no_ack: '#f59e0b',
        no_supplier_mapped: '#94a3b8',
    }[s] || '#94a3b8')

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* â”€â”€â”€ Stat Cards â”€â”€â”€ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                    { icon: 'inventory_2', label: 'Total Ingredients', value: items.length, color: 'var(--primary)', bg: 'var(--primary-dim)' },
                    { icon: 'warning', label: 'Low Stock Alerts', value: lowStock.length, color: 'var(--accent-red)', bg: 'var(--accent-red-dim)', red: lowStock.length > 0 },
                    { icon: 'account_balance_wallet', label: 'Inventory Value', value: `₹${Math.round(totalValue).toLocaleString('en-IN')}`, color: 'var(--accent-green)', bg: 'var(--accent-green-dim)' },
                    { icon: 'local_shipping', label: 'Active Suppliers', value: uniqueSuppliers, color: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)' },
                ].map(({ icon, label, value, color, bg, red }) => (
                    <div key={label} className="glass-card" style={{ padding: 20, border: red ? '1px solid rgba(239,68,68,0.3)' : undefined }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ color, fontSize: 20 }}>{icon}</span>
                            </div>
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{label}</p>
                                <h4 style={{ fontSize: 22, fontWeight: 700, color: red ? color : undefined }}>{value}</h4>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* â”€â”€â”€ Toolbar â”€â”€â”€ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search ingredients or suppliers..." className="search-input"
                        style={{ maxWidth: 320, paddingLeft: 16 }} />
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {CATEGORIES.map(c => (
                            <button key={c} onClick={() => setCategory(c)} style={{
                                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                                border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                                borderColor: category === c ? 'var(--primary)' : 'var(--border-subtle)',
                                background: category === c ? 'var(--primary-dim)' : 'white',
                                color: category === c ? 'var(--primary)' : 'var(--text-tertiary)',
                            }}>{c}</button>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setShowLog(v => !v); fetchRestockLog() }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: showLog ? 'var(--primary-dim)' : 'white', color: showLog ? 'var(--primary)' : 'var(--text-secondary)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>receipt_long</span>
                        Restock Log {restockLog.length > 0 && <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 999, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{restockLog.length}</span>}
                    </button>
                    <button onClick={openAdd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                        Add Ingredient
                    </button>
                </div>
            </div>

            {/* â”€â”€â”€ Low Stock Alert Banner â”€â”€â”€ */}
            {lowStock.length > 0 && (
                <div style={{ padding: '12px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--accent-red)', fontSize: 20 }}>error</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-red)' }}>
                            {lowStock.length} ingredient{lowStock.length > 1 ? 's' : ''} below minimum: {lowStock.map(i => i.name).join(', ')}
                        </span>
                    </div>
                    <button onClick={() => { openRestockRequest(lowStock[0]) }}
                        style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--accent-red)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                        Request Restock
                    </button>
                </div>
            )}

            {/* â”€â”€â”€ Restock Log (shown above table) â”€â”€â”€ */}
            {showLog && (
                <div className="glass-card" style={{ borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>receipt_long</span>
                            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Supplier Restock Log</h3>
                            <span style={{ background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{restockLog.length} orders</span>
                        </div>
                        <button onClick={() => setShowLog(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                        </button>
                    </div>
                    {restockLog.length === 0 ? (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
                            No restock requests sent yet.
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: 20 }}>PO Number</th>
                                    <th>Ingredient</th>
                                    <th style={{ textAlign: 'right' }}>Qty Requested</th>
                                    <th>Supplier</th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                    <th>Supplier Response</th>
                                    <th style={{ textAlign: 'center' }}>ETA</th>
                                    <th>Sent At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...restockLog].reverse().map((entry, i) => (
                                    <tr key={i}>
                                        <td style={{ paddingLeft: 20 }}>
                                            <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-tertiary)' }}>{entry.po_number}</span>
                                        </td>
                                        <td style={{ fontWeight: 600, fontSize: 13 }}>{entry.ingredient_name}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{entry.qty_requested} {entry.unit}</td>
                                        <td style={{ fontSize: 13 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>storefront</span>
                                                {entry.supplier || 'â€”'}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: `${logStatusColor(entry.status)}20`, color: logStatusColor(entry.status) }}>
                                                {entry.status === 'acknowledged' ? 'âœ“ Acknowledged' :
                                                    entry.status === 'sent' ? '⏳ Sent' :
                                                        entry.status === 'sent_no_ack' ? 'âš  No Ack' : 'â€” Unmapped'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 220 }}>{entry.supplier_response || 'â€”'}</td>
                                        <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
                                            {entry.eta_days != null ? `${entry.eta_days}d` : 'â€”'}
                                        </td>
                                        <td style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                            {new Date(entry.sent_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* â”€â”€â”€ Inventory Table â”€â”€â”€ */}
            <div className="glass-card" style={{ overflow: 'hidden', borderRadius: 12 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ paddingLeft: 20 }}>Ingredient</th>
                            <th>Category</th>
                            <th style={{ textAlign: 'right' }}>Stock</th>
                            <th style={{ textAlign: 'right' }}>Min Stock</th>
                            <th style={{ textAlign: 'center' }}>Status</th>
                            <th style={{ textAlign: 'right' }}>Unit Cost</th>
                            <th>Supplier</th>
                            <th>Last Restocked</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(item => {
                            const isLow = item.current_stock <= item.min_stock
                            const stockPct = item.min_stock > 0 ? Math.min(100, Math.round((item.current_stock / (item.min_stock * 2)) * 100)) : 100
                            return (
                                <tr key={item.ingredient_id}>
                                    <td style={{ paddingLeft: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${catColor(item.category)}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: catColor(item.category) }}>{catIcon(item.category)}</span>
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{item.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${catColor(item.category)}15`, color: catColor(item.category) }}>{item.category}</span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                            <span style={{ fontWeight: 700, fontSize: 14, color: isLow ? 'var(--accent-red)' : 'var(--text-primary)' }}>{item.current_stock} {item.unit}</span>
                                            <div style={{ width: 60, height: 4, borderRadius: 2, background: '#f1f5f9', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', borderRadius: 2, width: `${stockPct}%`, background: isLow ? 'var(--accent-red)' : stockPct > 60 ? 'var(--accent-green)' : '#f59e0b', transition: 'width 0.3s' }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-tertiary)' }}>{item.min_stock} {item.unit}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={statusBadgeStyle(!isLow)}>{isLow ? 'âš  Low' : 'âœ“ OK'}</span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 13 }}>₹{item.cost_per_unit}/{item.unit}</td>
                                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                        {item.supplier ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>storefront</span>
                                                {item.supplier}
                                            </span>
                                        ) : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>â€”</span>}
                                    </td>
                                    <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.last_restocked}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                            {/* Send Restock Request to Supplier */}
                                            <button onClick={() => openRestockRequest(item)} title="Request Supplier Restock"
                                                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: isLow ? 'rgba(239,68,68,0.06)' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 15, color: isLow ? 'var(--accent-red)' : 'var(--primary)' }}>send</span>
                                            </button>
                                            {/* Local Restock (add qty) */}
                                            <button onClick={() => setRestockId(item.ingredient_id)} title="Add to Stock"
                                                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--accent-green)' }}>add_shopping_cart</span>
                                            </button>
                                            <button onClick={() => openEdit(item)} title="Edit"
                                                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--accent-blue)' }}>edit</span>
                                            </button>
                                            <button onClick={() => setDeleteConfirm(item.ingredient_id)} title="Delete"
                                                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--accent-red)' }}>delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                <div style={{ padding: '12px 20px', background: '#fafafa', borderTop: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--text-tertiary)' }}>
                    Showing {filtered.length} of {items.length} ingredients
                </div>
            </div>



            {/* â”€â”€â”€ Add/Edit Modal â”€â”€â”€ */}
            {showModal && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div style={{ background: 'white', borderRadius: 16, width: 520, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editItem ? 'Edit Ingredient' : 'Add New Ingredient'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={labelStyle}>Name</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="e.g. Mozzarella Cheese" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={labelStyle}>Category</label>
                                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                                        {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Unit</label>
                                    <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} style={inputStyle}>
                                        {['kg', 'litre', 'pcs', 'gm', 'ml'].map(u => <option key={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={labelStyle}>Current Stock</label>
                                    <input type="number" value={form.current_stock} onChange={e => setForm({ ...form, current_stock: parseFloat(e.target.value) || 0 })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Min Stock</label>
                                    <input type="number" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: parseFloat(e.target.value) || 0 })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Max Stock</label>
                                    <input type="number" value={form.max_stock} onChange={e => setForm({ ...form, max_stock: parseFloat(e.target.value) || 0 })} style={inputStyle} placeholder="Optional" />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Cost per Unit (₹)</label>
                                <input type="number" value={form.cost_per_unit} onChange={e => setForm({ ...form, cost_per_unit: parseFloat(e.target.value) || 0 })} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Supplier</label>
                                <select value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} style={inputStyle}>
                                    <option value="">â€” Select supplier or type below â€”</option>
                                    {supplierList.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} style={{ ...inputStyle, marginTop: 6 }} placeholder="Or type a custom supplier name..." />
                                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                                    â“˜ A linked supplier enables the Restock Request workflow (sends order to supplier's API).
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button onClick={() => setShowModal(false)} className="btn-outline" style={{ flex: 1, padding: 12 }}>Cancel</button>
                            <button onClick={handleSubmit} className="btn-primary" style={{ flex: 2, padding: 12 }}>{editItem ? 'Update' : 'Add Ingredient'}</button>
                        </div>
                    </div>
                </div>
                , document.body)}

            {/* â”€â”€â”€ Supplier Restock Request Modal â”€â”€â”€ */}
            {restockReqItem && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.target === e.currentTarget && !restockSending && setRestockReqItem(null)}>
                    <div style={{ background: 'white', borderRadius: 16, width: 440, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 22 }}>send</span>
                            </div>
                            <div>
                                <h3 style={{ fontSize: 17, fontWeight: 700 }}>Send Restock Request</h3>
                                <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Sends a purchase order to the supplier's API</p>
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, margin: '16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                ['Ingredient', restockReqItem.name],
                                ['Current Stock', `${restockReqItem.current_stock} ${restockReqItem.unit}`],
                                ['Min Stock', `${restockReqItem.min_stock} ${restockReqItem.unit}`],
                                ['Supplier', restockReqItem.supplier || 'Not assigned'],
                                ['Webhook URL', restockReqItem.supplier ? `http://localhost:8001/suppliers/...` : 'No webhook mapped'],
                            ].map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                    <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>{k}</span>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
                                </div>
                            ))}
                        </div>

                        {!restockReqItem.supplier && (
                            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', marginBottom: 12, fontSize: 12, color: '#b45309' }}>
                                âš  No supplier linked. Edit this ingredient to assign a supplier and enable webhook delivery.
                            </div>
                        )}

                        <div style={{ marginBottom: 16 }}>
                            <label style={labelStyle}>Quantity to Order ({restockReqItem.unit})</label>
                            <input type="number" value={restockReqQty} onChange={e => setRestockReqQty(e.target.value)}
                                style={inputStyle} placeholder="Enter quantity..." autoFocus />
                            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                                Suggested: ~{Math.ceil(Math.max(1, (restockReqItem.max_stock || restockReqItem.min_stock * 2) - restockReqItem.current_stock))} {restockReqItem.unit} to reach target stock
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setRestockReqItem(null)} className="btn-outline" style={{ flex: 1, padding: 12 }} disabled={restockSending}>Cancel</button>
                            <button onClick={handleSendRestockRequest} className="btn-primary" style={{ flex: 2, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={restockSending}>
                                {restockSending
                                    ? <><span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>refresh</span> Sending...</>
                                    : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span> Send Restock Order</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
                , document.body)}

            {/* â”€â”€â”€ Local Restock (add qty) Modal â”€â”€â”€ */}
            {restockId && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.target === e.currentTarget && setRestockId(null)}>
                    <div style={{ background: 'white', borderRadius: 16, width: 360, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--accent-green)', fontSize: 24 }}>add_shopping_cart</span>
                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Add Stock Locally</h3>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                            Adding stock directly to <strong>{items.find(i => i.ingredient_id === restockId)?.name}</strong> (no supplier order sent).
                        </p>
                        <input type="number" value={restockQty} onChange={e => setRestockQty(e.target.value)}
                            placeholder="Enter quantity to add..." style={inputStyle} autoFocus />
                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button onClick={() => setRestockId(null)} className="btn-outline" style={{ flex: 1, padding: 12 }}>Cancel</button>
                            <button onClick={handleRestock} className="btn-primary" style={{ flex: 2, padding: 12, background: 'var(--accent-green)' }}>Add Stock</button>
                        </div>
                    </div>
                </div>
                , document.body)}

            {/* â”€â”€â”€ Delete Confirm â”€â”€â”€ */}
            {deleteConfirm && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
                    <div style={{ background: 'white', borderRadius: 16, width: 360, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--accent-red)', marginBottom: 12 }}>delete_forever</span>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Remove Ingredient?</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>This will permanently delete this ingredient from your inventory.</p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setDeleteConfirm(null)} className="btn-outline" style={{ flex: 1, padding: 12 }}>Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Yes, Remove</button>
                        </div>
                    </div>
                </div>
                , document.body)}

            {/* Toast */}
            {toast && createPortal(
                <div style={{ position: 'fixed', bottom: 32, right: 32, background: toast.ok ? '#0f172a' : '#ef4444', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 10000, maxWidth: 360 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{toast.ok ? 'check_circle' : 'error'}</span>
                    {toast.msg}
                </div>
                , document.body)}
        </div>
    )
}

