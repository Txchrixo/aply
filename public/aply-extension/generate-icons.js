const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const sizes = [16, 48, 128];
const outDir = path.join(__dirname, "icons");

function svg(size) {
  const r = Math.round(size * 0.22);
  const font = Math.round(size * 0.52);
  const y = Math.round(size * 0.68);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#C65D00"/>
  <text x="50%" y="${y}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="${font}" fill="#FFE4B5">A</text>
</svg>`
  );
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  for (const size of sizes) {
    const file = path.join(outDir, `icon-${size}.png`);
    await sharp(svg(size)).png().toFile(file);
    console.log("wrote", file, fs.statSync(file).size);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
