import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  type Edition, type Machine, dexNumber, entriesFor, itemsFor, machineGames,
  machinesFor, oneEditApart, searchKey, sections,
} from './catalog';
import {
  Art, Badge, Button, Card, Choice, CopyText, EmptyState, Icon, layout, Search, SectionHeading, Types, useTheme,
} from './ui';
import { sectionIcons } from './navigation';
import { useLocale } from './locale';

const formatOf = (format?: string) => format?.split(' · ')[0] ?? '';
const categoriesOf = (values: string[]) => ['Todos', ...new Set(values.filter(Boolean))];

export function Entries({ section, edition, favorites, favorite, openCheats }: {
  section: 'codes' | 'tips' | 'guides'; edition: Edition; favorites: string[];
  favorite: (id: string) => void; openCheats: () => void;
}) {
  const t = useTheme();
  const { tr } = useLocale();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [format, setFormat] = useState('Todos');
  const [expanded, setExpanded] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [copied, setCopied] = useState('');
  const codes = section === 'codes';
  const entries = useMemo(() => entriesFor(section, edition), [section, edition]);
  const searchable = useMemo(() => entries.map(entry => ({
    entry, index: searchKey([entry.title, entry.aliases, entry.body, entry.code, entry.format].join(' ')),
    words: searchKey([entry.title, entry.aliases].join(' ')).split(/\s+/),
  })), [entries]);
  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);
  const results = useMemo(() => {
    const needle = searchKey(query.trim());
    const filtered = searchable.filter(({ entry }) => (category === 'Todos' || category === entry.category) &&
      (format === 'Todos' || formatOf(entry.format) === format) && (!onlyFavorites || favoriteIds.has(entry.id)));
    const exact = filtered.filter(({ index }) => index.includes(needle));
    const terms = needle.split(/\s+/);
    return (codes && !exact.length && needle.length >= 4 ? filtered.filter(({ words }) =>
      terms.every(term => words.some(word => word.startsWith(term) || oneEditApart(word, term)))) : exact).map(({ entry }) => entry);
  }, [searchable, query, category, format, onlyFavorites, favoriteIds, codes]);
  const categories = categoriesOf(entries.map(entry => entry.category));
  const formats = categoriesOf(entries.map(entry => formatOf(entry.format)));

  async function copy(id: string, value: string) {
    try {
      if (!(await Clipboard.setStringAsync(value))) throw new Error('Clipboard unavailable');
      setCopied(id);
    } catch {
      Alert.alert(tr('Não foi possível copiar o código.'));
    }
  }

  return <FlatList style={layout.centered} contentContainerStyle={layout.list} keyboardShouldPersistTaps="handled"
    data={results} keyExtractor={(entry, index) => entry.id + '/' + index}
    ListEmptyComponent={<EmptyState title="Nenhum resultado" message="Tente outro termo ou ajuste os filtros." />}
    ListHeaderComponent={<View style={layout.stack}>
      <SectionHeading title={sections[section]} icon={sectionIcons[section]} game={edition.title} version={edition.version} summary={{
        codes: 'GameShark, CodeBreaker, Action Replay e outros formatos.',
        tips: 'Atalhos e detalhes que ajudam durante a aventura.',
        guides: 'Rota principal e pós-jogo em etapas.',
      }[section]} />
      {codes && <Card style={{ backgroundColor: t.warn }}>
        <CopyText>Confira a região, a revisão e o formato do código. Faça uma cópia do save antes de testar.</CopyText>
        <Button label="Como inserir cheats" icon="game-controller-outline" trailing="chevron-forward" onPress={openCheats} />
      </Card>}
      <Search label={'Buscar em ' + sections[section].toLowerCase()} value={query} onChange={setQuery} />
      {codes && <>
        <View style={layout.wrap}>
          <Choice title="Categoria" value={category} options={categories} select={setCategory} />
          {formats.length > 2 && <Choice title="Formato" value={format} options={formats} select={setFormat} />}
        </View>
        <View style={layout.wrap}>
          {['Rare Candy', 'Master Ball', 'Dinheiro', 'Shiny'].map(term =>
            <Button key={term} label={term} onPress={() => setQuery(term)} />)}
          <Button label="Favoritos" icon={onlyFavorites ? 'star' : 'star-outline'} selected={onlyFavorites}
            onPress={() => setOnlyFavorites(!onlyFavorites)} />
        </View>
        <CopyText kind="muted">{tr('{count} resultados · Base offline', { count: results.length })}</CopyText>
      </>}
    </View>}
    renderItem={({ item }) => {
      const isOpen = expanded === item.id;
      const hasInfo = !!(item.body || item.masterCode);
      const toggle = () => setExpanded(isOpen ? '' : item.id);
      return <Card>
        <View style={layout.row}>
          <Pressable accessibilityRole={hasInfo ? 'button' : undefined} accessibilityState={{ expanded: isOpen }}
            onPress={hasInfo ? toggle : undefined} style={layout.grow}>
            <CopyText kind="title">{item.title}</CopyText>
            {codes && <Badge>Pokémon {edition.title}</Badge>}
            {!!item.category && <CopyText kind="muted">{item.category}</CopyText>}
          </Pressable>
          {codes && <Button compact label={favoriteIds.has(item.id) ? '★' : '☆'}
            hint={tr(favoriteIds.has(item.id) ? 'Remover favorito: {name}' : 'Favoritar: {name}', { name: item.title })}
            onPress={() => favorite(item.id)} />}
          {hasInfo && <Button compact label={isOpen ? '−' : 'ⓘ'} onPress={toggle}
            hint={tr(isOpen ? 'Ocultar detalhes de {name}' : 'Mostrar detalhes de {name}', { name: item.title })} />}
        </View>
        {!!item.code && <>
          {!!item.format && <CopyText kind="muted">{item.format}</CopyText>}
          <View style={{ backgroundColor: t.code, borderRadius: 12, padding: 10, gap: 5 }}>
            <View style={layout.row}>
              <CopyText kind="muted" style={{ flex: 1, color: '#A4B5CE' }}>
                {tr('{count} linha(s)', { count: item.code.split('\n').length })}
              </CopyText>
              {!item.warning && <Pressable accessibilityRole="button" onPress={() => void copy(item.id, item.code)}
                style={[layout.row, { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }]}>
                <Icon name={copied === item.id ? 'checkmark' : 'copy-outline'} size={17} color="#EFF6FF" />
                <CopyText style={{ color: '#EFF6FF', fontWeight: '700' }}>{copied === item.id ? 'Copiado' : 'Copiar'}</CopyText>
              </Pressable>}
            </View>
            <CopyText style={{ color: '#EFF6FF', fontFamily: 'monospace' }}>{item.code}</CopyText>
          </View>
          {!!item.warning && <CopyText style={{ color: t.red }}>{item.warning}</CopyText>}
        </>}
        {isOpen && <>
          {!!item.body && <CopyText>{item.body}</CopyText>}
          {!!item.masterCode && <>
            <CopyText kind="title">Código mestre associado</CopyText>
            <CopyText style={{ fontFamily: 'monospace' }}>{item.masterCode}</CopyText>
            <Button icon="copy-outline" label={copied === item.id + '/master' ? 'Código mestre copiado' : 'Copiar código mestre'}
              onPress={() => void copy(item.id + '/master', item.masterCode!)} />
          </>}
        </>}
      </Card>;
    }} />;
}

