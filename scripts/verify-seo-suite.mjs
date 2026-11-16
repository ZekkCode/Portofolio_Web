import assert from "node:assert/strict";
import http from "node:http";
import next from "next";
import { normalizeConfig, defaultSiteConfig } from "../src/lib/site-config.js";
import { validateSiteConfigPayload } from "../src/lib/config-validator.js";
import { submitIndexNow, triggerIndexNowIfConfigured } from "../src/lib/indexnow.js";

console.log("=== SEO SUITE VERIFICATION ===");

// 1. Validator Tests
console.log("\n[Test 1] Config Validator sanitizes and rejects malicious verification tokens");
const maliciousPayload = {
  ...defaultSiteConfig,
  seo: {
    ...defaultSiteConfig.seo,
    googleVerification: "<script>alert(1)</script>",
    bingVerification: 'token"onclick="hack()',
    yandexVerification: "normal-valid-token-12345",
    indexNowKey: "x".repeat(150), // exceeds 128
  },
};

const valRes = validateSiteConfigPayload(maliciousPayload);
assert.equal(valRes.isValid, false, "Harus menolak payload dengan token berbahaya atau terlalu panjang");
assert.ok(valRes.errors.some((e) => e.includes("Google Search Console")), "Harus mendeteksi tag script pada googleVerification");
assert.ok(valRes.errors.some((e) => e.includes("Bing Webmaster")), "Harus mendeteksi kutip pada bingVerification");
assert.ok(valRes.errors.some((e) => e.includes("IndexNow API Key")), "Harus mendeteksi panjang berlebih pada indexNowKey");
console.log("✓ Config validator berhasil memblokir token berbahaya & karakter tidak aman");

// 2. Normalizer Tests
console.log("\n[Test 2] Normalizer membersihkan dan memotong token");
const norm = normalizeConfig({
  seo: {
    googleVerification: "  <b>token123</b>  ",
    bingVerification: '  "bingtoken"  ',
    indexNowKey: "  c74384950e3b4a2e850b106366dbad2b  ",
  },
});
assert.equal(norm.seo.googleVerification, "token123");
assert.equal(norm.seo.bingVerification, "bingtoken");
assert.equal(norm.seo.indexNowKey, "c74384950e3b4a2e850b106366dbad2b");
console.log("✓ Normalizer membersihkan token dengan sempurna");

console.log("\nSemua unit test SEO lolos.");
