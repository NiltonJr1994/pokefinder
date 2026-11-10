import React, { useContext, useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { available, editions, upcomingEditions, type Edition, type Section, sections } from './catalog';
import { gameLogos } from './data/game-logos';
import { useLocale } from './locale';
import { Button, CopyText, Icon, type IconName, layout, logo, Motion, useTheme } from './ui';

export const sectionIcons: Record<Section, IconName> = {
  codes: 'code-slash-outline', items: 'bag-handle-outline', tms: 'disc-outline', hms: 'albums-outline',
  tips: 'bulb-outline', guides: 'map-outline', dex: 'grid-outline', help: 'help-circle-outline',
  cheats: 'game-controller-outline', updates: 'cloud-download-outline', credits: 'people-outline',
  settings: 'settings-outline', journal: 'location-outline',
};

export function Logo({ width, height }: { width: number | '100%'; height: number }) {
  return <Image source={logo} contentFit="contain" accessible accessibilityLabel="PokeFinder" style={{ width, height }} />;
}

export function MainTabs({ route, drawer, select, open }: {
  route: Section; drawer: boolean; select: (route: Section) => void; open: () => void;
}) {
  const t = useTheme();
  const { tr } = useLocale();
  const tabs = ['codes', 'items', 'dex', 'tips', 'more'] as const;
  const inItems = route === 'items' || route === 'tms' || route === 'hms';
  return <View accessibilityRole="tablist" style={{ flexDirection: 'row', borderTopWidth: 1,
    borderColor: t.line, backgroundColor: t.panel, paddingHorizontal: 4, width: '100%' }}>
    {tabs.map(item => {
      const active = item === 'more' ? drawer || !['codes', 'items', 'tms', 'hms', 'dex', 'tips'].includes(route)
        : !drawer && (item === route || (item === 'items' && inItems));
      const label = item === 'more' ? 'Mais' : sections[item];
      const color = active ? t.red : t.muted;
      return <Pressable key={item} accessibilityRole="tab" accessibilityLabel={tr(label)}
        accessibilityState={{ selected: active }} onPress={item === 'more' ? open : () => select(item)}
        style={{ flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}>
        <View style={{ minWidth: 42, minHeight: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 12,
          backgroundColor: active ? t.selection : 'transparent' }}>
          <Icon name={item === 'more' ? 'ellipsis-horizontal' : sectionIcons[item]} size={item === 'dex' ? 22 : 20} color={color} />
        </View>
        <CopyText style={{ fontSize: 10, lineHeight: 15, color, fontWeight: active ? '800' : '600', textAlign: 'center' }}>{label}</CopyText>
      </Pressable>;
    })}
  </View>;
}

export function Drawer({ visible, edition, route, picking, tag, onPick, onGame, onRoute, onClose }: {
  visible: boolean; edition: Edition; route: Section; picking: boolean; tag: string;
  onPick: (value: boolean) => void; onGame: (game: Edition) => void; onRoute: (route: Section) => void; onClose: () => void;
}) {
  const t = useTheme();
  const { tr } = useLocale();
  const motion = useContext(Motion);
  const slide = useRef(new Animated.Value(370)).current;
  useEffect(() => {
    if (!visible) { slide.setValue(370); return; }
    if (!motion) { slide.setValue(0); return; }
    const animation = Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [visible, motion, slide]);
  const close = () => picking ? onPick(false) : onClose();
  const secondary: Section[] = ['journal', 'guides', 'help', 'cheats', 'updates', 'settings', 'credits'];
  return <Modal visible={visible} transparent animationType={motion ? 'fade' : 'none'} onRequestClose={close}>
    <View style={{ flex: 1, backgroundColor: '#0713289C' }}>
      <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={onClose} />
      <Animated.View style={{ flex: 1, width: '88%', maxWidth: 365, alignSelf: 'flex-end',
        borderTopLeftRadius: 24, borderBottomLeftRadius: 24, overflow: 'hidden', backgroundColor: t.panel,
        transform: [{ translateX: slide }] }}>
        <SafeAreaView accessibilityViewIsModal style={{ flex: 1 }}>
          <View style={[layout.row, { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: t.panel }]}>
            <View style={layout.grow}><Logo width="100%" height={56} /></View>
            <Button compact label="×" hint="Fechar menu" onPress={onClose} />
          </View>
          {picking ? <>
            <View style={[layout.row, { paddingHorizontal: 13, paddingTop: 10 }]}>
              <Button compact label="‹" hint="Voltar ao menu" onPress={() => onPick(false)} />
              <CopyText kind="title">Escolher jogo</CopyText>
            </View>
            <ScrollView key="editions" contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 14, gap: 4 }}>
              <CopyText kind="muted">Jogos disponíveis</CopyText>
              {editions.map(game => <MenuRow key={game.version} label={'Pokémon ' + game.title} game={game.version}
                icon="game-controller-outline" selected={edition.version === game.version} radio onPress={() => onGame(game)} />)}
              <CopyText kind="title" style={{ paddingTop: 10 }}>Em breve</CopyText>
              {upcomingEditions.map(([title, version]) => <MenuRow key={version} label={'Pokémon ' + title}
                icon="game-controller-outline" game={version} disabled />)}
            </ScrollView>
          </> : <ScrollView key="menu" contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 16, gap: 6 }}>
            <CopyText kind="muted" style={{ fontWeight: '700' }}>Jogo selecionado</CopyText>
            <MenuRow label={'Pokémon ' + edition.title} icon="game-controller-outline" game={edition.version}
              hint={tr('Escolher jogo. {game}', { game: 'Pokémon ' + edition.title })} trailing="chevron-down" onPress={() => onPick(true)} />
            <CopyText kind="muted" style={{ fontWeight: '700', paddingTop: 10 }}>Apoio</CopyText>
            {secondary.filter(item => available(item, edition)).map(item =>
              <MenuRow key={item} label={sections[item]} icon={sectionIcons[item]} selected={route === item}
                trailing={item === 'updates' && tag ? 'notifications' : undefined} onPress={() => onRoute(item)} />)}
          </ScrollView>}
        </SafeAreaView>
      </Animated.View>
    </View>
  </Modal>;
}

