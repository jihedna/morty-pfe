from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "reports" / "REMAX_Smile_AI_ML_Report.pdf"
LOGO = ROOT / "frontend" / "public" / "remax-logo.png"

RED = colors.HexColor("#e30613")
BLUE = colors.HexColor("#0b3b8f")
NAVY = colors.HexColor("#10243e")
LIGHT = colors.HexColor("#f3f6fb")
MUTED = colors.HexColor("#52637a")


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#dce3ed"))
    canvas.line(18 * mm, 14 * mm, 192 * mm, 14 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 9 * mm, "RE/MAX Smile AI — AI & Machine Learning Summary")
    canvas.drawRightString(192 * mm, 9 * mm, f"Page {doc.page}")
    canvas.restoreState()


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="ReportTitle", parent=styles["Title"], fontName="Helvetica-Bold",
    fontSize=25, leading=29, textColor=NAVY, alignment=TA_CENTER, spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="Subtitle", parent=styles["Normal"], fontSize=11, leading=16,
    textColor=MUTED, alignment=TA_CENTER, spaceAfter=18,
))
styles.add(ParagraphStyle(
    name="H1x", parent=styles["Heading1"], fontName="Helvetica-Bold",
    fontSize=17, leading=21, textColor=BLUE, spaceBefore=3, spaceAfter=9,
))
styles.add(ParagraphStyle(
    name="H2x", parent=styles["Heading2"], fontName="Helvetica-Bold",
    fontSize=12, leading=15, textColor=NAVY, spaceBefore=8, spaceAfter=5,
))
styles.add(ParagraphStyle(
    name="Bodyx", parent=styles["BodyText"], fontSize=9.5, leading=14,
    textColor=colors.HexColor("#25364d"), spaceAfter=7,
))
styles.add(ParagraphStyle(
    name="Bulletx", parent=styles["BodyText"], fontSize=9.2, leading=13,
    textColor=colors.HexColor("#25364d"), leftIndent=12, firstLineIndent=-7, spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="Callout", parent=styles["BodyText"], fontSize=9.2, leading=13,
    textColor=NAVY, backColor=LIGHT, borderColor=colors.HexColor("#d8e1ef"),
    borderWidth=0.7, borderPadding=8, spaceBefore=5, spaceAfter=9,
))
styles.add(ParagraphStyle(
    name="TableHeader", parent=styles["BodyText"], fontName="Helvetica-Bold",
    fontSize=7.6, leading=9.2, textColor=colors.white,
))
styles.add(ParagraphStyle(
    name="TableCell", parent=styles["BodyText"], fontName="Helvetica",
    fontSize=7.3, leading=9.2, textColor=colors.HexColor("#25364d"),
))


def bullet(text):
    return Paragraph(f"• {text}", styles["Bulletx"])


