import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { title, genre, target } = await req.json()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `あなたはWebメディアの敏腕編集者です。以下の「売れる記事の法則」に従って記事を書いてください。

【売れる記事の法則】
1. タイトルは「誰が・何を・どれくらい・どうなれるか」を含める
2. 冒頭で読者の悩みに共感させる（"これ俺のことやん"と思わせる）
3. 抽象論ではなく具体的な手順を書く
4. 読者の失敗を先回りして警告する
5. 数字・実体験・比較でリアル感を出す
6. 読者の本音（表の悩みではなく根本の悩み）に触れる
7. 最後に「今日やること」で行動を促す

記事の構成：
悩みの明確化 → 共感 → 原因説明 → 解決策 → 具体的手順 → 注意点 → 今日やること`
      },
      {
        role: 'user',
        content: `以下の条件で売れる記事を書いてください。

タイトル：${title}
ジャンル：${genre}
ターゲット：${target}

以下のJSON形式で返してください：
{
  "title": "改善したタイトル（誰が・何を・どれくらい・どうなれるかを含む）",
  "keywords": ["SEOキーワード1", "SEOキーワード2", "SEOキーワード3", "SEOキーワード4", "SEOキーワード5"],
  "introduction": "冒頭の共感文（読者の悩みに刺さる200文字）",
  "sections": [
    {"heading": "見出し（具体的な数字や対象者を含む）", "content": "本文（300文字以上、具体的な手順や数字を含む）"}
  ],
  "failure_warning": "初心者がやりがちな失敗と対策（150文字）",
  "today_action": "今日すぐできる具体的なアクション1つ（100文字）",
  "conclusion": "まとめ（読者の本音に触れる150文字）"
}
sectionsは最低5つ以上作成してください。JSONのみ返してください。`
      }
    ]
  })

  const content = JSON.parse(completion.choices[0].message.content!)
  return NextResponse.json({ content })
}