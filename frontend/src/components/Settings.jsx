import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

const CATEGORIES = ['Burgers', 'Pizzas', 'Starters', 'Beverages', 'Desserts', 'Main Course', 'Sides', 'Other']

function MenuManagement({ cardStyle, inputStyle, labelStyle }) {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterCat, setFilterCat] = useState('All')
    const [showModal, setShowModal] = useState(false)
    const [editItem, setEditItem] = useState(null)  // null = add new
    const [form, setForm] = useState({ name: '', category: 'Burgers', selling_price: '', food_cost: '', is_available: true })
    const [submitting, setSubmitting] = useState(false)
    const [toast, setToast] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [inventoryItems, setInventoryItems] = useState([])
    const [recipeIngredients, setRecipeIngredients] = useState([])

    const showToast = (msg, ok = true) => {
        setToast({ msg, ok })
        setTimeout(() => setToast(null), 2500)
    }

    const fetchItems = useCallback(async () => {
        try {
            const res = await fetch('/menu/items')
            const data = await res.json()
            setItems(data.items || [])
        } catch (e) {
            showToast('Failed to load menu items', false)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchItems() }, [fetchItems])

    // Fetch inventory items for recipe dropdown
    const fetchInventory = async () => {
        try {
            const res = await fetch('/inventory/items')
            const data = await res.json()
            setInventoryItems(data.items || [])
        } catch (e) { console.error(e) }
    }

    const fetchRecipe = async (itemId) => {
        try {
            const res = await fetch(`/recipes/${itemId}`)
            const data = await res.json()
            setRecipeIngredients(data.ingredients || [])
        } catch (e) { setRecipeIngredients([]) }
    }

    const openAdd = () => {
        setEditItem(null)
        setForm({ name: '', category: 'Burgers', selling_price: '', food_cost: '', is_available: true })
        setRecipeIngredients([])
        fetchInventory()
        setShowModal(true)
    }

    const openEdit = (item) => {
        setEditItem(item)
        setForm({ name: item.name, category: item.category, selling_price: item.selling_price, food_cost: item.food_cost, is_available: item.is_available })
        fetchInventory()
        fetchRecipe(item.item_id)
        setShowModal(true)
    }

    const addRecipeRow = () => setRecipeIngredients(r => [...r, { ingredient_id: '', name: '', qty: 0, unit: '' }])
    const removeRecipeRow = (idx) => setRecipeIngredients(r => r.filter((_, i) => i !== idx))
    const updateRecipeRow = (idx, field, val) => setRecipeIngredients(r => r.map((row, i) => {
        if (i !== idx) return row
        if (field === 'ingredient_id') {
            const inv = inventoryItems.find(it => it.ingredient_id === val)
            return { ...row, ingredient_id: val, name: inv?.name || '', unit: inv?.unit || '' }
        }
        return { ...row, [field]: field === 'qty' ? parseFloat(val) || 0 : val }
    }))

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.selling_price || !form.food_cost) {
            showToast('Please fill all required fields', false)
            return
        }
        setSubmitting(true)
        try {
            const body = { name: form.name.trim(), category: form.category, selling_price: +form.selling_price, food_cost: +form.food_cost, is_available: form.is_available }
            let itemId = editItem?.item_id
            if (editItem) {
                await fetch(`/menu/items/${editItem.item_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            } else {
                const res = await fetch('/menu/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                const data = await res.json()
                itemId = data.item?.item_id
            }
            // Save recipe
            if (itemId && recipeIngredients.length > 0) {
                const validIngredients = recipeIngredients.filter(r => r.ingredient_id && r.qty > 0)
                await fetch(`/recipes/${itemId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validIngredients) })
            }
            showToast(editItem ? `"${form.name}" updated` : `"${form.name}" added to menu`)
            setShowModal(false)
            fetchItems()
        } catch {
            showToast('Operation failed', false)
        } finally {
            setSubmitting(false)
        }
    }

    const toggleAvailability = async (item) => {
        try {
            await fetch(`/menu/items/${item.item_id}/toggle`, { method: 'PATCH' })
            setItems(prev => prev.map(i => i.item_id === item.item_id ? { ...i, is_available: !i.is_available } : i))
        } catch {
            showToast('Toggle failed', false)
        }
    }

    const handleDelete = async (item) => {
        try {
            await fetch(`/menu/items/${item.item_id}`, { method: 'DELETE' })
            setItems(prev => prev.filter(i => i.item_id !== item.item_id))
            showToast(`"${item.name}" removed`)
        } catch {
            showToast('Delete failed', false)
        } finally {
            setDeleteConfirm(null)
        }
    }

    const filtered = items.filter(i => {
        const matchCat = filterCat === 'All' || i.category === filterCat
        const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase())
        return matchCat && matchSearch
    })

    const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))]
    const margin = (item) => item.selling_price > 0 ? Math.round(((item.selling_price - item.food_cost) / item.selling_price) * 100) : 0

    const toggleBtn = (on) => ({
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: on ? '#10B981' : '#cbd5e1', display: 'flex', alignItems: 'center', padding: 2,
        transition: 'background 0.2s', flexShrink: 0,
    })
    const toggleDot = (on) => ({
        width: 18, height: 18, borderRadius: '50%', background: 'white',
        transform: on ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 0.2s',
    })

    return (
        <div>
            {/* Header bar */}
            <div style={{ ...cardStyle, marginBottom: 16, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Menu Items</h3>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{items.length} items across {categories.length - 1} categories</div>
                    </div>
                    <button onClick={openAdd} className="btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                        Add Item
                    </button>
                </div>
                {/* Filters */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input
                        placeholder="Search items..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ ...inputStyle, width: 220, padding: '8px 12px' }}
                    />
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {categories.map(c => (
                            <button key={c} onClick={() => setFilterCat(c)} style={{
                                padding: '6px 14px', borderRadius: 20, border: '1px solid',
                                borderColor: filterCat === c ? '#f97415' : '#e2e8f0',
                                background: filterCat === c ? 'rgba(249,116,21,0.08)' : 'white',
                                color: filterCat === c ? '#f97415' : '#64748b',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            }}>{c}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading menu...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                {['Item', 'Category', 'Price', 'Cost', 'Margin', 'Available', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No items found</td></tr>
                            ) : filtered.map((item, idx) => {
                                const m = margin(item)
                                return (
                                    <tr key={item.item_id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa', opacity: item.is_available ? 1 : 0.55 }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.item_id}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ padding: '3px 10px', borderRadius: 20, background: '#f1f5f9', fontSize: 12, fontWeight: 600, color: '#475569' }}>{item.category}</span>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>₹{item.selling_price}</td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>₹{item.food_cost}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: m >= 60 ? '#10B981' : m >= 40 ? '#f97415' : '#ef4444' }}>{m}%</span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <button style={toggleBtn(item.is_available)} onClick={() => toggleAvailability(item)}>
                                                <div style={toggleDot(item.is_available)} />
                                            </button>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button onClick={() => openEdit(item)} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#64748b' }}>edit</span>
                                                </button>
                                                <button onClick={() => setDeleteConfirm(item)} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ef4444' }}>delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, width: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.15)' }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>
                            {editItem ? `Edit "${editItem.name}"` : 'Add New Menu Item'}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={labelStyle}>Item Name *</label>
                                <input style={inputStyle} placeholder="e.g. Spicy Paneer Wrap" value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div>
                                <label style={labelStyle}>Category *</label>
                                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={labelStyle}>Selling Price (₹) *</label>
                                    <input style={inputStyle} type="number" placeholder="299" value={form.selling_price}
                                        onChange={e => setForm(f => ({ ...f, selling_price: e.target.value }))} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Food Cost (₹) *</label>
                                    <input style={inputStyle} type="number" placeholder="90" value={form.food_cost}
                                        onChange={e => setForm(f => ({ ...f, food_cost: e.target.value }))} />
                                </div>
                            </div>
                            {form.selling_price && form.food_cost && (
                                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                    <span style={{ fontSize: 13, color: '#10B981', fontWeight: 700 }}>
                                        Margin: {Math.round(((+form.selling_price - +form.food_cost) / +form.selling_price) * 100)}%
                                    </span>
                                    <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>≈ ₹{+form.selling_price - +form.food_cost} per item</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Available on menu</span>
                                <button style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: form.is_available ? '#10B981' : '#cbd5e1', display: 'flex', alignItems: 'center', padding: 2, transition: 'background 0.2s' }}
                                    onClick={() => setForm(f => ({ ...f, is_available: !f.is_available }))}>
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', transform: form.is_available ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
                                </button>
                            </div>

                            {/* ─── Recipe / BOM Section ─── */}
                            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginTop: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>menu_book</span>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Recipe (BOM)</span>
                                    </div>
                                    <button onClick={addRecipeRow} style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-dim)', border: '1px solid var(--primary)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span> Add Ingredient
                                    </button>
                                </div>
                                {recipeIngredients.length === 0 && (
                                    <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>No ingredients added yet. Click "Add Ingredient" to build the recipe.</p>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                                    {recipeIngredients.map((row, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <select value={row.ingredient_id} onChange={e => updateRecipeRow(idx, 'ingredient_id', e.target.value)}
                                                style={{ ...inputStyle, flex: 2, fontSize: 12, padding: '8px 10px' }}>
                                                <option value="">Select ingredient...</option>
                                                {inventoryItems.map(inv => (
                                                    <option key={inv.ingredient_id} value={inv.ingredient_id}>{inv.name} ({inv.unit})</option>
                                                ))}
                                            </select>
                                            <input type="number" step="0.01" value={row.qty || ''} onChange={e => updateRecipeRow(idx, 'qty', e.target.value)}
                                                placeholder="Qty" style={{ ...inputStyle, flex: 0.7, fontSize: 12, padding: '8px 10px', textAlign: 'right' }} />
                                            <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 30 }}>{row.unit}</span>
                                            <button onClick={() => removeRecipeRow(idx)} style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ef4444' }}>close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                            <button onClick={() => setShowModal(false)} className="btn-outline btn-sm" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                            <button onClick={handleSubmit} disabled={submitting} className="btn-primary btn-sm" style={{ flex: 2, padding: '12px' }}>
                                {submitting ? 'Saving...' : (editItem ? 'Save Changes' : 'Add to Menu')}
                            </button>
                        </div>
                    </div>
                </div>
                , document.body)}

            {/* Delete Confirm */}
            {deleteConfirm && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.target === e.currentTarget && setDeleteConfirm(null)}>
                    <div style={{ background: 'white', borderRadius: 20, padding: 32, width: 400, textAlign: 'center' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#ef4444' }}>delete_forever</span>
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Remove Item?</h3>
                        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
                            "{deleteConfirm.name}" will be permanently removed from the menu. This cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setDeleteConfirm(null)} className="btn-outline btn-sm" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                            <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#ef4444', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                                Yes, Remove
                            </button>
                        </div>
                    </div>
                </div>
                , document.body)}

            {/* Toast */}
            {toast && createPortal(
                <div style={{ position: 'fixed', bottom: 32, right: 32, background: toast.ok ? '#0f172a' : '#ef4444', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 300 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{toast.ok ? 'check_circle' : 'error'}</span>
                    {toast.msg}
                </div>
                , document.body)}
        </div>
    )
}

export default function Settings() {
    const [activeSection, setActiveSection] = useState('profile')
    const [saved, setSaved] = useState(false)

    const [profile, setProfile] = useState({
        restaurantName: 'The Curry House',
        ownerName: 'Rahul Sharma',
        email: 'rahul@curryhouse.in',
        phone: '+91 98765 43210',
        address: '42, MG Road, Koramangala, Bangalore - 560034',
        gstNumber: '29AABCU9603R1ZM',
        fssaiLicense: '11516007000123',
    })
    const [voiceSettings, setVoiceSettings] = useState({ defaultLanguage: 'auto', enableUpsell: true, autoConfirmThreshold: 90, enableHinglish: true, showKotPreview: true })
    const [menuSettings, setMenuSettings] = useState({ marginThresholdHigh: 65, marginThresholdLow: 40, minTransactionsForAnalysis: 10, enableAutoClassification: true, priceRoundingTo: 9 })
    const [notifications, setNotifications] = useState({ lowMarginAlert: true, dailySummary: true, comboPerformance: false, voiceOrderErrors: true, emailReports: false })

    const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

    const sections = [
        { id: 'profile', label: 'Restaurant Profile', icon: 'store' },
        { id: 'menuItems', label: 'Menu Management', icon: 'menu_book' },
        { id: 'voice', label: 'Voice AI', icon: 'mic' },
        { id: 'menu', label: 'Menu Intelligence', icon: 'analytics' },
        { id: 'notifications', label: 'Notifications', icon: 'notifications' },
        { id: 'data', label: 'Data & Export', icon: 'database' },
        { id: 'about', label: 'About', icon: 'info' },
    ]

    const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }
    const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }
    const toggleStyle = (on) => ({ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: on ? '#f97415' : '#cbd5e1', display: 'flex', alignItems: 'center', padding: 2, flexShrink: 0, transition: 'background 0.2s' })
    const toggleDotStyle = (on) => ({ width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transform: on ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s' })
    const cardStyle = { background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: 32, marginBottom: 24 }

    const renderProfile = () => (
        <div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Restaurant Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div><label style={labelStyle}>Restaurant Name</label><input style={inputStyle} value={profile.restaurantName} onChange={e => setProfile(p => ({ ...p, restaurantName: e.target.value }))} /></div>
                    <div><label style={labelStyle}>Owner / Manager</label><input style={inputStyle} value={profile.ownerName} onChange={e => setProfile(p => ({ ...p, ownerName: e.target.value }))} /></div>
                    <div><label style={labelStyle}>Email</label><input style={inputStyle} type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} /></div>
                    <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} /></div>
                    <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Address</label><input style={inputStyle} value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} /></div>
                </div>
            </div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Compliance</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div><label style={labelStyle}>GST Number</label><input style={inputStyle} value={profile.gstNumber} onChange={e => setProfile(p => ({ ...p, gstNumber: e.target.value }))} /></div>
                    <div><label style={labelStyle}>FSSAI License</label><input style={inputStyle} value={profile.fssaiLicense} onChange={e => setProfile(p => ({ ...p, fssaiLicense: e.target.value }))} /></div>
                </div>
            </div>
            <button onClick={showSaved} className="btn-primary btn-sm" style={{ padding: '12px 32px', fontSize: 14 }}>Save Changes</button>
        </div>
    )

    const renderVoice = () => (
        <div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Language & Input</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div><label style={labelStyle}>Default Language</label>
                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={voiceSettings.defaultLanguage} onChange={e => setVoiceSettings(v => ({ ...v, defaultLanguage: e.target.value }))}>
                            <option value="auto">Auto-detect</option><option value="en">English</option><option value="hi">Hindi</option><option value="hinglish">Hinglish</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Enable Hinglish Support</div><div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Parse mixed English + Hindi orders</div></div>
                        <button style={toggleStyle(voiceSettings.enableHinglish)} onClick={() => setVoiceSettings(v => ({ ...v, enableHinglish: !v.enableHinglish }))}><div style={toggleDotStyle(voiceSettings.enableHinglish)} /></button>
                    </div>
                </div>
            </div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Order Behavior</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {[{ k: 'enableUpsell', l: 'Smart Upsell Suggestions', d: 'Suggest add-ons based on combo engine data' }, { k: 'showKotPreview', l: 'Show KOT Preview', d: 'Display kitchen order ticket before confirming' }].map(({ k, l, d }) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div><div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{l}</div><div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{d}</div></div>
                            <button style={toggleStyle(voiceSettings[k])} onClick={() => setVoiceSettings(v => ({ ...v, [k]: !v[k] }))}><div style={toggleDotStyle(voiceSettings[k])} /></button>
                        </div>
                    ))}
                    <div><label style={labelStyle}>Auto-Confirm Confidence Threshold</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <input type="range" min="50" max="100" value={voiceSettings.autoConfirmThreshold} onChange={e => setVoiceSettings(v => ({ ...v, autoConfirmThreshold: +e.target.value }))} style={{ flex: 1, accentColor: '#f97415' }} />
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#f97415', minWidth: 40 }}>{voiceSettings.autoConfirmThreshold}%</span>
                        </div>
                    </div>
                </div>
            </div>
            <button onClick={showSaved} className="btn-primary btn-sm" style={{ padding: '12px 32px', fontSize: 14 }}>Save Changes</button>
        </div>
    )

    const renderMenuSettings = () => (
        <div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Classification Thresholds</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {[{ k: 'marginThresholdHigh', l: 'High Margin Threshold (%)', c: '#10B981', min: 30, max: 90 }, { k: 'marginThresholdLow', l: 'Low Margin Threshold (%)', c: '#ef4444', min: 10, max: 60 }].map(({ k, l, c, min, max }) => (
                        <div key={k}><label style={labelStyle}>{l}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <input type="range" min={min} max={max} value={menuSettings[k]} onChange={e => setMenuSettings(m => ({ ...m, [k]: +e.target.value }))} style={{ flex: 1, accentColor: c }} />
                                <span style={{ fontSize: 14, fontWeight: 700, color: c, minWidth: 40 }}>{menuSettings[k]}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Analysis Settings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div><label style={labelStyle}>Min Transactions for Analysis</label><input type="number" style={inputStyle} value={menuSettings.minTransactionsForAnalysis} onChange={e => setMenuSettings(m => ({ ...m, minTransactionsForAnalysis: +e.target.value }))} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Auto-Classification</div><div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Automatically classify new items</div></div>
                        <button style={toggleStyle(menuSettings.enableAutoClassification)} onClick={() => setMenuSettings(m => ({ ...m, enableAutoClassification: !m.enableAutoClassification }))}><div style={toggleDotStyle(menuSettings.enableAutoClassification)} /></button>
                    </div>
                    <div><label style={labelStyle}>Price Rounding</label>
                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={menuSettings.priceRoundingTo} onChange={e => setMenuSettings(m => ({ ...m, priceRoundingTo: +e.target.value }))}>
                            <option value={9}>₹X9 (e.g., ₹199)</option><option value={5}>₹X5 (e.g., ₹195)</option><option value={0}>₹X0 (e.g., ₹200)</option><option value={-1}>No rounding</option>
                        </select>
                    </div>
                </div>
            </div>
            <button onClick={showSaved} className="btn-primary btn-sm" style={{ padding: '12px 32px', fontSize: 14 }}>Save Changes</button>
        </div>
    )

    const renderNotifications = () => (
        <div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Alert Preferences</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {[{ k: 'lowMarginAlert', l: 'Low Margin Alerts', d: 'Notified when item falls below threshold' }, { k: 'dailySummary', l: 'Daily Summary', d: 'Daily digest of orders and insights' }, { k: 'comboPerformance', l: 'Combo Performance', d: 'Weekly combo conversion report' }, { k: 'voiceOrderErrors', l: 'Voice Order Errors', d: 'Alert on low parsing confidence' }, { k: 'emailReports', l: 'Email Reports', d: 'Weekly reports to registered email' }].map(({ k, l, d }) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div><div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{l}</div><div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{d}</div></div>
                            <button style={toggleStyle(notifications[k])} onClick={() => setNotifications(n => ({ ...n, [k]: !n[k] }))}><div style={toggleDotStyle(notifications[k])} /></button>
                        </div>
                    ))}
                </div>
            </div>
            <button onClick={showSaved} className="btn-primary btn-sm" style={{ padding: '12px 32px', fontSize: 14 }}>Save Preferences</button>
        </div>
    )

    const renderData = () => (
        <div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Export Data</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[{ label: 'Menu Analysis Report', desc: 'Item classification, margins, recommendations', icon: 'analytics', color: '#f97415' }, { label: 'Order History', desc: 'All voice orders with timestamps and totals', icon: 'receipt_long', color: '#10B981' }, { label: 'Combo Performance', desc: 'Bundle recommendations and AOV impact', icon: 'extension', color: '#6366f1' }].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12, border: '1px solid #f1f5f9', background: '#fafafa' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}15`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span></div>
                            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{item.label}</div><div style={{ fontSize: 12, color: '#94a3b8' }}>{item.desc}</div></div>
                            <button onClick={showSaved} className="btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>CSV</button>
                        </div>
                    ))}
                </div>
            </div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Danger Zone</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>These actions are irreversible.</p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>delete</span>Clear Order History</button>
                    <button style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>restart_alt</span>Reset All Settings</button>
                </div>
            </div>
        </div>
    )

    const renderAbout = () => (
        <div>
            <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f97415', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><span className="material-symbols-outlined" style={{ fontSize: 28 }}>restaurant_menu</span></div>
                    <div><h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Petpooja Copilot</h3><div style={{ fontSize: 13, color: '#94a3b8' }}>v1.0.0 — Hackathon Build 2025</div></div>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#64748b', marginBottom: 24 }}>AI-powered restaurant intelligence platform combining revenue optimization, menu engineering, and voice ordering.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[{ l: 'Module 1', v: 'Revenue Intelligence', i: 'trending_up' }, { l: 'Module 2', v: 'Voice AI Copilot', i: 'mic' }, { l: 'Backend', v: 'FastAPI + Python', i: 'terminal' }, { l: 'Frontend', v: 'React + Vite', i: 'code' }, { l: 'ML Engine', v: 'Apriori + rapidfuzz', i: 'psychology' }, { l: 'Speech AI', v: 'OpenAI Whisper', i: 'record_voice_over' }].map(({ l, v, i }) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: '#f8fafc' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#94a3b8' }}>{i}</span>
                            <div><div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>{l}</div><div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{v}</div></div>
                        </div>
                    ))}
                </div>
            </div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>API Status</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#10B981' }}>Backend Connected</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>— http://localhost:8000</span>
                </div>
            </div>
        </div>
    )

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 24 }}>
            {/* Left nav */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sections.map(s => (
                    <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: 'none',
                        cursor: 'pointer', fontSize: 13, fontWeight: 500, textAlign: 'left',
                        background: activeSection === s.id ? 'rgba(249,116,21,0.08)' : 'transparent',
                        color: activeSection === s.id ? '#f97415' : '#64748b', transition: 'all 0.15s', fontFamily: 'inherit',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{s.icon}</span>
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div>
                {activeSection === 'profile' && renderProfile()}
                {activeSection === 'menuItems' && <MenuManagement cardStyle={cardStyle} inputStyle={inputStyle} labelStyle={labelStyle} />}
                {activeSection === 'voice' && renderVoice()}
                {activeSection === 'menu' && renderMenuSettings()}
                {activeSection === 'notifications' && renderNotifications()}
                {activeSection === 'data' && renderData()}
                {activeSection === 'about' && renderAbout()}
            </div>

            {saved && (
                <div style={{ position: 'fixed', bottom: 32, right: 32, background: '#0f172a', color: 'white', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 100 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#10B981' }}>check_circle</span>
                    Settings saved
                </div>
            )}
        </div>
    )
}
