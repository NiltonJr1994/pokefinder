"""Rebuild spatial corrections from reference facts; never scatter unverified pins.
Input: JSON exported by scripts/export-map-atlases.cjs BEFORE applying corrections.
Reference coordinates use Leaflet CRS.Simple. Yellow full.png starts 28 logical
pixels below its tiles. Crystal/Emerald use the same origin for both images.
"""
import json, math, re, sys, unicodedata
from collections import Counter
from functools import lru_cache
from PIL import Image
from pathlib import Path
root=Path(__file__).resolve().parents[1]
ref=json.loads((root/'src/data/map-reference.json').read_text(encoding='utf-8'))
atlases=json.loads((Path(sys.argv[1]) if len(sys.argv)>1 else root/'scripts/map-coordinate-input.json').read_text(encoding='utf-8'))
def repair(s):
    for _ in range(2):
        try:
            t=s.encode('latin1').decode('utf8')
            if t==s:break
            s=t
        except (UnicodeError,AttributeError):break
    return s
def norm(s):
    s=repair(s)
    return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip()
def xy(p,game): return [p[1],-p[0]+ref[game]['offsetY']]
@lru_cache(maxsize=192)
def tile_image(game,x,y):
    return Image.open(root/f'assets/map-regions/{game}_high_{x}_{y}.webp').convert('RGB')
