from pathlib import Path
from zipfile import ZipFile
from collections import defaultdict
import csv,io,re,json,unicodedata
p=Path('C:/Users/junio/Documents/Codex/PFProd45')
w=Path('work')
ref=p/'src/data/reference.json'
catalog=json.loads(ref.read_text(encoding='utf-8'))
def normal(s):
 s=''.join(c for c in unicodedata.normalize('NFD',s.upper()) if c.isascii() and c.isalnum())
 return {'PARLYZHEAL':'PARALYZEHEAL','ELIXER':'ELIXIR','MAXELIXER':'MAXELIXIR','SSANNE':'SSTICKET','ITEMFINDER':'ITEMFINDER'}.get(s,s)
def label(s):
 s=re.sub(r'([a-z])([A-Z])',r'\1 \2',s.replace('_',' '))
 return re.sub(r'\bMart\b','Poké Mart',s).strip()
def locadd(out,key,place):
 key=normal(key.removeprefix('ITEM_'))
 if place and place not in out[key]:out[key].append(place)
def legacy(prices_text,marts,red=False):
 prices={};shops=defaultdict(list)
 if red:
  for price,key in re.findall(r'bcd3\s+(\d+)\s*;\s*(\w+)',prices_text):prices[normal(key)]=int(price)
  for name,vals in re.findall(r'(?m)^(\w+)ClerkText::[^\n]*\n\s+script_mart ([^\n]+)',marts):
   if name.startswith('Unused'):continue
   for item in vals.split(';')[0].split(','):locadd(shops,item.strip(),label(name))
 else:
  for key,price in re.findall(r'; ([A-Z0-9_]+)\s*\n\s+item_attribute (\d+)',prices_text):prices[normal(key)]=int(price)
  for name,block in re.findall(r'(?ms)^Mart(\w+):\n(.*?)(?=^\w|\Z)',marts):
   for item in re.findall(r'(?m)^\s*db ([A-Z][A-Z_0-9]+)\b',block):
    city=re.sub(r'(?<=\d)F\d$','F',name.removesuffix('Dex'))
    locadd(shops,item,'Poké Mart · '+label(city))
 return prices,shops
def archive(g):
 return ZipFile(w/f'items-source-{g}.zip')
def extract(z,suffix):
 return z.read(next(n for n in z.namelist() if n.endswith('/'+suffix))).decode('utf8','replace')
with archive('red') as z: red=legacy(extract(z,'data/items/prices.asm'),extract(z,'data/items/marts.asm'),True)
crystal=legacy((w/'items-crystal-prices.asm').read_text(),(w/'items-crystal-marts.asm').read_text())
def gba(g):
 shops=defaultdict(list); found=defaultdict(list); prices={}
 with archive(g) as z:
  if g=='firered':
   prices={normal(row['itemId'].removeprefix('ITEM_')):row['price'] for row in json.loads(extract(z,'src/data/items.json'))['items']}
  else:
   for key,v in re.findall(r'\[ITEM_(\w+)\]\s*=\s*\{[^}]*?\.price\s*=\s*(\d+)',extract(z,'src/data/items.h'),re.S):prices[normal(key)]=int(v)
  for n in z.namelist():
   if '/data/maps/' not in n:continue
   city=n.split('/')[-2]
   if 'Unused' in city:continue
   if n.endswith('/scripts.inc'):
    s=z.read(n).decode('utf8','replace')
    pending=[]
    is_mart=False
    mart_labels=set(re.findall(r'(?m)^\s*pokemart\s+(\w+)',s))
    for line in s.splitlines():
     line=line.strip()
     match=re.match(r'\.(?:2byte|short)\s+ITEM_(\w+)',line)
     if line.endswith(':'):
      is_mart=line.rstrip(':') in mart_labels
      pending.clear()
     elif match and match[1]=='NONE' and is_mart:
      for item in pending:locadd(shops,item,label(city))
      pending.clear()
     elif match:
      pending.append(match[1])
     elif line.startswith('pokemartlistend'):
      for item in pending:
       if item!='NONE':locadd(shops,item,label(city))
      pending.clear()
     elif line and not line.startswith('@'):
      pending.clear()
    for item in re.findall(r'\bgiveitem ITEM_(\w+)',s):
     locadd(found,item,'Receba de um personagem em '+label(city))
   elif n.endswith('/map.json'):
    try:d=json.loads(z.read(n))
    except ValueError:continue
    for ev in d.get('bg_events',[]):
     if ev.get('type')=='hidden_item' and isinstance(ev.get('item'),str):
      locadd(found,ev['item'],'Escondido em '+label(city))
 return prices,shops,found
