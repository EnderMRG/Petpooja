import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

const CATEGORIES = ['All', 'Dairy', 'Meat', 'Bakery', 'Vegetables', 'Frozen', 'Sauces', 'Oils', 'Spices', 'Beverages']

const catColor = (cat) => {
    const map = { Dairy: '#3b82f6', Meat: '#ef4444', Bakery: '#f59e0b', Vegetables: '#10b981', Frozen: '#6366f1', Sauces: '#ec4899', Oils: '#d97706', Spices: '#8b5cf6', Beverages: '#06b6d4' }
    return map[cat] || '#94a3b8'
}
const catIcon = (cat) => {
    const map = { Dairy: 'water_drop', Meat: 'restaurant', Bakery: 'bakery_dining', Vegetables: 'eco', Frozen: 'ac_unit', Sauces: 'soup_kitchen', Oils: 'water_drop', Spices: 'local_fire_department', Beverages: 'local_cafe' }
    return map[cat] || 'inventory_2'
}

const emptyForm = { name: '', category: 'Dairy', unit: 'kg', current_stock: 0, min_stock: 0, cost_per_unit: 0, supplier: '' }

export default function InventoryManager() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [showModal, setShowModal] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [restockId, setRestockId] = useState(null)
    const [restockQty, setRestockQty] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [toast, setToast] = useState(null)

    const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000) }

    const fetchItems = useCallback(async () => {
        try {
            const res = await fetch('/inventory/items')
            const data = await res.json()
            setItems(data.items || [])
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchItems() }, [fetchItems])

    // Add / Edit
    const handleSubmit = async () => {
        const url = editItem ? `/inventory/items/${editItem.ingredient_id}` : '/inventory/items'
        const method = editItem ? 'PUT' : 'POST'
        try {
            const res = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (res.ok) {
                showToast(editItem ? 'Item updated!' : 'Item added!')
                setShowModal(false)
                setEditItem(null)
                setForm(emptyForm)
                fetchItems()
            }
        } catch (e) { showToast('Operation failed', false) }
    }

    // Restock
    const handleRestock = async () => {
        if (!restockQty || isNaN(restockQty)) return
        try {
            const res = await fetch(`/inventory/items/${restockId}/restock?qty=${restockQty}`, { method: 'PATCH' })
            if (res.ok) { showToast('Stock updated!'); setRestockId(null); setRestockQty(''); fetchItems() }
        } catch (e) { showToast('Restock failed', false) }
    }

    // Delete
    const handleDelete = async (id) => {
        try {
            const res = await fetch(`/inventory/items/${id}`, { method: 'DELETE' })
            if (res.ok) { showToast('Item removed'); setDeleteConfirm(null); fetchItems() }
        } catch (e) { showToast('Delete failed', false) }
    }

    const openEdit = (item) => {
        setEditItem(item)
        setForm({ name: item.name, category: item.category, unit: item.unit, current_stock: item.current_stock, min_stock: item.min_stock, cost_per_unit: item.cost_per_unit, supplier: item.supplier || '' })
        setShowModal(true)
    }
    const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true) }

    // Filtering
    const filtered = items.filter(i => {
        const matchCat = category === 'All' || i.category === category
        const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.supplier.toLowerCase().includes(search.toLowerCase())
        return matchCat && matchSearch
    })

    // Stats
    const lowStock = items.filter(i => i.current_stock <= i.min_stock)
    const totalValue = items.reduce((s, i) => s + i.current_stock * i.cost_per_unit, 0)
    const uniqueSuppliers = new Set(items.map(i => i.supplier)).size

    const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
    const labelStyle = { fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 60 }} />)}
        </div>
    )

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* ─── Stat Cards ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>inventory_2</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Ingredients</p>
                            <h4 style={{ fontSize: 22, fontWeight: 700 }}>{items.length}</h4>
                        </div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: 20, cursor: 'pointer', border: lowStock.length > 0 ? '1px solid rgba(239,68,68,0.3)' : undefined }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--accent-red)', fontSize: 20 }}>warning</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Low Stock Alerts</p>
                            <h4 style={{ fontSize: 22, fontWeight: 700, color: lowStock.length > 0 ? 'var(--accent-red)' : undefined }}>{lowStock.length}</h4>
                        </div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--accent-green)', fontSize: 20 }}>account_balance_wallet</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Inventory Value</p>
                            <h4 style={{ fontSize: 22, fontWeight: 700 }}>₹{Math.round(totalValue).toLocaleString('en-IN')}</h4>
                        </div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--accent-blue)', fontSize: 20 }}>local_shipping</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Active Suppliers</p>
                            <h4 style={{ fontSize: 22, fontWeight: 700 }}>{uniqueSuppliers}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Toolbar ─── */}
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
                <button onClick={openAdd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                    Add Ingredient
                </button>
            </div>

            {/* ─── Low Stock Alert Banner ─── */}
            {lowStock.length > 0 && (
                <div style={{ padding: '12px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--accent-red)', fontSize: 20 }}>error</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-red)' }}>
                        {lowStock.length} ingredient{lowStock.length > 1 ? 's' : ''} below minimum stock: {lowStock.map(i => i.name).join(', ')}
                    </span>
                </div>
            )}

            {/* ─── Inventory Table ─── */}
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
                                        <span style={{
                                            padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                                            background: isLow ? 'var(--accent-red-dim)' : 'var(--accent-green-dim)',
                                            color: isLow ? 'var(--accent-red)' : 'var(--accent-green)',
                                        }}>{isLow ? '⚠ Low' : '✓ OK'}</span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 13 }}>₹{item.cost_per_unit}/{item.unit}</td>
                                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.supplier}</td>
                                    <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.last_restocked}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                            <button onClick={() => setRestockId(item.ingredient_id)} title="Restock" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--accent-green)' }}>add_shopping_cart</span>
                                            </button>
                                            <button onClick={() => openEdit(item)} title="Edit" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--accent-blue)' }}>edit</span>
                                            </button>
                                            <button onClick={() => setDeleteConfirm(item.ingredient_id)} title="Delete" style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
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

            {/* ─── Add/Edit Modal ─── */}
            {showModal && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div style={{ background: 'white', borderRadius: 16, width: 480, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
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
                                    <label style={labelStyle}>Cost per Unit (₹)</label>
                                    <input type="number" value={form.cost_per_unit} onChange={e => setForm({ ...form, cost_per_unit: parseFloat(e.target.value) || 0 })} style={inputStyle} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Supplier</label>
                                <input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} style={inputStyle} placeholder="e.g. Amul Wholesale" />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button onClick={() => setShowModal(false)} className="btn-outline" style={{ flex: 1, padding: 12 }}>Cancel</button>
                            <button onClick={handleSubmit} className="btn-primary" style={{ flex: 2, padding: 12 }}>{editItem ? 'Update' : 'Add Ingredient'}</button>
                        </div>
                    </div>
                </div>
                , document.body)}

            {/* ─── Restock Modal ─── */}
            {restockId && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.target === e.currentTarget && setRestockId(null)}>
                    <div style={{ background: 'white', borderRadius: 16, width: 360, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--accent-green)', fontSize: 24 }}>add_shopping_cart</span>
                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Restock Ingredient</h3>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                            How much stock are you adding for <strong>{items.find(i => i.ingredient_id === restockId)?.name}</strong>?
                        </p>
                        <input type="number" value={restockQty} onChange={e => setRestockQty(e.target.value)}
                            placeholder="Enter quantity..." style={inputStyle} autoFocus />
                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button onClick={() => setRestockId(null)} className="btn-outline" style={{ flex: 1, padding: 12 }}>Cancel</button>
                            <button onClick={handleRestock} className="btn-primary" style={{ flex: 2, padding: 12, background: 'var(--accent-green)' }}>Restock</button>
                        </div>
                    </div>
                </div>
                , document.body)}

            {/* ─── Delete Confirm ─── */}
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
                <div style={{ position: 'fixed', bottom: 32, right: 32, background: toast.ok ? '#0f172a' : '#ef4444', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 10000 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{toast.ok ? 'check_circle' : 'error'}</span>
                    {toast.msg}
                </div>
                , document.body)}
        </div>
    )
}
