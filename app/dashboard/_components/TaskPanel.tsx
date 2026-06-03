'use client'

import { useState } from 'react'

export type GeneratedTask = {
  name: string
  category: string
  priority: string
  estimatedTime: string
}

type ExecuteResult = {
  type: string
  title: string
  output: string
  items: string[]
  nextAction: string
  claudeCodePrompt?: string
}

type TaskState = GeneratedTask & {
  id: string
  status: '未着手' | '実行中' | '完了' | '保留'
  result?: ExecuteResult
}

const PRIORITY_COLOR: Record<string, string> = {
  '高': 'bg-rose-100 text-rose-700',
  '中': 'bg-amber-100 text-amber-700',
  '低': 'bg-slate-100 text-slate-600',
}

const CATEGORY_ICON: Record<string, string> = {
  '記事作成': '📝',
  'アプリ開発': '⚙️',
  '営業': '📧',
  'SNS': '📣',
  '調査': '🔍',
  'その他': '📌',
}

type Props = {
  tasks: GeneratedTask[]
  context: string
}

export default function TaskPanel({ tasks: initialTasks, context }: Props) {
  const [tasks, setTasks] = useState<TaskState[]>(
    initialTasks.map((t, i) => ({ ...t, id: String(i), status: '未着手' }))
  )
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [expandedId,  setExpandedId]  = useState<string | null>(null)
  const [copiedId,    setCopiedId]    = useState<string | null>(null)

  const executeTask = async (task: TaskState) => {
    if (executingId) return
    setExecutingId(task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: '実行中' } : t))

    try {
      const res = await fetch('/api/task-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: task.name, context }),
      })
      const { content } = await res.json()
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: '完了', result: content } : t))
      setExpandedId(task.id)
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: '未着手' } : t))
      alert('エラーが発生しました。')
    } finally {
      setExecutingId(null)
    }
  }

  const updateStatus = (id: string, status: TaskState['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (initialTasks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-slate-600 text-sm font-medium">タスクがありません</p>
          <p className="text-slate-400 text-xs mt-2">AI会議の「タスク化する」ボタンからタスクを生成してください</p>
        </div>
      </div>
    )
  }

  const done = tasks.filter(t => t.status === '完了').length
  const progress = Math.round((done / tasks.length) * 100)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">✅ タスク実行</h2>
            <p className="text-sm text-slate-500 mt-1">AIが生成したタスクを1つずつ実行します</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-bold text-slate-700">{done} / {tasks.length} 完了</p>
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-3">
        {tasks.map((task, idx) => {
          const icon    = CATEGORY_ICON[task.category] ?? '📌'
          const isExpanded = expandedId === task.id
          const isDone  = task.status === '完了'
          const isHeld  = task.status === '保留'
          const isRunning = task.status === '実行中'

          return (
            <div key={task.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${
              isDone    ? 'border-emerald-200' :
              isRunning ? 'border-indigo-300 shadow-md' :
              isHeld    ? 'border-slate-100 opacity-60' :
              'border-slate-200'
            }`}>
              {/* Task row */}
              <div className="p-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 mt-0.5 ${
                  isDone ? 'bg-emerald-100' : isHeld ? 'bg-slate-100' : 'bg-slate-100'
                }`}>
                  {isDone ? '✅' : isHeld ? '⏸' : icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className="text-xs text-slate-300 font-mono">#{idx + 1}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[task.priority] ?? 'bg-slate-100 text-slate-600'}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{task.category}</span>
                    <span className="text-xs text-slate-400">⏱ {task.estimatedTime}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{task.name}</p>
                </div>

                {/* Action area */}
                <div className="flex-shrink-0 ml-2">
                  {task.status === '未着手' && (
                    <button
                      onClick={() => executeTask(task)}
                      disabled={!!executingId}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                    >
                      ▶ 実行する
                    </button>
                  )}
                  {isRunning && (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                      <span className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      実行中...
                    </div>
                  )}
                  {isDone && task.result && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : task.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      {isExpanded ? '▲ 閉じる' : '▼ 成果物'}
                    </button>
                  )}
                  {isHeld && (
                    <button
                      onClick={() => updateStatus(task.id, '未着手')}
                      className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                    >
                      再開する
                    </button>
                  )}
                </div>
              </div>

              {/* Result */}
              {isExpanded && task.result && (
                <div className="border-t border-slate-100 bg-slate-50">
                  <div className="p-4 space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{task.result.title}</p>

                    {/* Items or output */}
                    {task.result.items.length > 0 ? (
                      <div className="bg-white rounded-xl border border-slate-200 p-3">
                        <ul className="space-y-1.5">
                          {task.result.items.map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="text-slate-300 font-bold w-5 text-center flex-shrink-0">{j + 1}.</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : task.result.output ? (
                      <div className="bg-white rounded-xl border border-slate-200 p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {task.result.output}
                      </div>
                    ) : null}

                    {/* Claude Code prompt */}
                    {task.result.claudeCodePrompt && (
                      <div className="bg-slate-800 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400 font-semibold">🤖 Claude Code指示文</span>
                          <button
                            onClick={() => copyToClipboard(task.result!.claudeCodePrompt!, task.id + '-cc')}
                            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            {copiedId === task.id + '-cc' ? '✓ コピー済み' : 'コピー'}
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                          {task.result.claudeCodePrompt}
                        </p>
                      </div>
                    )}

                    {/* Next action */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                      <p className="text-xs font-bold text-indigo-700 mb-1">→ 次にやること</p>
                      <p className="text-xs text-indigo-900">{task.result.nextAction}</p>
                    </div>

                    {/* Status buttons */}
                    <div className="flex gap-2 flex-wrap pt-1">
                      <button onClick={() => { updateStatus(task.id, '完了'); setExpandedId(null) }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-medium transition-colors">
                        ✓ 完了にする
                      </button>
                      <button onClick={() => executeTask(task)}
                        disabled={!!executingId}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs rounded-lg font-medium transition-colors">
                        ↺ 再生成する
                      </button>
                      <button onClick={() => { updateStatus(task.id, '保留'); setExpandedId(null) }}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded-lg font-medium transition-colors">
                        ⏸ 保留にする
                      </button>
                      {idx < tasks.length - 1 && tasks[idx + 1].status === '未着手' && (
                        <button
                          onClick={() => { updateStatus(task.id, '完了'); setExpandedId(null); executeTask(tasks[idx + 1]) }}
                          disabled={!!executingId}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs rounded-lg font-medium transition-colors ml-auto"
                        >
                          次のタスクへ →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
