import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PNG } from "pngjs";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDirectory = path.join(projectRoot, "public");
const officialLogo = path.join(
  projectRoot,
  "assets",
  "branding",
  "onepercent_logo.png",
);

const logoSize = 512;
const faviconSize = 64;
const ogWidth = 1200;
const ogHeight = 630;
function validateOfficialLogo(logo) {
  if (logo.width !== logoSize || logo.height !== logoSize) {
    throw new Error(
      "assets/branding/onepercent_logo.png must be the official 512 × 512 PNG.",
    );
  }
}

function makeFavicon(logo) {
  const favicon = new PNG({ width: faviconSize, height: faviconSize });
  const scale = logoSize / faviconSize;

  for (let y = 0; y < faviconSize; y += 1) {
    for (let x = 0; x < faviconSize; x += 1) {
      const totals = [0, 0, 0, 0];
      for (let sourceY = y * scale; sourceY < (y + 1) * scale; sourceY += 1) {
        for (let sourceX = x * scale; sourceX < (x + 1) * scale; sourceX += 1) {
          const sourceOffset = (sourceY * logoSize + sourceX) * 4;
          for (let channel = 0; channel < 4; channel += 1) {
            totals[channel] += logo.data[sourceOffset + channel];
          }
        }
      }

      const targetOffset = (y * faviconSize + x) * 4;
      for (let channel = 0; channel < 4; channel += 1) {
        favicon.data[targetOffset + channel] = Math.round(
          totals[channel] / (scale * scale),
        );
      }
    }
  }

  return PNG.sync.write(favicon);
}

function makeOpenGraphImage(logo) {
  const image = new PNG({ width: ogWidth, height: ogHeight });
  const left = Math.floor((ogWidth - logo.width) / 2);
  const top = Math.floor((ogHeight - logo.height) / 2);

  for (let offset = 0; offset < image.data.length; offset += 4) {
    image.data[offset] = 0;
    image.data[offset + 1] = 0;
    image.data[offset + 2] = 0;
    image.data[offset + 3] = 255;
  }

  for (let y = 0; y < logo.height; y += 1) {
    const sourceStart = y * logo.width * 4;
    const targetStart = ((top + y) * ogWidth + left) * 4;
    logo.data.copy(
      image.data,
      targetStart,
      sourceStart,
      sourceStart + logo.width * 4,
    );
  }

  return PNG.sync.write(image);
}

async function generateBrandAssets() {
  const officialLogoData = await readFile(officialLogo);
  const logo = PNG.sync.read(officialLogoData);
  validateOfficialLogo(logo);
  await mkdir(publicDirectory, { recursive: true });

  await Promise.all([
    // Keep the website mark byte-identical to the user-provided source.
    copyFile(officialLogo, path.join(publicDirectory, "onepercent-logo.png")),
    writeFile(path.join(publicDirectory, "favicon.png"), makeFavicon(logo)),
    writeFile(path.join(publicDirectory, "og.png"), makeOpenGraphImage(logo)),
  ]);
}

await generateBrandAssets();
