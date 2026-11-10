import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { type Edition, type LearnedMove, type MoveMethod, type Pokemon, byId, defensiveMatchups, dexNumber, gendersFor, generationOf, moveName, movesFor,
  pokemonFor, pokemonSize, searchKey, typesIn } from './catalog';
import { Art, Badge, brand, Button, Card, Choice, CopyText, GameLogo, Icon, type IconName, layout, Search, spriteDimensions,
  tone, TypeSymbol, Types, useTheme } from './ui';
import { useLocale } from './locale';
import { femaleArt, femaleSize } from './data/female-art';

type Favorites = { favorites: number[]; favorite: (id: number) => void };
const orders = ['Menor número', 'Maior número', 'A–Z', 'Z–A'];
const allTypes = 'Todos os tipos';
const sizeNames = ['Porte mínimo', 'Porte pequeno', 'Porte médio', 'Porte grande'];
const spriteTiers = [37, 51, 65, 84];

function HeroControl({ label, icon, active = false, onPress }: {
  label: string; icon: IconName; active?: boolean; onPress: () => void;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }}
    onPress={onPress} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22,
      backgroundColor: active ? '#FFF9EE' : pressed ? '#071328AA' : '#07132870', borderWidth: 1, borderColor: '#FFF9EEC0',
      justifyContent: 'center', alignItems: 'center' })}>
    <Icon name={icon} color={active ? '#AB2330' : '#FFFFFF'} size={21} />
  </Pressable>;
}

function TypeMark({ type, size }: { type: string; size: number }) {
  return <View pointerEvents="none" style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center',
    width: size, height: size, borderRadius: size / 2, backgroundColor: '#FFF9EE3F' }}>
    <TypeSymbol type={type} size={size * .65} color="#FFF9EE55" />
  </View>;
}

function DexCard({ pokemon, edition, favorite, starred, open, width }: {
  pokemon: Pokemon; edition: Edition; favorite: (id: number) => void; starred: boolean; open: (id: number) => void;
  width: number;
}) {
  const t = useTheme();
  const { tr } = useLocale();
  const types = typesIn(pokemon, edition);
  const color = tone(types[0]);
  const panelWidth = Math.max(99, Math.round(width * .37));
  const stacked = width - panelWidth < 110;
  const visualSize = spriteTiers[pokemonSize(pokemon)];
  return <View style={{ flex: 1, minWidth: 0, position: 'relative', borderRadius: 16, overflow: 'hidden',
    backgroundColor: t.dark ? t.panel : t.page }}>
    <Pressable accessibilityRole="button" accessibilityLabel={pokemon.name + ', ' + dexNumber(pokemon.id)}
      onPress={() => open(pokemon.id)} style={({ pressed }) => ({
        flexDirection: stacked ? 'column' : 'row', minHeight: 99, borderRadius: 16,
        backgroundColor: color + (t.dark ? '28' : '25'), opacity: pressed ? .76 : 1,
      })}>
        <View style={{ flex: 1, minWidth: 0, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 2 }}>
          <CopyText style={{ fontSize: 11, fontWeight: '800', lineHeight: 16 }}>Nº{dexNumber(pokemon.id).slice(1)}</CopyText>
          <CopyText kind="title" style={{ fontSize: 19, fontWeight: '900' }}>{pokemon.name}</CopyText>
          <Types values={types} />
          <CopyText kind="muted" style={{ fontSize: 11 }}>{gendersFor(pokemon.id, edition).map(label => tr(label)).join(' · ')}</CopyText>
        </View>
        <View style={{ width: stacked ? '100%' : panelWidth, minHeight: 99,
          alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: color }}>
          <TypeMark type={types[0]} size={72} />
          <Art id={pokemon.id} game={edition.version} animated size={64} visualSize={visualSize} />
        </View>
    </Pressable>
    <View style={{ position: 'absolute', right: 5, ...(stacked ? { bottom: 5 } : { top: 5 }) }}>
      <HeroControl active={starred} icon={starred ? 'heart' : 'heart-outline'}
        label={tr(starred ? 'Remover favorito: {name}' : 'Favoritar: {name}', { name: pokemon.name })} onPress={() => favorite(pokemon.id)} />
    </View>
  </View>;
}

