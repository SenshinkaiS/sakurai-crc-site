# GitHub設定書 — 医療法人千心会 櫻井医院 公式サイト

作成日: 2026年8月16日 ／ 対象システム: https://sakurai-crc.org

この文書は、公式サイトのソースコード管理と自動ビルド・自動デプロイを担う
GitHub の設定を記録したものです。microCMS側の設定は「microCMS設定書」を参照。

---

## 1. GitHubの役割

GitHubはこのサイト運用で3つの役割を担う。

1. **ソースコードの保管** — サイトの全ファイル（テンプレート・CSS・画像・スクリプト）の正本
2. **自動ビルド** — microCMSの記事データを取り込み、静的HTMLを生成（Eleventy）
3. **自動デプロイ** — 生成したファイルをさくらインターネットへFTPアップロード

日常の記事更新でGitHubを操作する必要はない（microCMSの「公開」だけで自動的に動く）。
GitHubを直接使うのは、固定ページの変更・デザイン修正・障害調査のとき。

---

## 2. アカウントとリポジトリ

| 項目 | 値 |
|---|---|
| アカウント | `SenshinkaiS` |
| リポジトリ | `sakurai-crc-site`（**Private**。公開しないこと） |
| URL | https://github.com/SenshinkaiS/sakurai-crc-site |
| 既定ブランチ | `main`（このブランチだけで運用） |
| 実行状況の確認 | https://github.com/SenshinkaiS/sakurai-crc-site/actions |

※ 初期に誤って作成した `sakurai-clinic-system` リポジトリは未使用。
残っていれば削除してよい（Settings → 最下部 Danger Zone → Delete this repository）。

---

## 3. ローカル環境（Mac）

| 項目 | 値 |
|---|---|
| 作業コピーの場所 | `~/lab/SCRC_homepage/sakurai-crc-site` |
| 同期ツール | GitHub Desktop（無料。GitHubアカウントでサインイン済み） |
| Git管理外ファイル | `.env`（microCMSの鍵）、`node_modules/`、`_site/`（ビルド出力） |

**基本操作は「Push origin」だけ。** ローカルのファイルが変更されると
GitHub Desktopに変更一覧が表示される → Summaryに変更内容を一言書いて
「Commit to main」→ 上部の「Push origin」。プッシュすると自動でビルド＆デプロイが走る。

注意: 「Fetch origin」としか表示されていないときは送信するものがない状態。
「Re-run jobs」（GitHub上のボタン）は古い版を再実行するため、修正の反映には使わない。

---

## 4. リポジトリの構成

```
sakurai-crc-site/
├── src/                  … ビルドで生成されるページのテンプレート
│   ├── index.njk         … トップページ（お知らせを静的埋め込み）
│   ├── news.njk          … お知らせ一覧
│   ├── blog/             … ブログ一覧・記事個別・blog-data.js生成
│   ├── sitemap.11ty.js   … sitemap.xml自動生成
│   └── _data/            … microCMSからのデータ取得（news.js / blog.js）
├── static/               … そのまま公開されるファイル（固定ページ・CSS・JS・画像）
├── legacy/               … 旧データ（microCMS未接続時の予備）
├── scripts/
│   ├── deploy-ftp.mjs    … さくら向けFTPデプロイスクリプト
│   ├── migrate-to-microcms.mjs … 初回データ移行（使用済み）
│   └── ftp-diagnose.mjs  … FTP接続診断（障害調査用）
├── .github/workflows/    … 自動処理の定義（下記第5章）
├── docs/                 … 各種文書（本書・microCMS設定書・更新マニュアル）
└── .env                  … microCMSの鍵（ローカルのみ。Gitに含まれない）
```

**固定ページ（診療時間・料金など）を変更する場合**: `static/` 内のHTMLを編集
（通常はClaudeセッションに依頼）→ GitHub DesktopでCommit → Push → 自動反映。

---

## 5. GitHub Actions ワークフロー

`.github/workflows/` に3つ定義されている。

### 5-1. Build and Deploy（deploy.yml）— 本体

| 項目 | 内容 |
|---|---|
| 起動条件 | ① mainへのプッシュ ② microCMSからのWebhook（イベント名 `microcms-update`）③ 手動実行 |
| 処理内容 | Node 22で `npm ci` → `npx eleventy`（microCMSから記事取得してビルド）→ `scripts/deploy-ftp.mjs` でさくらへアップロード |
| 所要時間 | 約1分（初回や画像追加時は数分） |
| 特記事項 | FTPのSecretsが未設定の場合、デプロイ工程を自動スキップしてビルド確認だけ行う |

### 5-2. Migrate legacy data to microCMS (one-time)（migrate.yml）

旧サイトのお知らせ27件・ブログ11件をmicroCMSへ投入した移行用。**実行済み。
再実行すると記事が重複するため、原則二度と実行しないこと。**

