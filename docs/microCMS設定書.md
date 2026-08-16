# microCMS設定書 — 医療法人千心会 櫻井医院 公式サイト

作成日: 2026年8月16日 ／ 対象システム: https://sakurai-crc.org

この文書は、公式サイトのお知らせ・ブログを管理する microCMS と、
その連携システム全体の設定を記録したものです。障害時の確認や、
将来の設定変更・引き継ぎの際の正とします。

---

## 1. 全体構成

```
[microCMS]  記事を編集し「公開」を押す
    ↓ Webhook（自動通知）
[GitHub Actions]  サイトを自動ビルド（Eleventy）
    ↓ FTP（専用スクリプト）
[さくらインターネット]  /home/sakurai-crc/www/sakurai-crc.org/ に反映
    ↓
[公開サイト]  https://sakurai-crc.org （約2〜3分で反映完了）
```

日常の運用で人が操作するのは microCMS だけ。それ以降はすべて自動。

---

## 2. microCMSサービス情報

| 項目 | 値 |
|---|---|
| サービス名 | 櫻井医院HP管理 |
| サービスID | `sakurai-crc` |
| 管理画面URL | https://sakurai-crc.microcms.io |
| プラン | Hobby（無料） |
| API数 | 2個（無料枠は3個まで） |

---

## 3. API構成

### 3-1. お知らせ（エンドポイント: `news`）

リスト形式。トップページ（直近3ヶ月分）とお知らせ一覧ページに表示される。

| フィールドID | 表示名 | 種類 | 必須 |
|---|---|---|---|
| `date` | 日付 | 日時 | ✓ |
| `title` | タイトル | テキストフィールド | ✓ |
| `body` | 本文 | リッチエディタ | |

### 3-2. 院長ブログ（エンドポイント: `blog`）

リスト形式。ブログ一覧と記事個別ページ
（`https://sakurai-crc.org/blog/posts/スラッグ.html`）を生成する。

| フィールドID | 表示名 | 種類 | 必須 |
|---|---|---|---|
| `date` | 公開日 | 日時 | ✓ |
| `title` | タイトル | テキストフィールド | ✓ |
| `slug` | スラッグ（URL用の英語） | テキストフィールド | ✓ |
| `legacyId` | 旧記事ID（移行用・通常は空） | 数値 | |
| `excerpt` | 抜粋 | テキストエリア | |
| `categories` | カテゴリ（カンマ区切り） | テキストフィールド | |
| `tags` | タグ（カンマ区切り） | テキストフィールド | |
| `eyecatchPath` | アイキャッチ画像パス | テキストフィールド | |
| `eyecatchAlt` | 画像の説明 | テキストフィールド | |
| `body` | 本文 | リッチエディタ | |

**入力ルール**

- `slug`: 英小文字とハイフンのみ（例: `summer-heat-stroke`）。日本語不可。
  一度公開したら変更しない（URLが変わってしまうため）
- `categories` / `tags`: カンマ区切りで複数指定（例: `健康・医療, 心臓リハビリ`）
- `eyecatchPath`: `../images/ファイル名.jpg` の形式。
  新しい画像はClaudeセッションで `static/images/` に追加してもらう
- ※ フィールドIDは1文字でも変えるとビルドが壊れるので変更しないこと

---

## 4. APIキー

| 項目 | 値 |
|---|---|
| 確認場所 | microCMS管理画面 → サービス設定 → APIキー |
| GET権限 | 有効（ビルド時の記事取得に使用。必須） |
| POST権限 | 無効にしてよい（初回データ移行専用だった） |

キーの値は以下の2箇所に登録されている（キー本体はこの文書に記載しない）:

1. **GitHub Secrets** — `MICROCMS_SERVICE_DOMAIN`（値: sakurai-crc）と `MICROCMS_API_KEY`
   （https://github.com/SenshinkaiS/sakurai-crc-site/settings/secrets/actions）
2. **Macのローカル** — `~/lab/SCRC_homepage/sakurai-crc-site/.env`（Gitには含まれない）

**キーを再発行した場合**は上記2箇所の更新が必要。

---

## 5. Webhook設定（自動反映の仕組み）

「お知らせ」「院長ブログ」の**両方のAPI**に同じ設定がある。
（各API → API設定 → Webhook）

