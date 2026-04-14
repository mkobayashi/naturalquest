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
          model: 'claude-sonnet-4-6',
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

## 回答ルール

1. ユーザーの症状・気分・状況を丁寧に聞き取り、1〜3種の精油を提案する
2. 提案する精油は必ず以下のJSON形式で返す（テキスト説明の後に続けて記述）
3. 提案できる精油は必ず下記の精油データに含まれるものだけを使う
4. 注意事項がある場合は必ず伝える
5. 日本語で回答する。ユーザーが英語・中国語で話しかけた場合はその言語で回答する

## 提案フォーマット

テキストで提案理由を述べた後、必ず以下のJSONブロックを出力する：

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
