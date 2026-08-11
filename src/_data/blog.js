// ブログ記事データ
// MICROCMS_SERVICE_DOMAIN / MICROCMS_API_KEY が設定されていれば microCMS から取得し、
// 未設定の場合は legacy/blog-data.js（旧クライアントサイドデータ）を読み込む。
// どちらの場合も同じ形に正規化して返す:
// { id, slug, title, dateISO, dateJa, image, alt, excerpt, categories[], tags[], bodyHtml }
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { marked } = require("marked");

// 旧記事ID → スラッグ対応表（URL・リダイレクトに使用。変更しないこと）
const LEGACY_SLUGS = {
  1: "spring-heart-health",
  2: "snoring-sleep-apnea",
  3: "cardiac-rehab-future",
  4: "hypertension-checkup",
  5: "rainy-season-heart-care",
  6: "central-sleep-apnea",
  7: "shingles-vaccine",
  8: "ckd-exercise",
  9: "summer-hydration-heart-failure",
  10: "stable-angina-treatment",
  11: "aging-two-ages",
};

function jaDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
function isoFromJa(ja) {
  const m = ja.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  return m ? `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}` : null;
}

async function fromMicroCMS(domain, key) {
  const url = `https://${domain}.microcms.io/api/v1/blog?limit=100&orders=-date`;
  const res = await fetch(url, { headers: { "X-MICROCMS-API-KEY": key } });
  if (!res.ok) throw new Error(`microCMS blog API error: ${res.status}`);
  const json = await res.json();
  return json.contents
    .filter((item) => {
      if (!item.date || !item.title || !item.slug) {
        console.warn(`[data] blog: 日付・タイトル・スラッグのいずれかが未入力のためスキップ (id: ${item.id})`);
        return false;
      }
      return true;
    })
    .map((item) => ({
    id: item.legacyId ?? null,
    slug: item.slug,
    title: item.title,
    dateISO: item.date.slice(0, 10),
    dateJa: jaDate(item.date),
    image: item.eyecatchPath || (item.eyecatch ? item.eyecatch.url : "../images/logo-sakurai-clinic.png"),
    alt: item.eyecatchAlt || item.title,
    excerpt: item.excerpt || "",
    categories: (item.categories || "").split(",").map((s) => s.trim()).filter(Boolean),
    tags: (item.tags || "").split(",").map((s) => s.trim()).filter(Boolean),
    bodyHtml: item.body || "",
  }));
}

function fromLegacy() {
  const file = path.join(__dirname, "../../legacy/blog-data.js");
  const src = fs.readFileSync(file, "utf8");
  const ctx = {};
  vm.createContext(ctx);
  const data = vm.runInContext(src + ";blogData;", ctx);
  return data.map((p) => ({
    id: p.id,
    slug: LEGACY_SLUGS[p.id] || `post-${p.id}`,
    title: p.title,
    dateISO: isoFromJa(p.date),
    dateJa: p.date,
    image: p.image,
    alt: p.alt || p.title,
    excerpt: p.excerpt || "",
    categories: p.categories || [],
    tags: p.tags || [],
    bodyHtml: marked.parse(p.fullContent || ""),
  }));
}

module.exports = async function () {
  const domain = process.env.MICROCMS_SERVICE_DOMAIN;
  const key = process.env.MICROCMS_API_KEY;
  let posts;
  if (domain && key) {
    posts = await fromMicroCMS(domain, key);
    console.log(`[data] blog: microCMS から ${posts.length} 件取得`);
  } else {
    posts = fromLegacy();
    console.log(`[data] blog: legacy/blog-data.js から ${posts.length} 件読み込み（microCMS未設定）`);
  }
  posts.sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));

  // サイドバー用の集計
  const categories = [...new Set(posts.flatMap((p) => p.categories))].sort();
  const tags = [...new Set(posts.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, "ja"));
  const months = [...new Set(posts.map((p) => p.dateISO.slice(0, 7)))].sort().reverse();
  return { posts, categories, tags, months };
};
