# 🍽️ Petpooja Copilot — Project Explanation

**AI-Powered Revenue Intelligence & Voice Ordering Copilot for Restaurants**

Petpooja Copilot is a full-stack AI-powered SaaS tool designed to help restaurant owners make smarter business decisions. It analyzes Point of Sale (PoS) data to uncover hidden profit opportunities and automates phone-based ordering using voice AI — all running **100% locally** with no external API costs.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                       │
│        (Vite + Tailwind CSS + Recharts)                 │
│   Dashboard │ Menu Intel │ Combos │ Voice │ History     │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (proxy via Vite)
┌──────────────────────┴──────────────────────────────────┐
│                  FastAPI Backend                         │
│  ┌─────────────────────┐  ┌───────────────────────────┐ │
│  │  Revenue Engine      │  │  Voice Copilot            │ │
│  │  • Margin Analysis   │  │  • Whisper STT (local)    │ │
│  │  • Menu Matrix       │  │  • Fuzzy Matching         │ │
│  │  • Apriori Mining    │  │  • Upsell Engine          │ │
│  │  • Price Optimizer   │  │  • KOT Generator          │ │
│  └─────────────────────┘  └───────────────────────────┘ │
│                   JSON Data Store                        │
│          (menu.json, transactions.json, orders.json)     │
└─────────────────────────────────────────────────────────┘
```

**Tech Stack:**
- **Frontend:** React, Vite, Tailwind CSS, Recharts
- **Backend:** Python, FastAPI, Pandas, MLxtend, OpenAI Whisper, RapidFuzz
- **Data:** Mock PoS dataset (50 menu items, 800 transactions)
- **Key Constraint:** All AI/ML runs locally — no OpenAI API, no cloud dependencies

---

## 📄 Page-by-Page Breakdown

---

### Page 1: 🏠 Dashboard (Landing Page)

**Purpose:** Give the restaurant owner a quick, at-a-glance overview of their menu's financial health and top opportunities.

**What it shows:**

| Section | Description |
|---|---|
| **Stat Cards (4)** | Key metrics with animated counters: Hidden Stars Found (high-margin under-promoted items), Risk Items (low-margin high-volume items), Average Contribution Margin (%), and Orders Today |
| **Bar Chart** | Top 10 menu items ranked by contribution margin (₹). Uses an orange gradient — the taller the bar, the more profit that item generates per sale |
| **Donut Chart** | Menu category breakdown showing how many items fall into each classification: Stars, Hidden Stars, Plowhorses, Dogs |
| **Combo Suggestions** | Top 3 AI-recommended combos with AOV (Average Order Value) lift and confidence scores. Each has a "Promote" button |

**How it works:** Fetches data from `/menu/analysis` and `/menu/combos` API endpoints. The stat counters animate from 0 to their target value using a custom `useCountUp` hook.

**Business Value:** A restaurant owner opens this page and instantly sees: "I have 15 hidden gold mines in my menu that customers aren't ordering enough, and 14 items eating into my profits."

---

### Page 2: 📊 Menu Intelligence

**Purpose:** Deep-dive into every menu item's profitability with a full data table that can be searched, sorted, and filtered.

**What it shows:**

| Column | Description |
|---|---|
| **Item Name** | Name of the dish |
| **Category** | Purple pill badge (Pizzas, Burgers, Starters, etc.) |
| **Selling Price** | What the customer pays (₹) |
| **Food Cost** | What it costs to make (₹) |
| **Contribution Margin** | Selling Price − Food Cost (in green ₹) |
| **Margin %** | Margin as a percentage of selling price |
| **Velocity** | How fast it sells — **Fast Mover** (green), **Moderate** (yellow), **Slow Seller** (red) |
| **Status** | Menu Matrix classification — ⭐ Star, 🌟 Hidden Star, ⚠️ Plowhorse, 💀 Dog |
| **Action** | "Promote" button for Hidden Stars, "Review Pricing" for Plowhorses |

**Filters:** Click filter pills at the top to show only Stars, Hidden Stars, Plowhorses, or Dogs.
**Search:** Type in the search bar to find specific items.
**Sorting:** Click any column header to sort ascending/descending.

**The Menu Matrix explained:**

| | High Popularity | Low Popularity |
|---|---|---|
| **High Margin** | ⭐ **Star** — Keep as-is, promote heavily | 🌟 **Hidden Star** — Goldmine! Promote more |
| **Low Margin** | ⚠️ **Plowhorse** — Sells well but low profit, raise price | 💀 **Dog** — Low profit, low sales, consider removing |

**How it works:** Calls `/menu/analysis` which runs `contribution_margin()`, `sales_velocity()`, and `menu_matrix()` from the Revenue Engine. Hidden Star rows get an orange left border to draw attention.

**Business Value:** The owner can instantly spot that "Paneer Makhani Pizza has a 69.9% margin but barely sells — let's put it on the front page of the menu!"

---

### Page 3: 🧩 Combo Engine

**Purpose:** AI-generated combo/bundle suggestions based on real ordering patterns. Uses the Apriori association rule mining algorithm to find items that customers frequently order together.

**What it shows:**

| Section | Description |
|---|---|
| **Stats Bar** | Summary: "Analyzed 800 transactions · Found 20 strong associations · 5 include Hidden Stars" |
| **Combo Cards (2-col grid)** | Each card shows the recommended bundle items (as bold chips with "+" between them), confidence score, AOV lift estimate, and margin score (shown as 5 orange dots) |

**Each combo card contains:**
- `BUNDLE #N` label
- Item names as styled chips (e.g., **Farm Fresh Veggie Pizza** + **Loaded Nachos** + **Iced Tea**)
- "Ordered together **76%** of the time" — how often these items appear in the same order
- "+₹890 average order increase" — estimated boost to the average check
- Margin dots (1-5 filled orange dots) — how profitable the combo is
- "Add to Menu" and "Preview" buttons

