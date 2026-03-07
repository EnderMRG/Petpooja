# 🍽️ Petpooja AI Copilot

**AI-Powered Revenue Intelligence, Voice Ordering & Inventory Management for Restaurants**

A full-stack restaurant SaaS platform that turns raw PoS data into intelligent revenue decisions, automates voice-based ordering, manages inventory with recipe-based auto-depletion, and provides real-time operational insights — all running **100% locally** with no external API costs.

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
| 🏠 **Landing Page** | Animated hero page with live feature showcase |
| 🔐 **Login / Setup** | Onboarding flow with restaurant profile configuration |
| 📊 **Revenue Intelligence** | Menu matrix, margin analysis, combo recommendations, pricing suggestions |
| 🎙️ **Voice Ordering** | Whisper STT + fuzzy matching, upsell engine, KOT generation |
| 📦 **Inventory Manager** | Full CRUD, stock tracking, low-stock alerts, restock operations |
| 🧾 **Recipe (BOM)** | Bill of Materials per menu item, auto-depletion on order placement |
| ⚙️ **Menu Management** | Add/edit/delete items with integrated recipe builder |
| 📋 **Order History** | Searchable order log with detailed breakdowns |
| 🍽️ **Curated Menu** | Customer-facing menu with filtering, cart & checkout |
| 🖥️ **Kitchen Display** | Real-time KDS for kitchen staff with order status tracking |

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
- **Apriori Association Mining** — discovers frequently co-ordered items from 800 mock transactions
- **Price Optimization** — rule-based suggestions to improve margins
- **Contribution Margin Analysis** — per-item profit breakdown with velocity scoring

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

## 🍽️ Module 6 — Customer Menu & Kitchen Display

**Customer-Facing Menu (`CuratedMenu`):**
- Filterable menu by category with real-time search
- Add-to-cart with quantity controls and modifier support
- Cart summary with GST calculation and checkout flow

**Kitchen Display System (`KitchenDisplay`):**
- Live order queue for kitchen staff
- Order status transitions: Pending → In Progress → Ready → Served
- Visual timer and priority indicators per order

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.12, FastAPI, Uvicorn |
| **ML/AI** | OpenAI Whisper (STT), rapidfuzz (fuzzy matching), mlxtend (Apriori) |
| **Analytics** | pandas, numpy |
| **Frontend** | React 19, Vite 5, Tailwind CSS 4, Recharts, Framer Motion |
| **Icons** | Lucide React |
| **Data** | JSON files (menu, inventory, recipes, orders, transactions) |

> **No external LLM APIs** — Speech-to-text and all ML runs 100% locally.

---

## 📁 Project Structure

```
Petpooja/
├── backend/
│   ├── main.py                     # FastAPI app (20+ endpoints)
│   ├── supplier_server.py          # Supplier-side server
│   ├── generate_transactions.py    # Mock transaction data generator
│   ├── data/
│   │   ├── menu.json               # 51 menu items
│   │   ├── inventory.json          # 20 inventory ingredients
│   │   ├── recipes.json            # BOM for all 51 items
│   │   ├── orders.json             # Placed orders
│   │   └── transactions.json       # 800 mock transactions
│   ├── modules/
│   │   ├── db.py                   # JSON data access layer
│   │   ├── revenue_engine.py       # Margin, velocity, matrix, Apriori, pricing
│   │   └── voice_copilot.py        # STT, fuzzy match, upsell, KOT
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── petpoja.png             # App logo (favicon + sidebar)
│   ├── src/
│   │   ├── App.jsx                 # Tab navigation shell
│   │   ├── main.jsx                # React entry point
│   │   ├── index.css               # Design system + dark theme + glassmorphism
│   │   ├── utils/
│   │   │   └── apiFetch.js         # Centralized API client wrapper
│   │   └── components/
│   │       ├── LandingPage.jsx     # Hero landing page with animated features
│   │       ├── Login.jsx           # Login & authentication screen
│   │       ├── Setup.jsx           # Restaurant onboarding / profile setup
│   │       ├── Sidebar.jsx         # Navigation sidebar
│   │       ├── Dashboard.jsx       # Revenue overview dashboard
│   │       ├── MenuIntelligence.jsx # Menu matrix & analytics table
│   │       ├── ComboEngine.jsx     # Apriori combo recommendation UI
│   │       ├── ComboSuggestions.jsx # Combo suggestions sub-component
│   │       ├── RevenueTable.jsx    # Detailed revenue breakdown table
│   │       ├── VoiceOrders.jsx     # Full voice + manual ordering page
│   │       ├── VoiceOrderPanel.jsx # Voice recording & transcription panel
│   │       ├── OrderHistory.jsx    # Order log & search timeline
│   │       ├── InventoryManager.jsx # Inventory CRUD + alerts + restock
│   │       ├── Settings.jsx        # Menu management + recipe BOM builder
│   │       ├── CuratedMenu.jsx     # Customer-facing menu with cart
│   │       ├── CustomerMenu.jsx    # Full customer ordering experience
│   │       └── KitchenDisplay.jsx  # Real-time kitchen order display (KDS)
│   ├── vite.config.js
│   └── package.json
├── docs/
│   ├── Petpooja_ML_Models.tex      # ML models LaTeX source
│   ├── Petpooja_ML_Models.pdf      # Compiled ML guide (PDF)
│   ├── Petpooja_Project.tex        # Full project documentation (LaTeX)
│   ├── PROJECT_EXPLANATION.md      # Detailed project explanation
│   └── Petpooja Track *.pdf/pptx   # Hackathon track documents
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

### Proposed (see `docs/Petpooja_ML_Models.pdf`)
| Model | Purpose | Library |
|---|---|---|
| **Demand Forecasting** | Predict item sales for inventory planning | `prophet` |
| **NLP Intent Parser** | LLM-based complex order understanding | `transformers` / `openai` |
| **Collaborative Filtering** | Personalized upsell recommendations | `scikit-surprise` |
| **Anomaly Detection** | Revenue/inventory anomaly alerts | `scikit-learn` |

---

## 🎨 UI/UX Design

The frontend features a premium dark-theme SaaS design:
- **Dark glassmorphism** panels with backdrop blur
- **Orange accent system** (`#F97415`) as primary brand color
- **Framer Motion** animations — page transitions, counter animations, micro-interactions
- **Recharts** for interactive bar, donut, and area charts
- **Lucide React** icon system throughout
- **Responsive layouts** with Tailwind CSS utility classes

---

## 🚦 API Quick Reference

```
Backend base URL: http://localhost:8000
Frontend dev URL: http://localhost:5173 (proxies /api/* → backend)

Health check:    GET  /
Menu analysis:   GET  /menu/analysis
Hidden stars:    GET  /menu/hidden-stars
Combos:          GET  /menu/combos
Price tips:      GET  /menu/price-suggestions
Transcribe:      POST /voice/transcribe       (multipart audio)
Parse order:     POST /voice/parse-order      (JSON: { text })
Confirm order:   POST /voice/confirm-order    (JSON: order payload)
Order history:   GET  /voice/orders
Inventory:       GET  /inventory/items
Restock:         PATCH /inventory/items/{id}/restock
Recipes:         GET  /recipes
```

---

## 📄 License

Hackathon project — built for the Petpooja AI Copilot challenge.
