import routes from './data/map-routes.json';
import encounterData from './data/map-encounters.json';
import regionData from './data/region-maps.json';
import { editions, itemsFor, machinesFor } from './catalog';

export const areas = [
  { id: 'pallet', title: 'Pallet Town', x: 1496, y: 4256, width: 360, height: 320 },
  { id: 'route1', title: 'Route 1', x: 1528, y: 3664, width: 304, height: 600 },
  { id: 'celadon', title: 'Celadon City', x: 3088, y: 2256, width: 880, height: 568 },
] as const;
export type Area = { id: string; title: string; x: number; y: number; width: number; height: number; illustrated?: boolean; regional?: string; backdrop?: { x: number; y: number; width: number; height: number } };
export type AreaId = string;
export const categories = {
  pokemon: 'Pokémon', item: 'Itens', npc: 'NPCs', objective: 'Objetivos',
};
export type Category = keyof typeof categories;
export const categoryKeys = Object.keys(categories) as Category[];
export const statuses = {
  pokemon: ['A buscar', 'Visto', 'Capturado'],
  item: ['A buscar', 'Coletado'],
  npc: ['A procurar', 'Encontrado'],
  objective: ['A fazer', 'Em andamento', 'Concluído'],
};

export type Point = {
  id: string; area: AreaId; category: Category; title: string; place: string; description: string;
  x: number; y: number; requirement?: string; species?: number; art?: string; spoiler?: boolean;
  hidden?: boolean; types?: string[]; encounters?: { method: string; subarea: string; low: number; high: number }[];
};
export const points: Point[] = [
  { id: 'pallet-oak', area: 'pallet', category: 'npc', title: 'Professor Oak', place: 'Laboratório do Professor Oak',
    x: 1712, y: 4440, description: 'Encontre o Professor Oak para começar a jornada.' },
  { id: 'pallet-pikachu', area: 'pallet', category: 'pokemon', title: 'Pikachu', place: 'Laboratório do Professor Oak',
    x: 1712, y: 4440, species: 25, description: 'Pokémon inicial recebido do Professor Oak em Yellow.' },
  { id: 'pallet-daisy', area: 'pallet', category: 'npc', title: 'Daisy', place: 'Casa do rival',
    x: 1736, y: 4344, description: 'Converse com a irmã do rival para receber o mapa após obter a Pokédex.' },
  { id: 'pallet-town-map', area: 'pallet', category: 'item', title: 'Town Map', place: 'Casa do rival',
    x: 1736, y: 4344, art: 'ref_town_map', description: 'Daisy entrega o mapa da região.',
    requirement: 'Obter a Pokédex.' },
  { id: 'pallet-pc-potion', area: 'pallet', category: 'item', title: 'Potion', place: 'Casa do jogador · computador',
    x: 1592, y: 4352, art: 'ref_potion', description: 'Retire a Potion armazenada no computador do quarto.' },
  { id: 'pallet-dex', area: 'pallet', category: 'objective', title: 'Receber a Pokédex', place: 'Laboratório do Professor Oak',
    x: 1712, y: 4440, description: 'Volte ao laboratório para entregar a encomenda do Poké Mart.',
    requirement: 'Buscar a encomenda em Viridian City.' },
  { id: 'route1-pidgey', area: 'route1', category: 'pokemon', title: 'Pidgey', place: 'Grama alta',
    x: 1736, y: 4064, species: 16, description: 'Encontro selvagem na grama alta da Route 1.' },
  { id: 'route1-rattata', area: 'route1', category: 'pokemon', title: 'Rattata', place: 'Grama alta',
    x: 1736, y: 4064, species: 19, description: 'Encontro selvagem na grama alta da Route 1.' },
  { id: 'route1-clerk', area: 'route1', category: 'npc', title: 'Funcionário do Poké Mart', place: 'Route 1',
    x: 1608, y: 4088, description: 'O funcionário conversa sobre o Poké Mart e oferece uma amostra.' },
  { id: 'route1-potion', area: 'route1', category: 'item', title: 'Potion', place: 'Route 1 · amostra do Poké Mart',
    x: 1608, y: 4088, art: 'ref_potion', description: 'Converse com o funcionário do Poké Mart para receber a Potion.' },
  { id: 'route1-viridian', area: 'route1', category: 'objective', title: 'Chegar a Viridian City', place: 'Saída norte da Route 1',
    x: 1664, y: 3696, description: 'Siga pela Route 1 até a cidade e procure o Poké Mart.' },
  { id: 'celadon-eevee', area: 'celadon', category: 'pokemon', title: 'Eevee', place: 'Prédio de Celadon · acesso pelos fundos',
    x: 3512, y: 2320, species: 133, description: 'Eevee é um presente encontrado no prédio de Celadon.' },
  { id: 'celadon-restaurant', area: 'celadon', category: 'npc', title: 'Homem do restaurante', place: 'Restaurante de Celadon',
    x: 3624, y: 2680, description: 'Converse com o homem no restaurante para obter a Coin Case.' },
  { id: 'celadon-coin-case', area: 'celadon', category: 'item', title: 'Coin Case', place: 'Restaurante de Celadon',
    x: 3624, y: 2680, art: 'ref_coin_case', description: 'Recipiente usado para guardar moedas do Game Corner.',
    requirement: 'Falar com o homem dentro do restaurante.' },
  { id: 'celadon-tm41', area: 'celadon', category: 'item', title: 'TM41 · Softboiled', place: 'Área da lagoa',
    x: 3480, y: 2504, art: 'ref_tm_normal', description: 'Procure o NPC do outro lado da água.',
    requirement: 'Poder usar Surf fora de batalha.' },
  { id: 'celadon-game-corner', area: 'celadon', category: 'objective', title: 'Investigar o Game Corner', place: 'Rocket Game Corner',
    x: 3600, y: 2520, description: 'Procure uma passagem ligada ao esconderijo da Equipe Rocket.',
    requirement: 'Investigar a área do pôster após lidar com o guarda.', spoiler: true },
];

