"""
Seed MarketArea and KnowledgeBaseArticle data for the chatbot.
Safe to run multiple times — skips existing records by city/district or title.
All values are DEMO/SAMPLE data unless replaced with real RE/MAX data.
"""
from decimal import Decimal

from app.database.session import SessionLocal
from app.models.market_area import MarketArea, DemandLevel, PriceTrend
from app.models.knowledge_base import KnowledgeBaseArticle, KBCategory

MARKET_AREAS = [
    {
        "city": "Lac 1",
        "district": "Lac 1",
        "average_price_per_sqm": Decimal("4200"),
        "average_rent_per_sqm": Decimal("18"),
        "transaction_count": 142,
        "demand_level": DemandLevel.HIGH.value,
        "price_trend": PriceTrend.RISING.value,
        "rental_yield": Decimal("5.1"),
        "latitude": Decimal("36.8320"),
        "longitude": Decimal("10.2390"),
    },
    {
        "city": "Lac 2",
        "district": "Lac 2",
        "average_price_per_sqm": Decimal("4800"),
        "average_rent_per_sqm": Decimal("20"),
        "transaction_count": 98,
        "demand_level": DemandLevel.VERY_HIGH.value,
        "price_trend": PriceTrend.SURGING.value,
        "rental_yield": Decimal("5.0"),
        "latitude": Decimal("36.8420"),
        "longitude": Decimal("10.2550"),
    },
    {
        "city": "La Marsa",
        "district": "La Marsa",
        "average_price_per_sqm": Decimal("3800"),
        "average_rent_per_sqm": Decimal("16"),
        "transaction_count": 211,
        "demand_level": DemandLevel.HIGH.value,
        "price_trend": PriceTrend.RISING.value,
        "rental_yield": Decimal("5.0"),
        "latitude": Decimal("36.8787"),
        "longitude": Decimal("10.3249"),
    },
    {
        "city": "Carthage",
        "district": "Carthage",
        "average_price_per_sqm": Decimal("3500"),
        "average_rent_per_sqm": Decimal("15"),
        "transaction_count": 87,
        "demand_level": DemandLevel.HIGH.value,
        "price_trend": PriceTrend.STABLE.value,
        "rental_yield": Decimal("5.1"),
        "latitude": Decimal("36.8525"),
        "longitude": Decimal("10.3333"),
    },
    {
        "city": "Ariana",
        "district": "Ariana",
        "average_price_per_sqm": Decimal("2400"),
        "average_rent_per_sqm": Decimal("10"),
        "transaction_count": 318,
        "demand_level": DemandLevel.HIGH.value,
        "price_trend": PriceTrend.RISING.value,
        "rental_yield": Decimal("5.0"),
        "latitude": Decimal("36.8625"),
        "longitude": Decimal("10.1956"),
    },
    {
        "city": "Soukra",
        "district": "Soukra",
        "average_price_per_sqm": Decimal("2200"),
        "average_rent_per_sqm": Decimal("9"),
        "transaction_count": 195,
        "demand_level": DemandLevel.MEDIUM.value,
        "price_trend": PriceTrend.RISING.value,
        "rental_yield": Decimal("4.9"),
        "latitude": Decimal("36.8920"),
        "longitude": Decimal("10.2240"),
    },
    {
        "city": "Manzah",
        "district": "Manzah",
        "average_price_per_sqm": Decimal("2000"),
        "average_rent_per_sqm": Decimal("8"),
        "transaction_count": 163,
        "demand_level": DemandLevel.MEDIUM.value,
        "price_trend": PriceTrend.STABLE.value,
        "rental_yield": Decimal("4.8"),
        "latitude": Decimal("36.8650"),
        "longitude": Decimal("10.1540"),
    },
    {
        "city": "Ain Zaghouan",
        "district": "Ain Zaghouan",
        "average_price_per_sqm": Decimal("1800"),
        "average_rent_per_sqm": Decimal("7"),
        "transaction_count": 74,
        "demand_level": DemandLevel.MEDIUM.value,
        "price_trend": PriceTrend.RISING.value,
        "rental_yield": Decimal("4.7"),
        "latitude": Decimal("36.8900"),
        "longitude": Decimal("10.1850"),
    },
    {
        "city": "Tunis",
        "district": "Tunis Centre",
        "average_price_per_sqm": Decimal("3100"),
        "average_rent_per_sqm": Decimal("13"),
        "transaction_count": 256,
        "demand_level": DemandLevel.HIGH.value,
        "price_trend": PriceTrend.STABLE.value,
        "rental_yield": Decimal("5.0"),
        "latitude": Decimal("36.8190"),
        "longitude": Decimal("10.1658"),
    },
]

