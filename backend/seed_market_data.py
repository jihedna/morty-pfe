"""
Seed DEMO market area and knowledge base data.
All values are SAMPLE/DEMO — not real market data.
Run: venv\Scripts\python.exe seed_market_data.py
"""
import uuid
from datetime import datetime, timezone

from app.database.session import SessionLocal
from app.models.market_area import MarketArea
from app.models.knowledge_base import KnowledgeBaseArticle

MARKET_AREAS = [
    {"city": "Tunis", "district": "Lac 1", "average_price_per_sqm": 4200, "average_rent_per_sqm": 18, "transaction_count": 87, "demand_level": "very_high", "price_trend": "rising", "rental_yield": 5.1, "latitude": 36.8330, "longitude": 10.2290},
    {"city": "Tunis", "district": "Lac 2", "average_price_per_sqm": 4800, "average_rent_per_sqm": 22, "transaction_count": 65, "demand_level": "very_high", "price_trend": "surging", "rental_yield": 5.5, "latitude": 36.8390, "longitude": 10.2550},
    {"city": "La Marsa", "district": "La Marsa Centre", "average_price_per_sqm": 3500, "average_rent_per_sqm": 15, "transaction_count": 54, "demand_level": "high", "price_trend": "rising", "rental_yield": 5.1, "latitude": 36.8780, "longitude": 10.3230},
    {"city": "Carthage", "district": "Carthage Hannibal", "average_price_per_sqm": 4000, "average_rent_per_sqm": 17, "transaction_count": 32, "demand_level": "high", "price_trend": "stable", "rental_yield": 5.1, "latitude": 36.8590, "longitude": 10.3240},
    {"city": "Ariana", "district": "Ariana Centre", "average_price_per_sqm": 2400, "average_rent_per_sqm": 10, "transaction_count": 72, "demand_level": "high", "price_trend": "rising", "rental_yield": 5.0, "latitude": 36.8625, "longitude": 10.1956},
    {"city": "Ariana", "district": "Soukra", "average_price_per_sqm": 2200, "average_rent_per_sqm": 9, "transaction_count": 60, "demand_level": "high", "price_trend": "stable", "rental_yield": 4.9, "latitude": 36.8890, "longitude": 10.1860},
    {"city": "Ariana", "district": "Manzah", "average_price_per_sqm": 1900, "average_rent_per_sqm": 8, "transaction_count": 45, "demand_level": "medium", "price_trend": "stable", "rental_yield": 5.1, "latitude": 36.8530, "longitude": 10.1690},
    {"city": "Tunis", "district": "Ain Zaghouan", "average_price_per_sqm": 1600, "average_rent_per_sqm": 7, "transaction_count": 28, "demand_level": "medium", "price_trend": "stable", "rental_yield": 5.3, "latitude": 36.8420, "longitude": 10.2100},
    {"city": "Tunis", "district": "Tunis Centre", "average_price_per_sqm": 2800, "average_rent_per_sqm": 12, "transaction_count": 95, "demand_level": "high", "price_trend": "stable", "rental_yield": 5.1, "latitude": 36.8190, "longitude": 10.1658},
    {"city": "Ben Arous", "district": "Rades", "average_price_per_sqm": 1400, "average_rent_per_sqm": 6, "transaction_count": 38, "demand_level": "medium", "price_trend": "stable", "rental_yield": 5.1, "latitude": 36.7700, "longitude": 10.2760},
    {"city": "Manouba", "district": "Manouba Centre", "average_price_per_sqm": 1200, "average_rent_per_sqm": 5, "transaction_count": 22, "demand_level": "low", "price_trend": "stable", "rental_yield": 5.0, "latitude": 36.8100, "longitude": 10.0980},
]

