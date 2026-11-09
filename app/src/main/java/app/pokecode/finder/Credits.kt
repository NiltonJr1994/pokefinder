package app.pokecode.finder

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

data class CreditSource(val title: String, val url: String = "")

private val designSources = listOf(
    CreditSource("Pokedex | Pokemon App · Junior Saraiva", "https://www.behance.net/gallery/220086377/Pokedex-Pokemon-App"),
    CreditSource("PokeFinder · identidade de N. J. Softwares"),
)

private val catalogSources = listOf(
    CreditSource("PokéAPI · dados de espécies, encontros, itens e máquinas", "https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv"),
    CreditSource("PokéAPI · sprites de Pokémon, itens e animações de Crystal", "https://github.com/PokeAPI/sprites"),
    CreditSource("Pokémon Showdown · GIFs ilustrativos distribuídos no repositório PokéAPI", "https://github.com/PokeAPI/sprites/tree/master/sprites/pokemon/other/showdown"),
    CreditSource("Pokémon Database · catálogo e imagens de itens", "https://pokemondb.net/item/all"),
    CreditSource("Pokémon Database · TMs de Red, Blue e Yellow", "https://pokemondb.net/red-blue/tms"),
    CreditSource("Pokémon Database · HMs de Red, Blue e Yellow", "https://pokemondb.net/red-blue/hms"),
    CreditSource("IGN · guia de itens de Red, Blue e Yellow", "https://www.ign.com/wikis/pokemon-red-blue-yellow-version/Items"),
    CreditSource("Bulbapedia · detonados e referências das gerações I a III", "https://bulbapedia.bulbagarden.net/wiki/Category:Walkthroughs"),
    CreditSource("PokéPC · ficha e disponibilidade em Pokémon Yellow", "https://pokepc.net/"),
    CreditSource("Pokémon Trainer’s Guide · Special Pikachu Edition, Nintendo"),
    CreditSource("Pokemon Yellow Kanto Pokedex · Pokémon Checklist, PDF fornecido"),
    CreditSource("Detonado Pokémon Yellow: Guia Completo · Pokémon Mythology, cópia fornecida"),
    CreditSource("Pokémon e seus personagens · Nintendo, Creatures e GAME FREAK"),
)

private val codeReferences = listOf(
    CreditSource("Libretro · documentação de cheats", "https://docs.libretro.com/guides/cheat-codes/"),
    CreditSource("mGBA · editor de cheats", "https://github.com/mgba-emu/mgba/blob/master/src/platform/qt/CheatsView.cpp"),
    CreditSource("melonDS Android · guia de cheats", "https://github.com/rafaelvcaetano/melonDS-android/wiki/Cheats"),
    CreditSource("Datel · manual Action Replay GBA/DS", "https://uk.codejunkies.com/support_downloads/ARMAX_GBA_DS_English.pdf"),
    CreditSource("pret/pokeyellow · constantes e índices internos", "https://github.com/pret/pokeyellow/tree/master/constants"),
    CreditSource("Glitch City Wiki · arquivo de códigos de Red, Blue e Yellow",
        "https://nintyconservation.github.io/glitchcity.wiki/glitchcity.wiki/Pok%C3%A9mon_Red%2C_Blue_and_Yellow_GameShark_codes.html"),
    CreditSource("Psypoke · GameShark em Pokémon Yellow", "https://psypokes.com/rby/ygameshark.php"),
)

@Composable
internal fun Credits(codeSources: List<CreditSource>) {
    val brand = LocalBrand.current
    LazyColumn(
        Modifier.widthIn(max = 760.dp).fillMaxSize(),
        contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Column(Modifier.padding(start = 2.dp, bottom = 4.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                Text("Créditos", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Text("Autoria do design e referências do catálogo", style = MaterialTheme.typography.bodySmall,
                    color = brand.muted)
            }
        }
        item { CreditPanel("Design", designSources) }
        item { CreditPanel("Pokédex, itens e guias", catalogSources) }
        item { CreditPanel("Códigos e arquivos de referência", codeReferences + codeSources) }
        item {
            Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Adaptação e desenvolvimento", style = MaterialTheme.typography.labelLarge, color = brand.muted)
                Text("N. J. Softwares", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun CreditPanel(title: String, sources: List<CreditSource>) {
    val brand = LocalBrand.current
    val handler = LocalUriHandler.current
    val context = LocalContext.current
    OutlinedCard(
        border = BorderStroke(1.dp, brand.line), shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.outlinedCardColors(containerColor = brand.panel),
    ) {
        Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            sources.forEach { source ->
                if (source.url.startsWith("https://")) {
                    TextButton(
                        onClick = {
                            runCatching { handler.openUri(source.url) }
                                .onFailure { Toast.makeText(context, "Não foi possível abrir a fonte", Toast.LENGTH_SHORT).show() }
                        },
                        contentPadding = PaddingValues(horizontal = 0.dp, vertical = 8.dp),
                    ) { Text(source.title) }
                } else {
                    Text(source.title, Modifier.padding(vertical = 7.dp), style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
    }
}
