# NQ_INTERVIEW_SPEC.md
## naturalquest.org インタビューシリーズ 統合仕様書
### 最終更新：2026年5月3日

---

## 1. サイト構成方針

- インタビューは独立カテゴリ（NOTEカテゴリとは別）
- URL構造：`/interview/{slug}/`
- ナビに「インタビュー」追加済み
- スタンドアロンページ（Layout.astro不使用）

### ファイル構成
```
src/
  pages/
    interview/
      index.astro              ← 一覧ページ
      hayashi-saodah.astro     ← 林サオダ vol.11
      nakajima-deko.astro      ← 中島デコ vol.09
      miyakawa-akiko.astro     ← 宮川明子 vol.03
      tojo-yuriko-1.astro      ← 東城百合子 vol.08 前編
      tojo-yuriko-2.astro      ← 東城百合子 vol.08 後編
      john-bayles.astro        ← ジョン・ベリス vol.05
      everett-kennedy-brown.astro ← エバレット・ブラウン vol.10
  styles/
    interview.css              ← 正本（src/ 以下）
public/
  styles/
    interview.css              ← ビルド時コピー（.gitignore済み）
```

**重要**：`<style is:global>` はAstroがスコープ化してクラスが当たらないため使わない。`interview.css` の `<link>` 読み込みのみ。

### CSS管理ルール
- 正本：`src/styles/interview.css`
- 公開用：`public/styles/interview.css`（package.jsonのpredev/prebuildで自動コピー）
- 手動コピーが必要な場合：
  ```bash
  cp src/styles/interview.css public/styles/interview.css
  ```

---

## 2. デザイントークン（interview.css）

```css
--bg:        #FAF8F3;
--bg-warm:   #F2EBE0;
--bg-header: #EDE4D6;
--text:      #261A0F;
--text-mid:  #4A3828;
--text-light:#7A6858;
--accent:    #8B5E3C;
--accent2:   #C4935A;
--rule:      rgba(139,94,60,0.18);
```

### フォント
```html
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700&family=Noto+Sans+JP:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
```
- 本文：`Shippori Mincho`（インタビューページのみ）
- UI：`Noto Sans JP`
- 英字：`Cormorant Garamond`
- 数字：`Playfair Display`（unicode-rangeで上書き）

---

## 3. HTMLテンプレート

### `<head>` テンプレート
```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>【氏名】 | Natural Quest Interview vol.【XX】</title>
<meta name="description" content="【説明文】">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700&family=Noto+Sans+JP:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles/interview.css">
</head>
```

### SEOメタデータ構成（3層）
```
① <meta name="description">        各ページに直書き（検索エンジン向け）
② <SeoHeadTags>                    og:description / twitter:description（SNS向け）
③ <script type="application/ld+json">  Schema.org JSON-LD（構造化データ）
```
**注意**：`SeoHeadTags.astro` には `<meta name="description">` は含まれない。og/twitterのみ。重複なし、現状維持で正しい。

### SeoHeadTags のProps
- title, description, path, ogImage, ogType（省略時 "website"）
- インタビュー記事は `ogType="article"` を指定
- og:image デフォルト：`https://naturalquest.org/images/herbaroma.jpg`

### Schema.org JSON-LD テンプレート
```astro
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": interviewTitle,
  "description": interviewDesc,
  "image": interviewOg,
  "datePublished": "YYYY-MM-DD",   // 取材年を使用
  "dateModified": "2026-05-01",
  "inLanguage": "ja-JP",
  "author": { "@type": "Person", "name": "著者名" },
  "publisher": {
    "@type": "Organization",
    "name": "Natural Quest",
    "url": "https://naturalquest.org"
  },
  "mentions": {
    "@type": "Person",
    "name": "インタビュイー名",
    "jobTitle": "肩書き",
    "knowsAbout": ["キーワード1", "キーワード2"]
  }
})} />
```
**配置場所**：`</head>` の直前（`interview.css` の `<link>` の後）

---

## 4. 章（Chapter）のHTML構造

### 通常章（写真1枚）
```html
<article class="chapter" id="ch1">
  <div class="photo-wrap">
    <div class="photo-img" style="background-image:url('...')"></div>
    <div class="ch-sub-box">
      <p class="ch-num">Chapter 01</p>
      <p class="ch-sub">状況説明的なサブ見出し</p>
    </div>
  </div>
  <div class="ch-body">
    <h2 class="ch-title">メイン見出し</h2>
    <p class="rv">本文...</p>
    <div class="pull rv d1"><p>プルクォート</p></div>
  </div>
</article>
```

### クロスフェード章（写真2枚）
```html
<div class="photo-fade" id="f5">
  <div class="fa" style="background-image:url('...a.jpg')"></div>
  <div class="fb" style="background-image:url('...b.jpg')"></div>
  <div class="ch-sub-box">...</div>
</div>
```

