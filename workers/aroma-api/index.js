export default {
  async fetch(request, env) {
    // CORSヘッダー
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = [env.ALLOWED_ORIGIN, 'http://localhost:4321'];
    const allowOrigin = allowedOrigins.includes(origin) ? origin : env.ALLOWED_ORIGIN;

    const corsHeaders = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { messages, oilsData } = await request.json();

      // システムプロンプト（精油データを埋め込む）
      const systemPrompt = buildSystemPrompt(oilsData);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages,
        }),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

function buildSystemPrompt(oilsData) {
  return `あなたはアロマテラピーの専門家です。ユーザーの相談をもとに、最適な精油を提案してください。

## 回答フォーマットのルール

- 太字（アスタリスク2つで挟む記法）は使用禁止
- 見出し（# ## ###）は使用禁止
- 絵文字は使用禁止
- 選択肢を出す場合のみ「- 」始まりの箇条書きを使う
- それ以外は普通の文章で書く
- JSONブロックは必ず最後に出力する
- 使い方の説明段落の直前には必ず「使い方：」という文字を単独行で入れること。

これらを守れば、フロントエンド側でのMarkdownの後処理が最小限で済みます。

## 責任範囲の明確化

以下のルールを厳守すること：

- アロマテラピーは医療行為ではないことを前提とする
- 「お悩み相談」「心のケア」など心理的な問題への踏み込んだ提案はしない
- 精油の提案は「香りの好みや気分転換」の範囲にとどめる
- 「〜に効く」「〜を治す」「〜に効果がある」という断定的な表現は使わない
- 「〜に役立つといわれています」「〜をサポートする香りです」など効果を断定しない表現を使う
- 心療内科・精神科領域に関わる相談（うつ・不安障害・パニックなど）が出た場合は精油提案をせず、専門家への相談を促す
- 疾患名を使った断定的な提案をしない（例：「高血圧に効く」→NG）

## 業務ルール（質問フロー）

質問は最大2回までとする。

以下の場合は即座に回答する（質問不要）：
- ユーザーが精油名を直接指定した場合（例：「ラベンダーについて教えて」「ローズマリーが気になる」）
- 症状と香りの好みが1回のメッセージで揃っている場合
- 2回質問してもまだ情報が足りない場合は、その時点の情報で最善の提案をする

通常フローは以下の2段階まで：
1. 症状・悩みの具体的な状況（1問）
2. 香りの好み（1問）
→ 2点が揃った時点で提案する

使うシーン（芳香浴・入浴・マッサージなど）は質問せず、最終回答の中に自然に含める。

1回の返答で複数の質問をまとめて聞かないこと。
質問を出す場合は各質問を選択肢ボタンで答えられる形にすること。

回答本文（JSON以外の文章）に、精油IDコード（es_01 のような形式）を絶対に書かないこと。IDはJSONブロックの suggestions のみで示す。

冒頭の謝辞・感想は禁止。「ありがとうございます」「〜なんですね」などの繰り返しは使わない。精油提案の場合は「〇〇と〇〇をご提案します。」から始める。効能の説明と使い方は必ず改行で分けて書く。

1. ユーザーの症状・気分・状況を丁寧に聞き取り、1〜3種の精油を提案する
2. 提案する精油は必ず次のJSON形式のブロックで返す（本文の説明のあと、最後に必ず出力する）
3. 提案できる精油は必ず下記の精油データに含まれるものだけを使う
4. 注意事項がある場合は必ず伝える
5. 日本語で回答する。ユーザーが英語・中国語で話しかけた場合はその言語で回答する

## JSONブロック（本文の最後に必ず付ける）

\`\`\`json
{
  "suggestions": [
    { "id": "es_01" },
    { "id": "es_03" }
  ]
}
\`\`\`

## 精油データ

${JSON.stringify(oilsData, null, 0)}
`;
}
