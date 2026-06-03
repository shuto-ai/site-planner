import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { appName, targetUsers, mainFeature } = await req.json()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'あなたはプロダクト設計とシステムアーキテクチャの専門家です。必ず指定のJSON形式のみで返してください。'
      },
      {
        role: 'user',
        content: `以下の条件でアプリを設計してください。

アプリ名：${appName}
ターゲットユーザー：${targetUsers}
主な機能・解決したい問題：${mainFeature}

以下のJSON形式で返してください：
{
  "requiredFeatures": ["必須機能1", "必須機能2", "必須機能3", "必須機能4", "必須機能5", "必須機能6"],
  "screens": [
    {"name": "画面名", "description": "この画面の役割", "components": ["コンポーネント1", "コンポーネント2", "コンポーネント3"]}
  ],
  "dataStructure": [
    {"table": "テーブル名", "fields": ["id: UUID", "フィールド名: 型", "created_at: timestamp"]}
  ],
  "mvpSpec": "MVP版（最小限の製品）として優先実装すべき機能と除外する機能の説明（300文字程度）",
  "claudeCodeInstruction": "Claude Codeに渡す詳細な開発指示文。技術スタック（Next.js App Router + TypeScript + Tailwind CSS + Supabase）を前提に、具体的なファイル構成・実装手順・データベース設計を含む詳細な指示（1000文字程度）"
}`
      }
    ]
  })

  const content = JSON.parse(completion.choices[0].message.content!)
  return NextResponse.json({ content })
}
