'use client'

import { useState } from 'react'

type AiConsultResult = {
  taskType: string
  summary: string
  proOpinion: string
  conOpinion: string
  judgeConclusion: string
  todoNow: string[]
  nextTasks: string[]
  readyPrompt: string
}

const TASK_TYPE_COLOR: Record<string, string> = {
  '記事作成': 'bg-emerald-100 text-emerald-700',
  'アプリ開発': 'bg-blue-100 text-blue-700',
  '事業アイデア': 'bg-purple-100 text-purple-700',
  'シフト作成': 'bg-orange-100 text-orange-700',
  '調査': 'bg-cyan-100 text-cyan-700',
  '比較検討': 'bg-amber-100 text-amber-700',
  '学習計画': 'bg-rose-100 text-rose-700',
  'その他': 'bg-slate-100 text-slate-700',
}

type Props = {
  onSave: (title: string, type: string, content: any) => Promise<void>
  defaultInput?: string
}

export default function AiConsultPanel({ onSave, defaultInput = '' }: Props) {
  const [input, setInput] = useState(defaultInput)
  const [result, setResult] = useState<AiConsultResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleAnalyze = async () => {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      })
      const { content } = await res.json()
      setResult(content)
      setSaved(false)
    } catch {
      alert('エラーが発生しました。もう一度お試しください。')
    } finally {
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
    await onSave(result.summary, 'AI相談', result)
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white">
        <h2 className="text-xl font-bold text-slate-800">🤖 AI相談</h2>
        <p className="text-sm text-slate-500 mt-1">作業内容を自由に入力すると、AIが3役割で分析します</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Input */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            作業内容・相談したいこと
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例：副業として月5万円稼ぐためにブログを始めたいのですが、どんなジャンルがいいですか？競合が多くて悩んでいます。"
            rows={5}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
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
                  分析中...
                </>
              ) : '🧠 AIが3役割で分析する'}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Task type + summary */}
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${TASK_TYPE_COLOR[result.taskType] ?? 'bg-slate-100 text-slate-700'}`}>
                {result.taskType}
              </span>
              <p className="text-sm text-slate-600">{result.summary}</p>
            </div>

            {/* 3-role debate */}
            <div className="grid grid-cols-1 gap-4">
              {/* Pro */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">👍</span>
                  <span className="text-sm font-bold text-emerald-700">賛成派の意見</span>
                </div>
                <p className="text-sm text-emerald-900 leading-relaxed">{result.proOpinion}</p>
              </div>

              {/* Con */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">👎</span>
                  <span className="text-sm font-bold text-rose-700">反対派の意見</span>
                </div>
                <p className="text-sm text-rose-900 leading-relaxed">{result.conOpinion}</p>
              </div>

              {/* Judge */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">⚖️</span>
                  <span className="text-sm font-bold text-indigo-700">審判の結論</span>
                </div>
                <p className="text-sm text-indigo-900 leading-relaxed">{result.judgeConclusion}</p>
              </div>
            </div>

            {/* Todo now */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-amber-800 mb-3">⚡ 今すぐやること</h4>
              <ul className="space-y-2">
                {result.todoNow.map((todo, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-amber-900">
                    <span className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {todo}
                  </li>
                ))}
              </ul>
            </div>

            {/* Next tasks */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-slate-700 mb-3">📋 次の作業リスト</h4>
              <ul className="space-y-2">
                {result.nextTasks.map((task, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="text-slate-300 font-bold w-5 text-center flex-shrink-0">{i + 1}.</span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ready prompt */}
            <div className="bg-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-300">✨ そのまま使えるプロンプト</h4>
                <button
                  onClick={handleCopy}
                  className="text-xs px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg transition-colors"
                >
                  {copied ? '✓ コピー済み' : 'コピー'}
                </button>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
                {result.readyPrompt}
              </p>
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {saving ? '保存中...' : saved ? '✓ 保存済み' : '💾 この結果を保存する'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
