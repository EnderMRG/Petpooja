import pptxgen from "pptxgenjs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

// Colours
const DARK_BG = "0F0F1A";
const ACCENT = "F97415"; // Petpooja orange
const ACCENT2 = "6C63FF"; // Purple
const WHITE = "FFFFFF";
const LIGHT_GREY = "CCCCDD";
const MID_GREY = "444466";
const GREEN = "22C55E";
const CARD_BG = "1A1A2E";

let pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 13.33 x 7.5 inches
pres.author = "HACKaMINeD Team";
pres.title = "Petpooja AI Copilot";

const W = 13.33;
const H = 7.5;

function addDarkBg(slide, titleText, subtitleText = null) {
    // Bg
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: DARK_BG } });
    // Top bar
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.08, fill: { color: ACCENT } });
    // Bottom bar
    slide.addShape(pres.ShapeType.rect, { x: 0, y: H - 0.06, w: W, h: 0.06, fill: { color: ACCENT2 } });

    if (titleText) {
        slide.addText(titleText, { x: 0.6, y: 0.2, w: 12, h: 0.7, fontSize: 28, bold: true, color: ACCENT });
        slide.addShape(pres.ShapeType.rect, { x: 0.6, y: 0.95, w: 2.5, h: 0.04, fill: { color: ACCENT } });
    }
    if (subtitleText) {
        slide.addText(subtitleText, { x: 0.6, y: 1.0, w: 12, h: 0.45, fontSize: 13, color: LIGHT_GREY });
    }
}

function card(slide, x, y, w, h, title, bullets, titleColor = ACCENT) {
    slide.addShape(pres.ShapeType.rect, {
        x, y, w, h,
        fill: { color: CARD_BG },
        line: { color: MID_GREY, width: 0.75 }
    });
    slide.addText(title, { x: x + 0.18, y: y + 0.12, w: w - 0.3, h: 0.38, bold: true, fontSize: 13, color: titleColor });

    const textProps = bullets.map((p, i) => ({
        text: p,
        options: { breakLine: i < bullets.length - 1, bullet: { code: "25B8" }, color: LIGHT_GREY, fontSize: 11.5, margin: [4, 0, 0, 0] }
    }));
    slide.addText(textProps, { x: x + 0.18, y: y + 0.5, w: w - 0.3, h: h - 0.55 });
}

// ============== SLIDE 1: Title ==============
let slide1 = pres.addSlide();
addDarkBg(slide1, null, null);

const LOGO_Y = 0.22;
const LOGO_H = 0.88;

// Logos
const resolveLogo = (str) => {
    const p = path.join(ROOT_DIR, str);
    return fs.existsSync(p) ? p : null;
};
const hakLogo = resolveLogo("docs/hackamined_logo.png");
const nLogo = resolveLogo("docs/nirma_logo.png");
const buLogo = resolveLogo("docs/bu_logo.png");
const ppLogo = resolveLogo("frontend/public/petpoja.png");

if (hakLogo) slide1.addImage({ path: hakLogo, x: W / 2 - 0.6, y: LOGO_Y, w: 1.2, h: LOGO_H });
if (nLogo) slide1.addImage({ path: nLogo, x: 0.4, y: LOGO_Y, w: 1.5, h: LOGO_H });
if (buLogo) slide1.addImage({ path: buLogo, x: W - 2.2, y: LOGO_Y, w: 1.7, h: LOGO_H });
if (ppLogo) slide1.addImage({ path: ppLogo, x: W - 4.2, y: LOGO_Y, w: 1.5, h: LOGO_H });

slide1.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.28, w: W - 1.0, h: 0.025, fill: { color: MID_GREY } });
slide1.addText("Nirma University  •  Institute of Technology", { x: 0.5, y: 1.35, w: 8, h: 0.38, fontSize: 12.5, color: LIGHT_GREY });

