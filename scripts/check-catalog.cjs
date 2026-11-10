const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadSource(relative, loadAsset) {
  const filename = path.resolve(__dirname, '../src', relative);
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  const local = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(
    loadAsset ?? require('node:module').createRequire(filename), local, local.exports,
  );
  return local.exports;
}

const catalog = loadSource('catalog.ts');
const localRequire = require('node:module').createRequire(path.resolve(__dirname, '../src/map-data.ts'));
const map = loadSource('map-data.ts', id => id === './catalog' ? catalog : localRequire(id));
const mapImage = uri => {
  const asset = path.resolve(__dirname, '../src/data', uri);
  assert.ok(fs.existsSync(asset), uri);
  return asset;
};
const tiles = loadSource('data/yellow-map-tiles.ts', mapImage).yellowTiles;
const regionalTiles = loadSource('data/region-tiles.ts', mapImage).regionTiles;
const updates = loadSource('updates.tsx', id => {
  if (['react-native', './locale', './ui'].includes(id)) return {};
  if (id === 'react') return { useRef: current => ({ current }), useCallback: fn => fn, useEffect: () => {}, useState: value => [value, () => {}] };
  return localRequire(id);
});
const remoteNotes = updates.parseReleases([
  { tag_name: 'v8.3.1', body: 'Nota', draft: false, prerelease: false, assets: [{ name: 'PokeFinder-8.3.1-Android.apk', browser_download_url: 'https://github.com/NiltonJr1994/pokefinder/releases/download/v8.3.1/PokeFinder-8.3.1-Android.apk' }] },
  { tag_name: 'v8.4.0', draft: true, prerelease: false },
  { tag_name: 'v8.5.0-beta', draft: false, prerelease: true },
  { tag_name: 'v9.0.0-beta', draft: false, prerelease: false },
]);
assert.deepEqual(remoteNotes, [{ tag: '8.3.1', publishedTag: 'v8.3.1', body: 'Nota', revision: 0, apk: 'https://github.com/NiltonJr1994/pokefinder/releases/download/v8.3.1/PokeFinder-8.3.1-Android.apk' }]);
let preferences = { remoteNotes, automatic: true, availableTag: '8.3.1', dismissedUpdate: '', nextCheck: 0, checkedVersion: '' };
const saveUpdate = changes => { preferences = { ...preferences, ...changes }; };
const sameTag = updates.parseReleases([{
  tag_name: 'v4.5.0', draft: false, prerelease: false, body: '',
  assets: [
    { name: 'PokeFinder-4.5.0-Android-b45002.apk', browser_download_url: 'https://github.com/NiltonJr1994/pokefinder/releases/download/v4.5.0/PokeFinder-4.5.0-Android-b45002.apk' },
    { name: 'PokeFinder-4.5.0-ReactNative-Teste.apk', browser_download_url: 'https://github.com/NiltonJr1994/pokefinder/releases/download/v4.5.0/PokeFinder-4.5.0-ReactNative-Teste.apk' },
  ],
}]);
assert.equal(sameTag[0].revision, 45002);
assert.equal(updates.useUpdates({ ...preferences, remoteNotes: sameTag, availableTag: '4.5.0' }, saveUpdate, true).tag, '4.5.0');
const offered = updates.useUpdates(preferences, saveUpdate, true);
assert.ok(offered.prompt && offered.url.endsWith('/releases/download/v8.3.1/PokeFinder-8.3.1-Android.apk'));
assert.equal(offered.notes[0].body, 'Nota');
offered.dismiss();
assert.equal(updates.useUpdates(preferences, saveUpdate, true).prompt, false);
assert.equal(updates.useUpdates({ ...preferences, availableTag: '' }, saveUpdate, true).notes[0].body, 'Nota');
assert.equal(map.areas.length, 3);
assert.equal(map.points.length, 16);
assert.equal(new Set(map.points.map(point => point.id)).size, map.points.length);
for (const edition of catalog.editions) {
  const atlas = map.atlasFor(edition.version);
  assert.ok(atlas.areas.length >= 15 && atlas.regionalPoints.length >= 10, edition.version);
  assert.ok(atlas.areas.every(area => area.illustrated), edition.version + ' areas without art: ' + atlas.areas.filter(area => !area.illustrated).map(area => area.id));
  assert.ok(catalog.itemsFor(edition).some(item => item.price && item.location), edition.version);
  assert.equal(new Set(atlas.points.map(point => point.id)).size, atlas.points.length, edition.version);
  assert.ok(atlas.points.some(point => point.hidden));
  assert.ok(atlas.points.some(point => point.encounters?.length && point.types?.length));
  for (const level of ['low', 'high']) {
    assert.equal(regionalTiles[atlas.regional.regional + '_' + level]
      .reduce((sum, tile) => sum + tile.width * tile.height, 0), atlas.regional.width * atlas.regional.height);
  }
  for (const point of atlas.points) {
    const area = atlas.byArea(point.area);
    assert.equal(area.id, point.area);
    assert.match(point.id, /^[a-z0-9-]{1,70}$/);
    assert.ok(point.x >= area.x && point.x <= area.x + area.width && point.y >= area.y && point.y <= area.y + area.height, point.id);
  }
  const fixture = { version: 1, edition: edition.version, active: 'p1', profiles: [
    { id: 'p1', name: 'Teste', area: atlas.areas[0].id, marks: {}, custom: [] },
  ] };
  assert.deepEqual(JSON.parse(JSON.stringify(map.readJournal(JSON.stringify(fixture), edition.version))), fixture);
}
for (const area of map.areas) {
  const grid = tiles[area.id];
  assert.deepEqual([grid.width, grid.height], [area.width, area.height]);
  for (const level of [grid.low, grid.high]) {
    assert.equal(level.reduce((sum, tile) => sum + tile.width * tile.height, 0), area.width * area.height);
  }
}
const example = { version: 1, active: 'one', profiles: [
  { id: 'one', name: 'Yellow', area: 'pallet', custom: [], marks: {
    'species-25': { status: 2, note: 'Starter', pinned: false, at: 'pallet-pikachu' },
  } },
  { id: 'two', name: 'Outra partida', area: 'route1', custom: [], marks: {} },
] };
const restored = map.readJournal(JSON.stringify(example));
assert.equal(restored.profiles[0].marks['pallet-pikachu'].status, 2);
assert.throws(() => map.readJournal(JSON.stringify(example), 'crystal'));
assert.deepEqual(restored.profiles[1].marks, {});
assert.throws(() => map.readJournal(JSON.stringify({ ...example, active: 'unknown' })));
example.profiles[0].marks['species-25'].status = 9;
assert.throws(() => map.readJournal(JSON.stringify(example)));
const legacy = require('../src/data/legacy_codes.json');
const reference = require('../src/data/reference.json');
const help = require('../src/data/help.json');
assert.equal(legacy.length, 1604);
assert.equal(catalog.editions.length, 11);
assert.equal(help.intro.length, 4);
assert.equal(help.panels.length, 6);
for (const edition of catalog.editions) {
  const name = 'Pokémon ' + edition.title;
  const entries = catalog.entriesFor('codes', edition);
  const expected = legacy.filter(row => row.games.includes(name));
  assert.deepEqual(entries.slice(0, expected.length).map(entry => entry.id), expected.map(row => row.id));
  assert.ok(catalog.entriesFor('tips', edition).length, 'tips ' + name);
  assert.equal(Boolean(catalog.entriesFor('guides', edition).length), catalog.available('guides', edition));
  assert.equal(Boolean(catalog.pokemonFor(edition).length), catalog.available('dex', edition));
  assert.equal(catalog.itemsFor(edition).length, reference.items[edition.group].length);
  assert.equal(catalog.machinesFor(edition, 'tms').length + catalog.machinesFor(edition, 'hms').length,
    reference.machines[edition.group].length);
  for (const pokemon of catalog.pokemonFor(edition)) {
    const { direct, inherited } = catalog.movesFor(pokemon.id, edition);
    if (edition.group <= 4) assert.ok(direct.some(move => move.method === 'level'), `${edition.title}/${pokemon.name}`);
    const machines = reference.machines[edition.group].filter(row => row.learners.some(([id]) => id === pokemon.id));
    assert.deepEqual(direct.filter(move => move.code).map(move => [move.code, catalog.moveName(move.id, 'en')]),
      machines.map(row => [row.code, row.move]));
    assert.ok(inherited.every(move => move.from && !direct.some(row => row.id === move.id)));
    assert.ok([...direct, ...inherited].every(move => catalog.moveName(move.id, 'ja')));
  }
}
assert.equal(catalog.pokemonFor(catalog.editions[0]).length, 151);
assert.equal(catalog.pokemonFor(catalog.editions.find(edition => edition.version === 'crystal')).length, 251);
assert.equal(catalog.pokemonFor(catalog.editions.find(edition => edition.version === 'heartgold')).length, 493);
const gymCatalog = require('../src/data/gyms.json');
for (const [group, gyms] of Object.entries(gymCatalog)) {
  assert.equal(gyms.length, [3,4,10].includes(Number(group)) ? 16 : 8);
  for (const gym of gyms) {
    assert.ok(fs.existsSync(path.resolve(__dirname, '../assets/gyms', gym.portrait)), gym.portrait);
    assert.ok(fs.existsSync(path.resolve(__dirname, '../assets/gyms', gym.badgeArt)), gym.badgeArt);
    assert.ok(gym.team.every(([id, level]) => catalog.byId.has(id) && level > 0));
  }
}
assert.equal(catalog.byId.get(25).name, 'Pikachu');
assert.equal(catalog.itemsFor(catalog.editions[0]).find(item => item.name === 'Coin').art, 'ref_coin');
assert.ok(Object.values(reference.items).flat().every(item => item.art !== 'ref_item'));
assert.deepEqual([1, 2, 3, 10, 11, 12].map(id => catalog.pokemonSize(catalog.byId.get(id))), [1, 2, 3, 1, 1, 2]);
assert.equal(catalog.upcomingEditions.length, 20);
assert.ok(catalog.machinesFor(catalog.editions[0], 'hms').find(machine => machine.code === 'HM03').learners.length);
const [yellow, red] = catalog.editions;
const crystal = catalog.editions.find(edition => edition.version === 'crystal');
const namesOf = (id, edition, method) => catalog.movesFor(id, edition).direct
  .filter(move => move.method === method).map(move => catalog.moveName(move.id, 'en'));
