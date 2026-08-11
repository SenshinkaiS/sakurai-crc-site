// お知らせデータ
// microCMS 設定があれば news API から取得、なければ legacy/news-data.js を使用。
// 返す形: [{ dateISO, dateDisplay, title, bodyHtml }]
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { marked } = require("marked");

async function fromMicroCMS(domain, key) {
  const url = `https://${domain}.microcms.io/api/v1/news?limit=100&orders=-date`;
  const res = await fetch(url, { headers: { "X-MICROCMS-API-KEY": key } });
  if (!res.ok) throw new Error(`microCMS news API error: ${res.status}`);
  const json = await res.json();
  return json.contents.map((item) => ({
    dateISO: item.date.slice(0, 10),
    title: item.title,
    bodyHtml: item.body || "",
  }));
}

function fromLegacy() {
  const file = path.join(__dirname, "../../legacy/news-data.js");
  const src = fs.readFileSync(file, "utf8");
  const ctx = {};
  vm.createContext(ctx);
  const data = vm.runInContext(src + ";newsData;", ctx);
  return data.map((n) => ({
    dateISO: n.date,
    title: n.title,
    bodyHtml: marked.parse(n.content || ""),
  }));
}

module.exports = async function () {
  const domain = process.env.MICROCMS_SERVICE_DOMAIN;
  const key = process.env.MICROCMS_API_KEY;
  let items;
  if (domain && key) {
    items = await fromMicroCMS(domain, key);
    console.log(`[data] news: microCMS から ${items.length} 件取得`);
  } else {
    items = fromLegacy();
    console.log(`[data] news: legacy/news-data.js から ${items.length} 件読み込み（microCMS未設定）`);
  }
  items.sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
  items.forEach((n) => (n.dateDisplay = n.dateISO.replace(/-/g, ".")));

  // トップページ用: 直近3ヶ月以内（3件未満なら直近3件）
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  let recent = items.filter((n) => new Date(n.dateISO) >= threeMonthsAgo);
  if (recent.length < 3) recent = items.slice(0, 3);
  return { all: items, recent };
};
