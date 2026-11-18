import { Font } from "@react-pdf/renderer";

import { FONT_MONO, FONT_SANS } from "./theme";

let registered = false;

/** Words longer than this (long URLs, identifiers) may be broken so they never run off the page. */
const MAX_UNBROKEN_WORD = 32;

/**
 * Registers the bundled fonts once. The files in /public/fonts are Latin-subset Inter and JetBrains Mono,
 * so typographic quotes, dashes, arrows and box-drawing characters render instead of tofu boxes.
 */
export function registerPdfFonts() {
  if (registered) return;
  registered = true;

  const base = `${window.location.origin}/fonts`;

  Font.register({
    family: FONT_SANS,
    fonts: [
      { src: `${base}/Inter-Regular.ttf`, fontWeight: 400 },
      { src: `${base}/Inter-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
      { src: `${base}/Inter-SemiBold.ttf`, fontWeight: 600 },
      { src: `${base}/Inter-Bold.ttf`, fontWeight: 700 },
      { src: `${base}/Inter-BoldItalic.ttf`, fontWeight: 700, fontStyle: "italic" },
    ],
  });

  Font.register({
    family: FONT_MONO,
    fonts: [
      { src: `${base}/JetBrainsMono-Regular.ttf`, fontWeight: 400 },
      { src: `${base}/JetBrainsMono-Bold.ttf`, fontWeight: 700 },
    ],
  });

  // No automatic hyphenation of normal words; only chop absurdly long ones into chunks.
  Font.registerHyphenationCallback((word) => {
    if (word.length <= MAX_UNBROKEN_WORD) return [word];
    return word.match(new RegExp(`.{1,${MAX_UNBROKEN_WORD}}`, "g")) ?? [word];
  });
}
