import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, AppState, ScrollView, View } from 'react-native';
import { version } from '../package.json';
import build from './data/build.json';
import history from './data/release-history.json';
import { useLocale } from './locale';
import { Button, Card, CopyText, layout, Link, Motion, Sheet, useTheme } from './ui';

const repo = 'NiltonJr1994/pokefinder';
const releases = 'https://github.com/' + repo + '/releases';
const successInterval = 12 * 60 * 60 * 1000;
const retryInterval = 30 * 60 * 1000;
const stable = /^v?(0|[1-9]\d{0,8})\.(0|[1-9]\d{0,8})\.(0|[1-9]\d{0,8})$/i;
const normalized = (tag: string) => tag.trim().replace(/^v/i, '');
const compare = (a: string, b: string) => {
  const left = normalized(a).split('.').map(Number);
  const right = normalized(b).split('.').map(Number);
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
};

type ReleaseNote = { tag: string; body: string; publishedTag: string; apk?: string; revision?: number };
export type UpdatePrefs = {
  automatic: boolean; nextCheck: number; checkedVersion: string; remoteNotes: ReleaseNote[]; dismissedUpdate: string; availableTag: string;
};

export function parseReleases(value: unknown): ReleaseNote[] {
  if (!Array.isArray(value)) throw new Error('Invalid releases');
  return value.flatMap(row => {
    if (!row || row.draft !== false || row.prerelease !== false || typeof row.tag_name !== 'string'
      || !stable.test(row.tag_name.trim())) return [];
    const publishedTag = row.tag_name.trim();
    const tag = normalized(publishedTag);
    const candidates = (Array.isArray(row.assets) ? row.assets : []).flatMap((asset: { name?: string; browser_download_url?: string }) => {
      const match = /^PokeFinder-(\d+\.\d+\.\d+)-Android(?:-b(\d{1,9}))?\.apk$/.exec(asset?.name ?? '');
      const url = releases + '/download/' + encodeURIComponent(publishedTag) + '/' + encodeURIComponent(asset?.name ?? '');
      return match?.[1] === tag && asset.browser_download_url === url ? [{ apk: url, revision: Number(match[2] ?? 0) }] : [];
    }).sort((a: { revision: number }, b: { revision: number }) => b.revision - a.revision);
    return [{ tag, publishedTag, body: typeof row.body === 'string' ? row.body.trim().slice(0, 18000) : '', ...candidates[0] }];
  });
}

const newer = (note: ReleaseNote) => compare(note.tag, version) > 0 ||
  (compare(note.tag, version) === 0 && (note.revision ?? 0) > build.androidVersionCode);

