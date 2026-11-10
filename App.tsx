import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, BackHandler, Linking, View, useColorScheme, useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { available, byId, editions, type Edition, type Machine, type Section, sections } from './src/catalog';
import { Dex, PokemonDetail } from './src/dex';
import { CheatHelp, Credits, Help, Welcome } from './src/extras';
import { Updates, UpdatePrompt, useUpdates, type UpdatePrefs } from './src/updates';
import { Entries, Items, MachineDetail, Machines } from './src/reference';
import { brand, Button, CopyText, dark, layout, light, logo, Motion, Theme, useTheme } from './src/ui';
import { Drawer, Logo, MainTabs, sectionIcons } from './src/navigation';
import { Locale, languages, type Language, useLocale } from './src/locale';
import { Settings } from './src/settings';
import { MapJournal } from './src/map-journal';

void SplashScreen.preventAutoHideAsync().catch(() => {});

type Preferences = UpdatePrefs & {
  edition: string; dark: boolean | null; language: Language; onboarded: boolean; codeFavorites: string[]; dexFavorites: number[];
};
const defaults: Preferences = {
  edition: 'yellow', dark: null, language: 'pt-BR', onboarded: false, codeFavorites: [], dexFavorites: [],
  automatic: true, nextCheck: 0, remoteNotes: [], dismissedUpdate: '', checkedVersion: '', availableTag: '',
};
const storageKey = 'pokefinder/preferences-v1';

function usePreferences() {
  const [prefs, setPrefs] = useState(defaults);
  const [ready, setReady] = useState(false);
  const current = useRef(defaults);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(storageKey).then(value => {
      if (!active || !value) return;
      current.current = { ...defaults, ...JSON.parse(value) };
      setPrefs(current.current);
    }).catch(() => {}).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const save = useCallback((changes: Partial<Preferences> | ((prev: Preferences) => Partial<Preferences>)) => {
    const previous = current.current;
    const next = { ...previous, ...(typeof changes === 'function' ? changes(previous) : changes) };
    current.current = next;
    setPrefs(next);
    writes.current = writes.current.then(() => AsyncStorage.setItem(storageKey, JSON.stringify(next))).catch(() => {});
  }, []);
  return { prefs, ready, save };
}

const toggle = <T,>(values: T[], value: T) =>
  values.includes(value) ? values.filter(item => item !== value) : [...values, value];

function Opening({ finish }: { finish: () => void }) {
  const { width } = useWindowDimensions();
  const shown = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fallback = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(fallback.current); }, []);
  function start() {
    if (shown.current) return;
    shown.current = true;
    clearTimeout(fallback.current);
    SplashScreen.hide();
    timer.current = setTimeout(finish, 2000);
  }
  return <View onLayout={() => {
    if (!shown.current && !fallback.current) fallback.current = setTimeout(start, 1500);
  }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.cream }}>
    <StatusBar style="dark" />
    <Image source={logo} contentFit="contain" onDisplay={start} onError={start} accessible accessibilityLabel="PokeFinder"
      style={{ width: Math.min(420, width * .86), height: Math.min(140, width * .86 / 3) }} />
  </View>;
}

