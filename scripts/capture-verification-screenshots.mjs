import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const port = 9550 + Math.floor(Math.random() * 200);

const chrome =
  process.env.CHROME_PATH ??
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find((path) => existsSync(path));

if (!chrome) {
  console.error("Chrome executable not found");
  process.exit(1);
}

const profile = mkdtempSync(join(tmpdir(), "zekk-snap-"));
const browser = spawn(
  chrome,
  [
    "--headless=new",
    "--enable-unsafe-swiftshader",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--window-size=1440,900",
    "about:blank",
  ],
  { stdio: "ignore" }
);

const stop = async () => {
  browser.kill("SIGKILL");
  await sleep(600);
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {}
};

async function main() {
  await sleep(1500);
  const targetsRes = await fetch(`http://127.0.0.1:${port}/json`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === "page") || targets[0];

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let nextId = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(data.error.message));
      else resolve(data.result);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send("Page.enable");
  await send("Runtime.enable");

  // 1. Desktop 1440px
  console.log("Navigating to http://localhost:3000 (Desktop 1440x900)...");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: "http://localhost:3000" });
  await sleep(3500); // Wait for lanyard 3D to settle

  const snapDesktop = await send("Page.captureScreenshot", {
    format: "png",
    clip: { x: 0, y: 0, width: 1440, height: 780, scale: 1 },
  });
  const artifactDir = "C:/Users/ZakariaMP/.gemini/antigravity/brain/cdb3f98c-3687-475a-9e32-7254f03effea";
  writeFileSync(join(artifactDir, "fixed-hero-desktop.png"), Buffer.from(snapDesktop.data, "base64"));
  console.log("Saved fixed-hero-desktop.png");

  // 2. Mobile 390px
  console.log("Testing Mobile 390x844...");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await send("Page.navigate", { url: "http://localhost:3000" });
  await sleep(3000);

  const snapMobile = await send("Page.captureScreenshot", {
    format: "png",
    clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 },
  });
  writeFileSync(join(artifactDir, "fixed-hero-mobile.png"), Buffer.from(snapMobile.data, "base64"));
  console.log("Saved fixed-hero-mobile.png");

  // 3. CV Modal & PaperCrumple
  console.log("Testing CV Preview Modal with PaperCrumple...");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1200,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: "http://localhost:3000" });
  await sleep(2500);

  // Click "Buka Berkas Karier" button via evaluate
  await send("Runtime.evaluate", {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const target = btns.find(b => b.textContent && b.textContent.includes('Buka Berkas Karier'));
        if (target) target.click();
      })()
    `,
  });
  await sleep(2500);

  const snapModal = await send("Page.captureScreenshot", {
    format: "png",
  });
  writeFileSync(join(artifactDir, "fixed-papercrumple-modal.png"), Buffer.from(snapModal.data, "base64"));
  console.log("Saved fixed-papercrumple-modal.png");

  ws.close();
  await stop();
  console.log("All screenshots captured successfully.");
}

main().catch(async (e) => {
  console.error("Capture error:", e);
  await stop();
  process.exit(1);
});
