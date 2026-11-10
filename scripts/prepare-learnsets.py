"""Build the offline Pokédex learnsets from PokéAPI CSVs and the bundled machine catalog."""
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

project = Path(__file__).resolve().parents[1]
data = project / 'src/data'
source = Path(sys.argv[1])


def rows(name):
    path = source / f'{name}.csv'
    with (path if path.exists() else source / f'ref-{name}.csv').open(encoding='utf-8-sig', newline='') as file:
        yield from csv.DictReader(file)


catalog = json.loads((data / 'catalog.json').read_text(encoding='utf-8'))
machines = json.loads((data / 'reference.json').read_text(encoding='utf-8'))['machines']
species = {row['id'] for row in catalog['dex']}
groups = {1: 151, 2: 151, 3: 251, 4: 251, 6: 386, 7: 386, 10: 493}
parents = {int(row['id']): int(row['evolves_from_species_id']) for row in rows('pokemon_species')
           if row['evolves_from_species_id'] and int(row['id']) in species}
language_columns = (9, 7, 11, 12, 13)
translations = defaultdict(dict)
for row in rows('move_names'):
    translations[int(row['move_id'])][int(row['local_language_id'])] = row['name']

learnsets = {group: {dex: defaultdict(list) for dex in sorted(species) if dex <= limit}
             for group, limit in groups.items()}
machine_codes = {(int(row['version_group_id']), int(row['move_id'])): int(row['machine_number'])
                 for row in rows('machines')}
compatibility = defaultdict(set)
seen_moves = set()
for row in rows('pokemon_moves'):
    dex, group, move, method, level = (int(row[key]) for key in
        ('pokemon_id', 'version_group_id', 'move_id', 'pokemon_move_method_id', 'level'))
    if group not in learnsets or dex not in learnsets[group]:
        continue
    if method == 4:
        number = machine_codes[group, move]
        prefix = 'HM' if number > 100 else 'TM'
        compatibility[group, f'{prefix}{number % 100:02}'].add(dex)
        continue
    if method not in (1, 2, 3, 5):
        continue
    order = int(row['order'] or 0)
    learnsets[group][dex][method].append((level, order, move))
    seen_moves.add(move)

# Machines already include the compatibility chart. Store each move name once.
english_ids = {names[9]: move for move, names in translations.items() if 9 in names}
for group, limit in groups.items():
    for row in machines[str(group)]:
        assert compatibility[group, row['code']] <= {dex for dex, _ in row['learners'] if dex <= limit}, (group, row['code'])
machine_moves = {name: english_ids[name] for group in groups for name in
                 (row['move'] for row in machines[str(group)])}
seen_moves.update(machine_moves.values())
output = {
    'names': {move: [translations[move].get(language, '') for language in language_columns]
              for move in sorted(seen_moves)},
    'machineMoves': machine_moves,
    'parents': parents,
    'groups': {
        group: {dex: {method: [[move, level] for level, _, move in sorted(entries)]
                      for method, entries in sorted(methods.items())}
                for dex, methods in entries_by_species.items()}
        for group, entries_by_species in learnsets.items()
    },
}
assert all(methods.get(1) for group in (1, 2, 3, 4) for methods in learnsets[group].values())
(data / 'learnsets.json').write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n',
                                    encoding='utf-8')
