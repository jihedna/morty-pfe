"""Fix incorrect property coordinates in the CSV and update the database."""

import csv
import math
import os
from collections import defaultdict
from decimal import Decimal

from app.database.session import SessionLocal
from app.models.property import Property

CSV_PATH = r"C:\Users\jihed\Downloads\data_clean1 (1).csv"
FIXED_CSV = r"C:\Users\jihed\Downloads\data_clean1_fixed.csv"
OUTLIER_DISTANCE_KM = 60
FALLBACK_COORDS = {(33.8869, 9.5375), (0.0, 0.0)}


def _to_float(value: str | None) -> float | None:
    try:
        return float(value) if value not in (None, "") else None
    except (TypeError, ValueError):
        return None


def _median(values: list[float]) -> float | None:
    if not values:
        return None
    s = sorted(values)
    return s[len(s) // 2]


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def _city_key(row: dict[str, str]) -> str:
    gov = (row.get("governorate") or "").strip().title()
    city = (row.get("city") or "").strip().title()
    return f"{gov}::{city}"


def _ref_code(row_index: int, row: dict[str, str]) -> str:
    raw_id = str(row.get("id", "")).replace("-", "")
    prefix = raw_id[:8].upper() if raw_id else f"{row_index + 1:>08}"
    return f"CSV-{prefix}"


def build_city_centers(rows: list[dict[str, str]]) -> dict[str, tuple[float, float]]:
    """Return a robust city center for each (governorate, city) pair."""
    groups: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        groups[_city_key(row)].append(row)

    centers: dict[str, tuple[float, float]] = {}
    for city, group in groups.items():
        distances = [
            d for r in group if (d := _to_float(r.get("distance_to_capital"))) is not None
        ]
        if not distances:
            continue

        median_dist = _median(distances)
        # Keep rows whose distance-to-capital is close to the city median.
        filtered = [
            r
            for r in group
            if (d := _to_float(r.get("distance_to_capital"))) is not None
            and abs(d - median_dist) <= OUTLIER_DISTANCE_KM
        ]
        if not filtered:
            filtered = group

        lats = [lat for r in filtered if (lat := _to_float(r.get("latt"))) is not None]
        lngs = [lng for r in filtered if (lng := _to_float(r.get("long"))) is not None]
        if not lats or not lngs:
            continue

        centers[city] = (_median(lats), _median(lngs))

    return centers


def correct_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    """Return rows with corrected coordinates."""
    centers = build_city_centers(rows)
    corrected: list[dict[str, str]] = []

    for row in rows:
        lat = _to_float(row.get("latt"))
        lng = _to_float(row.get("long"))
        city = _city_key(row)
        center = centers.get(city)
        distance = _to_float(row.get("distance_to_capital"))

        needs_fix = False
        if lat is None or lng is None:
            needs_fix = True
        elif (round(lat, 4), round(lng, 4)) in FALLBACK_COORDS:
            needs_fix = True
        elif center is not None:
            if _haversine_km(lat, lng, center[0], center[1]) > OUTLIER_DISTANCE_KM:
                needs_fix = True
            if distance is not None and center is not None:
                city_center_dist = _haversine_km(center[0], center[1], 36.8065, 10.1815)
                if abs(distance - city_center_dist) > OUTLIER_DISTANCE_KM:
                    needs_fix = True

        if needs_fix and center is not None:
            lat, lng = center

        new_row = dict(row)
        if lat is not None:
            new_row["latt"] = f"{lat:.8f}"
        if lng is not None:
            new_row["long"] = f"{lng:.8f}"
        corrected.append(new_row)

    return corrected


def update_database(rows: list[dict[str, str]]) -> int:
    """Update latitude/longitude in the database for all CSV rows."""
    db = SessionLocal()
    try:
        refs = {}
        for i, row in enumerate(rows):
            ref = _ref_code(i, row)
            lat = _to_float(row.get("latt"))
            lng = _to_float(row.get("long"))
            if lat is not None and lng is not None:
                refs[ref] = (Decimal(f"{lat:.8f}"), Decimal(f"{lng:.8f}"))

        updated = 0
        for prop in db.query(Property).filter(Property.reference_code.in_(refs)).all():
            lat, lng = refs[prop.reference_code]
            prop.latitude = lat
            prop.longitude = lng
            updated += 1

        db.commit()
        print(f"Updated {updated} properties in the database")
        return updated
    finally:
        db.close()


def main() -> None:
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    corrected = correct_rows(rows)

    # Count changes
    changed = sum(
        1
        for old, new in zip(rows, corrected)
        if old.get("latt") != new.get("latt") or old.get("long") != new.get("long")
    )
    print(f"Corrected {changed} rows in CSV")

    with open(FIXED_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=reader.fieldnames)
        writer.writeheader()
        writer.writerows(corrected)
    print(f"Wrote corrected CSV to {FIXED_CSV}")

    update_database(corrected)


if __name__ == "__main__":
    main()