// Track badge
slide1.addShape(pres.ShapeType.rect, { x: 8.9, y: 1.32, w: 4.0, h: 0.36, fill: { color: ACCENT }, rectRadius: 2 });
slide1.addText("Track: AI-Powered Revenue & Voice Copilot", { x: 8.92, y: 1.33, w: 3.96, h: 0.34, bold: true, fontSize: 10.5, color: WHITE, align: "center" });

slide1.addText("Track Sponsor: Petpooja", { x: 0.5, y: 1.78, w: 6, h: 0.32, fontSize: 11.5, color: ACCENT });

// Title
slide1.addText("🍽️  Petpooja AI Copilot", { x: 0.5, y: 2.25, w: 12.3, h: 1.1, bold: true, fontSize: 46, color: WHITE, align: "center" });
slide1.addShape(pres.ShapeType.rect, { x: 3.5, y: 3.35, w: 6.3, h: 0.06, fill: { color: ACCENT } });

slide1.addText("AI-Powered Revenue Intelligence · Voice Ordering · Inventory Automation", { x: 0.5, y: 3.5, w: 12.3, h: 0.5, fontSize: 16, color: LIGHT_GREY, align: "center" });
slide1.addText("HACKaMINeD 2026", { x: 0.5, y: 4.1, w: 12.3, h: 0.42, bold: true, fontSize: 18, color: ACCENT2, align: "center" });

// Team
slide1.addShape(pres.ShapeType.rect, { x: 3.0, y: 4.62, w: 7.3, h: 1.65, fill: { color: CARD_BG }, line: { color: ACCENT, width: 1.2 } });
slide1.addText("Team Name:  [Your Team Name]", { x: 3.2, y: 4.72, w: 7.0, h: 0.4, bold: true, fontSize: 14, color: ACCENT, align: "center" });
slide1.addText("Member 1  ·  Member 2  ·  Member 3  ·  Member 4", { x: 3.2, y: 5.18, w: 7.0, h: 0.38, fontSize: 13, color: WHITE, align: "center" });
slide1.addText("Nirma University, Ahmedabad", { x: 3.2, y: 5.6, w: 7.0, h: 0.35, fontSize: 11.5, color: LIGHT_GREY, align: "center" });


// ============== SLIDE 2: Problem ==============
let slide2 = pres.addSlide();
addDarkBg(slide2, "Problem Statement", "The Hidden Crisis in India's Restaurant Industry");

const stats = [
    { v: "~₹40,000 Cr", l: "Lost annually due to\nunoptimised menu pricing" },
    { v: "< 20%", l: "Restaurants use any\ndata-driven analytics tool" },
    { v: "2–3 hrs/day", l: "Wasted on manual\nphone order taking" },
    { v: "30–40%", l: "Food waste from poor\ninventory tracking" }
];
stats.forEach((s, i) => {
    let cx = 0.45 + i * (2.9 + 0.25);
    slide2.addShape(pres.ShapeType.rect, { x: cx, y: 1.6, w: 2.9, h: 1.7, fill: { color: CARD_BG }, line: { color: ACCENT, width: 1.2 } });
    slide2.addText(s.v, { x: cx, y: 1.75, w: 2.9, h: 0.65, bold: true, fontSize: 26, color: ACCENT, align: "center" });
    slide2.addText(s.l, { x: cx, y: 2.4, w: 2.9, h: 0.7, fontSize: 11, color: LIGHT_GREY, align: "center" });
});

slide2.addShape(pres.ShapeType.rect, { x: 0.45, y: 3.55, w: 12.4, h: 2.7, fill: { color: CARD_BG }, line: { color: MID_GREY, width: 0.6 } });
slide2.addText(
    "Restaurant owners in India manage 40–60 menu items and hundreds of daily transactions with zero visibility into which items are profitable, which are dragging margins down, and which hidden gems are being ignored. Phone-based ordering — still dominant in India — is slow, error-prone, and language-mixed (Hinglish). Inventory is managed on paper or basic spreadsheets, leading to stockouts, over-ordering, and silent revenue leakage.\n\nThere is NO affordable, locally-running AI solution designed specifically for Indian SMB restaurants.",
    { x: 0.65, y: 3.7, w: 12.0, h: 2.5, fontSize: 13, color: LIGHT_GREY }
);

