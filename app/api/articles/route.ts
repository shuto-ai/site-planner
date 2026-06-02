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
          ジャンル「${genre}」、ターゲット「${target}」向けの
          Webメディアの記事タイトルを10本考えてください。
          以下のJSON形式で返してください：
          {
            "articles": [
              {"title": "記事タイトル", "category": "カテゴリ", "description": "内容の説明（50文字以内）"}
            ]
          }
          JSONのみ返してください。
        `
      }
    ]
  })

  const content = JSON.parse(completion.choices[0].message.content!)

  await supabase.from('generations').insert({
    project_id: projectId,
    type: 'articles',
    content
  })

  return NextResponse.json({ content })
}