### 5-3. FTP diagnose (troubleshooting)（ftp-diagnose.yml）

FTP接続の調査用。ログイン直後の位置・フォルダ一覧・書き込みテストを表示する。
デプロイが失敗するときだけ手動実行して原因を切り分ける。

---

## 6. Secrets（機密情報の保管庫）

場所: リポジトリの Settings → Secrets and variables → Actions
（https://github.com/SenshinkaiS/sakurai-crc-site/settings/secrets/actions）

| Secret名 | 内容 | 更新が必要になる場面 |
|---|---|---|
| `MICROCMS_SERVICE_DOMAIN` | `sakurai-crc` | microCMSのサービスIDを変えたとき |
| `MICROCMS_API_KEY` | microCMSのAPIキー | キーを再発行したとき |
| `FTP_SERVER` | さくらのFTPサーバー名 | さくらのプラン変更・移転時 |
| `FTP_USERNAME` | FTPアカウント名 | 同上 |
| `FTP_PASSWORD` | FTPパスワード | さくらのサーバーパスワード変更時 |
| `FTP_SERVER_DIR` | （未使用。削除してよい） | — |

Secretsは登録後に値を見ることはできない（上書きのみ可能）。
更新するときは該当のSecret名をクリック → 新しい値を入力 → Update secret。
**値をチャットやメールに書かず、この画面に直接入力すること。**

---

## 7. Personal Access Token（microCMS連携用）

| 項目 | 値 |
|---|---|
| 種類 | classic トークン（`ghp_` で始まる） |
| 名前 | microcms-webhook |
| スコープ | repo のみ |
| 有効期限 | 無期限 |
| 用途 | microCMSのWebhookがGitHubのビルドを起動するための認証 |
| 使用場所 | microCMSの両API（お知らせ・院長ブログ）のWebhook設定内 |
| 管理画面 | https://github.com/settings/tokens |

**再発行手順**（漏えいが疑われるとき・誤って削除したとき）:
上記管理画面で「Generate new token (classic)」→ repoスコープ → 生成された値を
microCMSの両APIのWebhook設定のトークン欄に貼り替える。古いトークンはDelete。

---

## 8. デプロイスクリプトの仕様（scripts/deploy-ftp.mjs）

さくらインターネットのFTPの特性に合わせた専用スクリプト。

- 接続先: `FTP_SERVER` に通常FTPで接続（さくらは国外IPフィルタ解除が前提）
- ログイン後 `www` → `sakurai-crc.org` と**1階層ずつ移動**
  （さくらのFTPは複数階層の一括移動に非対応のため）
- `_site/`（ビルド出力）の全ファイルを1つずつアップロード
- **追加・上書きのみ。サーバー上のファイル削除は一切しない**
  （サーバーに残る旧システムの遺物 `bk/` 等を壊さないため）
- 上書きが「Permission denied」になったファイルは、権限を自動修正
  （SITE CHMOD 644）してから再試行
- 通信が切断された場合は再接続して継続（ファイルごとに最大3回試行）
- 1件でも失敗が残った場合は失敗ファイル一覧を表示して異常終了（赤✗）

---

## 9. トラブルシューティング

**デプロイが赤✗で失敗した**

1. 失敗した実行を開き「Deploy via FTP」のログを確認
2. 「ログイン成功」が無い → FTP認証の問題。`FTP_PASSWORD` 等のSecretsを確認。
   さくらの国外IPアドレスフィルタが再有効化されていないかも確認（FTPは解除が必須）
3. 特定ファイルの失敗一覧が出ている → そのファイル名を控えてClaudeセッションで相談
4. 切り分けに「FTP diagnose」ワークフローの手動実行が有効

**修正したのに同じエラーが出る**

- 実行画面上部のコミット番号が最新か確認する。「Re-run jobs」は古い版の再実行なので使わない。
  GitHub Desktopで「Push origin」してから、新規に「Run workflow」する

**GitHub Desktopで「Push origin」が出ない**

- 左上の Current Repository が `sakurai-crc-site` になっているか確認
- 「Fetch origin」だけの表示なら送信済み（正常）

**GitHubにログインできない**

- パスワードリセット、または登録メール（shigeki.sakurai@gmail.com）で復旧

---

## 10. やってはいけないこと

- リポジトリのPublic化（Privateを維持。院内向け情報や構成情報を含むため）
- Secretsの削除・名前変更
- Migrateワークフローの再実行（記事が重複する）
- `main` 以外のブランチでの運用（仕組みを複雑にしない）
- `.github/workflows/` 内のファイルをGitHub上で直接編集すること
  （ローカルと食い違いが生じる。編集はローカル→Push で行う）

---

## 11. 関連文書

- `docs/microCMS設定書.md` … microCMS側の設定（API・Webhook・キー管理）
- `docs/更新マニュアル.md` … スタッフ向けの日常更新手順
- `README.md` … リポジトリ全体の構成説明
