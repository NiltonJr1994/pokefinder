import React from 'react';
import { ScrollView, View } from 'react-native';
import { legacyCredits } from './catalog';
import help from './data/help.json';
import { Art, Badge, Button, Card, CopyText, GameLogo, Icon, type IconName, layout, Link, Sheet, Types } from './ui';
import { useLocale } from './locale';

const repo = 'NiltonJr1994/pokefinder';
const introduction: { title: string; description: string; icon: IconName; example: string[] }[] = [
  { title: 'Escolha o jogo', description: 'Abra o seletor no topo ou em Mais. As listas, as equipes dos líderes e os mapas seguem a edição escolhida.',
    icon: 'game-controller-outline', example: ['Jogo selecionado', 'Pokémon Yellow', 'Trocar edição'] },
  { title: 'Explore a Pokédex', description: 'Busque pelo nome ou número. Abra a ficha para ver gênero, evoluções, golpes e o dano recebido por tipo. Toque no coração para salvar favoritos.',
    icon: 'grid-outline', example: ['Pokédex', 'Pikachu', 'Golpes · Dano recebido por tipo'] },
  { title: 'Consulte Itens, TMs e HMs', description: 'Toque em um item para ver o efeito e como obtê-lo. Abra uma TM ou HM e toque em um Pokémon compatível para consultar sua ficha.',
    icon: 'bag-handle-outline', example: ['Itens · TMs · HMs', 'Potion', 'Onde encontrar'] },
  { title: 'Use os códigos', description: 'Filtre pelo formato compatível com seu emulador, copie o código e consulte Como inserir cheats. Faça uma cópia do save antes de ativar.',
    icon: 'code-slash-outline', example: ['Códigos', 'Categoria · Formato', 'Copiar · Como inserir cheats'] },
  { title: 'Acompanhe sua partida', description: 'Em Mais, abra Mapa e Diário e crie uma partida. Marque itens, capturas e objetivos. Use Região para dar zoom em tela cheia e toque no objetivo de um ginásio para ver o líder, a equipe e a insígnia.',
    icon: 'map-outline', example: ['Mapa · Região · Diário', 'Pewter City', 'Próximo objetivo · Vencer Brock'] },
  { title: 'Avance com dicas e detonados', description: 'Use Dicas para resolver situações pontuais. Em Mais, abra Detonados para seguir as etapas da campanha ou retornar ao próximo objetivo do mapa.',
    icon: 'bulb-outline', example: ['Dicas · Detonados', 'Route 1', 'Próximo objetivo'] },
  { title: 'Personalize e verifique atualizações', description: 'Em Configurações, ajuste idioma e tema. Em Atualizações, verifique se há um APK novo e escolha quando baixá-lo.',
    icon: 'settings-outline', example: ['Configurações', 'Idioma · Tema', 'Verificar atualizações'] },
];
function GuidePreview({ step }: { step: typeof introduction[number] }) {
  return <Card>
    <View style={layout.row}><Icon name={step.icon} size={24} /><CopyText kind="title">{step.example[0]}</CopyText></View>
    <View style={layout.row}>
      {step.icon === 'game-controller-outline' && <GameLogo version="yellow" title="Yellow" />}
      {step.icon === 'grid-outline' && <Art id={25} size={43} />}
      {step.icon === 'bag-handle-outline' && <Art name="ref_potion" size={43} />}
      <View style={layout.grow}>
        <CopyText kind="accent">{step.example[1]}</CopyText>
        {step.icon === 'grid-outline' && <Types values={['Elétrico']} />}
      </View>
    </View>
    <Badge>{step.example[2]}</Badge>
  </Card>;
}
function Page({ title, children }: { title: string; children: React.ReactNode }) {
  return <ScrollView style={layout.centered} contentContainerStyle={layout.list}>
    <CopyText kind="heading">{title}</CopyText>{children}
  </ScrollView>;
}

export function Welcome({ page, select, close }: { page: number; select: (n: number) => void; close: () => void }) {
  const { tr } = useLocale();
  const step = introduction[page];
  const { title, description } = step;
  const last = page === introduction.length - 1;
  return <Sheet title={page === 0 ? 'Bem-vindo ao PokeFinder' : title} close={close}>
    <CopyText kind="accent">{tr('{page} de {total}', { page: page + 1, total: introduction.length })}</CopyText>
    {page === 0 && <CopyText kind="title">{title}</CopyText>}
    <GuidePreview step={step} />
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
    {introduction.map(step => <View key={step.title} style={layout.stack}>
      <GuidePreview step={step} /><CopyText>{step.description}</CopyText>
    </View>)}
    <Button label="Como inserir cheats" icon="game-controller-outline" onPress={cheats} />
  </Page>;
}

const cheatSteps: Record<string, { steps: string[]; source?: string }> = {
  'RetroArch · Android ou computador': {
    steps: ['Quick Menu → Cheats', 'Add New Code to Top / Bottom', 'Code → Enabled', 'Apply Changes'],
    source: 'https://docs.libretro.com/guides/cheat-codes/',
  },
  'mGBA · computador': {
    steps: ['Tools → Cheats', 'Add GameShark ou CodeBreaker', 'Cole o código no campo correspondente', 'Ative o conjunto e retorne ao jogo'],
    source: 'https://mgba.io/',
  },
  'melonDS · Android': {
    steps: ['Configurações → Cheats', 'Importar a base de cheats', 'Abra o jogo → Cheats', 'Selecione o código compatível e retorne ao jogo'],
    source: 'https://github.com/rafaelvcaetano/melonDS-android/wiki/Cheats',
  },
};
export function CheatHelp() {
  return <Page title="Como inserir cheats">{help.panels.map(({ title, paragraphs }) => {
    const tutorial = cheatSteps[title];
    return <Card key={title}>
      <CopyText kind="title">{title}</CopyText>
      {tutorial && <View style={layout.stack}>
        <CopyText kind="muted">Esquema do menu</CopyText>
        {tutorial.steps.map((step, i) => <View key={step} style={layout.row}>
          <Badge>{i + 1}</Badge><Icon name="chevron-forward" size={13} /><CopyText style={layout.grow}>{step}</CopyText>
        </View>)}
      </View>}
      {paragraphs.map(paragraph => <CopyText key={paragraph}>{paragraph}</CopyText>)}
      {!!tutorial?.source && <Link label="Documentação do emulador" url={tutorial.source} />}
    </Card>;
  })}</Page>;
}

export function Credits() {
  const groups = [
    { title: 'Design', sources: help.credits.designSources.filter(([, url]) => url) },
    { title: 'Pokédex, itens e guias', sources: [...help.credits.catalogSources,
      ['Pokémon Database · equipes e retratos dos ginásios', 'https://pokemondb.net/emerald/gymleaders-elitefour'],
      ['Stephen Griffiths · insígnias recortadas da arte, CC BY 3.0', 'https://github.com/SteGriff/pokemon-badges'],
      ['pret · tabelas de lojas e preços', 'https://github.com/pret'],
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
