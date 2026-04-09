# naturalquest.org リニューアル 進捗メモ
> 最終更新：2026年4月8日

---

## プロジェクト概要

| 項目 | 内容 |
|------|------|
| サイト名 | Natural Quest |
| ドメイン | naturalquest.org |
| タグライン | 自分のナチュラルを見つける |
| 技術スタック | Astro + Cloudflare Pages + Tailwind CSS |
| 開発サイトURL | https://naturalquest.kobayashi-ece.workers.dev/ |
| GitHubリポジトリ | mkobayashi/naturalquest |
| ローカル開発 | ~/Desktop/naturalquest |

---

## カテゴリ構造（確定）

```
食　　　 ＞ DIY｜エディターより｜エッセイ｜インタビュー｜おすすめ｜医食同源
健康　　 ＞ セルフケア｜医食同源｜アロマ
住環境　 ＞ 住まい（その他タグで細分化）
NOTE　　 ＞ エディターより｜エッセイ｜おでかけ｜インタビュー｜読む・観る
```

- アロマ事典62本：記事廃止→AIチャット化（別途実装予定）
- タグで横断的に細分類（漆喰・古民家・移住・オフグリッド等）
- 削除済み：ペロブスカイト記事、Gutenberg Editor記事

---

## 実装完了項目

### Astroサイト構造（STEP1〜5完了）
- [x] `src/content/config.ts`（journalとfeaturesコレクション定義）
- [x] `src/layouts/Layout.astro`（ナビ・フッター・デザイン適用）
- [x] `src/pages/index.astro`（TOPページ：HERO・PICK UP・カテゴリ別・アロマCTA）
- [x] `src/pages/category/[category].astro`
- [x] `src/pages/tag/[tag].astro`
- [x] `src/pages/journal/[slug].astro`（関連記事・Bristlecone導線）
- [x] `src/pages/feature/[slug].astro`
- [x] `src/pages/aroma-chat.astro`（準備中表示）
- [x] `/privacy` `/terms` `/about`（スタブ）

### デザイン
- [x] ロゴ：`/public/logo.svg`（n:Q wordmark、Illustratorで書き出し済み）
- [x] カラーパレット：`--color-nq-*`（アースグリーン・テラコッタ・生成り）
- [x] フォント：Noto Serif JP / Noto Sans JP（Google Fonts）
- [x] Forbes Japan参考のコンパクトなタイポグラフィ
- [x] スティッキーヘッダー + backdrop-blur
- [x] 上部に戻るボタン（右下固定）

### コンテンツ
- [x] 288本のmdファイルを新カテゴリ体系に一括反映
- [x] heroImage 6本に画像URL追加
- [x] http→https画像URL一括置換（実行済み）
- [x] 漆喰記事（2026-04-04-shikkui.md）新規作成・公開済み
  - URL: https://naturalquest.org/article/diy/reform/（WordPress側）

### 作成済み記事素材（mdとして追加待ち）
- [ ] 漆喰の材料ガイド（`2026-04-08-shikkui-guide.md`）
- [ ] 自然塗料ガイド（`2026-04-08-natural-paint.md`）
- [ ] シックハウス症候群の基本知識（`2026-04-08-sickhouse.md`）

---

## 未実装・今後の課題

### 優先度高
- [ ] アロマチャット本実装
  - 精油データJSON：FileMaker_to_Excel_3_15.xls（60種）変換済みExcel有
  - Claude API（claude-sonnet-4-6）使用
  - Cloudflare Workers経由でAPIキー中継
  - 多言語対応：日本語・中国語・英語（自動検出）
- [ ] ナビゲーションを新カテゴリ（食／健康／住環境／NOTE）に更新
- [ ] homePickSlugsの記事スラッグ確認・修正
- [ ] 画像の本格移行（wp-content/uploads → public/images/ または Cloudflare R2）

### 優先度中
- [ ] ワークショップ情報の自動収集（Cloudflare Workers + Claude API）
- [ ] localStorageによる閲覧履歴レコメンド
- [ ] チャット→関連記事提示の実装
- [ ] 特集（features）コンテンツの充実
- [ ] リダイレクト設定（_redirects）：旧WordPressのURLから新URLへ

### 優先度低（本番移行前）
- [ ] Cloudflare R2への画像移行
- [ ] サイトマップ生成
- [ ] OGP・メタ情報の整備
- [ ] about・プライバシー・利用規約ページの本文作成

---

## 本番移行の手順（未実施）

1. 画像をpublic/またはR2に移行
2. _redirectsファイル作成（旧WP URL → 新Astro URL）
3. Cloudflare Pagesにカスタムドメイン（naturalquest.org）を接続
4. WordPressを停止またはサブドメインに移動

---

## 関連サービス・ツール

| サービス | 用途 | 状況 |
|---------|------|------|
| Cloudflare Pages | ホスティング | 開発サイト稼働中 |
| GitHub | バージョン管理 | mkobayashi/naturalquest |
| Cursor | コーディング | メイン開発環境 |
| bristlecone.jp | リフォーム相談の受け皿 | 各記事末尾に導線設置済み |
| Valves and Vinyl | 別サイト（オーディオ） | 別途進行中 |

---

## Cursorへの主要な指示パターン（再利用可能）

### カテゴリ変更
```bash
find src/content/journal -name "*.md" -exec sed -i '' 's/- "旧カテゴリ"/- "新カテゴリ"/g' {} +
```

### 画像URL修正
```bash
find src/content/journal -name "*.md" -exec sed -i '' 's|http://naturalquest.org|https://naturalquest.org|g' {} +
```

### 開発サーバー（モバイル確認用）
```bash
cd ~/Desktop/naturalquest
npm run dev -- --host
# 別ターミナルで
ngrok http 4321
```
