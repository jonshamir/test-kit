# 6. Styling and right-to-left

How to make the app look like yours, and how to not break Hebrew while doing it.

## Start here: one file

Open `client/styles/tokens.css`. Every colour, spacing step, radius, font and
animation speed in the app is defined there, and every component reads from it.
Change a value, and it changes everywhere, consistently.

You can re-skin the entire app without opening a single component.

There are about fifty tokens, and **you only ever write eight of them**:

```css
--color-bg: #f7f7f8;
--color-surface: #ffffff;
--color-text: #1b1c1f;
--color-text-muted: #5a5e6b;
--color-border: #e0e1e6;
--color-accent: #3b4ce2;
--color-danger: #c0362c;
--color-success: #1f7a4d;
```

Everything else in the colour section is worked out from those eight by the
browser:

```css
--color-accent-hover: color-mix(in oklab, var(--color-accent), #000 15%);
```

`color-mix()` blends two colours. `in oklab` tells the browser to blend the way
the eye sees it, so a grey stays grey instead of going muddy. The practical
effect: change `--color-accent` to one new hex code, and the buttons, links,
focus rings, switches, checkboxes and tabs all move with it - including their
hover and pressed shades.

To change the typeface, edit `--font-body` - but read the note about fallbacks
below before you do.

## The rules

These are enforced, not suggestions. `AGENTS.md` repeats them for AI assistants.

**CSS Modules, nothing else.** No Tailwind, no CSS-in-JS. Component styles live
next to the component, in `Component.module.css`.

**No hard-coded values in components.** No hex codes, no `16px`, no `0.5rem`. If
you need a value that is not in tokens.css, add it to tokens.css.

The exception is a size that belongs to exactly one component - the width of a
switch track, the size of a calendar cell. Those are not part of the design
system, so they go at the top of that component's own `.module.css`:

```css
.track {
  --track-width: 2.5rem;
  inline-size: var(--track-width);
}
```

**Logical properties, never `left` or `right`.** This is the one that breaks
Hebrew.

## Why `left` and `right` break things

The app ships in English, left to right - but it is one setting away from
Hebrew, right to left, and every component already works both ways. Write this:

```css
margin-left: 1rem; /* wrong */
```

and it looks fine until the app is switched to Hebrew, when the spacing appears
on the wrong side. Write this:

```css
margin-inline-start: 1rem; /* right */
```

and the browser puts it on the side the text starts from - left in English,
right in Hebrew. You write it once and both work.

| Instead of               | Use                             |
| ------------------------ | ------------------------------- |
| `margin-left`            | `margin-inline-start`           |
| `margin-right`           | `margin-inline-end`             |
| `padding-left` / `right` | `padding-inline-start` / `-end` |
| `left:` / `right:`       | `inset-inline-start` / `-end`   |
| `text-align: left`       | `text-align: start`             |
| `width` / `height`       | `inline-size` / `block-size`    |
| `border-left`            | `border-inline-start`           |

**One real exception: centring.** To centre something absolutely, use
`inset: 0; margin: auto` - not `inset-inline-start: 50%` with a translate. The
second one measures from the right edge in Hebrew and throws the element off the
side of the screen. This actually happened to the dialogs in this project; the
fix is in `Dialog.module.css`.

## Check your work

Open **http://localhost:3000/components**.

Every component is on that page, in all its variants, with a switch at the top
to flip the whole page between right-to-left and left-to-right. **Flip it after
any styling change.** Things that look fine in one direction and wrong in the
other are the most common visual bug here.

The top of that page is the full token reference - every colour with the value
it actually resolves to, the spacing steps, the radii, the type scale, the fonts
and the shadows. If you add a token, add it to that page too.

The bottom has plain HTML - headings, lists, tables, quotes - shown in English
and Hebrew side by side. That is the quickest way to see whether a change to
`tokens.css` looks right in both.

It also happens to be the fastest keyboard test: press Tab through the page and
make sure you can always see where you are.

Hide that page before handing the app over, by setting `VITE_SHOW_DEMOS=false`
in `.env`.

## Switching the app to Hebrew

Two places, and they must agree:

1. `client/index.html` - `<html lang="he" dir="rtl">`
2. `client/lib/config.ts` - `DIRECTION = "rtl"` and `LANG = "he"`

Then translate the strings. They are written directly in the components, in
English - including the server's error messages and the validation messages in
`shared/schemas/`. There is no translation library on purpose: one language per
app is enough for this course, and a translation framework is a lot of machinery
to carry for it.

To use the other language in just one part of a page, mark that part's root
element with its own `lang` and `dir`, e.g. `lang="he" dir="rtl"`.

## Fonts

`--font-body` lists several fonts. The first is the one you want; the rest are
fallbacks that can draw Hebrew and Arabic if it does not load.

**Keep the fallbacks.** If you swap in a font that has no Hebrew glyphs and
delete them, Hebrew text renders as boxes for anyone whose browser cannot fetch
your font - which includes some institutional networks in Israel that block
Google Fonts.

If you add a web font, put the `<link>` in `client/index.html` rather than
`@import`-ing it in CSS. An `@import` blocks the page from rendering until the
font arrives.

## About dark mode

There isn't one, on purpose - one set of colours is enough to get right.

If you want it later, you do not need to touch any component - or most of
tokens.css. Add one block at the bottom redefining the same eight colours:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1b1c1f;
    --color-surface: #2a2c33;
    --color-text: #f7f7f8;
    /* ...and the other five */
  }
}
```

The derived tokens follow on their own, because they are all mixes of those
eight - `--color-surface-hover` mixes toward `--color-text`, which is now light,
so it correctly gets _lighter_ instead of darker.

Then remove `color-scheme: light` from `:root`, and check every component on
`/components` - that last part is the real work.
