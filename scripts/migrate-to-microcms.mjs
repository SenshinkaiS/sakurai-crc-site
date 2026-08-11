// 既存データ（legacy/news-data.js, legacy/blog-data.js）を microCMS に全件投入するスクリプト
// 使い方:  .env に MICROCMS_SERVICE_DOMAIN と MICROCMS_API_KEY を設定して
//   npm run migrate
// ※ APIキーには「POST権限」が必要（microCMSのAPIキー設定で有効化）
import "dotenv/config";
import fs from "node:fs";
import vm from "node:vm";
import { marked } from "marked";

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
if (!DOMAIN || !KEY) {
  console.error("環境変数 MICROCMS_SERVICE_DOMAIN / MICROCMS_API_KEY を .env に設定してください");
  process.exit(1);
}

const LEGACY_SLUGS = {
  1: "spring-heart-health", 2: "snoring-sleep-apnea", 3: "cardiac-rehab-future",
  4: "hypertension-checkup", 5: "rainy-season-heart-care", 6: "central-sleep-apnea",
  7: "shingles-vaccine", 8: "ckd-exercise", 9: "summer-hydration-heart-failure",
  10: "stable-angina-treatment", 11: "aging-two-ages",
};

function loadLegacy(file, varName) {
  const src = fs.readFileSync(file, "utf8");
  const ctx = {};
  vm.createContext(ctx);
  return vm.runInContext(src + ";" + varName + ";", ctx);
}
function isoFromJa(ja) {
  const m = ja.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  return m ? `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}` : null;
}

async function post(api, body) {
  const res = await fetch(`https://${DOMAIN}.microcms.io/api/v1/${api}`, {
    method: "POST",
    headers: { "X-MICROCMS-API-KEY": KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${api} POST失敗 (${res.status}): ${await res.text()}`);
  return res.json();
}

// --- お知らせ ---
const news = loadLegacy("legacy/news-data.js", "newsData");
console.log(`お知らせ ${news.length} 件を投入します...`);
for (const n of [...news].reverse()) {
  await post("news", {
    title: n.title,
    date: `${n.date}T09:00:00.000Z`,
    body: marked.parse(n.content || ""),
  });
  console.log(`  ✓ ${n.date} ${n.title}`);
}

// --- ブログ ---
const blog = loadLegacy("legacy/blog-data.js", "blogData");
console.log(`ブログ記事 ${blog.length} 件を投入します...`);
for (const p of [...blog].sort((a, b) => a.id - b.id)) {
  await post("blog", {
    title: p.title,
    date: `${isoFromJa(p.date)}T09:00:00.000Z`,
    slug: LEGACY_SLUGS[p.id] || `post-${p.id}`,
    legacyId: p.id,
    excerpt: p.excerpt || "",
    categories: (p.categories || []).join(", "),
    tags: (p.tags || []).join(", "),
    eyecatchPath: p.image,
    eyecatchAlt: p.alt || "",
    body: marked.parse(p.fullContent || ""),
  });
  console.log(`  ✓ [${p.id}] ${p.title}`);
}
console.log("完了。microCMSの管理画面で件数と内容を確認してください。");
