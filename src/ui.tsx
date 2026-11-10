import React, { createContext, useContext, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextStyle, type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sprites, animations } from './data/images';
import { gameLogos } from './data/game-logos';
import gifSizes from './data/gif-sizes.json';
import gifBounds from './data/gif-bounds.json';
import { useLocale } from './locale';
import { dexNumber, spriteKey } from './catalog';

export const light = {
  page: '#F8F5EF', panel: '#FFFDFC', text: '#101B30', muted: '#505D70',
  line: '#DDD9D2', blue: '#203B68', red: '#A9212D', yellow: '#FFBF12',
  code: '#071328', selection: '#FCE7E2', warn: '#FFF1CD', dark: false,
};
export const dark = {
  page: '#091326', panel: '#132038', text: '#FFF9EE', muted: '#B2BED1',
  line: '#344057', blue: '#A9C7FF', red: '#FF8B85', yellow: '#FFCE45',
  code: '#060D1B', selection: '#412733', warn: '#372B16', dark: true,
};
export const Theme = createContext(light);
export const useTheme = () => useContext(Theme);
export const Motion = createContext(true);
export const brand = { navy: '#071328', cream: '#FFF9EE', red: '#FF4949', yellow: '#FFBF12' };
export const logo = require('../assets/pokefinder-logo.png');
export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) {
  const t = useTheme();
  return <Ionicons name={name} size={size} color={color ?? t.blue} accessible={false} />;
}

export const layout = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  grow: { flex: 1, minWidth: 0, gap: 4 },
  stack: { gap: 8 },
  list: { padding: 12, gap: 10 },
  centered: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  wide: { flex: 1, width: '100%', maxWidth: 1024, alignSelf: 'center' },
  card: { padding: 13, borderWidth: 1, borderRadius: 16, gap: 7 },
});

export function CopyText({ children, kind = 'body', style }: {
  children: React.ReactNode; kind?: 'body' | 'muted' | 'title' | 'heading' | 'accent'; style?: StyleProp<TextStyle>;
}) {
  const t = useTheme();
  const { tr } = useLocale();
  return <Text style={[
    { color: t.text, fontSize: 15, lineHeight: 22 },
    kind === 'muted' && { color: t.muted, fontSize: 13, lineHeight: 19 },
    kind === 'accent' && { color: t.blue, fontWeight: '600' },
    kind === 'title' && { fontSize: 17, fontWeight: '700', lineHeight: 24 },
    kind === 'heading' && { fontSize: 24, fontWeight: '800', lineHeight: 30 },
    style,
  ]}>{typeof children === 'string' ? tr(children) : children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[layout.card, { backgroundColor: t.panel, borderColor: t.line }, style]}>{children}</View>;
}

const symbols: Record<string, IconName> = {
  '☰': 'menu', '‹': 'chevron-back', '×': 'close', '−': 'remove-circle-outline',
  'ⓘ': 'information-circle-outline', '★': 'star', '☆': 'star-outline',
  '♥': 'heart', '♡': 'heart-outline',
};

export function Button({ label, onPress, selected = false, disabled = false, hint, compact = false,
  icon, trailing, primary = false }: {
  label: string; onPress: () => void; selected?: boolean; disabled?: boolean; hint?: string; compact?: boolean;
  icon?: IconName; trailing?: IconName; primary?: boolean;
}) {
  const t = useTheme();
  const leading = icon ?? (compact ? symbols[label] : undefined);
  const { tr } = useLocale();
  const color = primary ? brand.cream : selected ? t.red : t.blue;
  return <Pressable accessibilityRole="button" accessibilityLabel={tr(hint ?? label)}
    accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => ({
      justifyContent: 'center', minHeight: 44, minWidth: 44, alignItems: 'center', flexShrink: 1, flexDirection: 'row', gap: 6,
      paddingHorizontal: compact ? 6 : 12, paddingVertical: 6, borderRadius: compact ? 22 : 14,
      borderWidth: compact || primary ? 0 : 1, borderColor: selected ? t.red : t.line,
      backgroundColor: primary ? (pressed ? '#A9212D' : '#B62935') : selected || pressed ? t.selection : t.panel,
      opacity: disabled ? .5 : 1,
    })}>
    {leading && <Icon name={leading} size={compact ? 23 : 17} color={color} />}
    {(!compact || !leading) && <CopyText style={{ color, fontSize: 14, fontWeight: '700', flexShrink: 1 }}>{label}</CopyText>}
    {trailing && <Icon name={trailing} size={15} color={color} />}
  </Pressable>;
}

