import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const size = 512;
const squircleRadius = 112;
const squircleBorder = 18;
const innerSize = size - squircleBorder * 2;
const innerRadius = squircleRadius - squircleBorder / 2;

// Squircle base SVG
const squircleBaseSvg = Buffer.from(`
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${squircleRadius}" ry="${squircleRadius}" fill="#ffffff" stroke="#e2e8f0" stroke-width="2.5" />
  </svg>
`);

const squircleMaskSvg = Buffer.from(`
  <svg width="${innerSize}" height="${innerSize}" viewBox="0 0 ${innerSize} ${innerSize}">
    <rect x="0" y="0" width="${innerSize}" height="${innerSize}" rx="${innerRadius}" ry="${innerRadius}" fill="#ffffff" />
  </svg>
`);

// Circle base SVG
const circleBaseSvg = Buffer.from(`
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="#ffffff" stroke="#e2e8f0" stroke-width="2.5" />
  </svg>
`);

const circleMaskSvg = Buffer.from(`
  <svg width="${innerSize}" height="${innerSize}" viewBox="0 0 ${innerSize} ${innerSize}">
    <circle cx="${innerSize / 2}" cy="${innerSize / 2}" r="${innerSize / 2}" fill="#ffffff" />
  </svg>
`);

// Helper for squircle badge sticker
async function makeSquircleSticker(srcPath, outFileName, padding = 0) {
  let input = sharp(srcPath);
  const contentSize = innerSize - padding * 2;
  
  let resized;
  if (padding > 0) {
    const contained = await input
      .resize(contentSize, contentSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    resized = await sharp({
      create: {
        width: innerSize,
        height: innerSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      }
    }).composite([{ input: contained, gravity: 'center' }]).png().toBuffer();
  } else {
    resized = await input
      .resize(innerSize, innerSize, { fit: 'cover' })
      .composite([{ input: squircleMaskSvg, blend: 'dest-in' }])
      .png()
      .toBuffer();
  }

  const finalSticker = await sharp(squircleBaseSvg)
    .composite([{ input: resized, top: squircleBorder, left: squircleBorder }])
    .png()
    .toBuffer();

  const outPath = `public/icons/${outFileName}`;
  await sharp(finalSticker).webp({ quality: 95 }).toFile(outPath);
  console.log(`Generated squircle sticker: ${outPath}`);
}

// Helper for die-cut contour sticker (silhouette outline like ReactBits)
async function makeContourSticker(srcPath, outFileName, contourSize = 16) {
  const baseSize = 432;
  const input = sharp(srcPath);
  const resized = await input
    .resize(baseSize, baseSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const canvasSize = 512;
  const centered = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).composite([{ input: resized, gravity: 'center' }]).png().toBuffer();

  const { data, info } = await sharp(centered).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const alphaMask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    alphaMask[i] = data[i * 4 + 3];
  }

  const dilated = new Uint8Array(w * h);
  const r = contourSize;
  const rSq = r * r;

  // Stamp circle on all non-transparent pixels
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alphaMask[y * w + x] > 30) {
        const minY = Math.max(0, y - r);
        const maxY = Math.min(h - 1, y + r);
        const minX = Math.max(0, x - r);
        const maxX = Math.min(w - 1, x + r);
        for (let ny = minY; ny <= maxY; ny++) {
          const dy = ny - y;
          const dySq = dy * dy;
          for (let nx = minX; nx <= maxX; nx++) {
            const dx = nx - x;
            if (dx * dx + dySq <= rSq) {
              dilated[ny * w + nx] = 255;
            }
          }
        }
      }
    }
  }

  const whiteBack = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const a = dilated[i];
    whiteBack[i * 4] = 255;
    whiteBack[i * 4 + 1] = 255;
    whiteBack[i * 4 + 2] = 255;
    whiteBack[i * 4 + 3] = a;
  }

  // Smooth blur for smooth sticker cut edges
  const whiteImg = await sharp(whiteBack, { raw: { width: w, height: h, channels: 4 } })
    .blur(1.5)
    .png()
    .toBuffer();

  const finalSticker = await sharp(whiteImg)
    .composite([{ input: centered, blend: 'over' }])
    .webp({ quality: 95 })
    .toFile(`public/icons/${outFileName}`);

  console.log(`Generated die-cut sticker: public/icons/${outFileName}`);
}

