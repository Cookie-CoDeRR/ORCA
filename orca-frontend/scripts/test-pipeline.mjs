/**
 * Project ORCA - News & Image Proxy Pipeline Automated Test Suite
 *
 * Tests:
 * 1. Live Remote Image Ingestion & Proxy (bypasses CORS/hotlinking)
 * 2. Broken/Expired URL Fallback Interception (zero broken images guarantee)
 * 3. OpenGraph & Meta Extractor Service
 * 4. News Engine Live Ingestion API (/api/news)
 * 5. All Ingested News Images Reachability (every slide image returns 200 OK)
 */

const BASE_URL = "http://localhost:3000";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${message}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  ORCA News & Image Proxy Pipeline Test Suite");
  console.log("=======================================================\n");

  // TEST 1: Live Remote Image Ingestion via /api/proxy-image
  console.log("[Test 1] Testing live remote image proxying...");
  try {
    const remoteUrl = "https://assets.science.nasa.gov/dynamicimage/assets/science/esd/eo/images/iotd/2026/dust-storm-sweeps-over-mali/malidust_tmo_20260905.jpg";
    const res = await fetch(`${BASE_URL}/api/proxy-image?url=${encodeURIComponent(remoteUrl)}&category=EARTH_OBSERVATION`);
    
    assert(res.status === 200, `HTTP status is 200 OK (received ${res.status})`);
    
    const contentType = res.headers.get("content-type") || "";
    assert(contentType.startsWith("image/"), `Content-Type is image/* (received ${contentType})`);
    
    const imageSource = res.headers.get("x-image-source");
    assert(imageSource === "ORCA-Proxy-Ingested", `X-Image-Source is ORCA-Proxy-Ingested (received ${imageSource})`);
    
    const buffer = await res.arrayBuffer();
    assert(buffer.byteLength > 10000, `Image binary payload received (${buffer.byteLength} bytes)`);
  } catch (err) {
    assert(false, `Test 1 threw error: ${err.message}`);
  }

  // TEST 2: Broken/Expired URL Interception with Semantic Fallback
  console.log("\n[Test 2] Testing broken/expired URL interception (fallback guarantee)...");
  try {
    const fakeUrl = "https://broken-expired-domain-404.com/missing-cyclone.jpg";
    const res = await fetch(`${BASE_URL}/api/proxy-image?url=${encodeURIComponent(fakeUrl)}&category=CYCLONE`);
    
    assert(res.status === 200, `HTTP status is 200 OK despite broken remote URL (received ${res.status})`);
    
    const contentType = res.headers.get("content-type") || "";
    assert(contentType.startsWith("image/"), `Content-Type is image/* (received ${contentType})`);
    
    const imageSource = res.headers.get("x-image-source");
    assert(imageSource === "ORCA-Semantic-Fallback", `X-Image-Source is ORCA-Semantic-Fallback (received ${imageSource})`);
    
    const buffer = await res.arrayBuffer();
    assert(buffer.byteLength > 10000, `Fallback image payload served (${buffer.byteLength} bytes)`);
  } catch (err) {
    assert(false, `Test 2 threw error: ${err.message}`);
  }

  // TEST 3: Semantic Fallback Category Mapping for Fisheries & Defense
  console.log("\n[Test 3] Testing semantic topic fallback accuracy...");
  try {
    const resFish = await fetch(`${BASE_URL}/api/proxy-image?url=https://dead-link.com/photo.jpg&category=FISHERIES`);
    assert(resFish.status === 200, "Fisheries fallback returns 200 OK");
    assert(resFish.headers.get("x-image-source") === "ORCA-Semantic-Fallback", "Fisheries serves semantic fallback");

    const resDef = await fetch(`${BASE_URL}/api/proxy-image?url=https://dead-link.com/photo.jpg&category=DEFENSE`);
    assert(resDef.status === 200, "Defense fallback returns 200 OK");
    assert(resDef.headers.get("x-image-source") === "ORCA-Semantic-Fallback", "Defense serves semantic fallback");
  } catch (err) {
    assert(false, `Test 3 threw error: ${err.message}`);
  }

  // TEST 4: News Engine Live Feed Ingestion (/api/news)
  console.log("\n[Test 4] Testing news engine ingestion endpoint (/api/news)...");
  let newsData = null;
  try {
    const res = await fetch(`${BASE_URL}/api/news`);
    assert(res.status === 200, `HTTP status is 200 OK (received ${res.status})`);
    
    newsData = await res.json();
    assert(Array.isArray(newsData.heroStories), "heroStories is an array");
    assert(newsData.heroStories.length >= 3, `heroStories contains at least 3 rotating stories (found ${newsData.heroStories.length})`);
    assert(!!newsData.centerFeature, "centerFeature exists");
    assert(Array.isArray(newsData.stackedFeatures), "stackedFeatures is an array");
    assert(Array.isArray(newsData.secondaryUpdates), "secondaryUpdates is an array");
  } catch (err) {
    assert(false, `Test 4 threw error: ${err.message}`);
  }

  // TEST 5: Verify Every Hero Cycle Slide Image is Accessible (Zero Broken Slides)
  console.log("\n[Test 5] Verifying all news carousel slide images return 200 OK...");
  if (newsData && newsData.heroStories) {
    for (let i = 0; i < newsData.heroStories.length; i++) {
      const story = newsData.heroStories[i];
      try {
        const fullImgUrl = story.img.startsWith("http") ? story.img : `${BASE_URL}${story.img}`;
        const imgRes = await fetch(fullImgUrl);
        assert(imgRes.status === 200, `Slide ${i + 1} image resolves 200 OK: "${story.title.slice(0, 35)}..." (${story.img.slice(0, 40)}...)`);
      } catch (err) {
        assert(false, `Slide ${i + 1} image failed: ${err.message}`);
      }
    }
  }

  // TEST 6: Landing Page Root Status
  console.log("\n[Test 6] Testing root landing page render...");
  try {
    const res = await fetch(`${BASE_URL}/`);
    assert(res.status === 200, `Landing page responds with 200 OK`);
    const html = await res.text();
    const hasAlertsHeading = html.includes("Featured Alerts & Operations") || html.includes("Featured Alerts &amp; Operations");
    assert(hasAlertsHeading, "Featured Alerts section is rendered in HTML");
    assert(html.includes("Sovereign Marine Intelligence"), "Hero heading is present in HTML");
  } catch (err) {
    assert(false, `Test 6 threw error: ${err.message}`);
  }

  // Summary
  console.log("\n=======================================================");
  console.log(`  Results: ${passed} Passed, ${failed} Failed`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
