export default function Sidebar({ activePage, onNavigate }) {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { id: 'menu', label: 'Menu Intelligence', icon: 'analytics' },
        { id: 'combos', label: 'Combo Engine', icon: 'extension' },
        { id: 'voice', label: 'Orders', icon: 'receipt_long' },
        { id: 'history', label: 'Order History', icon: 'history' },
        { id: 'inventory', label: 'Inventory', icon: 'inventory_2' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
    ]

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src="/petpoja.png" alt="Petpooja" style={{ width: 34, height: 34, objectFit: 'contain' }} />
                </div>
                <div>
                    <div className="brand-name">Petpooja</div>
                    <div className="brand-sub">Copilot</div>
                </div>
            </div>

            {/* Navigation */}
            <nav>
                {navItems.map(item => (
                    <div
                        key={item.id}
                        className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <span className={`material-symbols-outlined icon ${activePage === item.id ? 'fill-1' : ''}`}>
                            {item.icon}
                        </span>
                        <span>{item.label}</span>
                    </div>
                ))}
            </nav>

            {/* Profile */}
            <div className="sidebar-profile">
                <div className="profile-inner">
                    <div className="avatar" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="name">Rahul Sharma</div>
                        <div className="role">Store Manager</div>
                    </div>
                    <span className="material-symbols-outlined" onClick={() => onNavigate('settings')} style={{ color: 'var(--text-tertiary)', fontSize: 18, cursor: 'pointer' }}>settings</span>
                </div>
            </div>
        </aside>
    )
}
