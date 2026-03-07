"""
Module 2 — AI Voice Ordering Copilot
Runs entirely locally: Whisper STT + rapidfuzz matching + regex modifiers.
"""
import json
import os
import re
import uuid
from datetime import datetime

from rapidfuzz import fuzz, process
from modules.db import load_menu as _db_load_menu, load_orders, save_order


# ─── FFmpeg path resolution (Windows WinGet / system) ─────────────────────
import shutil, glob as _glob

def _ensure_ffmpeg_in_path():
    """Add ffmpeg to PATH if not already visible (handles WinGet installs)."""
    if shutil.which("ffmpeg"):
        return  # already on PATH

    # Common WinGet install locations
    search_patterns = [
        os.path.expanduser("~/AppData/Local/Microsoft/WinGet/Packages/**/ffmpeg.exe"),
        "C:/ProgramData/Microsoft/WinGet/Packages/**/ffmpeg.exe",
        "C:/Program Files/ffmpeg/bin/ffmpeg.exe",
        "C:/ffmpeg/bin/ffmpeg.exe",
    ]
    for pattern in search_patterns:
        matches = _glob.glob(pattern, recursive=True)
        if matches:
            ffmpeg_dir = os.path.dirname(matches[0])
            os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
            print(f"[INFO] ffmpeg found at: {ffmpeg_dir}")
            return

    print("[WARN] ffmpeg not found. Install ffmpeg and ensure it's on PATH.")


_ensure_ffmpeg_in_path()

# ─── Whisper model (lazy-loaded) ────────────────────
_whisper_model = None


def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        try:
            import whisper
            _whisper_model = whisper.load_model("base")
            print("[INFO] Whisper 'base' model loaded successfully.")
        except Exception as e:
            print(f"[WARN] Whisper not available: {e}")
            _whisper_model = "UNAVAILABLE"
    return _whisper_model


def _load_menu(restaurant_id: str = "demo") -> list[dict]:
    return _db_load_menu(restaurant_id)


def _load_orders(restaurant_id: str = "demo") -> list[dict]:
    return load_orders(restaurant_id)


def _save_orders(orders: list[dict], restaurant_id: str = "demo"):
    """Persist the full orders list back to DB (upserts each order)."""
    for order in orders:
        save_order(order, restaurant_id)


# ─────────────────────────────────────────────
# 1. Speech-to-Text (Whisper local)
# ─────────────────────────────────────────────
def transcribe_audio(audio_path: str) -> dict:
    """
    Transcribe audio file using OpenAI Whisper (local).
    Returns transcription text and detected language.
    """
    model = _get_whisper_model()
    if model == "UNAVAILABLE":
        return {
            "transcription": "",
            "language": "unknown",
            "error": "Whisper model not available. Install openai-whisper and ffmpeg.",
        }

    result = model.transcribe(audio_path)
    return {
        "transcription": result["text"].strip(),
        "language": result.get("language", "unknown"),
    }


# ─────────────────────────────────────────────
# 2. Intent Recognition & Fuzzy Item Mapping
# ─────────────────────────────────────────────

# Hinglish quantity patterns
QUANTITY_PATTERNS = [
    (r'\b(ek|one|1)\b', 1),
    (r'\b(do|two|2)\b', 2),
    (r'\b(teen|three|3)\b', 3),
    (r'\b(char|four|4)\b', 4),
    (r'\b(paanch|five|5)\b', 5),
    (r'\b(chhe|six|6)\b', 6),
]

# Modifier keywords
SIZE_KEYWORDS = {
    "small": "Small", "medium": "Medium", "large": "Large",
    "regular": "Regular", "chhota": "Small", "bada": "Large",
}
SPICE_KEYWORDS = {
    "mild": "Mild", "medium spicy": "Medium", "spicy": "Spicy",
    "extra spicy": "Extra Spicy", "teekha": "Spicy", "kam mirch": "Mild",
}
EXTRA_KEYWORDS = {
    "extra cheese": "Extra Cheese", "cheese": "Extra Cheese",
    "extra sauce": "Extra Sauce", "sauce": "Extra Sauce",
    "no onion": "No Onion", "no onions": "No Onion",
    "add mayo": "Add Mayo", "mayo": "Add Mayo",
    "butter": "Extra Butter",
}

