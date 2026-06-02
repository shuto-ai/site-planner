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
          Webメディアサイトの構成を日本語で考えてください。
          以下のJSON形式で返してください：
          {
            "siteName": "サイト名",
            "concept": "サイトのコンセプト（100文字以内）",
            "categories": ["カテゴリ1", "カテゴリ2", "カテゴリ3"],
            "topPages": [
              {"title": "ページタイトル", "description": "説明"}
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
    type: 'site_structure',
    content
  })

  return NextResponse.json({ content })
}