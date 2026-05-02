# インタビュー（`interview/`）関連 作業記録

本ドキュメントは、`src/pages/interview/` 周辺で行った変更の整理用メモです。

## 対象ファイル（主）

| パス | 内容 |
|------|------|
| `src/pages/interview/index.astro` | 一覧に宮川明子インタビューを追加 |
| `src/pages/interview/miyakawa-akiko.astro` | 画像順・章構成・プロフィール・SEO |
| `src/pages/interview/hayashi-saodah.astro` ほか個別インタビュー | `<head>` に SEO タグ（後述の共通コンポーネント） |
| `src/components/SeoHeadTags.astro` | canonical / OGP / Twitter Card の共通雛形 |
| `src/layouts/Layout.astro` | 同上を `Layout` 利用ページへ一括適用 |

---

## 1. インタビュー一覧（`index.astro`）

- **宮川明子**（`/interview/miyakawa-akiko/`）のカードを追加。
- サムネイル画像: `https://images.naturalquest.org/interview/vol03/miyakawa_002.jpg`
- 肩書・リード文は `miyakawa-akiko.astro` のヒーロー情報に合わせて記載。
- 掲載順は既存の新しい号が先の並びの末尾（vol.3 相当のため）。

---

## 2. `miyakawa-akiko.astro` — 画像の並び（確定）

表示上の順序は次のとおり。

| 順 | ファイル | 役割 |
|----|-----------|------|
| 1 | `miyakawa_01.jpg` | HERO |
| 2 | `miyakawa_002.jpg` | Chapter 01 見出し写真 |
| 3 | `miyakawa_02.jpg` | Chapter 02 見出し写真 |
| 4 | `miyakawa_03.jpg` | Chapter 03 |
| 5〜9 | `miyakawa_04.jpg` 〜 `08.jpg` | Chapter 04 〜 08 |
| 末尾 | `miyakawa_09.jpg` | プロフィール（集合写真） |

### メモ

- **`miyakawa_10.jpg` は使用しない**（CDN に存在しない前提で、`09.jpg` を最終ビジュアルに配置）。
- 途中経過では「02 の直後に 03 が続く」状態を避けるため、**Chapter 02 の本文を写真ブロックの間に挟み、03 を旧 Chapter 04 の位置相当まで繰り下げ**る調整を行った。
- 最終形では **他章と同様**、`miyakawa_02.jpg` の **`photo-wrap` 上に `ch-sub-box`（「医者を夢見るが…」）** を載せた。

---

## 3. SEO（サイト共通＋インタビュー個別）

本番ドメインは **`naturalquest.org`**（`astro.config.mjs` の `site` と一致）。

### `SeoHeadTags.astro`

- `link rel="canonical"`
- `og:locale`, `og:site_name`, `og:type`, `og:title`, `og:description`, `og:url`, `og:image`
- `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
- `og:image` 未指定時のデフォルト: `https://naturalquest.org/images/herbaroma.jpg`

### `Layout.astro`

- 上記を **`Astro.url.pathname`** で全 `Layout` ページに出力。
- 任意: `ogImage`, `ogType`（既定 `website`）。

### インタビュー個別（`Layout` 未使用のフル HTML）

各ファイルの `<head>` で `SeoHeadTags` を読み込み、**`ogType="article"`** および **各ヒーロー相当の `ogImage`（絶対 URL）** を指定。

対象:

- `miyakawa-akiko.astro`
- `hayashi-saodah.astro`
- `nakajima-deko.astro`
- `tojo-yuriko-1.astro`
- `tojo-yuriko-2.astro`（冒頭に `---` フロントマターを追加して Astro コンポーネントを利用可能にした）

宮川インタビューの **`og:image`** は `miyakawa_002.jpg` の URL。

---

## 4. 公開時の確認ポイント（再掲）

- 画像は **`images.naturalquest.org/interview/vol03/`** 配下の参照に依存する。
- インタビュー記事は **`Layout.astro` を使わない**ため、サイト共通ヘッダー／フッターはトップ等と異なる（他インタビューと同じパターン）。
- 章見出しのフェードは `public/scripts/interview.js` の **`photo-wrap` 交差**に依存。Chapter 02 は写真付きのため、他章と同様に連動する。

---

## 5. 変更日・担当

- 作業時期: 2026年5月（会話ベースの記録）
- 記録作成: 開発時の作業ログとして `docs/interview-worklog.md` に集約