### アニメーションクラス
| クラス | 用途 | トリガー |
|---|---|---|
| `.rv` | 本文フェードイン | `.on` クラス付与 |
| `.ch-sub-box` | サブ見出しスライドイン | 親に `.seen` 付与 |
| `.ch-title` | 章タイトルフェードイン | `.on` クラス付与 |
| `.photo-fade` | クロスフェード（4秒） | `.show-b` クラスtoggle |
| `.d1` / `.d2` | アニメーション遅延 | 0.12s / 0.24s |

---

## 5. 必須JavaScript（`</body>` 直前）

```javascript
// 本文フェードイン
const obs = new IntersectionObserver(e => e.forEach(x => {
  if(x.isIntersecting) x.target.classList.add('on');
}), {threshold:0.1, rootMargin:'0px 0px -30px 0px'});
document.querySelectorAll('.rv').forEach(el => obs.observe(el));

// サブ見出しスライドイン + 章タイトルフェードイン
const photoObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting) {
      entry.target.classList.add('seen');
      const title = entry.target.closest('.chapter')?.querySelector('.ch-title');
      if(title) title.classList.add('on');
    }
  });
}, {threshold:0.25});
document.querySelectorAll('.photo-wrap, .photo-fade').forEach(el => photoObs.observe(el));

// クロスフェード（4秒ごと）
const faders = document.querySelectorAll('.photo-fade');
const faderObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const el = entry.target;
    if(entry.isIntersecting) {
      if(!el._timer) el._timer = setInterval(() => el.classList.toggle('show-b'), 4000);
    } else {
      clearInterval(el._timer); el._timer = null;
    }
  });
}, {threshold:0.3});
faders.forEach(el => faderObs.observe(el));

// ヘッダースクロール
const hd = document.getElementById('hd');
window.addEventListener('scroll', () => hd.classList.toggle('scrolled', scrollY > 50), {passive:true});
```

---

## 6. 画像のR2格納ルール

```
バケット: nq-images
パス: interview/vol{NN}/ファイル名.jpg
URL: https://images.naturalquest.org/interview/vol09/deko_main.jpg
```

| ファイル名パターン | 用途 |
|---|---|
| `*_main.jpg` または `photo_01.jpg` | ヒーロー |
| `*_01.jpg` 〜 `*_010.jpg` | 各章（1枚） |
| `*_04a.jpg` / `*_04b.jpg` | クロスフェード章（2枚） |
| `*_profile.jpg` | プロフィールセクション |

**注意**：R2に上書きアップロード後は必ずCloudflareキャッシュをカスタムPurge。

---

## 7. 記事別の実装状況

| slug | 人物 | vol | Schema.org | イントロ補足 | 状態 |
|---|---|---|---|---|---|
| miyakawa-akiko | 宮川明子 | 03 | ✅完了 | ✅完了 | 完成 |
| nakajima-deko | 中島デコ | 09 | Cursor指示済み | 小林さん執筆待ち | 進行中 |
| tojo-yuriko-1 | 東城百合子（前編） | 08 | Cursor指示済み | 年表記載のみ（イントロ不要） | 進行中 |
| tojo-yuriko-2 | 東城百合子（後編） | 08 | Cursor指示済み | 前後編で共通 | 進行中 |
| hayashi-saodah | 林サオダ | 11 | Cursor指示済み | 小林さん執筆待ち | 進行中 |
| john-bayles | ジョン・ベリス | 05 | ✅完了 | 小林さん執筆待ち | 進行中 |
| everett-kennedy-brown | エバレット・ブラウン | 10 | ✅完了 | 小林さん執筆待ち | 進行中 |

### 記事別のknowsAboutキーワード
| slug | knowsAbout |
|---|---|
| miyakawa-akiko | アロマテラピー、鍼灸、母乳育児、産前産後ケア、オキシトシン |
| nakajima-deko | マクロビオティック、玄米菜食、自然出産、地方移住、自給農業、コミュニティ育児 |
| tojo-yuriko-1,2 | 自然療法、玄米菜食、食養、野草療法、栄養学、家庭医療、自然食 |
| hayashi-saodah | バッチフラワーレメディ、フラワーエッセンス、ホリスティック医療、セルフヒーリング、感情療法 |
| john-bayles | オーガニック食品、フェアトレード、ベジタリアン、環境問題、輸入販売 |
| everett-kennedy-brown | フォトジャーナリズム、日本文化、ブラウンズフィールド、民俗学、古道 |

