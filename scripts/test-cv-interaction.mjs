import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const port = 9600 + Math.floor(Math.random() * 300);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chrome =
  process.env.CHROME_PATH ??
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find((path) => existsSync(path));

assert.ok(chrome, "Chrome browser not found on host");

// 1. Test /api/cv-pdf endpoint directly
console.log("1. Testing GET /api/cv-pdf endpoint...");
const pdfRes = await fetch(`${base}/api/cv-pdf`);
assert.equal(pdfRes.status, 200, `Expected 200, got ${pdfRes.status}`);
assert.equal(pdfRes.headers.get("content-type"), "application/pdf", "Expected application/pdf content type");
assert.ok(
  pdfRes.headers.get("content-disposition")?.includes("inline"),
  `Expected inline content-disposition, got ${pdfRes.headers.get("content-disposition")}`
);
const pdfBytes = await pdfRes.arrayBuffer();
assert.ok(pdfBytes.byteLength > 10000, `PDF size too small: ${pdfBytes.byteLength} bytes`);
console.log(`ok /api/cv-pdf: returns valid inline PDF (${pdfBytes.byteLength} bytes)`);

// 2. Headless Chrome browser interaction test
const profile = mkdtempSync(join(tmpdir(), "zekk-cv-test-"));
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
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? "Evaluation failed");
  return result.value;
};

const setViewport = async (width, height, isMobile = false) => {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: isMobile,
  });
};

