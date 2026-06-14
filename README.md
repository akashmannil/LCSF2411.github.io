# ArcBlade Works

Marketing site for a (fictional) precision power-tool brand. Static, vanilla
HTML/CSS/JS — no build step, deployable as-is to GitHub Pages.

## Design system

Cinematic **dark + bronze**. Editorial serif display (**Fraunces**) paired with a
clean sans (**Manrope**), scroll-driven motion throughout.

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#0E0E10` | page background |
| `--panel` | `#16161A` | cards / surfaces |
| `--accent` | `#C8893D` | bronze accent |
| `--ink` | `#F4F1EA` | text |

All tokens, type scale and shared components live in **`css/styles.css`**.

## Structure

```
index.html        Cinematic hero — the saw blade is the "model", rotates on scroll
showcase.html     Flagship full-page, scroll-driven product showcase (pinned stages)
specials.html     Offer cards with ribbons + featured flagship
about / team / training / media / faqs / contact   Content pages
template.html     Blank page scaffold using the shared header/footer
css/              styles.css (global) + home.css, showcase.css + one file per page
scripts/script.js Reveal-on-scroll, parallax, blade rotation, showcase controller
```

## How it works

- **Scroll reveal** — `scripts/script.js` adds `.reveal` to content via
  `IntersectionObserver`; elements fade/rise in as they enter the viewport.
- **Parallax** — any element with `data-parallax="0.16"` is translated in a single
  rAF scroll loop. Banner images and the hero use this.
- **The blade model** — an inline SVG saw blade. `data-blade` elements rotate with
  page scroll; the showcase rotates each panel's blade by its own scroll progress.
- **Showcase** — each `.product-panel` is a tall section with a `position: sticky`
  stage. As you scroll, the model fades/scales in then out, copy parallaxes, and the
  background colour blends toward the next product's `data-bg`. Special products get
  offer badges/ribbons; the flagship gets the strongest treatment.
- **Accessibility** — honours `prefers-reduced-motion` (motion disabled, content
  shown); glass nav collapses to an off-canvas drawer under 920px.

## Performance notes / TODO

The largest assets are **not** optimised and should be before a real launch:

- `media/product_video.mp4` — **~98 MB**. Now uses `preload="none"` + a poster so it
  only downloads on play, but it should be compressed (or hosted on YouTube/Vimeo).
- `images/training-main-banner.png` — ~1.6 MB; re-export as WebP/AVIF.
- `images/welcome_image.avif` — ~860 KB and currently unreferenced; remove or reuse.

Fonts are loaded with `preconnect` + `display=swap` and only the needed weights.
