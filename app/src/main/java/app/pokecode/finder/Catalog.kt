package app.pokecode.finder

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

enum class Edition(val title: String, val version: String, val machineGroup: Int, val region: String? = null) {
    YELLOW("Yellow", "yellow", 2, "kanto"),
    RED("Red", "red", 1, "kanto"),
    BLUE("Blue", "blue", 1, "kanto"),
    GOLD("Gold", "gold", 3, "johto"),
    SILVER("Silver", "silver", 3, "johto"),
    CRYSTAL("Crystal", "crystal", 4),
    FIRE_RED("FireRed", "firered", 7),
    LEAF_GREEN("LeafGreen", "leafgreen", 7),
    EMERALD("Emerald", "emerald", 6),
    HEART_GOLD("HeartGold", "heartgold", 10),
    SOUL_SILVER("SoulSilver", "soulsilver", 10),
    ;

    val kanto get() = region == "kanto"
}

enum class Section(val title: String) {
    CODES("Códigos"), ITEMS("Itens"), TMS("TMs"), HMS("HMs"),
    TIPS("Dicas"), GUIDES("Detonados"), DEX("Pokédex"),
    HELP("Como usar"), CHEAT_HELP("Como inserir cheats"), UPDATES("Atualizações"), CREDITS("Créditos");

    val global get() = this == HELP || this == CHEAT_HELP || this == UPDATES || this == CREDITS

    val editions: List<Edition>
        get() = when (this) {
            CODES -> Edition.entries.filter { it.machineGroup != 3 }
            ITEMS, TMS, HMS -> Edition.entries
            TIPS -> Edition.entries
            GUIDES -> Edition.entries.filter { it.region != null }
            DEX -> Edition.entries.filter { it.region != null || it == Edition.CRYSTAL }
            HELP, CHEAT_HELP, UPDATES, CREDITS -> emptyList()
        }
}

data class FieldItem(val name: String, val effect: String, val category: String, val location: String, val sprite: Int)
data class Learner(val number: Int, val name: String)
data class Machine(
    val code: String, val move: String, val type: String, val location: String,
    val sprite: Int, val learners: List<Learner>,
) {
    val isHm get() = code.startsWith("HM")
}

class ReferenceCatalog(context: Context) {
    private val root = context.assets.open("reference.json").bufferedReader().use { JSONObject(it.readText()) }
    private val artIds = mutableMapOf<String, Int>()
    private fun art(context: Context, name: String): Int = artIds.getOrPut(name) {
        context.resources.getIdentifier(name, "drawable", context.packageName)
    }

    private val items = parseGroups("items") { row ->
        FieldItem(row.getString("name"), row.getString("effect"), row.getString("category"),
            row.getString("location"), art(context, row.getString("art")))
    }
    private val machines = parseGroups("machines") { row ->
        val learners = row.getJSONArray("learners")
        Machine(row.getString("code"), row.getString("move"), row.getString("type"),
            row.getString("location"), art(context, row.getString("art")), List(learners.length()) { index ->
                val learner = learners.getJSONArray(index)
                Learner(learner.getInt(0), learner.getString(1))
            })
    }
    private val pokemonSprites = (1..493).associateWith { number ->
        art(context, "pk_%03d".format(Locale.ROOT, number))
    }

    private fun <T> parseGroups(key: String, parse: (JSONObject) -> T): Map<Int, List<T>> {
        val groups = root.getJSONObject(key)
        return groups.keys().asSequence().associate { it.toInt() to groups.getJSONArray(it).objects().map(parse) }
    }

    fun items(edition: Edition) = items[edition.machineGroup].orEmpty()
    fun machines(edition: Edition, hm: Boolean) = machines[edition.machineGroup].orEmpty().filter { it.isHm == hm }
    fun machine(edition: Edition, code: String) = machines[edition.machineGroup].orEmpty().firstOrNull { it.code == code }
    fun sprite(number: Int) = pokemonSprites[number] ?: 0
}

data class Entry(
    val id: String,
    val title: String,
    val body: String,
    val category: String,
    val code: String,
    val format: String = "",
    val aliases: String = "",
    val masterCode: String = "",
    val source: String = "",
    val sourceUrl: String = "",
    val warning: String = "",
)