// ============== SLIDE 3: Intro ==============
let slide3 = pres.addSlide();
addDarkBg(slide3, "Introduction", "What is Petpooja AI Copilot?");
slide3.addText("Petpooja AI Copilot is a full-stack, locally-running AI platform that transforms raw Point-of-Sale data into intelligent revenue decisions — and automates Hinglish voice ordering — with zero cloud API costs.", { x: 0.6, y: 1.1, w: 12.1, h: 0.75, fontSize: 14, color: LIGHT_GREY });

const mods = [
    { t: "📊 Revenue Intelligence", b: ["Menu Matrix (Star/Hidden Star/\nPlowhorse/Dog)", "Margin analysis", "Price optimisation"] },
    { t: "🎙️ Voice Ordering Copilot", b: ["Whisper STT (local)", "Hinglish fuzzy matching", "Upsell engine · KOT gen"] },
    { t: "📦 Inventory Manager", b: ["Real-time stock tracking", "Low-stock alerts", "Auto-depletion on order"] },
    { t: "🧾 Recipe / BOM", b: ["Bill of Materials per item", "Auto ingredient deduction", "51 pre-seeded recipes"] },
    { t: "🍽️ Customer Menu + KDS", b: ["Filterable menu", "Cart & GST checkout", "Kitchen Display System"] },
    { t: "🧩 Combo Engine", b: ["Apriori association mining on\n800 transactions", "AOV-boosting bundles"] },
];
mods.forEach((m, i) => {
    card(slide3, 0.45 + (i % 3) * (4.1 + 0.2), 2.05 + Math.floor(i / 3) * (1.75 + 0.18), 4.1, 1.75, m.t, m.b);
});

// ============== SLIDE 4: Approach ==============
let slide4 = pres.addSlide();
addDarkBg(slide4, "Proposed Approach", "Architecture & Algorithm Pipeline");

slide4.addShape(pres.ShapeType.rect, { x: 0.35, y: 1.1, w: 12.6, h: 4.05, fill: { color: "0D0D1C" }, line: { color: ACCENT2, width: 0.8 } });
slide4.addText([
    { text: "┌──────────────── React Frontend  (Vite · Tailwind CSS · Recharts) ────────────────┐\n", options: { fontFace: "Courier New", color: GREEN, fontSize: 9.5 } },
    { text: "│  Dashboard  │  Menu Intelligence  │  Combo Engine  │  Voice Orders  │  Inventory │\n", options: { fontFace: "Courier New", color: GREEN, fontSize: 9.5 } },
    { text: "└───────────────────────────────────┬───────────────────────────────────────────────┘\n", options: { fontFace: "Courier New", color: GREEN, fontSize: 9.5 } },
    { text: "                                    │  REST API  (Vite proxy → localhost:8000)\n", options: { fontFace: "Courier New", color: GREEN, fontSize: 9.5 } },
    { text: "┌───────────────────────────────────┴───────────────────────────────────────────────┐\n", options: { fontFace: "Courier New", color: GREEN, fontSize: 9.5 } },
    { text: "│                         FastAPI + Uvicorn  Backend                                │\n", options: { fontFace: "Courier New", color: GREEN, fontSize: 9.5 } },
    { text: "│  ┌──Revenue Engine──────────────┐   ┌──Voice Copilot────────────────────────────┐ │\n", options: { fontFace: "Courier New", color: GREEN, fontSize: 9.5 } },
    { text: "│  │ • Pandas margin & velocity   │   │ • OpenAI Whisper STT (base, local)        │ │\n", options: { fontFace: "Courier New", color: GREEN, fontSize: 9.5 } },
    { text: "│  │ • Menu Matrix classification │   │ • RapidFuzz fuzzy match (≥65% threshold)  │ │\n", options: { fontFace: "Courier New", color: GREEN, fontSize: 9.5 } },
    { text: "│  │ • Apriori mining (mlxtend)   │   │ • Hinglish qty parser (ek/do/teen)        │ │\n", options: { fontFace: "Courier New", color: GREEN, fontSize: 9.5 } },
    { text: "│  │ • Rule-based price optimizer │   │ • Upsell engine + KOT generator           │ │\n", options: { fontFace: "Courier New", color: GREEN, fontSize: 9.5 } },
    { text: "│  └──────────────────────────────┘   └───────────────────────────────────────────┘ │\n", options: { fontFace: "Courier New", color: GREEN, fontSize: 9.5 } },
    { text: "│                     JSON Data Store  (menu · inventory · recipes · orders)        │\n", options: { fontFace: "Courier New", color: GREEN, fontSize: 9.5 } },
    { text: "└───────────────────────────────────────────────────────────────────────────────────┘", options: { fontFace: "Courier New", color: GREEN, fontSize: 9.5 } }
], { x: 0.5, y: 1.15, w: 12.35, h: 4.0 });

