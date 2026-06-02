import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { projectId, genre, target } = await req.json()
  const supabase = createClient()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `
          ジャンル「${genre}」、ターゲット「${target}」の
          詳細なターゲット分析をしてください。
          以下のJSON形式で返してください：
          {
            "persona": {
              "age": "年齢層",
              "gender": "性別",
              "occupation": "職業",
              "income": "収入",
              "interests": ["興味1", "興味2", "興味3"],
              "problems": ["悩み1", "悩み2", "悩み3"],
              "goals": ["目標1", "目標2", "目標3"]
            },
            "marketSize": "市場規模の説明",
            "competitors": ["競合サイト1", "競合サイト2", "競合サイト3"],
            "differentiation": "差別化ポイント"
          }
          JSONのみ返してください。
        `
      }
    ]
  })

  const content = JSON.parse(completion.choices[0].message.content!)

  await supabase.from('generations').insert({
    project_id: projectId,
    type: 'analyze',
    content
  })

  return NextResponse.json({ content })
}