data class Pokemon(
    val id: Int,
    val name: String,
    val height: Double,
    val weight: Double,
    val types: List<String>,
    val kantoTypes: List<String>,
    val stats: List<Int>,
    val kantoStats: List<Int>,
    val family: List<Int>,
    val locations: Map<String, List<String>>,
    val yellowObtaining: String,
    val sprite: Int,
) {
    val number get() = "#%03d".format(Locale.ROOT, id)
}

class Catalog(context: Context) {
    val reference = ReferenceCatalog(context)
    private val root = context.assets.open("catalog.json").bufferedReader().use { JSONObject(it.readText()) }
    private val legacyByGame = context.assets.open("legacy_codes.json").bufferedReader().use {
        JSONArray(it.readText()).objects().flatMap { row ->
            val format = listOf("codeType", "region", "version").map(row::optString)
                .filter(String::isNotBlank).joinToString(" · ")
            val entry = Entry(
                id = row.getString("id"),
                title = row.getString("name"),
                body = listOf("itemEffect", "activation", "notes").map(row::optString)
                    .filter(String::isNotBlank).joinToString("\n\n"),
                category = row.getString("category"),
                code = row.getJSONArray("codes").strings().joinToString("\n"),
                format = format,
                aliases = row.getJSONArray("aliases").strings().joinToString(" "),
                masterCode = row.getJSONArray("masterCodes").strings().joinToString("\n"),
                source = row.optString("source"),
                sourceUrl = row.optString("sourceUrl"),
                warning = row.optString("catalogNotice"),
            )
            row.getJSONArray("games").strings().map { game -> game to entry }
        }.groupBy({ it.first }, { it.second })
    }

    val pokemon = root.getJSONArray("dex").objects().map { row ->
        val id = row.getInt("id")
        val locations = row.getJSONObject("locations")
        Pokemon(
            id, row.getString("name"), row.getDouble("height"), row.getDouble("weight"),
            row.getJSONArray("types").strings(), row.getJSONArray("kantoTypes").strings(),
            row.getJSONArray("stats").ints(), row.getJSONArray("kantoStats").ints(),
            row.getJSONArray("family").ints(),
            locations.keys().asSequence().associateWith { locations.getJSONArray(it).strings() },
            row.optString("yellowObtaining"),
            reference.sprite(id),
        )
    }
    val byId = pokemon.associateBy(Pokemon::id)
    val codeSources = legacyByGame.values.flatten().map { CreditSource(it.source, it.sourceUrl) }
        .filter { it.title.isNotBlank() }.distinct().sortedBy(CreditSource::title)

    fun pokemonFor(edition: Edition): List<Pokemon> =
        if (edition !in Section.DEX.editions) emptyList()
        else if (edition.kanto) pokemon.filter { it.id <= 151 }
        else pokemon

    fun entries(section: Section, edition: Edition): List<Entry> {
        if (section !in listOf(Section.CODES, Section.TIPS, Section.GUIDES)) return emptyList()
        val group = root.getJSONObject(section.name.lowercase(Locale.ROOT))
        val keys = when (section) {
            Section.CODES -> listOf(edition.version)
            Section.TIPS -> {
                val shared = when (edition.machineGroup) {
                    4 -> "johto"
                    7 -> "firered-leafgreen"
                    10 -> "heartgold-soulsilver"
                    else -> edition.region
                }
                listOfNotNull("all", shared, edition.version)
            }
            else -> listOfNotNull("all", edition.region, edition.version)
        }
        val bundled = keys.flatMap { key ->
            group.optJSONArray(key)?.objects().orEmpty().map { row ->
                val title = row.getString("title")
                val code = row.optString("code")
                Entry("${section.name}/$key/$title", title, row.getString("body"),
                    row.getString("category"), code, format = if (code.isNotBlank()) "GameShark · USA" else "")
            }
        }
        return if (section == Section.CODES) legacyByGame["Pokémon ${edition.title}"].orEmpty() + bundled else bundled
    }
}

private fun JSONArray.objects() = List(length(), ::getJSONObject)
private fun JSONArray.strings() = List(length(), ::getString)
private fun JSONArray.ints() = List(length(), ::getInt)
