import React from 'react';
import { ScrollView, View } from 'react-native';
import { legacyCredits } from './catalog';
import help from './data/help.json';
import { Button, Card, CopyText, layout, Link, Sheet } from './ui';
import { useLocale } from './locale';

const repo = 'NiltonJr1994/pokefinder';
const introduction = [
  ['Escolha o jogo', 'Abra o seletor no topo ou em Mais. As seções mostram o conteúdo disponível para a edição escolhida.'],
  ['Consulte sua equipe', 'Busque na Pokédex e toque no coração para guardar favoritos. Em Itens, use as abas para ver itens, TMs e HMs.'],
  ['Avance no jogo', 'Use Dicas para consultar estratégias. Os detonados ficam no menu Mais quando disponíveis.'],
  ['Use códigos e veja novidades', 'Confira região, formato e revisão antes de copiar um código. Em Mais, veja o guia de cheats e as atualizações.'],
];
function Page({ title, children }: { title: string; children: React.ReactNode }) {
  return <ScrollView style={layout.centered} contentContainerStyle={layout.list}>
    <CopyText kind="heading">{title}</CopyText>{children}
  </ScrollView>;
}

export function Welcome({ page, select, close }: { page: number; select: (n: number) => void; close: () => void }) {
  const { tr } = useLocale();
  const [title, description] = introduction[page];
  const last = page === introduction.length - 1;
  return <Sheet title={page === 0 ? 'Bem-vindo ao PokeFinder' : title} close={close}>
    <CopyText kind="accent">{tr('{page} de {total}', { page: page + 1, total: introduction.length })}</CopyText>
    {page === 0 && <CopyText kind="title">{title}</CopyText>}
    <CopyText>{description}</CopyText>
    <View style={layout.wrap}>
      <Button label={page === 0 ? 'Pular' : 'Anterior'} onPress={page === 0 ? close : () => select(page - 1)} />
      <Button label={last ? 'Começar' : 'Próximo'} primary trailing="arrow-forward" onPress={last ? close : () => select(page + 1)} />
    </View>
  </Sheet>;
}

export function Help({ replay, cheats }: { replay: () => void; cheats: () => void }) {
  return <Page title="Como usar">
    <Button label="Rever introdução" icon="play-outline" primary onPress={replay} />
    {introduction.map(([title, description]) => <Card key={title}>
      <CopyText kind="title">{title}</CopyText><CopyText>{description}</CopyText>
    </Card>)}
    <Button label="Como inserir cheats" icon="game-controller-outline" onPress={cheats} />
  </Page>;
}

export function CheatHelp() {
  return <Page title="Como inserir cheats">{help.panels.map(({ title, paragraphs }) =>
    <Card key={title}>
      <CopyText kind="title">{title}</CopyText>
      {paragraphs.map(paragraph => <CopyText key={paragraph}>{paragraph}</CopyText>)}
    </Card>)}</Page>;
}

export function Credits() {
  const groups = [
    { title: 'Design', sources: help.credits.designSources.filter(([, url]) => url) },
    { title: 'Pokédex, itens e guias', sources: [...help.credits.catalogSources,
      ['PokéAPI · golpes por edição / edition learnsets', 'https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv'],
      ['PokéAPI · efetividade, encontros e sprites das HMs / matchups, encounters, and HM sprites', 'https://github.com/PokeAPI/sprites/tree/master/sprites/items'],
      ['pret · conferência de golpes em Yellow / Yellow learnset cross-check', 'https://github.com/pret/pokeyellow/tree/master/data/pokemon'],
      ['Bulbapedia · Size and weight variation', 'https://bulbapedia.bulbagarden.net/wiki/Size_and_weight_variation'],
      ['Logos das edições / Game edition logos · arquivo fornecido / supplied archive', ''],
      ['Pokémon 100% Checklist · atlas de ícones / item icon atlas', 'https://pokemoncompletion.com/completion/Yellow'],
      ['Pokémon 100% Checklist · mapa de Yellow / Yellow map', 'https://pokemoncompletion.com/completion/Yellow'],
      ['Pokémon 100% Checklist · mapa de Crystal / Crystal map', 'https://pokemoncompletion.com/completion/Crystal'],
      ['Pokémon 100% Checklist · mapa de Emerald / Emerald map', 'https://pokemoncompletion.com/completion/Emerald'],
      ['pret · itens escondidos em Petalburg Woods / hidden items in Petalburg Woods', 'https://github.com/pret/pokeemerald/blob/master/data/maps/PetalburgWoods/map.json'],
      ['Bulbapedia · itens de Viridian City e Route 30 / Viridian City and Route 30 items', 'https://bulbapedia.bulbagarden.net/wiki/Viridian_City'],
      ['RankedBoost · sprites do arquivo Gold & Silver', 'https://rankedboost.com/pokemon/location/gold-silver/'],
      ['Coin e Large Coin · imagens fornecidas / supplied images', '']] },
    { title: 'Códigos e arquivos de referência', sources: [...help.credits.codeReferences, ...legacyCredits] },
  ];
  return <Page title="Créditos">
    <Card>
      <CopyText kind="muted">Desenvolvedora</CopyText>
      <CopyText kind="heading">N. J. Softwares</CopyText>
      <Link label="PokeFinder no GitHub" url={'https://github.com/' + repo} />
    </Card>
    <CopyText kind="muted">Autoria do design e referências do catálogo</CopyText>
    {groups.map(({ title, sources }) => <Card key={title}>
      <CopyText kind="title">{title}</CopyText>
      {sources.map(([label, url], i) => url.startsWith('https://') ? <Link key={i} label={label} url={url} />
        : <CopyText key={i}>{label}</CopyText>)}
    </Card>)}
  </Page>;
}