FILLER_WORDS = [
    "dena", "chahiye", "please", "bhai", "yaar",
    "lao", "de do", "milega", "with",
    "give", "want", "order", "i want", "i need",
    "mujhe", "hume", "can i get", "let me have",
]

# Words to strip from segments before fuzzy matching (modifiers, extras)
STRIP_BEFORE_MATCH = [
    "extra cheese", "extra sauce", "no onion", "no onions",
    "add mayo", "extra spicy", "medium spicy",
    "cheese", "sauce", "mayo", "butter",
    "small", "medium", "large", "regular",
    "mild", "spicy", "chhota", "bada",
    "teekha", "kam mirch", "extra",
]


def _extract_modifiers(text: str) -> list[str]:
    """Extract size, spice, and extra modifiers from text."""
    modifiers = []
    text_lower = text.lower()

    for keyword, value in EXTRA_KEYWORDS.items():
        if keyword in text_lower:
            modifiers.append(value)

    for keyword, value in SIZE_KEYWORDS.items():
        if re.search(rf'\b{keyword}\b', text_lower):
            modifiers.append(f"Size: {value}")
            break

    for keyword, value in SPICE_KEYWORDS.items():
        if keyword in text_lower:
            modifiers.append(f"Spice: {value}")
            break

    return modifiers


def _extract_quantity(segment: str) -> int:
    """Extract quantity from a text segment."""
    for pattern, qty in QUANTITY_PATTERNS:
        if re.search(pattern, segment, re.IGNORECASE):
            return qty
    return 1


def _clean_for_matching(text: str) -> str:
    """Remove modifier/extra keywords so only item name remains."""
    cleaned = text
    for word in STRIP_BEFORE_MATCH:
        cleaned = re.sub(rf'\b{re.escape(word)}\b', ' ', cleaned, flags=re.IGNORECASE)
    # collapse whitespace
    return re.sub(r'\s+', ' ', cleaned).strip()


def parse_order(transcription: str) -> dict:
    """
    Parse transcription text to extract items, quantities, modifiers.
    Uses rapidfuzz to fuzzy-match spoken names against menu.
    """
    menu = _load_menu()
    menu_names = [item["name"] for item in menu]
    menu_lookup = {item["name"].lower(): item for item in menu}

    # Clean transcription
    text = transcription.strip()
    modifiers = _extract_modifiers(text)

    # Remove filler words for better matching
    cleaned = text.lower()
    for filler in FILLER_WORDS:
        cleaned = re.sub(rf'\b{re.escape(filler)}\b', ' ', cleaned)

    # Split by common delimiters (and, aur, comma, plus)
    segments = re.split(r'[,\+]|\band\b|\baur\b', cleaned)

    items = []
    clarifications = []

    for segment in segments:
        segment = segment.strip()
        if not segment or len(segment) < 2:
            continue

        qty = _extract_quantity(segment)

        # Remove quantity words from segment for better matching
        match_text = segment
        for pattern, _ in QUANTITY_PATTERNS:
            match_text = re.sub(pattern, '', match_text, flags=re.IGNORECASE).strip()

        # Remove modifier/extra keywords so only item name remains
        match_text = _clean_for_matching(match_text)

        if not match_text or len(match_text) < 2:
            continue

        # Fuzzy match against menu
        matches = process.extract(
            match_text, menu_names, scorer=fuzz.token_sort_ratio, limit=3
        )

        if not matches:
            continue

        best_name, best_score, _ = matches[0]

        if best_score >= 65:
            item = menu_lookup[best_name.lower()]
            items.append({
                "item_id": item["item_id"],
                "name": item["name"],
                "qty": qty,
                "modifiers": modifiers,
                "price": item["selling_price"],
                "match_confidence": best_score,
            })
        elif best_score >= 45:
            # Ambiguity — return clarification options
            options = [
                {"name": name, "score": score}
                for name, score, _ in matches if score >= 45
            ]
            clarifications.append({
                "spoken_text": match_text,
                "options": options,
                "message": f"Did you mean {' or '.join(o['name'] for o in options)}?",
            })

    total = sum(item["price"] * item["qty"] for item in items)

    return {
        "items": items,
        "total": total,
        "modifiers_detected": modifiers,
        "clarifications": clarifications,
        "needs_clarification": len(clarifications) > 0,
    }