KB_ARTICLES = [
    {
        "title": "Étapes d'achat immobilier en Tunisie",
        "category": "legal",
        "language": "fr",
        "content": (
            "1. Recherche et visite du bien\n"
            "2. Vérification du titre foncier auprès de l'Office de la Topographie et de la Cartographie\n"
            "3. Signature d'une promesse de vente (compromis) chez le notaire\n"
            "4. Obtention d'un certificat de non-opposition\n"
            "5. Paiement des droits d'enregistrement et frais de notaire\n"
            "6. Signature de l'acte de vente définitif\n"
            "7. Inscription au registre foncier\n\n"
            "Délai moyen : 2 à 3 mois. Consultez toujours un notaire agréé."
        ),
        "source": "Guide pratique RE/MAX Smile (démo)",
    },
    {
        "title": "Taxes et frais d'acquisition en Tunisie",
        "category": "tax",
        "language": "fr",
        "content": (
            "Frais indicatifs pour l'achat d'un bien immobilier en Tunisie :\n"
            "• Droits d'enregistrement : 5% (résidence principale) ou 10% (investissement)\n"
            "• Honoraires du notaire : 1 à 1,5% du prix\n"
            "• TVA sur honoraires : 19%\n"
            "• Frais de conservation foncière : 1%\n"
            "• Total estimé : 7 à 13% du prix de vente\n\n"
            "⚠️ Ces taux sont indicatifs. Vérifiez auprès d'un notaire ou du code des droits d'enregistrement."
        ),
        "source": "Code des droits d'enregistrement (démo)",
    },
    {
        "title": "Comment investir dans l'immobilier à Grand Tunis",
        "category": "investment",
        "language": "fr",
        "content": (
            "Critères d'un bon investissement immobilier à Grand Tunis :\n"
            "• Emplacement : Lac 1, Lac 2, La Marsa et Carthage offrent les meilleures plus-values.\n"
            "• Rendement locatif brut = (loyer annuel / prix d'achat) × 100. Objectif : 4 à 6%.\n"
            "• Liquidité : préférez les zones avec un volume de transactions élevé.\n"
            "• Type de bien : les appartements de 2 à 3 pièces offrent le meilleur rapport demande/prix.\n"
            "• Tendance : zones en hausse = Lac 2, Soukra. Zones stables = Manzah, Ariana Centre.\n\n"
            "Utilisez notre outil Score d'Investissement pour une analyse personnalisée."
        ),
        "source": "Analyse marché RE/MAX Smile (démo)",
    },
    {
        "title": "Services RE/MAX Smile",
        "category": "agency_service",
        "language": "fr",
        "content": (
            "RE/MAX Smile propose :\n"
            "• Recherche de propriétés avec filtres avancés\n"
            "• Matching IA avec l'agent le plus compatible\n"
            "• Demande de visite en ligne\n"
            "• Messagerie directe avec les agents\n"
            "• Sauvegarde de recherches et favoris\n"
            "• Analyses de marché et score d'investissement\n"
            "• Carte interactive des propriétés\n\n"
            "Contactez-nous au bureau RE/MAX Smile pour toute demande personnalisée."
        ),
        "source": "RE/MAX Smile (interne)",
    },
    {
        "title": "Procédure de location en Tunisie",
        "category": "legal",
        "language": "fr",
        "content": (
            "Pour louer un bien en Tunisie :\n"
            "1. Visite et sélection du bien\n"
            "2. Vérification de l'identité du bailleur et du titre de propriété\n"
            "3. Négociation du loyer et des conditions\n"
            "4. Signature d'un contrat de bail (recommandé chez le notaire)\n"
            "5. Paiement de la caution (1 à 2 mois de loyer en général)\n"
            "6. État des lieux contradictoire\n\n"
            "Le bailleur doit déclarer les revenus locatifs à l'administration fiscale."
        ),
        "source": "Code des obligations et contrats (démo)",
    },
    {
        "title": "Prix immobiliers à Grand Tunis — Vue d'ensemble",
        "category": "market",
        "language": "fr",
        "content": (
            "Prix moyens au m² à Grand Tunis (valeurs DÉMO — non contractuelles) :\n"
            "• Lac 1 : 4 200 TND/m²\n"
            "• Lac 2 : 4 800 TND/m²\n"
            "• La Marsa : 3 500 TND/m²\n"
            "• Carthage : 4 000 TND/m²\n"
            "• Ariana Centre : 2 400 TND/m²\n"
            "• Soukra : 2 200 TND/m²\n"
            "• Manzah : 1 900 TND/m²\n"
            "• Tunis Centre : 2 800 TND/m²\n"
            "• Ain Zaghouan : 1 600 TND/m²\n\n"
            "⚠️ Ces valeurs sont indicatives. Importez des données réelles pour plus de précision."
        ),
        "source": "Base de données démo RE/MAX Smile",
    },
]


def seed():
    db = SessionLocal()
    try:
        existing_areas = db.query(MarketArea).count()
        if existing_areas == 0:
            print("Seeding market areas...")
            for area_data in MARKET_AREAS:
                area = MarketArea(
                    id=str(uuid.uuid4()),
                    city=area_data["city"],
                    district=area_data["district"],
                    average_price_per_sqm=area_data["average_price_per_sqm"],
                    average_rent_per_sqm=area_data["average_rent_per_sqm"],
                    transaction_count=area_data["transaction_count"],
                    demand_level=area_data["demand_level"],
                    price_trend=area_data["price_trend"],
                    rental_yield=area_data["rental_yield"],
                    latitude=area_data["latitude"],
                    longitude=area_data["longitude"],
                    updated_at=datetime.now(timezone.utc),
                )
                db.add(area)
            db.commit()
            print(f"  Seeded {len(MARKET_AREAS)} market areas.")
        else:
            print(f"  Market areas already seeded ({existing_areas} records).")

        existing_kb = db.query(KnowledgeBaseArticle).count()
        if existing_kb == 0:
            print("Seeding knowledge base articles...")
            for article_data in KB_ARTICLES:
                article = KnowledgeBaseArticle(
                    id=str(uuid.uuid4()),
                    **article_data,
                )
                db.add(article)
            db.commit()
            print(f"  Seeded {len(KB_ARTICLES)} knowledge base articles.")
        else:
            print(f"  Knowledge base already seeded ({existing_kb} records).")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("Done.")
