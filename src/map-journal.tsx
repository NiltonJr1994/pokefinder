import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, TextInput, View } from 'react-native';
import {
  atlasFor, blankMark, categories, categoryKeys, isComplete, makeId, progressKey, statuses,
  type AreaId, type Category, type Mark, type Point, type Profile,
} from './map-data';
import { gymFor, GymDetails } from './gym';
import { MapCanvas, pointIcon } from './map-canvas';
import { exportJournal, selectJournalBackup, useJournal } from './map-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchKey, type Edition } from './catalog';
import { useLocale } from './locale';
import { Art, Badge, Button, Card, Choice, CopyText, EmptyState, GameLogo, Icon, layout, Search, Sheet, Types, useTheme } from './ui';

type Panel = 'profiles' | 'areas' | 'filters' | 'backup' | 'newProfile' | 'newPoint' | 'areaStatus' | null;
type StateFilter = 'Todos' | 'Pendentes' | 'Em andamento' | 'Concluídos';
const stateFilters: StateFilter[] = ['Todos', 'Pendentes', 'Em andamento', 'Concluídos'];

export function MapJournal({ edition }: { edition: Edition }) {
  const t = useTheme();
  const { tr } = useLocale();
  const { areas, points, goals, byArea, regional, regionalPoints } = atlasFor(edition.version);
  const { journal, ready, save, saveFailed } = useJournal(edition.version);
  const profile = journal.profiles.find(entry => entry.id === journal.active);
  const [tab, setTab] = useState<'map' | 'diary' | 'region'>('map');
  const [full, setFull] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [selected, setSelected] = useState<Point>();
  const [cluster, setCluster] = useState<Point[]>([]);
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [state, setState] = useState<StateFilter>('Todos');
  const [spoilers, setSpoilers] = useState(false);
  const [type, setType] = useState('Todos os tipos');
  const [hiddenOnly, setHiddenOnly] = useState(false);
  const [onlyArea, setOnlyArea] = useState(false);
  const [query, setQuery] = useState('');
  const [placing, setPlacing] = useState(false);
  const [newPosition, setNewPosition] = useState<{ area: AreaId; x: number; y: number }>();
  const [undo, setUndo] = useState<{ profileId: string; key: string; before?: Mark }>();
  const allPoints = useMemo(() => [...points, ...(profile?.custom ?? [])], [points, profile?.custom]);
  if (!ready) return <View style={[layout.centered, layout.list]}><CopyText>Carregando diário…</CopyText></View>;

  function updateProfile(change: (previous: Profile) => Profile, id = profile?.id) {
    if (!id) return;
    save(previous => ({ ...previous, profiles: previous.profiles.map(entry => entry.id === id ? change(entry) : entry) }));
  }

  function newProfile(name: string) {
    const id = makeId();
    save(previous => ({ ...previous, active: id,
      profiles: [...previous.profiles, { id, name, area: areas[0].id, marks: {}, custom: [] }] }));
    setUndo(undefined);
    setTab('map');
    setPanel(null);
  }

  async function backup() {
    try { await exportJournal(journal); }
    catch { Alert.alert(tr('Não foi possível compartilhar o backup.')); }
  }

  async function restore() {
    try {
      const replacement = await selectJournalBackup(edition.version);
      if (!replacement) return;
      Alert.alert(tr('Restaurar backup?'), tr('As partidas deste aparelho serão substituídas pelas do arquivo.'), [
        { text: tr('Cancelar'), style: 'cancel' },
        { text: tr('Restaurar'), onPress: () => {
          save(() => replacement);
          setUndo(undefined);
          setSelected(undefined);
          setPlacing(false);
          setPanel(null);
        } },
      ]);
    } catch { Alert.alert(tr('O arquivo de backup é inválido ou não pôde ser aberto.')); }
  }

  const area = byArea(profile?.area ?? areas[0].id);
  const marks = profile?.marks ?? {};
  const markOf = (point: Point) => marks[progressKey(point)] ?? blankMark;
  const visible = allPoints.filter(point => {
    const mark = markOf(point);
    return (spoilers || !point.spoiler) && (category === 'all' || category === point.category) &&
      (!hiddenOnly || point.hidden) && (type === 'Todos os tipos' || point.types?.includes(type)) &&
      (state === 'Todos' || (state === 'Concluídos' ? isComplete(point, mark) :
        state === 'Em andamento' ? mark.status > 0 && !isComplete(point, mark) : !isComplete(point, mark)));
  });
  const mapPoints = visible.filter(point => point.area === area.id);
  const needle = searchKey(query.trim());
  const diary = visible.filter(point => (!onlyArea || point.area === area.id) &&
    searchKey([point.title, point.place, byArea(point.area).title, ...(point.types ?? []), markOf(point).note].join(' ')).includes(needle))
    .sort((a, b) => Number(markOf(b).pinned) - Number(markOf(a).pinned));
  const total = new Map(points.map(point => [progressKey(point), point]));
  const complete = [...total.values()].filter(point => isComplete(point, markOf(point))).length;
  const areaPoints = allPoints.filter(point => point.area === area.id);
  const typeOptions = [...new Set(points.flatMap(point => point.types ?? []))].sort();
  const nextGoal = goals.find(point => !isComplete(point, markOf(point)));
  const captured = new Set(points.filter(point => point.species && isComplete(point, markOf(point))).map(point => point.species));
  const areaProgress = (id: AreaId) => {
    const entries = allPoints.filter(point => point.area === id);
    return { done: entries.filter(point => isComplete(point, markOf(point))).length, total: entries.length };
  };
  const areaStatus = areaProgress(area.id);

  function open(point: Point) {
    setCluster([]);
    updateProfile(previous => ({ ...previous, area: point.area, lastPoint: point.id }));
    setSelected(point);
  }

  function updateMark(point: Point, changes: Partial<Mark>, undoStatus = false) {
    if (!profile) return;
    const key = progressKey(point);
    if (undoStatus) setUndo({ profileId: profile.id, key, before: profile.marks[key] });
    updateProfile(previous => ({ ...previous, marks: { ...previous.marks,
      [key]: { ...(previous.marks[key] ?? blankMark), ...changes } } }));
  }

  function undoLast() {
    if (!undo) return;
    updateProfile(previous => {
      const restored = { ...previous.marks };
      const latest = restored[undo.key];
      if (undo.before || latest?.note || latest?.pinned) restored[undo.key] = {
        ...(latest ?? blankMark), status: undo.before?.status ?? 0, at: undo.before?.at,
      };
      else delete restored[undo.key];
      return { ...previous, marks: restored };
    }, undo.profileId);
    setUndo(undefined);
  }

  function addPoint(title: string, description: string, kind: Category) {
    if (!newPosition) return;
    const point: Point = { ...newPosition, id: 'custom-' + makeId(), title, description, category: kind, place: byArea(newPosition.area).title };
    updateProfile(previous => ({ ...previous, lastPoint: point.id, custom: [...previous.custom, point] }));
    setState('Todos');
    setCategory('all');
    setPanel(null);
    setSelected(point);
  }

  function removePoint(point: Point) {
    Alert.alert(tr('Excluir ponto pessoal?'), point.title, [
      { text: tr('Cancelar'), style: 'cancel' },
      { text: tr('Excluir'), style: 'destructive', onPress: () => {
        updateProfile(previous => {
          const nextMarks = { ...previous.marks };
          delete nextMarks[point.id];
          return { ...previous, custom: previous.custom.filter(item => item.id !== point.id),
            lastPoint: previous.lastPoint === point.id ? undefined : previous.lastPoint, marks: nextMarks };
        });
        setUndo(undefined);
        setSelected(undefined);
      } },
    ]);
  }

  const openRegion = (group: Point[]) => {
    setFull(false);
    if (group.length > 1) { setCluster(group); return; }
    updateProfile(previous => ({ ...previous, area: group[0].area }));
    setTab('map');
  };
  const regionMarkers = regionalPoints.map(point => ({ point,
    done: goals.some(goal => goal.area === point.area && isComplete(goal, markOf(goal))) }));
  return <View style={[layout.wide, { paddingHorizontal: 11, paddingVertical: 7, gap: 6 }]}>
    {full && <Modal visible onRequestClose={() => setFull(false)} animationType="fade">
      <SafeAreaView style={{ flex: 1, gap: 5, padding: 8, backgroundColor: t.page }}>
        <Button dense label="Sair da tela cheia" icon="contract-outline" onPress={() => setFull(false)} />
        <MapCanvas area={regional} placing={false} markers={regionMarkers} onOpen={openRegion} onPlace={() => {}} />
      </SafeAreaView>
    </Modal>}
    <View style={[layout.row, { justifyContent: 'space-between' }]}>
      <View style={layout.wrap}><CopyText kind="title">Mapa e Diário</CopyText><GameLogo version={edition.version} title={edition.title} /></View>
      <Button compact label="" icon="archive-outline" hint="Backup das partidas" onPress={() => setPanel('backup')} />
    </View>
    {saveFailed && <CopyText style={{ color: t.red }}>Falha ao carregar ou salvar o diário. Exporte um backup se possível.</CopyText>}
    {!profile ? <Card>
      <CopyText kind="title">Sua primeira partida</CopyText>
      <CopyText>Crie uma partida para registrar capturas, coletas, NPCs e objetivos.</CopyText>
      <Button label="Nova partida" icon="add" primary onPress={() => setPanel('newProfile')} />
    </Card> : <>
      <View style={[layout.row, { flexWrap: 'wrap' }]}>
        <Button dense label={profile.name} hint={tr('Partida: {name}', { name: profile.name })} icon="game-controller-outline"
          trailing="chevron-down" onPress={() => setPanel('profiles')} />
        <View><Badge>{tr('{done}/{total} pontos', { done: complete, total: total.size })}</Badge></View>
        <CopyText kind="muted">{tr('{count} capturados', {
          count: captured.size,
        })}</CopyText>
      </View>
      <View style={layout.wrap}>
        <Button dense label="Mapa" selected={tab === 'map'} icon="map-outline" onPress={() => setTab('map')} />
        <Button dense label="Região" selected={tab === 'region'} icon="earth-outline" onPress={() => { setTab('region'); setPlacing(false); }} />
        <Button dense label="Diário" selected={tab === 'diary'} icon="list-outline" onPress={() => { setTab('diary'); setPlacing(false); }} />
        <Button dense label="Filtros" selected={category !== 'all' || state !== 'Todos' || hiddenOnly || type !== 'Todos os tipos'} icon="options-outline" onPress={() => setPanel('filters')} />
        {undo && <Button label="Desfazer" icon="arrow-undo-outline" onPress={undoLast} />}
      </View>
      {nextGoal && <Button label={tr('Próximo objetivo · {name}', { name: nextGoal.title })} dense
        icon="flag-outline" trailing="chevron-forward" onPress={() => open(nextGoal)} />}
      {tab === 'map' ? <>
        <View style={layout.wrap}>
          <Button dense label={area.title} hint={tr('Área: {name}', { name: area.title })} icon="location-outline" trailing="chevron-down"
            onPress={() => setPanel('areas')} />
          <Button dense label={placing ? 'Cancelar' : 'Novo ponto'} icon={placing ? 'close' : 'add'}
            disabled={!placing && profile.custom.length >= 100} onPress={() => setPlacing(!placing)} />
        </View>
        {placing && <CopyText kind="muted">Toque em um local no mapa para criar um ponto pessoal.</CopyText>}
        {area.backdrop && <CopyText kind="muted">Recorte regional · marcadores indicativos</CopyText>}
        <MapCanvas key={profile.id + '/' + area.id} area={area} placing={placing}
          focus={allPoints.find(point => point.id === profile.lastPoint)}
          markers={mapPoints.map(point => ({ point, done: isComplete(point, markOf(point)) }))}
          onOpen={group => group.length === 1 ? open(group[0]) : setCluster(group)}
          onPlace={(x, y) => { setNewPosition({ area: area.id, x, y }); setPlacing(false); setPanel('newPoint'); }} />
        {!placing && <Button label={areaStatus.done === areaStatus.total ? 'Área concluída' : tr('{done}/{total} pontos nesta área', areaStatus)}
          dense icon="checkmark-circle-outline" onPress={() => setPanel('areaStatus')} />}
      </> : tab === 'region' ? <>
        <CopyText kind="muted">{tr('Mapa regional de referência · {name}', {
          name: regional.title[0].toUpperCase() + regional.title.slice(1),
        })}</CopyText>
        <Button dense label="Tela cheia" icon="expand-outline" onPress={() => setFull(true)} />
        <MapCanvas key={regional.id} area={regional} placing={false} markers={regionMarkers}
          onOpen={openRegion} onPlace={() => {}} />
      </> : <>
        <Search label="Buscar no diário" value={query} onChange={setQuery} />
        <View style={layout.wrap}>
          <Button label="Só a área atual" selected={onlyArea} onPress={() => setOnlyArea(!onlyArea)} />
          {stateFilters.map(value => <Button key={value} label={value} selected={state === value} onPress={() => setState(value)} />)}
        </View>
        <FlatList style={{ flex: 1 }} data={diary} keyExtractor={point => point.id} keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 7, paddingBottom: 8 }}
          ListEmptyComponent={<EmptyState title="Nenhum ponto encontrado" message="Tente outro termo ou ajuste os filtros." />}
          renderItem={({ item }) => <PointRow point={item} mark={markOf(item)} open={() => open(item)} />} />
      </>}
    </>}
    {panel === 'profiles' && <Sheet title="Partidas" bottom close={() => setPanel(null)}>
      {journal.profiles.map(entry => <Button key={entry.id} label={entry.name} selected={entry.id === journal.active} onPress={() => {
        save(previous => ({ ...previous, active: entry.id }));
        setUndo(undefined); setPanel(null); setPlacing(false);
      }} />)}
      <Button label="Nova partida" icon="add" disabled={journal.profiles.length >= 20} onPress={() => setPanel('newProfile')} />
    </Sheet>}
    {panel === 'newProfile' && <NameForm close={() => setPanel(null)} onSave={newProfile} />}
    {panel === 'areas' && <Sheet title="Etapas da jornada" bottom close={() => setPanel(null)}>
      {areas.map((entry, index) => <Button key={entry.id}
        label={`${index + 1}. ${entry.title} · ${areaProgress(entry.id).done}/${areaProgress(entry.id).total}`}
        selected={area.id === entry.id} onPress={() => {
        updateProfile(previous => ({ ...previous, area: entry.id }));
        setPlacing(false); setPanel(null);
      }} />)}
    </Sheet>}
    {panel === 'areaStatus' && <Sheet title="Progresso da área" bottom close={() => setPanel(null)}>
      <CopyText kind="title">{area.title}</CopyText>
      {areaStatus.done === areaStatus.total && <CopyText kind="accent">Área concluída</CopyText>}
      {categoryKeys.map(key => {
        const entries = areaPoints.filter(point => point.category === key);
        const done = entries.filter(point => isComplete(point, markOf(point))).length;
        return <CopyText key={key}>{tr(categories[key]) + ' · ' + done + '/' + entries.length}</CopyText>;
      })}
      <Button label="Ver registros desta área" icon="list-outline" onPress={() => {
        setOnlyArea(true); setTab('diary'); setPanel(null); setCategory('all'); setType('Todos os tipos');
        setHiddenOnly(false); setState('Todos'); setQuery('');
      }} />
      {areaStatus.done === areaStatus.total && nextGoal && <Button label="Ir para o próximo objetivo" primary
        onPress={() => { setPanel(null); open(nextGoal); }} />}
    </Sheet>}
    {panel === 'filters' && <Sheet title="Filtros" bottom close={() => setPanel(null)}>
      <CopyText kind="title">Categoria</CopyText>
      <CopyText kind="muted">{categoryKeys.map(key => {
        const subset = [...total.values()].filter(point => point.category === key);
        return tr(categories[key]) + ' ' + subset.filter(point => isComplete(point, markOf(point))).length + '/' + subset.length;
      }).join(' · ')}</CopyText>
      <View style={layout.wrap}>
        <Button label="Todos" selected={category === 'all'} onPress={() => setCategory('all')} />
        {categoryKeys.map(key => <Button key={key} label={categories[key]} selected={category === key} onPress={() => {
          setCategory(key);
          if (key !== 'item') setHiddenOnly(false);
          if (key !== 'pokemon') setType('Todos os tipos');
        }} />)}
      </View>
      <CopyText kind="title">Progresso</CopyText>
      <View style={layout.wrap}>{stateFilters.map(value => <Button key={value} label={value} selected={state === value} onPress={() => setState(value)} />)}</View>
      <Button label="Mostrar spoilers" selected={spoilers} icon={spoilers ? 'eye' : 'eye-off-outline'} onPress={() => setSpoilers(!spoilers)} />
      <Button label="Só itens escondidos" selected={hiddenOnly} icon="eye-off-outline" onPress={() => {
        setHiddenOnly(!hiddenOnly); setCategory('all'); setType('Todos os tipos');
      }} />
      <Choice title="Selecione o tipo" options={['Todos os tipos', ...typeOptions]} value={type} select={value => {
        setType(value); setHiddenOnly(false); setCategory('all');
      }} />
    </Sheet>}
    {panel === 'backup' && <Sheet title="Backup das partidas" bottom close={() => setPanel(null)}>
      <CopyText>O diário fica neste aparelho. Exporte um arquivo para guardar ou restaurar depois.</CopyText>
      <Button label="Exportar arquivo" icon="share-outline" disabled={!profile} onPress={() => void backup()} />
      <Button label="Restaurar arquivo" icon="document-attach-outline" onPress={() => void restore()} />
    </Sheet>}
    {panel === 'newPoint' && <PointForm close={() => setPanel(null)} onSave={addPoint} />}
    {cluster.length > 0 && <Sheet title="Pontos próximos" bottom close={() => setCluster([])}>
      {cluster.map(point => <PointRow key={point.id} point={point} mark={markOf(point)} open={() => {
        if (tab === 'region') {
          updateProfile(previous => ({ ...previous, area: point.area }));
          setCluster([]); setTab('map');
        } else open(point);
      }} />)}
    </Sheet>}
    {selected && <PointPanel key={selected.id} point={selected} edition={edition} areaTitle={byArea(selected.area).title} mark={markOf(selected)}
      canUndo={undo?.key === progressKey(selected) && undo.profileId === profile?.id}
      close={() => setSelected(undefined)} undo={undoLast}
      remove={selected.id.startsWith('custom-') ? () => removePoint(selected) : undefined}
      status={value => updateMark(selected, { status: value, at: selected.id }, true)}
      note={value => updateMark(selected, { note: value })}
      pin={() => updateMark(selected, { pinned: !markOf(selected).pinned })}
      locate={() => {
        updateProfile(previous => ({ ...previous, area: selected.area, lastPoint: selected.id }));
        setTab('map'); setSelected(undefined);
      }} />}
  </View>;
}

