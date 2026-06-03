import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { task, context } = await req.json()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'あなたはAI作業支援の専門家です。与えられたタスクを実行し、すぐに使える成果物を生成します。必ずJSON形式のみで返してください。',
      },
      {
        role: 'user',
        content: `以下のタスクを実行して成果物を生成してください。

【実行タスク】
${task}

【背景・コンテキスト】
${context}

タスクの種類に応じて適切な成果物を生成し、以下のJSON形式で返してください：
{
  "type": "article_titles | sales_copy | claude_code | sns_posts | general",
  "title": "成果物のタイトル（20文字以内）",
  "output": "メインの成果物テキスト（listで出せないもの。article_titles等の場合は空文字）",
  "items": ["リスト形式の成果物1", "成果物2", "成果物3（リストで出せる場合のみ使用）"],
  "nextAction": "この成果物を使って次にやること（具体的に、100文字以内）",
  "claudeCodePrompt": "Claude Codeに渡す開発指示文（claude_codeタイプの場合のみ、それ以外は空文字）"
}

タスクの種類判定：
- 「記事タイトル」「記事案」を生成→ type: article_titles, items: タイトル10個
- 「営業文」「セールスコピー」「メール文」→ type: sales_copy, output: 営業文全文
- 「Claude Code」「アプリ開発」「実装」「コード」→ type: claude_code, claudeCodePrompt: 詳細指示文, output: 概要
- 「SNS投稿」「Twitter」「Instagram」→ type: sns_posts, items: 投稿文5〜10個
- その他→ type: general, output: 成果物テキスト`,
      },
    ],
  })

  const content = JSON.parse(completion.choices[0].message.content!)
  return NextResponse.json({ content })
}
