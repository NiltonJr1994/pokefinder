package com.njsoftwares.pokecodefinder

import android.app.DownloadManager
import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import androidx.core.content.FileProvider
import androidx.core.content.pm.PackageInfoCompat
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import java.io.File
import java.security.MessageDigest
import java.util.concurrent.Executors

/** Downloads stay with Android's download service across activity/process recreation.
 * Only this app's public release assets are accepted. Never install an arbitrary URI. */
class AppUpdaterModule(private val app: ReactApplicationContext) : ReactContextBaseJavaModule(app) {
    private val downloads = app.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    private val prefs = app.getSharedPreferences("apk-updater-v1", Context.MODE_PRIVATE)
    private val worker = Executors.newSingleThreadExecutor()
    private var verifiedId = -1L
    override fun getName() = "PokeFinderUpdater"
    private fun apk() = File(app.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
        ?: throw UpdateFailure("storage"), "updates/update.apk")
    private class UpdateFailure(val code: String) : Exception(code)
    private val signatureFlags get() = if (Build.VERSION.SDK_INT >= 28) PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES
    private fun installed() = app.packageManager.getPackageInfo(app.packageName, signatureFlags)
    private fun version(info: android.content.pm.PackageInfo) = PackageInfoCompat.getLongVersionCode(info)
    private fun signatures(info: android.content.pm.PackageInfo) =
        (if (Build.VERSION.SDK_INT >= 28) info.signingInfo?.apkContentsSigners else info.signatures)?.map { it.toCharsString() }?.toSet()
    private fun permitted() = Build.VERSION.SDK_INT < 26 || app.packageManager.canRequestPackageInstalls()
    @ReactMethod fun canInstall(promise: Promise) { promise.resolve(permitted()) }
    private fun clean() {
        val id = prefs.getLong("id", -1)
        if (id >= 0) downloads.remove(id)
        apk().delete()
        prefs.edit().clear().commit()
        verifiedId = -1
    }
    private fun state(name: String, received: Long = 0, total: Long = 0, error: String = "") =
        Arguments.createMap().apply {
            putString("state", name); putDouble("received", received.toDouble()); putDouble("total", total.toDouble())
            putString("tag", prefs.getString("tag", "")); putString("error", error)
        }
    private fun run(promise: Promise, task: () -> Any?) { worker.execute {
        try { promise.resolve(task()) } catch (e: Exception) {
            promise.reject(if (e is UpdateFailure) e.code else "download", "Update operation failed")
        }
    } }
    @ReactMethod fun start(url: String, tag: String, revision: Double, digest: String, size: Double, title: String, promise: Promise) = run(promise) {
        val pattern = Regex("^https://github\\.com/NiltonJr1994/pokefinder/releases/download/v?(0|[1-9][0-9]{0,8})\\.(0|[1-9][0-9]{0,8})\\.(0|[1-9][0-9]{0,8})/PokeFinder-([0-9]+\\.[0-9]+\\.[0-9]+)-Android(?:-b([0-9]{1,9}))?\\.apk$")
        val match = pattern.matchEntire(url) ?: throw UpdateFailure("invalid")
        val urlTag = match.groupValues.slice(1..3).joinToString(".")
        val urlRevision = match.groupValues[5].toLongOrNull() ?: 0
        if (tag != urlTag || match.groupValues[4] != tag || revision.toLong() != urlRevision ||
            !revision.isFinite() || revision < 0 || (digest.isNotEmpty() && !Regex("^[a-fA-F0-9]{64}$").matches(digest)) ||
            !size.isFinite() || size < 0 || size > 512L * 1024 * 1024) throw UpdateFailure("invalid")
        if (prefs.getLong("id", -1) >= 0 && prefs.getString("url", "") == url) return@run true
        clean()
        val file = apk(); file.parentFile?.mkdirs()
        val request = DownloadManager.Request(Uri.parse(url)).setTitle(title.take(100))
            .setMimeType("application/vnd.android.package-archive")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setAllowedOverMetered(true).setAllowedOverRoaming(false).setDestinationUri(Uri.fromFile(file))
        val id = downloads.enqueue(request)
        prefs.edit().putLong("id", id).putString("url", url).putString("tag", tag).putLong("revision", urlRevision)
            .putString("digest", digest.lowercase()).putLong("size", size.toLong()).putLong("base", version(installed())).commit()
        true
    }
    private fun verify() {
        val file = apk()
        if (!file.isFile || file.length() == 0L || file.length() > 512L * 1024 * 1024) throw UpdateFailure("missing")
        val size = prefs.getLong("size", 0)
        if (size > 0 && file.length() != size) throw UpdateFailure("invalid")
        val digest = prefs.getString("digest", "")!!
        if (digest.isNotEmpty()) {
            val hash = MessageDigest.getInstance("SHA-256")
            file.inputStream().use { input -> val bytes = ByteArray(65536); while (true) {
                val count = input.read(bytes); if (count < 0) break; hash.update(bytes, 0, count)
            } }
            if (hash.digest().joinToString("") { "%02x".format(it) } != digest) throw UpdateFailure("invalid")
        }
        val candidate = app.packageManager.getPackageArchiveInfo(file.path, signatureFlags)
            ?: throw UpdateFailure("invalid")
        val current = installed()
        if (candidate.packageName != app.packageName) throw UpdateFailure("package")
        if (version(candidate) <= version(current) || candidate.versionName != prefs.getString("tag", "") ||
            (prefs.getLong("revision", 0) > 0 && version(candidate) != prefs.getLong("revision", 0))) throw UpdateFailure("version")
        val actual = signatures(candidate)
        val trusted = signatures(current)
        if (actual.isNullOrEmpty() || actual != trusted) throw UpdateFailure("signature")
    }
    @ReactMethod fun getStatus(promise: Promise) = run(promise) {
        if (prefs.getBoolean("installRequested", false) && version(installed()) > prefs.getLong("base", Long.MAX_VALUE)) {
            val tag = installed().versionName ?: ""
            clean(); prefs.edit().putString("updated", tag).commit()
        }
        if (prefs.contains("updated")) return@run state("updated").apply { putString("tag", prefs.getString("updated", "")) }
        val id = prefs.getLong("id", -1)
        if (id < 0) return@run state("idle")
        downloads.query(DownloadManager.Query().setFilterById(id)).use { cursor ->
            if (!cursor.moveToFirst()) return@run state("error", error = "missing")
            val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
            val received = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR))
            val total = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)).coerceAtLeast(0)
            when (status) {
                DownloadManager.STATUS_SUCCESSFUL -> {
                    try {
                        if (verifiedId != id) { verify(); verifiedId = id }
                        state("ready", received, total)
                    } catch (e: Exception) { state("error", received, total, if (e is UpdateFailure) e.code else "invalid") }
                }
                DownloadManager.STATUS_FAILED -> {
                    val reason = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON))
                    state("error", received, total, if (reason == DownloadManager.ERROR_INSUFFICIENT_SPACE) "storage" else "download")
                }
                DownloadManager.STATUS_PAUSED -> state("paused", received, total)
                else -> state("downloading", received, total)
            }
        }
    }
    @ReactMethod fun cancel(promise: Promise) = run(promise) { clean(); true }
    @ReactMethod fun install(promise: Promise) { worker.execute {
      try {
        verify() // Recheck immediately before granting the installer read access.
        val activity = app.currentActivity ?: throw UpdateFailure("installer")
        if (!permitted()) {
            activity.runOnUiThread {
                try {
                    activity.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + app.packageName)))
                    promise.resolve("permission")
                } catch (e: Exception) { promise.reject("permission", "Installation permission unavailable") }
            }
        } else {
            val uri = FileProvider.getUriForFile(app, app.packageName + ".updates", apk())
            val intent = Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            intent.clipData = ClipData.newRawUri("PokeFinder update", uri)
            activity.runOnUiThread {
                try {
                    activity.startActivity(intent)
                    prefs.edit().putBoolean("installRequested", true).commit()
                    promise.resolve("installer")
                } catch (e: Exception) { promise.reject("installer", "Installer unavailable") }
            }
        }
      } catch (e: Exception) { promise.reject(if (e is UpdateFailure) e.code else "installer", "Cannot install update") }
    } }
}

class AppUpdaterPackage : ReactPackage {
    override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(AppUpdaterModule(context))
    override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