function PointRow({ point, mark, open }: { point: Point; mark: Mark; open: () => void }) {
  const { tr } = useLocale();
  return <Card style={{ paddingVertical: 7 }}><Pressable accessibilityRole="button" accessibilityLabel={tr(point.title) + ' · ' + tr(point.place)}
    onPress={open} style={layout.row}>
    <Icon name={isComplete(point, mark) ? 'checkmark-circle' : pointIcon(point)} />
    <View style={layout.grow}>
      <CopyText kind="title">{point.title}</CopyText>
      <CopyText kind="muted">{point.place}</CopyText>
      <CopyText kind="muted">{statuses[point.category][mark.status]}</CopyText>
    </View>
    {mark.pinned && <Icon name="pin" size={16} />}
    <Icon name="chevron-forward" size={15} />
  </Pressable></Card>;
}

function PointPanel({ point, edition, areaTitle, mark, canUndo, close, undo, status, note, pin, locate, remove }: {
  point: Point; edition: Edition; areaTitle: string; mark: Mark; canUndo: boolean; close: () => void; undo: () => void; status: (value: number) => void;
  note: (value: string) => void; pin: () => void; locate: () => void; remove?: () => void;
}) {
  const { tr } = useLocale();
  const [draft, setDraft] = useState(mark.note);
  const gym = point.category === 'objective' && point.id.endsWith('-story') ? gymFor(edition, point.area) : undefined;
  return <Sheet title={point.title} bottom keyboard close={close}>
    <View style={layout.row}>
      {(point.art || point.species) ? <Art name={point.art} id={point.species} size={48} /> : <Icon name={pointIcon(point)} />}
      <View style={layout.grow}><CopyText kind="title">{point.place}</CopyText><CopyText kind="muted">{areaTitle}</CopyText></View>
    </View>
    {!!point.description && <CopyText>{point.description}</CopyText>}
    {gym && <GymDetails gym={gym} edition={edition} />}
    {point.hidden && <Badge>Item escondido</Badge>}
    {!!point.types?.length && <Types values={point.types} />}
    {!!point.encounters?.length && <View style={{ gap: 4 }}>
      <CopyText kind="title">Como encontrar</CopyText>
      {point.encounters.map(({ method, subarea, low, high }) => <CopyText key={method + '/' + subarea} kind="muted">
        {tr(encounterLabels[method] ?? method.replace(/-/g, ' ')) + (subarea ? ' · ' + subarea.replace(/-/g, ' ') : '') +
          ' · ' + tr('Nv. {level}', { level: low === high ? low : low + '–' + high })}
      </CopyText>)}
    </View>}
    {!!point.requirement && <><CopyText kind="title">Requisito</CopyText><CopyText>{point.requirement}</CopyText></>}
    <CopyText kind="title">Progresso</CopyText>
    <View style={layout.wrap}>{statuses[point.category].map((name, index) =>
      <Button key={name} label={name} selected={index === mark.status} onPress={() => { if (index !== mark.status) status(index); }} />)}
    </View>
    <View style={layout.wrap}>
      <Button label={mark.pinned ? 'Desafixar' : 'Fixar no diário'} icon="pin-outline" onPress={pin} />
      <Button label="Ver no mapa" icon="locate-outline" onPress={locate} />
      {canUndo && <Button label="Desfazer" icon="arrow-undo-outline" onPress={undo} />}
    </View>
    <Input label="Anotação" value={draft} change={setDraft} limit={500} multiline />
    <Button label="Salvar anotação" disabled={draft === mark.note} onPress={() => note(draft)} />
    {remove && <Button label="Excluir ponto pessoal" icon="trash-outline" onPress={remove} />}
  </Sheet>;
}

