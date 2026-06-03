'use client'

import { useState } from 'react'
import type { GeneratedTask } from './TaskPanel'

// ── Types ──────────────────────────────────────────────
type AgentStatus = '待機中' | '分析中' | '完了'

type AgentCfg = {
  id: string; name: string; title: string; icon: string
  bg: string; border: string; textColor: string; bubbleBg: string
}

type AgentState = AgentCfg & { status: AgentStatus; message: string }

type AnalysisResult = {
  taskType: string
  summary: string
  conclusion: string
  todayTasks: string[]
  tomorrowTasks: string[]
  thisWeekTasks: string[]
  revenueDirectTasks: string[]
  canWaitTasks: string[]
  claudeCodePrompt: string
  taskList: GeneratedTask[]
}

type TabId = 'summary' | 'log' | 'conclusion' | 'execution' | 'tasklist' | 'claudecode'

// ── Constants ──────────────────────────────────────────
const AGENT_CFG: AgentCfg[] = [
  { id: 'director',  name: '統括AI',      title: 'チーフディレクター',     icon: '🎯',
    bg: 'bg-indigo-50',  border: 'border-indigo-200', textColor: 'text-indigo-700',  bubbleBg: 'bg-indigo-50'  },
  { id: 'strategy',  name: '推進戦略AI',  title: '戦略アドバイザー',        icon: '🚀',
    bg: 'bg-emerald-50', border: 'border-emerald-200',textColor: 'text-emerald-700', bubbleBg: 'bg-emerald-50' },
  { id: 'risk',      name: 'リスク分析AI',title: 'リスクアナリスト',        icon: '🛡️',
    bg: 'bg-rose-50',    border: 'border-rose-200',   textColor: 'text-rose-700',    bubbleBg: 'bg-rose-50'    },
  { id: 'decision',  name: '意思決定AI',  title: 'デシジョンメイカー',      icon: '⚖️',
    bg: 'bg-purple-50',  border: 'border-purple-200', textColor: 'text-purple-700',  bubbleBg: 'bg-purple-50'  },
  { id: 'execution', name: '実行計画AI',  title: 'プロジェクトMgr',         icon: '⚡',
    bg: 'bg-amber-50',   border: 'border-amber-200',  textColor: 'text-amber-700',   bubbleBg: 'bg-amber-50'   },
]

// Agents are called in this order (sequential)
const AGENT_ORDER = ['director', 'strategy', 'risk', 'decision', 'execution'] as const

const TASK_COLOR: Record<string, string> = {
  '記事作成': 'bg-emerald-100 text-emerald-700', 'アプリ開発': 'bg-blue-100 text-blue-700',
  '事業アイデア': 'bg-purple-100 text-purple-700', '収益化': 'bg-green-100 text-green-700',
  '調査': 'bg-cyan-100 text-cyan-700', '比較検討': 'bg-amber-100 text-amber-700',
  '学習計画': 'bg-rose-100 text-rose-700', 'その他': 'bg-slate-100 text-slate-700',
}

const PRIORITY_COLOR: Record<string, string> = {
  '高': 'bg-rose-100 text-rose-700', '中': 'bg-amber-100 text-amber-700', '低': 'bg-slate-100 text-slate-500',
}

const CATEGORY_ICON: Record<string, string> = {
  '記事作成': '📝', 'アプリ開発': '⚙️', '営業': '📧', 'SNS': '📣', '調査': '🔍', 'その他': '📌',
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'summary',    label: '要約'          },
  { id: 'log',        label: '会議ログ'      },
  { id: 'conclusion', label: '結論'          },
  { id: 'execution',  label: '実行計画'      },
  { id: 'tasklist',   label: 'タスクリスト'  },
  { id: 'claudecode', label: 'Claude Code'   },
]

