# 🍽️ Petpooja AI Copilot

**AI-Powered Revenue Intelligence & Voice Ordering for Restaurants**

A full-stack hackathon project that turns raw restaurant PoS data into intelligent revenue decisions and automates phone-based voice ordering.

## 🚀 Quick Start

### 1. Backend (Python + FastAPI)

```bash
cd backend
pip install -r requirements.txt

# Generate transaction data (run once)
python generate_transactions.py

# Start the API server
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend (React + Vite + Tailwind CSS)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the frontend proxies API requests to `localhost:8000`.

---

## 📊 Module 1 — Revenue Intelligence Engine

| Endpoint | Description |
|---|---|
| `GET /menu/analysis` | Full profitability matrix (50 items) |
| `GET /menu/hidden-stars` | Under-promoted high-margin items |
| `GET /menu/combos` | AI-suggested bundles (Apriori mining) |
| `GET /menu/risks` | Low-margin high-volume items |
| `GET /menu/price-suggestions` | Pricing recommendations |

**Key Features:**
- **Menu Matrix Classification** — Stars ⭐, Hidden Stars 💎, Plowhorses 🐴, Dogs 🐕
- **Apriori Association Mining** — finds frequently co-ordered items
- **Price Optimization** — rule-based suggestions to improve margins

## 🎙️ Module 2 — Voice Ordering Copilot

| Endpoint | Description |
|---|---|
| `POST /voice/transcribe` | Audio → text (Whisper, local) |
| `POST /voice/parse-order` | Text → mapped order JSON |
| `POST /voice/confirm-order` | Finalize → KOT generation |
| `GET /voice/orders` | All placed orders |

**Key Features:**
- **Whisper STT** — local, multilingual (English, Hindi, Hinglish)
- **Fuzzy Matching** — rapidfuzz maps spoken items to menu
- **Upsell Engine** — suggests combos featuring Hidden Star items
- **KOT Generation** — Kitchen Order Ticket as printable text

---

## 🛠️ Tech Stack

- **Backend:** Python, FastAPI, pandas, mlxtend (Apriori), OpenAI Whisper, rapidfuzz
- **Frontend:** React, Vite, Tailwind CSS, Recharts
- **Data:** Mock PoS dataset (50 menu items, 800 transactions)
- **No external LLM APIs** — everything runs locally

## 📁 Project Structure

```
petpooja-copilot/
├── backend/
│   ├── main.py                  # FastAPI app (9 endpoints)
│   ├── data/
│   │   ├── menu.json            # 50 mock menu items
│   │   └── transactions.json    # 800 mock transactions
│   ├── modules/
│   │   ├── revenue_engine.py    # Module 1: margin, velocity, matrix, Apriori, pricing
│   │   └── voice_copilot.py     # Module 2: STT, NLP, upsell, KOT
│   ├── generate_transactions.py # Transaction data generator
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Tab navigation shell
│   │   ├── index.css            # Dark theme design system
│   │   └── components/
│   │       ├── RevenueTable.jsx
│   │       ├── ComboSuggestions.jsx
│   │       └── VoiceOrderPanel.jsx
│   └── package.json
└── README.md
```
