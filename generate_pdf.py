"""
Petpooja ML Models - Focused PDF on 4 Proposed Models with Implementation/Training Details
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, HRFlowable,
    Preformatted
)
import os

OUTPUT = os.path.join(r'f:\Petpooja', 'Petpooja_ML_Models_Architecture.pdf')

ORANGE = HexColor('#F97415')
DARK = HexColor('#0F172A')
GRAY = HexColor('#64748B')
LIGHT_GRAY = HexColor('#94A3B8')
SLATE = HexColor('#334155')
GREEN = HexColor('#10B981')
BORDER = HexColor('#E2E8F0')

styles = getSampleStyleSheet()

title_style = ParagraphStyle('Title2', fontSize=28, textColor=DARK, spaceAfter=4,
    alignment=TA_CENTER, fontName='Helvetica-Bold')
subtitle_style = ParagraphStyle('Subtitle2', fontSize=14, textColor=GRAY,
    spaceAfter=20, alignment=TA_CENTER)
section_style = ParagraphStyle('Section', fontSize=16, textColor=DARK,
    fontName='Helvetica-Bold', spaceBefore=16, spaceAfter=8)
subsection_style = ParagraphStyle('SubSection', fontSize=12, textColor=ORANGE,
    fontName='Helvetica-Bold', spaceBefore=14, spaceAfter=4)
sub2_style = ParagraphStyle('Sub2', fontSize=10, textColor=SLATE,
    fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=3)
body_style = ParagraphStyle('Body2', fontSize=10, textColor=SLATE, leading=15, spaceAfter=6)
bullet_style = ParagraphStyle('Bullet2', fontSize=10, textColor=SLATE, leading=15,
    leftIndent=20, bulletIndent=10, spaceBefore=2, spaceAfter=2)
code_style = ParagraphStyle('Code', fontSize=8, textColor=HexColor('#1E293B'),
    fontName='Courier', leading=11, leftIndent=16, spaceBefore=6, spaceAfter=8,
    backColor=HexColor('#F1F5F9'), borderPadding=6)
footer_style = ParagraphStyle('Footer', fontSize=10, textColor=LIGHT_GRAY,
    alignment=TA_CENTER, fontName='Helvetica-Oblique')
toc_style = ParagraphStyle('TOC', fontSize=11, textColor=SLATE, leftIndent=10, spaceBefore=3)
field_style = ParagraphStyle('Field', fontSize=9, textColor=SLATE, leading=13, spaceAfter=2)


def B(label, text):
    """Bullet point"""
    return Paragraph(text, bullet_style, bulletText='-')

def code_block(code_text):
    return Preformatted(code_text, code_style)


def build_pdf():
    doc = SimpleDocTemplate(OUTPUT, pagesize=A4,
        topMargin=2*cm, bottomMargin=2*cm, leftMargin=2*cm, rightMargin=2*cm)
    story = []

    # ---- TITLE ----
    story.append(Spacer(1, 50))
    story.append(Paragraph('Petpooja AI Copilot', title_style))
    story.append(Paragraph('ML Model Implementation & Training Guide', subtitle_style))
    story.append(HRFlowable(width='40%', color=ORANGE, thickness=2))
    story.append(Spacer(1, 16))
    story.append(Paragraph(
        'A comprehensive guide covering 4 proposed ML models for the Petpooja platform: '
        'how each model works, the data it requires, step-by-step training procedures, '
        'and integration strategies for production deployment.',
        ParagraphStyle('CB', parent=body_style, alignment=TA_CENTER)))
    story.append(Spacer(1, 30))

    # TOC
    story.append(Paragraph('Contents', ParagraphStyle('T', fontSize=14, textColor=DARK, fontName='Helvetica-Bold')))
    story.append(HRFlowable(width='20%', color=ORANGE, thickness=1.5))
    story.append(Spacer(1, 8))
    for t in [
        '1.  Demand Forecasting (Time-Series Prediction)',
        '2.  NLP Intent Parser (LLM-Based Order Understanding)',
        '3.  Collaborative Filtering (Personalized Upsell)',
        '4.  Anomaly Detection (Revenue & Inventory)',
        '5.  Summary & Technology Stack',
    ]:
        story.append(Paragraph(t, toc_style))

    # ===================================================================
    # MODEL 1: DEMAND FORECASTING
    # ===================================================================
    story.append(PageBreak())
    story.append(Paragraph('1. Demand Forecasting', section_style))
    story.append(HRFlowable(width='100%', color=ORANGE, thickness=1))
    story.append(Spacer(1, 6))

    story.append(Paragraph('<b>Goal:</b> Predict how many units of each menu item will be sold '
        'in the next N hours/days. This enables proactive inventory purchasing and reduces '
        'food waste by 15-30%.', body_style))

    story.append(Paragraph('1.1 How It Works', subsection_style))
    story.append(Paragraph(
        'Time-series forecasting models analyze historical order patterns to predict '
        'future demand. The model learns seasonal trends (weekday vs weekend, lunch vs dinner), '
        'growth patterns, and external factors like holidays or weather.', body_style))
    for b in [
        'Input: Timestamped order history (item_id, quantity, datetime)',
        'Output: Predicted quantity per item for next 1-7 days with confidence intervals',
        'Algorithm: Facebook Prophet (recommended) or LSTM neural network (advanced)',
        'Retraining: Daily on a rolling 90-day window',
    ]:
        story.append(B('', b))

    story.append(Paragraph('1.2 Data Requirements', subsection_style))
    story.append(Paragraph(
        'The model requires a minimum of 30 days of historical order data for meaningful '
        'predictions. More data (6+ months) significantly improves accuracy.', body_style))

    story.append(Paragraph('<b>Required Data Schema (orders.json):</b>', field_style))
    story.append(code_block(
        '{\n'
        '  "order_id": "ORD-20260301-001",\n'
        '  "timestamp": "2026-03-01T12:34:00",\n'
        '  "items": [\n'
        '    { "item_id": "M001", "name": "Classic Veg Burger", "qty": 2 },\n'
        '    { "item_id": "M019", "name": "French Fries", "qty": 1 }\n'
        '  ]\n'
        '}'
    ))

    story.append(Paragraph('<b>Feature Engineering - Derived Features:</b>', field_style))
    for b in [
        'day_of_week (0=Mon, 6=Sun) - captures weekly patterns',
        'hour_of_day (0-23) - captures lunch/dinner rush',
        'is_weekend (boolean) - weekend traffic is typically 30-40% higher',
        'is_holiday (boolean) - from a public holiday calendar',
        'rolling_avg_7d - 7-day rolling average per item',
        'weather_temp (optional) - from weather API, affects beverage sales',
    ]:
        story.append(B('', b))

    story.append(Paragraph('1.3 Step-by-Step Training', subsection_style))

    story.append(Paragraph('<b>Step 1: Install Dependencies</b>', sub2_style))
    story.append(code_block('pip install prophet pandas numpy scikit-learn'))

    story.append(Paragraph('<b>Step 2: Prepare Training Data</b>', sub2_style))
    story.append(code_block(
        'import pandas as pd\n'
        'import json\n\n'
        '# Load historical orders\n'
        'with open("data/orders.json") as f:\n'
        '    orders = json.load(f)\n\n'
        '# Flatten to daily item counts\n'
        'rows = []\n'
        'for order in orders:\n'
        '    dt = pd.to_datetime(order["timestamp"]).date()\n'
        '    for item in order["items"]:\n'
        '        rows.append({"ds": dt, "item_id": item["item_id"],\n'
        '                     "y": item["qty"]})\n\n'
        'df = pd.DataFrame(rows)\n'
        'daily = df.groupby(["ds", "item_id"])["y"].sum().reset_index()'
    ))

    story.append(Paragraph('<b>Step 3: Train a Prophet Model Per Item</b>', sub2_style))
    story.append(code_block(
        'from prophet import Prophet\n'
        'import pickle\n\n'
        'models = {}\n'
        'for item_id in daily["item_id"].unique():\n'
        '    item_data = daily[daily["item_id"] == item_id][["ds", "y"]]\n'
        '    \n'
        '    model = Prophet(\n'
        '        daily_seasonality=True,\n'
        '        weekly_seasonality=True,\n'
        '        yearly_seasonality=False,  # need 2+ years\n'
        '        changepoint_prior_scale=0.05\n'
        '    )\n'
        '    model.fit(item_data)\n'
        '    models[item_id] = model\n\n'
        '# Save all models\n'
        'with open("models/demand_models.pkl", "wb") as f:\n'
        '    pickle.dump(models, f)'
    ))

    story.append(Paragraph('<b>Step 4: Generate Predictions</b>', sub2_style))
    story.append(code_block(
        '# Predict next 7 days for each item\n'
        'for item_id, model in models.items():\n'
        '    future = model.make_future_dataframe(periods=7)\n'
        '    forecast = model.predict(future)\n'
        '    \n'
        '    # Get predicted values\n'
        '    pred = forecast.tail(7)[["ds", "yhat", "yhat_lower", "yhat_upper"]]\n'
        '    print(f"{item_id}: {pred.to_dict(orient=\'records\')}")'
    ))

    story.append(Paragraph('<b>Step 5: Connect to Inventory</b>', sub2_style))
    story.append(code_block(
        '# For each predicted item demand, calculate ingredient needs\n'
        'recipes = load_recipes()  # from recipes.json\n'
        'inventory = load_inventory()  # from inventory.json\n\n'
        'for item_id, predicted_qty in predictions.items():\n'
        '    recipe = recipes.get(item_id, {})\n'
        '    for ing in recipe.get("ingredients", []):\n'
        '        needed = ing["qty"] * predicted_qty\n'
        '        current = get_stock(ing["ingredient_id"])\n'
        '        if current < needed:\n'
        '            alert(f"Order {needed - current} {ing[\'unit\']}'
        ' of {ing[\'name\']}")'
    ))

    story.append(Paragraph('1.4 Integration with Petpooja', subsection_style))
    for b in [
        'Create endpoint: GET /forecast/{item_id}?days=7',
        'Run daily cron job to retrain models at 2 AM',
        'Display predictions on Dashboard with confidence bands',
        'Auto-generate purchase orders when predicted demand > current stock',
    ]:
        story.append(B('', b))

    story.append(Paragraph('1.5 Evaluation Metrics', subsection_style))
    for b in [
        'MAE (Mean Absolute Error): Target < 3 units per item per day',
        'MAPE (Mean Absolute % Error): Target < 15%',
        'Coverage: % of actual values within prediction interval (target > 90%)',
    ]:
        story.append(B('', b))

    # ===================================================================
    # MODEL 2: NLP INTENT PARSER
    # ===================================================================
    story.append(PageBreak())
    story.append(Paragraph('2. NLP Intent Parser', section_style))
    story.append(HRFlowable(width='100%', color=ORANGE, thickness=1))
    story.append(Spacer(1, 6))

    story.append(Paragraph('<b>Goal:</b> Replace the current regex + fuzzy-match order parsing '
        'with an LLM that understands complex, multi-turn, natural language orders '
        'including corrections and modifications.', body_style))

    story.append(Paragraph('2.1 How It Works', subsection_style))
    story.append(Paragraph(
        'An LLM receives the transcribed voice text along with the restaurant menu context. '
        'It extracts structured order data (items, quantities, modifiers) using prompt engineering '
        'with structured JSON output. This handles ambiguity, corrections, and slang.', body_style))
    for b in [
        'Input: Transcribed text + Full menu catalog as context',
        'Output: Structured JSON: { items: [...], total, language }',
        'Algorithm: Google Gemma 2B (local) or OpenAI GPT-4o-mini (API)',
        'No training needed: Uses prompt engineering (zero-shot or few-shot)',
    ]:
        story.append(B('', b))

    story.append(Paragraph('2.2 Why LLM Over Regex + Fuzzy Match?', subsection_style))
    for b in [
        'Current system fails on: "give me 2 burgers, actually make it 3"',
        'Cannot handle: "same thing as last order but no onions"',
        'Struggles with: "one margherita and one pepperoni, extra cheese on both"',
        'LLM understands context, corrections, quantities-in-words, and modifiers naturally',
    ]:
        story.append(B('', b))

    story.append(Paragraph('2.3 Implementation Strategy', subsection_style))

    story.append(Paragraph('<b>Option A: Local Model (Gemma 2B / Llama 3.2)</b>', sub2_style))
    story.append(code_block(
        'pip install transformers torch accelerate'
    ))
    story.append(code_block(
        'from transformers import AutoTokenizer, AutoModelForCausalLM\n'
        'import json\n\n'
        '# Load model (first run downloads ~5GB)\n'
        'model_name = "google/gemma-2b-it"\n'
        'tokenizer = AutoTokenizer.from_pretrained(model_name)\n'
        'model = AutoModelForCausalLM.from_pretrained(model_name)\n\n'
        'def parse_order_llm(transcription: str, menu_items: list) -> dict:\n'
        '    menu_str = "\\n".join(\n'
        '        f"- {m[\'item_id\']}: {m[\'name\']} (Rs {m[\'selling_price\']})"\n'
        '        for m in menu_items\n'
        '    )\n\n'
        '    prompt = f"""You are a restaurant order parser.\n'
        'Given the customer\'s spoken order and the menu, extract:\n'
        '- items: list of {{item_id, name, qty, modifiers, price}}\n'
        '- total: sum of all item prices * quantities\n\n'
        'MENU:\\n{menu_str}\\n\\n'
        'CUSTOMER ORDER: "{transcription}"\\n\\n'
        'Respond ONLY with valid JSON."""\n\n'
        '    inputs = tokenizer(prompt, return_tensors="pt")\n'
        '    outputs = model.generate(**inputs, max_new_tokens=512)\n'
        '    response = tokenizer.decode(outputs[0], skip_special_tokens=True)\n'
        '    return json.loads(response)'
    ))

    story.append(Paragraph('<b>Option B: Cloud API (GPT-4o-mini / Gemini)</b>', sub2_style))
    story.append(code_block(
        'import openai\n'
        'import json\n\n'
        'client = openai.OpenAI(api_key="sk-...")\n\n'
        'def parse_order_api(transcription: str, menu_items: list) -> dict:\n'
        '    menu_str = "\\n".join(\n'
        '        f"- {m[\'item_id\']}: {m[\'name\']} (Rs {m[\'selling_price\']})"\n'
        '        for m in menu_items\n'
        '    )\n\n'
        '    response = client.chat.completions.create(\n'
        '        model="gpt-4o-mini",\n'
        '        response_format={"type": "json_object"},\n'
        '        messages=[\n'
        '            {"role": "system", "content": "You are a restaurant order parser.\\n"\n'
        '                f"MENU:\\n{menu_str}"},\n'
        '            {"role": "user", "content": transcription}\n'
        '        ],\n'
        '        temperature=0.1\n'
        '    )\n'
        '    return json.loads(response.choices[0].message.content)'
    ))

    story.append(Paragraph('2.4 Fine-Tuning (Optional, Advanced)', subsection_style))
    story.append(Paragraph(
        'For higher accuracy, fine-tune a small model on your own order transcription data:', body_style))

    story.append(Paragraph('<b>Step 1: Collect Training Data</b>', sub2_style))
    story.append(code_block(
        '# training_data.jsonl (one example per line)\n'
        '{"input": "2 paneer burgers extra cheese and a cold coffee",\n'
        ' "output": {"items": [\n'
        '   {"item_id": "M002", "name": "Paneer Burger", "qty": 2,\n'
        '    "modifiers": ["extra cheese"]},\n'
        '   {"item_id": "M027", "name": "Cold Coffee", "qty": 1,\n'
        '    "modifiers": []}\n'
        ' ]}}'
    ))

    story.append(Paragraph('<b>Step 2: Fine-Tune with LoRA</b>', sub2_style))
    story.append(code_block(
        'pip install peft trl datasets\n\n'
        '# Use QLoRA for memory-efficient fine-tuning\n'
        '# Requires: 100-500 labeled examples\n'
        '# Training time: ~30 min on single GPU\n'
        '# Result: 95%+ accuracy on order parsing'
    ))

    story.append(Paragraph('2.5 Evaluation', subsection_style))
    for b in [
        'Exact Match Rate: % of orders parsed with 100% correct items (target > 90%)',
        'Item-Level F1 Score: Precision/recall for individual item extraction (target > 0.95)',
        'Modifier Accuracy: % of modifiers correctly captured (target > 85%)',
        'Latency: Response time < 2 seconds for local, < 1 second for API',
    ]:
        story.append(B('', b))

    # ===================================================================
    # MODEL 3: COLLABORATIVE FILTERING
    # ===================================================================
    story.append(PageBreak())
    story.append(Paragraph('3. Collaborative Filtering', section_style))
    story.append(HRFlowable(width='100%', color=ORANGE, thickness=1))
    story.append(Spacer(1, 6))

    story.append(Paragraph('<b>Goal:</b> Learn customer ordering patterns to suggest '
        'personalized upsells. Instead of generic combo recommendations, recommend items '
        'based on what similar customers ordered.', body_style))

    story.append(Paragraph('3.1 How It Works', subsection_style))
    story.append(Paragraph(
        'Collaborative Filtering (CF) builds a user-item interaction matrix from order history. '
        'It finds customers with similar ordering patterns and recommends items that similar '
        'customers liked but the current customer has not tried yet.', body_style))
    for b in [
        'Input: Customer-Item interaction matrix (customer_id x item_id = frequency)',
        'Output: Top-K recommended items per customer with probability scores',
        'Algorithm: SVD (Surprise library) or Neural CF (TensorFlow)',
        'Retraining: Weekly on full order history',
    ]:
        story.append(B('', b))

    story.append(Paragraph('3.2 Data Requirements', subsection_style))
    story.append(Paragraph(
        'Requires customer identification (phone number, loyalty ID, or table number with session). '
        'Minimum: 500 unique customers with 3+ orders each.', body_style))

    story.append(Paragraph('<b>User-Item Matrix Example:</b>', field_style))
    story.append(code_block(
        '              M001  M003  M009  M019  M027  ...\n'
        'Customer_001   5     0     3     4     2\n'
        'Customer_002   0     7     1     6     0\n'
        'Customer_003   3     2     0     1     5\n'
        '...\n'
        '# Values = number of times customer ordered that item'
    ))

    story.append(Paragraph('3.3 Step-by-Step Training', subsection_style))

    story.append(Paragraph('<b>Step 1: Install Dependencies</b>', sub2_style))
    story.append(code_block('pip install scikit-surprise pandas numpy'))

    story.append(Paragraph('<b>Step 2: Prepare Interaction Data</b>', sub2_style))
    story.append(code_block(
        'import pandas as pd\n'
        'from surprise import Dataset, Reader, SVD\n'
        'from surprise.model_selection import cross_validate\n\n'
        '# Build user-item-rating dataframe\n'
        'rows = []\n'
        'for order in orders:\n'
        '    cust_id = order.get("customer_id", "anonymous")\n'
        '    for item in order["items"]:\n'
        '        rows.append({\n'
        '            "user": cust_id,\n'
        '            "item": item["item_id"],\n'
        '            "rating": item["qty"]  # frequency as implicit rating\n'
        '        })\n\n'
        'df = pd.DataFrame(rows)\n'
        'df = df.groupby(["user", "item"])["rating"].sum().reset_index()\n'
        '# Normalize to 1-5 scale\n'
        'df["rating"] = df["rating"].clip(1, 5)'
    ))

    story.append(Paragraph('<b>Step 3: Train SVD Model</b>', sub2_style))
    story.append(code_block(
        '# Load into Surprise format\n'
        'reader = Reader(rating_scale=(1, 5))\n'
        'data = Dataset.load_from_df(df[["user", "item", "rating"]], reader)\n\n'
        '# Train SVD model\n'
        'algo = SVD(n_factors=50, n_epochs=30, lr_all=0.005, reg_all=0.02)\n'
        'trainset = data.build_full_trainset()\n'
        'algo.fit(trainset)\n\n'
        '# Cross-validate\n'
        'results = cross_validate(algo, data, measures=["RMSE", "MAE"], cv=5)\n'
        'print(f"RMSE: {results[\'test_rmse\'].mean():.3f}")\n'
        'print(f"MAE:  {results[\'test_mae\'].mean():.3f}")'
    ))

    story.append(Paragraph('<b>Step 4: Generate Recommendations</b>', sub2_style))
    story.append(code_block(
        'def get_recommendations(customer_id, menu_items, top_k=5):\n'
        '    """Get top-K recommendations for a customer."""\n'
        '    # Get items this customer has NOT ordered\n'
        '    ordered = set(df[df["user"] == customer_id]["item"])\n'
        '    candidates = [m["item_id"] for m in menu_items\n'
        '                  if m["item_id"] not in ordered]\n'
        '    \n'
        '    # Predict scores\n'
        '    predictions = [\n'
        '        (iid, algo.predict(customer_id, iid).est)\n'
        '        for iid in candidates\n'
        '    ]\n'
        '    predictions.sort(key=lambda x: x[1], reverse=True)\n'
        '    return predictions[:top_k]'
    ))

    story.append(Paragraph('<b>Step 5: Cold-Start Fallback</b>', sub2_style))
    story.append(code_block(
        'def get_popular_items(top_k=5):\n'
        '    """Fallback for new customers with no history."""\n'
        '    popularity = df.groupby("item")["rating"].sum()\n'
        '    return popularity.nlargest(top_k).index.tolist()'
    ))

    story.append(Paragraph('3.4 Integration with Petpooja', subsection_style))
    for b in [
        'Create endpoint: GET /recommend/{customer_id}?top_k=5',
        'Add customer_id field to order flow (phone number or loyalty card)',
        'Show personalized upsell in Voice Orders instead of generic Apriori combos',
        'Fallback to popularity-based recommendations for new customers',
        'Weekly retraining via cron job with latest order data',
    ]:
        story.append(B('', b))

    story.append(Paragraph('3.5 Evaluation Metrics', subsection_style))
    for b in [
        'RMSE: Root Mean Square Error (target < 1.0 on 1-5 scale)',
        'Hit Rate@K: % of test orders where the actual item appears in top-K (target > 30%)',
        'NDCG@K: Normalized Discounted Cumulative Gain (target > 0.4)',
        'Coverage: % of catalog items ever recommended (target > 60%)',
    ]:
        story.append(B('', b))

    # ===================================================================
    # MODEL 4: ANOMALY DETECTION
    # ===================================================================
    story.append(PageBreak())
    story.append(Paragraph('4. Anomaly Detection', section_style))
    story.append(HRFlowable(width='100%', color=ORANGE, thickness=1))
    story.append(Spacer(1, 6))

    story.append(Paragraph('<b>Goal:</b> Detect unusual patterns in revenue, orders, and '
        'inventory in real-time. Catch fraud, theft, waste, and operational issues '
        'before they become costly problems.', body_style))

    story.append(Paragraph('4.1 How It Works', subsection_style))
    story.append(Paragraph(
        'Anomaly detection models learn "normal" behavior from historical data and flag '
        'deviations. Two approaches are used: statistical (Z-score) for simple threshold alerts, '
        'and Isolation Forest for complex multi-dimensional anomalies.', body_style))

    story.append(Paragraph('<b>Types of Anomalies Detected:</b>', field_style))
    for b in [
        'Revenue: Sudden revenue drop > 30% compared to same day last week',
        'Orders: Unusually high void/cancel rate (potential fraud)',
        'Inventory: Ingredient depleting faster than order volume justifies (theft/waste)',
        'Timing: Orders placed outside business hours (system misuse)',
        'Pricing: Discounts applied without authorization patterns',
    ]:
        story.append(B('', b))

    story.append(Paragraph('4.2 Data Requirements', subsection_style))
    for b in [
        'Hourly revenue totals (at least 30 days)',
        'Order-level data with timestamps, void status, discount flags',
        'Inventory movement logs (depletion events with timestamps)',
        'Minimum: 2 weeks of clean data to establish baseline patterns',
    ]:
        story.append(B('', b))

    story.append(Paragraph('4.3 Step-by-Step Training', subsection_style))

    story.append(Paragraph('<b>Step 1: Install Dependencies</b>', sub2_style))
    story.append(code_block('pip install scikit-learn pandas numpy'))

    story.append(Paragraph('<b>Step 2: Statistical Anomaly Detection (Z-Score)</b>', sub2_style))
    story.append(code_block(
        'import numpy as np\n'
        'import pandas as pd\n\n'
        'def detect_revenue_anomalies(daily_revenue, threshold=2.5):\n'
        '    """Flag days where revenue deviates > 2.5 std from mean."""\n'
        '    mean = daily_revenue.mean()\n'
        '    std = daily_revenue.std()\n'
        '    z_scores = (daily_revenue - mean) / std\n'
        '    \n'
        '    anomalies = daily_revenue[abs(z_scores) > threshold]\n'
        '    return [\n'
        '        {"date": str(date), "revenue": float(val),\n'
        '         "z_score": float(z), "type": "low" if z < 0 else "high"}\n'
        '        for date, val, z in zip(\n'
        '            anomalies.index, anomalies.values,\n'
        '            z_scores[abs(z_scores) > threshold]\n'
        '        )\n'
        '    ]'
    ))

    story.append(Paragraph('<b>Step 3: Isolation Forest (Multi-Dimensional)</b>', sub2_style))
    story.append(code_block(
        'from sklearn.ensemble import IsolationForest\n'
        'from sklearn.preprocessing import StandardScaler\n\n'
        '# Feature matrix: [hourly_revenue, order_count, avg_order_value,\n'
        '#                   void_rate, discount_rate, inventory_depletion]\n'
        'features = build_feature_matrix(orders, inventory_logs)\n\n'
        '# Scale features\n'
        'scaler = StandardScaler()\n'
        'X_scaled = scaler.fit_transform(features)\n\n'
        '# Train Isolation Forest\n'
        'model = IsolationForest(\n'
        '    n_estimators=200,\n'
        '    contamination=0.05,  # expect ~5% anomalies\n'
        '    max_features=0.8,\n'
        '    random_state=42\n'
        ')\n'
        'model.fit(X_scaled)\n\n'
        '# Predict: -1 = anomaly, 1 = normal\n'
        'predictions = model.predict(X_scaled)\n'
        'anomaly_scores = model.decision_function(X_scaled)\n'
        'print(f"Anomalies found: {(predictions == -1).sum()}")'
    ))

    story.append(Paragraph('<b>Step 4: Real-Time Scoring</b>', sub2_style))
    story.append(code_block(
        'import pickle\n\n'
        '# Save model + scaler\n'
        'with open("models/anomaly_model.pkl", "wb") as f:\n'
        '    pickle.dump({"model": model, "scaler": scaler}, f)\n\n'
        'def score_current_hour(current_features):\n'
        '    """Score current hour for anomalies."""\n'
        '    with open("models/anomaly_model.pkl", "rb") as f:\n'
        '        bundle = pickle.load(f)\n'
        '    \n'
        '    X = bundle["scaler"].transform([current_features])\n'
        '    is_anomaly = bundle["model"].predict(X)[0] == -1\n'
        '    score = bundle["model"].decision_function(X)[0]\n'
        '    \n'
        '    if is_anomaly:\n'
        '        return {\n'
        '            "alert": True,\n'
        '            "severity": "HIGH" if score < -0.3 else "MEDIUM",\n'
        '            "score": float(score),\n'
        '            "message": classify_anomaly(current_features)\n'
        '        }\n'
        '    return {"alert": False}'
    ))

    story.append(Paragraph('<b>Step 5: Anomaly Classification</b>', sub2_style))
    story.append(code_block(
        'def classify_anomaly(features):\n'
        '    """Determine the root cause of the anomaly."""\n'
        '    revenue, orders, aov, voids, discounts, depletion = features\n'
        '    \n'
        '    if voids > historical_void_mean * 2:\n'
        '        return "High void rate detected - possible fraud"\n'
        '    if depletion > expected_depletion * 1.5:\n'
        '        return "Excessive inventory depletion - check for waste"\n'
        '    if revenue < historical_revenue_mean * 0.6:\n'
        '        return "Significant revenue drop - investigate operations"\n'
        '    if discounts > historical_discount_mean * 2:\n'
        '        return "Unusual discount pattern - verify authorization"\n'
        '    return "General anomaly detected - manual review needed"'
    ))

    story.append(Paragraph('4.4 Integration with Petpooja', subsection_style))
    for b in [
        'Create endpoint: GET /alerts/anomalies?hours=24',
        'Run scoring every hour via APScheduler background task',
        'Display alerts on Dashboard with severity badges (HIGH/MEDIUM/LOW)',
        'Send push notifications for HIGH severity anomalies',
        'Weekly retraining on rolling 60-day window',
    ]:
        story.append(B('', b))

    story.append(Paragraph('4.5 Evaluation Metrics', subsection_style))
    for b in [
        'Precision: % of flagged anomalies that are true anomalies (target > 80%)',
        'Recall: % of actual anomalies caught (target > 90%)',
        'False Positive Rate: target < 5% to avoid alert fatigue',
        'Time to Detect: anomaly flagged within 1 hour of occurrence',
    ]:
        story.append(B('', b))

    # ===================================================================
    # SECTION 5: SUMMARY
    # ===================================================================
    story.append(PageBreak())
    story.append(Paragraph('5. Summary & Technology Stack', section_style))
    story.append(HRFlowable(width='100%', color=ORANGE, thickness=1))
    story.append(Spacer(1, 8))

    # Summary table
    from reportlab.platypus import Table, TableStyle
    from reportlab.lib import colors

    table_data = [
        ['Model', 'Algorithm', 'Library', 'Training Data', 'Priority'],
        ['Demand\nForecasting', 'Prophet /\nLSTM', 'prophet\ntensorflow', '30+ days\norder history', 'HIGH'],
        ['NLP Intent\nParser', 'LLM\n(Gemma/GPT)', 'transformers\nopenai', 'Menu catalog\n+ prompt', 'HIGH'],
        ['Collaborative\nFiltering', 'SVD / Neural\nCF', 'surprise\ntensorflow', '500+ customers\n3+ orders each', 'MEDIUM'],
        ['Anomaly\nDetection', 'Isolation\nForest', 'scikit-learn', '14+ days\noperational data', 'MEDIUM'],
    ]

    t = Table(table_data, colWidths=[90, 70, 70, 90, 60])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ORANGE),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('LEADING', (0, 0), (-1, -1), 11),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t)

    story.append(Spacer(1, 16))
    story.append(Paragraph('<b>Full Technology Stack Required:</b>', sub2_style))
    for b in [
        'Core: Python 3.12, FastAPI, pandas, numpy',
        'Speech: OpenAI Whisper (already implemented)',
        'NLP: transformers + torch (local) or openai SDK (cloud)',
        'Forecasting: prophet (Facebook) or tensorflow',
        'Recommendations: scikit-surprise',
        'Anomaly Detection: scikit-learn (IsolationForest)',
        'Scheduling: APScheduler or Celery for periodic retraining',
        'Model Storage: pickle files or MLflow for versioning',
        'Hardware: GPU recommended for NLP model (NVIDIA T4 minimum)',
    ]:
        story.append(B('', b))

    # Footer
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width='100%', color=ORANGE, thickness=1.5))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        'Petpooja AI Copilot - ML Model Implementation Guide | Auto-generated',
        footer_style))

    doc.build(story)
    print(f'PDF generated successfully: {OUTPUT}')

if __name__ == '__main__':
    build_pdf()
