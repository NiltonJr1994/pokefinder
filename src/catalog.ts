import catalogData from './data/catalog.json';
import referenceData from './data/reference.json';
import legacyData from './data/legacy_codes.json';
import learnsetData from './data/learnsets.json';
import matchupData from './data/type-matchups.json';

export type Edition = { title: string; version: string; group: number; region?: 'kanto' | 'johto' };
export const editions: Edition[] = [
  { title: 'Yellow', version: 'yellow', group: 2, region: 'kanto' },
  { title: 'Red', version: 'red', group: 1, region: 'kanto' },
  { title: 'Blue', version: 'blue', group: 1, region: 'kanto' },
  { title: 'Gold', version: 'gold', group: 3, region: 'johto' },
  { title: 'Silver', version: 'silver', group: 3, region: 'johto' },
  { title: 'Crystal', version: 'crystal', group: 4 },
  { title: 'FireRed', version: 'firered', group: 7 },
  { title: 'LeafGreen', version: 'leafgreen', group: 7 },
  { title: 'Emerald', version: 'emerald', group: 6 },
  { title: 'HeartGold', version: 'heartgold', group: 10 },
  { title: 'SoulSilver', version: 'soulsilver', group: 10 },
];

export const sections = {
  codes: 'Códigos', items: 'Itens', tms: 'TMs', hms: 'HMs', tips: 'Dicas',
  guides: 'Detonados', dex: 'Pokédex', help: 'Como usar', cheats: 'Como inserir cheats',
  updates: 'Atualizações', credits: 'Créditos', settings: 'Configurações', journal: 'Mapa e Diário',
};
export type Section = keyof typeof sections;
export const sectionKeys = Object.keys(sections) as Section[];
export const upcomingEditions = [
  ['Green','green'], ['Ruby','ruby'], ['Sapphire','sapphire'], ['Diamond','diamond'], ['Pearl','pearl'],
  ['Platinum','platinum'], ['Black','black'], ['White','white'], ['Black 2','black2'], ['White 2','white2'],
  ['X','x'], ['Y','y'], ['Omega Ruby','omegaruby'], ['Alpha Sapphire','alphasapphire'], ['Sun','sun'],
  ['Moon','moon'], ['Let’s Go, Pikachu!','letsgopikachu'], ['Let’s Go, Eevee!','letsgoeevee'], ['GO','go'], ['XD','xd'],
];

export function pokemonSize(pokemon: Pick<Pokemon, 'id' | 'height' | 'weight'>) {
  if (pokemon.id === 10 || pokemon.id === 11) return 1;
  if (pokemon.id === 3 || pokemon.height >= 1.65 || pokemon.weight >= 85) return 3;
  if (pokemon.id === 2 || pokemon.id === 12 || pokemon.height >= .85 || pokemon.weight >= 26) return 2;
  return pokemon.height <= .3 && pokemon.weight < 4 ? 0 : 1;
}

export function available(section: Section, edition: Edition) {
  if (section === 'codes') return edition.group !== 3;
  if (section === 'guides') return Boolean(edition.region);
  if (section === 'dex') return Boolean(edition.region) || edition.version === 'crystal';
  return true;
}

export type Entry = {
  id: string; title: string; body: string; category: string; code: string; format?: string;
  aliases?: string; masterCode?: string; source?: string; sourceUrl?: string; warning?: string;
};
export type Item = { name: string; effect: string; category: string; location: string; art: string };
export type Machine = { code: string; move: string; type: string; location: string; art: string; learners: [number, string][] };
export type Pokemon = {
  id: number; name: string; height: number; weight: number; types: string[]; kantoTypes: string[];
  stats: number[]; kantoStats: number[]; family: number[]; locations: Record<string, string[]>;
  yellowObtaining?: string;
};
type EntrySection = 'codes' | 'tips' | 'guides';
type BundledEntry = Pick<Entry, 'title' | 'body' | 'category'> & { code?: string };
const catalog = catalogData as { dex: Pokemon[] } & Record<EntrySection, Record<string, BundledEntry[]>>;
const reference = referenceData as unknown as { items: Record<string, Item[]>; machines: Record<string, Machine[]> };
export const byId = new Map(catalog.dex.map(pokemon => [pokemon.id, pokemon]));
const kantoDex = catalog.dex.filter(pokemon => pokemon.id <= 151);
const codeSources = new Map<string, [string, string]>();
const legacyByGame = new Map<string, Entry[]>();

for (const row of legacyData) {
  const entry = {
    id: row.id, title: row.name, body: [row.itemEffect, row.activation, row.notes].filter(Boolean).join('\n\n'),
    category: row.category, code: row.codes.join('\n'),
    format: [row.codeType, row.region, row.version].filter(Boolean).join(' · '),
    aliases: row.aliases.join(' '), masterCode: row.masterCodes.join('\n'),
    source: row.source, sourceUrl: row.sourceUrl, warning: row.catalogNotice,
  };
  if (entry.source) codeSources.set(JSON.stringify([entry.source, entry.sourceUrl]), [entry.source, entry.sourceUrl ?? '']);
  for (const game of row.games) {
    const entries = legacyByGame.get(game) ?? [];
    entries.push(entry);
    legacyByGame.set(game, entries);
  }
}

