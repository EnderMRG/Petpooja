const ROLE_PAGES = {
    manager: new Set(['dashboard', 'menu', 'combos', 'curated', 'voice', 'history', 'inventory', 'kitchen', 'settings']),
    cashier: new Set(['voice', 'history', 'menu', 'combos', 'curated']),
}

export default function Sidebar({ activePage, onNavigate, userRole = 'manager', onLogoClick }) {
    const allNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', group: 'manager' },
        { id: 'menu', label: 'Menu Intelligence', icon: 'analytics', group: 'both' },
        { id: 'combos', label: 'Combo Engine', icon: 'extension', group: 'both' },
        { id: 'curated', label: 'Curated Menu', icon: 'auto_awesome', group: 'both' },
        { id: 'voice', label: 'Orders', icon: 'receipt_long', group: 'both' },
        { id: 'history', label: 'Order History', icon: 'history', group: 'both' },
        { id: 'inventory', label: 'Inventory', icon: 'inventory_2', group: 'manager' },
        { id: 'kitchen', label: 'Kitchen Display', icon: 'soup_kitchen', group: 'manager' },
        { id: 'settings', label: 'Settings', icon: 'settings', group: 'manager' },
    ]

    const allowed = ROLE_PAGES[userRole] || ROLE_PAGES.manager
    const navItems = allNavItems.filter(item => allowed.has(item.id))

    // Group items by section for manager
    const mainItems = navItems.filter(i => !['kitchen', 'settings'].includes(i.id))
    const bottomItems = navItems.filter(i => ['kitchen', 'settings'].includes(i.id))

    const roleConfig = {
        manager: { label: 'Manager', color: '#f97415', bg: 'rgba(249,116,21,0.1)' },
        cashier: { label: 'Cashier', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    }
    const rc = roleConfig[userRole] || roleConfig.manager

    const NavItem = ({ item }) => (
        <div
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            style={{ position: 'relative' }}
        >
            <span className={`material-symbols-outlined icon ${activePage === item.id ? 'fill-1' : ''}`}>
                {item.icon}
            </span>
            <span>{item.label}</span>
            {item.id === 'kitchen' && (
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, background: '#10b98115', color: '#10b981', padding: '2px 6px', borderRadius: 99, border: '1px solid #10b98130' }}>
                    LIVE
                </span>
            )}
        </div>
    )

    return (
        <aside className="sidebar">
            {/* Logo — click to sign out */}
            <div
                className="sidebar-logo"
                onClick={() => onLogoClick?.()}
                title="Click to sign out"
                style={{ cursor: onLogoClick ? 'pointer' : 'default' }}
            >
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src="/petpoja.png" alt="Petpooja" style={{ width: 34, height: 34, objectFit: 'contain' }} />
                </div>
                <div>
                    <div className="brand-name">Petpooja</div>
                    <div className="brand-sub">Copilot</div>
                </div>
            </div>

            {/* Navigation — main items */}
            <nav style={{ flex: 1 }}>
                {userRole === 'cashier' && (
                    <div style={{ padding: '6px 16px 10px', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Cashier Tools
                    </div>
                )}
                {mainItems.map(item => <NavItem key={item.id} item={item} />)}
            </nav>

            {/* Bottom section */}
            {bottomItems.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                    {bottomItems.map(item => <NavItem key={item.id} item={item} />)}
                </div>
            )}

            {/* Profile / Role */}
            <div className="sidebar-profile">
                <div className="profile-inner">
                    <div className="avatar" style={{ background: rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: rc.color }}>
                            {userRole === 'manager' ? 'manage_accounts' : 'point_of_sale'}
                        </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="name">Logged In</div>
                        <div className="role" style={{ color: rc.color }}>{rc.label}</div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
