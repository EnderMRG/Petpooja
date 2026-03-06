"""
Petpooja AI Copilot — FastAPI Backend
Module 1: Revenue Intelligence & Menu Optimization
Module 2: AI Voice Ordering Copilot
"""
import os
import shutil
import tempfile

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from modules import revenue_engine, voice_copilot

app = FastAPI(
    title="Petpooja AI Copilot",
    description="Revenue Intelligence & Voice Ordering for Restaurants",
    version="1.0.0",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════
# Module 1 — Revenue Intelligence Endpoints
# ═══════════════════════════════════════════════

@app.get("/menu/analysis")
def menu_analysis():
    """Full item-level profitability matrix."""
    return {"items": revenue_engine.menu_matrix()}


@app.get("/menu/hidden-stars")
def menu_hidden_stars():
    """Under-promoted high-margin items."""
    return {"hidden_stars": revenue_engine.hidden_stars()}


@app.get("/menu/combos")
def menu_combos():
    """Recommended item bundles from Apriori association rules."""
    return {"combos": revenue_engine.combo_recommendations()}


@app.get("/menu/risks")
def menu_risks():
    """Low-margin high-volume items (Plowhorses)."""
    return {"risk_items": revenue_engine.risk_items()}


@app.get("/menu/price-suggestions")
def menu_price_suggestions():
    """Pricing recommendations for each menu classification."""
    return {"suggestions": revenue_engine.price_suggestions()}


# ═══════════════════════════════════════════════
# Module 2 — Voice Ordering Copilot Endpoints
# ═══════════════════════════════════════════════

class TranscriptionInput(BaseModel):
    transcription: str


class ConfirmOrderInput(BaseModel):
    items: list[dict]
    upsell_accepted: bool = False
    upsell_items: list[dict] | None = None
    language_detected: str = "English"


@app.post("/voice/transcribe")
async def voice_transcribe(file: UploadFile = File(...)):
    """Accept audio file, return transcription via Whisper."""
    if not file.filename:
        raise HTTPException(400, "No file provided")

    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = voice_copilot.transcribe_audio(tmp_path)
        return result
    finally:
        os.unlink(tmp_path)


@app.post("/voice/parse-order")
def voice_parse_order(input: TranscriptionInput):
    """Accept transcription text, return mapped order JSON."""
    parsed = voice_copilot.parse_order(input.transcription)

    # Get upsell suggestion
    if parsed["items"]:
        upsell = voice_copilot.suggest_upsell(parsed["items"])
        parsed["upsell_suggestion"] = upsell

    return parsed


@app.post("/voice/confirm-order")
def voice_confirm_order(input: ConfirmOrderInput):
    """Finalize order, push to PoS, generate KOT."""
    result = voice_copilot.confirm_order(
        items=input.items,
        upsell_accepted=input.upsell_accepted,
        upsell_items=input.upsell_items,
        language_detected=input.language_detected,
    )
    return result


@app.get("/voice/orders")
def voice_orders():
    """List all placed orders."""
    return {"orders": voice_copilot.get_all_orders()}


# ═══════════════════════════════════════════════
# Health check
# ═══════════════════════════════════════════════

@app.get("/")
def root():
    return {
        "service": "Petpooja AI Copilot",
        "status": "running",
        "modules": ["Revenue Intelligence", "Voice Ordering Copilot"],
    }
