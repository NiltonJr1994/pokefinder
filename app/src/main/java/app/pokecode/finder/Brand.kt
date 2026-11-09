package app.pokecode.finder

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

internal data class BrandColors(
    val dark: Boolean, val page: Color, val panel: Color, val text: Color, val muted: Color,
    val line: Color, val blue: Color, val red: Color, val yellow: Color, val code: Color,
    val codeText: Color, val heroStart: Color, val heroEnd: Color,
)

internal val LocalBrand = staticCompositionLocalOf {
    BrandColors(false, Color(0xFFF4F6FB), Color.White, Color(0xFF182033), Color(0xFF65708A),
        Color(0xFFDFE5EF), Color(0xFF244B91), Color(0xFFE53B3F), Color(0xFFFFD84B),
        Color(0xFF111827), Color(0xFFEFF6FF), Color(0xFFF8FAFC), Color(0xFFFFF5F5))
}

@Composable
internal fun FinderTheme(dark: Boolean, content: @Composable () -> Unit) {
    val light = LocalBrand.current
    val brand = if (!dark) light else BrandColors(
        true, Color(0xFF0D1320), Color(0xFF151E2F), Color(0xFFEEF4FF), Color(0xFF9BA9C2),
        Color(0xFF2A3850), Color(0xFF6FA0FF), Color(0xFFFF5A5F), Color(0xFFFFE06A),
        Color(0xFF080D15), Color(0xFFE6F0FF), Color(0xFF111A2A), Color(0xFF24151A),
    )
    val base = if (dark) darkColorScheme() else lightColorScheme()
    val palette = base.copy(
        primary = brand.blue, onPrimary = if (dark) brand.page else Color.White,
        primaryContainer = brand.blue.copy(alpha = if (dark) .23f else .09f), onPrimaryContainer = brand.text,
        secondary = brand.red, secondaryContainer = brand.blue.copy(alpha = .15f), onSecondaryContainer = brand.text,
        background = brand.page, onBackground = brand.text,
        surface = brand.panel, onSurface = brand.text, onSurfaceVariant = brand.muted,
        surfaceContainerLow = brand.panel, surfaceContainer = brand.panel,
        surfaceContainerHigh = brand.page, surfaceContainerHighest = brand.page,
        outline = brand.muted, outlineVariant = brand.line,
    )
    CompositionLocalProvider(LocalBrand provides brand) {
        MaterialTheme(colorScheme = palette, content = content)
    }
}

@Composable
internal fun BrandHeader(onMenu: () -> Unit, onTheme: () -> Unit, updateTag: String?, onUpdates: () -> Unit) {
    val brand = LocalBrand.current
    Column(
        Modifier.fillMaxWidth()
            .background(Brush.horizontalGradient(listOf(brand.heroStart, brand.panel, brand.heroEnd)))
            .statusBarsPadding().windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Horizontal)),
    ) {
        Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
            Column(Modifier.widthIn(max = 760.dp).fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    SymbolButton("☰", "Abrir menu", onMenu)
                    BrandWordmark(Modifier.weight(1f).heightIn(min = 56.dp))
                }
                Row(
                    Modifier.fillMaxWidth().padding(start = 8.dp, end = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Column(Modifier.weight(1f)) {
                        Text("Guia offline para jogos Pokémon", color = brand.muted,
                            style = MaterialTheme.typography.bodySmall)
                        Text("N. J. Softwares", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelMedium)
                    }
                    OutlinedButton(onClick = onTheme, shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, brand.line)) { Text("Alternar tema") }
                }
                if (updateTag != null) {
                    TextButton(onClick = onUpdates) { Text("Atualização disponível · $updateTag") }
                }
            }
        }
        HorizontalDivider(color = brand.line)
    }
}

@Composable
internal fun BrandWordmark(modifier: Modifier = Modifier) {
    val brand = LocalBrand.current
    Box(modifier, contentAlignment = Alignment.Center) {
        Surface(color = Color(0xFF244B91), contentColor = brand.yellow, shape = RoundedCornerShape(12.dp)) {
            Text("PokeFinder", Modifier.padding(horizontal = 15.dp, vertical = 4.dp),
                fontSize = 30.sp, fontWeight = FontWeight.Black, maxLines = 1)
        }
    }
}

@Composable
internal fun GameBadge(text: String, modifier: Modifier = Modifier) {
    val brand = LocalBrand.current
    Surface(
        modifier = modifier, color = brand.page, contentColor = brand.blue,
        border = androidx.compose.foundation.BorderStroke(1.dp, brand.line), shape = RoundedCornerShape(50),
    ) {
        Text(text, Modifier.padding(horizontal = 9.dp, vertical = 4.dp), style = MaterialTheme.typography.labelMedium)
    }
}
