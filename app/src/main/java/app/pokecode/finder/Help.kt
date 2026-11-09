package app.pokecode.finder

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

private data class HelpTopic(val title: String, val description: String)

private val introduction = listOf(
    HelpTopic("Escolha o jogo", "Abra ☰ e selecione sua edição no campo Jogo. O menu mostra as seções que têm conteúdo para ela."),
    HelpTopic("Consulte sua equipe", "Na Pokédex, busque por nome, número ou tipo e toque em um cartão para abrir a ficha. O coração salva favoritos. Em Itens, toque para ver o efeito. Em TMs e HMs, abra a máquina para conferir os Pokémon compatíveis."),
    HelpTopic("Avance no jogo", "Use Dicas para atalhos e técnicas da sua edição. Quando disponível, Detonados organiza a aventura em etapas que você pode expandir."),
    HelpTopic("Use códigos e veja novidades", "Em Códigos, confira região, formato e revisão e toque em Copiar. Como inserir cheats mostra onde colar. Em Atualizações, consulte as releases do GitHub. O catálogo fica disponível offline."),
)

internal val introductionSize = introduction.size

@Composable
internal fun WelcomeDialog(page: Int, onNext: () -> Unit, onBack: () -> Unit, onClose: () -> Unit) {
    val topic = introduction[page]
    val last = page == introduction.lastIndex
    AlertDialog(
        onDismissRequest = onClose,
        title = { Text(if (page == 0) "Bem-vindo ao PokeFinder" else topic.title) },
        text = {
            Column(Modifier.heightIn(max = 260.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("${page + 1} de $introductionSize", color = LocalBrand.current.blue,
                    style = MaterialTheme.typography.labelMedium)
                if (page == 0) Text(topic.title, fontWeight = FontWeight.Bold)
                Text(topic.description)
            }
        },
        confirmButton = { Button(onClick = onNext) { Text(if (last) "Começar" else "Próximo") } },
        dismissButton = {
            if (page == 0) TextButton(onClick = onClose) { Text("Pular") }
            else TextButton(onClick = onBack) { Text("Anterior") }
        },
    )
}

@Composable
internal fun HelpScreen(onReplay: () -> Unit, onCheats: () -> Unit) {
    HelpList("Como usar") {
        item { Button(onClick = onReplay) { Text("Rever introdução") } }
        introduction.forEach { topic -> item { HelpPanel(topic.title) { Text(topic.description) } } }
        item { OutlinedButton(onClick = onCheats) { Text("Como inserir cheats") } }
    }
}

@Composable
internal fun CheatHelpScreen() {
    HelpList("Como inserir cheats") {
        item {
            HelpPanel("Antes de ativar") {
                Steps(
                    "Salve pelo menu do jogo e guarde uma cópia do arquivo de save. Se usar estado rápido, deixe também um estado separado de antes do teste.",
                    "No PokeFinder, selecione o jogo. No cartão, confira região, revisão e formato e toque em Copiar. Preserve as linhas e siga as instruções do cartão.",
                    "Quando a ficha exigir código mestre, copie-o separadamente e configure-o conforme o emulador. Ative um efeito por vez e teste antes de gravar o save principal.",
                )
            }
        }
        item {
            HelpPanel("RetroArch · Android ou computador") {
                Steps(
                    "Abra o jogo com o núcleo desejado e, com ele em execução, abra o Menu Rápido e depois Cheats.",
                    "Adicione uma entrada e abra seus detalhes. Se o núcleo oferecer o manipulador Emulator, selecione-o para enviar um código de cartucho ao emulador. A edição de memória RetroArch é um formato diferente.",
                    "Cole o código no campo Code, nomeie a entrada, habilite-a e aplique as alterações. Se a combinação de núcleo e formato não aceitar o código, consulte os formatos suportados pelo núcleo.",
                )
                SourceButton("Documentação de cheats do Libretro", "https://docs.libretro.com/guides/cheat-codes/")
            }
        }
        item {
            HelpPanel("mGBA · computador") {
                Steps(
                    "Com o jogo aberto, acesse Tools → Cheats.",
                    "Adicione um conjunto de cheats, cole o código no editor e adicione-o à lista. Selecione o formato exibido no PokeFinder quando a sua versão oferecer a escolha.",
                    "Habilite o conjunto e volte ao jogo. Confira o gatilho da ficha, como entrar em combate ou abrir a bolsa.",
                )
                SourceButton("Código oficial do editor de cheats do mGBA", "https://github.com/mgba-emu/mgba/blob/master/src/platform/qt/CheatsView.cpp")
            }
        }
        item {
            HelpPanel("melonDS · Android") {
                Steps(
                    "Em Settings → Cheats, habilite Enable cheats. Abra os cheats do jogo na lista de jogos ou no menu de pausa.",
                    "Se a sua versão oferece New cheat, crie uma entrada para essa ROM, dê um nome e cole as linhas Action Replay do Nintendo DS. Salve e habilite-a.",
                    "Nas versões com importação, use Settings → Cheats → Import cheats com uma base compatível e selecione a entrada do jogo. Faça backup dos cheats existentes antes de importar, pois a base pode substituí-los.",
                )
                SourceButton("Documentação do melonDS Android", "https://github.com/rafaelvcaetano/melonDS-android/wiki/Cheats")
            }
        }
        item {
            HelpPanel("Console físico") {
                Text("O jogo no cartucho usa um acessório de cheats compatível, como GameShark ou Action Replay. Siga o manual do modelo, selecione o jogo e a revisão e digite cada linha no editor do acessório. Salve a entrada e ative-a antes de iniciar o jogo conforme o manual.")
                SourceButton("Manual Action Replay GBA/DS da Datel", "https://uk.codejunkies.com/support_downloads/ARMAX_GBA_DS_English.pdf")
            }
        }
        item {
            HelpPanel("Se o código falhar") {
                Text("Desative a entrada e reinicie o jogo usando o save feito antes do teste. Confira se o emulador aceita o formato, se a região e revisão correspondem e se a ficha exige uma tecla de ativação ou código mestre.")
            }
        }
    }
}

@Composable
private fun HelpList(title: String, content: androidx.compose.foundation.lazy.LazyListScope.() -> Unit) {
    LazyColumn(Modifier.widthIn(max = 760.dp).fillMaxSize(), contentPadding = PaddingValues(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold) }
        content()
    }
}

@Composable
private fun HelpPanel(title: String, content: @Composable ColumnScope.() -> Unit) {
    val brand = LocalBrand.current
    OutlinedCard(shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, brand.line),
        colors = CardDefaults.outlinedCardColors(containerColor = brand.panel)) {
        Column(Modifier.fillMaxWidth().padding(15.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            content()
        }
    }
}

@Composable
private fun Steps(vararg steps: String) {
    steps.forEachIndexed { index, text -> Text("${index + 1}. $text", style = MaterialTheme.typography.bodyMedium) }
}

@Composable
internal fun SourceButton(label: String, url: String) {
    val handler = LocalUriHandler.current
    val context = LocalContext.current
    TextButton(onClick = {
        runCatching { handler.openUri(url) }
            .onFailure { Toast.makeText(context, "Não foi possível abrir o link", Toast.LENGTH_SHORT).show() }
    }) { Text(label) }
}
