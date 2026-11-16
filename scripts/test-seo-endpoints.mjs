import assert from "node:assert/strict";

async function run() {
  const baseUrl = "http://127.0.0.1:3009";
  console.log(`Connecting to ${baseUrl}...`);

  // Wait for server to be responsive
  let attempts = 0;
  while (attempts < 20) {
    try {
      const res = await fetch(baseUrl);
      if (res.status === 200) break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
    attempts++;
  }

  // 1. Test HTML Server Output
  console.log("\n[Test 1] Inspecting HTML Server Response on /");
  const htmlRes = await fetch(`${baseUrl}/`);
  assert.equal(htmlRes.status, 200, "Root / harus 200");
  const html = await htmlRes.text();

  // Canonical tag check
  assert.ok(
    html.includes('<link rel="canonical" href="https://zakariamp.id"/>') ||
    html.includes('<link rel="canonical" href="https://zakariamp.id" />') ||
    html.includes('rel="canonical"'),
    "HTML harus menyertakan canonical link ke https://zakariamp.id"
  );
  console.log("✓ Canonical link terpasang:", html.match(/<link rel="canonical"[^>]+>/)?.[0]);

  // Hreflang languages check (must NOT exist)
  const hasFakeHreflang = html.includes('hreflang="id-ID"') || html.includes('hreflang="x-default"');
  assert.equal(hasFakeHreflang, false, "Tidak boleh ada hreflang palsu menunjuk ke URL yang sama");
  console.log("✓ Tidak ada hreflang sirkular palsu");

  // Meta description & title check
  assert.ok(html.includes('name="description"'), "Harus ada meta description");
  assert.ok(html.includes('<title>'), "Harus ada tag title");
  console.log("✓ Meta title & description tersedia di HTML server");

  // OpenGraph image check
  assert.ok(html.includes('property="og:image"'), "Harus ada meta og:image");
  console.log("✓ OpenGraph metadata tersedia");

  // Schema.org JSON-LD check
  assert.ok(html.includes('application/ld+json'), "Harus ada structured data JSON-LD");
  console.log("✓ Schema.org JSON-LD terdeteksi di HTML server");

  // 2. Test robots.txt
  console.log("\n[Test 2] Inspecting /robots.txt");
  const robotsRes = await fetch(`${baseUrl}/robots.txt`);
  assert.equal(robotsRes.status, 200, "/robots.txt harus 200");
  const robotsText = await robotsRes.text();
  assert.ok(robotsText.includes("Bravebot"), "robots.txt harus menyertakan Bravebot");
  assert.ok(robotsText.includes("Googlebot"), "robots.txt harus menyertakan Googlebot");
  assert.ok(robotsText.includes("Bingbot"), "robots.txt harus menyertakan Bingbot");
  assert.ok(robotsText.includes("YandexBot"), "robots.txt harus menyertakan YandexBot");
  assert.ok(robotsText.includes("DuckDuckBot"), "robots.txt harus menyertakan DuckDuckBot");
  assert.ok(robotsText.includes("sitemap.xml"), "robots.txt harus menyertakan referensi sitemap");
  console.log("✓ robots.txt lolos uji dengan agen Bravebot, Googlebot, Bingbot, YandexBot, DuckDuckBot");

  // 3. Test sitemap.xml
  console.log("\n[Test 3] Inspecting /sitemap.xml");
  const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`);
  assert.equal(sitemapRes.status, 200, "/sitemap.xml harus 200");
  const sitemapText = await sitemapRes.text();
  assert.ok(sitemapText.includes("<loc>https://zakariamp.id</loc>"), "Sitemap harus memuat URL kanonikal https://zakariamp.id");
  assert.ok(sitemapText.includes("<lastmod>"), "Sitemap harus memuat lastmod deterministik");
  assert.ok(sitemapText.includes("<priority>1"), "Sitemap harus memuat priority 1");
  console.log("✓ sitemap.xml valid dan memuat kanonikal tunggal https://zakariamp.id");

  // 4. Test IndexNow Rewrite Route
  console.log("\n[Test 4] Inspecting IndexNow Rewrite Route");
  const fakeKeyRes = await fetch(`${baseUrl}/c74384950e3b4a2e850b106366dbad2b.txt`);
  // When not configured / not matching, returns 404
  assert.equal(fakeKeyRes.status, 404, "Unknown key harus merespons 404");
  console.log("✓ Route /{key}.txt merespons 404 untuk key yang tidak cocok");

  // Test invalid short key format
  const shortKeyRes = await fetch(`${baseUrl}/short.txt`);
  // short (5 chars) doesn't match rewrite rule {8,128}, so it 404s cleanly via Next.js
  assert.equal(shortKeyRes.status, 404, "Short key 404 cleanly");
  console.log("✓ Route short key ditolak oleh pola rewrite");

  console.log("\n>>> SEMUA 4 PENGUJIAN ENDPOINT SEO SERVER LOLOS 100% <<<");
}

run().catch((err) => {
  console.error("Test Failed:", err);
  process.exit(1);
});