export function useUpdates(prefs: UpdatePrefs, save: (changes: Partial<UpdatePrefs>) => void, ready: boolean) {
  const busy = useRef(false);
  const started = useRef(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState('');
  const current = useRef(prefs);
  current.current = prefs;
  const check = useCallback(async (force = false) => {
    const { automatic, nextCheck, checkedVersion } = current.current;
    const remaining = nextCheck - Date.now();
    if (!ready || busy.current || (!force && (!automatic ||
      (checkedVersion === version && remaining > 0 && remaining <= successInterval)))) return;
    busy.current = true;
    setChecking(true);
    setStatus('');
    let interval = retryInterval;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    try {
      const response = await fetch('https://api.github.com/repos/' + repo + '/releases?per_page=30', {
        headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal,
      });
      if (response.ok) {
        const incoming = parseReleases(await response.json());
        // Archive notes already seen while online, including releases older than the current API page.
        const cache = new Map(current.current.remoteNotes.map(note => [note.tag, note]));
        for (const note of incoming) cache.set(note.tag, note);
        const latest = incoming.filter(note => note.apk).sort((a, b) => compare(b.tag, a.tag))[0];
        setStatus(latest && newer(latest) ? 'Atualização disponível' : 'Nenhuma atualização disponível');
        save({ availableTag: latest?.tag ?? '',
          remoteNotes: [...cache.values()].sort((a, b) => compare(b.tag, a.tag)).slice(0, 35) });
        interval = successInterval;
      } else {
        setStatus('Não foi possível verificar atualizações');
      }
    } catch {
      setStatus('Não foi possível verificar atualizações');
    } finally {
      clearTimeout(timer);
      save({ nextCheck: Date.now() + interval, checkedVersion: version });
      busy.current = false;
      setChecking(false);
    }
  }, [ready, save]);
  useEffect(() => {
    if (!ready || !prefs.automatic) return;
    if (!started.current) { started.current = true; void check(true); }
    else void check();
    const event = AppState.addEventListener('change', state => { if (state === 'active') void check(); });
    return () => event.remove();
  }, [ready, prefs.automatic, check]);
  const latest = prefs.remoteNotes.find(note => note.tag === prefs.availableTag);
  const tag = latest?.apk && newer(latest) ? latest.tag : '';
  const offer = tag ? tag + '/' + (latest?.revision ?? 0) : '';
  const notes = new Map(history.map(note => [note.tag, note]));
  for (const note of prefs.remoteNotes) if (note.body || !notes.has(note.tag)) notes.set(note.tag, note);
  return {
    tag, url: tag ? latest?.apk ?? '' : '', checking, status, check: () => void check(true),
    notes: [...notes.values()].sort((a, b) => compare(b.tag, a.tag)),
    prompt: Boolean(tag && prefs.automatic && prefs.dismissedUpdate !== offer),
    dismiss: () => save({ dismissedUpdate: offer }),
    automatic: prefs.automatic,
    setAutomatic: (automatic: boolean) => save(automatic ? { automatic, nextCheck: 0 } : { automatic }),
  };
}

export function UpdatePrompt({ release, open }: { release: ReturnType<typeof useUpdates>; open: () => void }) {
  const { tr } = useLocale();
  return <Sheet title="Nova versão disponível" close={release.dismiss}>
    <CopyText>{tr('A versão {tag} está disponível. Deseja atualizar?', { tag: release.tag })}</CopyText>
    <View style={layout.wrap}>
      <Button label="Agora não" onPress={release.dismiss} />
      <Button label="Atualizar" primary onPress={() => { release.dismiss(); open(); }} />
    </View>
  </Sheet>;
}

function NewBadge() {
  const motion = useContext(Motion);
  const opacity = useRef(new Animated.Value(1)).current;
  const t = useTheme();
  useEffect(() => {
    if (!motion) { opacity.setValue(1); return; }
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: .62, duration: 850, useNativeDriver: true, isInteraction: false }),
      Animated.timing(opacity, { toValue: 1, duration: 850, useNativeDriver: true, isInteraction: false }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [motion, opacity]);
  return <Animated.View style={{ opacity, backgroundColor: t.selection, borderRadius: 16, paddingHorizontal: 8 }}>
    <CopyText style={{ color: t.red, fontWeight: '800' }}>Novo!</CopyText>
  </Animated.View>;
}

export function Updates({ release }: { release: ReturnType<typeof useUpdates> }) {
  const { tr } = useLocale();
  return <ScrollView style={layout.centered} contentContainerStyle={layout.list}>
    <CopyText kind="heading">Atualizações</CopyText>
    <Button label={release.checking ? 'Verificando…' : 'Verificar atualizações'} icon="refresh-outline" onPress={release.check} disabled={release.checking} />
    {!!release.status && <CopyText kind="muted">{release.status}</CopyText>}
    {!!release.tag && <Card>
      <CopyText kind="title">{tr('Atualização disponível · {tag}', { tag: release.tag })}</CopyText>
      <Link label="Baixar atualização" url={release.url} />
    </Card>}
    {release.notes.map(note => <Card key={note.tag}>
      <View style={layout.wrap}>
        <CopyText kind="title">{tr('Versão {tag}', { tag: note.tag })}</CopyText>
        {note.tag === release.tag && <NewBadge />}
      </View>
      <CopyText>{note.body.replace(/^#{1,6}\s+/gm, '').replace(/\*\*/g, '').replace(/^[-*] /gm, '• ') || tr('Notas indisponíveis.')}</CopyText>
    </Card>)}
  </ScrollView>;
}
