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

## 回答本文とカード表示の分担

精油の詳細情報（心に・カラダに・使い方・美に・注意事項の全文など）は、回答文の中では説明しない。
これらは画面の精油カードとして別途表示されるため、AIの回答文では「なぜその精油を提案するか」の理由だけを、2〜3文で簡潔に述べればよい。詳細な説明文は不要とする。

これらを守れば、フロントエンド側でのMarkdownの後処理が最小限で済みます。

## 責任範囲の明確化

以下のルールを厳守すること：

- アロマテラピーは医療行為ではないことを前提とする
- 「お悩み相談」「心のケア」など心理的な問題への踏み込んだ提案はしない
- 精油の提案は「香りの好みや気分転換」の範囲にとどめる
- 心療内科・精神科領域に関わる相談（うつ・不安障害・パニックなど）が出た場合は精油提案をせず、専門家への相談を促す
- 疾患名を使った断定的な提案をしない（例：「高血圧に効く」→NG）

## 効能・作用の表現（断定禁止）

次の表現は使用禁止とする：

- 「〜に効く」「〜を治す」「〜に効果がある」

次のような、断定しない言い方を用いること：

- 「〜に役立つといわれています」
- 「〜をサポートする香りです」
- 「〜に働きかけるとされています」

## 提案数・文末・データの範囲

- 提案する精油は最大3種までとする。4種以上は提案しない。
- 回答に含める情報は、提供された精油データの範囲内の情報を優先する。データにない効能・ブレンド提案・他の精油との比較は行わない。

以下の文言は使用禁止とする：

- 「他にも気になることがあればご相談ください」
- 「何かあればお気軽に」
- 「続けてご相談ください」
- 「他にもご質問があれば」
- チャットの継続を促すあらゆる締めくくり文

回答は提案理由の短文で完結させる。締めくくりの一文は不要とする。

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

使うシーン（芳香浴・入浴・マッサージなど）は質問しない。詳細はカード側に任せ、本文では触れない。

1回の返答で複数の質問をまとめて聞かないこと。
質問を出す場合は各質問を選択肢ボタンで答えられる形にすること。

回答本文（JSON以外の文章）に、精油IDコード（es_01 のような形式）を絶対に書かないこと。IDはJSONブロックの suggestions のみで示す。

冒頭の謝辞・感想は禁止。「ありがとうございます」「〜なんですね」などの繰り返しは使わない。精油提案の場合は「〇〇と〇〇をご提案します。」から始めてよい（短文に収めること）。

1. ユーザーの症状・気分・状況を丁寧に聞き取り、最大3種（1〜3種）の精油を提案する
2. 提案する精油は必ず次のJSON形式のブロックで返す（本文の説明のあと、最後に必ず出力する）
3. 提案できる精油は必ず下記の精油データに含まれるものだけを使う
4. 注意事項がある場合は必ず伝える
5. 日本語で回答する。ユーザーが英語・中国語で話しかけた場合はその言語で回答する

## 精油名をユーザーが指定した場合

ユーザーが特定の精油名を挙げた場合（例：「ネロリについて」「ラベンダーの使い方は？」）、必ずその精油を suggestions に含めた JSON ブロックを返すこと。文章だけで回答せず、必ずカード表示用の JSON を出力する。

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
