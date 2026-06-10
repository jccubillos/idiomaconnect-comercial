// Optimiza los íconos neón nuevos (capturas 768x1376) a PNG cuadrados 400x400
// listos para las flashcards. Recorta un cuadrado centrado verticalmente y comprime.
import sharp from "sharp";
import { readdirSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const SRC = "Ojetos seleccion multiple";
const OUT = "public/objects";
const SIZE = 400;

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const dirs = readdirSync(SRC, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^neon_.*_icon_screen$/.test(d.name));

let ok = 0;
let fail = 0;

for (const d of dirs) {
  const word = d.name.replace(/^neon_/, "").replace(/_icon_screen$/, "");
  const input = join(SRC, d.name, "screen.png");
  const output = join(OUT, `${word}.png`);
  try {
    const meta = await sharp(input).metadata();
    const side = Math.min(meta.width, meta.height);
    const left = Math.round((meta.width - side) / 2);
    const top = Math.round((meta.height - side) / 2);
    await sharp(input)
      .extract({ left, top, width: side, height: side })
      .resize(SIZE, SIZE)
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(output);
    ok++;
  } catch (e) {
    console.log("FALLÓ", word, e.message);
    fail++;
  }
}

console.log(`Listo: ${ok} optimizadas, ${fail} fallidas, en ${OUT}/`);
