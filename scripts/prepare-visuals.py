from pathlib import Path
import json
import sys
import zipfile

from PIL import Image, ImageSequence

project = Path(__file__).resolve().parents[1]
assets = project / 'assets'
data = project / 'src/data'

bounds = {}
for path in sorted((assets / 'dex-gifs').glob('*/*.gif')):
    with Image.open(path) as gif:
        frames = [frame.convert('RGBA').getbbox() for frame in ImageSequence.Iterator(gif)]
        visible = [box for box in frames if box is not None]
        if not visible:
            raise ValueError(f'Empty animation: {path}')
        bounds[f'{path.parent.name}/{path.stem}'] = [
            min(box[0] for box in visible), min(box[1] for box in visible),
            max(box[2] for box in visible), max(box[3] for box in visible),
        ]
(data / 'gif-bounds.json').write_text(json.dumps(bounds, separators=(',', ':')) + '\n', encoding='utf-8')

if len(sys.argv) == 2:
    logos = assets / 'game-logos'
    logos.mkdir(exist_ok=True)
    mapping = []
    with zipfile.ZipFile(sys.argv[1]) as archive:
        for name in sorted(archive.namelist()):
            path = Path(name)
            if path.name != name or path.suffix != '.png' or name.startswith('the_series'):
                continue
            with archive.open(name) as source, Image.open(source) as image:
                rgba = image.convert('RGBA')
                rgba = rgba.crop(rgba.getbbox())
                rgba.thumbnail((280, 128), Image.Resampling.LANCZOS)
                rgba.save(logos / name, optimize=True)
            key = path.stem.replace('_', '')
            mapping.append(f"  '{key}': require('../../assets/game-logos/{name}'),\n")
    (data / 'game-logos.ts').write_text(
        'export const gameLogos: Record<string, number> = {\n' + ''.join(mapping) + '};\n', encoding='utf-8',
    )
