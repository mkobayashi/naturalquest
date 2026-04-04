# 200件の記事をCMSベースで再活用する — 生産的な進め方

## 前提

- **現状**: Astro + Content Collections、約200件のMarkdown（`title`, `pubDate`, `categories`, `tags`）
- **目標**: シンプルな投稿Web、モダンで無駄のない見た目、CMSで運用できるようにする

---

## Cursorから見て「最も生産的」な選択: **Git-based CMS**

| 方式 | 200件の扱い | Cursorでできること | 運用 |
|------|-------------|-------------------|------|
| **Git-based CMS**（Tina / Decap） | **移行不要**。そのままMarkdownで利用 | レイアウト・コンポーネント・スタイルを一括変更できる。コンテンツもリポジトリ内なので検索・一括修正も可能 | 管理画面で編集・公開。Gitと連携 |
| Headless CMS（microCMS等） | 一括移行スクリプトが必要（1回だけ） | スクリプト作成・サイト側コードの書き換えは得意。移行後はコンテンツはCMS側のみ | 非エンジニアがブラウザで更新しやすい |
| ファイルのまま（CMSなし） | そのまま | すべての作業をCursorで完結できる | 投稿はMarkdown追加。CMSではない |

**推奨**: **Decap CMS（旧Netlify CMS）** または **Tina CMS** を選ぶと、

1. **200件の移行作業がゼロ**で、既存Markdownをそのまま「CMSで編集できる記事」にできる  
2. サイトのモダン化（共通レイアウト・Tailwind・コンポーネント化）を、Cursorで一括で進められる  
3. 管理画面は「シンプルな投稿Web」に十分で、余計な機能を増やさずに済む  

---

## 具体的な手順（Git-based CMS の場合）

### 1. サイト側をモダンに整える（Cursorで一気にやる）

- 共通 `Layout.astro` を使い、`index.astro` と `journal/[slug].astro` をリファクタ
- Tailwindで「無駄のない」一覧・記事ページのスタイルを適用
- 必要なら `content/config.ts` で `journal` のスキーマを明示（Tina/Decapの設定と合わせる）

### 2. CMSを選んで設定

- **Decap CMS**: `public/admin/config.yml` で `journal` 用の `folder`/`fields`（title, pubDate, categories, tags, body）を定義。GitHub等のOAuthでログインし、`/admin` で編集
- **Tina CMS**: `tina/config.ts` で `journal` コレクションを定義。ローカルまたはTina Cloudで編集UIを提供

### 3. 200件は触らない

- 既存のfrontmatterと本文はそのまま。CMSのスキーマだけ既存フィールドに合わせる

---

## microCMSを選ぶ場合（比較用）

- **移行**: Markdown → microCMS API に流し込む**移行スクリプトを1本**Cursorで作成（fetchでPOSTするだけ）
- **サイト**: `getCollection` の代わりに microCMS の REST API をビルド時に fetch するように変更
- **運用**: 以降はmicroCMSの管理画面で投稿。Cursorの出番はサイトのコードだけ

---

## 次の一歩

- 「まず見た目だけモダンにしたい」→ レイアウトとTailwindの適用から着手  
- 「管理画面の形を決めたい」→ Decap か Tina のどちらで進めるか決めてから、`config.yml` / `tina/config.ts` のスキーマを合わせる  

このリポジトリ内のファイルだけで完結するため、**Git-based CMS + モダンな見た目のリファクタ**が、Cursor側から見ると最も生産的です。
