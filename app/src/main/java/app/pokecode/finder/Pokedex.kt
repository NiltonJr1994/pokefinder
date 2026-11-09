package app.pokecode.finder

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.res.imageResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import java.util.Locale

private data class DexTone(val color: Color, val mark: String)

private val tones = mapOf(
    "Normal" to DexTone(Color(0xFFA1A4AC), "●"),
    "Lutador" to DexTone(Color(0xFFD65C7B), "◆"),
    "Voador" to DexTone(Color(0xFF8EA9E6), "↗"),
    "Venenoso" to DexTone(Color(0xFFAC72CE), "✦"),
    "Terrestre" to DexTone(Color(0xFFD59268), "▲"),
    "Pedra" to DexTone(Color(0xFFB7A377), "◆"),
    "Inseto" to DexTone(Color(0xFFA8BD56), "✳"),
    "Fantasma" to DexTone(Color(0xFF7874C3), "◈"),
    "Aço" to DexTone(Color(0xFF7FA6B1), "⬢"),
    "Fogo" to DexTone(Color(0xFFFF9556), "▲"),
    "Água" to DexTone(Color(0xFF6CA9EC), "●"),
    "Planta" to DexTone(Color(0xFF83C86E), "✿"),
    "Elétrico" to DexTone(Color(0xFFF5CC48), "ϟ"),
    "Psíquico" to DexTone(Color(0xFFF37694), "◉"),
    "Gelo" to DexTone(Color(0xFF80CFC9), "✦"),
    "Dragão" to DexTone(Color(0xFF698CDB), "◆"),
    "Sombrio" to DexTone(Color(0xFF8D839F), "◐"),
)

private fun tone(type: String) = tones[type] ?: tones.getValue("Normal")

private fun Pokemon.typesIn(edition: Edition) = if (edition.kanto) kantoTypes else types

