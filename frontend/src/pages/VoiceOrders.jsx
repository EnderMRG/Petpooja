import { useState } from 'react'

export default function VoiceOrders() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [parsedOrder, setParsedOrder] = useState(null)
  const [upsellSuggestion, setUpsellSuggestion] = useState({
    item: 'Garlic Naan',
    reason: 'Pairs well with Paneer Butter Masala',
    price: 80
  })

  const handleMicrophoneClick = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      // Simulate transcription after 2 seconds
      setTimeout(() => {
        setTranscription('One Paneer Butter Masala, two Garlic Naan, and one Mango Lassi')
        setParsedOrder({
          items: [
            { name: 'Paneer Butter Masala', qty: 1, price: 320 },
            { name: 'Garlic Naan', qty: 2, price: 160 },
            { name: 'Mango Lassi', qty: 1, price: 100 }
          ],
          total: 580
        })
      }, 2000)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setTranscription('Order transcribed from audio...')
        setParsedOrder({
          items: [
            { name: 'Chicken Biryani', qty: 1, price: 380 },
            { name: 'Raita', qty: 1, price: 50 }
          ],
          total: 430
        })
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Voice Input */}
      <div className="space-y-6">
        {/* Microphone Button */}
        <div className="glass-card p-8 text-center">
          <button
            onClick={handleMicrophoneClick}
            className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all ${
              isRecording
                ? 'bg-red-500 shadow-lg scale-110 pulse-badge'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            🎤
          </button>
          <p className="mt-4 text-sm font-semibold text-slate-300">
            {isRecording ? 'Recording...' : 'Click to start recording'}
          </p>
        </div>

        {/* Upload Zone */}
        <div
          className="glass-card p-8 border-2 border-dashed border-orange-500/30 hover:border-orange-500/60 cursor-pointer transition-all"
          onDragOver={(e) => {
            e.preventDefault()
            e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.8)'
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.3)'
          }}
          onDrop={(e) => {
            e.preventDefault()
            handleFileUpload({ target: { files: e.dataTransfer.files } })
          }}
        >
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
            id="audio-upload"
          />
          <label htmlFor="audio-upload" className="cursor-pointer">
            <div className="text-center">
              <p className="text-2xl mb-2">📁</p>
              <p className="text-sm font-semibold text-slate-300">Drag audio file here</p>
              <p className="text-xs text-slate-500 mt-1">or click to browse</p>
            </div>
          </label>
        </div>

        {/* Transcription Display */}
        {transcription && (
          <div className="glass-card p-6">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Transcription</p>
            <p className="text-slate-300 text-sm leading-relaxed">{transcription}</p>
          </div>
        )}
      </div>

      {/* Right Column - Order Preview & Upsell */}
      <div className="space-y-6">
        {/* Parsed Order Card */}
        {parsedOrder && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {parsedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center pb-3 border-b border-slate-700">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{item.name}</p>
                    <p className="text-xs text-slate-400">x{item.qty}</p>
                  </div>
                  <p className="font-semibold text-orange-400">₹{item.price}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-700">
              <p className="font-semibold text-slate-300">Total:</p>
              <p className="text-xl font-bold text-orange-400">₹{parsedOrder.total}</p>
            </div>
          </div>
        )}

        {/* Upsell Suggestion */}
        {parsedOrder && upsellSuggestion && (
          <div className="glass-card p-6 border-l-4 border-emerald-500">
            <h3 className="text-lg font-bold text-white mb-3">Upsell Suggestion</h3>
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-200 mb-1">{upsellSuggestion.item}</p>
              <p className="text-xs text-slate-400 mb-3">{upsellSuggestion.reason}</p>
              <p className="text-lg font-bold text-emerald-400">₹{upsellSuggestion.price}</p>
            </div>
            <button className="w-full px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500 text-emerald-400 hover:bg-emerald-500/30 font-semibold text-sm transition-colors">
              Add to Order
            </button>
          </div>
        )}

        {/* KOT Display */}
        {parsedOrder && (
          <div className="glass-card p-6">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-3">KOT Preview</p>
            <div className="kot-display">
              <div className="text-center font-bold text-orange-400 mb-2">KITCHEN ORDER TICKET</div>
              <div className="border-b border-slate-600 mb-2" />
              {parsedOrder.items.map((item, idx) => (
                <div key={idx} className="mb-1">
                  {item.qty}x {item.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirm Button */}
        {parsedOrder && (
          <button className="w-full px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors">
            ✓ Confirm & Send to Kitchen
          </button>
        )}
      </div>
    </div>
  )
}
