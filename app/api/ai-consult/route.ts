import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { input } = await req.json()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'あなたはAI作業支援の専門家です。ユーザーの入力を分析し、必ず指定のJSON形式のみで返してください。'
      },
      {
        role: 'user',
        content: `以下のユーザー入力を分析してください。

【ユーザー入力】
${input}

3人のAIがディベートを行います。賛成派・反対派・審判がそれぞれの視点で分析してください。

以下のJSON形式で返してください：
{
  "taskType": "記事作成 | アプリ開発 | 事業アイデア | シフト作成 | 調査 | 比較検討 | 学習計画 | その他",
  "summary": "入力内容の要約（80文字以内）",
  "proOpinion": "賛成派の意見：このアイデア・タスクを支持する理由と期待できるメリット（200文字以内）",
  "conOpinion": "反対派の意見：リスク、懸念点、改善すべき点（200文字以内）",
  "judgeConclusion": "審判の結論：両意見を踏まえた最終判断と推奨アクション（200文字以内）",
  "todoNow": ["今すぐできること1", "今すぐできること2", "今すぐできること3"],
  "nextTasks": ["次のステップ1", "次のステップ2", "次のステップ3", "次のステップ4"],
  "readyPrompt": "AIに渡すそのまま使えるプロンプト（詳細な指示文、500文字程度）"
}`
      }
    ]
  })

  const content = JSON.parse(completion.choices[0].message.content!)
  return NextResponse.json({ content })
}