function MenuRow({ label, hint, icon, trailing, selected, game, radio, disabled, onPress }: {
  label: string; hint?: string; icon: IconName; trailing?: IconName; selected?: boolean;
  game?: string; radio?: boolean; disabled?: boolean; onPress?: () => void;
}) {
  const t = useTheme();
  const { tr } = useLocale();
  const art = game ? gameLogos[game] : undefined;
  return <Pressable accessibilityRole={radio ? 'radio' : 'button'}
    accessibilityLabel={tr(hint ?? label) + (disabled ? ', ' + tr('Aguarde!') : '')}
    accessibilityState={radio ? { checked: !!selected, disabled } : { selected: !!selected, disabled }}
    disabled={disabled} onPress={onPress}
    style={({ pressed }) => [layout.row, { minHeight: 52, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 13,
      backgroundColor: selected || pressed ? t.selection : game ? t.page : t.panel }]}>
    <View style={{ width: art ? 66 : 35, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10,
      backgroundColor: art ? '#FFF9EE' : selected ? t.panel : t.page, opacity: disabled ? .67 : 1 }}>
      {art ? <Image source={art} contentFit="contain" accessible={false} style={{ width: 60, height: 33 }} />
        : <Icon name={icon} size={19} color={selected ? t.red : t.blue} />}
    </View>
    <CopyText style={{ flex: 1, fontWeight: selected || game ? '800' : '600', color: disabled ? t.muted : selected ? t.red : t.text }}>{label}</CopyText>
    {disabled ? <CopyText kind="muted" style={{ fontSize: 11 }}>Aguarde!</CopyText>
      : radio && selected ? <Icon name="checkmark-circle" color={t.red} /> : trailing && <Icon name={trailing} size={17} />}
  </Pressable>;
}
