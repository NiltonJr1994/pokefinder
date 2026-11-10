# Migração e validação do PokeFinder

A interface, a navegação e a lógica do app foram portadas de Kotlin e Compose para React Native e TypeScript com Expo. O projeto Android gerado pelo Expo é usado para empacotamento e integração nativa. O app inicia pelo JavaScript empacotado no APK.

## Build de produção 4.5.0

Este arquivo-fonte inclui a configuração Android usada no APK de produção. Use os passos de compilação do README com a pasta `android/` incluída. A compilação local gera `app-release-unsigned.apk`. Use a ferramenta `zipalign` do Android SDK antes de assinar e `apksigner` para assinar e verificar. A senha pode ser digitada no terminal quando o assinador solicitar.

```powershell
$buildTools = Join-Path $env:ANDROID_HOME "build-tools\36.0.0"
$unsigned = "app/build/outputs/apk/release/app-release-unsigned.apk"
& "$buildTools/zipalign.exe" -P 16 4 $unsigned "app-release-aligned.apk"
& "$buildTools/apksigner.bat" sign --ks "C:\caminho\pokefinder-production.p12" --ks-key-alias pokefinder-production --out "PokeFinder-4.5.0-Android.apk" "app-release-aligned.apk"
& "$buildTools/apksigner.bat" verify --verbose --print-certs "PokeFinder-4.5.0-Android.apk"
```

Execute esses comandos dentro de `android/`. A chave de distribuição e a senha devem permanecer no ambiente privado do desenvolvedor. Guarde ambas para assinar futuras atualizações. A 4.5.0 inicia um novo canal de assinatura. Quem ainda tem a 1.2.0 precisa fazer uma instalação limpa, preservando antes os dados de que precisar.

Publique o APK assinado na release pública `v4.5.0` e use a seção correspondente de [RELEASE-NOTES.md](RELEASE-NOTES.md) na descrição. Os registros abaixo descrevem o contexto das versões de teste anteriores.

## Versão 4.5.0 · Mapas, efetividade e atualizações

Abra a Pokédex de Yellow e compare o dano Fantasma recebido por Mewtwo com o da ficha em Crystal. Em Itens, verifique as abas TM e HM. Faça uma abertura a frio em Android 12 ou posterior para conferir a transição da janela nativa para a arte.

Em **Mais → Mapa e Diário**, crie partidas em duas edições. Abra **Região**, selecione um marco, marque um Pokémon e conclua um objetivo. Confira os totais da área, o próximo objetivo e os dados depois de reabrir o app em modo avião. Restaure arquivos somente na edição correspondente. Backups antigos do piloto são reconhecidos como Yellow.

As notas públicas usam a API de releases. Para testar o modal, disponibilize uma release estável de versão superior à instalada. Confirme que dispensar o aviso impede nova exibição para a mesma versão e que a nota continua disponível offline. **Atualizar** abre a página de download da release, onde o usuário escolhe o instalador compatível. A distribuição pública dos mapas e artes depende das condições de reutilização das fontes.