| 項目 | 値 |
|---|---|
| サービス種別 | GitHub Actions |
| ユーザー名 | `SenshinkaiS` |
| リポジトリ名 | `sakurai-crc-site` |
| トリガーイベント名 | `microcms-update` |
| GitHubトークン | classicトークン（`ghp_`で始まる）・repoスコープ・無期限 |

**通知タイミング**: コンテンツの公開時・更新時／公開終了時／削除時 = 通知する。
下書き保存時・APIの設定変更時 = 通知しない。

**トークンを再発行した場合**（漏えい時など）:
https://github.com/settings/tokens で classic トークンを再発行（repoスコープ）し、
両APIのWebhook設定のトークン欄を更新する。

---

## 6. GitHub（ビルドとデプロイ）

| 項目 | 値 |
|---|---|
| リポジトリ | https://github.com/SenshinkaiS/sakurai-crc-site （Private） |
| ローカル作業コピー | `~/lab/SCRC_homepage/sakurai-crc-site`（GitHub Desktopで同期） |
| 実行状況の確認 | https://github.com/SenshinkaiS/sakurai-crc-site/actions |

**ワークフロー（自動処理）一覧**

- `Build and Deploy` … 本体。microCMSのWebhook受信時・コードのプッシュ時・手動実行時に、
  サイトをビルドしてさくらへFTPアップロードする
- `Migrate legacy data to microCMS (one-time)` … 旧データの移行用。**実行済み。再実行しないこと**（記事が重複する）
- `FTP diagnose (troubleshooting)` … FTP接続の調査用。デプロイ失敗時のみ使う

**GitHub Secrets 一覧**

| Secret名 | 内容 |
|---|---|
| `MICROCMS_SERVICE_DOMAIN` | sakurai-crc |
| `MICROCMS_API_KEY` | microCMSのAPIキー |
| `FTP_SERVER` | さくらのFTPサーバー名 |
| `FTP_USERNAME` | FTPアカウント名 |
| `FTP_PASSWORD` | FTPパスワード（＝さくらのサーバーパスワード） |
| `FTP_SERVER_DIR` | （現在は未使用。削除してよい） |

---

## 7. さくらインターネット（公開サーバー）

| 項目 | 値 |
|---|---|
| サーバー | www2328.sakura.ne.jp（FreeBSD） |
| FTPサーバー | sakurai-crc.sakura.ne.jp |
| サイトの実体 | `/home/sakurai-crc/www/sakurai-crc.org/` |
| 国外IPアドレスフィルタ | **FTPは解除のまま維持すること**（GitHubからのデプロイに必須。元に戻すと自動反映が止まる） |

デプロイは `scripts/deploy-ftp.mjs`（リポジトリ内）が行う。さくらのFTPの特性
（複数階層の一括移動不可・一部ファイルの権限問題）に対応済みで、
追加・上書きのみ行い、サーバー上のファイル削除は一切しない。

---

## 8. トラブルシューティング

**公開したのにサイトに反映されない**

1. 5分待って、ブラウザで強制再読み込み（Mac: Cmd+Shift+R）
2. https://github.com/SenshinkaiS/sakurai-crc-site/actions で最新の実行を確認
   - 実行自体が無い → Webhook設定かGitHubトークンの問題（第5章）
   - 赤✗で失敗 → 実行を開いてエラー内容を確認。FTP系ならさくらの
     国外IPフィルタ（第7章）を確認
3. microCMS側のWebhook送信履歴（各API → API設定 → Webhook）で
   レスポンスが 204 になっているか確認（404はトークン・リポジトリ名の誤り）
4. 解決しない場合はClaudeのセッションで「サイトの自動反映が失敗している」と相談

**microCMSにログインできない** … 登録メールアドレスでパスワード再設定。

**やってはいけないこと**

- APIスキーマのフィールドIDの変更・削除
- Migrateワークフローの再実行
- さくらの国外IPフィルタ（FTP）の再有効化
- 公開済み記事の slug の変更

---

## 9. 関連文書

- `docs/更新マニュアル.md` … スタッフ向けの日常更新手順
- `docs/microCMS設定手順.md` … 初期構築時の手順（記録用）
- `README.md` … リポジトリ全体の構成説明
