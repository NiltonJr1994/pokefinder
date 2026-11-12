# PokeFinder

[Português](#português) · [English](#english) · [Fontes e créditos / Sources and credits](#credits) · [Contato / Contact](#contact)

## Português

### Correção dos mapas · revisão Android 45002

- Corrigida a conversão de coordenadas entre as peças e a imagem completa de Yellow, incluindo o deslocamento vertical de 28 unidades.
- Removida a distribuição artificial de ações em grade. Cada pino publicado usa uma posição da referência ou uma área de encontro associada aos dados da edição.
- Recortes das etapas agora abrangem as rotas e os interiores referenciados pelos pontos, sem deformar a imagem. Zoom ampliado e botão de ampliar coerente com o limite real.
- Pontos sem posição confirmada continuam no Diário, com progresso e anotações; não recebem um pino inventado. Posições de ações dos remakes não são copiadas de plantas de gerações antigas.
- Marcadores pessoais são convertidos para o novo enquadramento, preservando sua posição no mapa, status e notas. Backups antigos continuam aceitos.
- Mantida a versão 4.5.0. Revisão interna 45002, assinada com a mesma chave de produção da compilação anterior.

Limite conhecido: os mapas continuam usando as bases de referência existentes. As associações de áreas de encontro precisam de conferência durante o jogo; esta revisão não certifica cada evento de cada andar de todas as edições. Consulte THIRD_PARTY_MAPS.md para fontes, conversões e auditoria.


O **PokeFinder** é um projeto independente de fã, desenvolvido pela **N. J. Softwares** para aprender desenvolvimento Android, organização de catálogos offline e design de interfaces. O app reúne e organiza informações já disponíveis na internet, complementadas por guias e arquivos de referência fornecidos ao projeto. As fontes estão listadas abaixo e os créditos também podem ser consultados no app.

### O que você encontra no app

- **Códigos e dicas** organizados por edição, com instruções para inserir cheats no RetroArch, mGBA, melonDS Android e em dispositivos compatíveis com consoles físicos.
- **Itens, TMs e HMs** com descrições e, nas tabelas disponíveis, os Pokémon compatíveis com cada máquina.
- **Detonados e Pokédex** com cobertura que varia conforme a edição, fichas de Pokémon, imagens e animações quando disponíveis.
- **Guia inicial** que apresenta as seções e pode ser revisto no menu **Como usar**.

O catálogo, os guias e as imagens incluídas no app funcionam offline. A verificação opcional de atualizações consulta as releases públicas do GitHub e abre a página da versão para download manual. [Releases do PokeFinder](https://github.com/NiltonJr1994/pokefinder/releases)

### Histórico de versões

- [v4.5.0](RELEASE-NOTES.md#v450) — Introdução ilustrada, ginásios, mapas em tela cheia, Pokédex ampliada e download direto das atualizações. Revisão 45001 do canal de produção.
- [v4.4.0](RELEASE-NOTES.md#v440) — Golpes offline na Pokédex e ajuste do Mewtwo.
- [v4.3.0](RELEASE-NOTES.md#v430) — Piloto de Mapa e Diário em Yellow.
- [v4.2.1](RELEASE-NOTES.md#v421) — Redesenho dos símbolos de tipo, retorno à lista da Pokédex após abrir evoluções, logos de edição nos títulos e novos ícones de itens. Os créditos das animações e referências foram reunidos em Créditos.
- [v4.2.0](RELEASE-NOTES.md#v420) — Configurações, seis idiomas e navegação inferior.
- [v4.1.0](RELEASE-NOTES.md#v410) — Nova logo no cabeçalho e na abertura de dois segundos. Menu reorganizado, fichas da Pokédex com cores por tipo e GIFs com dimensões originais.
- [v4.0.0](RELEASE-NOTES.md#v400) — Primeira versão React Native com Expo. Catálogo offline portado, busca e favoritos, introdução, guia de cheats e consulta de atualizações.
- [v3.4.0](RELEASE-NOTES.md#v340) — Adoção do nome PokeFinder. Inclusão da introdução, das instruções de cheats, de mais dicas e da consulta às releases públicas.
- [v3.3.0](RELEASE-NOTES.md#v330) — Seletor único de jogo no menu, edição lembrada e seções filtradas pela cobertura. GIFs na Pokédex e ajustes visuais.
- [v3.2.0](RELEASE-NOTES.md#v320) — Ajustes no visual da Pokédex, com filtros por tipo, fichas de Yellow e Gold e uma seção dedicada a Créditos.
- [v3.1.0](RELEASE-NOTES.md#v310) — Adoção do visual do APK de referência, tema claro e escuro persistente, menu por jogo e tabelas de itens, TMs e HMs com compatibilidade.
- [v3.0.0](RELEASE-NOTES.md#v300) — Migração para Kotlin, Jetpack Compose e Material 3. Menu lateral, busca offline, layout adaptável e catálogo ampliado.
- [v2.0.1](RELEASE-NOTES.md#v201) — Correção da navegação Voltar no Android, com remoção do callback legado e suporte à navegação preditiva.
- [v2.0.0](RELEASE-NOTES.md#v200) — Projeto Android com conteúdo HTML local em WebView, Android 10 como versão mínima e Android 16 como alvo.
- [v1.2.0](RELEASE-NOTES.md#v120) — Build Android legada identificada no APK original da N. J. Softwares. O APK confirma o número da versão e o pacote de distribuição. As alterações específicas dessa build não estão documentadas nos materiais disponíveis.
- [v1.0](RELEASE-NOTES.md#v10) — Versão inicial para Windows, executada no navegador e disponível offline. A busca tolerava pequenos erros, com filtros por jogo e cópia de códigos.

### Compilar para produção

Use Node.js 22, JDK 17 e o Android SDK 36. Configure `ANDROID_HOME` ou selecione o SDK no Android Studio. A pasta `android/` já contém a configuração nativa usada na compilação.

```powershell
npm ci
npm run check
$env:POKEFINDER_PRODUCTION = "1"
Set-Location android
.\gradlew.bat :app:assembleRelease
```

O APK sem assinatura sai em `android/app/build/outputs/apk/release/app-release-unsigned.apk`. Para distribuição, alinhe e assine com a chave de produção. O pacote usa `com.njsoftwares.pokecodefinder` e o código de versão `45001`. [Guia de migração e assinatura](MIGRACAO.md#build-de-produção-450)

### Projeto de fã e direitos

O PokeFinder é um projeto educacional e independente, sem afiliação ou endosso da The Pokémon Company, Nintendo, Creatures ou GAME FREAK. As marcas, personagens, imagens e demais materiais de terceiros pertencem aos respectivos titulares e estão sujeitos às suas condições de uso. Existe também uma ferramenta homônima de manipulação de RNG, mantida separadamente por Admiral-Fish. [Orientação do Pokémon Support sobre materiais da franquia](https://support.pokemon.com/hc/en-us/articles/360000634094-Can-I-use-Pok%C3%A9mon-images-or-materials) · [Admiral-Fish/PokeFinder](https://github.com/Admiral-Fish/PokeFinder)

## English

### Map corrections · Android build revision 45002

- Fixed coordinate conversion between Yellow's tiles and full image, including the 28-unit vertical offset.
- Removed artificial grid placement. Published pins use a reference position or an encounter area associated with edition-specific data.
- Stage crops now include referenced routes and interiors without stretching the artwork. Higher zoom and a zoom button that respects the actual limit.
- Actions without confirmed coordinates remain in the Journal with progress and notes; they do not receive fabricated map pins. Remake action tiles are not transferred from older-generation layouts.
- Personal markers are reprojected without changing their map position, status or notes. Older backups remain supported.
- Version remains 4.5.0. Internal revision 45002 uses the same production signing key as the previous build.

Known limit: existing reference artwork is retained. Encounter-area associations still need gameplay review; this revision does not certify every event on every floor in every edition. See THIRD_PARTY_MAPS.md for sources, conversion details and the audit.


**PokeFinder** is an independent fan project developed by **N. J. Softwares** to learn Android development, offline catalog organization, and interface design. It collects and organizes information already available online, supplemented by guides and reference files provided to the project. Sources are listed below, and credits are also available in the app.

### What’s in the app

- **Cheat codes and tips** by game edition, with instructions for entering cheats in RetroArch, mGBA, melonDS Android, and on compatible physical-console devices.
- **Items, TMs, and HMs** with descriptions and, where compatibility tables are available, the Pokémon that can use each machine.
- **Walkthroughs and a Pokédex** with coverage that varies by edition, Pokémon profiles, images, and animations where available.
- **A quick-start guide** that introduces each section and can be reopened from the **Como usar** (How to use) menu.

The catalog, guides, and bundled images work offline. The optional update check looks up public GitHub releases and opens the release page for manual download. [PokeFinder releases](https://github.com/NiltonJr1994/pokefinder/releases)

### Release history

- [v4.5.0](RELEASE-NOTES.md#v450) — Illustrated onboarding, gym teams, full-screen maps, expanded Pokédex, and direct update downloads. Production build revision 45001.
- [v4.4.0](RELEASE-NOTES.md#v440) — Offline Pokédex learnsets and Mewtwo alignment.
- [v4.3.0](RELEASE-NOTES.md#v430) — Map and Journal pilot in Yellow.
- [v4.2.1](RELEASE-NOTES.md#v421) — Redesigned type symbols, direct return to the Pokédex list after opening evolutions, edition logos in headings, and new item icons. Animation and reference attributions were consolidated in Credits.
- [v4.2.0](RELEASE-NOTES.md#v420) — Settings, six languages, and bottom navigation.
- [v4.1.0](RELEASE-NOTES.md#v410) — New logo in the header and two-second launch screen. Reorganized menu, type-colored Pokédex cards and details, and GIFs rendered at their original dimensions.
- [v4.0.0](RELEASE-NOTES.md#v400) — First React Native release with Expo. Ported offline catalog, search and favorites, onboarding, cheat guide, and update checks.
- [v3.4.0](RELEASE-NOTES.md#v340) — Adopted the PokeFinder name. Added onboarding, cheat instructions, more tips, and public release checks.
- [v3.3.0](RELEASE-NOTES.md#v330) — Single game picker, persisted edition selection, and sections filtered by game coverage. Added Pokédex GIFs and visual refinements.
- [v3.2.0](RELEASE-NOTES.md#v320) — Refined the Pokédex layout with type filters, Yellow and Gold details, and a dedicated Credits section.
- [v3.1.0](RELEASE-NOTES.md#v310) — Adopted the reference APK styling, persistent light and dark themes, game-specific navigation, and item, TM, and HM compatibility tables.
- [v3.0.0](RELEASE-NOTES.md#v300) — Migrated to Kotlin, Jetpack Compose, and Material 3. Added a navigation drawer, offline search, adaptive layout, and expanded catalog.
- [v2.0.1](RELEASE-NOTES.md#v201) — Fixed Android Back navigation by removing the legacy callback and enabling predictive back.
- [v2.0.0](RELEASE-NOTES.md#v200) — Android project using local HTML in a WebView, with Android 10 as the minimum and Android 16 as the target.
- [v1.2.0](RELEASE-NOTES.md#v120) — Legacy Android build identified from the original N. J. Softwares APK. The APK confirms the version and distribution package. Build-specific changes are undocumented in the available material.
- [v1.0](RELEASE-NOTES.md#v10) — Initial Windows version running offline in the browser. It provided typo-tolerant search, game filters, and cheat code copying.

### Build for production

Use Node.js 22, JDK 17, and Android SDK 36. Set `ANDROID_HOME` or select the SDK in Android Studio. The `android/` folder contains the native configuration used for the build.

```powershell
npm ci
npm run check
$env:POKEFINDER_PRODUCTION = "1"
Set-Location android
.\gradlew.bat :app:assembleRelease
```

The unsigned APK is written to `android/app/build/outputs/apk/release/app-release-unsigned.apk`. Align and sign it with the production key before distributing it. The package is `com.njsoftwares.pokecodefinder` and the version code is `45001`. [Migration and signing guide](MIGRACAO.md#build-de-produção-450)

### Fan project and rights

PokeFinder is an independent educational project with no affiliation with or endorsement from The Pokémon Company, Nintendo, Creatures, or GAME FREAK. Third-party trademarks, characters, images, and other materials belong to their respective rights holders and are subject to their terms of use. Admiral-Fish maintains a separate RNG tool with the same name. [Pokémon Support guidance on franchise materials](https://support.pokemon.com/hc/en-us/articles/360000634094-Can-I-use-Pok%C3%A9mon-images-or-materials) · [Admiral-Fish/PokeFinder](https://github.com/Admiral-Fish/PokeFinder)

<a id="credits"></a>

## Fontes e créditos / Sources and credits

### Inspiração visual / Visual inspiration

- **Junior Saraiva**, *Pokedex | Pokemon App*. Referência visual para a Pokédex, adaptada à identidade do PokeFinder. / Visual reference for the Pokédex, adapted to PokeFinder’s visual identity. [Behance](https://www.behance.net/gallery/220086377/Pokedex-Pokemon-App)

### Catálogo, sprites e guias / Catalog, sprites, and guides

- **PokéAPI**. Dados de espécies, encontros, itens e máquinas, além de sprites de Pokémon e itens e animações de Crystal. / Species, encounter, item, and machine data, plus Pokémon and item sprites and Crystal animations. [Dados CSV / CSV data](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv) · [Sprites](https://github.com/PokeAPI/sprites)
- **PokéAPI e pret**. Dados de golpes por edição e conferência de Mewtwo em Yellow. / Edition learnsets and a cross-check of Mewtwo in Yellow. [Dados CSV / CSV data](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv) · [pret/pokeyellow](https://github.com/pret/pokeyellow/tree/master/data/pokemon)
- **Pokémon Showdown**. GIFs ilustrativos distribuídos no repositório de sprites da PokéAPI. / Illustrative GIFs distributed through the PokéAPI sprites repository. [GIFs do Showdown / Showdown GIFs](https://github.com/PokeAPI/sprites/tree/master/sprites/pokemon/other/showdown)
- **Pokémon Database**. Catálogo e imagens de itens e tabelas de TMs, HMs e compatibilidade em Red, Blue e Yellow. / Item catalog and images, and TM, HM, and compatibility tables for Red, Blue, and Yellow. [Itens / Items](https://pokemondb.net/item/all) · [TMs](https://pokemondb.net/red-blue/tms) · [HMs](https://pokemondb.net/red-blue/hms)
- **IGN**. Guia de itens de Red, Blue e Yellow. / Item guide for Red, Blue, and Yellow. [IGN Items Guide](https://www.ign.com/wikis/pokemon-red-blue-yellow-version/Items)
- **Bulbapedia**. Detonados, índices de itens e referências para dicas. / Walkthroughs, item indexes, and references for gameplay tips. [Detonados / Walkthroughs](https://bulbapedia.bulbagarden.net/wiki/Category:Walkthroughs) · [Yellow](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Yellow) · [Red & Blue](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Red_and_Blue) · [Gold & Silver](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Gold_and_Silver) · [Itens da geração II / Generation II items](https://bulbapedia.bulbagarden.net/wiki/List_of_items_by_index_number_in_Generation_II) · [Itens da geração III / Generation III items](https://bulbapedia.bulbagarden.net/wiki/List_of_items_by_index_number_in_Generation_III) · [Odd Egg](https://bulbapedia.bulbagarden.net/wiki/Odd_Egg) · [Clear Bell](https://bulbapedia.bulbagarden.net/wiki/Clear_Bell) · [VS Seeker](https://bulbapedia.bulbagarden.net/wiki/VS_Seeker) · [Voltorb Flip](https://bulbapedia.bulbagarden.net/wiki/Voltorb_Flip) · [Haircut brothers](https://bulbapedia.bulbagarden.net/wiki/Haircut_brothers)
- **Bulbapedia**, *Size and weight variation*, e arquivo fornecido *Proporção_Tamanho_Peso.zip*. Referências sobre altura, peso e diferenças entre edições. / References for height, weight, and differences across editions. [Size and weight variation](https://bulbapedia.bulbagarden.net/wiki/Size_and_weight_variation)
- **Logos das edições / Game edition logos**. Imagens do arquivo fornecido *logos_pk_png_transp.zip*, usadas para identificar jogos no seletor. / Images from the supplied archive, used to identify games in the selector.
- **Pokémon 100% Checklist** e **RankedBoost**. A folha de sprites indicada no ZIP de Yellow e as imagens do ZIP de Gold & Silver complementam a arte dos itens. / The sprite atlas referenced by the Yellow archive and the images in the Gold & Silver archive supplement the item artwork. [Pokémon 100% Checklist](https://pokemoncompletion.com/completion/Yellow) · [RankedBoost](https://rankedboost.com/pokemon/location/gold-silver/)
- **Mapa do piloto / Pilot map**. Recortes da imagem completa de Yellow do ZIP fornecido. / Crops from the supplied full Yellow map. [Pokémon 100% Checklist — Yellow](https://pokemoncompletion.com/completion/Yellow)
- **Coin e Large Coin**. Imagens fornecidas ao projeto. / Images supplied to the project.
- **PokéPC**. Fichas e disponibilidade de Pokémon em Yellow, consultadas em uma cópia fornecida da página. / Pokémon profiles and availability in Yellow, consulted in a supplied copy of the page. [PokéPC](https://pokepc.net/)
- **Nintendo**, *Pokémon Trainer’s Guide — Special Pikachu Edition*. Guia consultado no PDF fornecido. / Guide consulted in the supplied PDF.
- **Pokémon Checklist**, *Pokemon Yellow Kanto Pokedex*. Material consultado no PDF fornecido. / Reference consulted in the supplied PDF.
- **Pokémon Mythology**, *Detonado Pokémon Yellow: Guia Completo*. Detonado consultado em cópia fornecida. / Walkthrough consulted in a supplied copy.

### Códigos e instruções / Cheat codes and instructions

- **pret/pokeyellow**. Constantes e índices internos de Yellow. / Yellow’s internal constants and indexes. [Constantes / Constants](https://github.com/pret/pokeyellow/tree/master/constants)
- **Glitch City Wiki**, **Psypoke** e **Pokémon Mythology**. Referências de códigos GameShark. / GameShark code references. [Glitch City Wiki](https://nintyconservation.github.io/glitchcity.wiki/glitchcity.wiki/Pok%C3%A9mon_Red%2C_Blue_and_Yellow_GameShark_codes.html) · [Psypoke](https://psypokes.com/rby/ygameshark.php) · [Pokémon Mythology](https://www.pokemythology.net/conteudo/cheats/redblueyellow.htm)
- **GameHacking.org**. Códigos por edição. / Codes by edition. [Crystal](https://gamehacking.org/game/11386) · [Emerald](https://gamehacking.org/game/5630) · [FireRed](https://gamehacking.org/game/5633) · [LeafGreen](https://gamehacking.org/game/5634) · [HeartGold](https://gamehacking.org/game/23371) · [SoulSilver](https://gamehacking.org/game/23382)
- **PokémonCoders** e **PokeMundo**. O catálogo legado registra os dois nomes com o mesmo link para códigos de Crystal. / The legacy catalog lists both names with the same link for Crystal cheats. [Pokémon Crystal Cheats](https://www.pokemoncoders.com/pokemon-crystal-cheats/)
- **Voxel / TecMundo**, **GameFAQs** e arquivos fornecidos ao projeto. Referências para Emerald e SoulSilver, além de listas fornecidas para FireRed (GBA) e HeartGold e SoulSilver (DS). / References for Emerald and SoulSilver, plus supplied code lists for FireRed (GBA) and HeartGold and SoulSilver (DS). [Voxel / TecMundo — Emerald](https://www.estadao.com.br/tecmundo/voxel/282528-pokemon-emerald-lista-master-codes-codigos-cheats-jogo-gba/) · [GameFAQs — SoulSilver](https://gamefaqs.gamespot.com/boards/960100-pokemon-soulsilver-version/53938430)
- **Libretro**, **mGBA**, **melonDS Android** e **Datel**. Referências para usar cheats em emuladores e no Action Replay para GBA/DS. / References for using cheats in emulators and with Action Replay for GBA/DS. [Libretro](https://docs.libretro.com/guides/cheat-codes/) · [mGBA](https://github.com/mgba-emu/mgba/blob/master/src/platform/qt/CheatsView.cpp) · [melonDS Android](https://github.com/rafaelvcaetano/melonDS-android/wiki/Cheats) · [Manual Datel / Datel manual](https://uk.codejunkies.com/support_downloads/ARMAX_GBA_DS_English.pdf)

- **Pokémon Database**. Equipes e retratos dos líderes / Gym teams and portraits. [Guias por edição / Edition guides](https://pokemondb.net/yellow/gymleaders-elitefour)
- **Stephen Griffiths**. Insígnias de Kanto, Johto e Hoenn, recortadas da arte original sob CC BY 3.0 / Kanto, Johto, and Hoenn badge crops under CC BY 3.0. [Arte e licença / Artwork and license](https://github.com/SteGriff/pokemon-badges)
- **pret**. Tabelas de lojas, preços, dados de obtenção e reconstrução gráfica das Sevii Islands / Shop and acquisition data and Sevii Islands map reconstruction. [Projetos / Projects](https://github.com/pret)
- **Libretro, mGBA e melonDS Android**. Referências dos tutoriais de cheats / Cheat tutorial references. [Libretro](https://docs.libretro.com/guides/cheat-codes/) · [mGBA](https://mgba.io/) · [melonDS Android](https://github.com/rafaelvcaetano/melonDS-android/wiki/Cheats)

### Referências técnicas / Technical references

- **React Native, Expo e Android Developers**. Interface, compilação e assinatura. / UI, build, and signing. [React Native](https://reactnative.dev/) · [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/) · [Assinatura de apps / App signing](https://developer.android.com/studio/publish/app-signing)
- **GitHub Docs**. Consulta da última release pública. / Looking up the latest public release. [API de releases / Releases API](https://docs.github.com/en/rest/releases/releases#get-the-latest-release)

### Uso de IA / Use of AI

- **ChatGPT**. Usado para organizar a arquitetura do projeto. / Used to organize the project architecture.
- **Claude AI**. Usado para desenvolver a lógica do projeto. / Used to develop the project logic.

**Identidade visual, adaptação e desenvolvimento / Visual identity, adaptation, and development** — N. J. Softwares

<a id="contact"></a>

## Contato / Contact

**N. J. Softwares**

Para relatar problemas ou sugerir melhorias no PokeFinder, use a seção de issues do projeto. / To report bugs or suggest improvements to PokeFinder, use the project’s issue tracker. [PokeFinder Issues](https://github.com/NiltonJr1994/pokefinder/issues)

Perfil do mantenedor no GitHub. / Maintainer’s GitHub profile. [@NiltonJr1994](https://github.com/NiltonJr1994)
