package app.pokecode.finder

import android.content.SharedPreferences
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

internal const val RELEASES_PAGE = "https://github.com/NiltonJr1994/pokefinder/releases"
private const val LATEST_RELEASE_API = "https://api.github.com/repos/NiltonJr1994/pokefinder/releases/latest"
private const val SUCCESS_INTERVAL = 12 * 60 * 60 * 1000L
private const val RETRY_INTERVAL = 30 * 60 * 1000L

internal data class StableVersion(val major: Int, val minor: Int, val patch: Int) : Comparable<StableVersion> {
    override fun compareTo(other: StableVersion) = compareValuesBy(this, other, { it.major }, { it.minor }, { it.patch })

    companion object {
        private val pattern = Regex("v?(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)")
        fun parse(tag: String): StableVersion? {
            val values = pattern.matchEntire(tag)?.groupValues?.drop(1)?.map { it.toIntOrNull() } ?: return null
            return StableVersion(values[0] ?: return null, values[1] ?: return null, values[2] ?: return null)
        }
    }
}

private sealed interface ReleaseReply {
    data class Published(val tag: String, val version: StableVersion) : ReleaseReply
    data object Unlisted : ReleaseReply
    data class Failure(val message: String) : ReleaseReply
}

private fun fetchLatestRelease(): ReleaseReply {
    val connection = URL(LATEST_RELEASE_API).openConnection() as HttpURLConnection
    return try {
        connection.connectTimeout = 6500
        connection.readTimeout = 6500
        connection.instanceFollowRedirects = false
        connection.setRequestProperty("Accept", "application/vnd.github+json")
        connection.setRequestProperty("User-Agent", "PokeFinder-Android/${BuildConfig.VERSION_NAME}")
        when (connection.responseCode) {
            200 -> {
                val payload = connection.inputStream.bufferedReader().use { JSONObject(it.readText()) }
                val tag = payload.optString("tag_name")
                val version = StableVersion.parse(tag)
                if (version == null || payload.optBoolean("draft") || payload.optBoolean("prerelease")) {
                    ReleaseReply.Failure("A release pública precisa ter uma tag de versão estável, como v3.4.1.")
                } else {
                    ReleaseReply.Published(tag, version)
                }
            }
            404 -> ReleaseReply.Unlisted
            403, 429 -> ReleaseReply.Failure("O GitHub limitou a consulta. Tente novamente mais tarde.")
            else -> ReleaseReply.Failure("O GitHub não respondeu como esperado. Tente novamente mais tarde.")
        }
    } catch (_: IOException) {
        ReleaseReply.Failure("Não foi possível conectar ao GitHub. Confira a conexão e tente novamente.")
    } catch (_: JSONException) {
        ReleaseReply.Failure("A resposta do GitHub não pôde ser interpretada.")
    } finally {
        connection.disconnect()
    }
}

internal class ReleaseCheck(private val preferences: SharedPreferences) {
    private val installed = checkNotNull(StableVersion.parse(BuildConfig.VERSION_NAME.removeSuffix("-debug")))
    private val nextKey = "releaseNextCheck/${BuildConfig.VERSION_NAME}"

    var automatic by mutableStateOf(preferences.getBoolean("releaseAutomatic", true))
        private set
    var checking by mutableStateOf(false)
        private set
    var updateTag by mutableStateOf(preferences.getString("releaseTag", null)?.takeIf { isNewer(it) })
        private set
    var message by mutableStateOf("Pronto para consultar as releases públicas do GitHub.")
        private set

    fun changeAutomatic(enabled: Boolean) {
        automatic = enabled
        val editor = preferences.edit().putBoolean("releaseAutomatic", enabled)
        if (enabled) editor.remove(nextKey)
        editor.apply()
    }

    suspend fun check(force: Boolean = false) {
        if (checking) return
        val now = System.currentTimeMillis()
        val remaining = preferences.getLong(nextKey, 0L) - now
        if (!force && (!automatic || remaining in 1L..SUCCESS_INTERVAL)) return

        checking = true
        try {
            val reply = withContext(Dispatchers.IO) { fetchLatestRelease() }
            val editor = preferences.edit()
            when (reply) {
                is ReleaseReply.Published -> {
                    updateTag = reply.tag.takeIf { reply.version > installed }
                    editor.putString("releaseTag", reply.tag)
                    message = if (updateTag != null) "Versão ${reply.tag} disponível."
                        else "Você já tem a versão estável mais recente."
                }
                ReleaseReply.Unlisted -> {
                    updateTag = null
                    editor.remove("releaseTag")
                    message = "Nenhuma release pública encontrada. O repositório também precisa estar público."
                }
                is ReleaseReply.Failure -> message = reply.message
            }
            val interval = if (reply is ReleaseReply.Failure) RETRY_INTERVAL else SUCCESS_INTERVAL
            editor.putLong(nextKey, System.currentTimeMillis() + interval).apply()
        } finally {
            checking = false
        }
    }

    private fun isNewer(tag: String) = StableVersion.parse(tag)?.let { it > installed } == true
}

@Composable
internal fun UpdateScreen(release: ReleaseCheck, onCheck: () -> Unit, onAutomatic: (Boolean) -> Unit) {
    LazyColumn(Modifier.widthIn(max = 760.dp).fillMaxSize(), contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text("Atualizações", style = MaterialTheme.typography.headlineSmall)
            Text("Versão instalada ${BuildConfig.VERSION_NAME}", style = MaterialTheme.typography.bodyMedium)
        }
        item {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Column(Modifier.weight(1f)) {
                    Text("Verificação automática", style = MaterialTheme.typography.titleMedium)
                    Text("Ao abrir o app, consulta o GitHub em intervalos de 12 horas. O catálogo funciona offline.")
                }
                Switch(checked = release.automatic, onCheckedChange = onAutomatic)
            }
        }
        item {
            Text(if (release.checking) "Consultando o GitHub…" else release.message)
            release.updateTag?.let { Text("Release disponível: $it", color = LocalBrand.current.blue) }
            Button(onClick = onCheck, enabled = !release.checking) { Text("Verificar agora") }
        }
        item {
            SourceButton(
                label = if (release.updateTag != null) "Abrir release no GitHub" else "Ver releases no GitHub",
                url = release.updateTag?.let { "$RELEASES_PAGE/tag/$it" } ?: RELEASES_PAGE,
            )
            Text("A instalação é iniciada por você a partir da release. Use um APK assinado para o mesmo pacote.")
        }
    }
}

