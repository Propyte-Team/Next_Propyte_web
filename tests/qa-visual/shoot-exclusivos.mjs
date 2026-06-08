import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'screenshots');
const URL = 'https://dev.propyte.com/es/exclusivos';

const browser = await chromium.launch();
try {
  // Desktop
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p1 = await desktop.newPage();
  await p1.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await p1.waitForTimeout(2500); // dejar correr animaciones glow
  await p1.screenshot({ path: join(OUT, 'exclusivos_desktop.png'), fullPage: true });
  console.log('desktop OK');
  await desktop.close();

  // Mobile
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  const p2 = await mobile.newPage();
  await p2.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await p2.waitForTimeout(2500);
  await p2.screenshot({ path: join(OUT, 'exclusivos_mobile.png'), fullPage: true });
  console.log('mobile OK');
  await mobile.close();
} finally {
  await browser.close();
}
