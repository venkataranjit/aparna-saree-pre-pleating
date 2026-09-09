import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourceIconPath = path.join(rootDir, 'src', 'assets', 'app-icon-test.png');
const resDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');

if (!fs.existsSync(sourceIconPath)) {
  console.error('Source icon not found at:', sourceIconPath);
  process.exit(1);
}

const iconBase64 = fs.readFileSync(sourceIconPath).toString('base64');
const iconDataUrl = `data:image/png;base64,${iconBase64}`;

const densities = [
  { name: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
  { name: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
  { name: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
  { name: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
  { name: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 },
];

async function generateIcons() {
  console.log('Launching browser to render icons...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const d of densities) {
    const targetDir = path.join(resDir, d.name);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 1. Generate ic_launcher.png (square / full icon)
    await page.setViewport({ width: d.iconSize, height: d.iconSize });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body, html { width: ${d.iconSize}px; height: ${d.iconSize}px; overflow: hidden; background: transparent; }
            img { width: 100%; height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${iconDataUrl}" />
        </body>
      </html>
    `);
    await page.screenshot({
      path: path.join(targetDir, 'ic_launcher.png'),
      omitBackground: true
    });

    // 2. Generate ic_launcher_round.png (round circular icon)
    await page.setViewport({ width: d.iconSize, height: d.iconSize });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body, html { width: ${d.iconSize}px; height: ${d.iconSize}px; overflow: hidden; background: transparent; }
            .circle-wrap { width: ${d.iconSize}px; height: ${d.iconSize}px; border-radius: 50%; overflow: hidden; }
            img { width: 100%; height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>
          <div class="circle-wrap">
            <img src="${iconDataUrl}" />
          </div>
        </body>
      </html>
    `);
    await page.screenshot({
      path: path.join(targetDir, 'ic_launcher_round.png'),
      omitBackground: true
    });

    // 3. Generate ic_launcher_foreground.png (adaptive foreground layer: safe zone ~66%)
    const innerSize = Math.round(d.fgSize * 0.72);
    await page.setViewport({ width: d.fgSize, height: d.fgSize });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body, html {
              width: ${d.fgSize}px;
              height: ${d.fgSize}px;
              overflow: hidden;
              background: transparent;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            img {
              width: ${innerSize}px;
              height: ${innerSize}px;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${iconDataUrl}" />
        </body>
      </html>
    `);
    await page.screenshot({
      path: path.join(targetDir, 'ic_launcher_foreground.png'),
      omitBackground: true
    });

    console.log(`Generated icons for ${d.name} (${d.iconSize}x${d.iconSize}, fg: ${d.fgSize}x${d.fgSize})`);
  }

  await browser.close();

  // Also update src/assets/app-icon.png
  const appIconDest = path.join(rootDir, 'src', 'assets', 'app-icon.png');
  fs.copyFileSync(sourceIconPath, appIconDest);
  console.log(`Updated ${appIconDest} with app-icon-test.png`);
  console.log('All Android launcher icons generated successfully from app-icon-test.png!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