type Stage = { id: string; title: string; locations: string[]; goal: string; how: string; items: (string | boolean)[][]; npcs?: string[][] };
type Encounter = [string, string, number, string, string[], [string, string, number, number][]];
const wild = encounterData as unknown as Record<string, Record<string, Encounter[]>>;
const atlases = new Map<string, ReturnType<typeof buildAtlas>>();
const regionalData = regionData as Record<string, { width: number; height: number; labels: Record<string, number[]> }>;
const landmarks: Record<string, string> = {
  badge8: 'Viridian City', jasmine: 'Olivine City', radio: 'Goldenrod City', 'kanto-johto': 'Vermilion City',
  'kanto-power': 'Kanto Power Plant', 'kanto-blue': 'Viridian City', silver: 'Silver Cave', norman: 'Petalburg City',
};

function buildAtlas(version: string) {
  const edition = editions.find(entry => entry.version === version)!;
  const region = edition.group === 6 ? 'hoenn' : [3, 4, 10].includes(edition.group) ? 'johto' : 'kanto';
  const stages: Stage[] = [...routes[region]];
  if (edition.group === 7) {
    stages.splice(stages.findIndex(stage => stage.id === 'badge8'), 0, routes.sevii[0]);
    stages.splice(stages.findIndex(stage => stage.id === 'cerulean-cave'), 0, routes.sevii[1]);
  }
  if (region === 'kanto' && edition.group !== 7) {
    const final = stages[stages.length - 1];
    stages[stages.length - 1] = { ...final, how: 'Depois da Liga, explore a caverna a noroeste de Cerulean.' };
  }
  const regionalKey = region === 'kanto' ? 'yellow' : region === 'johto' ? 'crystal' : 'emerald';
  const overview = regionalData[regionalKey];
  const areaList: Area[] = stages.map(stage => {
    const original = version === 'yellow' ? areas.find(area => area.id === stage.id) : undefined;
    if (original) return { ...original, illustrated: true };
    const location = overview.labels[landmarks[stage.id] ?? stage.title];
    const area = { id: stage.id, title: stage.title, x: 0, y: 0, width: 480, height: 430 };
    if (stage.id === 'sevii-trip' || stage.id === 'sevii-network') {
      const key = stage.id === 'sevii-trip' ? 'seviiStart' : 'seviiLate';
      const { width, height } = regionalData[key];
      return { ...area, illustrated: true, regional: key, backdrop: { x: 0, y: 0, width, height } };
    }
    if (!location) return area;
    const width = 112;
    const height = 100;
    return { ...area, illustrated: true, regional: regionalKey, backdrop: {
      x: Math.max(0, Math.min(overview.width - width, location[0] - width / 2)),
      y: Math.max(0, Math.min(overview.height - height, location[1] - height / 2)), width, height,
    } };
  });
  const byArea = (id: AreaId) => areaList.find(area => area.id === id) ?? areaList[0];
  const atlasPoints: Point[] = [];
  const goals: Point[] = [];
  const regional: Area = { id: 'region', title: regionalKey, x: 0, y: 0, width: overview.width,
    height: overview.height, illustrated: true, regional: regionalKey };
  const regionalPoints: Point[] = [];
  const itemArt = new Map(itemsFor(edition).map(item => [item.name, item.art]));
  const hmArt = new Map(machinesFor(edition, 'hms').map(machine => [machine.code, machine.art]));
  for (const stage of stages) {
    const area = byArea(stage.id);
    const xy = (x: number, y: number) => ({ x: area.x + x * area.width, y: area.y + y * area.height });
    const pilot = area.illustrated && !area.regional ? points.filter(point => point.area === stage.id) : [];
    atlasPoints.push(...pilot);
    const goal: Point = { id: stage.id + '-story', area: stage.id, category: 'objective', title: stage.goal,
      place: stage.title, description: stage.how, ...xy(.5, area.backdrop ? .5 : .22) };
    const routeGoal = pilot.find(point => point.id === 'route1-viridian');
    if (!routeGoal) atlasPoints.push(goal);
    goals.push(routeGoal ?? goal);
    const position = overview.labels[landmarks[stage.id] ?? stage.title];
    if (position) regionalPoints.push({ ...goal, title: stage.title, x: position[0], y: position[1] });
    if (stage.id === 'viridian' && version === 'yellow') {
      const dex = atlasPoints.find(point => point.id === 'pallet-dex');
      if (dex) {
        goals.push(dex);
        goal.title = 'Buscar a encomenda de Oak';
        goal.description = 'Retire a encomenda no Poké Mart de Viridian e leve-a ao laboratório em Pallet Town.';
      }
    }
    for (const [index, entry] of stage.items.entries()) {
      const [name, place, instructions, hidden] = entry as [string, string, string, boolean];
      const how = stage.id === 'cherrygrove' && hidden && edition.group !== 10
        ? 'Examine o canteiro quatro passos ao sul e três a oeste da entrada da casa de Mr. Pokémon.' : instructions;
      if (pilot.some(point => point.category === 'item' && point.title === name)) continue;
      atlasPoints.push({ id: stage.id + '-item-' + index, area: stage.id, category: 'item',
        title: name, place, description: how, hidden, art: itemArt.get(name) ?? hmArt.get(name.split(' ')[0]),
        ...xy(hidden ? .7 : .3, .45) });
    }
    for (const [index, [title, place, description]] of (stage.npcs ?? []).entries()) {
      if (pilot.some(point => point.category === 'npc' && point.title === title)) continue;
      atlasPoints.push({ id: stage.id + '-npc-' + index, area: stage.id, category: 'npc',
        title, place, description, ...xy(.5, .45) });
    }
    const wildRows = wild[version]?.[stage.id] ?? [];
    const places = [...new Set(wildRows.map(([id]) => id))];
    for (const [location, place, species, title, types, entries] of wildRows) {
      const encounters = entries.map(([subarea, method, low, high]) => ({ subarea, method, low, high }));
      const existing = pilot.find(point => point.species === species);
      if (existing) {
        const index = atlasPoints.indexOf(existing);
        atlasPoints[index] = { ...existing, types, encounters };
        continue;
      }
      const i = places.indexOf(location);
      atlasPoints.push({ id: stage.id + '-' + location + '-' + species, area: stage.id, category: 'pokemon',
        title, place, species, types, description: 'Encontro selvagem nesta área.', encounters,
        ...xy(.22 + (i % 4) * .18, .63 + .28 * Math.floor(i / 4) / Math.max(1, Math.ceil(places.length / 4) - 1)) });
    }
  }
  return { areas: areaList, points: atlasPoints, goals, byArea, regional, regionalPoints };
}