export const legacyCredits = [...codeSources.values()].sort(([a], [b]) => a.localeCompare(b));
export const searchKey = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
export const dexNumber = (id: number) => '#' + String(id).padStart(3, '0');
export const spriteKey = (id: number) => 'pk_' + String(id).padStart(3, '0');
export const typesIn = (pokemon: Pokemon, edition: Edition) => edition.region === 'kanto' ? pokemon.kantoTypes : pokemon.types;
const matchups = matchupData as Record<string, Record<string, Record<string, number>>>;
export function defensiveMatchups(pokemon: Pokemon, edition: Edition) {
  const chart = matchups[edition.region === 'kanto' ? '1' : '2'];
  return Object.keys(chart).map(type => ({
    type, multiplier: typesIn(pokemon, edition).reduce((factor, defense) => factor * (chart[defense]?.[type] ?? 1), 1),
  }));
}
export const pokemonFor = (edition: Edition) => !available('dex', edition) ? [] : edition.region === 'kanto' ? kantoDex : catalog.dex;
export const itemsFor = (edition: Edition) => reference.items[edition.group] ?? [];
export const machinesFor = (edition: Edition, section: 'tms' | 'hms') =>
  (reference.machines[edition.group] ?? []).filter(machine => machine.code.startsWith(section === 'hms' ? 'HM' : 'TM'));
export const machineGames = (edition: Edition) => editions.filter(game => game.group === edition.group).map(game => game.title).join(' · ');

const learnsets = learnsetData as {
  names: Record<number, string[]>;
  machineMoves: Record<string, number>;
  parents: Record<number, number>;
  groups: Record<number, Record<number, Record<number, number[][]>>>;
};
export type MoveMethod = 'level' | 'tm' | 'hm' | 'egg' | 'tutor' | 'stadium';
export type LearnedMove = { id: number; method: MoveMethod; level?: number; code?: string; from?: string };
const moveMethods: Record<number, MoveMethod> = { 1: 'level', 2: 'egg', 3: 'tutor', 5: 'stadium' };
const moveLanguage: Record<string, number> = { en: 0, es: 1, ja: 2, 'zh-Hans': 3, 'pt-BR': 4, 'pt-PT': 4 };
export function moveName(id: number, language: string) {
  const names = learnsets.names[id];
  return names[moveLanguage[language]] || names[0];
}

export function movesFor(pokemonId: number, edition: Edition) {
  const game = learnsets.groups[edition.group];
  const direct: LearnedMove[] = [];
  const inherited: LearnedMove[] = [];
  if (!game?.[pokemonId]) return { direct, inherited };
  const seen = new Set<number>();
  for (let dex = pokemonId; game[dex]; dex = learnsets.parents[dex]) {
    const moves: LearnedMove[] = [];
    for (const [method, rows] of Object.entries(game[dex])) {
      for (const [id, level] of rows) moves.push({ id, method: moveMethods[Number(method)], level });
    }
    for (const machine of reference.machines[edition.group] ?? []) {
      if (machine.learners.some(([id]) => id === dex)) {
        moves.push({ id: learnsets.machineMoves[machine.move], method: machine.code.startsWith('HM') ? 'hm' : 'tm', code: machine.code });
      }
    }
    for (const move of moves) {
      if (dex === pokemonId) direct.push(move);
      else if (!seen.has(move.id)) inherited.push({ ...move, from: byId.get(dex)?.name });
    }
    for (const { id } of moves) seen.add(id);
  }
  return { direct, inherited };
}

export function entriesFor(section: EntrySection, edition: Edition): Entry[] {
  const shared = section === 'tips'
    ? ({ 4: 'johto', 7: 'firered-leafgreen', 10: 'heartgold-soulsilver' } as Record<number, string>)[edition.group] ?? edition.region
    : edition.region;
  const keys = section === 'codes' ? [edition.version] : ['all', shared, edition.version];
  const bundled = keys.flatMap(key => !key ? [] : (catalog[section][key] ?? []).map(row => ({
    ...row, id: section.toUpperCase() + '/' + key + '/' + row.title,
    code: row.code ?? '', format: row.code ? 'GameShark · USA' : '',
  })));
  return section === 'codes' ? [...(legacyByGame.get('Pokémon ' + edition.title) ?? []), ...bundled] : bundled;
}

export function oneEditApart(first: string, second: string) {
  if (second.length < 4 || Math.abs(first.length - second.length) > 1) return false;
  const [shorter, longer] = first.length <= second.length ? [first, second] : [second, first];
  let mismatch = 0;
  while (mismatch < shorter.length && shorter[mismatch] === longer[mismatch]) mismatch++;
  return mismatch === shorter.length ||
    shorter.slice(mismatch + Number(shorter.length === longer.length)) === longer.slice(mismatch + 1);
}