def on_map(pos,game):
    x,y=pos;tx=int(x//128)*128;ty=int(y//128)*128
    if x<0 or y<0:return False
    try:im=tile_image(game,tx,ty)
    except FileNotFoundError:return False
    px=round((x-tx)*6);py=round((y-ty)*6)
    return any(max(im.getpixel((xx,yy)))>25 for xx in range(max(0,px-3),min(im.width,px+4)) for yy in range(max(0,py-3),min(im.height,py+4)))
def distance(a,b):return math.hypot(a[0]-b[0],a[1]-b[1])
def positions(e,game):
    ps=e.get('pos',[])
    return [xy(p,game) for p in (ps if isinstance(ps[0],list) else [ps])] if ps else []
def cleanplace(s):
    s=re.sub(r'^(kanto|johto|hoenn) (sea )?','',norm(s)); s=re.sub(r'^sea route ', 'route ', s)
    return {'kanto safari zone':'safari zone','safari zone':'safari zone','tin tower':'bell tower','mt silver':'silver cave','victory road 1':'victory road','victory road 2':'victory road'}.get(s,s)
def loc_for(place,game):
    n=cleanplace(place)
    for l in ref[game]['locations']:
        if n in [cleanplace(l['name']),*[cleanplace(a) for a in l.get('alias',[])]]:return l
    return None

def zone_for(target,game):
    # Compare encounter communities, rather than assuming map labels are spawn tiles.
    aliases=[norm(target['name']),*[norm(a) for a in target.get('alias',[])]]
    def mentions(e):return any(re.search(r'(?<![a-z0-9])'+re.escape(a)+r'(?![a-z0-9])',norm(e.get('location',''))) for a in aliases)
    expected={e['id'] for e in ref[game]['events'] if e['category']=='pokemon' and mentions(e)}
    groups={}
    for e in ref[game]['events']:
        if e['category']!='pokemon':continue
        for p in positions(e,game):groups.setdefault(tuple(p),set()).add(e['id'])
    center=xy(target['pos'],game)
    if not expected:return None
    scored=[((len(ids&expected)/len(ids|expected))-.00035*distance(p,center),p) for p,ids in groups.items() if ids&expected]
    return list(max(scored)[1]) if scored else None
# Names refer to actual rewards or trainers whose map coordinates are recorded.
leaders={'pewter':'Brock','cerulean':'Misty','vermilion':'LtSurge','celadon':'Erika','fuchsia':'Koga','saffron':'Sabrina','cinnabar':'Blaine','badge8':'Giovanni','violet':'Falkner','azalea':'Bugsy','goldenrod':'Whitney','ecruteak':'Morty','cianwood':'Chuck','jasmine':'Jasmine','mahogany':'Pryce','blackthorn':'Clair','kanto-surge':'LtSurge','kanto-sabrina':'Sabrina','kanto-erika':'Erika','kanto-janine':'Janine','kanto-misty':'Misty','kanto-brock':'Brock','kanto-blaine':'Blaine','kanto-blue':'Blue','rustboro':'Roxanne','dewford':'Brawly','mauville':'Wattson','lavaridge':'Flannery','norman':'Norman','fortree':'Winona','mossdeep':'Tate and Liza','sootopolis':'Juan','league':'Rival #8','johto-league':'Champion','ever-grande':'Champion Wallace','silver':'Red'}
rewards={'pallet':'Pikachu','viridian':"Oak's Parcel",'tower':'Poke Flute','cerulean-cave':'Mewtwo','new-bark':'Cyndaquil','cherrygrove':'Mystery Egg','ilex':'HM01','olivine':'SecretPotion','radio':'Clear Bell','littleroot':'Treecko','oldale':'Poke Ball','petalburg':'Wally','slateport':'Devon Goods','fallarbor':'Meteorite','lilycove':'Master Ball'}
aliases={'Oak’s Parcel':"Oak's Parcel",'SecretPotion':'Secret Potion','Coin':'10 coins','HM01 · Cut':'HM01','HM03 · Surf':'HM03','HM05 · Flash':'HM05','HM06 · Rock Smash':'HM06','HM08 · Dive':'HM08','Professor Oak':'Pikachu','Daisy':'Town Map','Atendente do Poké Mart':"Oak's Parcel",'Bill':'S.S. Ticket','Capitão do S.S. Anne':'HM01','Mr. Fuji':'Poke Flute','Professor Elm':'Cyndaquil','Mr. Pokémon':'Mystery Egg','Kurt':'Kurt','Jasmine':'Jasmine','Professor Birch':'Treecko','Wally':'Wally','Homem do restaurante':'Coin Case'}
forced_places={'Bill':'Route 25','Capitão do S.S. Anne':'S.S. Anne','Jasmine':'Glitter Lighthouse','Mr. Pokémon':'Route 30','Professor Birch':'Route 101','SecretPotion':'Cianwood City','Coin':'Celadon City Game Corner'}
pilot_ids={'pallet-oak','pallet-pikachu','pallet-daisy','pallet-town-map','pallet-pc-potion','pallet-dex','route1-pidgey','route1-rattata','route1-clerk','route1-potion','route1-viridian','celadon-eevee','celadon-restaurant','celadon-coin-case','celadon-tm41','celadon-game-corner'}
output={}; audit=[]
for version,atlas in atlases.items():
    game=atlas['regional']['regional']; source=ref[game]; placements={}; areas={}
    for area in atlas['areas']:
        if area.get('regional','game').startswith('sevii'):
            areas[area['id']]={'old':area.get('backdrop'),'rect':area.get('backdrop')}
            continue
        stagepoints=[p for p in atlas['points'] if p['area']==area['id']]
        for p in stagepoints:
            target=loc_for(p['place'],game) or loc_for(area['title'],game)
            title=p['title']; candidates=[]; kind='exact'
            if version=='yellow' and p['id'] in pilot_ids:
                placements[p['id']]={'pos':[p['x']/8,p['y']/8],'kind':'exact','reference':'reviewed-pilot'};continue
            if p.get('encounters'):
                target=loc_for(p['place'],game)
                # A wild encounter is an AREA, not a promise of a fixed spawn tile.
                if target:
                    center=zone_for(target,game) or xy(target['pos'],game); species_events=[e for e in source['events'] if e['category']=='pokemon' and str(e.get('id'))==str(p.get('species'))]
                    pools=species_events or [e for e in source['events'] if e['category']=='pokemon']
                    candidates=[(distance(pos,center),pos,e) for e in pools for pos in positions(e,game)]
                    candidates=[c for c in candidates if c[0]<=50]
                    if not candidates: candidates=[(0,center,{'uid':'area:'+target['name']})]
                    if not on_map(center,game):candidates=[]
                    kind='encounter'
            else:
                name=aliases.get(title,title)
                if p['id'].endswith('-story'):name=leaders.get(area['id'],rewards.get(area['id'],''))
                if p['id']=='pallet-dex':name='Pikachu'
                if p['id']=='route1-viridian':name='Potion';target=loc_for('Route 1',game)
                if p['id']=='cherrygrove-item-0':target=loc_for('Route 30',game)
                if title=='Mr. Fuji':target=loc_for('Lavender Town',game)
                if p['id']=='fuchsia-item-0':target=loc_for('Safari Zone',game)
                if title=='Steven': name='Devon Scope' if area['id']=='fortree' else 'TM47'
                expected=norm(name).replace('poke ','poke').replace('lt surge','ltsurge')
                for e in source['events']:
                    actual=norm(e['name']).replace('poke ','poke').replace('lt surge','ltsurge')
                    if not expected or not (actual==expected or actual.replace(' ','')==expected.replace(' ','') or actual.startswith(expected+' ') or (expected.startswith('hm') and actual.startswith(expected))):continue
                    if p['category']=='objective' and area['id'] in leaders and e['category']!='battle':continue
                    if p['category']=='item' and e['category'] not in ['item','itemInMap','itemGift']:continue
                    # Hidden items must match hidden entries, not the first purchasable copy.
                    if p.get('hidden') and not ('hidden' in norm(e.get('location','')) or e['category']=='itemInMap'):continue
                    if p.get('hidden') and area['id']=='rustboro' and 'petalburg woods' not in norm(e.get('location','')):continue
                    if p.get('hidden') and area['id']=='viridian' and 'viridian city' not in norm(e.get('location','')):continue
                    desired=loc_for(forced_places.get(title,''),game) or target
                    loc=norm(e.get('location',''))
                    match=desired and any(norm(n) in loc for n in [desired['name'],*desired.get('alias',[])])
                    if not match and p['category']!='objective':continue
                    for pos in positions(e,game):
                        score=distance(pos,xy(desired['pos'],game)) if desired else 0
                        if match:score-=1000
                        candidates.append((score,pos,e))
            if game=='yellow' and area['id']=='league' and p['id'].endswith('-story'):
                candidates=[(0,[20.5,54.0],{'uid':'reviewed-image-champion'})]
            candidates=[c for c in candidates if on_map(c[1],game)]
            if candidates:
                candidates.sort(key=lambda c:c[0]);_,pos,event=candidates[0]
                # Events in remakes use different layouts: do not transfer a tile from another game.
                if kind=='exact' and version not in [game,'red','blue','gold','silver']:
                    audit.append([version,p['id'],'different-edition-layout']);continue
                placements[p['id']]={'pos':[round(pos[0],4),round(pos[1],4)],'kind':kind,'reference':str(event.get('uid',''))}
            else:audit.append([version,p['id'],'no-verified-coordinate'])
        # World bounds include every verified point, including the adjacent routes/interiors.
        old=area.get('backdrop')
        if not old:
            old={'x':area['x']/8,'y':area['y']/8,'width':area['width']/8,'height':area['height']/8}
        ps=[v['pos'] for k,v in placements.items() if any(p['id']==k for p in stagepoints)]
        bounds=[[old['x'],old['y']],[old['x']+old['width'],old['y']+old['height']],*ps]
        minx=min(p[0] for p in bounds)-6;maxx=max(p[0] for p in bounds)+6;miny=min(p[1] for p in bounds)-6;maxy=max(p[1] for p in bounds)+6
        # Preserve the 480:430 viewport aspect ratio so geography is never stretched.
        w=max(maxx-minx,(maxy-miny)*480/430);h=w*430/480
        x=max(0,min((minx+maxx-w)/2,atlas['regional']['width']-w));y=max(0,min((miny+maxy-h)/2,atlas['regional']['height']-h))
        areas[area['id']]={'old':old,'oldFrame':{k:area[k] for k in ['x','y','width','height']},'rect':dict(x=round(x,4),y=round(y,4),width=round(w,4),height=round(h,4))}
    output[version]={'areas':areas,'points':placements}
(root/'src/data/map-corrections.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
(root/'scripts/map-coordinate-audit.json').write_text(json.dumps({'unmapped':audit,'mapped':{v:len(d['points']) for v,d in output.items()}},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('mapped', {v:len(d['points']) for v,d in output.items()});print('unmapped',Counter(a[0] for a in audit))
