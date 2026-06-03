import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { goal } = await req.json()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'あなたは収益化の専門コンサルタントAIです。具体的で実行可能な収益化プランを提案します。必ずJSON形式のみで返してください。',
      },
      {
        role: 'user',
        content: `以下の収益化目標・状況を分析してください。

【目標・状況】
${goal}

以下のJSON形式で返してください：
{
  "summary": "この目標の総評と最重要アドバイス（200文字以内）",
  "methods": [
    {
      "name": "収益手段名",
      "difficulty": "初級 | 中級 | 上級",
      "initialCost": "初期費用（例：0円〜3万円）",
      "revenueTimeline": "収益化まで（例：3〜6ヶ月）",
      "monthlyPotential": "月収ポテンシャル（例：1〜10万円）",
      "description": "この方法の概要と特徴（100文字以内）",
      "pros": ["メリット1", "メリット2"],
      "cons": ["デメリット1", "デメリット2"],
      "firstStep": "今日すぐできる最初の一歩（具体的に）"
    }
  ],
  "timeline": {
    "today":     ["今日やること1", "今日やること2", "今日やること3"],
    "tomorrow":  ["明日やること1", "明日やること2"],
    "thisWeek":  ["今週やること1", "今週やること2", "今週やること3"],
    "thisMonth": ["今月やること1", "今月やること2", "今月やること3"]
  },
  "roadmap": [
    {"phase": "フェーズ1", "period": "1〜2週間", "goal": "達成目標", "tasks": ["タスク1", "タスク2"]},
    {"phase": "フェーズ2", "period": "1ヶ月",    "goal": "達成目標", "tasks": ["タスク1", "タスク2"]},
    {"phase": "フェーズ3", "period": "3ヶ月",    "goal": "達成目標", "tasks": ["タスク1", "タスク2"]},
    {"phase": "フェーズ4", "period": "6ヶ月",    "goal": "達成目標", "tasks": ["タスク1", "タスク2"]}
  ]
}`,
      },
    ],
  })

  const content = JSON.parse(completion.choices[0].message.content!)
  return NextResponse.json({ content })
}
