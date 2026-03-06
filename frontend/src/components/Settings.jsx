import { useState } from 'react'

export default function Settings() {
    const [activeSection, setActiveSection] = useState('profile')
    const [saved, setSaved] = useState(false)

    // Restaurant Profile state
    const [profile, setProfile] = useState({
        restaurantName: 'The Curry House',
        ownerName: 'Rahul Sharma',
        email: 'rahul@curryhouse.in',
        phone: '+91 98765 43210',
        address: '42, MG Road, Koramangala, Bangalore - 560034',
        gstNumber: '29AABCU9603R1ZM',
        fssaiLicense: '11516007000123',
    })

    // Voice AI state
    const [voiceSettings, setVoiceSettings] = useState({
        defaultLanguage: 'auto',
        enableUpsell: true,
        autoConfirmThreshold: 90,
        enableHinglish: true,
        showKotPreview: true,
    })

    // Menu Intelligence state
    const [menuSettings, setMenuSettings] = useState({
        marginThresholdHigh: 65,
        marginThresholdLow: 40,
        minTransactionsForAnalysis: 10,
        enableAutoClassification: true,
        priceRoundingTo: 9,
    })

    // Notification state
    const [notifications, setNotifications] = useState({
        lowMarginAlert: true,
        dailySummary: true,
        comboPerformance: false,
        voiceOrderErrors: true,
        emailReports: false,
    })

    const showSaved = () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const sections = [
        { id: 'profile', label: 'Restaurant Profile', icon: 'store' },
        { id: 'voice', label: 'Voice AI', icon: 'mic' },
        { id: 'menu', label: 'Menu Intelligence', icon: 'analytics' },
        { id: 'notifications', label: 'Notifications', icon: 'notifications' },
        { id: 'data', label: 'Data & Export', icon: 'database' },
        { id: 'about', label: 'About', icon: 'info' },
    ]

    const inputStyle = {
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit',
        background: '#f8fafc', outline: 'none', transition: 'border-color 0.15s',
    }

    const labelStyle = {
        display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6,
    }

    const toggleStyle = (on) => ({
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: on ? '#f97415' : '#cbd5e1', position: 'relative', transition: 'background 0.2s',
        display: 'flex', alignItems: 'center', padding: 2, flexShrink: 0,
    })

    const toggleDotStyle = (on) => ({
        width: 20, height: 20, borderRadius: '50%', background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        transform: on ? 'translateX(20px)' : 'translateX(0)',
        transition: 'transform 0.2s',
    })

    const cardStyle = {
        background: 'white', borderRadius: 16, border: '1px solid #f1f5f9',
        padding: 32, marginBottom: 24,
    }

    const renderProfile = () => (
        <div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Restaurant Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                        <label style={labelStyle}>Restaurant Name</label>
                        <input style={inputStyle} value={profile.restaurantName}
                            onChange={e => setProfile(p => ({ ...p, restaurantName: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Owner / Manager</label>
                        <input style={inputStyle} value={profile.ownerName}
                            onChange={e => setProfile(p => ({ ...p, ownerName: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Email</label>
                        <input style={inputStyle} type="email" value={profile.email}
                            onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Phone</label>
                        <input style={inputStyle} value={profile.phone}
                            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                        />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Address</label>
                        <input style={inputStyle} value={profile.address}
                            onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                        />
                    </div>
                </div>
            </div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Compliance</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                        <label style={labelStyle}>GST Number</label>
                        <input style={inputStyle} value={profile.gstNumber}
                            onChange={e => setProfile(p => ({ ...p, gstNumber: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>FSSAI License</label>
                        <input style={inputStyle} value={profile.fssaiLicense}
                            onChange={e => setProfile(p => ({ ...p, fssaiLicense: e.target.value }))}
                        />
                    </div>
                </div>
            </div>
            <button onClick={showSaved} className="btn-primary btn-sm" style={{ padding: '12px 32px', fontSize: 14 }}>
                Save Changes
            </button>
        </div>
    )

    const renderVoice = () => (
        <div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Language & Input</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={labelStyle}>Default Language</label>
                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={voiceSettings.defaultLanguage}
                            onChange={e => setVoiceSettings(v => ({ ...v, defaultLanguage: e.target.value }))}
                        >
                            <option value="auto">Auto-detect</option>
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                            <option value="hinglish">Hinglish</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Enable Hinglish Support</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Parse mixed English + Hindi orders</div>
                        </div>
                        <button style={toggleStyle(voiceSettings.enableHinglish)}
                            onClick={() => setVoiceSettings(v => ({ ...v, enableHinglish: !v.enableHinglish }))}>
                            <div style={toggleDotStyle(voiceSettings.enableHinglish)} />
                        </button>
                    </div>
                </div>
            </div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Order Behavior</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Smart Upsell Suggestions</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Suggest add-ons based on combo engine data</div>
                        </div>
                        <button style={toggleStyle(voiceSettings.enableUpsell)}
                            onClick={() => setVoiceSettings(v => ({ ...v, enableUpsell: !v.enableUpsell }))}>
                            <div style={toggleDotStyle(voiceSettings.enableUpsell)} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Show KOT Preview</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Display kitchen order ticket before confirming</div>
                        </div>
                        <button style={toggleStyle(voiceSettings.showKotPreview)}
                            onClick={() => setVoiceSettings(v => ({ ...v, showKotPreview: !v.showKotPreview }))}>
                            <div style={toggleDotStyle(voiceSettings.showKotPreview)} />
                        </button>
                    </div>
                    <div>
                        <label style={labelStyle}>Auto-Confirm Confidence Threshold</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <input type="range" min="50" max="100" value={voiceSettings.autoConfirmThreshold}
                                onChange={e => setVoiceSettings(v => ({ ...v, autoConfirmThreshold: +e.target.value }))}
                                style={{ flex: 1, accentColor: '#f97415' }}
                            />
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#f97415', minWidth: 40 }}>{voiceSettings.autoConfirmThreshold}%</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Orders with confidence above this threshold will be auto-confirmed</div>
                    </div>
                </div>
            </div>
            <button onClick={showSaved} className="btn-primary btn-sm" style={{ padding: '12px 32px', fontSize: 14 }}>
                Save Changes
            </button>
        </div>
    )

    const renderMenu = () => (
        <div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Classification Thresholds</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={labelStyle}>High Margin Threshold (%)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <input type="range" min="30" max="90" value={menuSettings.marginThresholdHigh}
                                onChange={e => setMenuSettings(m => ({ ...m, marginThresholdHigh: +e.target.value }))}
                                style={{ flex: 1, accentColor: '#10B981' }}
                            />
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#10B981', minWidth: 40 }}>{menuSettings.marginThresholdHigh}%</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Items above this margin are classified as Stars or Hidden Stars</div>
                    </div>
                    <div>
                        <label style={labelStyle}>Low Margin Threshold (%)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <input type="range" min="10" max="60" value={menuSettings.marginThresholdLow}
                                onChange={e => setMenuSettings(m => ({ ...m, marginThresholdLow: +e.target.value }))}
                                style={{ flex: 1, accentColor: '#ef4444' }}
                            />
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', minWidth: 40 }}>{menuSettings.marginThresholdLow}%</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Items below this margin are flagged as risk items</div>
                    </div>
                </div>
            </div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Analysis Settings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={labelStyle}>Min Transactions for Analysis</label>
                        <input type="number" style={inputStyle} value={menuSettings.minTransactionsForAnalysis}
                            onChange={e => setMenuSettings(m => ({ ...m, minTransactionsForAnalysis: +e.target.value }))}
                        />
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Items with fewer transactions will be excluded from analysis</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Auto-Classification</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Automatically classify new items based on first-week data</div>
                        </div>
                        <button style={toggleStyle(menuSettings.enableAutoClassification)}
                            onClick={() => setMenuSettings(m => ({ ...m, enableAutoClassification: !m.enableAutoClassification }))}>
                            <div style={toggleDotStyle(menuSettings.enableAutoClassification)} />
                        </button>
                    </div>
                    <div>
                        <label style={labelStyle}>Price Rounding (ending digit)</label>
                        <select style={{ ...inputStyle, cursor: 'pointer' }} value={menuSettings.priceRoundingTo}
                            onChange={e => setMenuSettings(m => ({ ...m, priceRoundingTo: +e.target.value }))}
                        >
                            <option value={9}>₹X9 (e.g., ₹199, ₹249)</option>
                            <option value={5}>₹X5 (e.g., ₹195, ₹245)</option>
                            <option value={0}>₹X0 (e.g., ₹200, ₹250)</option>
                            <option value={-1}>No rounding</option>
                        </select>
                    </div>
                </div>
            </div>
            <button onClick={showSaved} className="btn-primary btn-sm" style={{ padding: '12px 32px', fontSize: 14 }}>
                Save Changes
            </button>
        </div>
    )

    const renderNotifications = () => (
        <div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Alert Preferences</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {[
                        { key: 'lowMarginAlert', label: 'Low Margin Alerts', desc: 'Get notified when an item falls below the margin threshold' },
                        { key: 'dailySummary', label: 'Daily Summary', desc: 'Receive a daily digest of orders, revenue, and insights' },
                        { key: 'comboPerformance', label: 'Combo Performance', desc: 'Weekly report on combo suggestion conversion rates' },
                        { key: 'voiceOrderErrors', label: 'Voice Order Errors', desc: 'Alert when voice parsing confidence is low' },
                        { key: 'emailReports', label: 'Email Reports', desc: 'Send weekly reports to the registered email address' },
                    ].map(item => (
                        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{item.label}</div>
                                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.desc}</div>
                            </div>
                            <button style={toggleStyle(notifications[item.key])}
                                onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}>
                                <div style={toggleDotStyle(notifications[item.key])} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <button onClick={showSaved} className="btn-primary btn-sm" style={{ padding: '12px 32px', fontSize: 14 }}>
                Save Preferences
            </button>
        </div>
    )

    const renderData = () => (
        <div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Export Data</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[
                        { label: 'Menu Analysis Report', desc: 'Full item classification with margins, costs, and recommendations', icon: 'analytics', color: '#f97415' },
                        { label: 'Order History', desc: 'All voice orders with timestamps, items, and totals', icon: 'receipt_long', color: '#10B981' },
                        { label: 'Combo Performance', desc: 'Bundle recommendations with conversion and AOV impact', icon: 'extension', color: '#6366f1' },
                    ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12, border: '1px solid #f1f5f9', background: '#fafafa' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}15`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{item.label}</div>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.desc}</div>
                            </div>
                            <button onClick={showSaved} className="btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
                                CSV
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Danger Zone</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>These actions are irreversible. Proceed with caution.</p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>delete</span>
                        Clear Order History
                    </button>
                    <button style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>restart_alt</span>
                        Reset All Settings
                    </button>
                </div>
            </div>
        </div>
    )

    const renderAbout = () => (
        <div>
            <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f97415', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>restaurant_menu</span>
                    </div>
                    <div>
                        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Petpooja Copilot</h3>
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>v1.0.0 — Hackathon Build 2025</div>
                    </div>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#64748b', marginBottom: 24 }}>
                    AI-powered restaurant intelligence platform. Combines revenue optimization, menu engineering,
                    and voice ordering to help restaurants uncover hidden profits and streamline operations.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                        { label: 'Module 1', value: 'Revenue Intelligence', icon: 'trending_up' },
                        { label: 'Module 2', value: 'Voice AI Copilot', icon: 'mic' },
                        { label: 'Backend', value: 'FastAPI + Python', icon: 'terminal' },
                        { label: 'Frontend', value: 'React + Vite', icon: 'code' },
                        { label: 'ML Engine', value: 'Apriori + rapidfuzz', icon: 'psychology' },
                        { label: 'Speech AI', value: 'OpenAI Whisper', icon: 'record_voice_over' },
                    ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, background: '#f8fafc' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#94a3b8' }}>{item.icon}</span>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>{item.label}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{item.value}</div>
                            </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
            {/* Settings Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {sections.map(s => (
                    <button key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', borderRadius: 10, border: 'none',
                            cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'left',
                            background: activeSection === s.id ? 'rgba(249,116,21,0.08)' : 'transparent',
                            color: activeSection === s.id ? '#f97415' : '#64748b',
                            transition: 'all 0.15s', fontFamily: 'inherit',
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{s.icon}</span>
                        {s.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div>
                {activeSection === 'profile' && renderProfile()}
                {activeSection === 'voice' && renderVoice()}
                {activeSection === 'menu' && renderMenu()}
                {activeSection === 'notifications' && renderNotifications()}
                {activeSection === 'data' && renderData()}
                {activeSection === 'about' && renderAbout()}
            </div>

            {/* Save toast */}
            {saved && (
                <div style={{
                    position: 'fixed', bottom: 32, right: 32, background: '#0f172a',
                    color: 'white', padding: '12px 24px', borderRadius: 12, fontSize: 14,
                    fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    display: 'flex', alignItems: 'center', gap: 8, zIndex: 100,
                    animation: 'fadeIn 0.2s ease-out',
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#10B981' }}>check_circle</span>
                    Settings saved successfully
                </div>
            )}
        </div>
    )
}
