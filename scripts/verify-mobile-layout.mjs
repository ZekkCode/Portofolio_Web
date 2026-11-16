import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const port = 9660;
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

const profile = mkdtempSync(join(tmpdir(), "zekk-mobile-"));
const browser = spawn(
  chrome,
  [
    "--headless=new",
    "--enable-unsafe-swiftshader",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--window-size=390,844",
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
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  console.log("Navigating to http://localhost:3000/");
  await send("Page.navigate", { url: "http://localhost:3000/" });
  await sleep(3500);

  // Measure Heights
  const sectionMetrics = await evaluate(`(() => {
    const getRect = (sel) => {
      const el = document.querySelector(sel);
      return el ? { height: Math.round(el.getBoundingClientRect().height) } : null;
    };
    return {
      services: getRect('#services'),
      stack: getRect('#stack'),
      blog: getRect('#blog'),
      certificates: getRect('#certificates'),
      contact: getRect('#kontak'),
    };
  })()`);
  console.log("Section Heights on 390px mobile:", sectionMetrics);

  // 1. SERVICES: Verify Mobile Carousel (Geser Kanan Kiri)
  console.log("\n--- Testing 1. Services Mobile Carousel (Toggle Kiri/Kanan) ---");
  await evaluate(`document.querySelector('#services')?.scrollIntoView()`);
  await sleep(500);

  const servicesInfo = await evaluate(`(() => {
    const sec = document.querySelector('#services');
    if (!sec) return { ok: false, reason: 'no section' };
    const mobileBox = sec.querySelector('.sm\\\\:hidden');
    const indicator = mobileBox?.querySelector('[data-services-indicator]')?.innerText;
    const prevBtn = mobileBox?.querySelector('button[aria-label*=\"sebelumnya\"]');
    const nextBtn = mobileBox?.querySelector('button[aria-label*=\"berikutnya\"]');
    const cardTitle = mobileBox?.querySelector('h3')?.innerText;
    return {
      ok: true,
      hasMobileCarousel: Boolean(mobileBox),
      indicator,
      hasPrev: Boolean(prevBtn),
      hasNext: Boolean(nextBtn),
      cardTitle
    };
  })()`);
  console.log("Services layout:", servicesInfo);
  assert.ok(servicesInfo.hasMobileCarousel, "Services harus memiliki carousel di mobile");
  assert.equal(servicesInfo.indicator, "1 / 4", "Indikator awal services harus 1 / 4");

  // Click next service
  await evaluate(`document.querySelector('#services .sm\\\\:hidden button[aria-label*=\"berikutnya\"]')?.click()`);
  await sleep(300);
  const servicesAfterNext = await evaluate(`document.querySelector('#services .sm\\\\:hidden [data-services-indicator]')?.innerText`);
  console.log("Services after Next click:", servicesAfterNext);
  assert.equal(servicesAfterNext, "2 / 4", "Setelah next, indikator harus 2 / 4");

  // Click prev service (back to 1 / 4)
  await evaluate(`document.querySelector('#services .sm\\\\:hidden button[aria-label*=\"sebelumnya\"]')?.click()`);
  await sleep(300);
  const servicesAfterPrev = await evaluate(`document.querySelector('#services .sm\\\\:hidden [data-services-indicator]')?.innerText`);
  console.log("Services after Prev click:", servicesAfterPrev);
  assert.equal(servicesAfterPrev, "1 / 4", "Setelah prev, indikator kembali 1 / 4");

  await captureScreenshot("mobile-services-carousel.png");

  // 2. TECH STACK: Verify tabs & compact grid
  console.log("\n--- Testing 2. Tech Stack Tabs & Compact Grid ---");
  const stackInfo = await evaluate(`(() => {
    const sec = document.querySelector('#stack');
    if (!sec) return { ok: false };
    const mobileBox = sec.querySelector('.sm\\\\:hidden');
    const tabs = mobileBox ? mobileBox.querySelectorAll('[role=\"tab\"]').length : 0;
    const activeTab = mobileBox ? mobileBox.querySelector('[role=\"tab\"][aria-selected=\"true\"]')?.innerText : null;
    const tiles = mobileBox ? mobileBox.querySelectorAll('.grid > *').length : 0;
    return { ok: true, tabs, activeTab, tiles };
  })()`);
  console.log("Stack mobile layout:", stackInfo);
  assert.ok(stackInfo.tabs > 0, "Harus ada tab kategori tech stack di mobile");
  assert.ok(stackInfo.tiles > 0 && stackInfo.tiles <= 6, "Tiles awal maksimal 6 (2 baris)");

  await evaluate(`document.querySelector('#stack')?.scrollIntoView()`);
  await sleep(500);
  await captureScreenshot("mobile-stack-compact.png");

  // Click second tab
  await evaluate(`(() => {
    const tabs = document.querySelectorAll('#stack .sm\\\\:hidden [role=\"tab\"]');
    if (tabs.length > 1) tabs[1].click();
  })()`);
  await sleep(300);
  const stackAfterTab = await evaluate(`(() => {
    const mobileBox = document.querySelector('#stack .sm\\\\:hidden');
    return {
      activeTab: mobileBox?.querySelector('[role=\"tab\"][aria-selected=\"true\"]')?.innerText,
      tiles: mobileBox?.querySelectorAll('.grid > *').length
    };
  })()`);
  console.log("Stack after tab click:", stackAfterTab);

  // 3. BLOG: Verify Carousel & CTA card
  console.log("\n--- Testing 3. Blog Carousel & CTA Card ---");
  await evaluate(`document.querySelector('#blog')?.scrollIntoView()`);
  await sleep(500);
  await captureScreenshot("mobile-blog-carousel.png");

  const blogState1 = await evaluate(`(() => {
    const sec = document.querySelector('#blog');
    const mobileCarousel = sec?.querySelector('.md\\\\:hidden');
    const indicator = mobileCarousel?.querySelector('[data-carousel-indicator]')?.innerText;
    const prevDisabled = mobileCarousel?.querySelector('button[aria-label*=\"sebelumnya\"]')?.disabled;
    const nextDisabled = mobileCarousel?.querySelector('button[aria-label*=\"berikutnya\"]')?.disabled;
    return { indicator, prevDisabled, nextDisabled };
  })()`);
  console.log("Blog carousel initial state:", blogState1);
  assert.equal(blogState1.prevDisabled, true, "Tombol prev blog awal harus disabled");

  // Click next through all slides to CTA card
  for (let i = 0; i < 6; i++) {
    await evaluate(`(() => {
      const btn = document.querySelector('#blog .md\\\\:hidden button[aria-label*=\"berikutnya\"]');
      if (btn && !btn.disabled) btn.click();
    })()`);
    await sleep(200);
  }

  const blogStateEnd = await evaluate(`(() => {
    const sec = document.querySelector('#blog');
    const mobileCarousel = sec?.querySelector('.md\\\\:hidden');
    const indicator = mobileCarousel?.querySelector('[data-carousel-indicator]')?.innerText;
    const prevDisabled = mobileCarousel?.querySelector('button[aria-label*=\"sebelumnya\"]')?.disabled;
    const nextDisabled = mobileCarousel?.querySelector('button[aria-label*=\"berikutnya\"]')?.disabled;
    const hasCtaBadge = Boolean(mobileCarousel?.innerText?.includes('CTA') || mobileCarousel?.innerText?.includes('Lihat Semua'));
    return { indicator, prevDisabled, nextDisabled, hasCtaBadge };
  })()`);
  console.log("Blog carousel end slide state:", blogStateEnd);
  assert.equal(blogStateEnd.nextDisabled, true, "Tombol next blog pada CTA slide harus disabled");
  assert.equal(blogStateEnd.prevDisabled, false, "Tombol prev blog pada CTA slide harus aktif");
  assert.ok(blogStateEnd.hasCtaBadge, "Harus memuat CTA slide");
  await captureScreenshot("mobile-blog-cta-slide.png");

  // 4. CERTIFICATES: Verify Circular Carousel
  console.log("\n--- Testing 4. Certificates Circular Carousel ---");
  await evaluate(`document.querySelector('#certificates')?.scrollIntoView()`);
  await sleep(500);

  const certState1 = await evaluate(`(() => {
    const sec = document.querySelector('#certificates');
    const mobileCarousel = sec?.querySelector('.sm\\\\:hidden');
    const indicator = mobileCarousel?.querySelector('[data-carousel-indicator]')?.innerText;
    const prevBtn = mobileCarousel?.querySelector('button[aria-label*=\"sebelumnya\"]');
    const nextBtn = mobileCarousel?.querySelector('button[aria-label*=\"berikutnya\"]');
    return {
      indicator,
      prevActive: prevBtn && !prevBtn.disabled,
      nextActive: nextBtn && !nextBtn.disabled,
    };
  })()`);
  console.log("Certificates initial state:", certState1);
  assert.ok(certState1.prevActive, "Prev button harus aktif (circular!)");
  assert.ok(certState1.nextActive, "Next button harus aktif (circular!)");
  await captureScreenshot("mobile-certificates-first.png");

  // Click Prev from first item -> should wrap to LAST item!
  await evaluate(`document.querySelector('#certificates .sm\\\\:hidden button[aria-label*=\"sebelumnya\"]')?.click()`);
  await sleep(300);
  const certStateWrapped = await evaluate(`(() => {
    const mobileCarousel = document.querySelector('#certificates .sm\\\\:hidden');
    return mobileCarousel?.querySelector('[data-carousel-indicator]')?.innerText;
  })()`);
  console.log("Certificates after Prev click from first (wrapped to last):", certStateWrapped);
  assert.ok(!certStateWrapped?.startsWith("1 /"), "Prev dari item 1 harus melingkar ke item terakhir");

  // Click Next from last item -> should wrap back to FIRST item!
  await evaluate(`document.querySelector('#certificates .sm\\\\:hidden button[aria-label*=\"berikutnya\"]')?.click()`);
  await sleep(300);
  const certStateBackToFirst = await evaluate(`(() => {
    const mobileCarousel = document.querySelector('#certificates .sm\\\\:hidden');
    return mobileCarousel?.querySelector('[data-carousel-indicator]')?.innerText;
  })()`);
  console.log("Certificates after Next click (wrapped back to first):", certStateBackToFirst);
  assert.ok(certStateBackToFirst?.startsWith("1 /"), "Next dari item terakhir harus melingkar kembali ke item 1");

  // Filter change resets index to 1
  await evaluate(`(() => {
    const tabs = document.querySelectorAll('#certificates [role=\"tab\"]');
    if (tabs.length > 1) tabs[1].click();
  })()`);
  await sleep(300);
  const certStateFilterReset = await evaluate(`(() => {
    const mobileCarousel = document.querySelector('#certificates .sm\\\\:hidden');
    return mobileCarousel?.querySelector('[data-carousel-indicator]')?.innerText;
  })()`);
  console.log("Certificates after filter click (reset to 1):", certStateFilterReset);
  assert.ok(certStateFilterReset?.startsWith("1 /"), "Filter tab harus me-reset posisi carousel ke item 1");

  // 5. CONTACT: Verify compact mobile form & font size
  console.log("\n--- Testing 5. Compact Contact Form ---");
  await evaluate(`document.querySelector('#kontak')?.scrollIntoView()`);
  await sleep(500);
  await captureScreenshot("mobile-contact-compact.png");

  const contactMetrics = await evaluate(`(() => {
    const sec = document.querySelector('#kontak');
    const input = sec?.querySelector('input#contact-name');
    const textarea = sec?.querySelector('textarea#contact-message');
    const btn = sec?.querySelector('button[type=\"submit\"]');
    return {
      inputFontSize: input ? window.getComputedStyle(input).fontSize : null,
      textareaHeight: textarea ? Math.round(textarea.getBoundingClientRect().height) : null,
      btnHeight: btn ? Math.round(btn.getBoundingClientRect().height) : null,
    };
  })()`);
  console.log("Contact metrics:", contactMetrics);
  assert.equal(contactMetrics.inputFontSize, "16px", "Input font size harus minimal 16px di mobile");
  assert.ok(contactMetrics.btnHeight >= 44, "Tombol submit harus memiliki tinggi minimal 44px");

  // 6. FAQ: Verify smaller comfortable font
  console.log("\n--- Testing 6. FAQ Section Font Refinement ---");
  await evaluate(`document.querySelector('#faq')?.scrollIntoView()`);
  await sleep(500);

  // Open first FAQ item to inspect answer
  await evaluate(`document.querySelector('#faq button')?.click()`);
  await sleep(300);

  const faqMetrics = await evaluate(`(() => {
    const sec = document.querySelector('#faq');
    const question = sec?.querySelector('[id^="faq-question-"] span');
    const answer = sec?.querySelector('[id^="faq-answer-"] p');
    return {
      qFontSize: question ? window.getComputedStyle(question).fontSize : null,
      qFontWeight: question ? window.getComputedStyle(question).fontWeight : null,
      aFontSize: answer ? window.getComputedStyle(answer).fontSize : null,
    };
  })()`);
  console.log("FAQ metrics:", faqMetrics);
  assert.ok(parseFloat(faqMetrics.qFontSize) <= 14, "Ukuran font pertanyaan FAQ harus ringkas (<= 14px)");
  assert.ok(parseFloat(faqMetrics.aFontSize) <= 13.5, "Ukuran font jawaban FAQ harus ringkas (<= 13.5px)");
  await captureScreenshot("mobile-faq-font.png");

  // Check 320px viewport for horizontal overflow
  console.log("\n--- Testing 320px viewport for horizontal overflow ---");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 320,
    height: 600,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(500);

  const overflow320 = await evaluate(`(() => {
    return {
      docWidth: document.documentElement.scrollWidth,
      winWidth: window.innerWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth
    };
  })()`);
  console.log("320px overflow check:", overflow320);
  assert.equal(overflow320.hasOverflow, false, "Tidak boleh ada horizontal overflow pada lebar 320px!");
  await captureScreenshot("mobile-320px-no-overflow.png");

  console.log("\n✅ SEMUA PENGUJIAN MOBILE LAYOUT BERHASIL 100%!");
}

main()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exitCode = 1;
  })
  .finally(stop);