const stack = ["Python 3.12", "FastAPI", "OpenAI Whisper", "RapidFuzz", "MLxtend / Apriori", "Pandas · NumPy", "React 19 · Vite 5", "Tailwind CSS 4", "Recharts"];
let pillX = 0.35, pillY = 5.3;
stack.forEach(tech => {
    let pw = tech.length * 0.105 + 0.25;
    if (pillX + pw > 12.5) { pillX = 0.35; pillY += 0.42; }
    slide4.addShape(pres.ShapeType.rect, { x: pillX, y: pillY, w: pw, h: 0.34, fill: { color: ACCENT2 } });
    slide4.addText(tech, { x: pillX, y: pillY, w: pw, h: 0.34, bold: true, fontSize: 9.5, color: WHITE, align: "center" });
    pillX += pw + 0.1;
});
slide4.addText("⚡  100% Local — No external LLM API calls · No cloud costs", { x: 0.5, y: 6.55, w: 12.0, h: 0.38, bold: true, fontSize: 13, color: ACCENT, align: "center" });

// ============== SLIDE 5: USP ==============
let slide5 = pres.addSlide();
addDarkBg(slide5, "Why Choose Petpooja AI Copilot?", "Key differentiators over existing restaurant management tools");

const usps = [
    { t: "🆓  Zero API Cost", b: ["Runs 100% locally on-device", "No monthly subscription to OpenAI"] },
    { t: "🗣️  Hinglish-Native Voice AI", b: ["Handles real Indian orders:", "\"do paneer burger aur ek large fries\""] },
    { t: "💎  Hidden Star Discovery", b: ["Finds high-margin, under-promoted items", "Direct actionable revenue uplift"] },
    { t: "📦  Auto Inventory Depletion", b: ["Recipe BOM linked to every menu item", "Low-stock alerts prevent stockouts"] },
    { t: "🧩  AI Combo Suggestions", b: ["Apriori mines 800 real transactions", "Each combo shows AOV lift & margin score"] },
    { t: "🖥️  Full-Stack SaaS UX", b: ["Dark glassmorphism dashboard", "Kitchen Display + Customer menu"] },
];
usps.forEach((m, i) => {
    card(slide5, 0.4 + (i % 3) * (4.0 + 0.26), 1.45 + Math.floor(i / 3) * (1.85 + 0.18), 4.0, 1.85, m.t, m.b);
});

// ============== SLIDE 6: Limits ==============
let slide6 = pres.addSlide();
addDarkBg(slide6, "Limitations & Scope", "Honest assessment of when the solution may face difficulties");
const limits = [
    { t: "🎤  Audio Quality", b: ["Whisper struggles with heavy background noise", "Optimal with a clear microphone from ~30 cm"] },
    { t: "📊  Data Dependency", b: ["Requires ~200+ transactions for Apriori rules", "Small menus (<10 items) skew Menu Matrix"] },
    { t: "🔌  Hardware Requirements", b: ["Whisper 'base' model requires ~1 GB RAM", "Slower on CPUs without AVX2"] },
    { t: "🌐  Scope Boundaries", b: ["Single-outlet only in MVP", "No payment gateway / real POS hardware"] },
];
limits.forEach((m, i) => {
    card(slide6, 0.4 + (i % 2) * (6.0 + 0.5), 1.38 + Math.floor(i / 2) * (2.2 + 0.22), 6.0, 2.2, m.t, m.b);
});

