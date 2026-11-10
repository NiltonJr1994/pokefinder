"""Import the missing item sprites from the supplied checklist files."""
from io import BytesIO
from pathlib import Path
from shutil import copyfile
from zipfile import ZipFile
import json
import re
import sys

from PIL import Image

source, atlas_path, coin, large_coin = map(Path, sys.argv[1:])
project = Path(__file__).resolve().parents[1]
sprites = project / 'assets/sprites'
data = project / 'src/data'
copyfile(coin, sprites / 'ref_coin.png')
copyfile(large_coin, sprites / 'ref_large_coin.png')

with ZipFile(source / 'Pokémon Checklist - Gold-Silver.zip') as archive:
    for name, asset in [('berry.png', 'ref_berry'), ('gold-berry.png', 'ref_gold_berry'), ('ss-ticket.png', 'ref_ss_ticket')]:
        member = next(item for item in archive.namelist() if Path(item).name == name)
        with Image.open(BytesIO(archive.read(member))) as image:
            image.convert('RGBA').save(sprites / (asset + '.png'))

with ZipFile(source / 'Pokémon Checklist - Yellow.zip') as archive:
    member = next(item for item in archive.namelist() if item.endswith('/pokemonCompletion.css'))
    css = archive.read(member).decode('utf-8')
with Image.open(atlas_path) as sheet:
    for icon, asset in [('Itemfinder', 'ref_item_finder'), ('X_Sp_Atk', 'ref_x_special')]:
        pattern = r'\.item-' + icon + r'\s*\{width:(\d+)px;\s*height:(\d+)px;\s*background-position:\s*-(\d+)px\s*-(\d+)px'
        width, height, x, y = map(int, re.search(pattern, css).groups())
        sheet.crop((x, y, x + width, y + height)).save(sprites / (asset + '.png'))

mapping = {
    'Coin': 'ref_coin', 'Large Coin': 'ref_large_coin', 'Item Finder': 'ref_item_finder',
    'S. S. Ticket': 'ref_ss_ticket', 'X Special': 'ref_x_special',
    'Gold Berry': 'ref_gold_berry',
}
for name in ('Berry', 'Bitter Berry', 'Burnt Berry', 'Ice Berry', 'Mint Berry', 'MiracleBerry',
             'MysteryBerry', 'PRZCureBerry', 'PSNCureBerry'):
    mapping[name] = 'ref_berry'

reference_path = data / 'reference.json'
reference = json.loads(reference_path.read_text(encoding='utf-8'))
for group in reference['items'].values():
    for item in group:
        if item['name'] in mapping and item['art'] == 'ref_item':
            item['art'] = mapping[item['name']]
reference_path.write_text(json.dumps(reference, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

manifest_path = data / 'images.ts'
manifest = manifest_path.read_text(encoding='utf-8')
new_entries = ''.join(f"  '{key}': require('../../assets/sprites/{key}.png'),\n"
                      for key in sorted(set(mapping.values())) if f"'{key}':" not in manifest)
manifest_path.write_text(manifest.replace('};\n', new_entries + '};\n', 1), encoding='utf-8')
