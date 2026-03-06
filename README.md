# 🍽️ Petpooja AI Copilot

**AI-Powered Revenue Intelligence, Voice Ordering & Inventory Management for Restaurants**

A full-stack restaurant SaaS platform that turns raw PoS data into intelligent revenue decisions, automates voice-based ordering, manages inventory with recipe-based auto-depletion, and provides real-time operational insights.

---

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

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the frontend proxies API requests to `localhost:8000`.

---

## ✨ Features Overview

| Module | Description |
|---|---|
| 📊 **Revenue Intelligence** | Menu matrix, margin analysis, combo recommendations, pricing suggestions |
| 🎙️ **Voice Ordering** | Whisper STT + fuzzy matching, upsell engine, KOT generation |
| 📦 **Inventory Manager** | Full CRUD, stock tracking, low-stock alerts, restock operations |
| 🧾 **Recipe (BOM)** | Bill of Materials per menu item, auto-depletion on order placement |
| ⚙️ **Menu Management** | Add/edit/delete items with integrated recipe builder |
| 📋 **Order History** | Searchable order log with detailed breakdowns |

---

## 📊 Module 1 — Revenue Intelligence Engine

| Endpoint | Description |
|---|---|
| `GET /menu/analysis` | Full profitability matrix (51 items) |
| `GET /menu/hidden-stars` | Under-promoted high-margin items |
| `GET /menu/combos` | AI-suggested bundles (Apriori mining) |
| `GET /menu/risks` | Low-margin high-volume items |
| `GET /menu/price-suggestions` | Pricing recommendations |

**Key Features:**
- **Menu Matrix Classification** — Stars ⭐, Hidden Stars 💎, Plowhorses 🐴, Dogs 🐕
- **Apriori Association Mining** — discovers frequently co-ordered items from transaction data
- **Price Optimization** — rule-based suggestions to improve margins

---

## 🎙️ Module 2 — Voice Ordering Copilot

| Endpoint | Description |
|---|---|
| `POST /voice/transcribe` | Audio → text (Whisper, local) |
| `POST /voice/parse-order` | Text → mapped order JSON (fuzzy match) |
| `POST /voice/confirm-order` | Finalize → KOT + auto inventory depletion |
| `GET /voice/orders` | All placed orders |

**Key Features:**
- **Whisper STT** — runs locally, multilingual (English, Hindi, Hinglish)
- **Fuzzy Matching** — rapidfuzz maps spoken items to menu with confidence scoring
- **Upsell Engine** — suggests combos featuring Hidden Star items
- **KOT Generation** — Kitchen Order Ticket as printable text
- **Stock Impact** — shows depleted ingredients & low-stock alerts after order placement

---

## 📦 Module 3 — Inventory Management

| Endpoint | Description |
|---|---|
| `GET /inventory/items` | All inventory ingredients |
| `POST /inventory/items` | Add new ingredient |
| `PUT /inventory/items/{id}` | Update ingredient details |
| `DELETE /inventory/items/{id}` | Remove ingredient |
| `PATCH /inventory/items/{id}/restock` | Restock an ingredient |

**Key Features:**
- **20 pre-seeded ingredients** with stock levels, costs, suppliers
- **Real-time stock tracking** with visual stock bars and status indicators
- **Low-stock alerts** with configurable minimum thresholds
- **Supplier management** and restock date tracking

---

## 🧾 Module 4 — Recipe Management (BOM)

| Endpoint | Description |
|---|---|
| `GET /recipes` | All recipes keyed by item_id |
| `GET /recipes/{item_id}` | Recipe for a specific menu item |
| `PUT /recipes/{item_id}` | Create/update a recipe |

**Key Features:**
- **51 pre-seeded recipes** — every menu item mapped to its ingredient BOM
- **Integrated into menu management** — add/edit recipes directly in the item modal
- **Auto-depletion** — when an order is confirmed, ingredients are automatically subtracted
- **Stock alerts** — triggered if any ingredient drops below its minimum threshold

---

## ⚙️ Module 5 — Menu Management (CRUD)