// ============== SLIDE 7: Demo ==============
let slide7 = pres.addSlide();
addDarkBg(slide7, "Screenshot & Demonstration", "Live system running at http://localhost:5173");
const screens = ["📊 Revenue Dashboard", "🍽️ Menu Intelligence", "🎙️ Voice Ordering", "📦 Inventory Manager", "🧩 Combo Engine", "🖥️ Kitchen Display"];
screens.forEach((lbl, i) => {
    let cx = 0.4 + (i % 3) * (4.0 + 0.3);
    let cy = 1.45 + Math.floor(i / 3) * (2.6 + 0.25);
    slide7.addShape(pres.ShapeType.rect, { x: cx, y: cy, w: 4.0, h: 2.6, fill: { color: CARD_BG }, line: { color: MID_GREY, width: 0.75 } });
    slide7.addText(lbl, { x: cx + 0.1, y: cy + 0.1, w: 3.8, h: 0.35, bold: true, fontSize: 12, color: ACCENT });
    slide7.addText("[ Screenshot / video here ]", { x: cx, y: cy + 0.55, w: 4.0, h: 1.9, fontSize: 11, color: MID_GREY, align: "center" });
});
slide7.addText("▶  Live demo: python -m uvicorn main:app --port 8000  +  npm run dev  →  localhost:5173", { x: 0.4, y: 7.1, w: 12.5, h: 0.32, fontSize: 11, color: ACCENT2, align: "center" });

// ============== SLIDE 8: Tech Deep Dive ==============
let slide8 = pres.addSlide();
addDarkBg(slide8, "Technical Deep-Dive", "System design decisions and data flow");
const dcards = [
    { t: "⚙️  Revenue Engine Pipeline", b: ["1. Load JSON data via db.py", "2. Pandas: compute contribution margins", "3. Classify velocity by percentile", "4. Apply 2×2 Menu Matrix algorithm", "5. Run Apriori (support 1%, conf 30%)"] },
    { t: "🎙️  Voice Order Pipeline", b: ["1. Audio → POST /voice/transcribe", "2. Whisper base model → raw text", "3. Hinglish parser for quantities (ek=1)", "4. RapidFuzz partial_ratio (≥65%) match", "5. Upsell check → KOT generated"] },
    { t: "📦  Inventory Auto-Depletion", b: ["Each item has a BOM in recipes.json", "On order: item qty × BOM lookup", "Subtract from inventory.json", "Trigger low-stock alerts dynamically"] },
    { t: "🗃️  Data Store Strategy", b: ["JSON file store for portability/MVP", "db.py provides pure read/write abstraction", "Swappable to SQLite for production"] }
];
dcards.forEach((m, i) => {
    card(slide8, 0.4 + (i % 2) * (6.0 + 0.5), 1.38 + Math.floor(i / 2) * (2.7 + 0.2), 6.0, 2.7, m.t, m.b);
});

// ============== SLIDE 9: ML Models ==============
let slide9 = pres.addSlide();
addDarkBg(slide9, "ML Models — Implemented & Proposed", "Currently running + roadmap for future intelligence");

