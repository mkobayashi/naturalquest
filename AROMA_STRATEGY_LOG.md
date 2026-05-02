# アロマ戦略・設計・実装ログ
## naturalquest.org / アロマAIチャット＋コンテンツ導線
## 最終更新：2026年5月1日

---

## 戦略概要

### サイト内での位置づけ
- naturalquest.orgの「お楽しみコーナー」として /aroma/ に配置
- 独立サービスではなくサイトの奥にある体験型コンテンツ
- 精油への関心を高め、購入・記事回遊へつなぐ導線の中核

### 収益化ロードマップ
- **フェーズ1（実装済み）**：Amazonアソシエイト・楽天アフィリエイトリンク
- **フェーズ2（進行中）**：記事サイドバー購入導線・精油ショップページ
- **フェーズ3（将来）**：bristlecone.jpへのリフォーム相談導線・情報コンテンツ販売

### トラッキングID
- Amazon：`naturalquesto-22`
- 楽天：各商品ページのアフィリURLを個別管理

---

## システム構成

### 技術スタック
- フロントエンド：Astro（naturalquest.org）
- APIプロキシ：Cloudflare Workers（aroma-api）
- AI：Claude Haiku（claude-haiku-4-5-20251001）
- データ：JSON（src/data/ 以下）
- 画像：Cloudflare Pages静的配信

### Workers情報
- Worker名：`aroma-api`
- URL：`https://aroma-api.kobayashi-ece.workers.dev`
- デプロイコマンド：
  ```bash
  cd ~/Desktop/naturalquest/workers/aroma-api
  wrangler deploy --config wrangler.toml
  ```

### 環境変数
- `.env.production` に `PUBLIC_AROMA_WORKER_URL` を記載（Gitで管理）
- Cloudflare PagesのVariables and Secretsにも設定済み
- `ANTHROPIC_API_KEY` はWorkerのシークレットとして登録

---

## チャットUI設計

### URL
`https://naturalquest.org/aroma/`

### 会話フロー（PROMPT.mdで管理）
1. 症状・悩みの深掘り（1問・選択ボタン）
2. 香りの好み（1問・選択ボタン）
3. 精油を最大3種提案

### 即時回答ケース
- 精油名を直接指定した場合
- 症状と香りが1メッセージで揃った場合

### UI構成
- 吹き出し型（AI左寄せ・ユーザー右寄せ）
- 選択ボタン（白背景・緑ボーダー・丸型）
- 「最初からやり直す」ボタン（チャット枠外上部）
- IME誤送信防止（compositionstart/end + setTimeout 50ms）
- 精油カードをAI吹き出しの直後にインライン表示

### 精油カードの構成（上から順）
1. イラスト（float left 42%）+ ノート・香りの系統・精油名・学名
2. 作用タグ・適応タグ
3. リード文
4. 心に・カラダに・美に・注意事項（背景色ボックス）
5. 使い方アイコン（44px・ラベル付き）
6. 関連記事（最大4本）
7. 精油を探すボタン（オレンジ・ショップページへ）

### チャット下部タブ
- 「基礎知識」：精油の利用法（howto.html）
- 「ご注意」：使用上の注意＋安全性

---

## システムプロンプトルール（PROMPT.md）

**ファイル場所：** `workers/aroma-api/PROMPT.md`

### 確定ルール（変更禁止）
- 会話フロー：症状1問→香り1問→提案の2往復固定
- 提案数：最大3種
- JSONブロックの出力形式

### 禁止事項
- 1回の返答に2問以上
- 太字・見出し・絵文字
- 断定的な効能表現
- 継続を促す締めくくり文
- 精油IDコード（es_01など）の表示
- 詳細説明（カード表示に任せる）

### Cursorへの指示テンプレート
```
workers/aroma-api/PROMPT.md のルールを確認した上で修正してください。
```

---

## データファイル一覧

| ファイル | 場所 | 内容 |
|---|---|---|
| aroma_oils.json | src/data/ | 精油データ61件（全フィールド） |
| aroma_affiliate.json | src/data/ | アフィリエイトリンク47件 |
| aroma_shop_data.json | src/data/ | ショップ商品データ15精油 |
| aroma_article_mapping.json | src/data/ | 精油↔記事マッピング |

### aroma_oils.json フィールド一覧
id, name, name_en, latin, alias, family, type, origins, extraction, parts, components, note, scent_type, effects, indications, catch, lead, for_mind, for_body, for_beauty, for_purpose_other, caution, usage（配列）

