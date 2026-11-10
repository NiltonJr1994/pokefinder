import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { blankJournal, journalLimit, type Journal, readJournal } from './map-data';

let pending = Promise.resolve();
export function useJournal(edition: string) {
  const storage = 'pokefinder/' + edition + '-journal-v1';
  const [journal, setJournal] = useState<Journal>({ ...blankJournal, edition });
  const [ready, setReady] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const current = useRef<Journal>({ ...blankJournal, edition });
  useEffect(() => {
    let alive = true;
    void pending.then(() => AsyncStorage.getItem(storage)).then(raw => {
      if (!alive || !raw) return;
      const restored = readJournal(raw, edition);
      current.current = restored;
      setJournal(restored);
    }).catch(() => { if (alive) setSaveFailed(true); })
      .finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, [edition, storage]);
  function save(change: (previous: Journal) => Journal) {
    const next = { ...change(current.current), edition };
    const serialized = JSON.stringify(next);
    if (serialized.length > journalLimit) {
      setSaveFailed(true);
      return;
    }
    current.current = next;
    setJournal(next);
    pending = pending.then(() => AsyncStorage.setItem(storage, serialized))
      .then(() => setSaveFailed(false)).catch(() => setSaveFailed(true));
  }
  return { journal, ready, save, saveFailed };
}

export async function exportJournal(journal: Journal) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing unavailable');
  const file = new File(Paths.cache, 'pokefinder-diario-' + (journal.edition ?? 'yellow') + '.json');
  file.create({ overwrite: true });
  file.write(JSON.stringify(journal));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
}

export async function selectJournalBackup(edition: string) {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', 'application/octet-stream'], copyToCacheDirectory: true,
  });
  if (result.canceled) return undefined;
  const file = new File(result.assets[0].uri);
  if (file.size > 2000000) throw new Error('Backup too large');
  return readJournal(await file.text(), edition);
}
