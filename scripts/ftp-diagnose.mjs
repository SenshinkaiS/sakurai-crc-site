// FTP接続診断: ログイン直後の現在地とフォルダ構成を表示する
import { Client } from "basic-ftp";
const c = new Client(30000);
c.ftp.verbose = false;
try {
  await c.access({
    host: process.env.FTP_SERVER,
    user: process.env.FTP_USERNAME,
    password: process.env.FTP_PASSWORD,
    secure: false,
  });
  console.log("== ログイン直後の現在地 (PWD) ==");
  console.log(await c.pwd());
  console.log("== 現在地のフォルダ一覧 ==");
  for (const f of await c.list()) console.log((f.isDirectory ? "[DIR] " : "      ") + f.name);
  for (const p of ["/www", "www", "/home", "/www/sakurai-crc.org", "www/sakurai-crc.org"]) {
    try {
      await c.cd(p);
      console.log(`== cd "${p}" → 成功。現在地: ${await c.pwd()} ==`);
      const l = await c.list();
      console.log(l.slice(0, 8).map(f => (f.isDirectory ? "[DIR] " : "      ") + f.name).join("\n"));
    } catch (e) {
      console.log(`== cd "${p}" → 失敗: ${e.message} ==`);
    }
  }
} finally {
  c.close();
}

// ---- 書き込みテスト ----
import { Readable } from "node:stream";
const c2 = new Client(30000);
try {
  await c2.access({ host: process.env.FTP_SERVER, user: process.env.FTP_USERNAME, password: process.env.FTP_PASSWORD, secure: false });
  await c2.cd("www");
  await c2.cd("sakurai-crc.org");
  console.log("== 書き込みテスト: deploy-test.txt を1件アップロード ==");
  await c2.uploadFrom(Readable.from(["deploy test " + new Date().toISOString()]), "deploy-test.txt");
  console.log("アップロード成功");
  await c2.remove("deploy-test.txt");
  console.log("テストファイル削除成功（書き込みは正常です）");
} catch (e) {
  console.log("書き込みテスト失敗:", e.message);
} finally {
  c2.close();
}
