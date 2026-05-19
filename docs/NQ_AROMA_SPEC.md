# NQ_AROMA_SPEC.md
## naturalquest.org アロマAIチャット 統合仕様書
### 最終更新：2026年5月3日

---

## 1. システム構成

### 技術スタック
- フロントエンド：Astro（naturalquest.org / Cloudflare Pages）
- APIプロキシ：Cloudflare Workers（aroma-api）
- AI：Claude Haiku（claude-haiku-4-5-20251001）
- データ：JSON（src/data/ 以下）
- 画像：Cloudflare Pages静的配信（将来R2移行検討）

### Workers情報
- Worker名：`aroma-api`
- URL：`https://aroma-api.kobayashi-ece.workers.dev`
- デプロイコマンド：
  ```bash
  cd ~/Desktop/naturalquest/workers/aroma-api
  wrangler deploy --config wrangler.toml
  ```

### 環境変数
| 変数名 | 場所 | 値 |
|---|---|---|
| PUBLIC_AROMA_WORKER_URL | .env.production（Git管理） | https://aroma-api.kobayashi-ece.workers.dev |
| ANTHROPIC_API_KEY | Workerシークレット | Anthropic APIキー |

**注意**：Cloudflare PagesのVariables and Secretsだけではビルド時に反映されない。`.env.production` が必須。

---

## 2. ファイル構成

```
naturalquest/
├── src/
│   ├── pages/
│   │   ├── index.astro              # TOP（バナー導線あり）
│   │   └── aroma/
│   │       ├── index.astro          # チャットページ
│   │       └── shop/
│   │           ├── index.astro      # 全精油一覧（管理用）
│   │           └── [id].astro       # 精油個別ショップページ
│   ├── components/aroma/
│   │   ├── AromaChat.astro          # チャットUI本体・精油カード生成
│   │   ├── OilCard.astro            # 精油結果カード
│   │   ├── AromaGuide.astro         # 基礎知識・ご注意タブ（チャット下部）
│   │   └── ArticleAromaSidebar.astro # 記事サイドバー購入リンク
│   └── data/
│       ├── aroma_oils.json          # 精油マスタ61件
│       ├── aroma_affiliate.json     # アフィリエイトリンク47件
│       ├── aroma_shop_data.json     # ショップ商品データ15精油
│       └── aroma_article_mapping.json # 精油↔記事マッピング
├── public/images/
│   ├── oils/                        # full_es_01.png〜full_es_61.png
│   ├── usage/                       # 用法アイコン5枚
│   └── herbaroma.jpg                # TOPバナー用イラスト
└── workers/aroma-api/
    ├── index.js                     # Cloudflare Workers本体
    ├── wrangler.toml
    └── PROMPT.md                    # システムプロンプトルール（確定事項）
```

---

## 3. PROMPT.md ルール（変更禁止）

**ファイル場所：** `workers/aroma-api/PROMPT.md`

Cursorへの修正指示は必ず以下の一文を冒頭に入れること：
```
workers/aroma-api/PROMPT.md のルールを確認した上で修正してください。
```

### 確定ルール
- 会話フロー：症状1問 → 香りの好み1問 → 精油提案（2往復固定）
- 提案数：最大3種
- JSONブロックの出力形式を維持

### 禁止事項（AIへの指示）
- 1回の返答に2問以上
- 太字・見出し・絵文字
- 断定的な効能表現
- 継続を促す締めくくり文
- 精油IDコード（es_01など）の表示
- 詳細説明（カード表示に任せる）

### 即時回答ケース（1往復でOK）
- 精油名を直接指定した場合
- 症状と香りが1メッセージで揃った場合

---

## 4. データファイル仕様

### aroma_oils.json（61件）
フィールド：id, name, name_en, latin, alias, family, type, origins, extraction, parts, components, note, scent_type, effects, indications, catch, lead, for_mind, for_body, for_beauty, for_purpose_other, caution, usage（配列）

イラスト参照：`/images/oils/full_${id}.png`

### aroma_affiliate.json（47件）
フォーマット：`{ url, label, brand, rakuten_url, rakuten_label }`
- AmazonトラッキングID：`naturalquesto-22`
- 楽天：個別管理

### aroma_shop_data.json（現在15精油）
フォーマット：`{ name, products: [{ brand, name, volume, quality, asin, amazon_url, rakuten_url }] }`
ブランド優先順：プラナロム > フロリハナ > ニールズヤード > 生活の木

### aroma_article_mapping.json
フォーマット：`{ oil_to_articles: { "es_53": [{ slug, title }] } }`
**注意**：2026年5月3日に全件再構築済み。src/data/への上書きとgit pushが未完了（要対応）

---

## 5. ID運用の注意（重要・変更禁止）

開発経緯によりIDと精油名にズレがある：

| ID | aroma_oils.json | shop/affiliate/mappingでの扱い |
|---|---|---|
| es_58 | ローズウッド | ローズウッド（一致） |
| es_59 | ローズウッド | **ローズマリーとして運用** |