### datePublished（確定・仮置き含む）
| slug | datePublished | 備考 |
|---|---|---|
| miyakawa-akiko | 2009-01-01 | — |
| nakajima-deko | 2011-01-01 | — |
| tojo-yuriko-1,2 | 2010-01-01 | — |
| hayashi-saodah | 2013-01-01 | **要確認**（仮置き） |
| john-bayles | 2009-11-01 | 詳細確定済み |
| everett-kennedy-brown | 2011-12-01 | — |

---

## 8. イントロ補足文の方針

「古い記事の価値化」戦略として、各記事のイントロ末尾に現代との接続を示す一文を追加。
- 文体は小林さん自身の言葉で執筆（記事トーンとの統一）
- 「逝去」情報は東城百合子のみ年表記載で対応（イントロへの明記は不要と判断）

### 各記事の補足文の方向性
- **中島デコ**：地方移住ブーム・食の自給地産地消・マクロビの科学的再評価（腸内細菌研究）
- **林サオダ**：「セルフケア」という言葉が日常語になった今、バッチ博士の問いかけが先回りしていた趣旨
- **ジョン・ベリス**：1980年代のオーガニック・フェアトレード実践が今日のサステナブル消費を先取りした趣旨
- **エバレット・ブラウン**：2011年震災直後の「日本の仕切り直し」という言葉が時代を超えて問いかける趣旨

---

## 9. 特記事項・注意

- **東城百合子**：前後編でSchema.orgは同一内容。2020年2月22日逝去、享年94歳。
- **中島デコ↔エバレット**：夫婦のため双方向リンク推奨（`.book` クラスで実装可能）
- **エバレット**：`alternateName: 'Everett Kennedy Brown'` 英語名も併記
- **ジョン・ベリス**：Astro変数（`imgChapter()`、`fadePair()`）で画像管理を整理済み
- **東城記事**：前編プロフィールに後編リンク、後編に前編リンクあり

---

## 10. 新しいインタビューページを作る手順

1. R2に画像をアップロード（`interview/vol{NN}/`）
2. Cloudflareキャッシュをカスタムパージ
3. `src/pages/interview/{slug}.astro` を作成
   - 既存ページ（nakajima-deko.astro）をベースにコンテンツを差し替え
   - `<head>` はテンプレートのまま（vol番号・title・descriptionのみ変更）
4. `src/pages/interview/index.astro` にカードを追加
5. `npm run build` でエラーがないことを確認
6. `git push` でデプロイ

---

## 11. よくあるトラブルと対処

| 症状 | 原因 | 対処 |
|---|---|---|
| テキストが表示されない | `.rv` が `.on` にならない | JSの `.on` 付与コードを確認 |
| サブ見出しが出ない | `.photo-wrap` に `.seen` が付かない | photoObsのJSを確認 |
| クロスフェードしない | `.show-b` のtoggleがない | faderObsのJSを追加 |
| CSSが効かない | `public/styles/` にコピーされていない | `cp src → public` を実行 |
| 画像が白い | R2キャッシュが古い | Cloudflare Custom Purge |
| サイト全体がダーク | `<style is:global>` が干渉 | `interview.css` のlink読み込みのみに変更 |

---

## 12. 残タスク

| タスク | 内容 | 担当 |
|---|---|---|
| イントロ補足執筆 | 中島デコ・林サオダ・ジョン・ベリス・エバレットの4本 | 小林さん |
| 林サオダ取材年確認 | `datePublished` を正確な年に修正 | 要確認後Cursor |
| デコ↔エバレット相互リンク | 両記事プロフィール末尾に `.book` クラスで追加 | Cursor |

---

## 13. SEO・GA4メモ（2026年4月後半）

**GA4クリック発生クエリ（Schema.org mentions の効果確認）：**
- 「中島デコ 宗教」「東城百合子 夫」→ 公開直後にクリック発生

**要対応クエリ群（Search Console 4/26〜5/2）：**
| クラスター | 表示数 | 対応方針 |
|---|---|---|
| よもぎ関連（味噌汁・発酵液） | 約24 | 「作り方」セクション強化 |
| アホエンオイル関連 | 約5 | 「作り方」記事の充実 |
| 天恵緑汁関連 | 約8 | 東城記事との連携確認 |

**東城百合子 description 改善候補：**
「東城百合子 夫」で検索需要あり。後編の `interviewDesc` に夫・五来長利との経緯を含める改訂を検討。

---

## 14. 将来計画

- 他のvol.を順次追加（東城百合子など既存原稿から）
- 各記事に「当時と今」解説1Pを追加予定
- タグ・カテゴリページ導入でTopical Authority強化
- アロマAIチャットへの内部リンク挿入候補：宮川明子 Chapter 03/05
- 東城↔よもぎ・天恵緑汁記事のクロスリンクで食・健康カテゴリ回遊を強化
