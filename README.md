# PokeFinder 3.4.0

Guia de fã da N. J. Softwares para consultar códigos, itens, máquinas, dicas, detonados e Pokédex por edição. Android 10 ou posterior. O catálogo, as imagens e os guias funcionam offline. A conexão do app é usada pela consulta às releases públicas do GitHub.

## Compilar

Extraia o ZIP e abra a pasta `PokeFinder` no Android Studio. Use JDK 17 e Android SDK 36. Na primeira sincronização, o Gradle baixa as dependências. Em seguida, use **Run** ou:

```powershell
.\gradlew.bat :app:assembleDebug
```

O APK sai em `app/build/outputs/apk/debug/app-debug.apk`. O projeto Gradle e o rótulo no Android usam PokeFinder. O identificador de produção permanece `com.njsoftwares.pokecodefinder`. A compilação de teste usa `com.njsoftwares.pokecodefinder.debug` e pode atualizar o APK de teste 3.3 quando a assinatura é a mesma.

## Colocar o código no GitHub

1. Clone o [repositório do projeto](https://github.com/NiltonJr1994/pokefinder) com acesso à sua conta.
2. Copie o **conteúdo** da pasta `PokeFinder` extraída para a raiz do clone. Revise quaisquer arquivos já existentes no clone antes de substituí-los. A raiz deve conter `settings.gradle.kts`, `app` e `gradlew.bat`.
3. Revise `git status` e o que será enviado. O ZIP inclui os catálogos e os recursos visuais usados pelo app. Confira os direitos de redistribuição antes de tornar esses arquivos públicos.
4. Faça o commit e envie a partir da sua máquina.

```powershell
git add .
git commit -m "Add PokeFinder Android 3.4.0"
git push -u origin HEAD
```

Mantenha as chaves de assinatura, as senhas e `local.properties` fora do repositório. O [CHANGELOG.md](CHANGELOG.md) descreve as alterações da versão.

## Publicar uma atualização

1. Em `app/build.gradle.kts`, aumente `versionCode` e defina `versionName` no formato `MAJOR.MINOR.PATCH`. Para a próxima atualização após 3.4.0, um exemplo é `versionCode = 34001` e `versionName = "3.4.1"`.
2. Gere um **APK release assinado** no Android Studio com a chave de distribuição do mesmo pacote. Uma instalação de produção precisa da mesma assinatura das versões de produção anteriores. Use o mesmo canal de assinatura ao testar uma atualização sobre uma instalação existente. [Assinatura de apps Android](https://developer.android.com/studio/publish/app-signing)
3. Envie o commit da versão ao GitHub e crie uma release pública apontando para ele. Use uma tag como `v3.4.1`, publique como release estável mais recente e anexe o APK assinado. O arquivo deve estar na seção **Assets** da release. [Documentação de releases do GitHub](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
4. Na versão anterior do app, vá a **Atualizações → Verificar agora**. Ao detectar uma versão maior, o app mostra a tag e abre a página da release para o usuário escolher o download e a instalação.

O verificador consulta `https://api.github.com/repos/NiltonJr1994/pokefinder/releases/latest` por HTTPS, sem credenciais. O repositório e a release precisam ser públicos. Ele consulta ao abrir ou voltar ao app quando a última consulta estiver fora do intervalo de 12 horas. Em falha, a próxima tentativa automática fica para depois de 30 minutos. O botão manual faz a consulta na hora e a opção automática pode ser desligada. O GitHub recebe a conexão e a versão do app no agente da requisição. [Endpoint de releases do GitHub](https://docs.github.com/en/rest/releases/releases#get-the-latest-release)

Na consulta pública feita para esta entrega, tanto o repositório quanto o endpoint de release retornaram HTTP 404. Quando a release estiver pública, faça a verificação manual para confirmar a publicação.

## Validação no Poco X7 Pro

No emulador Android 16, a instalação sobre o 3.3 passou. Foram verificados o onboarding, o acesso às instruções de cheats, as dicas de Emerald e os estados de atualização com e sem rede. A resposta de uma versão nova foi testada com dados simulados, pois o endpoint público respondeu HTTP 404.

| Passo | Resultado esperado |
| --- | --- |
| Instale e abra pela primeira vez | O Android mostra **PokeFinder**. A introdução tem quatro telas. |
| Abra **Como usar** no menu e toque em **Rever introdução** | O guia pode ser revisto. |
| Em Yellow, entre em **Códigos → Como inserir cheats** | A página mostra RetroArch, mGBA, melonDS Android e console físico. |
| Selecione **Emerald**, **FireRed** ou **SoulSilver** e abra **Dicas** | Aparecem instruções para aquela edição, com controles do console ou equivalentes no emulador. |
| Abra **Atualizações → Verificar agora** com conexão | O app informa a situação da release pública. |
| Repita a consulta em modo avião e abra a Pokédex | A consulta informa a falha de conexão e o catálogo local continua disponível. |

## Nome e distribuição pública

A busca preliminar encontrou outra ferramenta de Pokémon chamada **PokeFinder**, de Admiral-Fish. O nome idêntico e o público semelhante criam risco de confusão. No Brasil, o art. 124, XIX, da Lei 9.279/1996 trata da reprodução ou imitação de marca registrada para produtos ou serviços relacionados quando há possibilidade de confusão ou associação. A consulta disponível não permitiu confirmar a situação de registros no INPI. Antes de publicar ou pedir registro, faça uma busca por grafias semelhantes no INPI e avalie o resultado no contexto de software. A questão dos nomes, sprites e imagens de Pokémon também precisa ser avaliada separadamente. [Projeto Admiral-Fish/PokeFinder](https://github.com/Admiral-Fish/PokeFinder) · [INPI](https://www.gov.br/inpi/pt-br/servicos/marcas) · [Lei 9.279/1996](https://www.planalto.gov.br/ccivil_03/leis/l9279.htm) · [Pokémon Support](https://support.pokemon.com/hc/en-us/articles/360000634094-Can-I-use-Pok%C3%A9mon-images-or-materials)

As fontes do catálogo e do design também estão em **Créditos** dentro do app.

"# pokefinder" 
