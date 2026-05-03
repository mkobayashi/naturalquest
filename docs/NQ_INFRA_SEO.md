# NQ_INFRA_SEO.md
## naturalquest.org インフラ・SEO 統合仕様書
### 最終更新：2026年5月3日

---

## 1. 技術スタック概要

| 層 | 技術 | 備考 |
|---|---|---|
| フロントエンド | Astro | SSG |
| ホスティング | Cloudflare Pages | GitHub連携自動デプロイ |
| CDN / DNS | Cloudflare | |
| 画像配信 | Cloudflare R2 | images.naturalquest.org |
| APIプロキシ | Cloudflare Workers | 複数Worker稼働中 |
| データベース | Cloudflare D1 | 広告システム用 |
| リポジトリ | github.com/mkobayashi/naturalquest | |

---

## 2. Cloudflare Workers 一覧

| Worker名 | URL | 役割 |
|---|---|---|
| aroma-api | aroma-api.kobayashi-ece.workers.dev | アロマAIチャットAPIプロキシ |
| nq-redirect | （redirect-worker） | WordPress→Astroリダイレクト |
| nq-ads | nq-ads.kobayashi-ece.workers.dev | 自社広告システム |

### デプロイコマンド（共通パターン）
```bash
cd ~/Desktop/naturalquest/workers/{worker-name}
wrangler deploy --config wrangler.toml
```

---

## 3. リダイレクト設計

### 優先順位（上位が先に評価される）
1. **GONE_PREFIXES**（410 Gone）→ WooCommerce遺物（/product/, /cart/ など）
2. **JOURNAL_JP_SLUGS**（301）→ 旧journal日本語スラグ
3. **アロマページ**（301）→ `/aroma/` チャット
4. **SLUG_MAP**（301）→ 新 /journal/ URL（294件）

### Cloudflare Pages `_redirects`（シンプル構成）
```
/aroma-chat  →  /aroma/  301
```
**注意**：ワイルドカード `*` なし（正常）

### Workerデプロイ
```bash
cd ~/Desktop/naturalquest/workers/redirect-worker
wrangler deploy
```

---

## 4. 画像配信（R2）

### バケット構成
```
バケット名: nq-images
カスタムドメイン: images.naturalquest.org

ディレクトリ構成:
  /interview/vol{NN}/    ← インタビュー画像
  /journal/              ← 記事画像（移行完了）
```

### R2運用注意事項
- 上書きアップロード後は必ずCloudflareキャッシュをカスタムPurge
- 新規バケットパスはCloudflare管理画面でパブリックアクセス確認

---

## 5. 自社広告システム（nq-ads）

### D1テーブル構成
- `advertisers`：広告主
- `ads`：広告クリエイティブ
- `clicks`：クリックログ
- `conversions`：コンバージョンログ
- `daily_stats`：日次集計

### 機能
- タグマッチングによるバナー配信
- クリックトラッキング
- コンバージョン記録
- 統計API
- エンドツーエンド検証済み（2026年5月時点）

---

## 6. URL・スラグ設計

### 記事（journal）
- 形式：`/journal/YYYY-MM-DD-{slug}/`
- 総件数：294件（WordPress移行時に英語スラグに統一）
- 旧WordPress日本語スラグ → redirect-workerで301転送

### インタビュー
- 形式：`/interview/{person-slug}/`

### アロマ
- `/aroma/`（チャット）
- `/aroma/shop/`（全精油一覧）
- `/aroma/shop/{id}/`（個別ショップページ）

---

## 7. SEO状況と監視項目

### Astro移行後の状況（2026年4月）
- 4/18 ピーク（クリック~60）→ 4/28 ほぼ0（移行過渡期として正常）
- 301リダイレクト機能中、Google評価引き継ぎ予定
- 平均CTR 10.1%（期間中）、平均掲載位置 4.1

### 短期モニタリング項目（1〜2週間）
- [ ] Search Console インデックスリクエスト（優先記事から順に）
  - /journal/herb-aroma-v1-drink/
  - /journal/garlic-ajoene-oil/
  - /journal/mugwort-green-juice/
- [ ] Sitemap再送信（`https://naturalquest.org/sitemap.xml`）
- [ ] Core Web Vitals確認（PageSpeed Insights）
- [ ] Search Consoleカバレッジ（有効/除外/エラー数の変化）

### 中長期モニタリング項目（1ヶ月以上）
- 検索流入の回復確認
- 新インタビュー記事のパフォーマンス追跡
- 古いページの404確認

### 検索パフォーマンスの見方
- 短期（1〜2週間）：変動あり（正常）
- 中期（1ヶ月）：回復期待
- 比較対象：2024年同時期データなし（WP時代との直接比較不可）

---

## 8. Search Console操作リファレンス

### Sitemap再送信
```
Search Console → 「サイトマップ」→ 既存 /sitemap.xml を「再度試行」
```

### インデックスリクエスト
```
Search Console → 「URL検査」→ 対象URLを入力 → 「インデックス登録をリクエスト」
```

---

## 9. 新規チャット開始時の確認ポイント

インフラ・SEO関連の相談前に以下を確認：
1. Search Console カバレッジ → 有効数の推移
2. PageSpeed Insights → Core Web Vitals スコア
3. GA4 → 過去7日間の表示回数・クリック数推移
4. Search Console → 404エラーページの確認

---

## 10. 既知の完了事項（参照用）

- WooCommerce：プラグイン削除済み
- 旧 /product/ ページ：トップへ301リダイレクト
- 旧アロマ辞典個別ページ59件：削除済み → /aroma/ へ301
- Article スラグ294件：英語YYYY-MM-DD形式に統一
- 画像：R2（images.naturalquest.org）へ移行完了
- GA4：新サイトで正常記録中
- `toujyu` → `tojo` テキスト・ファイル名一括置換：完了
