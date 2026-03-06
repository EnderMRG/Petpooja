export default function LandingPage({ onEnterApp }) {
    return (
        <div style={{ background: '#ffffff', color: '#0f172a', fontFamily: "'Inter', sans-serif", minHeight: '100vh', width: '100vw', overflowX: 'hidden' }}>
            {/* Navigation */}
            <header style={{ position: 'sticky', top: 0, zIndex: 50, width: '100%', borderBottom: '1px solid #f1f5f9', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src="/petpoja.png" alt="Petpooja" style={{ width: 30, height: 30, objectFit: 'contain' }} />
                        </div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Petpooja Copilot</h2>
                    </div>
                    <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                        {['Product', 'Features', 'Pricing', 'About'].map(item => (
                            <a key={item} href="#" style={{ fontSize: 14, fontWeight: 500, color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}
                                onMouseEnter={e => e.target.style.color = '#f97415'}
                                onMouseLeave={e => e.target.style.color = '#475569'}
                            >{item}</a>
                        ))}
                    </nav>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button style={{ fontSize: 14, fontWeight: 600, color: '#334155', background: 'none', border: 'none', cursor: 'pointer' }}>Log in</button>
                        <button
                            onClick={onEnterApp}
                            style={{ padding: '10px 24px', borderRadius: 10, background: '#f97415', color: 'white', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(249,116,21,0.2)', transition: 'all 0.15s' }}
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section style={{ padding: '80px 24px 120px', overflow: 'hidden' }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                            <div style={{ display: 'inline-flex', width: 'fit-content', alignItems: 'center', gap: 8, borderRadius: 999, background: 'rgba(249,116,21,0.1)', padding: '4px 12px', fontSize: 14, fontWeight: 600, color: '#f97415' }}>
                                <span style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
                                    <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#f97415', opacity: 0.75, animation: 'pulse-dot 2s infinite' }} />
                                    <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#f97415' }} />
                                </span>
                                New: Multi-language Voice AI
                            </div>
                            <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#0f172a' }}>
                                The Intelligent Brain for Your Restaurant
                            </h1>
                            <p style={{ fontSize: 18, lineHeight: 1.7, color: '#64748b', maxWidth: 540 }}>
                                Uncover hidden profits, automate voice orders, and optimize your menu with AI-driven insights. Built for high-growth food brands.
                            </p>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <button
                                    onClick={onEnterApp}
                                    style={{ height: 56, padding: '0 32px', borderRadius: 12, background: '#f97415', color: 'white', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(249,116,21,0.25)', transition: 'all 0.15s' }}
                                >
                                    Get Started for Free
                                </button>
                                <button
                                    style={{ height: 56, padding: '0 32px', borderRadius: 12, background: 'white', color: '#334155', fontSize: 16, fontWeight: 700, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.15s' }}
                                >
                                    Watch Demo
                                </button>
                            </div>
                        </div>

                        {/* Hero Image — Waiter Photo */}
                        <div style={{ position: 'relative', paddingBottom: 40 }}>
                            <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
                                <img
                                    src="/unnamed.png"
                                    alt="Restaurant manager using Petpooja Copilot on a tablet"
                                    style={{ width: '100%', height: 440, objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                                />
                            </div>
                            {/* Voice AI Active floating card */}
                            <div style={{
                                position: 'absolute', bottom: 8, right: 16,
                                width: 240, borderRadius: 12,
                                border: '1px solid #e2e8f0', background: 'white',
                                padding: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>mic</span>
                                    </div>
                                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>Voice AI Active</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div style={{ height: 5, borderRadius: 999, background: '#f1f5f9', width: '100%' }} />
                                    <div style={{ height: 5, borderRadius: 999, background: '#f1f5f9', width: '75%' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>"Add 1 Paneer Tikka"</span>
                                        <span style={{ fontSize: 10, color: '#10B981', fontWeight: 700 }}>Parsed ✓</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Social Proof */}
                <section style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', background: 'rgba(248,250,252,0.5)', padding: '48px 24px' }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 32 }}>Trusted by 500+ restaurants across India</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, opacity: 0.4, flexWrap: 'wrap' }}>
                            {['The Curry House', 'Biryani Hub', 'Spice Garden', 'Urban Tadka', 'Desi Bites'].map(name => (
                                <span key={name} style={{ fontSize: 18, fontWeight: 700, color: '#475569' }}>{name}</span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section style={{ padding: '96px 24px', background: 'white' }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 64 }}>
                            <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a', marginBottom: 16 }}>Everything you need to scale smarter</h2>
                            <p style={{ fontSize: 16, color: '#64748b' }}>Powerful AI tools designed specifically for the unique challenges of the food industry.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                            {[
                                { icon: 'analytics', title: 'Menu Intelligence', desc: 'Identify your "Hidden Stars" and "Plowhorses" with data-backed association analysis to optimize your kitchen effort.', color: '#f97415' },
                                { icon: 'record_voice_over', title: 'Voice AI Ordering', desc: 'Transcribe and parse orders in English, Hindi, and Hinglish with real-time upsell suggestions that never miss a beat.', color: '#10B981' },
                                { icon: 'calculate', title: 'Combo Engine', desc: 'Boost AOV by +₹120 with smart bundle recommendations based on 1,000+ transaction patterns across your brand.', color: '#f97415' },
                            ].map(feature => (
                                <div key={feature.title} style={{ display: 'flex', flexDirection: 'column', borderRadius: 16, border: '1px solid #f1f5f9', padding: 32, transition: 'all 0.2s', cursor: 'default' }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = feature.color === '#10B981' ? 'rgba(16,185,129,0.2)' : 'rgba(249,116,21,0.2)' }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f1f5f9' }}
                                >
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${feature.color}15`, color: feature.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, transition: 'transform 0.2s' }}>
                                        <span className="material-symbols-outlined">{feature.icon}</span>
                                    </div>
                                    <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>{feature.title}</h3>
                                    <p style={{ fontSize: 15, lineHeight: 1.7, color: '#64748b' }}>{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section style={{ padding: '80px 24px' }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 40, background: '#0f172a', padding: '80px 64px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                            <div style={{ position: 'absolute', left: -40, top: -40, width: 256, height: 256, borderRadius: '50%', background: 'rgba(249,116,21,0.15)', filter: 'blur(60px)' }} />
                            <div style={{ position: 'absolute', right: -40, bottom: -40, width: 256, height: 256, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', filter: 'blur(60px)' }} />
                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
                                <h2 style={{ fontSize: 44, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>Ready to upgrade your kitchen?</h2>
                                <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 540 }}>Join 500+ top-tier restaurants already using Copilot to streamline operations and increase revenue.</p>
                                <button
                                    onClick={onEnterApp}
                                    style={{ height: 56, padding: '0 40px', borderRadius: 12, background: '#f97415', color: 'white', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(249,116,21,0.25)', transition: 'all 0.15s' }}
                                >
                                    Get Started for Free
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid #f1f5f9', background: 'white', padding: '80px 24px 40px' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 48 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f97415', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>restaurant_menu</span>
                                </div>
                                <h3 style={{ fontWeight: 700, fontSize: 14 }}>Petpooja Copilot</h3>
                            </div>
                            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#94a3b8' }}>
                                The ultimate intelligence layer for modern food brands. Scale with confidence, powered by AI.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 'fit-content', borderRadius: 999, background: '#f8fafc', padding: '4px 12px', border: '1px solid #e2e8f0' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94a3b8' }} />
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Hackathon Build 2025</span>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, justifyItems: 'end' }}>
                            {[
                                { title: 'Product', links: ['Dashboard', 'Voice AI', 'Analytics', 'Integrations'] },
                                { title: 'Features', links: ['Menu Optimization', 'Staff Management', 'Auto-Upsell', 'Custom Bundles'] },
                                { title: 'Pricing', links: ['Startup', 'Growth', 'Enterprise'] },
                                { title: 'About', links: ['Our Story', 'Careers', 'Blog', 'Contact'] },
                            ].map(col => (
                                <div key={col.title} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0f172a' }}>{col.title}</h4>
                                    {col.links.map(link => (
                                        <a key={link} href="#" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}
                                            onMouseEnter={e => e.target.style.color = '#f97415'}
                                            onMouseLeave={e => e.target.style.color = '#94a3b8'}
                                        >{link}</a>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginTop: 64, borderTop: '1px solid #f1f5f9', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: 12, color: '#94a3b8' }}>© 2024 Petpooja Copilot. All rights reserved.</p>
                        <div style={{ display: 'flex', gap: 24 }}>
                            {['public', 'share', 'mail'].map(icon => (
                                <a key={icon} href="#" style={{ color: '#94a3b8', transition: 'color 0.15s' }}
                                    onMouseEnter={e => e.target.style.color = '#f97415'}
                                    onMouseLeave={e => e.target.style.color = '#94a3b8'}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
