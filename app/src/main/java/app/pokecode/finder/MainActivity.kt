package app.pokecode.finder

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.Normalizer
import java.util.Locale

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val preferences = remember { getSharedPreferences("finder", Context.MODE_PRIVATE) }
            val systemDark = isSystemInDarkTheme()
            var dark by remember(preferences) { mutableStateOf(preferences.getBoolean("darkTheme", systemDark)) }
            LaunchedEffect(dark) {
                val bar = SystemBarStyle.auto(android.graphics.Color.TRANSPARENT, android.graphics.Color.TRANSPARENT) { dark }
                enableEdgeToEdge(statusBarStyle = bar, navigationBarStyle = bar)
            }
            FinderTheme(dark) {
                val result by produceState<Result<Catalog>?>(null) {
                    value = withContext(Dispatchers.IO) { runCatching { Catalog(applicationContext) } }
                }
                val catalog = result?.getOrNull()
                if (catalog != null) {
                    Finder(catalog) {
                        dark = !dark
                        preferences.edit().putBoolean("darkTheme", dark).apply()
                    }
                } else {
                    Surface(Modifier.fillMaxSize()) {
                        Box(Modifier.safeDrawingPadding().padding(24.dp), contentAlignment = Alignment.Center) {
                            if (result == null) CircularProgressIndicator()
                            else Text("Não foi possível abrir o catálogo offline. Reinstale o aplicativo.")
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun Finder(catalog: Catalog, onTheme: () -> Unit) {
    val context = LocalContext.current
    val preferences = remember(context) { context.getSharedPreferences("finder", Context.MODE_PRIVATE) }
    var edition by rememberSaveable {
        val saved = preferences.getString("edition", null)
        mutableStateOf(Edition.entries.firstOrNull { it.name == saved } ?: Edition.YELLOW)
    }
    var section by rememberSaveable {
        mutableStateOf(if (edition in Section.CODES.editions) Section.CODES else Section.ITEMS)
    }
    var selectedPokemon by rememberSaveable { mutableIntStateOf(0) }
    var selectedMachine by rememberSaveable { mutableStateOf("") }
    var editionMenu by remember { mutableStateOf(false) }
    val drawer = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val states = rememberSaveableStateHolder()
    var favorites by remember(preferences) {
        mutableStateOf(preferences.getStringSet("favorites", emptySet()).orEmpty().toSet())
    }
    var dexFavorites by remember(preferences) {
        mutableStateOf(preferences.getStringSet("dexFavorites", emptySet()).orEmpty()
            .mapNotNull(String::toIntOrNull).toSet())
    }
    val toggleDexFavorite: (Int) -> Unit = { id ->
        dexFavorites = if (id in dexFavorites) dexFavorites - id else dexFavorites + id
        preferences.edit().putStringSet("dexFavorites", dexFavorites.map(Int::toString).toSet()).apply()
    }
    val release = remember(preferences) { ReleaseCheck(preferences) }
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    DisposableEffect(lifecycle, release) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_START) scope.launch { release.check() }
        }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }

    var onboardingPage by rememberSaveable {
        mutableIntStateOf(if (preferences.getBoolean("onboardingComplete", false)) -1 else 0)
    }
    val finishOnboarding = {
        onboardingPage = -1
        preferences.edit().putBoolean("onboardingComplete", true).apply()
    }

    val detail = catalog.byId[selectedPokemon]
    val machine = remember(edition, selectedMachine) { catalog.reference.machine(edition, selectedMachine) }
    val inDetail = detail != null || machine != null
    val back = { selectedPokemon = 0; selectedMachine = "" }

    BackHandler(enabled = inDetail && drawer.isClosed, onBack = back)
    if (onboardingPage >= 0) {
        WelcomeDialog(
            page = onboardingPage,
            onNext = { if (onboardingPage + 1 == introductionSize) finishOnboarding() else onboardingPage++ },
            onBack = { onboardingPage-- },
            onClose = finishOnboarding,
        )
    }
    ModalNavigationDrawer(
        drawerState = drawer,
        gesturesEnabled = drawer.isOpen,
        drawerContent = {
            ModalDrawerSheet(drawerState = drawer, drawerContainerColor = LocalBrand.current.panel) {
                Column(Modifier.verticalScroll(rememberScrollState()).padding(bottom = 12.dp)) {
                    BrandWordmark(Modifier.fillMaxWidth().padding(horizontal = 12.dp).heightIn(min = 72.dp))
                    Column(Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, bottom = 10.dp)) {
                        Text("Jogo", Modifier.padding(start = 4.dp), color = LocalBrand.current.muted,
                            style = MaterialTheme.typography.labelMedium)
                        Box {
                            OutlinedButton(
                                onClick = { editionMenu = true }, modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, LocalBrand.current.line),
                            ) {
                                Text("Pokémon ${edition.title}", Modifier.weight(1f))
                                Text("▾")
                            }
                            DropdownMenu(
                                expanded = editionMenu, onDismissRequest = { editionMenu = false },
                                modifier = Modifier.heightIn(max = 420.dp),
                            ) {
                                Edition.entries.forEach { game ->
                                    DropdownMenuItem(
                                        text = { Text("Pokémon ${game.title}") },
                                        trailingIcon = if (edition == game) ({ Text("✓") }) else null,
                                        onClick = {
                                            if (edition != game) {
                                                edition = game
                                                preferences.edit().putString("edition", game.name).apply()
                                                if (!section.global && game !in section.editions) {
                                                    section = if (game in Section.CODES.editions) Section.CODES else Section.ITEMS
                                                }
                                                back()
                                            }
                                            editionMenu = false
                                        },
                                    )
                                }
                            }
                        }
                    }
                    Section.entries.filter { it.global || edition in it.editions }.forEach { item ->
                        NavigationDrawerItem(
                            label = { Text(item.title, fontWeight = FontWeight.SemiBold) },
                            selected = section == item,
                            onClick = {
                                section = item
                                back()
                                scope.launch { drawer.close() }
                            },
                            modifier = Modifier.padding(NavigationDrawerItemDefaults.ItemPadding),
                        )
                    }
                }
            }
        },
    ) {
        val brand = LocalBrand.current
        Scaffold(
            containerColor = brand.page,
            topBar = {
                if (inDetail) {
                    TopAppBar(
                        title = { Text(if (detail != null) Section.DEX.title else machine?.move.orEmpty(), maxLines = 1) },
                        navigationIcon = { SymbolButton("‹", "Voltar", back) },
                        colors = TopAppBarDefaults.topAppBarColors(containerColor = brand.panel),
                    )
                } else {
                    BrandHeader(
                        onMenu = { scope.launch { drawer.open() } },
                        onTheme = onTheme,
                        updateTag = release.updateTag,
                        onUpdates = { section = Section.UPDATES },
                    )
                }
            },
        ) { padding ->
            Box(Modifier.fillMaxSize().padding(padding)
                .background(Brush.linearGradient(listOf(brand.red.copy(alpha = .06f), brand.page, brand.blue.copy(alpha = .08f)))),
                contentAlignment = Alignment.TopCenter) {
                when {
                    detail != null -> key(detail.id, edition) {
                        PokemonDetail(detail, catalog, edition, dexFavorites, toggleDexFavorite) { selectedPokemon = it }
                    }
                    machine != null -> key(edition, machine.code) { MachineDetail(machine, edition, catalog.reference) }
                    else -> states.SaveableStateProvider("${section.name}/${edition.name}") {
                        when (section) {
                            Section.DEX -> Dex(catalog, edition, dexFavorites, toggleDexFavorite) { selectedPokemon = it }
                            Section.CREDITS -> Credits(catalog.codeSources)
                            Section.HELP -> HelpScreen(
                                onReplay = { onboardingPage = 0 },
                                onCheats = { section = Section.CHEAT_HELP },
                            )
                            Section.CHEAT_HELP -> CheatHelpScreen()
                            Section.UPDATES -> UpdateScreen(
                                release,
                                onCheck = { scope.launch { release.check(force = true) } },
                                onAutomatic = { enabled ->
                                    release.changeAutomatic(enabled)
                                    if (enabled) scope.launch { release.check() }
                                },
                            )
                            Section.ITEMS -> {
                                val entries = remember(edition) { catalog.reference.items(edition) }
                                ItemList(entries, edition)
                            }
                            Section.TMS, Section.HMS -> {
                                val machines = remember(section, edition) {
                                    catalog.reference.machines(edition, section == Section.HMS)
                                }
                                MachineList(machines, edition, section) { selectedMachine = it }
                            }
                            else -> {
                                val entries = remember(section, edition) { catalog.entries(section, edition) }
                                EntryList(section, edition, entries, favorites,
                                    onCheatHelp = { section = Section.CHEAT_HELP }) { id ->
                                    favorites = if (id in favorites) favorites - id else favorites + id
                                    preferences.edit().putStringSet("favorites", favorites).apply()
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
internal fun SymbolButton(symbol: String, label: String, onClick: () -> Unit) {
    IconButton(onClick = onClick, modifier = Modifier.semantics { contentDescription = label }) {
        Text(symbol, style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.primary)
    }
}

@Composable
internal fun SectionHeader(section: Section, edition: Edition, summary: String) {
    val brand = LocalBrand.current
    Column(Modifier.fillMaxWidth().padding(start = 2.dp, end = 2.dp, bottom = 3.dp),
        verticalArrangement = Arrangement.spacedBy(5.dp)) {
        Text(section.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        GameBadge("Pokémon ${edition.title}")
        Text(summary, style = MaterialTheme.typography.bodySmall, color = brand.muted)
    }
}

private val combiningMarks = Regex("\\p{M}+")

internal fun String.searchKey(): String =
    Normalizer.normalize(lowercase(Locale.ROOT), Normalizer.Form.NFD).replace(combiningMarks, "")

@Composable
internal fun SearchField(value: String, onChange: (String) -> Unit, label: String) {
    OutlinedTextField(
        value = value, onValueChange = onChange, modifier = Modifier.fillMaxWidth(),
        label = { Text(label) }, singleLine = true, shape = RoundedCornerShape(12.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = LocalBrand.current.page, unfocusedContainerColor = LocalBrand.current.page,
            unfocusedBorderColor = LocalBrand.current.line,
        ),
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
        trailingIcon = { if (value.isNotEmpty()) SymbolButton("×", "Limpar busca") { onChange("") } },
    )
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun EntryList(
    section: Section,
    edition: Edition,
    entries: List<Entry>,
    favorites: Set<String>,
    onCheatHelp: () -> Unit,
    onFavorite: (String) -> Unit,
) {
    var query by rememberSaveable { mutableStateOf("") }
    var category by rememberSaveable { mutableStateOf("Todos") }
    var expanded by rememberSaveable { mutableStateOf("") }
    var favoritesOnly by rememberSaveable { mutableStateOf(false) }
    var format by rememberSaveable { mutableStateOf("Todos") }
    val searchable = remember(entries) {
        entries.map { it to "${it.title} ${it.aliases} ${it.body} ${it.code} ${it.format}".searchKey() }
    }
    val results = remember(searchable, query, category, format, favoritesOnly, favorites) {
        val needle = query.trim().searchKey()
        val filtered = searchable.filter { (entry, _) ->
            (category == "Todos" || entry.category == category) &&
                (format == "Todos" || entry.format.substringBefore(" · ") == format) &&
                (!favoritesOnly || entry.id in favorites)
        }
        val exact = filtered.filter { (_, index) -> index.contains(needle) }
        val matches = if (exact.isEmpty() && needle.length >= 4 && section == Section.CODES) {
            val queryWords = needle.split(' ').filter(String::isNotBlank)
            filtered.filter { (entry, _) ->
                val words = "${entry.title} ${entry.aliases}".searchKey().split(' ')
                queryWords.all { term -> words.any { word -> word.startsWith(term) || oneEditApart(word, term) } }
            }
        } else exact
        matches.map { it.first }
    }
    val formats = remember(entries) {
        listOf("Todos") + entries.map { it.format.substringBefore(" · ") }.filter(String::isNotBlank).distinct()
    }
    val categories = remember(entries) { listOf("Todos") + entries.map(Entry::category).distinct() }
    val summary = when (section) {
        Section.CODES -> "GameShark, CodeBreaker, Action Replay e outros formatos."
        Section.TIPS -> "Atalhos e detalhes que ajudam durante a aventura."
        else -> "Rota principal e pós-jogo em etapas."
    }
    val brand = LocalBrand.current
    LazyColumn(
        modifier = Modifier.widthIn(max = 760.dp).fillMaxSize(),
        contentPadding = PaddingValues(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item { SectionHeader(section, edition, summary) }
        if (section == Section.CODES) item {
            Surface(color = if (brand.dark) Color(0xFF322A1D) else Color(0xFFFFF6D7),
                contentColor = brand.text, border = BorderStroke(1.dp, brand.yellow.copy(alpha = .65f)),
                shape = RoundedCornerShape(14.dp)) {
                Column(Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                    Text("Confira a região, a revisão e o formato do código. Faça uma cópia do save antes de testar.",
                        style = MaterialTheme.typography.bodySmall)
                    TextButton(onClick = onCheatHelp) { Text("Como inserir cheats") }
                }
            }
        }
        item {
            OutlinedCard(border = BorderStroke(1.dp, brand.line), shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.outlinedCardColors(containerColor = brand.panel)) {
                Column(Modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    SearchField(query, { query = it }, "Buscar em ${section.title.lowercase()}")
                    if (section == Section.CODES) {
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            CategoryMenu("Categoria", categories, category) { category = it }
                            if (formats.size > 2) CategoryMenu("Formato", formats, format) { format = it }
                        }
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("Rare Candy", "Master Ball", "Dinheiro", "Shiny").forEach { shortcut ->
                                AssistChip(onClick = { query = shortcut }, label = { Text(shortcut) })
                            }
                            FilterChip(selected = favoritesOnly, onClick = { favoritesOnly = !favoritesOnly },
                                label = { Text("★ Favoritos") })
                        }
                    }
                }
            }
        }
        if (section == Section.CODES) item {
            Text("${results.size} resultados · Base offline", color = brand.muted,
                style = MaterialTheme.typography.labelMedium)
        }
        if (results.isEmpty()) item { Text("Nenhum resultado para essa busca.") }
        items(results, key = { it.id }) { entry ->
            EntryCard(
                entry, expanded == entry.id, edition = edition.takeIf { section == Section.CODES },
                favorite = entry.id in favorites,
                onFavorite = if (section == Section.CODES) ({ onFavorite(entry.id) }) else null,
            ) {
                expanded = if (expanded == entry.id) "" else entry.id
            }
        }
    }
}

@Composable
private fun CategoryMenu(label: String, categories: List<String>, selection: String, onSelect: (String) -> Unit) {
    var open by remember { mutableStateOf(false) }
    Box {
        OutlinedButton(onClick = { open = true }) { Text("$label · $selection ▾") }
        DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
            categories.forEach { category ->
                DropdownMenuItem(text = { Text(category) }, onClick = { onSelect(category); open = false })
            }
        }
    }
}

private fun oneEditApart(first: String, second: String): Boolean {
    if (second.length < 4 || kotlin.math.abs(first.length - second.length) > 1) return false
    val shorter = if (first.length <= second.length) first else second
    val longer = if (first.length <= second.length) second else first
    val mismatch = shorter.indices.firstOrNull { shorter[it] != longer[it] } ?: return true
    val offset = if (shorter.length == longer.length) 1 else 0
    return shorter.regionMatches(mismatch + offset, longer, mismatch + 1, shorter.length - mismatch - offset)
}

@Composable
private fun EntryCard(
    entry: Entry, expanded: Boolean, edition: Edition?, favorite: Boolean,
    onFavorite: (() -> Unit)?, onToggle: () -> Unit,
) {
    val context = LocalContext.current
    val brand = LocalBrand.current
    OutlinedCard(colors = CardDefaults.outlinedCardColors(containerColor = brand.panel),
        border = BorderStroke(1.dp, brand.line), shape = RoundedCornerShape(16.dp)) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 13.dp, vertical = 9.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(entry.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    if (edition != null) GameBadge("Pokémon ${edition.title}")
                    if (entry.category.isNotBlank()) {
                        Text(entry.category, style = MaterialTheme.typography.labelMedium, color = brand.muted)
                    }
                }
                if (onFavorite != null) {
                    SymbolButton(
                        if (favorite) "★" else "☆",
                        if (favorite) "Remover dos favoritos" else "Adicionar aos favoritos",
                        onFavorite,
                    )
                }
                if (entry.body.isNotBlank() || entry.source.isNotBlank() || entry.masterCode.isNotBlank()) {
                    SymbolButton(
                        if (expanded) "−" else "ⓘ",
                        if (expanded) "Ocultar detalhes de ${entry.title}" else "Mostrar detalhes de ${entry.title}",
                        onToggle,
                    )
                }
            }
            if (entry.code.isNotBlank()) {
                if (entry.format.isNotBlank()) Text(entry.format, style = MaterialTheme.typography.labelSmall, color = brand.muted)
                Surface(Modifier.fillMaxWidth(), color = brand.code, contentColor = brand.codeText,
                    shape = RoundedCornerShape(12.dp)) {
                    Column {
                        Row(Modifier.fillMaxWidth().padding(horizontal = 10.dp),
                            verticalAlignment = Alignment.CenterVertically) {
                            Text("${entry.code.lineSequence().count()} linha(s)", Modifier.weight(1f),
                                style = MaterialTheme.typography.labelSmall, color = Color(0xFF9FB0C8))
                            if (entry.warning.isBlank()) {
                                TextButton(onClick = { copyCode(context, entry.title, entry.code) },
                                    colors = ButtonDefaults.textButtonColors(contentColor = Color.White)) { Text("Copiar") }
                            }
                        }
                        HorizontalDivider(color = Color.White.copy(alpha = .12f))
                        Text(entry.code, Modifier.padding(11.dp), fontFamily = FontFamily.Monospace,
                            style = MaterialTheme.typography.bodyMedium)
                    }
                }
                if (entry.warning.isNotBlank()) {
                    Text(entry.warning, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
                }
            }
            AnimatedVisibility(expanded) {
                Column(Modifier.padding(bottom = 8.dp, top = 4.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (entry.body.isNotBlank()) Text(entry.body, style = MaterialTheme.typography.bodyMedium)
                    if (entry.masterCode.isNotBlank()) {
                        Text("Código mestre associado", style = MaterialTheme.typography.labelLarge)
                        Text(entry.masterCode, fontFamily = FontFamily.Monospace)
                        TextButton(onClick = { copyCode(context, entry.title, entry.masterCode) }) { Text("Copiar código mestre") }
                    }
                    if (entry.source.isNotBlank()) Text(entry.source, style = MaterialTheme.typography.bodySmall)
                    if (entry.sourceUrl.startsWith("https://")) {
                        TextButton(onClick = {
                            runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(entry.sourceUrl))) }
                                .onFailure { Toast.makeText(context, "Nenhum navegador disponível", Toast.LENGTH_SHORT).show() }
                        }) { Text("Abrir fonte") }
                    }
                }
            }
        }
    }
}

private fun copyCode(context: Context, label: String, value: String) {
    context.getSystemService(ClipboardManager::class.java).setPrimaryClip(ClipData.newPlainText(label, value))
    if (Build.VERSION.SDK_INT < 33) Toast.makeText(context, "Código copiado", Toast.LENGTH_SHORT).show()
}