const EMPTY_RESULT: AnalysisResult = {
  taskType: 'その他', summary: '', conclusion: '',
  todayTasks: [], tomorrowTasks: [], thisWeekTasks: [],
  revenueDirectTasks: [], canWaitTasks: [],
  claudeCodePrompt: '', taskList: [],
}

const initAgents = (): AgentState[] =>
  AGENT_CFG.map(a => ({ ...a, status: '待機中', message: '' }))

// ── Loading placeholder ────────────────────────────────
function LoadingPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
      <span className="w-4 h-4 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
      {label}が分析中...
    </div>
  )
}

// ── Component ──────────────────────────────────────────
type Props = {
  onSave:            (title: string, type: string, content: any) => Promise<void>
  onTaskify:         (tasks: GeneratedTask[], context: string) => void
  onNavigateArticle: (topic: string) => void
  defaultInput?:     string
}

export default function AiConsultPanel({ onSave, onTaskify, onNavigateArticle, defaultInput = '' }: Props) {
  const [input,     setInput]     = useState(defaultInput)
  const [agents,    setAgents]    = useState<AgentState[]>(initAgents)
  const [result,    setResult]    = useState<AnalysisResult | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('summary')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [ccCopied,  setCcCopied]  = useState(false)
  const [salesLoading, setSalesLoading] = useState(false)
  const [salesOutput,  setSalesOutput]  = useState('')
  const [salesCopied,  setSalesCopied]  = useState(false)

  // ── Sequential agent fetch ─────────────────────────
  const handleAnalyze = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setResult(null)
    setSaved(false)
    setSalesOutput('')
    setActiveTab('summary')

    // All agents → 分析中
    setAgents(AGENT_CFG.map(a => ({ ...a, status: '分析中', message: '' })))

    try {
      for (const agentId of AGENT_ORDER) {
        const res = await fetch('/api/ai-consult', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input, agentId }),
        })
        if (!res.ok) throw new Error(`${agentId} failed: ${res.status}`)

        const { agent } = await res.json()

        // ① Agent card → 完了
        setAgents(prev =>
          prev.map(a => a.id === agentId ? { ...a, status: '完了', message: agent.message ?? '' } : a)
        )

        // ② Progressively build result (each agent contributes its own fields)
        setResult(prev => {
          const base = prev ?? { ...EMPTY_RESULT }
          switch (agentId) {
            case 'director':
              return { ...base, taskType: agent.taskType ?? 'その他', summary: agent.summary ?? '' }
            case 'decision':
              return { ...base, conclusion: agent.conclusion ?? '' }
            case 'execution':
              return {
                ...base,
                todayTasks:         agent.todayTasks         ?? [],
                tomorrowTasks:      agent.tomorrowTasks       ?? [],
                thisWeekTasks:      agent.thisWeekTasks       ?? [],
                revenueDirectTasks: agent.revenueDirectTasks  ?? [],
                canWaitTasks:       agent.canWaitTasks         ?? [],
                claudeCodePrompt:   agent.claudeCodePrompt    ?? '',
                taskList:           agent.taskList            ?? [],
              }
            default:
              return base   // strategy / risk: only update meeting log (agents state)
          }
        })
      }
    } catch {
      alert('エラーが発生しました。もう一度お試しください。')
      setAgents(initAgents())
      setResult(null)
    } finally {
      setLoading(false)
    }
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

  const handleCopyCC = () => {
    if (!result?.claudeCodePrompt) return
    navigator.clipboard.writeText(result.claudeCodePrompt)
    setCcCopied(true)
    setTimeout(() => setCcCopied(false), 2000)
  }

  const handleGenerateSales = async () => {
    if (!result) return
    setSalesLoading(true)
    setSalesOutput('')
    try {
      const res = await fetch('/api/task-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: '営業文・セールスコピーを作成する', context: result.summary }),
      })
      const { content } = await res.json()
      setSalesOutput(content.output || content.items?.join('\n\n') || '')
    } catch {
      alert('エラーが発生しました。')
    } finally {
      setSalesLoading(false)
    }
  }

  const showCards = loading || agents.some(a => a.status !== '待機中')
  const allDone   = agents.every(a => a.status === '完了')

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex-shrink-0">
        <h2 className="text-xl font-bold text-slate-800">🤖 AI相談</h2>
        <p className="text-sm text-slate-500 mt-1">5名のAI社員が順番に分析します。最初の回答は数秒で表示されます。</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

        {/* Input */}
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
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />AI会議を開催中...</>
                : '🧠 AI会議を開催する'}
            </button>
          </div>
        </div>

        {/* AI Employee Cards */}
        {showCards && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">AI社員ステータス</p>
            <div className="grid grid-cols-5 gap-2.5">
              {agents.map(agent => (
                <div key={agent.id} className={`rounded-2xl border p-3 flex flex-col items-center gap-2 transition-all duration-300 ${
                  agent.status === '完了'
                    ? `${agent.bg} ${agent.border}`
                    : agent.status === '分析中'
                    ? 'bg-white border-indigo-300 shadow-md ring-2 ring-indigo-100'
                    : 'bg-slate-50 border-slate-100'
                }`}>
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
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</span>
                    )}
                  </div>
                  <div className="text-center leading-tight">
                    <p className={`text-xs font-bold ${agent.status === '完了' ? agent.textColor : 'text-slate-600'}`}>{agent.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{agent.title.length > 9 ? agent.title.slice(0, 9) + '…' : agent.title}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    agent.status === '待機中' ? 'bg-slate-100 text-slate-400' :
                    agent.status === '分析中' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>{agent.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Result tabs — shown as soon as director responds (result !== null) */}
        {result && (
          <div className="space-y-4">
            {/* Tab bar */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
              {TABS.map(({ id, label }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

              {/* 要約 */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${TASK_COLOR[result.taskType] ?? 'bg-slate-100 text-slate-700'}`}>
                      {result.taskType}
                    </span>
                    <span className="text-xs text-slate-400">{loading ? '分析中...' : '5名のAI社員が分析完了'}</span>
                  </div>
                  {result.summary
                    ? <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
                    : <LoadingPlaceholder label="統括AI" />}
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
                      <div className={`w-10 h-10 rounded-full ${agent.bubbleBg} flex items-center justify-center text-xl flex-shrink-0 mt-0.5`}>{agent.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs font-bold ${agent.textColor}`}>{agent.name}</span>
                          <span className="text-xs text-slate-400">{agent.title}</span>
                          <span className="ml-auto text-xs text-slate-300">発言 {i + 1}</span>
                        </div>
                        {agent.status === '分析中'
                          ? <div className={`rounded-2xl rounded-tl-none px-4 py-3 ${agent.bubbleBg}`}>
                              <span className="flex items-center gap-2 text-sm text-slate-400">
                                <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />分析中...
                              </span>
                            </div>
                          : <div className={`rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-800 leading-relaxed ${agent.bubbleBg}`}>
                              {agent.message || <span className="italic text-slate-400">（発言なし）</span>}
                            </div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 結論 */}
              {activeTab === 'conclusion' && (
                result.conclusion
                  ? <div className="flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-2xl flex-shrink-0">⚖️</div>
                      <div>
                        <p className="text-xs font-bold text-purple-600 mb-2">意思決定AI ／ デシジョンメイカー</p>
                        <p className="text-base text-slate-800 leading-relaxed font-semibold">{result.conclusion}</p>
                      </div>
                    </div>
                  : <LoadingPlaceholder label="意思決定AI" />
              )}

              {/* 実行計画 */}
              {activeTab === 'execution' && (
                result.todayTasks.length > 0
                  ? <div className="space-y-4">
                      {[
                        { label: '🌅 今日やること',         items: result.todayTasks,         badge: 'bg-rose-400',    bg: 'bg-rose-50 border-rose-200' },
                        { label: '🌄 明日やること',         items: result.tomorrowTasks,      badge: 'bg-orange-400',  bg: 'bg-orange-50 border-orange-200' },
                        { label: '📅 今週やること',         items: result.thisWeekTasks,      badge: 'bg-amber-400',   bg: 'bg-amber-50 border-amber-200' },
                        { label: '💰 収益化に直結する作業', items: result.revenueDirectTasks, badge: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200' },
                        { label: '⏸ 後回しでいい作業',     items: result.canWaitTasks,       badge: 'bg-slate-400',   bg: 'bg-slate-50 border-slate-200' },
                      ].map(({ label, items, badge, bg }) => items?.length > 0 && (
                        <div key={label} className={`rounded-xl border p-4 ${bg}`}>
                          <p className="text-xs font-bold text-slate-700 mb-2">{label}</p>
                          <ul className="space-y-1.5">
                            {items.map((item, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <span className={`w-5 h-5 ${badge} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>{i + 1}</span>
                                <span className="text-sm text-slate-800">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  : <LoadingPlaceholder label="実行計画AI" />
              )}

              {/* タスクリスト */}
              {activeTab === 'tasklist' && (
                result.taskList.length > 0
                  ? <div className="space-y-2">
                      {result.taskList.map((task, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                          <span className="text-lg flex-shrink-0">{CATEGORY_ICON[task.category] ?? '📌'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{task.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[task.priority] ?? 'bg-slate-100 text-slate-500'}`}>{task.priority}</span>
                              <span className="text-xs text-slate-400">{task.category}</span>
                              <span className="text-xs text-slate-400">⏱ {task.estimatedTime}</span>
                            </div>
                          </div>
                          <span className="text-xs text-slate-300 font-mono">#{i + 1}</span>
                        </div>
                      ))}
                      <p className="text-xs text-slate-400 text-center pt-1">「タスク化する」で実行管理画面へ移動できます</p>
                    </div>
                  : <LoadingPlaceholder label="実行計画AI" />
              )}

              {/* Claude Code */}
              {activeTab === 'claudecode' && (
                result.claudeCodePrompt
                  ? <div>
                      <div className="flex justify-end mb-3">
                        <button onClick={handleCopyCC}
                          className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                          {ccCopied ? '✓ コピー済み' : 'コピーして使う'}
                        </button>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-4 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                        {result.claudeCodePrompt}
                      </div>
                    </div>
                  : <LoadingPlaceholder label="実行計画AI" />
              )}
            </div>

            {/* Action buttons — only after all agents complete */}
            {allDone && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">次のアクション</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleSave} disabled={saving || saved}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl transition-colors">
                    {saved ? '✓ 保存済み' : '💾 案件として保存'}
                  </button>

                  <button
                    onClick={() => result.taskList.length && onTaskify(result.taskList, result.summary)}
                    disabled={!result.taskList.length}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    ✅ タスク化する ({result.taskList.length}件)
                  </button>

                  <button onClick={() => onNavigateArticle(result.summary)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors">
                    📝 記事作成へ進む
                  </button>

                  <button onClick={handleCopyCC}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors">
                    🤖 {ccCopied ? 'コピー済み' : 'Claude Code指示文をコピー'}
                  </button>

                  <button onClick={handleGenerateSales} disabled={salesLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl transition-colors">
                    {salesLoading
                      ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />生成中...</>
                      : '📧 営業文を生成する'}
                  </button>
                </div>

                {/* Sales output */}
                {salesOutput && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-amber-700">📧 生成された営業文</p>
                      <button onClick={() => { navigator.clipboard.writeText(salesOutput); setSalesCopied(true); setTimeout(() => setSalesCopied(false), 2000) }}
                        className="text-xs text-slate-500 hover:text-slate-700">
                        {salesCopied ? '✓ コピー済み' : 'コピー'}
                      </button>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {salesOutput}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
