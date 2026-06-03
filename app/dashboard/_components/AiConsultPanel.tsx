'use client'

import { useRef, useState } from 'react'

// ── Types ──────────────────────────────────────────────
type AgentStatus = '待機中' | '分析中' | '完了'

type AgentCfg = {
  id: string
  name: string
  title: string
  icon: string
  bg: string
  border: string
  textColor: string
  bubbleBg: string
}

type AgentState = AgentCfg & { status: AgentStatus; message: string }

type AnalysisResult = {
  taskType: string
  summary: string
  conclusion: string
  todoNow: string[]
  nextTasks: string[]
  readyPrompt: string
}

type TabId = 'summary' | 'log' | 'conclusion' | 'todo' | 'next' | 'prompt'

// ── Config ─────────────────────────────────────────────
const AGENT_CFG: AgentCfg[] = [
  { id: 'director',  name: '統括AI',     title: 'チーフディレクター',      icon: '🎯',
    bg: 'bg-indigo-50',  border: 'border-indigo-200', textColor: 'text-indigo-700',  bubbleBg: 'bg-indigo-50'  },
  { id: 'strategy',  name: '推進戦略AI', title: '戦略アドバイザー',         icon: '🚀',
    bg: 'bg-emerald-50', border: 'border-emerald-200',textColor: 'text-emerald-700', bubbleBg: 'bg-emerald-50' },
  { id: 'risk',      name: 'リスク分析AI',title: 'リスクアナリスト',        icon: '🛡️',
    bg: 'bg-rose-50',    border: 'border-rose-200',   textColor: 'text-rose-700',    bubbleBg: 'bg-rose-50'    },
  { id: 'decision',  name: '意思決定AI', title: 'デシジョンメイカー',        icon: '⚖️',
    bg: 'bg-purple-50',  border: 'border-purple-200', textColor: 'text-purple-700',  bubbleBg: 'bg-purple-50'  },
  { id: 'execution', name: '実行計画AI', title: 'プロジェクトMgr',          icon: '⚡',
    bg: 'bg-amber-50',   border: 'border-amber-200',  textColor: 'text-amber-700',   bubbleBg: 'bg-amber-50'   },
]

const TASK_COLOR: Record<string, string> = {
  '記事作成':   'bg-emerald-100 text-emerald-700',
  'アプリ開発': 'bg-blue-100 text-blue-700',
  '事業アイデア':'bg-purple-100 text-purple-700',
  '調査':       'bg-cyan-100 text-cyan-700',
  '比較検討':   'bg-amber-100 text-amber-700',
  '学習計画':   'bg-rose-100 text-rose-700',
  'その他':     'bg-slate-100 text-slate-700',
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'summary',    label: '要約'           },
  { id: 'log',        label: '会議ログ'       },
  { id: 'conclusion', label: '結論'           },
  { id: 'todo',       label: '今すぐやること' },
  { id: 'next',       label: '次の作業リスト' },
  { id: 'prompt',     label: 'コピペ用プロンプト' },
]

const initAgents = (): AgentState[] =>
  AGENT_CFG.map(a => ({ ...a, status: '待機中', message: '' }))

// ── Component ──────────────────────────────────────────
type Props = {
  onSave: (title: string, type: string, content: any) => Promise<void>
  defaultInput?: string
}