export function atlasFor(edition: string) {
  const cached = atlases.get(edition);
  if (cached) return cached;
  const atlas = buildAtlas(edition);
  atlases.set(edition, atlas);
  return atlas;
}

export const progressKey = (point: Point) => point.id;
export type Mark = { status: number; note: string; pinned: boolean; at?: string };
export type Profile = {
  id: string; name: string; area: AreaId; lastPoint?: string;
  marks: Record<string, Mark>; custom: Point[];
};
export type Journal = { version: 1; edition?: string; active: string; profiles: Profile[] };
export const blankJournal: Journal = { version: 1, active: '', profiles: [] };
export const journalLimit = 600000;
export const blankMark: Mark = { status: 0, note: '', pinned: false };
export const isComplete = (point: Point, mark: Mark = blankMark) => mark.status === statuses[point.category].length - 1;
export const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

const kinds = new Set<string>(categoryKeys);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const validId = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z0-9-]{1,70}$/.test(value);
const validText = (value: unknown, max: number) => typeof value === 'string' && value.length <= max;

export function readJournal(raw: string, edition = 'yellow'): Journal {
  if (raw.length > journalLimit) throw new Error('Backup too large');
  const value: unknown = JSON.parse(raw);
  if (!isRecord(value) || value.version !== 1 || (value.edition ?? 'yellow') !== edition || typeof value.active !== 'string' ||
    !Array.isArray(value.profiles) || value.profiles.length > 20) throw new Error('Invalid journal');
  const { areas, points, byArea } = atlasFor(edition);
  const areaIds = new Set(areas.map(area => area.id));
  const seen = new Set<string>();
  const profiles = value.profiles.map(profile => {
    if (!isRecord(profile) || !validId(profile.id) || seen.has(profile.id) || !validText(profile.name, 48) ||
      !(profile.name as string).trim() || typeof profile.area !== 'string' || !areaIds.has(profile.area) ||
      !isRecord(profile.marks) || !Array.isArray(profile.custom) || profile.custom.length > 100) throw new Error('Invalid profile');
    seen.add(profile.id);
    const ids = new Set(points.map(point => point.id));
    const custom = profile.custom.map(point => {
      if (!isRecord(point) || !validId(point.id) || !point.id.startsWith('custom-') || ids.has(point.id) ||
        typeof point.area !== 'string' || !areaIds.has(point.area) ||
        typeof point.category !== 'string' || !kinds.has(point.category) ||
        !validText(point.title, 70) || !(point.title as string).trim() || !validText(point.description, 500) ||
        typeof point.x !== 'number' || typeof point.y !== 'number' ||
        !Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new Error('Invalid custom point');
      const area = byArea(point.area as AreaId);
      if (point.x < area.x || point.x > area.x + area.width || point.y < area.y || point.y > area.y + area.height)
        throw new Error('Invalid coordinates');
      ids.add(point.id);
      return { id: point.id, area: area.id, category: point.category as Category, title: point.title as string,
        place: area.title, description: point.description as string, x: point.x, y: point.y };
    });
    const keyToCategory = new Map([...points, ...custom].map(point => [progressKey(point), point.category]));
    const marks: Record<string, Mark> = {};
    for (const [key, mark] of Object.entries(profile.marks)) {
      const oldPoint = key.startsWith('species-') && isRecord(mark)
        ? points.find(point => 'species-' + point.species === key && point.id === mark.at) ??
          points.find(point => 'species-' + point.species === key) : undefined;
      const markKey = oldPoint?.id ?? key;
      const kind = keyToCategory.get(markKey);
      if (!kind || !isRecord(mark) || typeof mark.status !== 'number' || !Number.isInteger(mark.status) ||
        mark.status < 0 || mark.status >= statuses[kind].length || !validText(mark.note, 500) ||
        typeof mark.pinned !== 'boolean' || (mark.at !== undefined && (!validId(mark.at) || !ids.has(mark.at)))) {
        throw new Error('Invalid progress');
      }
      marks[markKey] = { status: mark.status, note: mark.note as string, pinned: mark.pinned, at: mark.at as string | undefined };
    }
    return { id: profile.id, name: profile.name as string, area: profile.area as AreaId,
      lastPoint: typeof profile.lastPoint === 'string' && ids.has(profile.lastPoint) ? profile.lastPoint : undefined,
      custom, marks };
  });
  if ((profiles.length && !seen.has(value.active)) || (!profiles.length && value.active !== '')) throw new Error('Unknown profile');
  return { version: 1, edition, active: value.active, profiles };
}
