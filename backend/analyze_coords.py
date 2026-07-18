import csv
import os
from collections import Counter

csv_path = r'C:\Users\jihed\Downloads\data_clean1_fixed.csv'
if not os.path.exists(csv_path):
    csv_path = r'C:\Users\jihed\Downloads\data_clean1 (1).csv'

with open(csv_path, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print('rows', len(rows))
valid = []
for r in rows:
    try:
        lat = float(r['latt'])
        lng = float(r['long'])
        valid.append((r, lat, lng))
    except Exception:
        pass

lats = [lat for _, lat, _ in valid]
lngs = [lng for _, _, lng in valid]
print('lat range', min(lats), max(lats))
print('lng range', min(lngs), max(lngs))

out = [(r, lat, lng) for r, lat, lng in valid if not (30.2 <= lat <= 37.8 and 7.5 <= lng <= 11.8)]
print('outside Tunisia bounds', len(out))
for r, lat, lng in out[:20]:
    print(r.get('id'), r.get('city'), r.get('governorate'), r.get('location'), lat, lng)

# Detect suspicious fallback coordinates
BAD_COORDS = {(33.8869, 9.5375), (0.0, 0.0)}
for (lat, lng) in sorted(BAD_COORDS):
    matches = [r for r, rlat, rlng in valid if (rlat, rlng) == (lat, lng)]
    print(f'bad coord {lat},{lng}: {len(matches)} rows')
    for r in matches[:10]:
        print(' ', r.get('id'), r.get('city'), r.get('governorate'), r.get('location'))

# Find most repeated coordinates
coord_counts = Counter((round(lat, 5), round(lng, 5)) for _, lat, lng in valid)
print('top repeated coordinates:')
for coord, count in coord_counts.most_common(15):
    print(' ', coord, count)

# Build city center mapping from most common coordinate per city
city_coords = {}
for r, lat, lng in valid:
    city = (r.get('governorate') or '').strip().title() + '::' + (r.get('city') or '').strip().title()
    if not city:
        continue
    city_coords.setdefault(city, []).append((lat, lng))

city_center = {}
for city, coords in city_coords.items():
    most_common = Counter((round(c[0], 5), round(c[1], 5)) for c in coords).most_common(1)
    if most_common:
        city_center[city] = most_common[0][0]

print('city centers (sample):')
for city in sorted(city_center)[:30]:
    print(' ', city, city_center[city])