export function Dex({ edition, columns, favorites, favorite, open }: Favorites & {
  edition: Edition; columns: number; open: (id: number) => void;
}) {
  const t = useTheme();
  const { tr, language } = useLocale();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [type, setType] = useState(allTypes);
  const [order, setOrder] = useState(orders[0]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const pokemon = pokemonFor(edition);
  const types = useMemo(() => [allTypes, ...Array.from(new Set(pokemon.flatMap(row => typesIn(row, edition)))).sort()],
    [pokemon, edition]);
  const results = useMemo(() => {
    const needle = searchKey(query.trim());
    const number = Number(needle.replace(/^#/, ''));
    const matched = pokemon.filter(row => {
      const rowTypes = typesIn(row, edition);
      return (type === allTypes || rowTypes.includes(type)) && (!onlyFavorites || favorites.includes(row.id)) &&
        (row.id === number || searchKey(row.name).includes(needle) || rowTypes.some(label =>
          searchKey(label).includes(needle) || searchKey(tr(label)).includes(needle)));
    });
    const byName = (a: Pokemon, b: Pokemon) => searchKey(a.name).localeCompare(searchKey(b.name));
    if (order === orders[1]) return matched.sort((a, b) => b.id - a.id);
    if (order === orders[2]) return matched.sort(byName);
    if (order === orders[3]) return matched.sort((a, b) => byName(b, a));
    return matched.sort((a, b) => a.id - b.id);
  }, [query, type, order, onlyFavorites, favorites, pokemon, edition, language, tr]);

  const rowWidth = (Math.min(1024, width) - 24 - (columns - 1) * 8) / columns;
  return <View style={[layout.wide, { backgroundColor: t.panel }]}>
    <FlatList key={columns} numColumns={columns} style={{ flex: 1 }} contentContainerStyle={layout.list}
    columnWrapperStyle={columns > 1 ? { gap: 8 } : undefined} data={results}
    keyExtractor={row => String(row.id)} keyboardShouldPersistTaps="handled" initialNumToRender={8} windowSize={5}
    ListEmptyComponent={<Card><CopyText kind="title">{onlyFavorites ? 'Nenhum favorito nesta busca' : 'Nenhum Pokémon encontrado'}</CopyText>
      <CopyText kind="muted">{onlyFavorites ? 'Toque no coração de um Pokémon para salvá-lo.' : 'Experimente outro nome, número ou tipo.'}</CopyText></Card>}
    ListHeaderComponent={<View style={layout.stack}>
      <View style={layout.wrap}><CopyText kind="title">{onlyFavorites ? 'Favoritos' : 'Pokédex'}</CopyText>
        <GameLogo version={edition.version} title={edition.title} /><CopyText kind="muted">{tr('{count} espécies', { count: results.length })}</CopyText>
      </View>
      <Search label="Procurar Pokémon" value={query} onChange={setQuery} />
      <View style={layout.wrap}>
        <Choice title="Selecione o tipo" value={type} options={types} select={setType} dex typePicker />
        <Choice title="Selecione a ordem" value={order} options={orders} select={setOrder} dex />
        <Pressable accessibilityRole="button" accessibilityLabel={tr('Favoritos')}
          accessibilityState={{ selected: onlyFavorites }} onPress={() => setOnlyFavorites(!onlyFavorites)}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: onlyFavorites ? t.selection : t.page,
            alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={onlyFavorites ? 'heart' : 'heart-outline'} color={onlyFavorites ? t.red : t.muted} />
        </Pressable>
      </View>
    </View>}
    renderItem={({ item }) => <DexCard pokemon={item} edition={edition} width={rowWidth}
      favorite={favorite} starred={favorites.includes(item.id)} open={open} />} />
  </View>;
}

const moveSections: [MoveMethod, string][] = [
  ['level', 'Por nível'], ['tm', 'Por TM'], ['hm', 'Por HM'], ['egg', 'Por ovo'],
  ['tutor', 'Por tutor'], ['stadium', 'Pokémon Stadium'],
];

function MoveList({ title, rows }: { title: string; rows: LearnedMove[] }) {
  const [expanded, setExpanded] = useState(false);
  const { language, tr } = useLocale();
  const t = useTheme();
  if (!rows.length) return null;
  return <View>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)}
      style={({ pressed }) => [layout.row, { minHeight: 44, opacity: pressed ? .7 : 1 }]}>
      <CopyText style={{ flex: 1, fontWeight: '700' }}>{title}</CopyText>
      <CopyText kind="muted">{rows.length.toLocaleString(language)}</CopyText>
      <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={t.muted} />
    </Pressable>
    {expanded && rows.map(({ id, method, level, code, from }, index) => {
      const requirement = code ?? (method === 'level' ? (level === 1 ? tr('Inicial / nível 1')
        : tr('Nv. {level}', { level: level ?? 0 })) : tr(moveSections.find(([key]) => key === method)![1]));
      return <View key={index} style={{ borderTopWidth: 1, borderColor: t.line, paddingVertical: 8, gap: 2 }}>
        <CopyText>{moveName(id, language)}</CopyText>
        <CopyText kind="muted">{from ? tr('{name} · {method}', { name: from, method: requirement }) : requirement}</CopyText>
      </View>;
    })}
  </View>;
}

function PokemonMoves({ pokemon, edition }: { pokemon: Pokemon; edition: Edition }) {
  const { direct, inherited } = useMemo(() => movesFor(pokemon.id, edition), [pokemon.id, edition]);
  if (!direct.length) return null;
  return <Card>
    <CopyText kind="title">Golpes</CopyText>
    {moveSections.map(([method, title]) => <MoveList key={method} title={title} rows={direct.filter(row => row.method === method)} />)}
    <MoveList title="Antes de evoluir" rows={inherited} />
  </Card>;
}

const effectiveness = [
  [4, 'Superefetivo'], [2, 'Superefetivo'], [1, 'Dano normal'], [.5, 'Pouco efetivo'], [.25, 'Pouco efetivo'], [0, 'Sem efeito'],
] as const;

export function Defense({ pokemon, edition }: { pokemon: Pokemon; edition: Edition }) {
  const { language, tr } = useLocale();
  const incoming = defensiveMatchups(pokemon, edition);
  return <Card>
    <CopyText kind="title">Dano recebido por tipo</CopyText>
    {effectiveness.map(([factor, title]) => {
      const types = incoming.filter(row => row.multiplier === factor).map(row => row.type);
      return types.length > 0 && <View key={factor} style={{ gap: 4 }}>
        <CopyText kind="muted">{tr(title) + ' · ×' + factor.toLocaleString(language)}</CopyText>
        <Types values={types} />
      </View>;
    })}
  </Card>;
}

export function PokemonDetail({ pokemon, edition, favorites, favorite, open, back }: Favorites & {
  pokemon: Pokemon; edition: Edition; open: (id: number) => void; back: () => void;
}) {
  const t = useTheme();
  const { tr, language } = useLocale();
  const { width } = useWindowDimensions();
  const generation = generationOf(edition);
  const kanto = generation === 1;
  const [female, setFemale] = useState(false);
  const genders = gendersFor(pokemon.id, edition);
  const showFemale = genders.includes('Fêmea') && (female || !genders.includes('Macho'));
  const types = typesIn(pokemon, edition);
  const color = tone(types[0]);
  const stats = kanto ? pokemon.kantoStats : pokemon.statsByGeneration[generation] ?? pokemon.stats;
  const names = kanto ? ['HP', 'Ataque', 'Defesa', 'Especial', 'Velocidade']
    : ['HP', 'Ataque', 'Defesa', 'At. Especial', 'Def. Especial', 'Velocidade'];
  const family = pokemon.family.filter(id => id !== pokemon.id && (!kanto || id <= 151))
    .map(id => byId.get(id)).filter((related): related is Pokemon => Boolean(related && related.introduced <= generation));
  const locations = pokemon.locations[edition.version] ?? [];
  const measure = (value: number) => value.toLocaleString(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const [, artHeight] = spriteDimensions(edition.version, pokemon.id, 112);
  const starred = favorites.includes(pokemon.id);
  return <ScrollView style={[layout.centered, { backgroundColor: t.panel }]} contentContainerStyle={{ paddingBottom: 14 }}>
      <View style={{ minHeight: Math.max(192, artHeight + 26), alignItems: 'center', justifyContent: 'center',
        backgroundColor: color, borderBottomLeftRadius: 84, borderBottomRightRadius: 84 }}>
        <TypeMark type={types[0]} size={144} />
        <Art key={pokemon.id + '/' + showFemale} id={pokemon.id} size={112} game={edition.version} animated alternate={showFemale ? femaleArt[pokemon.id] : undefined} alternateSize={femaleSize[pokemon.id]} />
        <View style={{ position: 'absolute', top: 8, left: 11 }}>
          <HeroControl label={tr('Voltar')} icon="chevron-back" onPress={back} />
        </View>
        <View style={{ position: 'absolute', right: 11, top: 8 }}>
          <HeroControl label={tr('Alternar favorito')} icon={starred ? 'heart' : 'heart-outline'}
            active={starred} onPress={() => favorite(pokemon.id)} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 17, paddingTop: 13, paddingBottom: 6, gap: 5 }}>
        <CopyText kind="muted">{dexNumber(pokemon.id)}</CopyText>
        <CopyText kind="heading">{pokemon.name}</CopyText>
        <Types values={types} />
        <View style={layout.wrap}>
          <Badge>{tr('Altura · {value} m', { value: measure(pokemon.height) })}</Badge>
          <Badge>{tr('Peso · {value} kg', { value: measure(pokemon.weight) })}</Badge>
          <Badge>{sizeNames[pokemonSize(pokemon)]}</Badge>
          {genders.map(label => <Badge key={label}>{label}</Badge>)}
        </View>
      </View>
    <View style={layout.list}>
    <Card>
      <CopyText kind="title">Atributos base</CopyText>
      {stats.map((value, index) => <View key={names[index]} style={layout.row}>
        <CopyText kind="muted" style={{ flex: 1 }}>{names[index]}</CopyText>
        <View style={{ flex: 1.2, height: 5, backgroundColor: t.line, borderRadius: 10, overflow: 'hidden' }}>
          <View style={{ height: 5, width: `${value / 255 * 100}%`, backgroundColor: color }} />
        </View>
        <CopyText style={{ minWidth: 32, textAlign: 'right' }}>{value}</CopyText>
      </View>)}
    </Card>
    {genders.length === 2 && femaleArt[pokemon.id] && <View style={layout.wrap}>
      <Button dense label="Macho" selected={!female} onPress={() => setFemale(false)} />
      <Button dense label="Fêmea" selected={female} onPress={() => setFemale(true)} />
    </View>}
    <PokemonMoves key={edition.version + '/' + pokemon.id} pokemon={pokemon} edition={edition} />
    <Defense pokemon={pokemon} edition={edition} />
    <Card>
      <CopyText kind="title">Família evolutiva</CopyText>
      {family.length === 0 && <CopyText>Sem evoluções registradas nesta geração.</CopyText>}
      {family.map(related => <DexCard key={related.id} pokemon={related} edition={edition} width={Math.min(760, width) - 52}
        favorite={favorite} starred={favorites.includes(related.id)} open={open} />)}
    </Card>
    {edition.version === 'yellow' && !!pokemon.yellowObtaining && <Card>
      <CopyText kind="title">Como obter em Yellow</CopyText><CopyText>{pokemon.yellowObtaining}</CopyText>
    </Card>}
    <Card>
      <CopyText kind="title">{tr('Encontros · {game}', { game: edition.title })}</CopyText>
      {locations.length ? locations.map((location, index) => <CopyText key={index}>{location}</CopyText>)
        : <CopyText>Sem encontros cadastrados para esta edição. Consulte o detonado para presentes, trocas e eventos.</CopyText>}
    </Card>
    </View>
  </ScrollView>;
}