export function Items({ edition }: { edition: Edition }) {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState('');
  const results = itemsFor(edition).filter(item =>
    searchKey([item.name, item.category, item.effect].join(' ')).includes(searchKey(query.trim())));
  return <FlatList style={layout.centered} contentContainerStyle={layout.list} data={results}
    keyExtractor={item => item.name} keyboardShouldPersistTaps="handled"
    ListEmptyComponent={<EmptyState title="Nenhum item encontrado" message="Tente buscar pelo nome, efeito ou categoria." />}
    ListHeaderComponent={<View style={layout.stack}>
      <SectionHeading title="Itens" icon={sectionIcons.items} game={edition.title} version={edition.version} summary="Efeitos e usos dos itens desta edição." />
      <Search label="Buscar item" value={query} onChange={setQuery} />
    </View>}
    renderItem={({ item }) => {
      const isOpen = expanded === item.name;
      return <Card>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }}
          onPress={() => setExpanded(isOpen ? '' : item.name)} style={layout.row}>
          <Art name={item.art} size={48} />
          <View style={layout.grow}><CopyText kind="title">{item.name}</CopyText><CopyText kind="muted">{item.category}</CopyText></View>
          <Icon name={isOpen ? 'chevron-up' : 'information-circle-outline'} />
        </Pressable>
        {isOpen && <>
          <CopyText>{item.effect}</CopyText>
          {!!item.location && <><CopyText kind="title">Onde encontrar</CopyText><CopyText>{item.location}</CopyText></>}
        </>}
      </Card>;
    }} />;
}

