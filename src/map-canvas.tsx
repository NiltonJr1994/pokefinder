import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, PixelRatio, Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { Image } from 'expo-image';
import { yellowTiles } from './data/yellow-map-tiles';
import { regionTiles } from './data/region-tiles';
import { type Area, type Point } from './map-data';
import { Button, CopyText, Icon, type IconName, layout, useTheme } from './ui';
import { useLocale } from './locale';

type Screen = { width: number; height: number };
type Camera = { zoom: number; x: number; y: number };
type Sample = { x: number; y: number; distance: number; fingers: number };
type Marker = { point: Point; done: boolean };
const initial = { zoom: 1, x: 0, y: 0 };
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const kinds: Record<Point['category'], { icon: IconName; color: string }> = {
  pokemon: { icon: 'disc-outline', color: '#AC2940' }, item: { icon: 'bag-handle-outline', color: '#216451' },
  npc: { icon: 'person-outline', color: '#305A90' }, objective: { icon: 'flag-outline', color: '#73477B' },
};
export const pointIcon = (point: Point) => kinds[point.category].icon;

function sample(event: GestureResponderEvent): Sample {
  const [first, second] = event.nativeEvent.touches;
  if (!first) return { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY, distance: 1, fingers: 1 };
  if (!second) return { x: first.pageX, y: first.pageY, distance: 1, fingers: 1 };
  return { x: (first.pageX + second.pageX) / 2, y: (first.pageY + second.pageY) / 2,
    distance: Math.max(1, Math.hypot(first.pageX - second.pageX, first.pageY - second.pageY)), fingers: 2 };
}