def model_table(rows, widths):
    wrapped_rows = []
    for row_index, row in enumerate(rows):
        style = styles["TableHeader"] if row_index == 0 else styles["TableCell"]
        wrapped_rows.append([Paragraph(str(cell), style) for cell in row])
    table = Table(wrapped_rows, colWidths=widths, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#ccd6e5")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


story = []
if LOGO.exists():
    logo = Image(str(LOGO), width=29 * mm, height=36.5 * mm)
    logo.hAlign = "CENTER"
    story.extend([logo, Spacer(1, 4 * mm)])

story.append(Paragraph("AI & Machine Learning in<br/>RE/MAX Smile AI", styles["ReportTitle"]))
story.append(Paragraph(
    "Concise technical report — models, training approach, application, and limitations",
    styles["Subtitle"],
))
story.append(Paragraph("1. Project approach", styles["H1x"]))
story.append(Paragraph(
    "The project combines machine-learning-ready pipelines with deterministic business rules. "
    "This hybrid architecture keeps the platform operational when training data is insufficient: "
    "an ML artifact is used when available, otherwise a transparent fallback produces a safe result.",
    styles["Bodyx"],
))
story.append(Paragraph(
    "<b>Current deployment status:</b> the repository contains no saved <i>.joblib</i> training artifacts. "
    "Therefore, the actively deployed learning component is the runtime content-based KNN agent–property matcher. "
    "Lead conversion, price estimation, and personalized recommendation pipelines are implemented, but use their "
    "fallback behavior until sufficient data is collected and the training command is executed.",
    styles["Callout"],
))

story.append(Paragraph("2. Deployed model: agent–property KNN matcher", styles["H1x"]))
story.append(Paragraph(
    "When a manager creates an agent, the system recommends the most suitable listings from the agent profile. "
    "It first applies strict eligibility rules for property type, exact territory (city + governorate), and minimum/maximum TND budget. "
    "Only eligible properties enter the K-Nearest Neighbors ranking stage.",
    styles["Bodyx"],
))
story.append(bullet("Categorical features: property type and territory, encoded with OneHotEncoder."))
story.append(bullet("Numerical feature: listing price, normalized with StandardScaler."))
story.append(bullet("Algorithm: scikit-learn NearestNeighbors, brute-force Euclidean distance."))
story.append(bullet("Query profile: all selected property-type/territory combinations at the agent budget midpoint."))
story.append(bullet("Output: ranked properties, a normalized match score, and human-readable reasons."))
story.append(Paragraph(
    "This model is fitted in memory against the current eligible catalog each time recommendations are calculated. "
    "It does not require historical labels; its purpose is profile similarity and allocation support, not price prediction.",
    styles["Bodyx"],
))

story.append(PageBreak())
story.append(Paragraph("3. Implemented training pipelines", styles["H1x"]))
story.append(Paragraph(
    "The backend includes reproducible scikit-learn pipelines. Categorical values are one-hot encoded, numerical values are standardized, "
    "and each supervised model uses an 80/20 train–validation split with a fixed random seed. The best candidate is saved with joblib together "
    "with metadata, evaluation metrics, feature schema, and a model card.",
    styles["Bodyx"],
))

rows = [
    ["Model", "Algorithms compared", "Main inputs", "Selection / fallback"],
    ["Sale & rent price estimator", "Gradient Boosting Regressor; Random Forest Regressor",
     "Location, type, area, rooms, floors, year, furnishing and property features",
     "Best R²; fallback: median price/m² from comparable listings"],
    ["Lead conversion predictor", "Gradient Boosting Classifier; Random Forest Classifier",
     "Request type, budget, location, urgency, engagement, appointments and conversations",
     "Best ROC-AUC; fallback: rule-based conversion heuristic"],
    ["Client property recommender", "Content-based KNN (cosine); Truncated SVD collaborative filtering",
     "Property attributes plus weighted views, favorites, messages and appointments",
     "Best hit-rate@5; fallback: popularity-based ranking"],
]
story.append(model_table(rows, [33 * mm, 42 * mm, 57 * mm, 45 * mm]))

story.append(Paragraph("Price estimation", styles["H2x"]))
story.append(Paragraph(
    "Separate sale and rent regressors are supported. Gradient Boosting uses 200 estimators, depth 5 and learning rate 0.1; "
    "Random Forest uses 300 trees, depth 15 and minimum leaf size 3. Evaluation includes R² and MAE, with residuals retained "
    "for indicative prediction intervals. Estimates are advisory and never overwrite an agent-entered price.",
    styles["Bodyx"],
))

story.append(Paragraph("Lead conversion prediction", styles["H2x"]))
story.append(Paragraph(
    "The binary target represents conversion within the configured time window through an appointment or contract. "
    "Gradient Boosting (200 estimators) is compared with a class-balanced Random Forest (300 trees). The probability is shown as an experimental "
    "agent aid; it does not replace the existing lead score and must not automatically reject a client.",
    styles["Bodyx"],
))

story.append(Paragraph("Personalized recommendations", styles["H2x"]))
story.append(Paragraph(
    "The recommender compares content-based cosine KNN with collaborative Truncated SVD. Interactions form a user–property matrix; "
    "leave-one-out evaluation measures precision@5, recall@5, hit-rate@5, NDCG and catalog coverage. Until interaction volume is sufficient, "
    "the system returns popularity-based recommendations.",
    styles["Bodyx"],
))

story.append(PageBreak())
story.append(Paragraph("4. Other uses of AI and intelligent automation", styles["H1x"]))
story.append(Paragraph("Lead scoring and agent matching", styles["H2x"]))
story.append(bullet("A transparent 0–100 lead score measures budget clarity, location specificity, property criteria, urgency, activity and engagement."))
story.append(bullet("Agent matching combines property-type, territory, budget, availability and experience scores to rank agents for a client request."))
story.append(bullet("Scores can be recalculated as messages, saved searches, favorites and appointments change."))

story.append(Paragraph("AI assistant", styles["H2x"]))
story.append(Paragraph(
    "The website assistant detects intents, retrieves platform knowledge and proposes role-specific actions such as browsing properties, opening messages, "
    "creating appointments or viewing analytics. Its base implementation is deterministic and rule-based. An external OpenAI-compatible generative layer "
    "is optional; without an API key, the assistant continues with safe predefined responses and does not fabricate transactions.",
    styles["Bodyx"],
))

story.append(Paragraph("Investment score", styles["H2x"]))
story.append(Paragraph(
    "Investment analysis is not a trained ML model. It is a deterministic weighted formula using market demand (30%), affordability (25%), rental yield (20%), "
    "price growth (15%) and liquidity (10%). It provides an indicative score, risks and recommendation using market-area data.",
    styles["Bodyx"],
))

story.append(Paragraph("Data and responsible use", styles["H1x"]))
story.append(bullet("Property data includes type, Tunisian location, TND price, surface, rooms, coordinates, images and features."))
story.append(bullet("Interaction events include views, favorites, saved searches, messages, appointments and completed transactions; message content and credentials are excluded."))
story.append(bullet("Every model has a fallback for missing artifacts, insufficient rows, incompatible schemas or inference errors."))
story.append(bullet("Predictions are advisory, include limitations, and retain human review by agents and managers."))
story.append(Paragraph(
    "<b>Summary:</b> RE/MAX Smile AI uses KNN directly for agent–property allocation and provides complete training infrastructure for pricing, conversion prediction "
    "and personalization. The system deliberately separates true trained ML from deterministic scoring, ensuring that the platform remains explainable and reliable "
    "while more real interaction and transaction data is collected.",
    styles["Callout"],
))

doc = SimpleDocTemplate(
    str(OUTPUT), pagesize=A4,
    rightMargin=18 * mm, leftMargin=18 * mm,
    topMargin=14 * mm, bottomMargin=19 * mm,
    title="AI and Machine Learning in RE/MAX Smile AI",
    author="RE/MAX Smile AI Project",
    subject="Summary of ML models and AI uses in the project",
)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUTPUT)
