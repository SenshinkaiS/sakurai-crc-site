// さくらインターネット向けFTPデプロイスクリプト
// さくらのFTPは複数階層の一括移動(CWD a/b)に非対応のため、1階層ずつ移動する。
// _site/ の内容を /home/<アカウント>/www/sakurai-crc.org/ にアップロードする（追加・上書きのみ。削除はしない）。
import { Client } from "basic-ftp";

const HOST = process.env.FTP_SERVER;
const USER = process.env.FTP_USERNAME;
const PASS = process.env.FTP_PASSWORD;
// ログイン直下(/home/<アカウント>)からの相対パスを1階層ずつ
const TARGET_SEGMENTS = ["www", "sakurai-crc.org"];

if (!HOST || !USER || !PASS) {
  console.error("FTP_SERVER / FTP_USERNAME / FTP_PASSWORD が設定されていません");
  process.exit(1);
}

const client = new Client(120000);
client.ftp.verbose = false;

try {
  await client.access({ host: HOST, user: USER, password: PASS, secure: false });
  console.log(`ログイン成功。現在地: ${await client.pwd()}`);

  for (const seg of TARGET_SEGMENTS) {
    await client.cd(seg);
  }
  console.log(`アップロード先: ${await client.pwd()}`);

  console.log("_site/ の内容をアップロードします（追加・上書きのみ、削除なし）...");
  const started = Date.now();
  await client.uploadFromDir("_site");
  console.log(`アップロード完了 (${Math.round((Date.now() - started) / 1000)}秒)`);
} catch (err) {
  console.error("デプロイ失敗:", err.message);
  process.exit(1);
} finally {
  client.close();
}