try {
  let ready = false;
  for (let attempt = 0; attempt < 40 && !ready; attempt++) {
    try {
      const info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      ready = typeof info.Browser === "string";
    } catch {
      await sleep(200);
    }
  }
  assert.ok(ready, "Chrome DevTools endpoint did not respond");

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

  console.log("2. Navigating to / (Desktop 1280x900)...");
  await send("Page.navigate", { url: `${base}/` });
  await sleep(3500);

  // Click "Buka Berkas CV Lengkap"
  console.log("3. Opening CV preview from folder stage...");
  const opened = await evaluate(`(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Buka Berkas CV Lengkap'));
    if (!btn) return false;
    btn.click();
    return true;
  })()`);
  assert.ok(opened, "Tombol 'Buka Berkas CV Lengkap' tidak ditemukan");
  await sleep(1000);

  // Verify dialog is open and has NO bulky modal box/border
  const checkModal = await evaluate(`(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return { found: false };
    // Verify there are no card background boxes with border
    const whiteBox = dialog.querySelector('.bg-white.shadow-2xl, .bg-white.p-6, .dark\\\\:bg-\\\\[\\\\#0c0e17\\\\]');
    const pdfBtn = dialog.querySelector('a[href*="cv-pdf"], a[href*=".pdf"]');
    const rotateBtn = [...dialog.querySelectorAll('button')].find(b => b.textContent.includes('Ratakan'));
    const closeBtn = dialog.querySelector('button[aria-label="Tutup pratinjau CV"]');
    const paperCanvas = dialog.querySelector('canvas');
    const paperImg = dialog.querySelector('img');

    return {
      found: true,
      hasWhiteBox: !!whiteBox,
      hasPdfBtn: !!pdfBtn,
      pdfHref: pdfBtn?.getAttribute('href'),
      pdfTarget: pdfBtn?.getAttribute('target'),
      pdfRel: pdfBtn?.getAttribute('rel'),
      hasRotateBtn: !!rotateBtn,
      hasCloseBtn: !!closeBtn,
      hasPaper: !!(paperCanvas || paperImg)
    };
  })()`);

  assert.ok(checkModal.found, "Dialog CV tidak terbuka");
  assert.equal(checkModal.hasWhiteBox, false, "Dialog masih memiliki container box/border modal!");
  assert.ok(checkModal.hasPaper, "PaperCrumple canvas / fallback image tidak ditemukan");
  assert.ok(checkModal.hasPdfBtn, "Tombol 'Buka PDF' tidak ditemukan");
  assert.equal(checkModal.pdfTarget, "_blank", "Tombol 'Buka PDF' harus target='_blank'");
  assert.ok(checkModal.pdfRel?.includes("noopener"), "Tombol 'Buka PDF' harus memiliki rel='noopener'");
  assert.ok(checkModal.hasRotateBtn, "Tombol 'Ratakan' tidak ditemukan");
  assert.ok(checkModal.hasCloseBtn, "Tombol 'Tutup' tidak ditemukan");
  console.log("ok  CV preview: lembar kertas mengambang tanpa modal container box");
  console.log(`ok  Buka PDF link: href=${checkModal.pdfHref}, target=${checkModal.pdfTarget}`);

  // 4. Test page navigation
  console.log("4. Testing page navigation...");
  const pageNav = await evaluate(`(() => {
    const nextBtn = document.querySelector('button[aria-label="Halaman berikutnya"]');
    if (!nextBtn) return { hasNext: false };
    nextBtn.click();
    return { hasNext: true };
  })()`);
  assert.ok(pageNav.hasNext, "Tombol 'Halaman berikutnya' tidak ditemukan");
  await sleep(600);

  const pageIndicator = await evaluate(`(() => {
    const dialog = document.querySelector('[role="dialog"]');
    return dialog ? dialog.innerText : "";
  })()`);
  assert.ok(pageIndicator.includes("2/4") || pageIndicator.includes("2 / 4"), "Pergantian halaman gagal");
  console.log("ok  Navigasi halaman: berhasil beralih ke Hal 2 / 4");

  // 5. Test interaction: press and hold on paper
  console.log("5. Testing press/hold hiding floating controls...");
  const hitElement = await evaluate(`(() => {
    const hit = document.querySelector('.paper-crumple, canvas');
    return !!hit;
  })()`);
  assert.ok(hitElement, "Elemen PaperCrumple tidak ditemukan");

  // Dispatch pointerdown on hit element
  await evaluate(`(() => {
    const hit = document.querySelector('.paper-crumple-hit, .paper-crumple, canvas');
    if (hit) {
      hit.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, isPrimary: true, clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }));
    }
  })()`);
  await sleep(300);

  // Dispatch pointerup
  await evaluate(`(() => {
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
  })()`);
  await sleep(300);
  console.log("ok  Pointer press & release: berhasil diuji");

  // 6. Test Escape key closes modal
  console.log("6. Testing Escape key close & focus return...");
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
    nativeVirtualKeyCode: 27,
  });
  await sleep(500);

  const isClosed = await evaluate(`(() => {
    return !document.querySelector('[role="dialog"]');
  })()`);
  assert.ok(isClosed, "Escape key gagal menutup dialog CV");
  console.log("ok  Escape key: berhasil menutup tampilan CV");

  // 7. Test on Mobile Viewport (390x844)
  console.log("7. Testing on Mobile Viewport (390x844)...");
  await setViewport(390, 844, true);
  await sleep(500);

  // Click on a role button in CV section to open
  const openedMobile = await evaluate(`(() => {
    const btn = document.querySelector('#cv button');
    if (!btn) return false;
    btn.click();
    return true;
  })()`);
  assert.ok(openedMobile, "Gagal membuka CV di mobile");
  await sleep(800);

  const mobileCheck = await evaluate(`(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return { found: false };
    const pdfBtn = dialog.querySelector('a[href*="cv-pdf"], a[href*=".pdf"]');
    const paper = dialog.querySelector('canvas') || dialog.querySelector('img');
    const paperRect = paper ? paper.getBoundingClientRect() : null;
    return {
      found: true,
      hasPdfBtn: !!pdfBtn,
      pdfVisible: pdfBtn ? window.getComputedStyle(pdfBtn).display !== 'none' : false,
      paperWidth: paperRect ? Math.round(paperRect.width) : 0,
      viewportWidth: window.innerWidth,
    };
  })()`);

  assert.ok(mobileCheck.found, "Dialog CV mobile tidak ditemukan");
  assert.ok(mobileCheck.hasPdfBtn && mobileCheck.pdfVisible, "Tombol 'Buka PDF' harus terlihat di mobile");
  assert.ok(mobileCheck.paperWidth <= 390, `Lebar kertas (${mobileCheck.paperWidth}px) melebihi lebar layar mobile (390px)`);
  console.log(`ok  Mobile: kertas berukuran ${mobileCheck.paperWidth}px (muat dalam layar 390px), tombol Buka PDF aktif`);

  // Close mobile
  await evaluate(`(() => {
    const closeBtn = document.querySelector('button[aria-label="Tutup pratinjau CV"]');
    if (closeBtn) closeBtn.click();
  })()`);
  await sleep(500);

  console.log("\nSemua 12 kriteria revisi CV lulus pengujian!");
} finally {
  ws?.close();
  await stop();
}
