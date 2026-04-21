/**
 * Rebuilds public/branding/fta-full-logo.png from fta-full-logo-source.jpg.
 * Export from design tools often arrives as JPEG with #000 background; we make
 * exact black transparent so near-black letterforms (1,1,1 etc.) stay visible.
 */
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const INPUT = path.join(root, "public/branding/fta-full-logo-source.jpg");
const OUT = path.join(root, "public/branding/fta-full-logo.png");

async function main() {
  const { data, info } = await sharp(INPUT).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i + 3] = r === 0 && g === 0 && b === 0 ? 0 : 255;
  }
  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(OUT);
  console.log("Wrote", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
