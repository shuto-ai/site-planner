'use client'

import { useState } from 'react'

type Method = {
  name: string
  difficulty: '初級' | '中級' | '上級'
  initialCost: string
  revenueTimeline: string
  monthlyPotential: string
  description: string
  pros: string[]
  cons: string[]
  firstStep: string
}

type RoadmapPhase = { phase: string; period: string; goal: string; tasks: string[] }

type MonetizeResult = {
  summary: string
  methods: Method[]
  timeline: { today: string[]; tomorrow: string[]; thisWeek: string[]; thisMonth: string[] }
  roadmap: RoadmapPhase[]
}

type TabId = 'methods' | 'timeline' | 'roadmap'

const DIFFICULTY: Record<string, string> = {
  '初級': 'bg-emerald-100 text-emerald-700',
  '中級': 'bg-amber-100 text-amber-700',
  '上級': 'bg-rose-100 text-rose-700',
}

const TIMELINE_CFG = [
  { key: 'today'     as const, label: '🌅 今日',   bg: 'bg-rose-50 border-rose-200',     text: 'text-rose-700',    badge: 'bg-rose-400' },
  { key: 'tomorrow'  as const, label: '🌄 明日',   bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700',  badge: 'bg-orange-400' },
  { key: 'thisWeek'  as const, label: '📅 今週',   bg: 'bg-amber-50 border-amber-200',   text: 'text-amber-700',   badge: 'bg-amber-400' },
  { key: 'thisMonth' as const, label: '🗓 今月',   bg: 'bg-emerald-50 border-emerald-200',text: 'text-emerald-700', badge: 'bg-emerald-400' },
]

type SimpleTask = { name: string; category: string; priority: string; estimatedTime: string }

type Props = {
  onSave: (title: string, type: string, content: any) => Promise<void>
  onTaskify?: (tasks: SimpleTask[], context: string) => void
}

export default function MonetizePanel({ onSave, onTaskify }: Props) {
  const [goal,    setGoal]    = useState('')
  const [result,  setResult]  = useState<MonetizeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab,     setTab]     = useState<TabId>('methods')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  const handleGenerate = async () => {
    if (!goal.trim()) return
    setLoading(true)
    setResult(null)
    setSaved(false)
    try {
      const res = await fetch('/api/monetize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      })
      const { content } = await res.json()
      setResult(content)
    } catch {
      alert('エラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    try {
      await onSave(goal.slice(0, 50) || '収益化プラン', '収益化相談', result)
      setSaved(true)
    } catch (err: any) {
      alert('保存に失敗しました: ' + (err?.message ?? 'エラーが発生しました'))
    } finally {
      setSaving(false)
    }
  }

  const handleTaskify = () => {
    if (!result || !onTaskify) return
    const tasks: SimpleTask[] = []
    if (result.methods?.[0]?.firstStep)
      tasks.push({ name: result.methods[0].firstStep, category: 'その他', priority: '高', estimatedTime: '1時間' })
    ;(result.timeline?.today ?? []).forEach(name =>
      tasks.push({ name, category: 'その他', priority: '高', estimatedTime: '1時間' })
    )
    ;(result.timeline?.thisWeek ?? []).slice(0, 3).forEach(name =>
      tasks.push({ name, category: 'その他', priority: '中', estimatedTime: '2時間' })
    )
    if (!tasks.length) { alert('タスクを生成できませんでした'); return }
    onTaskify(tasks.slice(0, 8), goal.slice(0, 80) || '収益化プラン')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex-shrink-0">
        <h2 className="text-xl font-bold text-slate-800">💰 収益化相談</h2>
        <p className="text-sm text-slate-500 mt-1">目標・状況を入力するとAIが収益手段・スケジュール・ロードマップを提案します</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Input */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <label className="block text-sm font-semibold text-slate-700 mb-2">収益化の目標・現状・スキル・使える時間</label>
          <textarea
            value={goal}
            onChange={e => setGoal(e.target.value)}
            disabled={loading}
            placeholder="例：会社員として働きながら副業で月5万円稼ぎたい。スキルはライティングとExcelが得意。平日は1〜2時間、週末は5時間使える。初期費用はできれば0円で始めたい。"
            rows={5}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-slate-50"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleGenerate}
              disabled={loading || !goal.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />分析中...</>
              ) : '💰 収益化プランを生成する'}
            </button>
          </div>
        </div>

        {result && (
          <>
            {/* Summary */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <p className="text-sm text-emerald-900 leading-relaxed">{result.summary}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {([
                { id: 'methods'  as TabId, label: '収益手段' },
                { id: 'timeline' as TabId, label: '実行スケジュール' },
                { id: 'roadmap'  as TabId, label: 'ロードマップ' },
              ]).map(({ id, label }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    tab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Methods */}
            {tab === 'methods' && (
              <div className="space-y-4">
                {result.methods.map((m, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h4 className="text-base font-bold text-slate-800">{m.name}</h4>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${DIFFICULTY[m.difficulty] ?? 'bg-slate-100 text-slate-600'}`}>
                        {m.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{m.description}</p>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: '初期費用',       value: m.initialCost },
                        { label: '収益化まで',     value: m.revenueTimeline },
                        { label: '月収ポテンシャル', value: m.monthlyPotential },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-50 rounded-xl p-2.5 text-center">
                          <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                          <p className="text-xs font-bold text-slate-700">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs font-semibold text-emerald-600 mb-1">メリット</p>
                        <ul className="space-y-1">{m.pros.map((p, j) => (
                          <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                            <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>{p}
                          </li>
                        ))}</ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-rose-500 mb-1">デメリット</p>
                        <ul className="space-y-1">{m.cons.map((c, j) => (
                          <li key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                            <span className="text-rose-400 flex-shrink-0 mt-0.5">✗</span>{c}
                          </li>
                        ))}</ul>
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <p className="text-xs font-bold text-amber-700 mb-1">⚡ 今日すぐできる最初の一歩</p>
                      <p className="text-xs text-amber-900">{m.firstStep}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Timeline */}
            {tab === 'timeline' && (
              <div className="space-y-4">
                {TIMELINE_CFG.map(({ key, label, bg, text, badge }) => (
                  <div key={key} className={`rounded-2xl border p-5 ${bg}`}>
                    <h4 className={`text-sm font-bold mb-3 ${text}`}>{label}</h4>
                    <ul className="space-y-2">
                      {(result.timeline[key] ?? []).map((task, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className={`w-5 h-5 ${badge} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>{i + 1}</span>
                          <span className="text-sm text-slate-800">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Roadmap */}
            {tab === 'roadmap' && (
              <div className="relative">
                <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-slate-200" />
                <div className="space-y-6">
                  {result.roadmap.map((phase, i) => (
                    <div key={i} className="relative pl-12">
                      <div className="absolute left-3 top-3 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold z-10">{i + 1}</div>
                      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-bold text-slate-800">{phase.phase}</span>
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{phase.period}</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2 font-medium">目標：{phase.goal}</p>
                        <ul className="space-y-1">
                          {phase.tasks.map((t, j) => (
                            <li key={j} className="text-xs text-slate-700 flex items-start gap-1.5">
                              <span className="text-slate-300 flex-shrink-0">—</span>{t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end flex-wrap">
              {onTaskify && (
                <button
                  onClick={handleTaskify}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
                >
                  ✅ タスク化する
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {saving ? '保存中...' : saved ? '✓ 保存済み' : '💾 収益化プランを保存する'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
