// Render the original vector glyphs for the bundled PNG assets.
const fs = require('node:fs');
const path = require('node:path');
const { Resvg } = require('@resvg/resvg-js');
const glyphs = {
  water: '<path fill-rule="evenodd" d="M12 1C9 6 4 10 4 15.3a8 8 0 1 0 16 0C20 10 15 6 12 1Zm-5 14c.4 3 2.6 4.7 5 4.7 1.6 0 2.7-.5 3.7-1.5-3.3 1.6-7-.7-8.7-3.2Z"/>',
  dragon: '<path fill-rule="evenodd" d="M14 2c-1 4-3 5-6 5l-3 3-3 1 3 4 4-2 3 1 2-3c5 2 5 7 0 8-3 0-5-2-6-3l-3 2c2 3 5 5 10 4 6-1 9-7 6-12-1-3-4-5-7-5l1-4-1 1Zm-4 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/>',
  electric: '<path d="M6 2h10l3 10h-6l3 10L3 9h6L6 2Z"/>',
  fairy: '<path fill-rule="evenodd" d="m12 1 2.5 6.5L21 5l-2.5 5 4.5 2-4.5 2 2.5 5-6.5-2.5L12 23l-2.5-6.5L3 19l2.5-5L1 12l4.5-2L3 5l6.5 2.5L12 1Zm0 8-3 3 3 3 3-3-3-3Z"/>',
  ghost: '<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 0 20h9l-2-2a10 10 0 0 0-7-18ZM6 9l4 2-1 2-3-1V9Zm12 0v3l-3 1-1-2 4-2Z"/>',
  fire: '<path fill-rule="evenodd" d="M12 1c6 4 2 9 7 10 1-2 1-3 1-4 6 6 2 12-8 12C3 23 0 15 5 10c-1 4 1 6 3 5-1-5 5-7 4-14Zm.4 11c-1 4-5 5-4.6 7.4.3 2 3.6 3 5.5 1.3 2-1.7.5-4.2-.9-5.5.2 1.8-.9 2.6-1.6 2 .8-1.2 1.7-2.6 1.6-5.2Z"/>',
  ice: '<path d="m11 1 5 3v5l-5 3V1ZM2 5l5 2 3 5H4L2 5Zm20 0-2 7h-6l3-5 5-2ZM2 19l2-6h6l-3 4-5 2Zm20 0-5-2-3-4h6l2 6ZM11 13l5 3v4l-5 3V13Z"/>',
  grass: '<path fill-rule="evenodd" d="M21 2c0 7 2 16-7 19-3 1-7 0-9-2l-2 3-1-1 2-4C0 7 10 3 21 2ZM6 18l9-10-5 3V8l-1 4-4 2h3l-2 4Z"/>',
  bug: '<path d="M11 4 7 0 6 1l4 5-2 2 4 4 4-4-2-2 4-5-1-1-4 4h-2ZM7 8c-6 2-7 11 0 15 4-2 5-9 0-15Zm10 0c6 2 7 11 0 15-4-2-5-9 0-15Z"/>',
  fighting: '<path d="M2 11c0-2 2-3 4-2V5c0-2 3-3 4-1 0-3 4-3 5 0 1-2 4-1 4 2 2-1 4 1 4 3v4c0 6-4 10-10 10S2 19 2 13v-2Z"/>',
  normal: '<circle cx="12" cy="12" r="8.1" fill="none" stroke="#fff" stroke-width="4.2"/>',
  dark: '<path fill-rule="evenodd" d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22Zm0 2a9 9 0 0 1 0 18c6-4 6-14 0-18Z"/>',
  steel: '<path fill-rule="evenodd" d="M6 2h12l6 10-6 10H6L0 12 6 2Zm6 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"/>',
  rock: '<path d="M1 11 8 4l10-2-4 10-6 5-7-2v-4Zm15 2 4-10 3 10-8 7-5-2 6-5Z"/>',
  psychic: '<path fill-rule="evenodd" d="M12 1a11 11 0 1 0 9 17c-2 2-6 3-10 2-5-1-7-7-4-11 2-4 8-5 11-1 3 4-1 9-5 8-3-1-4-4-2-6 1-1 3-1 4 0 1 2-1 3-2 2 1 2 4 1 4-2 0-4-6-6-9-2-4 6 3 13 10 10 4-2 5-7 3-11-2-4-5-6-9-6Z"/>',
  ground: '<path d="M1 20 5 8h4l-3 12H1Zm6 0L11 3h6l6 17H7Z"/>',
  poison: '<path fill-rule="evenodd" d="M12 2C6 2 1 6 1 12c0 4 3 7 6 8v3h3v-2h4v2h3v-3c3-1 6-4 6-8 0-6-5-10-11-10Zm0 4c-4 0-7 2-7 6s3 6 7 6 7-2 7-6-3-6-7-6Z"/>',
  flying: '<path d="M23 2c-6 3-14 3-19 7-5 5-2 11 4 13 5 1 10-3 11-7-3 2-6 3-9 3 5-2 10-5 11-9-3 2-6 3-10 3 5-2 9-4 12-10Z"/>',
};
const output = path.join(__dirname, '../assets/type-icons');
fs.mkdirSync(output, { recursive: true });
for (const [name, glyph] of Object.entries(glyphs)) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 26 26" width="96" height="96"><g fill="white">' + glyph + '</g></svg>';
  fs.writeFileSync(path.join(output, name + '.png'), new Resvg(svg).render().asPng());
}