export default function AiConsultPanel({ onSave, defaultInput = '' }: Props) {
  const [input,     setInput]     = useState(defaultInput)
  const [agents,    setAgents]    = useState<AgentState[]>(initAgents)
  const [result,    setResult]    = useState<AnalysisResult | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('summary')
  const [copied,    setCopied]    = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  const handleAnalyze = async () => {
    if (!input.trim() || loading) return
    clearTimers()
    setLoading(true)
    setResult(null)
    setSaved(false)
    setActiveTab('summary')
    setAgents(AGENT_CFG.map(a => ({ ...a, status: '分析中', message: '' })))

    try {
      const res = await fetch('/api/ai-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      const { content } = await res.json()

      // Stagger-reveal each agent card
      content.agents.forEach((ag: { id: string; message: string }, i: number) => {
        const t = setTimeout(() => {
          setAgents(prev =>
            prev.map(a => a.id === ag.id ? { ...a, status: '完了', message: ag.message } : a)
          )
        }, i * 420)
        timersRef.current.push(t)
      })

      // Show tabs after all cards flip
      const total = content.agents.length * 420 + 250
      const t = setTimeout(() => {
        setResult({
          taskType:    content.taskType,
          summary:     content.summary,
          conclusion:  content.conclusion,
          todoNow:     content.todoNow,
          nextTasks:   content.nextTasks,
          readyPrompt: content.readyPrompt,
        })
        setLoading(false)
      }, total)
      timersRef.current.push(t)

    } catch {
      alert('エラーが発生しました。もう一度お試しください。')
      setAgents(initAgents())
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.readyPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    await onSave(result.summary || '無題の会議', 'AI相談', {
      ...result,
      meetingLog: agents.map(a => ({ id: a.id, name: a.name, title: a.title, message: a.message })),
    })
    setSaving(false)
    setSaved(true)
  }

  const showCards = loading || agents.some(a => a.status !== '待機中')

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex-shrink-0">
        <h2 className="text-xl font-bold text-slate-800">🤖 AI相談</h2>
        <p className="text-sm text-slate-500 mt-1">
          5名のAI社員が会議形式で分析します。作業内容を自由に入力してください。
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

        {/* ── Input card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 mb-2">相談内容・作業内容</label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            placeholder="例：副業として月5万円稼ぐためにブログを始めたいのですが、どんなジャンルがいいですか？競合が多くて悩んでいます。"
            rows={5}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-400">{input.length} 文字</span>
            <button
              onClick={handleAnalyze}
              disabled={loading || !input.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI会議を開催中...
                </>
              ) : '🧠 AI会議を開催する'}
            </button>
          </div>
        </div>

        {/* ── AI Employee Cards ── */}
        {showCards && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">AI社員ステータス</p>
            <div className="grid grid-cols-5 gap-2.5">
              {agents.map(agent => (
                <div
                  key={agent.id}
                  className={`rounded-2xl border p-3 flex flex-col items-center gap-2 transition-all duration-500 ${
                    agent.status === '完了'
                      ? `${agent.bg} ${agent.border}`
                      : agent.status === '分析中'
                      ? 'bg-white border-slate-200 shadow-md'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-2xl ${
                      agent.status === '分析中' ? 'animate-pulse' : ''
                    } ${agent.status === '完了' ? agent.bg : 'bg-slate-100'}`}>
                      {agent.icon}
                    </div>
                    {agent.status === '分析中' && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    )}
                    {agent.status === '完了' && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs leading-none font-bold">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Name / title */}
                  <div className="text-center leading-tight">
                    <p className={`text-xs font-bold ${agent.status === '完了' ? agent.textColor : 'text-slate-600'}`}>
                      {agent.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {agent.title.length > 9 ? agent.title.slice(0, 9) + '…' : agent.title}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    agent.status === '待機中' ? 'bg-slate-100 text-slate-400' :
                    agent.status === '分析中' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Result tabs ── */}
        {result && (
          <div className="space-y-4">
            {/* Tab bar */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === id
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5">

                {/* 要約 */}
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${TASK_COLOR[result.taskType] ?? 'bg-slate-100 text-slate-700'}`}>
                        {result.taskType}
                      </span>
                      <span className="text-xs text-slate-400">5名のAI社員が分析完了</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
                    <div className="flex gap-3 pt-3 border-t border-slate-100">
                      {agents.map(a => (
                        <div key={a.id} className="flex-1 text-center">
                          <div className={`w-9 h-9 rounded-full ${a.bg} flex items-center justify-center text-xl mx-auto`}>{a.icon}</div>
                          <p className={`text-xs font-medium mt-1 ${a.textColor}`}>{a.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 会議ログ */}
                {activeTab === 'log' && (
                  <div className="space-y-5">
                    {agents.map((agent, i) => (
                      <div key={agent.id} className="flex gap-3">
                        <div className={`w-10 h-10 rounded-full ${agent.bubbleBg} flex items-center justify-center text-xl flex-shrink-0 mt-0.5`}>
                          {agent.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-xs font-bold ${agent.textColor}`}>{agent.name}</span>
                            <span className="text-xs text-slate-400">{agent.title}</span>
                            <span className="ml-auto text-xs text-slate-300">発言 {i + 1}</span>
                          </div>
                          <div className={`rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-800 leading-relaxed ${agent.bubbleBg}`}>
                            {agent.message || <span className="italic text-slate-400">（発言なし）</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 結論 */}
                {activeTab === 'conclusion' && (
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-2xl flex-shrink-0">⚖️</div>
                    <div>
                      <p className="text-xs font-bold text-purple-600 mb-2">意思決定AI ／ デシジョンメイカー</p>
                      <p className="text-base text-slate-800 leading-relaxed font-semibold">{result.conclusion}</p>
                    </div>
                  </div>
                )}

                {/* 今すぐやること */}
                {activeTab === 'todo' && (
                  <ul className="space-y-3">
                    {result.todoNow.map((todo, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-sm text-slate-700 leading-relaxed">{todo}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* 次の作業リスト */}
                {activeTab === 'next' && (
                  <ul className="divide-y divide-slate-50">
                    {result.nextTasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-3 py-2.5">
                        <span className="text-slate-300 font-bold text-sm w-5 text-center flex-shrink-0">{i + 1}.</span>
                        <span className="text-sm text-slate-700">{task}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* コピペ用プロンプト */}
                {activeTab === 'prompt' && (
                  <div>
                    <div className="flex justify-end mb-3">
                      <button
                        onClick={handleCopy}
                        className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        {copied ? '✓ コピー済み' : 'コピー'}
                      </button>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-4 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                      {result.readyPrompt}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {saving ? '保存中...' : saved ? '✓ 保存済み' : '💾 会議ログ・結論を保存する'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