KB_ARTICLES = [
    {
        "title": "Buying process in Tunisia",
        "category": KBCategory.LEGAL.value,
        "language": "en",
        "source": "RE/MAX Smile knowledge base (demo)",
        "content": (
            "**Buying property in Tunisia — step-by-step:**\n"
            "1. **Property search and visits** — Browse listings and arrange visits through an agent.\n"
            "2. **Preliminary agreement (compromis de vente)** — Signed before a notary. Buyer typically pays a 10% deposit.\n"
            "3. **Title deed verification (titre foncier)** — The notary verifies ownership at the Land Registry (Conservation Foncière).\n"
            "4. **Certificate of non-opposition** — Confirms no legal claims against the property.\n"
            "5. **Registration taxes** — ~5% for primary residence, ~10% for investment property.\n"
            "6. **Final sale deed** — Signed before the notary; full payment is made.\n"
            "7. **Land registration** — The notary registers the transfer at the Conservation Foncière.\n\n"
            "**Required documents:**\n"
            "• Valid national ID or passport (both parties)\n"
            "• Original title deed (titre foncier)\n"
            "• Tax clearance certificate (attestation fiscale) from the seller\n"
            "• Certificate of non-opposition\n\n"
            "**Typical timeline:** 2–3 months from agreement to final deed.\n\n"
            "**Role of the notary:** In Tunisia, all property transfers must be registered before a licensed notary (notaire). "
            "The notary is a neutral legal officer who verifies title, drafts the deed, and registers the transaction. "
            "Notary fees are typically 1–1.5% of the sale price."
        ),
    },
    {
        "title": "Taxes and fees when buying property in Tunisia",
        "category": KBCategory.TAX.value,
        "language": "en",
        "source": "RE/MAX Smile knowledge base (demo)",
        "content": (
            "**Acquisition costs when buying property in Tunisia (estimated):**\n\n"
            "| Cost item | Rate |\n"
            "|---|---|\n"
            "| Registration tax (primary residence) | ~5% of sale price |\n"
            "| Registration tax (investment / secondary) | ~10% of sale price |\n"
            "| Notary fees | ~1–1.5% of sale price |\n"
            "| VAT on notary fees | 19% of notary fees |\n"
            "| Land conservation fee | ~1% of sale price |\n"
            "| **Estimated total (primary residence)** | **~7–8%** |\n"
            "| **Estimated total (investment)** | **~12–13%** |\n\n"
            "**Capital gains tax:**\n"
            "Gains from property resale may be subject to capital gains tax. "
            "Primary residences held for more than 5 years are generally exempt. "
            "Consult a tax advisor for your specific situation.\n\n"
            "**Annual property tax (TCL):**\n"
            "Owners pay an annual local tax (Taxe sur les Collectivités Locales) based on the rental value of the property. "
            "Rates vary by municipality."
        ),
    },
    {
        "title": "Real estate investment guide — Tunisia",
        "category": KBCategory.INVESTMENT.value,
        "language": "en",
        "source": "RE/MAX Smile knowledge base (demo)",
        "content": (
            "**Real estate investment in Tunisia — key concepts:**\n\n"
            "**Rental yield formula:**\n"
            "Gross yield = (annual rent / purchase price) × 100\n\n"
            "**Typical yields in Grand Tunis (demo data):**\n"
            "• Lac 1 & 2: ~5% — high demand, strong capital appreciation\n"
            "• La Marsa & Carthage: ~5% — premium market, stable demand\n"
            "• Ariana & Soukra: ~5% — growing demand, good value\n"
            "• Manzah & Ain Zaghouan: ~4.7–4.8% — affordable entry, steady rental income\n\n"
            "**Investment strategies:**\n"
            "• **Buy-to-rent** — Apartments near universities or business districts offer consistent rental demand.\n"
            "• **Capital gain** — Premium coastal and lakeside areas (La Marsa, Lac 2) show stronger price appreciation.\n"
            "• **Mixed-use** — Ground-floor commercial + upper residential units in city-centre locations.\n\n"
            "**Key risks:**\n"
            "• Verify the title deed (titre foncier) before purchase — undeclared co-owners or legal disputes can block resale.\n"
            "• Budget 7–13% extra for acquisition costs (taxes + notary fees).\n"
            "• Vacancy risk — factor in potential gaps between tenants.\n\n"
            "Use the **Investment Score** tool on RE/MAX Smile for a property-specific analysis."
        ),
    },
    {
        "title": "RE/MAX Smile AI — platform services overview",
        "category": KBCategory.AGENCY_SERVICE.value,
        "language": "en",
        "source": "RE/MAX Smile",
        "content": (
            "**RE/MAX Smile AI platform — what we offer:**\n\n"
            "**For buyers and renters (clients):**\n"
            "• Advanced property search with filters (type, city, price, area, features)\n"
            "• AI-powered agent matching based on your search request\n"
            "• Property viewing requests\n"
            "• Direct messaging with agents\n"
            "• Favourites list\n"
            "• Saved searches with alerts\n"
            "• Investment Score analysis\n"
            "• Interactive property map (Tunisia)\n"
            "• Market heat map by neighbourhood\n\n"
            "**For agents:**\n"
            "• Property listing management (add, edit, update status)\n"
            "• Image and feature management\n"
            "• Client appointment management (confirm, reschedule, complete)\n"
            "• Direct messaging with clients\n"
            "• Performance dashboard\n\n"
            "**For managers:**\n"
            "• Analytics dashboard (properties, agents, clients, appointments)\n"
            "• Agent and user management\n"
            "• Market heat map\n"
            "• Platform oversight"
        ),
    },
    {
        "title": "What to check before buying a property in Tunisia",
        "category": KBCategory.LEGAL.value,
        "language": "en",
        "source": "RE/MAX Smile knowledge base (demo)",
        "content": (
            "**Due diligence checklist before buying in Tunisia:**\n\n"
            "✅ **Title deed (titre foncier)** — Request the official title from the seller and verify it at the Conservation Foncière.\n"
            "✅ **No undeclared co-owners** — Ensure all co-owners have signed or consented.\n"
            "✅ **No mortgage or lien** — Check for any registered mortgage (hypothèque) on the property.\n"
            "✅ **Certificate of non-opposition** — Confirms no pending legal disputes blocking the sale.\n"
            "✅ **Tax clearance** — Seller must provide an attestation fiscale showing no outstanding taxes.\n"
            "✅ **Building permit compliance** — Verify the property was built in compliance with its permit.\n"
            "✅ **Residence status** — Foreigners purchasing property in Tunisia may need approval from the Central Bank of Tunisia (BCT) for currency transfers.\n"
            "✅ **Physical inspection** — Always inspect in person or with a licensed surveyor before signing.\n\n"
            "**Common risks:**\n"
            "• Forged or incomplete title deeds\n"
            "• Undisclosed co-heirs after inheritance\n"
            "• Unregistered construction additions\n"
            "• Outstanding utility debts inherited by the buyer\n\n"
            "Always work with a licensed notary and a reputable real estate agent."
        ),
    },
    {
        "title": "How to rent a property in Tunisia",
        "category": KBCategory.LEGAL.value,
        "language": "en",
        "source": "RE/MAX Smile knowledge base (demo)",
        "content": (
            "**Renting a property in Tunisia — tenant guide:**\n\n"
            "1. **Search and visit** — Browse listings on RE/MAX Smile and arrange visits.\n"
            "2. **Sign a lease (contrat de bail)** — Recommended to be notarised or at minimum signed by both parties.\n"
            "3. **Security deposit** — Typically 1–2 months' rent, refunded at end of tenancy.\n"
            "4. **State of condition report (état des lieux)** — Document the property condition at entry and exit.\n"
            "5. **Transfer utilities** — Arrange electricity (STEG) and water (SONEDE) account transfers.\n\n"
            "**Tenant rights:**\n"
            "• Landlord must give legal notice before terminating a contract.\n"
            "• Rent increases must be agreed in writing.\n"
            "• Security deposit must be returned within a reasonable time after departure.\n\n"
            "**Landlord obligations:**\n"
            "• Rental income must be declared to tax authorities.\n"
            "• The property must be in habitable condition."
        ),
    },
    {
        "title": "Market overview — Grand Tunis real estate",
        "category": KBCategory.MARKET.value,
        "language": "en",
        "source": "RE/MAX Smile knowledge base (demo)",
        "content": (
            "**Grand Tunis real estate market overview (DEMO DATA):**\n\n"
            "**Premium zones** (high prices, strong demand):\n"
            "• Lac 1 & Lac 2: International business district, luxury apartments, 4,000–5,500 TND/m²\n"
            "• La Marsa: Upmarket coastal suburb, villas and apartments, 3,500–4,500 TND/m²\n"
            "• Carthage: Historic prestige area, 3,000–4,000 TND/m²\n\n"
            "**Mid-range zones** (good value, growing demand):\n"
            "• Ariana: Well-connected suburb, 2,000–3,000 TND/m²\n"
            "• Soukra: Modern residential, 1,800–2,500 TND/m²\n"
            "• Manzah: Established family neighbourhood, 1,700–2,300 TND/m²\n\n"
            "**Emerging zones** (affordable, strong growth potential):\n"
            "• Ain Zaghouan: Newer development, 1,500–2,000 TND/m²\n"
            "• Tunis Centre: Mixed commercial/residential, 2,500–3,500 TND/m²\n\n"
            "**Market trends (2024–2025):**\n"
            "• Demand remains strong in the Lac 1/2 corridor driven by corporate tenants.\n"
            "• La Marsa and Carthage continue to attract high-net-worth buyers.\n"
            "• Suburban areas are seeing increased demand from young families.\n\n"
            "These figures are indicative. Contact a RE/MAX Smile agent for current pricing."
        ),
    },
    {
        "title": "Common questions about the notary in Tunisia",
        "category": KBCategory.LEGAL.value,
        "language": "en",
        "source": "RE/MAX Smile knowledge base (demo)",
        "content": (
            "**Role of the notary (notaire) in Tunisian real estate:**\n\n"
            "In Tunisia, a notary is a state-appointed legal officer (officier public) who:\n"
            "• Drafts the preliminary sale agreement and the final deed\n"
            "• Verifies the title deed and absence of legal encumbrances\n"
            "• Collects and transfers registration taxes to the state\n"
            "• Registers the transfer at the Conservation Foncière\n\n"
            "**Who pays the notary?**\n"
            "By convention, the buyer pays the notary fees (~1–1.5% of the sale price).\n\n"
            "**Is a notary mandatory?**\n"
            "Yes. In Tunisia, all property sale transfers must go through a licensed notary. "
            "A private contract between buyer and seller alone is not sufficient for legal transfer of ownership.\n\n"
            "**How to find a notary:**\n"
            "Contact the Chambre Nationale des Notaires de Tunisie or ask your RE/MAX agent for a referral."
        ),
    },
    {
        "title": "Investment score — how it works",
        "category": KBCategory.INVESTMENT.value,
        "language": "en",
        "source": "RE/MAX Smile",
        "content": (
            "**RE/MAX Smile Investment Score:**\n\n"
            "The Investment Score gives each property a score from 0 to 100 based on:\n"
            "• **Location score** — neighbourhood demand, price trend, rental yield data\n"
            "• **Value score** — price per m² vs neighbourhood average\n"
            "• **Yield score** — estimated rental income vs purchase price\n"
            "• **Market score** — supply/demand balance, transaction volume\n\n"
            "**How to use it:**\n"
            "1. Go to a property detail page\n"
            "2. Click **Investment Score**\n"
            "3. View the breakdown by category\n\n"
            "**Note:** The score is an analytical tool to support your decision. "
            "It does not constitute financial advice. Always consult a financial advisor before investing."
        ),
    },
]


def seed_chatbot_knowledge() -> None:
    db = SessionLocal()
    try:
        print("Seeding MarketArea data...")
        seeded_areas = 0
        for data in MARKET_AREAS:
            exists = (
                db.query(MarketArea)
                .filter(MarketArea.city == data["city"], MarketArea.district == data["district"])
                .first()
            )
            if not exists:
                db.add(MarketArea(**data))
                seeded_areas += 1
        db.commit()
        print(f"  ✅ {seeded_areas} new market areas seeded ({len(MARKET_AREAS) - seeded_areas} already existed)")

        print("Seeding KnowledgeBaseArticle data...")
        seeded_kb = 0
        for data in KB_ARTICLES:
            exists = db.query(KnowledgeBaseArticle).filter(KnowledgeBaseArticle.title == data["title"]).first()
            if not exists:
                db.add(KnowledgeBaseArticle(**data))
                seeded_kb += 1
        db.commit()
        print(f"  ✅ {seeded_kb} new KB articles seeded ({len(KB_ARTICLES) - seeded_kb} already existed)")

        print("\n✅ Chatbot knowledge base seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_chatbot_knowledge()
