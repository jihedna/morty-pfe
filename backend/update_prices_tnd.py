"""Update imported RE/MAX listings to their original TND prices."""

import csv
from decimal import Decimal
from pathlib import Path

from app.database.session import SessionLocal
from app.models.property import Property


def update_prices() -> int:
    csv_path = Path(__file__).with_name("listings_completed_euro.csv")
    with csv_path.open(newline="", encoding="utf-8-sig") as csv_file:
        rows = list(csv.DictReader(csv_file))

    db = SessionLocal()
    try:
        properties = {
            prop.reference_code: prop
            for prop in db.query(Property).filter(Property.reference_code.like("REMAX-%")).all()
        }
        updated = 0
        for index, row in enumerate(rows, 1):
            prop = properties.get(f"REMAX-{index:08d}")
            if prop is None:
                continue
            prop.price = Decimal(row.get("ListingPrice") or "0")
            prop.currency = "TND"
            updated += 1
        db.commit()
        return updated
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print(f"Updated {update_prices()} property prices to TND")
