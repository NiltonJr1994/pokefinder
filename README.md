# PokeFinder

[Português](#português) · [English](#english) · [Fontes e créditos / Sources and credits](#credits)

## Português

O **PokeFinder** é um projeto independente de fã, desenvolvido pela **N. J. Softwares** para aprender desenvolvimento Android, organização de catálogos offline e design de interfaces. O app reúne e organiza informações já disponíveis na internet, complementadas por guias e arquivos de referência fornecidos ao projeto. As fontes estão listadas abaixo e os créditos também podem ser consultados no app.

### O que você encontra no app

- **Códigos e dicas** organizados por edição, com instruções para inserir cheats no RetroArch, mGBA, melonDS Android e em dispositivos compatíveis com consoles físicos.
- **Itens, TMs e HMs** com descrições e, nas tabelas disponíveis, os Pokémon compatíveis com cada máquina.
- **Detonados e Pokédex** com cobertura que varia conforme a edição, fichas de Pokémon, imagens e animações quando disponíveis.
- **Guia inicial** que apresenta as seções e pode ser revisto no menu **Como usar**.

O catálogo, os guias e as imagens incluídas no app funcionam offline. A verificação opcional de atualizações consulta as releases públicas do GitHub e abre a página da versão para download manual. [Releases do PokeFinder](https://github.com/NiltonJr1994/pokefinder/releases)

### Compilar e testar

O app usa **Kotlin, Jetpack Compose e Material 3** e funciona no **Android 10 ou posterior**. Abra a raiz do repositório no Android Studio com o **JDK 17** e o **Android SDK 36**, aguarde a sincronização e use **Run**. Para gerar o APK de teste pelo terminal, execute um dos comandos abaixo.

| Sistema | Comando |
| --- | --- |
| Windows (PowerShell) | `.gradlew.bat :app:assembleDebug` |
| macOS ou Linux | `./gradlew :app:assembleDebug` |

O APK gerado fica em `app/build/outputs/apk/debug/app-debug.apk`. Consulte o [histórico de alterações](CHANGELOG.md) para detalhes da versão.

### Projeto de fã e direitos

O PokeFinder é um projeto educacional e independente, sem afiliação ou endosso da The Pokémon Company, Nintendo, Creatures ou GAME FREAK. As marcas, personagens, imagens e demais materiais de terceiros pertencem aos respectivos titulares e estão sujeitos às suas condições de uso. Existe também uma ferramenta homônima de manipulação de RNG, mantida separadamente por Admiral-Fish. [Orientação do Pokémon Support sobre materiais da franquia](https://support.pokemon.com/hc/en-us/articles/360000634094-Can-I-use-Pok%C3%A9mon-images-or-materials) · [Admiral-Fish/PokeFinder](https://github.com/Admiral-Fish/PokeFinder)

## English

**PokeFinder** is an independent fan project developed by **N. J. Softwares** to learn Android development, offline catalog organization, and interface design. It collects and organizes information already available online, supplemented by guides and reference files provided to the project. Sources are listed below, and credits are also available in the app.

### What’s in the app

- **Cheat codes and tips** by game edition, with instructions for entering cheats in RetroArch, mGBA, melonDS Android, and on compatible physical-console devices.
- **Items, TMs, and HMs** with descriptions and, where compatibility tables are available, the Pokémon that can use each machine.
- **Walkthroughs and a Pokédex** with coverage that varies by edition, Pokémon profiles, images, and animations where available.
- **A quick-start guide** that introduces each section and can be reopened from the **Como usar** (How to use) menu.

The catalog, guides, and bundled images work offline. The optional update check looks up public GitHub releases and opens the release page for manual download. [PokeFinder releases](https://github.com/NiltonJr1994/pokefinder/releases)

### Build and test

The app uses **Kotlin, Jetpack Compose, and Material 3** and runs on **Android 10 or later**. Open the repository root in Android Studio with **JDK 17** and **Android SDK 36**, wait for Gradle to sync, and select **Run**. To build a debug APK from the terminal, run the command for your platform.

| Platform | Command |
| --- | --- |
| Windows (PowerShell) | `.gradlew.bat :app:assembleDebug` |
| macOS or Linux | `./gradlew :app:assembleDebug` |

The resulting APK is at `app/build/outputs/apk/debug/app-debug.apk`. See the [changelog](CHANGELOG.md) for release details.

### Fan project and rights

PokeFinder is an independent educational project with no affiliation with or endorsement from The Pokémon Company, Nintendo, Creatures, or GAME FREAK. Third-party trademarks, characters, images, and other materials belong to their respective rights holders and are subject to their terms of use. Admiral-Fish maintains a separate RNG tool with the same name. [Pokémon Support guidance on franchise materials](https://support.pokemon.com/hc/en-us/articles/360000634094-Can-I-use-Pok%C3%A9mon-images-or-materials) · [Admiral-Fish/PokeFinder](https://github.com/Admiral-Fish/PokeFinder)

<a id="credits"></a>

## Fontes e créditos / Sources and credits

### Inspiração visual / Visual inspiration

- **Junior Saraiva**, *Pokedex | Pokemon App*. Referência visual para a Pokédex, adaptada à identidade do PokeFinder. / Visual reference for the Pokédex, adapted to PokeFinder’s visual identity. [Behance](https://www.behance.net/gallery/220086377/Pokedex-Pokemon-App)

### Catálogo, sprites e guias / Catalog, sprites, and guides

- **PokéAPI**. Dados de espécies, encontros, itens e máquinas, além de sprites de Pokémon e itens e animações de Crystal. / Species, encounter, item, and machine data, plus Pokémon and item sprites and Crystal animations. [Dados CSV / CSV data](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv) · [Sprites](https://github.com/PokeAPI/sprites)
- **Pokémon Showdown**. GIFs ilustrativos distribuídos no repositório de sprites da PokéAPI. / Illustrative GIFs distributed through the PokéAPI sprites repository. [GIFs do Showdown / Showdown GIFs](https://github.com/PokeAPI/sprites/tree/master/sprites/pokemon/other/showdown)
- **Pokémon Database**. Catálogo e imagens de itens e tabelas de TMs, HMs e compatibilidade em Red, Blue e Yellow. / Item catalog and images, and TM, HM, and compatibility tables for Red, Blue, and Yellow. [Itens / Items](https://pokemondb.net/item/all) · [TMs](https://pokemondb.net/red-blue/tms) · [HMs](https://pokemondb.net/red-blue/hms)
- **IGN**. Guia de itens de Red, Blue e Yellow. / Item guide for Red, Blue, and Yellow. [IGN Items Guide](https://www.ign.com/wikis/pokemon-red-blue-yellow-version/Items)
- **Bulbapedia**. Detonados, índices de itens e referências para dicas. / Walkthroughs, item indexes, and references for gameplay tips. [Detonados / Walkthroughs](https://bulbapedia.bulbagarden.net/wiki/Category:Walkthroughs) · [Yellow](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Yellow) · [Red & Blue](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Red_and_Blue) · [Gold & Silver](https://bulbapedia.bulbagarden.net/wiki/Walkthrough:Pok%C3%A9mon_Gold_and_Silver) · [Itens da geração II / Generation II items](https://bulbapedia.bulbagarden.net/wiki/List_of_items_by_index_number_in_Generation_II) · [Itens da geração III / Generation III items](https://bulbapedia.bulbagarden.net/wiki/List_of_items_by_index_number_in_Generation_III) · [Odd Egg](https://bulbapedia.bulbagarden.net/wiki/Odd_Egg) · [Clear Bell](https://bulbapedia.bulbagarden.net/wiki/Clear_Bell) · [VS Seeker](https://bulbapedia.bulbagarden.net/wiki/VS_Seeker) · [Voltorb Flip](https://bulbapedia.bulbagarden.net/wiki/Voltorb_Flip) · [Haircut brothers](https://bulbapedia.bulbagarden.net/wiki/Haircut_brothers)
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

### Referências técnicas / Technical references

- **Android Developers**. Interface e compilação do app. / App UI and build. [Jetpack Compose](https://developer.android.com/develop/ui/compose) · [Assinatura de apps / App signing](https://developer.android.com/studio/publish/app-signing)
- **GitHub Docs**. Consulta da última release pública. / Looking up the latest public release. [API de releases / Releases API](https://docs.github.com/en/rest/releases/releases#get-the-latest-release)

**Identidade visual, adaptação e desenvolvimento / Visual identity, adaptation, and development** — N. J. Softwares
