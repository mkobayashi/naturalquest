# naturalquest.org 作業進捗メモ

## 完了した作業（2026-04-14）

### Google Drive 整理
- rclone + Google Drive MCP セットアップ完了
- 縮小画像 11,802件削除（372MB解放）
- rclone remote名: gdrive / nq-images-upload

### slug リネーム
- 225件を日付+英語slug形式に一括変換
- アロマ辞典59件はskip（チャットUIに移行）
- slug-mapping-approved.csv → gdrive:slug-migration/ に保存済み

### heroImage 管理
- 154件のheroImageを抽出・リンク切れ34件確認済み
- hero-all.csv → gdrive:slug-migration/ に保存済み
- new_image列に手動でファイル名を入れてCSVを返すと一括反映可能
- R2バケット: nq-images / rclone: nq-images-upload
- 配信URL形式: https://images.naturalquest.org/年/月/ファイル名.jpg

### index.astro 修正
- popularSlugs・selectionSlugs を新slug名に更新済み

---

## 完了した作業（2026-04-15）

### アロマチャット実装
- aroma_oils.json（60件）生成・src/data/ に配置
- Cloudflare Workers（aroma-api）デプロイ済み
  - URL: https://aroma-api.kobayashi-ece.workers.dev
  - システムプロンプトに精油60件のJSONを埋め込む構成
- AromaChat.astro・OilCard.astro 実装済み
- /aroma/ ページ公開済み・カードデザイン調整済み

---

## 完了した作業（2026-04-18）

### 旧サイト検索資産の引き継ぎ（リダイレクト対応）

#### 旧サイトURL構造の確認
- WordPress パーマリンク設定: `/article/%category%/%postname%/`
- カテゴリは1階層（diy / health / calture 等）
- 新サイト: `/journal/{英語slug}/`

#### Cloudflare Worker（nq-redirect）デプロイ
- `workers/nq-redirect/redirect-worker.js` 作成
- `workers/nq-redirect/wrangler.toml` 作成
- Worker名: `nq-redirect`
- ルート: `naturalquest.org/article/*`
- マッピング294件（通常235件 + アロマ辞典59件）を埋め込み
- アロマ辞典旧URL → `/aroma/` にリダイレクト
- `wrangler deploy --config workers/nq-redirect/wrangler.toml` でデプロイ済み
- 動作確認済み（アホエンオイル旧URL → `/journal/garlic-ajoene-oil/` に301リダイレクト）

#### アロマ辞典個別記事の削除
- `src/content/journal/` 内のカタカナ精油記事59件を削除
- 情報はaroma_oils.jsonからチャットUIで参照可能なため問題なし

#### _redirects の整理
- `public/_redirects` を空ファイルに（Workerで処理するため不要）

#### git push 完了
- コミット: `remove aroma journal pages and clear _redirects`

---

## 次にやること
- Search Console でアホエンオイル等の主要記事URLをインデックス登録リクエスト
- heroImageのリンク切れ34件の修正（new_image列を埋めたCSVを返す）
- エクセルをインポートすることで完成する、商品リストフォーマットの作成
