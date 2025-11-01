#!/usr/bin/env node
/**
 * Server-side PDF export for ZipSite comp cards using Puppeteer.
 */
const path = require('path');
const puppeteer = require('puppeteer');

async function render({ talent = 'elara', tier = 'free', output }) {
  const fileName = output || path.resolve(process.cwd(), `ZipSite_CompCard_${talent}_${tier}.pdf`);
  const url = `file://${path.resolve(__dirname, '../comp-card/index.html')}?talent=${talent}&tier=${tier}`;
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');
    await page.pdf({
      path: fileName,
      width: '5.5in',
      height: '8.5in',
      printBackground: true,
      pageRanges: '1',
      preferCSSPageSize: true
    });
    console.log(`PDF saved to ${fileName}`);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const [key, value] = args[i].split('=');
    if (value === undefined) continue;
    if (key === '--talent') options.talent = value;
    if (key === '--tier') options.tier = value;
    if (key === '--output') options.output = value;
  }
  render(options).catch((error) => {
    console.error('Failed to render PDF', error);
    process.exit(1);
  });
}

module.exports = render;