# ─────────────────────────────────────────────
# 3. Upsell Integration (queries Module 1)
# ─────────────────────────────────────────────
def suggest_upsell(order_items: list[dict], restaurant_id: str = "demo") -> dict | None:
    """
    Query combo engine to suggest a relevant upsell.
    Prioritizes Hidden Star items.
    """
    from modules.revenue_engine import combo_recommendations, hidden_stars

    ordered_ids = {item["item_id"] for item in order_items}
    combos = combo_recommendations(restaurant_id)
    hs_items = hidden_stars(restaurant_id)
    hs_ids = {item["item_id"] for item in hs_items}

    menu = _load_menu(restaurant_id)
    name_map = {item["item_id"]: item["name"] for item in menu}
    price_map = {item["item_id"]: item["selling_price"] for item in menu}

    # Look for combos that include ordered items but have additional items to suggest
    for combo in combos:
        combo_ids = {ci["item_id"] for ci in combo["combo_items"]}
        overlap = combo_ids & ordered_ids

        if overlap and combo_ids != ordered_ids:
            missing = combo_ids - ordered_ids
            if missing:
                suggestions = []
                for mid in missing:
                    suggestions.append({
                        "item_id": mid,
                        "name": name_map.get(mid, mid),
                        "price": price_map.get(mid, 0),
                        "is_hidden_star": mid in hs_ids,
                    })
                return {
                    "type": "combo_upsell",
                    "message": f"Great choice! Would you also like to add "
                               f"{', '.join(s['name'] for s in suggestions)} for a combo deal?",
                    "suggested_items": suggestions,
                    "combo_confidence": combo["confidence"],
                }

    # Fallback: suggest a random Hidden Star item
    if hs_items:
        import random
        hs = random.choice(hs_items)
        if hs["item_id"] not in ordered_ids:
            return {
                "type": "hidden_star_promo",
                "message": f"Have you tried our {hs['name']}? "
                           f"It's a customer favourite with great value!",
                "suggested_items": [{
                    "item_id": hs["item_id"],
                    "name": hs["name"],
                    "price": hs.get("selling_price", 0),
                    "is_hidden_star": True,
                }],
                "combo_confidence": None,
            }

    return None


# ─────────────────────────────────────────────
# 4. Order Confirmation & KOT Generation
# ─────────────────────────────────────────────
def confirm_order(
    items: list[dict],
    upsell_accepted: bool = False,
    upsell_items: list[dict] | None = None,
    language_detected: str = "English",
    restaurant_id: str = "demo",
) -> dict:
    """
    Finalize order: build JSON, save, generate KOT.
    """
    order_id = f"ORD-{uuid.uuid4().hex[:6].upper()}"

    all_items = list(items)
    if upsell_accepted and upsell_items:
        for ui in upsell_items:
            all_items.append({
                "item_id": ui["item_id"],
                "name": ui["name"],
                "qty": 1,
                "modifiers": [],
                "price": ui["price"],
            })

    total = sum(item["price"] * item.get("qty", 1) for item in all_items)

    order = {
        "order_id": order_id,
        "timestamp": datetime.now().isoformat(),
        "items": all_items,
        "total": total,
        "upsell_accepted": upsell_accepted,
        "language_detected": language_detected,
        "status": "received",
    }

    # Save to correct restaurant's orders in DB
    orders = _load_orders(restaurant_id)
    orders.append(order)
    _save_orders(orders, restaurant_id)

    kot = generate_kot(order)
    return {"order": order, "kot": kot}


def generate_kot(order: dict) -> str:
    """Generate a Kitchen Order Ticket as printable text."""
    lines = [
        "=" * 40,
        "        KITCHEN ORDER TICKET",
        "=" * 40,
        f"  Order ID : {order['order_id']}",
        f"  Time     : {order['timestamp'][:19]}",
        "-" * 40,
    ]

    for i, item in enumerate(order["items"], 1):
        qty = item.get("qty", 1)
        lines.append(f"  {i}. {item['name']}  x{qty}  ₹{item['price'] * qty}")
        if item.get("modifiers"):
            for mod in item["modifiers"]:
                lines.append(f"     → {mod}")

    lines.append("-" * 40)
    lines.append(f"  TOTAL: ₹{order['total']}")
    lines.append("=" * 40)

    return "\n".join(lines)


def get_all_orders(restaurant_id: str = "demo") -> list[dict]:
    """Return all placed orders for this restaurant."""
    return _load_orders(restaurant_id)
