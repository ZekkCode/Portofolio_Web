import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const port = process.env.CHECK_PORT ? Number(process.env.CHECK_PORT) : 9400 + Math.floor(Math.random() * 500);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const chrome =
  process.env.CHROME_PATH ??
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].find((path) => existsSync(path));

assert.ok(chrome, "Chrome tidak ditemukan — set CHROME_PATH");

const profile = mkdtempSync(join(tmpdir(), "zekk-check-"));
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
  await sleep(700);
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    // profil chrome kadang masih terkunci di Windows; biar OS yang bersihkan
  }
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

const goto = async (path, wait = 2500) => {
  await send("Page.navigate", { url: `${base}${path}` });
  await sleep(wait);
};

const click = (text) =>
  evaluate(`(() => {
    const button = [...document.querySelectorAll("button")].find((item) => item.textContent.trim() === ${JSON.stringify(text)});
    if (!button) return false;
    button.click();
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    return true;
  })()`);

const typeInto = (selector, value, index = 0) =>
  evaluate(`(() => {
    const el = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
    if (!el) return false;
    if (el._valueTracker) el._valueTracker.setValue(el.type === "range" ? "0" : "");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  })()`);


try {
  console.log("Checking Chrome connection on port", port);
  let ready = false;
  for (let attempt = 0; attempt < 40 && !ready; attempt++) {
    try {
      const info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      ready = typeof info.Browser === "string";
    } catch {
      await sleep(250);
    }
  }
  assert.ok(ready, "Chrome DevTools tidak merespons");
  console.log("Chrome ready");

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
  console.log("Navigating to /");

  await goto("/", 3000);
  console.log("On /, evaluating hero");
  const hero = await evaluate(`(() => {
    const canvas = document.querySelector("#atas canvas, #kontak canvas, canvas");
    return canvas ? { width: canvas.width, height: canvas.height } : null;
  })()`);
  assert.ok(hero, "canvas lanyard tidak ada di hero");
  assert.ok(hero.width > 0 && hero.height > 0, "canvas lanyard berukuran 0");
  assert.equal(
    await evaluate(`document.querySelectorAll('a[href*="github.com"]').length >= 7`),
    true,
    "kartu proyek tidak ter-render"
  );
  console.log("ok  hero: lanyard 3D render + proyek tampil");

  await goto("/admin", 3000);
  console.log("On /admin");
  let controls = 0;
  for (let attempt = 0; attempt < 20; attempt++) {
    controls = await evaluate(`document.querySelectorAll('input, select, textarea').length`);
    if (controls >= 20) break;
    await sleep(250);
  }
  assert.ok(controls >= 20, `panel admin cuma punya ${controls} kontrol`);
  assert.equal(
    await evaluate(
      `(() => {
        const text = document.body.innerText.toLowerCase();
        return text.includes("panel admin") && text.includes("gambar depan");
      })()`
    ),
    true,
    "panel admin tidak lengkap"
  );
  console.log(`ok  admin: ${controls} kontrol lanyard + proyek`);

  assert.equal(await typeInto('input[type="range"]', "0.85", 0), true, "slider tidak ditemukan");
  await sleep(300);
  assert.equal(await click("Simpan"), true, "tombol Simpan tidak ditemukan");
  await sleep(400);
  const saved = await evaluate(`JSON.parse(localStorage.getItem("zekk:site:v1") ?? "{}").lanyard?.cornerRadius`);
  assert.equal(saved, 0.85, "nilai slider tidak tersimpan");
  console.log("ok  admin: ubah slider lalu Simpan menulis localStorage");

  assert.equal(await click("Proyek"), true, "tab Proyek tidak ditemukan");
  await sleep(300);
  const before = await evaluate(`document.querySelectorAll("textarea").length`);
  assert.equal(await click("+ Tambah proyek"), true, "tombol tambah proyek tidak ditemukan");
  await sleep(300);
  const after = await evaluate(`document.querySelectorAll("textarea").length`);
  assert.equal(after, before + 1, "tambah proyek tidak menambah baris");
  const titleIndex = await evaluate(`(() => {
    const inputs = [...document.querySelectorAll('label')].filter((l) => l.textContent.includes('Judul')).map((l) => l.querySelector('input'));
    return [...document.querySelectorAll('input')].indexOf(inputs[inputs.length - 1]);
  })()`);
  await typeInto("input", "Proyek Cek Otomatis", titleIndex);
  await sleep(200);
  await click("Simpan");
  await sleep(400);
  const stored = await evaluate(`JSON.parse(localStorage.getItem("zekk:site:v1") ?? "{}").projects ?? []`);
  assert.ok(
    stored.some((project) => project.title === "Proyek Cek Otomatis"),
    "proyek baru tidak tersimpan"
  );
  console.log("ok  admin: tambah proyek tersimpan");

  await goto("/", 2500);
  assert.equal(
    await evaluate(`document.body.innerText.includes("Proyek Cek Otomatis")`),
    true,
    "proyek baru tidak muncul di halaman utama"
  );
  console.log("ok  home: membaca config tersimpan");

  await evaluate(`localStorage.removeItem("zekk:site:v1")`);
  console.log("\nSemua cek lulus.");
} finally {
  ws?.close();
  await stop();
}