function MachineSummary({ machine, edition }: { machine: Machine; edition: Edition }) {
  const { tr } = useLocale();
  return <View style={layout.row}>
    <Art name={machine.art} size={48} />
    <View style={layout.grow}>
      <CopyText kind="title">{machine.code} · {machine.move}</CopyText>
      <Badge>{machineGames(edition)}</Badge>
      <Types values={[machine.type]} />
      <CopyText kind="muted">{tr('{count} compatíveis', { count: machine.learners.length })}</CopyText>
    </View>
  </View>;
}

export function Machines({ edition, section, open }: {
  edition: Edition; section: 'tms' | 'hms'; open: (machine: Machine) => void;
}) {
  const [query, setQuery] = useState('');
  const key = (s: string) => searchKey(s).replace(/\s+/g, '');
  const results = machinesFor(edition, section).filter(machine => key(machine.code + machine.move + machine.type).includes(key(query)));
  return <FlatList style={layout.centered} contentContainerStyle={layout.list} data={results}
    keyExtractor={machine => machine.code} keyboardShouldPersistTaps="handled"
    ListEmptyComponent={<EmptyState title="Nenhuma máquina encontrada" message="Tente buscar pelo número, golpe ou tipo." />}
    ListHeaderComponent={<View style={layout.stack}>
      <SectionHeading title={sections[section]} icon={sectionIcons[section]} game={edition.title} version={edition.version} summary="Toque em uma máquina para ver os Pokémon compatíveis." />
      <Search label={section === 'hms' ? 'Buscar HM' : 'Buscar TM'} value={query} onChange={setQuery} />
    </View>}
    renderItem={({ item }) => <Card>
      <Pressable accessibilityRole="button" onPress={() => open(item)} style={layout.row}>
        <View style={layout.grow}><MachineSummary machine={item} edition={edition} /></View>
        <Icon name="chevron-forward" />
      </Pressable>
    </Card>} />;
}

export function MachineDetail({ machine, edition, columns }: { machine: Machine; edition: Edition; columns: number }) {
  const { tr } = useLocale();
  const [query, setQuery] = useState('');
  const needle = searchKey(query.trim());
  const results = machine.learners.filter(([id, name]) => id === Number(needle.replace(/^#/, '')) || searchKey(name).includes(needle));
  return <FlatList key={columns} numColumns={columns} style={layout.wide} contentContainerStyle={layout.list}
    columnWrapperStyle={columns > 1 ? { gap: 8 } : undefined} data={results}
    keyboardShouldPersistTaps="handled" keyExtractor={([id, name]) => id + '/' + name}
    ListEmptyComponent={<EmptyState title="Nenhum Pokémon encontrado" message="Tente buscar pelo nome ou número." />}
    ListHeaderComponent={<View style={layout.stack}>
      <Card><MachineSummary machine={machine} edition={edition} />
        {!!machine.location && <><CopyText kind="title">Onde encontrar</CopyText><CopyText>{machine.location}</CopyText></>}
      </Card>
      <CopyText kind="title">{tr('Pokémon compatíveis · {count}', { count: machine.learners.length })}</CopyText>
      <Search label="Buscar Pokémon compatível" value={query} onChange={setQuery} />
    </View>}
    renderItem={({ item: [id, name] }) => <Card style={{ flex: 1, alignItems: 'center' }}>
      <CopyText kind="accent">{dexNumber(id)}</CopyText><Art id={id} size={68} />
      <CopyText style={{ textAlign: 'center' }}>{name}</CopyText>
    </Card>} />;
}
