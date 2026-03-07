import { useState, useEffect } from 'react'
import apiFetch from '../utils/apiFetch'

export default function ComboSuggestions() {
    const [combos, setCombos] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiFetch('/menu/combos')
            .then(r => r.json())
            .then(data => {
                setCombos(data.combos || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
    )

    if (combos.length === 0) return null

    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-1">🎯 AI-Suggested Combo Bundles</h3>
            <p className="text-sm text-slate-400 mb-5">Based on Apriori association rule mining on 800+ transactions</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {combos.slice(0, 9).map((combo, idx) => (
                    <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${combo.includes_hidden_star
                            ? 'border-purple-500/30 bg-gradient-to-br from-purple-600/10 to-blue-600/5'
                            : 'border-slate-700/50 bg-slate-800/30'
                            }`}
                    >
                        {/* Combo Header */}
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                                Combo #{idx + 1}
                            </span>
                            {combo.includes_hidden_star && (
                                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-medium">
                                    💎 Hidden Star
                                </span>
                            )}
                        </div>

                        {/* Items */}
                        <div className="space-y-2 mb-3">
                            {combo.combo_items.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                                    <span className="text-sm text-slate-200">{item.name}</span>
                                </div>
                            ))}
                        </div>

                        {/* Metrics */}
                        <div className="flex gap-3 pt-3 border-t border-slate-700/50">
                            <div className="flex-1">
                                <span className="text-xs text-slate-500 block">Confidence</span>
                                <span className="text-sm font-semibold text-emerald-400">
                                    {(combo.confidence * 100).toFixed(0)}%
                                </span>
                            </div>
                            <div className="flex-1">
                                <span className="text-xs text-slate-500 block">Lift</span>
                                <span className="text-sm font-semibold text-amber-400">
                                    {combo.lift}×
                                </span>
                            </div>
                            <div className="flex-1">
                                <span className="text-xs text-slate-500 block">Support</span>
                                <span className="text-sm font-semibold text-blue-400">
                                    {(combo.support * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
