import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Agent definitions ──────────────────────────────────
// NOTE: future SSE migration → replace this route with a streaming route
//       that sends each agent result as an SSE event using the same AGENTS array.
const AGENTS = [
  {
    id: 'director',
    name: '統括AI',
    title: 'チーフディレクター',
    system: 'あなたはAI会議の統括ディレクターです。相談内容の本質を整理し、タスクを分類して会議の議題を設定します。必ずJSON形式のみで返してください。',
    prompt: (input: string) => `以下の相談内容を分析してください。

【相談内容】
${input}

JSON形式で返してください：
{
  "taskType": "記事作成 | アプリ開発 | 事業アイデア | 収益化 | 調査 | 比較検討 | 学習計画 | その他",
  "summary": "相談内容の要約（80文字以内）",
  "message": "統括ディレクターとしての発言：この相談の本質と今日の会議で解決すべき点（200文字以内）"
}`,
  },
  {
    id: 'strategy',
    name: '推進戦略AI',
    title: '戦略アドバイザー',
    system: 'あなたは推進戦略を担うAIアドバイザーです。アイデアのメリット・成功条件・実現可能性を前向きに分析します。必ずJSON形式のみで返してください。',
    prompt: (input: string) => `以下の相談について推進戦略の視点で分析してください。

【相談内容】
${input}

JSON形式で返してください：
{
  "message": "推進戦略AIとしての発言：このアイデアのメリット・成功条件・進めるべき理由（250文字以内）"
}`,
  },
  {
    id: 'risk',
    name: 'リスク分析AI',
    title: 'リスクアナリスト',
    system: 'あなたはリスク分析を担うAIアナリストです。潜在リスク・弱点・懸念事項を客観的に指摘します。必ずJSON形式のみで返してください。',
    prompt: (input: string) => `以下の相談についてリスク分析の視点で分析してください。

【相談内容】
${input}

JSON形式で返してください：
{
  "message": "リスク分析AIとしての発言：注意すべきリスク・弱点・失敗パターンとその対策（250文字以内）"
}`,
  },
  {
    id: 'decision',
    name: '意思決定AI',
    title: 'デシジョンメイカー',
    system: 'あなたは意思決定を担うAIです。戦略面・リスク面の両方を踏まえ、現実的で実行可能な結論を導きます。必ずJSON形式のみで返してください。',
    prompt: (input: string) => `以下の相談について意思決定の視点で結論を導いてください。

【相談内容】
${input}

JSON形式で返してください：
{
  "message": "意思決定AIとしての発言：メリット・リスクを総合判断した推奨アクション（250文字以内）",
  "conclusion": "最終結論（150文字以内、一文で端的に）"
}`,
  },
  {
    id: 'execution',
    name: '実行計画AI',
    title: 'プロジェクトマネージャー',
    system: 'あなたは実行計画を担うAIプロジェクトマネージャーです。収益化に直結する具体的な行動計画・タスクリスト・Claude Code指示文を作成します。必ずJSON形式のみで返してください。',
    prompt: (input: string) => `以下の相談について具体的な実行計画を立ててください。

【相談内容】
${input}

JSON形式で返してください：
{
  "message": "実行計画AIとしての発言：どう進めるかの実行プラン概要（200文字以内）",
  "todayTasks":        ["今日やること1（収益化・進捗に直結）", "今日やること2", "今日やること3"],
  "tomorrowTasks":     ["明日やること1", "明日やること2"],
  "thisWeekTasks":     ["今週やること1", "今週やること2", "今週やること3"],
  "revenueDirectTasks":["収益化に直結する作業1", "収益化に直結する作業2", "収益化に直結する作業3"],
  "canWaitTasks":      ["後回しでいい作業1", "後回しでいい作業2"],
  "claudeCodePrompt":  "次にClaude Codeへ送る文（技術スタック・実装手順・ファイル構成を含む詳細指示、800文字程度）",
  "taskList": [
    {"name": "具体的なタスク名（動詞から始める）", "category": "記事作成 | アプリ開発 | 営業 | SNS | 調査 | その他", "priority": "高 | 中 | 低", "estimatedTime": "30分"}
  ]
}`,
  },
]

// ── Single-agent mode (used by sequential UI) ──────────
// Request:  { input: string, agentId: string }
// Response: { agent: { id, name, title, message, ...agentSpecificFields } }
//
// ── All-agents mode (batch, for future use) ────────────
// Request:  { input: string }
// Response: { content: { taskType, summary, agents[], conclusion, todayTasks, ... } }

export async function POST(req: NextRequest) {
  const { input, agentId } = await req.json()

  // ── Single-agent mode ──────────────────────────────
  if (agentId) {
    const agent = AGENTS.find(a => a.id === agentId)
    if (!agent) {
      return NextResponse.json({ error: 'Unknown agentId' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: agent.system },
        { role: 'user',   content: agent.prompt(input) },
      ],
    })

    const parsed = JSON.parse(completion.choices[0].message.content!)
    return NextResponse.json({
      agent: { id: agent.id, name: agent.name, title: agent.title, ...parsed },
    })
  }

  // ── All-agents mode (parallel batch) ──────────────
  const results = await Promise.all(
    AGENTS.map(async (agent) => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: agent.system },
          { role: 'user',   content: agent.prompt(input) },
        ],
      })
      const parsed = JSON.parse(completion.choices[0].message.content!)
      return { id: agent.id, name: agent.name, title: agent.title, ...parsed }
    })
  )

  const director  = results.find(r => r.id === 'director')
  const decision  = results.find(r => r.id === 'decision')
  const execution = results.find(r => r.id === 'execution')

  return NextResponse.json({
    content: {
      taskType:            director?.taskType            ?? 'その他',
      summary:             director?.summary             ?? '',
      agents:              results.map(r => ({ id: r.id, name: r.name, title: r.title, message: r.message ?? '' })),
      conclusion:          decision?.conclusion           ?? '',
      todayTasks:          execution?.todayTasks          ?? [],
      tomorrowTasks:       execution?.tomorrowTasks       ?? [],
      thisWeekTasks:       execution?.thisWeekTasks       ?? [],
      revenueDirectTasks:  execution?.revenueDirectTasks  ?? [],
      canWaitTasks:        execution?.canWaitTasks         ?? [],
      claudeCodePrompt:    execution?.claudeCodePrompt    ?? '',
      taskList:            execution?.taskList            ?? [],
    },
  })
}