assert.deepEqual(namesOf(150, yellow, 'hm'), ['Strength', 'Flash']);
assert.ok(namesOf(150, yellow, 'level').includes('Recover'));
assert.ok(namesOf(25, yellow, 'level').includes('Thunderbolt'));
assert.ok(!namesOf(25, red, 'level').includes('Thunderbolt'));
assert.deepEqual(namesOf(25, yellow, 'stadium'), ['Surf']);
assert.ok(namesOf(1, crystal, 'egg').length);
assert.ok(namesOf(150, crystal, 'tutor').length);
assert.equal(catalog.defensiveMatchups(catalog.byId.get(150), yellow).find(row => row.type === 'Fantasma').multiplier, 0);
assert.equal(catalog.defensiveMatchups(catalog.byId.get(150), crystal).find(row => row.type === 'Fantasma').multiplier, 2);
assert.equal(catalog.defensiveMatchups(catalog.byId.get(6), yellow).find(row => row.type === 'Pedra').multiplier, 4);
assert.equal(catalog.searchKey('Pokémon'), 'pokemon');
assert.ok(catalog.oneEditApart('pikachu', 'pikchu'));

const manifest = fs.readFileSync(path.resolve(__dirname, '../src/data/images.ts'), 'utf8');
const images = [...manifest.matchAll(/require\('([^']+)'\)/g)];
for (const table of [reference.items, reference.machines]) {
  for (const row of Object.values(table).flat()) {
    assert.ok(manifest.includes("'" + row.art + "': require("), row.art);
  }
}
assert.ok(images.length > 1000);
for (const [, uri] of images) {
  assert.ok(fs.existsSync(path.resolve(__dirname, '../src/data', uri)), uri);
}
const gifSizes = require('../src/data/gif-sizes.json');
const gifBounds = require('../src/data/gif-bounds.json');
const gifAssets = images.filter(([, uri]) => uri.endsWith('.gif'));
assert.equal(Object.keys(gifSizes).length, gifAssets.length);
for (const [, uri] of gifAssets) {
  const key = uri.split('/').slice(-2).join('/').slice(0, -4);
  const gif = fs.readFileSync(path.resolve(__dirname, '../src/data', uri));
  assert.deepEqual(gifSizes[key], [gif.readUInt16LE(6), gif.readUInt16LE(8)], uri);
  const [w, h] = gifSizes[key];
  const [left, top, right, bottom] = gifBounds[key];
  assert.ok(left >= 0 && top >= 0 && right <= w && bottom <= h && left < right && top < bottom, key);
}
assert.equal(Object.keys(gifBounds).length, gifAssets.length);
const logos = fs.readFileSync(path.resolve(__dirname, '../src/data/game-logos.ts'), 'utf8');
for (const version of [...catalog.editions.map(edition => edition.version), ...catalog.upcomingEditions.map(([, id]) => id)]) {
  assert.ok(logos.includes("'" + version + "': require("), version);
}
console.log('Paridade do catálogo validada: 11 jogos, 1.604 códigos legados e ' + images.length + ' imagens locais.');
