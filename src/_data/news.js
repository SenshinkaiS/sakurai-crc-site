// お知らせデータ
// microCMS 設定があれば news API から取得、なければ legacy/news-data.js を使用。
// 返す形: [{ dateISO, dateDisplay, title, bodyHtml }]
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { marked } = require("marked");
const japanDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

async function fromMicroCMS(domain, key) {
  const contents = [];
  let offset = 0;
  while (true) {
    const url = `https://${domain}.microcms.io/api/v1/news?limit=100&offset=${offset}&orders=-date`;
    const res = await fetch(url, { headers: { "X-MICROCMS-API-KEY": key } });
    if (!res.ok) throw new Error(`microCMS news API error: ${res.status}`);
    const json = await res.json();
    contents.push(...json.contents);
    offset += json.contents.length;
    if (!json.contents.length || offset >= (json.totalCount ?? offset)) break;
  }
  return contents
    .filter((item) => {
      if (!item.date || !item.title) {
        console.warn(`[data] news: 日付またはタイトルが未入力のためスキップ (id: ${item.id})`);
        return false;
      }
      return true;
    })
    .map((item) => ({
      dateISO: japanDate.format(new Date(item.date)),
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
  // 活動報告は「お知らせ」と同じ画面から更新する。古い報告も残すため全件から抽出。
  const activityPrefix = /^\s*【活動報告】\s*/u;
  const staffActivities = items
    .filter((item) => activityPrefix.test(item.title))
    .map((item) => ({
      ...item,
      title: item.title.replace(activityPrefix, "").trim(),
    }))
    .filter((item) => item.title);
  return { all: items, recent, staffActivities };
};
