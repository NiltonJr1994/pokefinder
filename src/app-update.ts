import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, NativeModules, Platform } from 'react-native';

export type DownloadState = {
  state: 'idle' | 'starting' | 'downloading' | 'paused' | 'ready' | 'error' | 'updated';
  received: number; total: number; tag: string; error?: string;
};
type Asset = { url: string; tag: string; revision?: number; digest?: string; size?: number };
const idle: DownloadState = { state: 'idle', received: 0, total: 0, tag: '' };
type Updater = {
  start(url: string, tag: string, revision: number, digest: string, size: number, title: string): Promise<boolean>;
  canInstall(): Promise<boolean>; getStatus(): Promise<DownloadState>; cancel(): Promise<boolean>; install(): Promise<'permission' | 'installer'>;
};
const native = NativeModules.PokeFinderUpdater as Updater | undefined;
export function useAppDownload() {
  const [download, setDownload] = useState<DownloadState>(idle);
  const [installing, setInstalling] = useState(false);
  const [permission, setPermission] = useState(false);
  const alive = useRef(true), busy = useRef(false), polling = useRef(false);
  const awaitingPermission = useRef(false);
  const generation = useRef(0);
  const install = useCallback(async () => {
    if (!native || busy.current) return;
    busy.current = true; setInstalling(true); setPermission(false);
    try {
      const result = await native.install();
      awaitingPermission.current = result === 'permission';
      if (alive.current) setPermission(result === 'permission');
    } catch (error) {
      if (alive.current) setDownload(previous => ({ ...previous, state: 'error', error: (error as { code?: string }).code ?? 'installer' }));
    } finally { busy.current = false; if (alive.current) setInstalling(false); }
  }, []);
  const refresh = useCallback(async () => {
    if (!native || polling.current || busy.current) return;
    polling.current = true;
    const epoch = generation.current;
    try { const next = await native.getStatus(); if (alive.current && generation.current === epoch) setDownload(next); }
    catch { if (alive.current && generation.current === epoch) setDownload(previous => ({ ...previous, state: 'error', error: 'download' })); }
    finally { polling.current = false; }
  }, []);
  useEffect(() => {
    alive.current = true;
    void refresh();
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, 1000);
    const event = AppState.addEventListener('change', state => {
      if (state !== 'active') return;
      void refresh();
      // A previous explicit installation request may resume after authorizing this app.
      if (awaitingPermission.current) {
        awaitingPermission.current = false;
        void native?.canInstall().then(allowed => { if (allowed && alive.current) void install(); }).catch(() => {});
      }
    });
    return () => { alive.current = false; clearInterval(timer); event.remove(); };
  }, [refresh, install]);
  const start = async (asset: Asset, title: string) => {
    if (busy.current) return;
    if (!native || Platform.OS !== 'android') {
      setDownload({ ...idle, state: 'error', tag: asset.tag, error: 'unsupported' }); return;
    }
    busy.current = true; generation.current++; setPermission(false);
    setDownload({ ...idle, tag: asset.tag, state: 'starting' });
    try {
      // A failed or cancelled attempt always starts clean; completed downloads can be reused.
      const previous = await native.getStatus();
      if (previous.state === 'error' || previous.state === 'updated') await native.cancel();
      await native.start(asset.url, asset.tag, asset.revision ?? 0, asset.digest ?? '', asset.size ?? 0, title);
      if (alive.current) setDownload(await native.getStatus());
    } catch (error) {
      if (alive.current) setDownload({ ...idle, tag: asset.tag, state: 'error', error: (error as { code?: string }).code ?? 'download' });
    } finally { busy.current = false; }
  };
  const cancel = async () => {
    if (!native || busy.current) return;
    busy.current = true; generation.current++; awaitingPermission.current = false;
    try { await native.cancel(); if (alive.current) { setDownload(idle); setPermission(false); } }
    catch { if (alive.current) setDownload(previous => ({ ...previous, state:'error', error:'download' })); }
    finally { busy.current = false; }
  };
  return { download, installing, permission, start, cancel, install };
}