async function run() {
  console.log('Generating die-cut sticker collection...');

  // 1. Canva (User Image 4)
  const canvaUserSrc = 'C:/Users/ZakariaMP/.gemini/antigravity/brain/cdb3f98c-3687-475a-9e32-7254f03effea/.user_uploaded/media_1794410486463_2a7f1429.png';
  if (fs.existsSync(canvaUserSrc)) {
    await makeSquircleSticker(canvaUserSrc, 'canva.webp', 0);
  }

  // 2. Jira (User Image 5)
  const jiraUserSrc = 'C:/Users/ZakariaMP/.gemini/antigravity/brain/cdb3f98c-3687-475a-9e32-7254f03effea/.user_uploaded/media_1794411906135_577ab920.png';
  if (fs.existsSync(jiraUserSrc)) {
    const croppedJira = await sharp(jiraUserSrc)
      .extract({ left: 116, top: 122, width: 535, height: 523 })
      .png()
      .toBuffer();
    await makeSquircleSticker(croppedJira, 'jira.webp', 0);
  }

  // 3. Laravel
  if (fs.existsSync('public/icons/laravel.png')) {
    await makeSquircleSticker('public/icons/laravel.png', 'laravel.webp', 0);
  }

  // 4. Knime
  if (fs.existsSync('public/icons/knime.png')) {
    await makeSquircleSticker('public/icons/knime.png', 'knime.webp', 0);
  }

  // 5. Photoshop
  if (fs.existsSync('public/icons/photoshop.png')) {
    await makeSquircleSticker('public/icons/photoshop.png', 'photoshop.webp', 0);
  }

  // 6. Illustrator
  if (fs.existsSync('public/icons/illustrator.svg')) {
    await makeSquircleSticker('public/icons/illustrator.svg', 'illustrator.webp', 0);
  }

  // 7. Adobe XD
  if (fs.existsSync('public/icons/adobexd.svg')) {
    await makeSquircleSticker('public/icons/adobexd.svg', 'adobexd.webp', 0);
  }

  // 8. TypeScript
  if (fs.existsSync('public/icons/typescript.svg')) {
    await makeSquircleSticker('public/icons/typescript.svg', 'typescript.webp', 0);
  }

  // 9. Bootstrap
  if (fs.existsSync('public/icons/bootstrap.png')) {
    await makeSquircleSticker('public/icons/bootstrap.png', 'bootstrap.webp', 0);
  }

  // 10. Bootstrap Studio
  if (fs.existsSync('public/icons/bootstrap-studio.png')) {
    await makeSquircleSticker('public/icons/bootstrap-studio.png', 'bootstrap-studio.webp', 0);
  }

  // 11. CorelDRAW
  if (fs.existsSync('public/icons/coreldraw-design.png')) {
    await makeSquircleSticker('public/icons/coreldraw-design.png', 'coreldraw-design.webp', 0);
  }

  // Die-cut silhouette stickers
  // 12. React (atom)
  if (fs.existsSync('public/icons/react.svg')) {
    await makeContourSticker('public/icons/react.svg', 'react.webp', 16);
  }

  // 13. Figma
  if (fs.existsSync('public/icons/figma.png')) {
    await makeContourSticker('public/icons/figma.png', 'figma.webp', 16);
  }

  // 14. Flutter
  if (fs.existsSync('public/icons/flutter.png')) {
    await makeContourSticker('public/icons/flutter.png', 'flutter.webp', 16);
  }

  // 15. Next.js
  if (fs.existsSync('public/icons/nextjs.png')) {
    await makeContourSticker('public/icons/nextjs.png', 'nextjs.webp', 16);
  }

  // 16. Tailwind
  if (fs.existsSync('public/icons/tailwind.png')) {
    await makeContourSticker('public/icons/tailwind.png', 'tailwind.webp', 16);
  }

  // 17. Python
  if (fs.existsSync('public/icons/python.png')) {
    await makeContourSticker('public/icons/python.png', 'python.webp', 16);
  }

  // 18. Vue
  if (fs.existsSync('public/icons/vue.png')) {
    await makeContourSticker('public/icons/vue.png', 'vue.webp', 16);
  }

  // 19. PostgreSQL
  if (fs.existsSync('public/icons/postgre.png')) {
    await makeContourSticker('public/icons/postgre.png', 'postgre.webp', 16);
  }

  // 20. MySQL
  if (fs.existsSync('public/icons/mysql.png')) {
    await makeContourSticker('public/icons/mysql.png', 'mysql.webp', 16);
  }

  // 21. GitHub
  if (fs.existsSync('public/icons/github.png')) {
    await makeContourSticker('public/icons/github.png', 'github.webp', 16);
  }

  // 22. CapCut
  if (fs.existsSync('public/icons/capcut.svg')) {
    await makeContourSticker('public/icons/capcut.svg', 'capcut.webp', 16);
  }

  // 23. Filmora
  if (fs.existsSync('public/icons/filmora.png')) {
    await makeContourSticker('public/icons/filmora.png', 'filmora.webp', 16);
  }

  // 24. Orange Data Mining
  if (fs.existsSync('public/icons/orange-data-mining.png')) {
    await makeContourSticker('public/icons/orange-data-mining.png', 'orange-data-mining.webp', 16);
  }

  // 25. Jupyter Book
  if (fs.existsSync('public/icons/jupyterbook.png')) {
    await makeContourSticker('public/icons/jupyterbook.png', 'jupyterbook.webp', 16);
  }

  console.log('All 25 stickers generated successfully!');
}

run().catch(e => console.error(e));
