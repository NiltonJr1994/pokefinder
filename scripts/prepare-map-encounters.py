"""Generate the offline wild encounter list for the authored map stages."""
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'src/data'
source = Path(sys.argv[1])


def rows(file):
    path = Path(sys.argv[2]) if file == 'encounters' and len(sys.argv) > 2 else source / (file + '.csv')
    with path.open(encoding='utf-8-sig', newline='') as handle:
        yield from csv.DictReader(handle)


paths = json.loads((root / 'map-routes.json').read_text(encoding='utf-8'))
groups = {
    'red': ('kanto', 1), 'blue': ('kanto', 1), 'yellow': ('kanto', 1), 'gold': ('johto', 2),
    'silver': ('johto', 2), 'crystal': ('johto', 2), 'emerald': ('hoenn', 3),
    'firered': ('kanto', 3), 'leafgreen': ('kanto', 3), 'heartgold': ('johto', 4), 'soulsilver': ('johto', 4),
}
version_ids = {r['id']: r['identifier'] for r in rows('versions') if r['identifier'] in groups}
loc_ids = {r['id']: r['identifier'] for r in rows('locations')}
areas = {r['id']: (loc_ids[r['location_id']], r['identifier']) for r in rows('location_areas')}
english = {loc_ids[r['location_id']]: r['name'] for r in rows('location_names') if r['local_language_id'] == '9'}
species = {r['id']: int(r['species_id']) for r in rows('pokemon')}
names = {int(r['pokemon_species_id']): r['name'] for r in rows('pokemon_species_names') if r['local_language_id'] == '9'}
slots = {r['id']: r['encounter_method_id'] for r in rows('encounter_slots')}
methods = {r['id']: r['identifier'] for r in rows('encounter_methods')}
types = 'Normal Lutador Voador Venenoso Terrestre Pedra Inseto Fantasma Aço Fogo Água Planta Elétrico Psíquico Gelo Dragão Sombrio Fada'.split()
base_types = defaultdict(dict)
past_types = defaultdict(list)
for r in rows('pokemon_types'):
    base_types[r['pokemon_id']][r['slot']] = int(r['type_id'])
for r in rows('pokemon_types_past'):
    past_types[r['pokemon_id']].append((int(r['generation_id']), r['slot'], int(r['type_id'])))


def types_for(pokemon, generation):
    historical = [row for row in past_types[pokemon] if row[0] >= generation]
    first = min((row[0] for row in historical), default=None)
    slots = {slot: type_id for gen, slot, type_id in historical if gen == first} if first else base_types[pokemon]
    return [types[t - 1] for _, t in sorted(slots.items())]


location_paths = {}
for edition, (region, _) in groups.items():
    stages = paths[region] + (paths['sevii'] if edition in ('firered', 'leafgreen') else [])
    location_paths[edition] = {loc: row['id'] for row in stages for loc in row['locations']}

encounters = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))
for row in rows('encounters'):
    edition = version_ids.get(row['version_id'])
    if not edition:
        continue
    location, subarea = areas[row['location_area_id']]
    stage = location_paths[edition].get(location)
    if not stage:
        continue
    pokemon = row['pokemon_id']
    dex = species[pokemon]
    detail = encounters[edition][stage][(location, dex)]
    method = methods[slots[row['encounter_slot_id']]]
    key = (subarea, method)
    low, high = int(row['min_level']), int(row['max_level'])
    previous = detail.get(key, (low, high))
    detail[key] = (min(low, previous[0]), max(high, previous[1]))

output = {}
for edition, stages in encounters.items():
    output[edition] = {}
    generation = groups[edition][1]
    for stage, entries in stages.items():
        output[edition][stage] = [
            [location, english.get(location, location.replace('-', ' ').title()), dex, names[dex],
             types_for(str(dex), generation), [[sub, method, lo, hi] for (sub, method), (lo, hi) in sorted(detail.items())]]
            for (location, dex), detail in sorted(entries.items())
        ]

assert set(output) == set(groups)
(root / 'map-encounters.json').write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n',
                                         encoding='utf-8')
