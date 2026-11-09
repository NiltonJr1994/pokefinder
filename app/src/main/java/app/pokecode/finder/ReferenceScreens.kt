package app.pokecode.finder

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.res.imageResource
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import java.util.Locale

@Composable
internal fun ItemList(entries: List<FieldItem>, edition: Edition) {
    var query by rememberSaveable { mutableStateOf("") }
    var expanded by rememberSaveable { mutableStateOf("") }
    val results = remember(entries, query) {
        val needle = query.trim().searchKey()
        entries.filter { "${it.name} ${it.category} ${it.effect}".searchKey().contains(needle) }
    }
    LazyColumn(
        Modifier.widthIn(max = 760.dp).fillMaxSize(), contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item { SectionHeader(Section.ITEMS, edition, "Efeitos e usos dos itens desta edição.") }
        item { SearchField(query, { query = it }, "Buscar item") }
        if (results.isEmpty()) item { Text("Nenhum item encontrado.") }
        items(results, key = FieldItem::name) { item ->
            val isExpanded = expanded == item.name
            OutlinedCard(onClick = { expanded = if (isExpanded) "" else item.name },
                colors = CardDefaults.outlinedCardColors(containerColor = LocalBrand.current.panel),
                border = BorderStroke(1.dp, LocalBrand.current.line), shape = RoundedCornerShape(16.dp),
            ) {
                Column(Modifier.padding(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        ReferenceImage(item.sprite, Modifier.size(48.dp))
                        Column(Modifier.weight(1f)) {
                            Text(item.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text(item.category, style = MaterialTheme.typography.labelMedium, color = LocalBrand.current.muted)
                        }
                        Text(if (isExpanded) "−" else "ⓘ", color = LocalBrand.current.blue)
                    }
                    AnimatedVisibility(isExpanded) {
                        Column(Modifier.padding(top = 10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(item.effect, style = MaterialTheme.typography.bodyMedium)
                            if (item.location.isNotBlank()) {
                                Text("Onde encontrar", style = MaterialTheme.typography.labelLarge)
                                Text(item.location, style = MaterialTheme.typography.bodySmall, color = LocalBrand.current.muted)
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun Edition.machineGames(): String = Edition.entries.filter { it.machineGroup == machineGroup }
    .joinToString(" · ") { it.title }

@Composable
internal fun MachineList(
    machines: List<Machine>, edition: Edition, section: Section, onOpen: (String) -> Unit,
) {
    var query by rememberSaveable { mutableStateOf("") }
    val results = remember(machines, query) {
        val needle = query.trim().searchKey().replace(" ", "")
        machines.filter { "${it.code} ${it.move} ${it.type}".searchKey().replace(" ", "").contains(needle) }
    }
    LazyColumn(
        Modifier.widthIn(max = 760.dp).fillMaxSize(), contentPadding = PaddingValues(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item { SectionHeader(section, edition, "Toque em uma máquina para ver os Pokémon compatíveis.") }
        item { SearchField(query, { query = it }, "Buscar ${if (section == Section.HMS) "HM" else "TM"}") }
        if (results.isEmpty()) item { Text("Nenhuma máquina encontrada.") }
        items(results, key = Machine::code) { machine ->
            OutlinedCard(
                onClick = { onOpen(machine.code) },
                colors = CardDefaults.outlinedCardColors(containerColor = LocalBrand.current.panel),
                border = BorderStroke(1.dp, LocalBrand.current.line), shape = RoundedCornerShape(16.dp),
            ) {
                Row(Modifier.fillMaxWidth().padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    ReferenceImage(machine.sprite, Modifier.size(48.dp))
                    Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("${machine.code} · ${machine.move}", style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold)
                        GameBadge(edition.machineGames())
                        TypePill(machine.type)
                        Text("${machine.learners.size} compatíveis",
                            style = MaterialTheme.typography.labelMedium, color = LocalBrand.current.muted)
                    }
                    Text("›", style = MaterialTheme.typography.headlineSmall, color = LocalBrand.current.blue)
                }
            }
        }
    }
}

@Composable
internal fun MachineDetail(machine: Machine, edition: Edition, reference: ReferenceCatalog) {
    var query by rememberSaveable { mutableStateOf("") }
    val results = remember(machine, query) {
        val needle = query.trim().searchKey()
        val number = needle.removePrefix("#").toIntOrNull()
        machine.learners.filter { it.number == number || it.name.searchKey().contains(needle) }
    }
    LazyVerticalGrid(
        columns = GridCells.Adaptive(135.dp), modifier = Modifier.widthIn(max = 1024.dp).fillMaxSize(),
        contentPadding = PaddingValues(12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item(span = { GridItemSpan(maxLineSpan) }) {
            OutlinedCard(colors = CardDefaults.outlinedCardColors(containerColor = LocalBrand.current.panel),
                border = BorderStroke(1.dp, LocalBrand.current.line), shape = RoundedCornerShape(16.dp)) {
                Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        ReferenceImage(machine.sprite, Modifier.size(56.dp))
                        Column(Modifier.weight(1f)) {
                            Text("${machine.code} · ${machine.move}", style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold)
                            TypePill(machine.type)
                        }
                    }
                    GameBadge(edition.machineGames())
                    if (machine.location.isNotBlank()) {
                        Text("Onde encontrar", style = MaterialTheme.typography.labelLarge)
                        Text(machine.location, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
        item(span = { GridItemSpan(maxLineSpan) }) {
            Text("Pokémon compatíveis · ${machine.learners.size}", style = MaterialTheme.typography.titleMedium)
        }
        item(span = { GridItemSpan(maxLineSpan) }) { SearchField(query, { query = it }, "Buscar Pokémon compatível") }
        if (results.isEmpty()) item(span = { GridItemSpan(maxLineSpan) }) { Text("Nenhum Pokémon encontrado.") }
        items(results, key = { "${it.number}/${it.name}" }) { learner ->
            OutlinedCard(colors = CardDefaults.outlinedCardColors(containerColor = LocalBrand.current.panel),
                border = BorderStroke(1.dp, LocalBrand.current.line), shape = RoundedCornerShape(16.dp)) {
                Column(Modifier.fillMaxWidth().padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("#%03d".format(Locale.ROOT, learner.number), color = LocalBrand.current.blue,
                        style = MaterialTheme.typography.labelMedium)
                    ReferenceImage(reference.sprite(learner.number), Modifier.size(68.dp))
                    Text(learner.name, style = MaterialTheme.typography.titleSmall,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                }
            }
        }
    }
}

@Composable
private fun ReferenceImage(sprite: Int, modifier: Modifier) {
    if (sprite == 0) {
        Spacer(modifier)
    } else if (sprite == R.drawable.ref_hm || sprite == R.drawable.ref_item) {
        Image(painterResource(sprite), null, modifier)
    } else {
        val image = ImageBitmap.imageResource(sprite)
        Image(image, null, modifier, filterQuality = FilterQuality.None)
    }
}

