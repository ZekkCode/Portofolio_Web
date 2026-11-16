import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = "http://localhost:3000";
const port = 9750;
const chrome =
  process.env.CHROME_PATH ??
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].find((path) => existsSync(path));

const profile = mkdtempSync(join(tmpdir(), "zekk-cert-"));
const browser = spawn(chrome, [
  "--headless=new",
  "--enable-unsafe-swiftshader",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "--window-size=1280,900",
  "about:blank",
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let ws;
let nextId = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

async function main() {
  await sleep(1000);
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = list.find((item) => item.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const task = pending.get(message.id);
    if (!task) return;
    pending.delete(message.id);
    if (message.error) task.reject(new Error(message.error.message));
    else task.resolve(message.result);
  });
  await new Promise((resolve) => ws.addEventListener("open", resolve));

  await send("Page.enable");
  await send("Runtime.enable");

  await send("Page.navigate", { url: `${base}/#certificates` });
  await sleep(2500);

  // 1. Verify thumbnails on cards
  const certThumbnails = await send("Runtime.evaluate", {
    expression: `(() => {
      const section = document.querySelector("#certificates");
      if (!section) return { error: "Section not found" };
      const cards = section.querySelectorAll('[data-cert-id]');
      const thumbs = [...cards].map(c => {
        const id = c.getAttribute('data-cert-id');
        const img = c.querySelector('img[src*="/certificates/"]');
        return {
          id,
          hasImg: Boolean(img),
          imgSrc: img ? img.getAttribute('src') : null,
        };
      });
      return { totalCards: cards.length, thumbs };
    })()`,
    returnByValue: true,
  });
  console.log("Certificates card thumbnails:", certThumbnails.result.value);
  assert.ok(certThumbnails.result.value.thumbs.some(t => t.hasImg), "Harus ada thumbnail gambar pada kartu sertifikat");

  // Capture screenshot of Certificates Section with thumbnails
  await send("Runtime.evaluate", {
    expression: `document.querySelector("#certificates").scrollIntoView({ behavior: "instant", block: "start" })`
  });
  await sleep(500);
  const shotGrid = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("C:/Users/ZakariaMP/.gemini/antigravity/brain/cdb3f98c-3687-475a-9e32-7254f03effea/cert-cards-thumbnails.png", Buffer.from(shotGrid.data, "base64"));
  console.log("✓ Saved cert-cards-thumbnails.png");

  // 2. Open Certificate Preview Modal
  console.log("Opening preview modal...");
  const openRes = await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = [...document.querySelectorAll("#certificates button")].find(b => b.textContent.includes("Pratinjau") || b.textContent.includes("Preview"));
      if (!btn) return false;
      btn.click();
      return true;
    })()`,
    returnByValue: true,
  });
  assert.equal(openRes.result.value, true, "Tombol Pratinjau harus ditemukan dan diklik");
  await sleep(600);

  // 3. Verify Modal is inside document.body and outside #certificates (PORTAL VERIFICATION)
  const portalCheck = await send("Runtime.evaluate", {
    expression: `(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return { found: false };
      const insideSection = Boolean(document.querySelector("#certificates")?.contains(modal));
      const parentIsBody = modal.parentElement === document.body;
      const zIndex = window.getComputedStyle(modal).zIndex;
      const bodyOverflow = document.body.style.overflow;
      return {
        found: true,
        insideSection,
        parentIsBody,
        zIndex,
        bodyOverflow,
      };
    })()`,
    returnByValue: true,
  });
  console.log("Portal verification:", portalCheck.result.value);
  assert.equal(portalCheck.result.value.found, true, "Modal harus muncul");
  assert.equal(portalCheck.result.value.insideSection, false, "Modal TIDAK boleh berada di dalam #certificates (wajib via Portal)");
  assert.equal(portalCheck.result.value.parentIsBody, true, "Modal harus menjadi anak langsung dari document.body");
  assert.equal(portalCheck.result.value.bodyOverflow, "hidden", "Body scroll harus dikunci saat modal terbuka");

  // Capture screenshot of Modal open (confirm no leak/tembus)
  const shotModal = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync("C:/Users/ZakariaMP/.gemini/antigravity/brain/cdb3f98c-3687-475a-9e32-7254f03effea/cert-modal-portal-no-leak.png", Buffer.from(shotModal.data, "base64"));
  console.log("✓ Saved cert-modal-portal-no-leak.png");

  // Test Escape key closes modal
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    windowsVirtualKeyCode: 27,
    key: "Escape",
    code: "Escape",
  });
  await sleep(300);
  const closedCheck = await send("Runtime.evaluate", {
    expression: `Boolean(document.querySelector('[role="dialog"]'))`,
    returnByValue: true,
  });
  assert.equal(closedCheck.result.value, false, "Modal harus tertutup setelah tombol Escape");
  console.log("✓ Tombol Escape menutup modal dengan sukses");

  browser.kill();
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
  console.log("\n>>> SEMUA VERIFIKASI PERBAIKAN SERTIFIKASI LOLOS 100% <<<");
}

main().catch((err) => {
  console.error("Test failed:", err);
  browser.kill();
  process.exit(1);
});
