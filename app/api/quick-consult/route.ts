import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// 案件コンテキストに紐づいた簡易AI相談（Phase 2 用）
export async function POST(req: NextRequest) {
  const { question, context } = await req.json()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'あなたはビジネス相談AIです。案件コンテキストを踏まえて、質問に具体的で実用的なアドバイスを提供します。必ずJSON形式のみで返してください。',
      },
      {
        role: 'user',
        content: `【案件情報】
${context}

【相談内容】
${question}

以下のJSON形式で回答してください：
{
  "summary": "回答の要約（50文字以内）",
  "answer": "詳細な回答（400文字程度、具体的なアドバイスを含む）",
  "actionItems": ["今すぐやること1", "今すぐやること2", "今すぐやること3"],
  "taskList": [
    {"name": "タスク名（動詞から始める具体的な行動）", "category": "記事作成 | アプリ開発 | 営業 | SNS | 調査 | その他", "priority": "高 | 中 | 低", "estimatedTime": "30分"}
  ]
}`,
      },
    ],
  })

  const content = JSON.parse(completion.choices[0].message.content!)
  return NextResponse.json({ content })
}
