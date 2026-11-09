# Changelog

## 3.4.0

- Renomeado o rótulo Android, o projeto Gradle e o cabeçalho para **PokeFinder**. Os identificadores de pacote foram preservados para manter o caminho de atualização.
- Adicionada introdução de quatro etapas no primeiro uso. O progresso concluído é salvo localmente e a introdução pode ser reaberta em **Como usar**.
- Adicionado **Como inserir cheats** no menu e na tela Códigos, com instruções para RetroArch, mGBA, melonDS Android e console físico. Os exemplos explicam revisão, formato, código mestre, backup e desativação.
- A seção Dicas agora aparece para todas as 11 edições do seletor. Adicionadas 16 entradas, entre dicas gerais, por grupo e por jogo. As instruções indicam como executar no console ou com controles mapeados no emulador.
- Adicionada a consulta automática a releases públicas do GitHub ao abrir ou retornar ao app, com intervalo, tratamento de falhas, opção manual e controle para desativá-la. A versão é comparada numericamente. O banner leva à página de Atualizações, de onde o usuário pode abrir a release.
- Adicionada permissão de internet para a consulta HTTPS. O app abre a página pública da release para download e instalação pelo usuário.
- Acrescentadas fontes de emuladores e hardware nos Créditos. Adicionados este histórico e as instruções de publicação no README.
- Mantidos os catálogos de códigos, itens, TMs, HMs, Pokédex e GIFs das versões anteriores.

### Arquivos de interesse

- `app/src/main/java/app/pokecode/finder/Help.kt` contém o onboarding e as instruções de cheats.
- `app/src/main/java/app/pokecode/finder/Updates.kt` contém a verificação de releases e sua tela.
- `app/src/main/assets/catalog.json` inclui as dicas por edição e grupo de edições.
- `app/src/main/AndroidManifest.xml` declara o rótulo e a permissão de internet.
- `settings.gradle.kts` e `app/build.gradle.kts` definem o nome do projeto e a versão.
