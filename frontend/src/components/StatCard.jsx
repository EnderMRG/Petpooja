import { useEffect, useState } from 'react'

export default function StatCard({ label, value, unit = '', icon, color }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startValue = 0
    const duration = 800
    const increment = value / (duration / 16)
    
    const timer = setInterval(() => {
      startValue += increment
      if (startValue >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(startValue))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value])

  return (
    <div 
      className="glass-card p-6 hover-scale"
      style={{
        borderColor: color + '33',
        background: 'rgba(15, 17, 23, 0.6)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
          style={{ 
            background: color + '15',
            color: color
          }}
        >
          {icon}
        </div>
      </div>
      <p className="text-slate-400 text-sm font-medium mb-2">{label}</p>
      <div className="stat-counter">
        <p 
          className="text-4xl font-bold"
          style={{ color: color }}
        >
          {displayValue}{unit}
        </p>
      </div>
    </div>
  )
}
