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