### 用法アイコンマッピング（確定）
- 芳香浴 → usage_aroma.png
- アロマバス → usage_bath.png
- オイルマッサージ → usage_oil.png
- 足浴 → usage_point.png
- サシェ・軟膏・ヘアシャンプー・クリーニング → usage_other.png

---

## 画像ファイル

| 種類 | 場所 | 内容 |
|---|---|---|
| 精油イラスト | public/images/oils/ | full_es_01.png〜full_es_61.png |
| 用法アイコン | public/images/usage/ | usage_*.png 5枚 |
| ヒーローイラスト | public/images/ | herbaroma.jpg |

---

## ページ構成

| URL | ファイル | 内容 |
|---|---|---|
| /aroma/ | src/pages/aroma/index.astro | チャットページ |
| /aroma/shop/ | src/pages/aroma/shop/index.astro | 全精油一覧（管理用） |
| /aroma/shop/[id]/ | src/pages/aroma/shop/[id].astro | 精油個別ショップページ |

---

## コンポーネント一覧

| コンポーネント | 内容 |
|---|---|
| AromaChat.astro | チャットUI本体・精油カード生成 |
| OilCard.astro | 精油結果カード |
| AromaGuide.astro | 基礎知識・ご注意タブ（チャット下部） |
| ArticleAromaSidebar.astro | 記事サイドバー購入リンク |

---

## アフィリエイト設計

### 商品選定方針
- プラナロム優先（ケモタイプ精油・品質重視）
- フロリハナ（オーガニック）
- ニールズヤードレメディーズ
- 生活の木
- 各精油1〜4商品・最大3ブランド

### ボタン仕様
- チャット精油カード：オレンジボタン「〇〇精油を探す →」→ ショップページへ
- ショップページ：Amazon（オレンジ）・楽天（赤）の個別ボタン
- 記事サイドバー：オレンジボタン「〇〇精油を選ぶ →」→ ショップページへ

### アフィリエイトカバー状況
- aroma_affiliate.json：47精油
- aroma_shop_data.json：15精油（複数ブランド）
- 残り14精油のショップデータは追加予定

---

## 記事連携

### 対象記事（26本）
herb-aroma-azuki / herb-aroma-getto / herb-aroma-thyme /
herb-aroma-autumn / herb-aroma-v6-neck / herb-aroma-essential /
herb-aroma-easy-diy / herb-aroma-v1-drink / herb-aroma-power /
herb-aroma-oil / herb-aroma-sweets / herb-aroma-v3-summer /
herb-aroma-v4-gut / herb-aroma-v5-sleep / herb-aroma-baking /
herb-aroma-protect / herb-aroma-v2-sun / herb-aroma-v6-cold /
herb-aroma-sunburn / tachibana-aroma / herb-aroma-pet /
herbtea-throat / lavender-skin-care 他

### 連携実装済み
- 精油カード → 関連記事リンク（最大4本）
- 記事サイドバー → 精油ショップページ
- 記事サイドバー → アロマAIチャット誘導

---

## TOPページ導線

- 下部バナー（herbaroma.jpgイラスト50%・テキスト50%）
- コピー：「精油選びに迷ったら」／「アロマAIチャット」
- ボタン：「チャットを開く」→ /aroma/

---

## 残課題

### 優先度高
- [ ] ショップデータの残り精油追加（現在15種→61種へ拡張）
- [ ] 記事サイドバーのデザイン最終確認（複数精油表示時）
- [ ] 「太陽光・蓄電池」バナーがアロマページに表示されている件の確認・除去

### 優先度中
- [ ] Amazonアソシエイト承認後のPA-API申請（商品サムネイル取得）
- [ ] es_58（ローズオットー）の文章手動修正
- [ ] ノート空欄5件の補完

### 優先度低
- [ ] intro系ガイダンス記事のビジュアル素材準備→本体記事化
- [ ] 多言語対応確認
- [ ] Cloudflare R2への画像移行検討

---

## 改善メモ（ユーザビリティ）

- 購入に至らない主因：単品直リンクでは比較検討の余地がなかった→ショップページで解決
- 既存記事20本以上との連携で「記事→精油→購入」の流れが完成
- 回答品質：Haikuモデルで十分。選択ボタンにより対話が自然に進む
- モバイル対応：font-size 16px で自動ズーム防止済み