const drawTable = (slide, rows, sy, label, color) => {
    slide.addText(label, { x: 0.4, y: sy - 0.32, w: 4, h: 0.3, bold: true, fontSize: 12, color: color });
    const ws = [2.4, 4.5, 2.5, 1.8];
    const h = 0.36;
    const hdrs = ["Model", "Purpose", "Library", "Status"];
    let hx = 0.4;
    hdrs.forEach((hstr, i) => {
        slide.addShape(pres.ShapeType.rect, { x: hx, y: sy, w: ws[i], h, fill: { color: MID_GREY } });
        slide.addText(hstr, { x: hx + 0.06, y: sy + 0.04, w: ws[i] - 0.1, h: h - 0.08, bold: true, fontSize: 11, color: WHITE });
        hx += ws[i];
    });
    rows.forEach((r, ri) => {
        let rx = 0.4; let ry = sy + (ri + 1) * h;
        let bg = (ri % 2 === 0) ? CARD_BG : "121224";
        r.forEach((c, ci) => {
            let tColor = c.includes("✅") ? GREEN : (c.includes("🔜") ? ACCENT2 : LIGHT_GREY);
            slide.addShape(pres.ShapeType.rect, { x: rx, y: ry, w: ws[ci], h, fill: { color: bg }, line: { color: MID_GREY, width: 0.4 } });
            slide.addText(c, { x: rx + 0.06, y: ry + 0.04, w: ws[ci] - 0.1, h: h - 0.08, fontSize: 10.5, color: tColor });
            rx += ws[ci];
        });
    });
}
drawTable(slide9, [
    ["OpenAI Whisper", "Speech-to-text from audio", "whisper", "✅ Live"],
    ["RapidFuzz", "Fuzzy item matching", "rapidfuzz", "✅ Live"],
    ["Apriori", "Association rule mining", "mlxtend", "✅ Live"],
    ["Menu Matrix", "Category classification", "pandas", "✅ Live"],
], 1.32, "Currently Implemented", GREEN);

drawTable(slide9, [
    ["Prophet / SARIMA", "Demand forecasting", "prophet", "🔜 Proposed"],
    ["Intent Parser", "Complex order logic", "transformers", "🔜 Proposed"],
    ["Collab Filtering", "Personalised upsell", "scikit-surprise", "🔜 Proposed"],
], 4.15, "Proposed / Roadmap", ACCENT2);


// ============== SLIDE 10: References ==============
let slide10 = pres.addSlide();
addDarkBg(slide10, "References", "Libraries, papers, and resources used in this project");
const refs = [
    { t: "[1] OpenAI Whisper", d: "Radford, A. et al. (2022). Robust Speech Recognition...", u: "arxiv.org/abs/2212.04356" },
    { t: "[2] MLxtend", d: "Raschka, S. (2018). MLxtend utilities...", u: "rasbt.github.io/mlxtend/" },
    { t: "[3] RapidFuzz", d: "Bachthaler, M. (2020). Rapid fuzzy string matching...", u: "github.com/maxbachmann/RapidFuzz" },
    { t: "[4] Menu Engineering", d: "Kasavana, M. L. & Smith, D. I. (1982).", u: "Michigan State University" },
    { t: "[5] React / Vite", d: "Meta Open Source (2013–2024).", u: "react.dev" },
];
refs.forEach((r, i) => {
    let cy = 1.38 + i * 0.76;
    slide10.addShape(pres.ShapeType.rect, { x: 0.4, y: cy, w: 12.5, h: 0.7, fill: { color: CARD_BG }, line: { color: MID_GREY, width: 0.4 } });
    slide10.addText(r.t, { x: 0.55, y: cy + 0.05, w: 2.5, h: 0.3, bold: true, fontSize: 11, color: ACCENT });
    slide10.addText(r.d, { x: 3.0, y: cy + 0.04, w: 9.5, h: 0.35, fontSize: 10.5, color: LIGHT_GREY });
    slide10.addText(r.u, { x: 3.0, y: cy + 0.38, w: 9.5, h: 0.28, fontSize: 9.5, color: ACCENT2 });
});

const outPath = path.join(ROOT_DIR, "docs", "Petpooja_Presentation.pptx");
pres.writeFile({ fileName: outPath }).then(() => {
    console.log(`✅ Saved: ${outPath}`);
}).catch(err => {
    console.error(err);
});
