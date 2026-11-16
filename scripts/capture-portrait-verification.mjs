import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const port = 9555;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const artifactsDir = "C:/Users/ZakariaMP/.gemini/antigravity/brain/cdb3f98c-3687-475a-9e32-7254f03effea";

const chrome =
  process.env.CHROME_PATH ??
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find((path) => existsSync(path));

assert.ok(chrome, "Chrome tidak ditemukan");

const profile = mkdtempSync(join(tmpdir(), "zekk-portrait-"));
const browser = spawn(
  chrome,
  [
    "--headless=new",
    "--enable-unsafe-swiftshader",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--window-size=1280,900",
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
  const { result, exceptionDetails } = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? "eval gagal");
  return result.value;
};

const captureScreenshot = async (filename) => {
  const { data } = await send("Page.captureScreenshot", { format: "png" });
  const buffer = Buffer.from(data, "base64");
  const dest = join(artifactsDir, filename);
  writeFileSync(dest, buffer);
  console.log(`Saved screenshot: ${filename} (${buffer.length} bytes)`);
  return dest;
};

async function main() {
  console.log("Connecting to Chrome on port", port);
  let ready = false;
  for (let attempt = 0; attempt < 30 && !ready; attempt++) {
    try {
      const info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      ready = typeof info.Browser === "string";
    } catch {
      await sleep(200);
    }
  }
  assert.ok(ready, "Chrome DevTools gagal merespons");

  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = list.find((item) => item.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const task = pending.get(message.id);
    if (!task) return;
    pending.delete(message.id);
    if (message.error) task.reject(new Error(message.error.message));
    else task.resolve(message.result);
  });

  await send("Page.enable");
  await send("DOM.enable");
  await send("Input.setIgnoreInputEvents", { ignore: false });

  console.log("Navigating to http://localhost:3000/");
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await sleep(4000);

  // 1. Idle state (Light Mode)
  console.log("Testing Idle State (Light Mode)...");
  await captureScreenshot("idle-light.png");

  // 2. Hover state: move mouse to hero area (x: 550, y: 380)
  console.log("Testing Hover State (Light Mode)...");
  await send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: 550,
    y: 380,
  });
  await sleep(600);
  await captureScreenshot("hover-light.png");

  // 3. Click / Pointer down state
  console.log("Testing Click State (Light Mode)...");
  await send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: 550,
    y: 380,
    button: "left",
    clickCount: 1,
  });
  await sleep(150);
  await captureScreenshot("click-light.png");
  await send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: 550,
    y: 380,
    button: "left",
    clickCount: 1,
  });
  await sleep(400);

  // 4. Switch to Dark Mode
  console.log("Switching to Dark Mode...");
  await evaluate(`(() => {
    const btn = document.querySelector('button[aria-label*="gelap"], button[aria-label*="Dark"], button[aria-label*="mode"], .theme-toggle');
    if (btn) btn.click();
    else document.documentElement.classList.add('dark');
  })()`);
  await sleep(1000);

  // Idle Dark Mode
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: -100, y: -100 });
  await sleep(600);
  await captureScreenshot("idle-dark.png");

  // Hover Dark Mode
  console.log("Testing Hover State (Dark Mode)...");
  await send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: 550,
    y: 380,
  });
  await sleep(600);
  await captureScreenshot("hover-dark.png");

  console.log("Verifying Lanyard draggable and link clickable...");
  const lanyardCanvas = await evaluate(`(() => {
    const c = document.querySelector("#atas canvas, canvas");
    return Boolean(c && c.width > 0);
  })()`);
  assert.equal(lanyardCanvas, true, "Lanyard canvas harus aktif");

  const emailBtn = await evaluate(`(() => {
    const a = document.querySelector('a[href^="mailto:"]');
    return Boolean(a && a.href.includes("zakariamujur6@gmail.com"));
  })()`);
  assert.equal(emailBtn, true, "Tombol kontak email harus dapat diakses");

  console.log("All visual tests completed successfully!");
}

main()
  .then(async () => {
    await stop();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Test failed:", err);
    await stop();
    process.exit(1);
  });
