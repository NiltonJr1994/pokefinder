import React, { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { byId, type Edition, typesIn } from './catalog';
import { Defense } from './dex';
import gyms from './data/gyms.json';
import { gymArt } from './data/gym-art';
import { Art, Button, Card, CopyText, layout, Types } from './ui';

type Gym = { leader: string; badge: string; city: string; portrait: string; badgeArt: string; team: number[][] };
const groups = gyms as Record<string, Gym[]>;
const kanto = 'pewter cerulean vermilion celadon fuchsia saffron cinnabar badge8'.split(' ');
const johto = 'violet azalea goldenrod ecruteak cianwood jasmine mahogany blackthorn kanto-brock kanto-misty kanto-surge kanto-erika kanto-janine kanto-sabrina kanto-blaine kanto-blue'.split(' ');
const hoenn = 'rustboro dewford mauville lavaridge norman fortree mossdeep sootopolis'.split(' ');
export function gymFor(edition: Edition, area: string) {
  const stages = edition.group === 6 ? hoenn : [3, 4, 10].includes(edition.group) ? johto : kanto;
  return groups[edition.group]?.[stages.indexOf(area)];
}

export function GymDetails({ gym, edition }: { gym: Gym; edition: Edition }) {
  const [focused, setFocused] = useState(-1);
  return <Card>
    <View style={layout.row}>
      {gymArt[gym.portrait] && <Image source={gymArt[gym.portrait]} contentFit="contain" style={{ width: 72, height: 80 }} />}
      <View style={layout.grow}>
        <CopyText kind="title">{gym.leader}</CopyText>
        <CopyText kind="muted">{gym.city}</CopyText>
      </View>
      {gymArt[gym.badgeArt] && <Image source={gymArt[gym.badgeArt]} contentFit="contain" style={{ width: 42, height: 42 }} />}
    </View>
    <CopyText kind="accent">{gym.badge}</CopyText>
    <CopyText kind="muted">Equipe da primeira batalha · toque para ver o dano recebido</CopyText>
    {gym.team.map(([id, level], index) => {
      const pokemon = byId.get(id);
      if (!pokemon) return null;
      return <View key={index} style={{ gap: 4 }}>
        <View style={layout.row}>
          <Art id={id} size={36} />
          <View style={layout.grow}>
            <Button dense label={pokemon.name + ' · Lv. ' + level} selected={focused === index}
              trailing={focused === index ? 'chevron-up' : 'chevron-down'} onPress={() => setFocused(focused === index ? -1 : index)} />
            <Types values={typesIn(pokemon, edition)} />
          </View>
        </View>
        {focused === index && <Defense pokemon={pokemon} edition={edition} />}
      </View>;
    })}
  </Card>;
}