function Finder({ prefs, save, release }: {
  prefs: Preferences; save: ReturnType<typeof usePreferences>['save']; release: ReturnType<typeof useUpdates>;
}) {
  const t = useTheme();
  const { tr } = useLocale();
  const { width } = useWindowDimensions();
  const edition = editions.find(game => game.version === prefs.edition) ?? editions[0];
  const [route, setRoute] = useState<Section>(() => available('codes', edition) ? 'codes' : 'items');
  const [previous, setPrevious] = useState<Section | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [editionList, setEditionList] = useState(false);
  const [pokemonId, setPokemonId] = useState<number | null>(null);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [intro, setIntro] = useState(prefs.onboarded ? -1 : 0);
  const pokemon = pokemonId === null ? undefined : byId.get(pokemonId);
  const inDetail = !!(pokemon || machine);

  function closeIntro() {
    setIntro(-1);
    save({ onboarded: true });
  }

  function selectSection(section: Section) {
    setRoute(section);
    setPrevious(null);
    setMachine(null);
    setPokemonId(null);
    setDrawer(false);
    setEditionList(false);
  }

  function openCheats() {
    setPrevious(route);
    setRoute('cheats');
  }

  function goBack() {
    if (pokemonId !== null) setPokemonId(null);
    else if (machine) setMachine(null);
    else if (previous) { setRoute(previous); setPrevious(null); }
    else return false;
    return true;
  }

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => subscription.remove();
  });

  const codeFavorite = (id: string) => save(prev => ({ codeFavorites: toggle(prev.codeFavorites, id) }));
  const dexFavorite = (id: number) => save(prev => ({ dexFavorites: toggle(prev.dexFavorites, id) }));
  const openPokemon = setPokemonId;
  const closeDrawer = () => { setDrawer(false); setEditionList(false); };
  const openGamePicker = () => { setEditionList(true); setDrawer(true); };
  function changeGame(game: Edition) {
    if (game.version !== edition.version) {
      save({ edition: game.version });
      setPokemonId(null);
      setMachine(null);
    }
    setEditionList(false);
  }

  const sectionsContent = {
    codes: () => <Entries section="codes" edition={edition} favorites={prefs.codeFavorites} favorite={codeFavorite} openCheats={openCheats} />,
    tips: () => <Entries section="tips" edition={edition} favorites={prefs.codeFavorites} favorite={codeFavorite} openCheats={openCheats} />,
    guides: () => <Entries section="guides" edition={edition} favorites={prefs.codeFavorites} favorite={codeFavorite} openCheats={openCheats} />,
    items: () => <Items edition={edition} />,
    tms: () => <Machines edition={edition} section="tms" open={setMachine} />,
    hms: () => <Machines edition={edition} section="hms" open={setMachine} />,
    dex: () => <Dex edition={edition} columns={width >= 760 ? 2 : 1} favorites={prefs.dexFavorites} favorite={dexFavorite}
      open={openPokemon} />,
    help: () => <Help replay={() => setIntro(0)} cheats={openCheats} />,
    cheats: () => <CheatHelp />,
    updates: () => <Updates release={release} />,
    credits: () => <Credits />,
    journal: () => <MapJournal key={edition.version} edition={edition} />,
    settings: () => <Settings language={prefs.language} dark={prefs.dark}
      onLanguage={language => save({ language })} onTheme={dark => save({ dark })}
      automatic={release.automatic} onAutomatic={release.setAutomatic} />,
  };
  const inItems = route === 'items' || route === 'tms' || route === 'hms';

  return <SafeAreaView style={{ flex: 1, backgroundColor: t.page }}>
    <StatusBar style={t.dark ? 'light' : 'dark'} />
    {!pokemon && <View style={{ borderBottomWidth: 1, borderBottomColor: t.line, backgroundColor: t.panel }}>
      <View style={{ width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6, gap: 3 }}>
        {machine || previous ? <View style={layout.row}>
          <Button label="‹" hint="Voltar" compact onPress={goBack} />
          <CopyText kind="title" style={{ flex: 1 }}>{machine ? machine.move : sections[route]}</CopyText>
        </View> : <>
          <View style={layout.row}>
            <View style={{ width: 44 }} />
            <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
              <View style={{ width: '100%', maxWidth: 258, paddingHorizontal: 9 }}>
                <Logo width="100%" height={57} />
              </View>
            </View>
            <Button label="" icon="game-controller-outline" hint="Escolher jogo" compact onPress={openGamePicker} />
          </View>
          {!!release.tag && <Button icon={sectionIcons.updates} label={tr('Atualização disponível · {tag}', { tag: release.tag })}
            onPress={() => selectSection('updates')} />}
        </>}
      </View>
    </View>}
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, display: inDetail ? 'none' : 'flex' }}>
        {inItems && <View style={[layout.wrap, { alignSelf: 'center', paddingHorizontal: 12, paddingTop: 9 }]}>
          {(['items', 'tms', 'hms'] as const).map(item => <Button key={item} label={sections[item]}
            icon={sectionIcons[item]} selected={route === item} onPress={() => selectSection(item)} />)}
        </View>}
        <View key={edition.version + '/' + route} style={{ flex: 1 }}>
          {available(route, edition) ? sectionsContent[route]() : <View style={{ padding: 16, gap: 9 }}>
            <CopyText kind="heading">{sections[route]}</CopyText>
            <CopyText>{route === 'codes' ? 'Códigos indisponíveis para esta edição.' : route === 'guides'
              ? 'Detonado indisponível para esta edição.' : 'Pokédex indisponível para esta edição.'}</CopyText>
            <CopyText kind="muted">Selecione outro jogo para consultar esta seção.</CopyText>
            <Button label="Escolher jogo" icon="game-controller-outline" onPress={openGamePicker} />
          </View>}
        </View>
      </View>
      {pokemon && <PokemonDetail key={pokemon.id} pokemon={pokemon} edition={edition}
        favorites={prefs.dexFavorites} favorite={dexFavorite} open={openPokemon} back={goBack} />}
      {machine && <MachineDetail machine={machine} edition={edition}
        columns={Math.max(1, Math.min(7, Math.floor((width - 24) / 130)))} />}
    </View>
    {!inDetail && <MainTabs route={route} drawer={drawer} select={selectSection} open={() => setDrawer(true)} />}
    <Drawer visible={drawer} edition={edition} route={route} picking={editionList} tag={release.tag}
      onPick={setEditionList} onGame={changeGame} onRoute={selectSection} onClose={closeDrawer} />
    {intro >= 0 && <Welcome page={intro} select={setIntro} close={closeIntro} />}
    {intro < 0 && !drawer && !editionList && release.prompt && <UpdatePrompt release={release} open={() => {
      selectSection('updates');
      void Linking.openURL(release.url).catch(() => {});
    }} />}
  </SafeAreaView>;
}

export default function App() {
  const { prefs, ready, save } = usePreferences();
  const system = useColorScheme();
  const [motion, setMotion] = useState(true);
  const [opening, setOpening] = useState(true);
  const release = useUpdates(prefs, save, ready);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(reduced => { if (mounted) setMotion(!reduced); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', reduced => setMotion(!reduced));
    return () => { mounted = false; subscription.remove(); };
  }, []);
  const theme = (prefs.dark ?? (system === 'dark')) ? dark : light;
  return <SafeAreaProvider>
    <Locale.Provider value={prefs.language in languages ? prefs.language : 'pt-BR'}>
    <Theme.Provider value={theme}>
      <Motion.Provider value={motion}>
        {opening ? <Opening finish={() => setOpening(false)} /> : ready
          ? <Finder prefs={prefs} save={save} release={release} /> : <SafeAreaView style={{ flex: 1, backgroundColor: theme.page,
          justifyContent: 'center', alignItems: 'center' }}><CopyText>Carregando PokeFinder…</CopyText></SafeAreaView>}
      </Motion.Provider>
    </Theme.Provider>
    </Locale.Provider>
  </SafeAreaProvider>;
}
