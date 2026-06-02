import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { projectId, genre, target, siteName } = await req.json()
  const supabase = createClient()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: `
          以下の情報をもとに広告営業メールを作成してください。
          サイト名：${siteName}
          ジャンル：${genre}
          ターゲット：${target}
          
          以下のJSON形式で返してください：
          {
            "subject": "メールの件名",
            "body": "メール本文",
            "targetCompanies": ["営業先企業候補1", "営業先企業候補2", "営業先企業候補3", "営業先企業候補4", "営業先企業候補5"]
          }
          JSONのみ返してください。
        `
      }
    ]
  })

  const content = JSON.parse(completion.choices[0].message.content!)

  await supabase.from('generations').insert({
    project_id: projectId,
    type: 'sales_mail',
    content
  })

  return NextResponse.json({ content })
}