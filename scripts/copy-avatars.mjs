#!/usr/bin/env node
// scripts/copy-avatars.mjs
// One-off: copia los PNG de /Avatars al /public/avatars
// para que estén servidos desde el dominio de la app.

import { mkdirSync, copyFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname ?? new URL(".", import.meta.url).pathname, "..");
const candidates = [
  join(projectRoot, "..", "IdiomaConnect", "Avatars"),
  join(projectRoot, "Avatars"),
];
const dst = join(projectRoot, "public", "avatars");

let src = null;
for (const c of candidates) {
  if (existsSync(c)) { src = c; break; }
}
if (!src) {
  console.error("✖ No encontré la carpeta /Avatars. Mira candidatos:", candidates);
  process.exit(1);
}

mkdirSync(dst, { recursive: true });
const files = readdirSync(src).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
for (const f of files) {
  const target = join(dst, f.toLowerCase());
  copyFileSync(join(src, f), target);
  console.log(`✔ ${f} → public/avatars/${f.toLowerCase()}`);
}
console.log(`\nListo. ${files.length} avatares copiados.`);