const encounterLabels: Record<string, string> = {
  walk: 'A pé', surf: 'Surf', 'old-rod': 'Old Rod', 'good-rod': 'Good Rod', 'super-rod': 'Super Rod',
  'rock-smash': 'Rock Smash', headbutt: 'Headbutt',
};

function NameForm({ close, onSave }: { close: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState('');
  const submit = () => { if (name.trim()) onSave(name.trim()); };
  return <Sheet title="Nova partida" bottom keyboard close={close}>
    <Input label="Nome da partida" value={name} change={setName} limit={48} submit={submit} />
    <Button label="Criar partida" primary disabled={!name.trim()} onPress={submit} />
  </Sheet>;
}

function PointForm({ close, onSave }: { close: () => void; onSave: (title: string, description: string, category: Category) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('objective');
  return <Sheet title="Novo ponto pessoal" bottom keyboard close={close}>
    <Input label="Nome do ponto" value={name} change={setName} limit={70} />
    <Input label="Detalhes" value={description} change={setDescription} limit={500} multiline />
    <View style={layout.wrap}>{categoryKeys.map(key =>
      <Button key={key} label={categories[key]} selected={category === key} onPress={() => setCategory(key)} />)}</View>
    <Button label="Salvar ponto" primary disabled={!name.trim()} onPress={() => onSave(name.trim(), description.trim(), category)} />
  </Sheet>;
}

function Input({ label, value, change, limit, multiline = false, submit }: {
  label: string; value: string; change: (text: string) => void; limit: number; multiline?: boolean; submit?: () => void;
}) {
  const t = useTheme();
  const { tr } = useLocale();
  return <TextInput accessibilityLabel={tr(label)} placeholder={tr(label)} placeholderTextColor={t.muted}
    value={value} onChangeText={change} maxLength={limit} multiline={multiline} onSubmitEditing={submit}
    style={{ minHeight: multiline ? 66 : 46, padding: 11, borderWidth: 1, borderColor: t.line,
      borderRadius: 12, color: t.text, textAlignVertical: multiline ? 'top' : 'center', fontSize: 16 }} />;
}
