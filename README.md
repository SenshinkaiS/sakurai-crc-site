# sakurai-crc-site

医療法人千心会 櫻井医院 公式サイト (https://sakurai-crc.org) のソースコード。
Eleventy (11ty) で静的生成し、お知らせ・ブログは microCMS から取得します。

## 構成
- `src/` … テンプレート（index, news, blog一覧・記事・sitemap.xml）
- `static/` … そのまま配信される固定ページ・CSS・JS・画像
- `legacy/` … 旧データ（microCMS未設定時のフォールバック兼移行元）
- `scripts/migrate-to-microcms.mjs` … 旧データのmicroCMS一括投入
- `.github/workflows/deploy.yml` … push / microCMS更新 → ビルド → FTPSデプロイ
- `docs/` … 設定手順・院内向け更新マニュアル

## ローカルビルド
```bash
npm install
npx eleventy          # → _site/ に出力
```
microCMS連携は `.env`（`.env.example`参照）を置くと有効になり、
無い場合は legacy データでビルドされます。

## 運用ルール
- 既存URLは変更しない（`*.html` フラットURL維持）
- `sakurai-clinic.jp` は他院のドメイン。絶対に参照しない
- 本番サーバーの `bk/` 等の遺物には触れない（デプロイは追加・上書きのみ）
