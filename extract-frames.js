const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const VIDEO_PATH = path.resolve(__dirname, 'public/mintsyrup.mov');
const OUTPUT_DIR = path.resolve(__dirname, 'public/frames');
const PORT = 9876;

const CATEGORIES = ['drops', 'hauts', 'bas', 'manteaux', 'chaussures', 'accessoires', 'ete'];

// Simple HTTP server to serve the video
const server = http.createServer((req, res) => {
  if (req.url === '/video') {
    const stat = fs.statSync(VIDEO_PATH);
    res.writeHead(200, {
      'Content-Type': 'video/quicktime',
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(VIDEO_PATH).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
      <body style="margin:0;background:#000;overflow:hidden;">
        <video id="v"
          src="/video"
          style="width:100vw;height:100vh;object-fit:cover;"
          muted preload="auto">
        </video>
      </body>
      </html>
    `);
  }
});

(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Server running on port ${PORT}`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`http://localhost:${PORT}`);

  // Wait for video metadata
  const duration = await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const v = document.getElementById('v');
      if (v.readyState >= 1) return resolve(v.duration);
      v.onloadedmetadata = () => resolve(v.duration);
      v.onerror = reject;
      setTimeout(() => reject('timeout'), 15000);
    });
  });

  console.log(`Video duration: ${duration.toFixed(1)}s`);

  for (let i = 0; i < CATEGORIES.length; i++) {
    // Spread timestamps across the video, offset by half a segment
    const t = (duration / CATEGORIES.length) * i + (duration / CATEGORIES.length / 2);

    await page.evaluate((time) => {
      const v = document.getElementById('v');
      v.currentTime = time;
    }, t);

    // Wait for the frame to render
    await page.waitForTimeout(600);

    const outPath = path.join(OUTPUT_DIR, `${CATEGORIES[i]}.jpg`);
    await page.screenshot({ path: outPath, type: 'jpeg', quality: 88 });
    console.log(`✓ ${CATEGORIES[i]} — ${t.toFixed(1)}s → ${outPath}`);
  }

  await browser.close();
  server.close();
  console.log('\nDone! Frames saved to public/frames/');
})().catch(err => {
  console.error(err);
  server.close();
  process.exit(1);
});