@Composable
internal fun TypePill(type: String) {
    val brand = LocalBrand.current
    val tone = tone(type)
    Surface(
        color = lerp(brand.panel, tone.color, if (brand.dark) .23f else .28f),
        contentColor = brand.text, shape = RoundedCornerShape(50),
    ) {
        Text("${tone.mark}  $type", Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
            style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun TypeRow(types: List<String>) {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(5.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        types.forEach { TypePill(it) }
    }
}

private enum class DexOrder(val label: String) {
    LOWEST("Menor número"), HIGHEST("Maior número"), A_Z("A–Z"), Z_A("Z–A"),
}

private enum class DexPicker(val title: String) {
    TYPE("Selecione o tipo"), ORDER("Selecione a ordem"),
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
internal fun Dex(
    catalog: Catalog, edition: Edition, favorites: Set<Int>,
    onFavorite: (Int) -> Unit, onOpen: (Int) -> Unit,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var type by rememberSaveable { mutableStateOf("") }
    var order by rememberSaveable { mutableStateOf(DexOrder.LOWEST) }
    var favoritesOnly by rememberSaveable { mutableStateOf(false) }
    var picker by remember { mutableStateOf<DexPicker?>(null) }
    val editionPokemon = remember(catalog, edition) { catalog.pokemonFor(edition) }
    val availableTypes = remember(editionPokemon, edition) {
        editionPokemon.flatMap { it.typesIn(edition) }.distinct().sorted()
    }
    val results = remember(editionPokemon, edition, query, type, order, favoritesOnly, favorites) {
        val needle = query.trim().searchKey()
        val number = needle.removePrefix("#").toIntOrNull()
        val matched = editionPokemon.filter {
            val types = it.typesIn(edition)
            (type.isEmpty() || type in types) && (!favoritesOnly || it.id in favorites) &&
                (it.id == number || it.name.searchKey().contains(needle) || types.any { label -> label.searchKey().contains(needle) })
        }
        when (order) {
            DexOrder.LOWEST -> matched.sortedBy(Pokemon::id)
            DexOrder.HIGHEST -> matched.sortedByDescending(Pokemon::id)
            DexOrder.A_Z -> matched.sortedBy { it.name.searchKey() }
            DexOrder.Z_A -> matched.sortedByDescending { it.name.searchKey() }
        }
    }
    LazyVerticalGrid(
        columns = GridCells.Adaptive(300.dp), modifier = Modifier.widthIn(max = 1024.dp).fillMaxSize(),
        contentPadding = PaddingValues(12.dp), horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        item(span = { GridItemSpan(maxLineSpan) }) {
            SectionHeader(Section.DEX, edition, "${editionPokemon.size} espécies · Numeração nacional")
        }
        item(span = { GridItemSpan(maxLineSpan) }) {
            Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                SearchField(query, { query = it }, "Procurar Pokémon")
                FlowRow(horizontalArrangement = Arrangement.spacedBy(7.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    DexControl("${type.ifBlank { "Todos os tipos" }} ▾") { picker = DexPicker.TYPE }
                    DexControl("${order.label} ▾") { picker = DexPicker.ORDER }
                    FilterChip(selected = favoritesOnly, onClick = { favoritesOnly = !favoritesOnly },
                        label = { Text("♡ Favoritos") })
                }
            }
        }
        if (results.isEmpty()) item(span = { GridItemSpan(maxLineSpan) }) { Text("Nenhum Pokémon encontrado.") }
        items(results, key = Pokemon::id) { pokemon ->
            DexCard(pokemon, edition, pokemon.id in favorites, { onFavorite(pokemon.id) }) { onOpen(pokemon.id) }
        }
    }

    val activePicker = picker
    if (activePicker != null) {
        ModalBottomSheet(onDismissRequest = { picker = null }, containerColor = LocalBrand.current.panel) {
            LazyColumn(Modifier.fillMaxWidth().heightIn(max = 480.dp), contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)) {
                item {
                    Text(activePicker.title, Modifier.padding(bottom = 8.dp), style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold)
                }
                if (activePicker == DexPicker.TYPE) {
                    item {
                        DexControl("Todos os tipos", Modifier.fillMaxWidth(), selected = type.isEmpty()) {
                            type = ""
                            picker = null
                        }
                    }
                    availableTypes.forEach { label ->
                        item(key = label) {
                            DexControl(label, Modifier.fillMaxWidth(), tone(label).color, type == label) {
                                type = label
                                picker = null
                            }
                        }
                    }
                } else {
                    DexOrder.entries.forEach { choice ->
                        item(key = choice.name) {
                            DexControl(choice.label, Modifier.fillMaxWidth(), selected = choice == order) {
                                order = choice
                                picker = null
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DexControl(
    label: String, modifier: Modifier = Modifier, color: Color? = null, selected: Boolean = false,
    onClick: () -> Unit,
) {
    val brand = LocalBrand.current
    val background = color ?: if (brand.dark) brand.line else brand.text
    val text = if (background.luminance() > .27f) Color(0xFF182033) else Color.White
    Button(
        onClick = onClick, modifier = modifier,
        shape = RoundedCornerShape(50),
        colors = ButtonDefaults.buttonColors(containerColor = background, contentColor = text),
        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
    ) {
        Text(if (selected) "✓  $label" else label, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
private fun DexFavoriteButton(name: String, favorite: Boolean, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val brand = LocalBrand.current
    IconButton(
        onClick = onClick, modifier = modifier.semantics {
            contentDescription = if (favorite) "Remover $name dos favoritos" else "Favoritar $name"
        },
    ) {
        Surface(shape = RoundedCornerShape(50), color = brand.panel, contentColor = brand.blue) {
            Box(Modifier.size(28.dp), contentAlignment = Alignment.Center) {
                Text(if (favorite) "♥" else "♡", style = MaterialTheme.typography.titleLarge)
            }
        }
    }
}

@Composable
private fun DexCard(pokemon: Pokemon, edition: Edition, favorite: Boolean, onFavorite: () -> Unit, onClick: () -> Unit) {
    val brand = LocalBrand.current
    val types = pokemon.typesIn(edition)
    val color = tone(types.first()).color
    OutlinedCard(
        onClick = onClick, colors = CardDefaults.outlinedCardColors(
            containerColor = lerp(brand.panel, color, if (brand.dark) .14f else .16f),
            contentColor = brand.text,
        ),
        border = BorderStroke(1.dp, lerp(brand.line, color, .18f)), shape = RoundedCornerShape(15.dp),
    ) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f).padding(horizontal = 10.dp, vertical = 6.dp),
                verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(pokemon.number, color = brand.muted, style = MaterialTheme.typography.labelMedium,
                    fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                Text(pokemon.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                TypeRow(types)
            }
            val shape = RoundedCornerShape(14.dp)
            Box(Modifier.size(103.dp, 82.dp).clip(shape)
                .background(lerp(brand.panel, color, if (brand.dark) .49f else .80f)),
                contentAlignment = Alignment.Center) {
                DexMark(color)
                PokemonArt(pokemon, edition, Modifier.size(72.dp))
                DexFavoriteButton(pokemon.name, favorite, Modifier.align(Alignment.TopEnd), onFavorite)
            }
        }
    }
}

@Composable
private fun DexMark(color: Color) {
    Canvas(Modifier.fillMaxSize()) {
        val radius = size.minDimension * .36f
        val center = Offset(size.width * .5f, size.height * .48f)
        val mark = Color.White.copy(alpha = .28f)
        drawCircle(mark, radius, center, style = Stroke(radius * .17f))
        drawLine(mark, Offset(center.x - radius, center.y), Offset(center.x + radius, center.y), radius * .14f)
        drawCircle(color.copy(alpha = .35f), radius * .28f, center)
        drawCircle(mark, radius * .29f, center, style = Stroke(radius * .10f))
    }
}

@Composable
private fun PokemonArt(pokemon: Pokemon, edition: Edition, modifier: Modifier) {
    AnimatedPokemonSprite(pokemon.id, edition, modifier) { imageModifier ->
        if (pokemon.sprite == 0) {
            Box(imageModifier, contentAlignment = Alignment.Center) { Text(pokemon.number) }
        } else {
            Image(ImageBitmap.imageResource(pokemon.sprite), null, imageModifier, filterQuality = FilterQuality.None)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun PokemonDetail(
    pokemon: Pokemon, catalog: Catalog, edition: Edition, favorites: Set<Int>,
    onFavorite: (Int) -> Unit, onOpen: (Int) -> Unit,
) {
    val brand = LocalBrand.current
    val stats = if (edition.kanto) pokemon.kantoStats else pokemon.stats
    val types = pokemon.typesIn(edition)
    val color = tone(types.first()).color
    val names = if (edition.kanto) listOf("HP", "Ataque", "Defesa", "Especial", "Velocidade")
        else listOf("HP", "Ataque", "Defesa", "At. Especial", "Def. Especial", "Velocidade")
    val locations = pokemon.locations[edition.version].orEmpty()
    val family = remember(pokemon, edition) {
        val available = catalog.pokemonFor(edition).mapTo(mutableSetOf(), Pokemon::id)
        pokemon.family.filter { it != pokemon.id && it in available }.mapNotNull(catalog.byId::get)
    }
    LazyColumn(
        Modifier.widthIn(max = 760.dp).fillMaxSize(), contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            OutlinedCard(shape = RoundedCornerShape(24.dp), border = BorderStroke(1.dp, brand.line),
                colors = CardDefaults.outlinedCardColors(containerColor = brand.panel)) {
                Column {
                    Box(
                        Modifier.fillMaxWidth().height(176.dp)
                            .clip(RoundedCornerShape(bottomStart = 56.dp, bottomEnd = 56.dp))
                            .background(Brush.verticalGradient(listOf(
                                lerp(brand.panel, color, if (brand.dark) .68f else .90f),
                                lerp(brand.panel, color, if (brand.dark) .48f else .65f),
                            ))),
                        contentAlignment = Alignment.Center,
                    ) {
                        DexMark(color)
                        PokemonArt(pokemon, edition, Modifier.size(156.dp))
                        DexFavoriteButton(pokemon.name, pokemon.id in favorites,
                            Modifier.align(Alignment.TopEnd).padding(6.dp)) { onFavorite(pokemon.id) }
                    }
                    Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
                        Text(pokemon.number, color = brand.muted, style = MaterialTheme.typography.labelLarge,
                            fontFamily = FontFamily.Monospace)
                        Text(pokemon.name, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                        TypeRow(types)
                        GameBadge("Pokémon ${edition.title}")
                        Text(
                            if (edition == Edition.CRYSTAL) "Animação de batalha de Crystal"
                            else "Animação ilustrativa · Pokémon Showdown",
                            color = brand.muted, style = MaterialTheme.typography.labelMedium,
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            DexMetric("Altura", "${measure(pokemon.height)} m", Modifier.weight(1f))
                            DexMetric("Peso", "${measure(pokemon.weight)} kg", Modifier.weight(1f))
                        }
                    }
                }
            }
        }
        item {
            DexPanel("Atributos base") {
                names.zip(stats).forEach { (name, value) ->
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(name, Modifier.weight(1f), style = MaterialTheme.typography.bodySmall)
                        LinearProgressIndicator(progress = { value / 255f }, modifier = Modifier.weight(1.2f),
                            color = lerp(brand.blue, color, .55f), trackColor = brand.line)
                        Text(value.toString(), fontFamily = FontFamily.Monospace, modifier = Modifier.width(31.dp))
                    }
                }
            }
        }
        item {
            DexPanel("Família evolutiva") {
                if (family.isEmpty()) Text("Sem evoluções registradas nesta geração.")
                family.forEach { related ->
                    DexCard(related, edition, related.id in favorites, { onFavorite(related.id) }) { onOpen(related.id) }
                }
            }
        }
        if (edition == Edition.YELLOW && pokemon.yellowObtaining.isNotBlank()) item {
            DexPanel("Como obter em Yellow") { Text(pokemon.yellowObtaining) }
        }
        item {
            DexPanel("Encontros · ${edition.title}") {
                if (locations.isEmpty()) {
                    Text("Sem encontros cadastrados para esta edição. Consulte o detonado para presentes, trocas e eventos.")
                } else {
                    locations.forEach { Text(it, style = MaterialTheme.typography.bodyMedium) }
                }
            }
        }
    }
}

private fun measure(value: Double) = String.format(Locale.forLanguageTag("pt-BR"), "%.1f", value)

@Composable
private fun DexMetric(label: String, value: String, modifier: Modifier) {
    val brand = LocalBrand.current
    Surface(modifier, color = brand.page, shape = RoundedCornerShape(12.dp), border = BorderStroke(1.dp, brand.line)) {
        Column(Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(label, color = brand.muted, style = MaterialTheme.typography.labelMedium)
            Text(value, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun DexPanel(title: String, content: @Composable ColumnScope.() -> Unit) {
    val brand = LocalBrand.current
    OutlinedCard(colors = CardDefaults.outlinedCardColors(containerColor = brand.panel),
        shape = RoundedCornerShape(18.dp), border = BorderStroke(1.dp, brand.line)) {
        Column(Modifier.fillMaxWidth().padding(15.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            content()
        }
    }
}