**この不一致は意図的なものであり修正しない。** PROMPT.mdにも運用メモ追記済み。

---

## 6. チャットUI仕様

### URL：`https://naturalquest.org/aroma/`

### UI構成
- 吹き出し型（AI左寄せ・ユーザー右寄せ）
- 選択ボタン（白背景・緑ボーダー・丸型、自動送信）
- 「最初からやり直す」ボタン（チャット枠外上部）
- IME誤送信防止：compositionstart/end + setTimeout 50ms
- 精油カード：AI吹き出しの直後にインライン表示

---

## 7. 精油カードの表示構成（上から順・変更禁止）

1. イラスト（float left 42%）＋ ノート・香りの系統・精油名・学名
2. 作用タグ・適応タグ
3. リード文
4. 心に・カラダに・美に・注意事項（背景色ボックス）
5. 使い方アイコン（44px・ラベル付き）
6. 関連記事（最大4本）
7. 「〇〇精油を探す →」ボタン（オレンジ・ショップページへ）

### 用法アイコンマッピング（確定・変更禁止）
| 用法 | アイコンファイル |
|---|---|
| 芳香浴 | usage_aroma.png |
| アロマバス | usage_bath.png |
| オイルマッサージ | usage_oil.png |
| 足浴 | usage_point.png |
| サシェ・軟膏・ヘアシャンプー・クリーニング | usage_other.png |

---

## 8. 記事サイドバーの仕組み

`ArticleAromaSidebar.astro` が記事スラッグを受け取り、
`aroma_article_mapping.json` から精油IDを逆引きして
`aroma_shop_data.json` に存在する精油のみ購入ボタンを表示する。

### アロマ関連記事の正確なスラッグ一覧（23件）
```
herb-aroma-autumn, herb-aroma-azuki, herb-aroma-baking,
herb-aroma-easy-diy, herb-aroma-essential, herb-aroma-getto,
herb-aroma-oil, herb-aroma-pet, herb-aroma-power, herb-aroma-protect,
herb-aroma-sunburn, herb-aroma-sweets, herb-aroma-thyme,
herb-aroma-v1-drink, herb-aroma-v2-sun, herb-aroma-v3-summer,
herb-aroma-v4-gut, herb-aroma-v5-sleep, herb-aroma-v6-cold,
herb-aroma-v6-neck, lavender-skin-care, tachibana-aroma, herbtea-throat
```

---

## 9. アフィリエイト・収益設計

### ボタン仕様
- チャット精油カード：「〇〇精油を探す →」（オレンジ）→ ショップページへ
- ショップページ：Amazon（`#ff9900` / `.btn-amazon`）・楽天（赤）の個別ボタン。Amazon 色は `global.css` の `--color-nq-amazon` で全ページ統一
- 記事サイドバー：「〇〇精油を選ぶ →」（オレンジ）→ ショップページへ

### 収益化ロードマップ
- フェーズ1（実装済み）：Amazonアソシエイト・楽天アフィリエイトリンク
- フェーズ2（進行中）：記事サイドバー購入導線・精油ショップページ
- フェーズ3（将来）：bristlecone.jpへのリフォーム相談導線・情報コンテンツ販売

---

## 10. TOPページ導線

- 下部バナー（herbaroma.jpgイラスト50%・テキスト50%）
- コピー：「精油選びに迷ったら」／「アロマAIチャット」
- ボタン：「チャットを開く」→ /aroma/

---

## 11. よく使うCursorへの指示パターン

### Workers修正・デプロイ
```
workers/aroma-api/PROMPT.md のルールを確認した上で
buildSystemPrompt() を修正してください。
修正後ターミナルで：
cd ~/Desktop/naturalquest/workers/aroma-api
wrangler deploy --config wrangler.toml
```

### フロントエンド修正
```
（修正内容）
git push まで実行してください。
```

### 強制再ビルド（反映されない時）
```bash
cd ~/Desktop/naturalquest
git commit --allow-empty -m "force rebuild"
git push
```

---

## 12. 残課題

### 優先度高
- [ ] `aroma_article_mapping.json` の最新版を src/data/ に上書き → git push（2026年5月3日時点で未完了）
- [ ] 各記事サイドバーの表示確認・マッピング修正（herb-aroma-v2-sun など）
- [ ] ショップデータを残り46精油に拡張（現在15精油のみ）

### 優先度中
- [ ] 「太陽光・蓄電池の補助金」バナーがアロマ記事に表示される問題の確認・除去
- [ ] es_58（ローズオットー）の文章手動修正（現在ローズと同じ内容）
- [ ] ノート空欄5件の補完
- [ ] Amazonアソシエイト承認後のPA-API申請（商品サムネイル取得）

### 優先度低
- [ ] ガイダンス記事（intro系）のビジュアル素材準備→本体記事化
- [ ] 多言語対応確認（英語・中国語）
- [ ] Cloudflare R2への画像移行検討
