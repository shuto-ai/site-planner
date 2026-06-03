import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { topic, targetAudience, keywords } = await req.json()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'あなたはSEOと記事ライティングの専門家です。必ず指定のJSON形式のみで返してください。'
      },
      {
        role: 'user',
        content: `以下の条件で記事企画を作成してください。

テーマ：${topic}
ターゲット読者：${targetAudience}
SEOキーワード：${keywords}

以下のJSON形式で返してください：
{
  "titleIdeas": ["タイトル案1（32文字以内）", "タイトル案2", "タイトル案3", "タイトル案4", "タイトル案5"],
  "headingStructure": [
    {"h2": "大見出し1", "h3s": ["小見出し1-1", "小見出し1-2"]},
    {"h2": "大見出し2", "h3s": ["小見出し2-1", "小見出し2-2"]},
    {"h2": "大見出し3", "h3s": ["小見出し3-1"]}
  ],
  "bodyDraft": "リード文と最初のセクションの本文ドラフト（800文字程度）",
  "seoSuggestions": ["SEO改善案1", "SEO改善案2", "SEO改善案3", "SEO改善案4"],
  "snsPost": {
    "twitter": "X（Twitter）投稿文（130文字以内、ハッシュタグ2〜3個含む）",
    "instagram": "Instagram投稿文（絵文字多め、ハッシュタグ10個以上）",
    "line": "LINE用投稿文（友達に送るような親しみやすい文体、200文字以内）"
  }
}`
      }
    ]
  })

  const content = JSON.parse(completion.choices[0].message.content!)
  return NextResponse.json({ content })
}
