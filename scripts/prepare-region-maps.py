"""Tile the supplied regional maps and calibrate stage pins from saved Leaflet labels."""
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
import html
import json
import re
import sys
from PIL import Image

project = Path(__file__).resolve().parents[1]
directory = Path(sys.argv[1])
output = project / 'assets/map-regions'
output.mkdir(exist_ok=True)
Image.MAX_IMAGE_PIXELS = 150_000_000

calibration = {
    'yellow': ('Yellow', 8, 92, 129),
    'crystal': ('Crystal', 16, 102, 5),
    'emerald': ('Emerald', 16, 92, 51),
}
label_pattern = re.compile(r'<div class="leaflet-marker-icon mapLabel[^>]*translate3d\((-?\d+)px, (-?\d+)px, 0px\)[^>]*>'
                           r'<span[^>]*>([^<]+)</span>')
maps = []
metadata = {}
for key, (edition, factor, left, top) in calibration.items():
    with ZipFile(next(directory.glob(f'*{edition}.zip'))) as archive:
        markup = archive.read(next(n for n in archive.namelist() if '/' not in n and n.endswith('.html'))).decode('utf-8')
        raw = Path(sys.argv[2]) if key == 'emerald' else BytesIO(archive.read(next(n for n in archive.namelist() if n.endswith('/full.png'))))
        with Image.open(raw) as source:
            width, height = source.width // factor, source.height // factor
            meta = {'width': width, 'height': height, 'labels': {}}
            for x, y, name in label_pattern.findall(markup):
                x, y = int(x) - left, int(y) - top
                if 0 <= x <= width and 0 <= y <= height:
                    meta['labels'][html.unescape(name).strip()] = [x, y]
            assert len(meta['labels']) > 30, (key, len(meta['labels']))
            metadata[key] = meta
            for level, sample in [('low', 1), ('high', 3)]:
                maps.append(f'  {key}_{level}: [')
                for y in range(0, height, 256):
                    for x in range(0, width, 256):
                        w, h = min(width - x, 256), min(height - y, 256)
                        tile = source.crop((x * factor, y * factor, (x + w) * factor, (y + h) * factor))
                        tile = tile.convert('RGBA').resize((w * sample, h * sample), Image.Resampling.NEAREST)
                        filename = f'{key}_{level}_{x}_{y}.webp'
                        tile.save(output / filename, lossless=False, quality=83, method=4)
                        maps.append(f"    {{ x: {x}, y: {y}, width: {w}, height: {h}, image: require('../../assets/map-regions/{filename}') }},")
                maps.append('  ],')

(project / 'src/data/region-maps.json').write_text(json.dumps(metadata, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
(project / 'src/data/region-tiles.ts').write_text(
    'type Tile = { x: number; y: number; width: number; height: number; image: number };\n'
    'export const regionTiles: Record<string, Tile[]> = {\n' + '\n'.join(maps) + '\n};\n', encoding='utf-8')