| Endpoint | Description |
|---|---|
| `GET /menu/items` | All menu items |
| `POST /menu/items` | Add new item |
| `PUT /menu/items/{id}` | Update item |
| `PATCH /menu/items/{id}/toggle` | Toggle availability |
| `DELETE /menu/items/{id}` | Delete item |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.12, FastAPI, Uvicorn |
| **ML/AI** | OpenAI Whisper (STT), rapidfuzz (fuzzy matching), mlxtend (Apriori) |
| **Analytics** | pandas, numpy |
| **Frontend** | React 18, Vite 5, Recharts |
| **Data** | JSON files (menu, inventory, recipes, orders, transactions) |

> **No external LLM APIs** — Speech-to-text and all ML runs 100% locally.

---

## 📁 Project Structure

```
Petpooja/
├── backend/
│   ├── main.py                     # FastAPI app (20+ endpoints)
│   ├── data/
│   │   ├── menu.json               # 51 menu items
│   │   ├── inventory.json          # 20 inventory ingredients
│   │   ├── recipes.json            # BOM for all 51 items
│   │   ├── orders.json             # Placed orders
│   │   └── transactions.json       # 800 mock transactions
│   ├── modules/
│   │   ├── revenue_engine.py       # Margin, velocity, matrix, Apriori, pricing
│   │   └── voice_copilot.py        # STT, fuzzy match, upsell, KOT
│   ├── generate_transactions.py    # Transaction data generator
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── petpoja.png             # App logo (favicon + sidebar)
│   ├── src/
│   │   ├── App.jsx                 # Tab navigation shell
│   │   ├── main.jsx                # React entry point
│   │   ├── index.css               # Design system + theme
│   │   └── components/
│   │       ├── LandingPage.jsx     # Hero landing page
│   │       ├── Sidebar.jsx         # Navigation sidebar
│   │       ├── Dashboard.jsx       # Revenue overview dashboard
│   │       ├── MenuIntelligence.jsx # Menu matrix & analytics
│   │       ├── ComboEngine.jsx     # Combo recommendation UI
│   │       ├── VoiceOrders.jsx     # Voice + manual ordering
│   │       ├── OrderHistory.jsx    # Order log & search
│   │       ├── InventoryManager.jsx # Inventory CRUD + alerts
│   │       └── Settings.jsx        # Menu management + recipe builder
│   ├── vite.config.js
│   └── package.json
├── Petpooja_ML_Models.tex          # ML models LaTeX document
├── Petpooja_ML_Models.pdf          # Compiled ML guide (PDF)
└── README.md
```

---

## 🤖 ML Models

### Currently Implemented
| Model | Purpose | Library |
|---|---|---|
| **OpenAI Whisper** | Speech-to-text (voice orders) | `whisper` |
| **RapidFuzz** | Fuzzy menu item matching | `rapidfuzz` |
| **Apriori Algorithm** | Combo/bundle recommendations | `mlxtend` |
| **Menu Matrix** | Star/Hidden Star/Plowhorse/Dog classification | `pandas` |

### Proposed (see `Petpooja_ML_Models.pdf`)
| Model | Purpose | Library |
|---|---|---|
| **Demand Forecasting** | Predict item sales for inventory planning | `prophet` |
| **NLP Intent Parser** | LLM-based complex order understanding | `transformers` / `openai` |
| **Collaborative Filtering** | Personalized upsell recommendations | `scikit-surprise` |
| **Anomaly Detection** | Revenue/inventory anomaly alerts | `scikit-learn` |

---

## 📸 Screenshots

The application features:
- **Landing Page** — modern hero page with animated feature cards
- **Dashboard** — revenue stats, charts, quick actions
- **Menu Intelligence** — interactive matrix, margin analysis
- **Voice Orders** — drag-and-drop audio upload + manual ordering with cart
- **Inventory Manager** — stock tracking, alerts, restock modals
- **Settings** — menu CRUD with integrated recipe (BOM) builder

---

## 📄 License

Hackathon project — built for the Petpooja AI Copilot challenge.