export function Link({ label, url }: { label: string; url: string }) {
  const { tr } = useLocale();
  return <Button label={label} trailing="open-outline" onPress={() => {
    if (url.startsWith('https://')) void Linking.openURL(url).catch(() => Alert.alert(tr('Não foi possível abrir o link.')));
  }} />;
}

export function Badge({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <CopyText kind="accent" style={{
    alignSelf: 'flex-start', flexShrink: 1, backgroundColor: t.page, borderColor: t.line, borderWidth: 1,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, fontSize: 12, lineHeight: 18,
  }}>{children}</CopyText>;
}

export function GameLogo({ version, title }: { version: string; title: string }) {
  const source = gameLogos[version];
  if (!source) return null;
  return <Image source={source} contentFit="contain" accessible accessibilityLabel={'Pokémon ' + title}
    style={{ width: 70, height: 31 }} />;
}

export function SectionHeading({ title, game, version, summary, icon }: {
  title: string; game: string; version: string; summary: string; icon: IconName;
}) {
  const t = useTheme();
  return <View style={[layout.stack, { paddingVertical: 3 }]}>
    <View style={layout.wrap}>
      <View style={{ width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: t.selection }}>
        <Icon name={icon} color={t.red} />
      </View>
      <CopyText kind="heading">{title}</CopyText><GameLogo version={version} title={game} />
    </View>
    <CopyText kind="muted">{summary}</CopyText>
  </View>;
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <Card style={{ alignItems: 'center', padding: 22 }}>
    <Icon name="search-outline" size={26} />
    <CopyText kind="title" style={{ textAlign: 'center' }}>{title}</CopyText>
    <CopyText kind="muted" style={{ textAlign: 'center' }}>{message}</CopyText>
  </Card>;
}

export function Search({ label, value, onChange }: { label: string; value: string; onChange: (s: string) => void }) {
  const t = useTheme();
  const { tr } = useLocale();
  const [focused, setFocused] = useState(false);
  return <View style={[layout.row, { minHeight: 48, paddingLeft: 13, backgroundColor: t.panel,
    borderColor: focused ? t.blue : t.line, borderWidth: 1, borderRadius: 26 }]}>
    <Icon name="search-outline" color={t.muted} />
    <TextInput accessibilityLabel={tr(label)} placeholder={tr(label)} placeholderTextColor={t.muted}
      value={value} onChangeText={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      autoCorrect={false} returnKeyType="search"
      style={{ flex: 1, minHeight: 46, paddingVertical: 8, paddingRight: value ? 0 : 13, color: t.text, fontSize: 15 }} />
    {!!value && <Button label="×" compact hint="Limpar busca" onPress={() => onChange('')} />}
  </View>;
}

export function Sheet({ title, children, close, bottom = false, keyboard = false }: {
  title: string; children: React.ReactNode; close: () => void; bottom?: boolean; keyboard?: boolean;
}) {
  const t = useTheme();
  const motion = useContext(Motion);
  const insets = useSafeAreaInsets();
  return <Modal visible transparent animationType={motion ? 'fade' : 'none'} onRequestClose={close}>
    <KeyboardAvoidingView enabled={keyboard} behavior={Platform.OS === 'android' ? 'height' : 'padding'}
      style={{ flex: 1, justifyContent: bottom ? 'flex-end' : 'center', paddingHorizontal: bottom ? 0 : 16,
      backgroundColor: '#0713289C' }}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} accessible={false} />
      <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 480, maxHeight: '86%',
        alignSelf: 'center', backgroundColor: t.panel, borderRadius: 24, padding: 14,
        paddingBottom: bottom ? Math.max(14, insets.bottom) : 14, gap: 8 }}>
        {bottom && <View style={{ width: 36, height: 4, borderRadius: 3, backgroundColor: t.line, alignSelf: 'center' }} />}
        <View style={layout.row}>
          <CopyText kind="heading" style={{ flex: 1 }}>{title}</CopyText>
          <Button label="×" hint="Fechar" compact onPress={close} />
        </View>
        <ScrollView contentContainerStyle={layout.stack} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