**How it works:** The backend uses the **Apriori algorithm** (from `mlxtend`) on 800 mock transactions to find frequent itemsets. It then generates association rules with minimum confidence of 30%. Combos that include Hidden Star items are flagged — because promoting them in a combo is the easiest way to boost their sales.

**Business Value:** Instead of guessing which combos to offer, the owner gets data-driven suggestions: "Customers who order Farm Fresh Veggie Pizza almost always add Loaded Nachos. Let's bundle them at a small discount to increase average order value."

---

### Page 4: 🎙️ Voice Orders

**Purpose:** Automate phone-based ordering using voice AI. A staff member can record/upload customer audio or type the order in English, Hindi, or Hinglish — the system parses it into a structured order.

**Two-column layout:**

#### Left Column — New Voice Order
| Element | Description |
|---|---|
| **Microphone Button** | Large orange pulsing button — click to upload an audio file |
| **Upload Zone** | Drag-and-drop area for WAV/MP3 files |
| **Text Input** | Type an order manually (e.g., "ek paneer burger aur do french fries dena extra cheese") |
| **Example Prompts** | 4 clickable Hinglish example prompts for quick testing |
| **Transcription Panel** | Shows the Whisper-transcribed text with a "Hinglish" language badge |

#### Right Column — Parsed Order
| Element | Description |
|---|---|
| **Order Summary** | Each detected item with quantity badge, name, modifiers (as grey pills), and price |
| **Subtotal + GST** | Calculated automatically with 5% GST |
| **Upsell Suggestion** | 🔥 orange panel suggesting add-ons from the combo engine (Accept/Decline) |
| **Confirm Button** | "🍳 Confirm & Send to Kitchen" — finalizes the order |
| **KOT Display** | After confirmation, shows the Kitchen Order Ticket in monospace format |

**How it works:**
1. **Audio → Text:** Uses OpenAI Whisper (base model, running locally) to transcribe audio
2. **Text → Items:** Uses RapidFuzz fuzzy matching (threshold: 65%) to map spoken words to menu items. Handles Hinglish: "ek" → 1, "do" → 2, "teen" → 3. Extracts modifiers like "extra cheese", "large", "spicy"
3. **Upsell:** Checks the combo engine for relevant upsell suggestions based on ordered items
4. **Confirm:** Saves the order to `orders.json` and generates a KOT (Kitchen Order Ticket)

**Business Value:** A restaurant receiving 50 phone orders/day can save 2-3 hours of manual order-taking. The Hinglish support means it works in real Indian restaurant scenarios where customers mix Hindi and English.

---

### Page 5: 📋 Order History

**Purpose:** View all past orders placed through the Voice Copilot in a clean, timeline-style interface.

**What it shows:**

