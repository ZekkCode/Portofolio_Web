import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const targetUrl = process.env.TARGET_URL ?? "http://localhost:3000";
const port = 9500 + Math.floor(Math.random() * 400);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const artifactDir = "C:/Users/ZakariaMP/.gemini/antigravity/brain/cdb3f98c-3687-475a-9e32-7254f03effea/screenshots";
mkdirSync(artifactDir, { recursive: true });

const chrome =
  process.env.CHROME_PATH ??
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find((path) => existsSync(path));

assert.ok(chrome, "Chrome browser not found on host");

const profile = mkdtempSync(join(tmpdir(), "zekk-inspect-"));
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

let ws;
let nextId = 0;
const pending = new Map();
const consoleLogs = [];
const failedRequests = [];

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
  await send("Emulation.setTouchEmulationEnabled", {
    enabled: isMobile,
  });
};

const setTheme = async (theme) => {
  await send("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [{ name: "prefers-color-scheme", value: theme }],
  });
  await evaluate(`(() => {
    const html = document.documentElement;
    if (${JSON.stringify(theme)} === "dark") {
      html.classList.add("dark");
      html.classList.remove("light");
      html.style.colorScheme = "dark";
    } else {
      html.classList.remove("dark");
      html.classList.add("light");
      html.style.colorScheme = "light";
    }
  })()`);
};

const captureScreenshot = async (name) => {
  const { data } = await send("Page.captureScreenshot", {
    format: "png",
  });
  const filePath = join(artifactDir, `${name}.png`);
  writeFileSync(filePath, Buffer.from(data, "base64"));
  console.log(`Saved screenshot: ${name}.png`);
  return filePath;
};

try {
  console.log(`Checking Chrome connection on port ${port}...`);
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
  console.log("Chrome connection established");

  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = list.find((item) => item.type === "page");
  assert.ok(page, "No target page available");

  ws = new WebSocket(page.webSocketDebuggerUrl);
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.consoleAPICalled") {
      const text = message.params.args.map((a) => a.value ?? a.description ?? "").join(" ");
      consoleLogs.push({ type: message.params.type, text });
    }
    if (message.method === "Network.responseReceived") {
      const res = message.params.response;
      if (res.status >= 400) {
        failedRequests.push({ url: res.url, status: res.status });
      }
    }
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  });

  await new Promise((resolve) => ws.addEventListener("open", resolve));
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");

  console.log(`Navigating to ${targetUrl}...`);
  await send("Page.navigate", { url: targetUrl });
  await sleep(4000);

  const viewports = [
    { width: 360, height: 740, mobile: true, label: "mobile-360" },
    { width: 390, height: 844, mobile: true, label: "mobile-390" },
    { width: 768, height: 1024, mobile: false, label: "tablet-768" },
    { width: 1024, height: 768, mobile: false, label: "desktop-1024" },
    { width: 1440, height: 900, mobile: false, label: "desktop-1440" },
  ];

  const results = {
    target: targetUrl,
    viewports: {},
    overflowIssues: [],
    consoleErrors: [],
    failedRequests: [],
    interactiveTests: {},
  };

  const prefix = process.env.SCREENSHOT_PREFIX ?? "after";

  for (const vp of viewports) {
    for (const theme of ["light", "dark"]) {
      await setViewport(vp.width, vp.height, vp.mobile);
      await setTheme(theme);
      await sleep(1000);

      const overflow = await evaluate(`(() => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
        const clientW = window.innerWidth;
        const hasOverflow = scrollW > clientW + 1;
        return {
          scrollWidth: scrollW,
          clientWidth: clientW,
          overflowPx: scrollW - clientW,
          hasOverflow
        };
      })()`);

      const screenshotName = `${prefix}-${vp.label}-${theme}`;
      await captureScreenshot(screenshotName);

      results.viewports[`${vp.label}-${theme}`] = {
        viewport: vp,
        theme,
        overflow,
      };

      if (overflow.hasOverflow) {
        results.overflowIssues.push({
          viewport: vp.label,
          theme,
          overflowPx: overflow.overflowPx,
        });
      }
    }
  }

  // Uji komponen DOM & target sentuh
  const interactiveCheck = await evaluate(`(() => {
    const canvas = document.querySelector("canvas");
    const hasCanvas = !!canvas;
    const canvasDetails = canvas ? { w: canvas.width, h: canvas.height } : null;
    const hasFolder = !!document.getElementById("cv");
    const hasProjects = !!document.getElementById("proyek");
    const hasCertificates = !!document.getElementById("certificates");
    const hasServices = !!document.getElementById("services");
    const hasFaq = !!document.getElementById("faq");
    const hasContact = !!document.getElementById("kontak");

    // Touch targets < 44px
    const interactiveElements = [...document.querySelectorAll("button, a, input, select, textarea")].map(el => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30),
        width: Math.round(r.width),
        height: Math.round(r.height),
      };
    });

    const smallTouchTargets = interactiveElements.filter(el => el.width > 0 && el.height > 0 && (el.width < 44 || el.height < 44));

    return {
      hasCanvas,
      canvasDetails,
      hasFolder,
      hasProjects,
      hasCertificates,
      hasServices,
      hasFaq,
      hasContact,
      totalInteractive: interactiveElements.length,
      smallTouchTargetsCount: smallTouchTargets.length,
      sampleSmallTargets: smallTouchTargets.slice(0, 8)
    };
  })()`);

  results.interactiveTests = interactiveCheck;
  results.consoleErrors = consoleLogs.filter(c => c.type === "error");
  results.failedRequests = failedRequests;

  console.log("=== INSPECTION RESULTS ===");
  console.log(JSON.stringify(results, null, 2));

} catch (err) {
  console.error("Inspection error:", err);
} finally {
  await stop();
  process.exit(0);
}

