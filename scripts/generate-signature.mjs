import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function createSignature() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 320, height: 110, deviceScaleFactor: 2 });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap');
        body {
          margin: 0;
          padding: 0;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
        .sig-container {
          position: relative;
          display: inline-block;
        }
        .signature-text {
          font-family: 'Caveat', 'Brush Script MT', cursive, sans-serif;
          font-size: 52px;
          font-weight: 700;
          color: #0f172a;
          transform: rotate(-4deg);
          letter-spacing: 1px;
          display: block;
        }
        .sig-flourish {
          position: absolute;
          bottom: 2px;
          left: 10px;
          width: 220px;
          height: 16px;
        }
      </style>
    </head>
    <body>
      <div class="sig-container">
        <span class="signature-text">Aparna R.</span>
        <svg class="sig-flourish" viewBox="0 0 220 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 5 8 Q 60 15, 120 6 Q 180 -1, 215 9" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  const outPath = path.join(projectRoot, 'src', 'assets', 'signature.png');
  await page.screenshot({ path: outPath, omitBackground: true });
  await browser.close();
  console.log(`Generated ${outPath}`);
}

createSignature();
