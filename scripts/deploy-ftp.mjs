// さくらインターネット向けFTPデプロイスクリプト（堅牢版）
// - さくらのFTPは複数階層の一括移動に非対応 → 1階層ずつ移動
// - 一部ファイルが書き込み禁止権限 → 550 Permission denied 時は SITE CHMOD 644 で自動修正して再試行
// - 一時的な切断(ECONNRESET等) → 再接続して続きから再開
// _site/ の内容を www/sakurai-crc.org/ にアップロード（追加・上書きのみ。削除はしない）
import { Client } from "basic-ftp";
import { promises as fs } from "node:fs";
import path from "node:path";

const HOST = process.env.FTP_SERVER;
const USER = process.env.FTP_USERNAME;
const PASS = process.env.FTP_PASSWORD;
const BASE = ["www", "sakurai-crc.org"];
const LOCAL = "_site";

if (!HOST || !USER || !PASS) {
  console.error("FTP_SERVER / FTP_USERNAME / FTP_PASSWORD が設定されていません");
  process.exit(1);
}

async function collect(dir, rel = "") {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const lp = path.join(dir, e.name);
    const rp = rel ? rel + "/" + e.name : e.name;
    if (e.isDirectory()) out.push(...(await collect(lp, rp)));
    else out.push({ local: lp, rel: rp });
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

let client;
let curDir = [];
async function connect() {
  client = new Client(60000);
  await client.access({ host: HOST, user: USER, password: PASS, secure: false });
  for (const s of BASE) await client.cd(s);
  curDir = [];
}
async function goTo(segs) {
  let common = 0;
  while (common < curDir.length && common < segs.length && curDir[common] === segs[common]) common++;
  for (let i = curDir.length; i > common; i--) await client.cdup();
  for (let i = common; i < segs.length; i++) {
    try {
      await client.cd(segs[i]);
    } catch {
      await client.send("MKD " + segs[i]).catch(() => {});
      await client.cd(segs[i]);
    }
  }
  curDir = segs.slice();
}

const files = await collect(LOCAL);
console.log(`アップロード対象: ${files.length} ファイル`);
await connect();
console.log(`接続成功。アップロード先: ${await client.pwd()}`);

const failed = [];
let okCount = 0;
for (const f of files) {
  const segs = f.rel.split("/");
  const name = segs.pop();
  let done = false;
  let lastErr = "";
  for (let attempt = 1; attempt <= 3 && !done; attempt++) {
    try {
      await goTo(segs);
      await client.uploadFrom(f.local, name);
      done = true;
    } catch (e) {
      lastErr = String(e.message || e);
      if (/permission denied/i.test(lastErr)) {
        // 権限を修正して再試行
        try {
          await client.send(`SITE CHMOD 644 ${name}`);
          await client.uploadFrom(f.local, name);
          done = true;
          console.log(`権限を修正して上書き: ${f.rel}`);
        } catch (e2) {
          lastErr = String(e2.message || e2);
        }
      } else {
        // 接続系エラー: 再接続
        try { client.close(); } catch {}
        await new Promise((r) => setTimeout(r, 3000));
        try { await connect(); } catch (e3) { lastErr = String(e3.message || e3); }
      }
    }
  }
  if (done) {
    okCount++;
  } else {
    failed.push(`${f.rel} (${lastErr})`);
    console.log(`失敗: ${f.rel} (${lastErr})`);
  }
}

console.log(`完了: 成功 ${okCount} / ${files.length}`);
client.close();
if (failed.length > 0) {
  console.error(`以下の ${failed.length} ファイルが失敗しました:`);
  for (const f of failed) console.error("  " + f);
  process.exit(1);
}
console.log("デプロイ成功");
