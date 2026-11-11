import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ARTIFACTS_DIR = "C:/Users/ZakariaMP/.gemini/antigravity/brain/cdb3f98c-3687-475a-9e32-7254f03effea";
const base = "http://localhost:3000";
const port = 9520;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chrome =
  process.env.CHROME_PATH ??
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find((path) => existsSync(path));

const profile = mkdtempSync(join(tmpdir(), "zekk-visual-"));
const browser = spawn(
  chrome,
  [
    "--headless=new",
    "--enable-unsafe-swiftshader",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--window-size=1366,768",
    "about:blank",
  ],
  { stdio: "ignore" }
);

const stop = async () => {
  browser.kill("SIGKILL");
  await sleep(600);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
};

let ws;
let nextId = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

const evaluate = async (expression) => {
  const res = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    throw new Error(res.exceptionDetails.text);
  }
  return res.result?.value;
};

const captureScreenshot = async (filePath) => {
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(filePath, Buffer.from(data, "base64"));
};

async function run() {
  await sleep(1500);
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const pageTarget = targets.find((t) => t.type === "page");
  ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  });

  await new Promise((resolve) => ws.addEventListener("open", resolve));
  await send("Page.enable");
  await send("Runtime.enable");
  await send("DOM.enable");

  // Set laptop viewport (1366 x 768)
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send("Page.navigate", { url: base });
  await sleep(3000);

  // 1. Capture Hero on laptop
  const heroStickerStats = await evaluate(`
    (() => {
      const slots = Array.from(document.querySelectorAll('div[style*="top:"]'));
      const inHero = slots.map(s => {
        const r = s.getBoundingClientRect();
        return { side: r.left < 683 ? 'left' : 'right', top: Math.round(r.top), left: Math.round(r.left) };
      }).filter(s => s.top < 700);
      return {
        total: inHero.length,
        left: inHero.filter(s => s.side === 'left').length,
        right: inHero.filter(s => s.side === 'right').length,
        items: inHero
      };
    })()
  `);
  console.log('Hero sticker stats on laptop (1366x768):', heroStickerStats);

  await captureScreenshot(join(ARTIFACTS_DIR, "verified-hero-laptop.png"));
  console.log("Captured verified-hero-laptop.png");

  // 2. Hover test: find a sticker hit area on left gutter and dispatch pointer movement
  const hoverCoord = await evaluate(`
    (() => {
      const hit = document.querySelector('.pointer-events-auto.cursor-pointer');
      if (!hit) return null;
      const r = hit.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()
  `);

  if (hoverCoord) {
    console.log('Moving mouse to sticker at:', hoverCoord);
    await send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: hoverCoord.x,
      y: hoverCoord.y,
    });
    await sleep(700);
    await captureScreenshot(join(ARTIFACTS_DIR, "verified-hover-peel.png"));
    console.log("Captured verified-hover-peel.png with hover peel active");
  }

  // 3. Scroll to Experience Timeline
  await evaluate(`
    (() => {
      const sec = document.getElementById('pengalaman') || document.querySelector('section[id*="pengalaman"]');
      if (sec) sec.scrollIntoView();
      else window.scrollTo(0, 2600);
    })()
  `);
  await sleep(1800);
  await captureScreenshot(join(ARTIFACTS_DIR, "verified-timeline-laptop.png"));
  console.log("Captured verified-timeline-laptop.png");

  // 4. Mobile Viewport (390 x 844)
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await evaluate(`window.scrollTo(0, 0)`);
  await sleep(1500);
  await captureScreenshot(join(ARTIFACTS_DIR, "verified-hero-mobile.png"));
  console.log("Captured verified-hero-mobile.png");

  await stop();
  console.log("Visual verification finished successfully!");
}

run().catch(async (e) => {
  console.error(e);
  await stop();
  process.exit(1);
});