export function MapCanvas({ area, markers, placing, focus, onOpen, onPlace }: {
  area: Area; markers: Marker[]; placing: boolean; focus?: Point;
  onOpen: (points: Point[]) => void; onPlace: (x: number, y: number) => void;
}) {
  const t = useTheme();
  const { tr } = useLocale();
  const [screen, setScreen] = useState<Screen>({ width: 0, height: 0 });
  const [camera, setCamera] = useState<Camera>(initial);
  const view = useRef<View>(null);
  const origin = useRef({ x: 0, y: 0 });
  const frame = useRef({ screen, camera, fit: 1 });
  const anchor = useRef<{ finger: Sample; camera: Camera } | undefined>(undefined);
  const didLayout = useRef(false);
  const maxZoom = area.id === 'region' ? 18 : 8;
  const fit = Math.min(screen.width / area.width, screen.height / area.height) || 1;
  frame.current = { screen, camera, fit };

  function apply(next: Camera) {
    const { screen: bounds, fit: base } = frame.current;
    const horizontal = Math.max(0, (area.width * base * next.zoom - bounds.width) / 2);
    const vertical = Math.max(0, (area.height * base * next.zoom - bounds.height) / 2);
    const bounded = { zoom: next.zoom, x: clamp(next.x, -horizontal, horizontal),
      y: clamp(next.y, -vertical, vertical) };
    frame.current.camera = bounded;
    setCamera(bounded);
  }

  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (event, state) =>
      event.nativeEvent.touches.length > 1 || Math.abs(state.dx) > 4 || Math.abs(state.dy) > 4,
    onPanResponderGrant: event => {
      anchor.current = { finger: sample(event), camera: frame.current.camera };
      view.current?.measure((_x, _y, _w, _h, pageX, pageY) => { origin.current = { x: pageX, y: pageY }; });
    },
    onPanResponderMove: event => {
      const fingers = sample(event);
      const start = anchor.current;
      if (!start || fingers.fingers !== start.finger.fingers) {
        anchor.current = { finger: fingers, camera: frame.current.camera };
        return;
      }
      const zoom = clamp(start.camera.zoom * fingers.distance / start.finger.distance, 1, maxZoom);
      const ratio = zoom / start.camera.zoom;
      const centerX = origin.current.x + frame.current.screen.width / 2;
      const centerY = origin.current.y + frame.current.screen.height / 2;
      apply({ zoom, x: fingers.x - centerX - (start.finger.x - centerX - start.camera.x) * ratio,
        y: fingers.y - centerY - (start.finger.y - centerY - start.camera.y) * ratio });
    },
    onPanResponderRelease: () => { anchor.current = undefined; },
    onPanResponderTerminate: () => { anchor.current = undefined; },
  }), [area]);

  const scale = fit * camera.zoom;
  const left = (screen.width - area.width * scale) / 2 + camera.x;
  const top = (screen.height - area.height * scale) / 2 + camera.y;
  const sourceRect = area.backdrop ?? { x: 0, y: 0, width: area.width, height: area.height };
  const sx = area.width * scale / sourceRect.width;
  const sy = area.height * scale / sourceRect.height;
  const level = sx * PixelRatio.get() >= .85 ? 'high' : 'low';
  const tiles = area.regional ? regionTiles[area.regional + '_' + level] : area.illustrated ? yellowTiles[area.id][level] : [];
  const groups: { x: number; y: number; markers: Marker[] }[] = [];
  for (const marker of markers) {
    const x = left + (marker.point.x - area.x) * scale;
    const y = top + (marker.point.y - area.y) * scale;
    if (x < -22 || y < -22 || x > screen.width + 22 || y > screen.height + 22) continue;
    const group = groups.find(group => Math.hypot(group.x - x, group.y - y) < 43);
    if (group) group.markers.push(marker);
    else groups.push({ x, y, markers: [marker] });
  }
  function zoomBy(multiplier: number) {
    const next = clamp(camera.zoom * multiplier, 1, maxZoom);
    apply({ zoom: next, x: camera.x * next / camera.zoom, y: camera.y * next / camera.zoom });
  }
  function place(event: GestureResponderEvent) {
    const x = area.x + (event.nativeEvent.locationX - left) / scale;
    const y = area.y + (event.nativeEvent.locationY - top) / scale;
    if (x >= area.x && x <= area.x + area.width && y >= area.y && y <= area.y + area.height) {
      onPlace(Math.round(x), Math.round(y));
    }
  }

  return <View style={{ flex: 1, minHeight: 135, borderRadius: 16, borderWidth: 1, borderColor: t.line, overflow: 'hidden' }}>
    <View ref={view} collapsable={false} {...responder.panHandlers} style={{ flex: 1, overflow: 'hidden', backgroundColor: '#101B29' }}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        const nextFit = Math.min(width / area.width, height / area.height) || 1;
        frame.current = { ...frame.current, screen: { width, height }, fit: nextFit };
        setScreen({ width, height });
        if (!didLayout.current && focus?.area === area.id) {
          const zoom = 2;
          apply({ zoom, x: (area.x + area.width / 2 - focus.x) * nextFit * zoom,
            y: (area.y + area.height / 2 - focus.y) * nextFit * zoom });
        } else apply(frame.current.camera);
        didLayout.current = true;
        view.current?.measure((_x, _y, _w, _h, pageX, pageY) => { origin.current = { x: pageX, y: pageY }; });
      }}>
      {screen.width > 0 && <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {!area.illustrated && <View style={{ position: 'absolute', left, top,
          width: area.width * scale, height: area.height * scale,
          backgroundColor: '#1D3546', borderWidth: 1, borderColor: '#507486', borderRadius: 16 }}>
          <View style={{ position: 'absolute', left: '50%', top: '16%', bottom: '15%', width: 2, backgroundColor: '#668B95' }} />
          <View style={{ position: 'absolute', left: '18%', right: '18%', top: '45%', height: 2, backgroundColor: '#668B95' }} />
          <CopyText style={{ position: 'absolute', top: 8, left: 12, color: '#E8F7F8', fontWeight: '700' }}>{area.title}</CopyText>
          <CopyText style={{ position: 'absolute', bottom: 7, left: 12, color: '#BFE2E6', fontSize: 11 }}>Esquema da etapa</CopyText>
        </View>}
        <View style={{ position: 'absolute', left, top, width: area.width * scale, height: area.height * scale, overflow: 'hidden' }}>
          {tiles.filter(tile => tile.x < sourceRect.x + sourceRect.width && tile.y < sourceRect.y + sourceRect.height &&
            tile.x + tile.width > sourceRect.x && tile.y + tile.height > sourceRect.y &&
            left + (tile.x - sourceRect.x) * sx < screen.width && top + (tile.y - sourceRect.y) * sy < screen.height &&
            left + (tile.x + tile.width - sourceRect.x) * sx > 0 && top + (tile.y + tile.height - sourceRect.y) * sy > 0)
            .map(tile => <Image key={level + '/' + tile.x + '/' + tile.y} source={tile.image} contentFit="fill"
              cachePolicy="memory" accessible={false} style={{ position: 'absolute', left: (tile.x - sourceRect.x) * sx,
                top: (tile.y - sourceRect.y) * sy, width: tile.width * sx + .2, height: tile.height * sy + .2 }} />)}
        </View>
      </View>}
      {placing ? <Pressable accessibilityLabel={tr('Marcar ponto no mapa')} style={StyleSheet.absoluteFill} onPress={place} />
        : groups.map(group => {
          const done = group.markers.every(marker => marker.done);
          const point = group.markers[0].point;
          const multiple = group.markers.length > 1;
          return <Pressable key={point.id} accessibilityRole="button"
            accessibilityLabel={multiple ? tr('{count} pontos · {place}', { count: group.markers.length, place: point.place }) : tr(point.title)}
            onPress={() => onOpen(group.markers.map(marker => marker.point))}
            style={{ position: 'absolute', left: group.x - 21, top: group.y - 21, width: 42, height: 42,
              borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF',
              backgroundColor: done ? '#23644B' : multiple ? '#102544' : kinds[point.category].color }}>
            {multiple ? <CopyText style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>{group.markers.length}</CopyText>
              : <Icon name={done ? 'checkmark' : pointIcon(point)} color="#FFFFFF" size={19} />}
          </Pressable>;
        })}
    </View>
    <View style={[layout.row, { position: 'absolute', right: 7, top: 7 }]}>
      <Button compact label="−" hint="Diminuir zoom" disabled={camera.zoom <= 1} onPress={() => zoomBy(1 / 1.5)} />
      <Button compact label="" icon="add" hint="Aumentar zoom" disabled={camera.zoom >= 5} onPress={() => zoomBy(1.5)} />
      <Button compact label="" icon="locate-outline" hint="Centralizar mapa" onPress={() => apply(initial)} />
    </View>
  </View>;
}
