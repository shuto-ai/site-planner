import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { staffList, preferences, requiredCount, month, notes } = await req.json()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'あなたはシフト管理の専門家です。公平で実用的なシフト表を作成します。必ず指定のJSON形式のみで返してください。'
      },
      {
        role: 'user',
        content: `以下の条件でシフト表を作成してください。

スタッフ一覧：${staffList}
希望休・シフト希望：${preferences}
1日の必要人数：${requiredCount}人
対象月：${month}
備考・ルール：${notes}

対象月の日数を計算し、全スタッフのシフトを作成してください。
各日の値は「出」「休」のいずれかです。
希望休を最大限考慮しつつ、毎日必要人数を確保してください。

以下のJSON形式で返してください：
{
  "month": "対象月（例：2024年6月）",
  "daysCount": 30,
  "staff": ["スタッフ名1", "スタッフ名2"],
  "shifts": {
    "スタッフ名1": ["出", "出", "休", "出"],
    "スタッフ名2": ["休", "出", "出", "出"]
  },
  "dailyCount": [2, 1, 2, 2],
  "warnings": ["注意事項（人数不足の日など）"],
  "summary": "シフト作成の概要と特記事項（200文字以内）"
}`
      }
    ]
  })

  const content = JSON.parse(completion.choices[0].message.content!)
  return NextResponse.json({ content })
}
