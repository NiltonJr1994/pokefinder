package app.pokecode.finder

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.ImageDecoder
import android.graphics.drawable.AnimatedImageDrawable
import android.widget.ImageView
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import java.io.IOException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Composable
internal fun AnimatedPokemonSprite(
    number: Int, edition: Edition, modifier: Modifier, fallback: @Composable (Modifier) -> Unit,
) {
    val assets = LocalContext.current.assets
    val animationEnabled = ValueAnimator.areAnimatorsEnabled()
    val group = if (edition == Edition.CRYSTAL) "crystal" else "showdown"
    val path = "dex-gifs/$group/$number.gif"
    val sprite by produceState<AnimatedImageDrawable?>(null, path, animationEnabled, assets) {
        value = if (animationEnabled) withContext(Dispatchers.IO) {
            try {
                (ImageDecoder.decodeDrawable(ImageDecoder.createSource(assets, path)) as? AnimatedImageDrawable)
                    ?.apply { repeatCount = AnimatedImageDrawable.REPEAT_INFINITE }
            } catch (_: IOException) {
                null
            }
        } else null
    }
    val animation = sprite
    if (animation == null) {
        fallback(modifier)
    } else {
        AndroidView(
            factory = ::SpriteView,
            modifier = modifier,
            onReset = null,
            onRelease = { it.show(null) },
            update = { it.show(animation) },
        )
    }
}

private class SpriteView(context: Context) : ImageView(context) {
    init {
        scaleType = ScaleType.FIT_CENTER
        importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
    }

    fun show(sprite: AnimatedImageDrawable?) {
        if (drawable === sprite) return
        (drawable as? AnimatedImageDrawable)?.stop()
        setImageDrawable(sprite)
        if (isAttachedToWindow && isShown && windowVisibility == VISIBLE) sprite?.start()
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (isShown && windowVisibility == VISIBLE) (drawable as? AnimatedImageDrawable)?.start()
    }

    override fun onVisibilityAggregated(isVisible: Boolean) {
        super.onVisibilityAggregated(isVisible)
        val animation = drawable as? AnimatedImageDrawable ?: return
        if (isVisible && isAttachedToWindow) animation.start() else animation.stop()
    }

    override fun onDetachedFromWindow() {
        (drawable as? AnimatedImageDrawable)?.stop()
        super.onDetachedFromWindow()
    }
}