| Element | Description |
|---|---|
| **Time Filters** | Filter pills: Today / This Week / All Time |
| **Order Count** | Shows "N orders" in the corner |
| **Timeline List** | Each order displayed as a card with: Order ID (orange), timestamp, items summary, total amount (green), language badge (Hinglish), and status badge (✓ Confirmed) |
| **Expandable Details** | Click any order to expand and see full item breakdown with quantities, modifiers, and per-item prices |

**How it works:** Fetches all orders from `/voice/orders` endpoint, which reads from `orders.json`. Orders are displayed most-recent-first. Clicking an order toggles a detailed breakdown panel with smooth animation.

**Business Value:** Restaurant managers can review all voice-processed orders, verify accuracy, track order patterns, and identify peak ordering times.

---

## 🔧 Backend API Reference

### Module 1 — Revenue Intelligence

| Endpoint | Method | Description |
|---|---|---|
| `/menu/analysis` | GET | Returns all 50 items with margin, velocity, classification |
| `/menu/hidden-stars` | GET | Returns only Hidden Star items |
| `/menu/combos` | GET | Returns Apriori-mined combo suggestions |
| `/menu/risks` | GET | Returns low-margin high-volume risk items |
| `/menu/price-suggestions` | GET | Returns pricing recommendations |

### Module 2 — Voice Copilot

| Endpoint | Method | Description |
|---|---|---|
| `/voice/transcribe` | POST | Accepts audio file → returns transcription |
| `/voice/parse-order` | POST | Accepts text → returns mapped order JSON with items, prices, modifiers, upsells |
| `/voice/confirm-order` | POST | Confirms order → saves to orders.json, generates KOT |
| `/voice/orders` | GET | Returns all placed orders |

---

## 🧠 Key Algorithms

### 1. Menu Matrix Classification
Classifies each item into a 2×2 matrix based on **margin** (above/below median) and **popularity** (above/below median order count):
- **Star:** High margin + High popularity → Maintain and promote
- **Hidden Star:** High margin + Low popularity → Major opportunity — promote aggressively
- **Plowhorse:** Low margin + High popularity → Raise price or reduce cost
- **Dog:** Low margin + Low popularity → Consider removing from menu

### 2. Apriori Association Mining
Analyzes 800 transactions to find items frequently ordered together. Uses minimum support of 1% and confidence of 30%. Outputs association rules like "If customer orders A, they'll also order B with 78% confidence."

### 3. Fuzzy Matching (RapidFuzz)
Maps spoken/typed item names to the actual menu using partial ratio matching. Handles:
- Misspellings ("panner" → "Paneer Burger")
- Hinglish ("french fri" → "French Fries")
- Partial names ("marg pizza" → "Margherita Pizza")

### 4. Whisper STT
OpenAI's open-source speech-to-text model running locally. Supports English, Hindi, and multilingual input. Uses the "base" model for speed.

---

## 🚀 Running the Project

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
python generate_transactions.py    # Run once to generate mock data
python -m uvicorn main:app --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## 📁 Project Structure

```
Petpooja/
├── backend/
│   ├── main.py                      # FastAPI app — 9 API endpoints
│   ├── requirements.txt             # Python dependencies
│   ├── generate_transactions.py     # Mock transaction data generator
│   ├── data/
│   │   ├── menu.json                # 50 menu items with pricing
│   │   ├── transactions.json        # 800 mock PoS transactions
│   │   └── orders.json              # Voice orders (created at runtime)
│   └── modules/
│       ├── revenue_engine.py        # Module 1: margin, velocity, matrix, Apriori, pricing
│       └── voice_copilot.py         # Module 2: STT, NLP, upsell, KOT
├── frontend/
│   ├── vite.config.js               # Vite config + API proxy
│   ├── package.json
│   └── src/
│       ├── App.jsx                  # Main app — sidebar + topbar + page routing
│       ├── index.css                # Design system — dark theme, glassmorphism
│       └── components/
│           ├── Sidebar.jsx          # Navigation sidebar
│           ├── Dashboard.jsx        # Page 1 — Overview
│           ├── MenuIntelligence.jsx # Page 2 — Menu table
│           ├── ComboEngine.jsx      # Page 3 — Combo recommendations
│           ├── VoiceOrders.jsx      # Page 4 — Voice ordering
│           └── OrderHistory.jsx     # Page 5 — Order timeline
├── README.md
├── PROJECT_EXPLANATION.md           # This file
└── .gitignore
```