export function Choice({ title, value, options, select, dex = false, typePicker = false }: {
  title: string; value: string; options: string[]; select: (s: string) => void; dex?: boolean; typePicker?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const t = useTheme();
  const { tr } = useLocale();
  return <>
    {dex ? <Pressable accessibilityRole="button" accessibilityLabel={tr(title) + ': ' + tr(value)}
      accessibilityState={{ expanded: open }} onPress={() => setOpen(true)}
      style={[layout.row, { minHeight: 44, flexShrink: 1, backgroundColor: '#23252B', borderRadius: 24, paddingHorizontal: 13 }]}>
      <CopyText style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13, flexShrink: 1 }}>{value}</CopyText>
      <Icon name="chevron-down" size={15} color="#FFFFFF" />
    </Pressable> : <Button label={tr('{title} · {value}', { title: tr(title), value: tr(value) })}
      trailing="chevron-down" onPress={() => setOpen(true)} />}
    {open && <Sheet title={title} bottom close={() => setOpen(false)}>
      {options.map(option => {
        const chosen = option === value;
        const colored = typePicker && option in tones;
        const color = colored ? brand.navy : dex ? '#FFFFFF' : t.text;
        return <Pressable key={option} accessibilityRole="radio" accessibilityLabel={tr(option)} accessibilityState={{ checked: chosen }}
          onPress={() => { select(option); setOpen(false); }} style={({ pressed }) => ({
            minHeight: 46, borderRadius: 25, alignItems: 'center', justifyContent: 'center',
            paddingHorizontal: 14, opacity: pressed ? .75 : 1,
            backgroundColor: colored ? tone(option) : dex ? '#23252B' : chosen ? t.selection : t.page,
          })}>
          <View style={layout.row}>{colored && <TypeSymbol type={option} size={17} color={color} />}
            <CopyText style={{ color, fontWeight: '700' }}>{option}</CopyText>
            {chosen && <Icon name="checkmark" size={18} color={color} />}
          </View>
        </Pressable>;
      })}
    </Sheet>}
  </>;
}

const tones: Record<string, string> = {
  Normal: '#A1A4AC', Lutador: '#D65C7B', Voador: '#8EA9E6', Venenoso: '#AC72CE',
  Terrestre: '#D59268', Pedra: '#B7A377', Inseto: '#A8BD56', Fantasma: '#7874C3',
  Aço: '#7FA6B1', Fogo: '#FF9D54', Água: '#65A7E4', Planta: '#65B95C',
  Elétrico: '#F5CC48', Psíquico: '#F37694', Gelo: '#80CFC9', Dragão: '#698CDB',
  Sombrio: '#8D839F', Fada: '#E98EE4',
};
export const tone = (type: string) => tones[type] ?? tones.Normal;
const typeIcons: Record<string, number> = {
  Normal: require('../assets/type-icons/normal.png'), Lutador: require('../assets/type-icons/fighting.png'),
  Voador: require('../assets/type-icons/flying.png'), Venenoso: require('../assets/type-icons/poison.png'),
  Terrestre: require('../assets/type-icons/ground.png'), Pedra: require('../assets/type-icons/rock.png'),
  Inseto: require('../assets/type-icons/bug.png'), Fantasma: require('../assets/type-icons/ghost.png'),
  Aço: require('../assets/type-icons/steel.png'), Fogo: require('../assets/type-icons/fire.png'),
  Água: require('../assets/type-icons/water.png'), Planta: require('../assets/type-icons/grass.png'),
  Elétrico: require('../assets/type-icons/electric.png'), Psíquico: require('../assets/type-icons/psychic.png'),
  Gelo: require('../assets/type-icons/ice.png'), Dragão: require('../assets/type-icons/dragon.png'),
  Sombrio: require('../assets/type-icons/dark.png'), Fada: require('../assets/type-icons/fairy.png'),
};
export function TypeSymbol({ type, size, color }: { type: string; size: number; color: string }) {
  return <Image source={typeIcons[type] ?? typeIcons.Normal} tintColor={color} accessible={false}
    contentFit="contain" style={{ width: size, height: size }} />;
}

