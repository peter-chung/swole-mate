import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const srcUrl = new URL("../app/icon.svg", import.meta.url);
const out16Url = new URL("../public/favicon-16x16.png", import.meta.url);
const out32Url = new URL("../public/favicon-32x32.png", import.meta.url);
const outAppleUrl = new URL("../public/apple-touch-icon.png", import.meta.url);

const src = fileURLToPath(srcUrl);
const out16 = fileURLToPath(out16Url);
const out32 = fileURLToPath(out32Url);
const outApple = fileURLToPath(outAppleUrl);

async function main() {
  const svg = await fs.readFile(src, "utf8");

  await sharp(Buffer.from(svg))
    .resize(16, 16, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out16);

  await sharp(Buffer.from(svg))
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out32);

  await sharp(Buffer.from(svg))
    .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outApple);

  console.log("Generated icons:", out16, out32, outApple);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