emerald=gba('emerald'); frlg=gba('firered')
with archive('hgss') as z:
 hprices={normal(row['item'].removeprefix('ITEM_')):int(row['price']) for row in csv.DictReader(io.StringIO(extract(z,'files/itemtool/itemdata/item_data.csv'))) if row['price'].isdigit()}
 hshops=defaultdict(list)
 for item,tier in re.findall(r'\{ ITEM_(\w+),\s*(\d+) \}',extract(z,'src/scrcmd_mart.c')):
  locadd(hshops,item,'Poké Mart · estoque conforme as insígnias')
hgss=(hprices,hshops)
manual={
 '1':{'BICYCLE':'Troque o Bike Voucher na Bike Shop de Cerulean City.','BIKEVOUCHER':'Receba do presidente do Pokémon Fan Club em Vermilion City.','MASTERBALL':'Receba do presidente da Silph Co. após derrotar Giovanni.'},
 '3':{'BICYCLE':'Receba na Bike Shop de Goldenrod City.','COINCASE':'Encontre no Goldenrod Underground.','SQUIRTBOTTLE':'Receba na floricultura de Goldenrod após vencer Whitney.','EXP SHARE':'Troque a Red Scale com Mr. Pokémon na Route 30.','MASTERBALL':'Receba do Professor Elm após obter as oito insígnias de Johto.','OLDROD':'Receba do pescador no Pokémon Center da Route 32.','GOODROD':'Receba do pescador em Olivine City.','SUPERROD':'Receba do pescador na Route 12, em Kanto.'},
 '6':{'ACROBIKE':'Escolha na loja de Rydel em Mauville City. Troque pelo Mach Bike quando precisar.','MACHBIKE':'Escolha na loja de Rydel em Mauville City. Troque pelo Acro Bike quando precisar.','EXP SHARE':'Entregue a carta a Steven e fale com o presidente da Devon em Rustboro.','MASTERBALL':'Recolha no Aqua Hideout antes de sair do esconderijo.','COINCASE':'Troque Harbor Mail com a moradora de Mauville City.','HEARTSCALE':'Procure em praias com o Itemfinder ou em Luvdisc selvagens.'},
 '7':{'COINCASE':'Receba do homem no restaurante de Celadon.','MASTERBALL':'Receba do presidente da Silph Co. após derrotar Giovanni.','BIKEVOUCHER':'Receba do presidente do Pokémon Fan Club em Vermilion City.','BICYCLE':'Troque o Bike Voucher na Bike Shop de Cerulean City.'},
 '10':{'BICYCLE':'Receba na Bike Shop de Goldenrod City.','EXP SHARE':'Troque a Red Scale com Mr. Pokémon na Route 30.','COINCASE':'Receba de Mr. Game no Game Corner.','MASTERBALL':'Receba do Professor Elm após obter as oito insígnias de Johto.','SQUIRTBOTTLE':'Receba na floricultura de Goldenrod após vencer Whitney.'},
}
for g,rows in catalog['items'].items():
 src={'1':red,'2':red,'3':crystal,'4':crystal,'6':emerald,'7':frlg,'10':hgss}[g]
 prices,shops=src[:2];found=src[2] if len(src)>2 else {}
 cur={normal(k):v for k,v in manual.get({'2':'1','4':'3'}.get(g,g),{}).items()}
 for row in rows:
  k=normal(row['name']); locations=list(shops.get(k,[]))
  if locations and prices.get(k,0)>0:row['price']=prices[k]
  entries=([cur[k]] if k in cur else [])+list(found.get(k,[]))
  if locations:entries.append('Compra: '+', '.join(locations[:5])+(' e outras lojas.' if len(locations)>5 else '.'))
  if row['location'] and row['location'] not in ('Diversos locais','Diversas lojas'):entries.extend(row['location'].splitlines())
  row['location']='\n'.join(dict.fromkeys(entries))
 print(g,sum('price'in row for row in rows),sum(bool(row['location']) for row in rows))
ref.write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