export function Types({ values }: { values: string[] }) {
  return <View style={[layout.wrap, { gap: 4 }]}>{values.map(type => <View key={type}
    style={[layout.row, { gap: 4, backgroundColor: tone(type), borderRadius: 18, paddingHorizontal: 6, paddingVertical: 2 }]}>
    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFF9EE', alignItems: 'center', justifyContent: 'center' }}>
      <TypeSymbol type={type} size={12} color={brand.navy} />
    </View>
    <CopyText style={{ color: brand.navy, fontSize: 11, fontWeight: '700', lineHeight: 16 }}>{type}</CopyText>
  </View>)}</View>;
}

const gifKey = (game: string | undefined, id: number) => (game === 'crystal' ? 'crystal/' : 'showdown/') + id;
const dimensions: Record<string, number[]> = gifSizes;
const bounds: Record<string, number[]> = gifBounds;
export const spriteDimensions = (game: string | undefined, id: number, fallback: number) =>
  dimensions[gifKey(game, id)] ?? [fallback, fallback];

export function Art({ name, id, size, game, animated = false, visualSize }: {
  name?: string; id?: number; size: number; game?: string; animated?: boolean; visualSize?: number;
}) {
  const [failed, setFailed] = useState(false);
  const motion = useContext(Motion);
  const animation = motion && animated && id !== undefined
    ? animations[gifKey(game, id)] : undefined;
  const staticImage = sprites[name ?? (id === undefined ? '' : spriteKey(id))];
  const source = !failed && animation ? animation : staticImage;
  const [width, height] = animated && id !== undefined ? spriteDimensions(game, id, size) : [size, size];
  // Center Mewtwo's torso. Its animated tail occupies the right side of the canvas.
  const offsetX = id === 150 && animation && !failed ? (game === 'crystal' ? 2 : 21) : 0;
  if (visualSize !== undefined && source && id !== undefined) {
    const [left, top, right, bottom] = animation && !failed ? bounds[gifKey(game, id)] ?? [0, 0, width, height] : [0, 0, 1, 1];
    const scale = visualSize / Math.max(right - left, bottom - top);
    const imageWidth = (animation && !failed ? width : 1) * scale;
    const imageHeight = (animation && !failed ? height : 1) * scale;
    return <View style={{ width: visualSize, height: visualSize }}>
      <Image source={source} autoplay={!!animation && !failed} contentFit="contain"
        onError={animation && !failed ? () => setFailed(true) : undefined} accessible={false}
        style={{ position: 'absolute', left: (visualSize - (left + right) * scale) / 2 + offsetX * scale,
          top: (visualSize - (top + bottom) * scale) / 2, width: imageWidth, height: imageHeight }} />
    </View>;
  }
  return source ? <Image source={source} autoplay={!!animation && !failed} contentFit="contain"
    onError={animation && !failed ? () => setFailed(true) : undefined}
    style={{ width, height, transform: [{ translateX: offsetX }] }} accessible={false} />
    : <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <CopyText kind="muted">{id === undefined ? '◇' : dexNumber(id)}</CopyText>
    </View>;
}