Os encontros são gerados com `python scripts/prepare-map-encounters.py pasta-dos-csvs`. Os blocos regionais vêm de `python scripts/prepare-region-maps.py pasta-dos-checklists caminho-do-full-emerald.png`. Ambos os resultados já estão incluídos. [PokéAPI](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv) · [Checklist Yellow](https://pokemoncompletion.com/completion/Yellow) · [Checklist Crystal](https://pokemoncompletion.com/completion/Crystal) · [Checklist Emerald](https://pokemoncompletion.com/completion/Emerald)

## Versão 4.4.0 · Golpes na Pokédex

Em Yellow, procure Mewtwo e confira o GIF na lista e na ficha. Em **Golpes**, expanda **Por nível**, **Por TM** e **Por HM**. Mewtwo tem **HM04 · Strength** e **HM05 · Flash**. Compare Pikachu em Yellow e em Red. Thunderbolt aparece por nível em Yellow e por TM em ambas as edições. Em Crystal, confira também as seções de tutor e ovo em espécies compatíveis. Repita em modo avião para verificar o catálogo empacotado.

O arquivo de golpes vem no projeto. Para regenerá-lo, execute `python scripts/prepare-learnsets.py pasta-dos-csvs` com `pokemon_species.csv`, `pokemon_moves.csv`, `move_names.csv` e `machines.csv` da PokéAPI. O script cruza a compatibilidade das máquinas com o catálogo já utilizado pelo app. [Dados CSV da PokéAPI](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv)

## Versão 4.3.0 · Mapa e Diário

Em Yellow, abra **Mais → Mapa e Diário**. O piloto contém Pallet Town, Route 1 e Celadon City. Use os marcadores, a busca do Diário, os filtros e os controles de zoom em modo avião. Os pontos de locais internos têm indicações na ficha. Cada partida mantém estados, notas e pontos pessoais próprios.

Para guardar uma cópia, abra o ícone de backup no topo do Mapa e Diário e escolha **Exportar arquivo**. Ao restaurar, confirme a substituição das partidas do aparelho pelo conteúdo do JSON. A checagem do projeto verifica os limites dos pontos, a cobertura dos blocos e a separação do progresso entre partidas.

Os blocos foram gerados de recortes do arquivo fornecido. Para reproduzi-los, instale Pillow e rode **python scripts/prepare-yellow-map.py caminho-do-zip**. As imagens já estão no projeto. A build é uma avaliação do piloto e usa a assinatura de teste da 4.2.1. Antes de distribuição pública, confirme as condições de reutilização do mapa e assine a versão de produção com a chave de distribuição. [Pokémon 100% Checklist — Yellow](https://pokemoncompletion.com/completion/Yellow)

## Versão 4.2.1

A 4.2.1 usa o mesmo pacote de teste da 4.2.0. Os símbolos dos tipos foram redesenhados a partir da referência visual. Na Pokédex, voltar de qualquer ficha restaura a lista com a busca e os filtros. Os créditos das animações, guias e fontes de códigos ficam na tela **Créditos**.

O catálogo de itens usa as imagens fornecidas e os sprites do Checklist de Gold & Silver e da folha de sprites referenciada no Checklist de Yellow. As berries antigas sem imagem individual usam a arte ilustrativa de Berry. **Coin** está vinculada às entradas existentes. **Large Coin** está nos recursos, com a edição correspondente pendente de confirmação. As fontes estão no [README](README.md#credits).

## Versão 4.2.0

O APK de teste atualiza a 4.1.0 pelo mesmo pacote e assinatura. A tela **Mais → Configurações** guarda tema e idioma no aparelho. A navegação principal fica na barra inferior e o seletor distingue jogos com catálogo de jogos planejados.

Na Pokédex, a lista usa quatro portes visuais e considera a área ocupada pelo sprite ao longo dos quadros. As medidas do catálogo e os exemplos enviados orientam a classificação. A ficha continua exibindo os valores de altura e peso e mantém a arte original. A lista de edições usa os logos do ZIP fornecido. Para regerar os dados de arte, execute **python scripts/prepare-visuals.py caminho-do-zip** com Pillow instalado. O projeto já inclui os dados e as imagens preparados.

Para distribuição pública, defina **POKEFINDER_PRODUCTION=1** e execute o comando de prebuild do README com **--clean**. Abra o projeto gerado na pasta **android** e use **Build → Generate Signed Bundle / APK** com sua chave de distribuição. Se o pacote de produção já foi publicado, use a chave da distribuição existente. Gere um APK para download direto ou um AAB para a loja. Para as releases do GitHub, use a tag **v4.2.0**, copie o texto de [RELEASE-NOTES.md](RELEASE-NOTES.md) e anexe o APK de produção assinado. [Assinatura de apps Android](https://developer.android.com/studio/publish/app-signing)

Para validar antes da publicação, teste a instalação sobre uma versão do mesmo canal, os seis idiomas, a persistência do tema, as três abas de Itens, os logos do seletor e a Pokédex em modo avião. O APK de teste entregue é assinado com a chave de testes. A chave de produção fica no ambiente do desenvolvedor.

A instalação sobre a 4.1.0 foi validada no emulador Android 16. Em modo avião, foram conferidos os seis idiomas, o tema escuro após reiniciar, as abas e a compatibilidade de TMs e HMs, a Pokédex, a preservação de um favorito, as edições futuras desativadas e os créditos. O APK passou na verificação de assinatura e alinhamento.

## Interface 4.1.0

- A logo fornecida aparece no cabeçalho, no menu e na abertura. A arte de abertura permanece na tela por dois segundos. A consulta automática é iniciada assim que as preferências são carregadas, quando estiver habilitada e dentro das regras de intervalo. A abertura termina independentemente da resposta do GitHub.
- O menu agrupa seções do jogo e opções de apoio. O seletor mostra a edição atual, e a Pokédex também tem atalhos inferiores para trocar de jogo, consultar favoritos e abrir o guia de uso.
- A Pokédex adapta os cartões por tipo, os painéis inferiores de filtros e o topo colorido da ficha da referência visual de Junior Saraiva. O nome, a tipografia e as seções do catálogo seguem o PokeFinder.
- A lista e a ficha usam as dimensões originais registradas nos 502 arquivos GIF, centralizadas nas áreas de arte. Os sprites estáticos continuam disponíveis para redução de movimento e falha de carregamento.
- O APK mantém o pacote de teste da 4.0.0. Instale por cima dele para conservar os favoritos, o tema e o jogo selecionado.

A build Android 4.1.0 foi instalada por cima da 4.0.0 no emulador Android 16. Em modo avião, foram verificados o splash, a troca de jogo, os filtros de tipo e ordem, a ficha de Pikachu, a animação de Cyndaquil e a resposta da consulta manual de atualizações. O APK foi assinado com a chave de teste e contém ARM64 e x86_64.

## O que foi portado

- Menu lateral com seletor de 11 edições e seções exibidas conforme a cobertura de cada jogo.
- Códigos com busca tolerante a erros, filtros, atalhos, favoritos, descrição, formato, aviso, fonte, código mestre e cópia para a área de transferência.
- Itens com imagens, efeitos expansíveis e localização, além de TMs e HMs com tipos, edições, localização e lista pesquisável de Pokémon compatíveis.
- Dicas e detonados com busca e detalhes expansíveis. A cobertura continua a do catálogo 3.4.
- Pokédex com busca, filtros, ordenação, favoritos, ficha, atributos, família evolutiva, encontros e instruções específicas de Yellow. Sprites e GIFs ficam no pacote. A opção de reduzir movimento do sistema usa imagens estáticas.
- Temas claro e escuro, introdução com quatro telas, guia de cheats, créditos e consulta manual ou automática às releases públicas do GitHub.
- Catálogo, imagens e guias funcionam em modo avião. A consulta de releases usa a conexão, com intervalo de 12 horas após uma consulta bem-sucedida e 30 minutos após falha.

## Compilar e instalar

Use as instruções do [README](README.md) e um diretório curto, como **C:\Projetos\PokeFinder** no Windows, para reduzir problemas de comprimento de caminho com o NDK. Com o Android SDK configurado, a compilação local gera o APK assinado com a chave de teste gerada pelo modelo Expo. Use **adb install -r caminho-do-apk** ou abra o APK no aparelho. Ele inclui arm64-v8a para celulares como o Poco X7 Pro e x86_64 para emulador. Para gerar um APK com todas as arquiteturas configuradas no modelo, omita a opção **-PreactNativeArchitectures**.

Se o Ninja informar **Filename longer than 260 characters** mesmo com o projeto em um diretório curto, configure também **GRADLE_USER_HOME** para um caminho curto, como **C:\Gradle**, e reconstrua o projeto.

O pacote de teste **com.njsoftwares.pokecodefinder.rnpreview** usa armazenamento próprio. Na primeira abertura, escolha o jogo e refaça seus favoritos para o teste. O código-fonte tem configuração para o pacote de distribuição **com.njsoftwares.pokecodefinder**. Para gerar o projeto de produção, defina **POKEFINDER_PRODUCTION=1** antes do **expo prebuild --clean**. Para substituir uma instalação de produção anterior, configure a assinatura original do app e mantenha o código de versão em ordem crescente. Favoritos e preferências das versões Kotlin usam outro formato e ainda exigem uma etapa de migração para uma atualização de produção.

A base Expo também contém configuração para iPhone e iPad. Compilação local e assinatura de iOS requerem Xcode em macOS. A versão mínima indicada pelo Expo SDK 56 é Android 7 e iOS 16.4. Valide o aparelho e as bibliotecas da build antes de anunciar suporte a uma versão mínima. [Compatibilidade do Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/) · [Compilação local](https://docs.expo.dev/guides/local-app-production/)

## Roteiro para o Poco X7 Pro

1. Instale **PokeFinder Teste** e avance pelas quatro telas da introdução.
2. Em modo avião, abra **Códigos** em Yellow, busque **Rare Candy**, abra os detalhes, marque como favorito e teste **Copiar** em um campo de texto.
3. No menu, abra **Itens**, procure **Potion** e confira seu efeito. Abra **HMs**, escolha **HM03** e busque um Pokémon compatível. Repita em **TMs**.
4. Na **Pokédex**, pesquise **Pikachu**, abra a ficha e confira a imagem animada, os atributos e a família evolutiva. Teste o filtro de favoritos. Troque para **Crystal** pelo menu para conferir a animação dessa edição.
5. Troque para **Emerald** e abra **Dicas**. Volte para **Yellow**, abra **Detonados** e expanda uma etapa. Confira o guia **Como inserir cheats** e a página **Créditos**.
6. Alterne o tema, feche e reabra o app. Confira a edição, o tema e os favoritos.
7. Em **Atualizações**, toque em **Verificar agora** offline e depois com internet. A consulta online depende de uma release pública no GitHub.

**Validação do projeto**. Execute **npm run check** para verificar o TypeScript, a cobertura por jogo, as referências do catálogo e os 1.141 arquivos de imagem. O script **scripts/import-catalog.py** documenta como o conteúdo da versão 3.4 foi importado. As fontes e os créditos estão no [README](README.md#credits).

**Build de teste 4.0.0**. O APK de 63,2 MB passou na verificação de assinatura e alinhamento. O manifesto declara Android 7 (API 24) como mínimo e Android 16 (API 36) como alvo. No emulador Android 16, foram verificados em modo avião a introdução, o guia de cheats, a busca, a cópia e os favoritos de códigos, os efeitos de itens, as listas de compatibilidade de TM e HM, a ficha da Pokédex, o GIF de Cyndaquil em Crystal, Dicas de Emerald, Detonados, Créditos e a persistência dos favoritos e da edição após reiniciar. A tela de atualizações tratou a falta de conexão e, online, informou que nenhuma release pública foi encontrada. A validação em um Poco físico e a compilação iOS ficam pendentes.
