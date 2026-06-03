'use client'

import { useState } from 'react'

// ── Types ──────────────────────────────────────────────
type SavedItem = {
  id: string
  title: string
  type: string
  status: '未着手' | '作業中' | '完了' | '保留'
  content: any
  created_at: string
}

type SimpleTask = {
  name: string
  category: string
  priority: string
  estimatedTime: string
}

type Props = {
  items: SavedItem[]
  onStatusChange: (id: string, status: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onTaskify?: (tasks: SimpleTask[], context: string) => void
}

// ── Style maps ─────────────────────────────────────────
const STATUS_CONFIG = {
  '未着手': { cls: 'bg-slate-100 text-slate-600',    dot: 'bg-slate-400' },
  '作業中': { cls: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400' },
  '完了':   { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  '保留':   { cls: 'bg-purple-100 text-purple-600',  dot: 'bg-purple-400' },
}

const TYPE_ICON: Record<string, string> = {
  'AI相談':   '🤖',
  '記事作成': '📝',
  'アプリ設計': '⚙️',
  '収益化相談': '💰',
  'タスク実行': '✅',
}

const TASK_COLOR: Record<string, string> = {
  '記事作成': 'bg-emerald-100 text-emerald-700',
  'アプリ開発': 'bg-blue-100 text-blue-700',
  '事業アイデア': 'bg-purple-100 text-purple-700',
  '収益化': 'bg-green-100 text-green-700',
  '調査': 'bg-cyan-100 text-cyan-700',
  '比較検討': 'bg-amber-100 text-amber-700',
  '学習計画': 'bg-rose-100 text-rose-700',
  'その他': 'bg-slate-100 text-slate-700',
}

const DIFFICULTY: Record<string, string> = {
  '初級': 'bg-emerald-100 text-emerald-700',
  '中級': 'bg-amber-100 text-amber-700',
  '上級': 'bg-rose-100 text-rose-700',
}

type FilterStatus = '全て' | '未着手' | '作業中' | '完了' | '保留'

// ── Task extraction per content type ───────────────────
function extractTasks(item: SavedItem): SimpleTask[] {
  const c = item.content
  switch (item.type) {
    case 'AI相談':
      if (c.taskList?.length) return c.taskList
      return (c.todayTasks ?? []).map((name: string) => ({
        name, category: 'その他', priority: '高', estimatedTime: '30分',
      }))
    case '収益化相談': {
      const tasks: SimpleTask[] = []
      if (c.methods?.[0]?.firstStep)
        tasks.push({ name: c.methods[0].firstStep, category: 'その他', priority: '高', estimatedTime: '1時間' })
      ;(c.timeline?.today ?? []).forEach((name: string) =>
        tasks.push({ name, category: 'その他', priority: '高', estimatedTime: '1時間' })
      )
      ;(c.timeline?.thisWeek ?? []).slice(0, 3).forEach((name: string) =>
        tasks.push({ name, category: 'その他', priority: '中', estimatedTime: '2時間' })
      )
      return tasks.slice(0, 8)
    }
    case '記事作成':
      return [
        { name: `記事タイトルを選ぶ：${c.titleIdeas?.[0] ?? ''}`, category: '記事作成', priority: '高', estimatedTime: '15分' },
        { name: '見出し構成を確認・調整する', category: '記事作成', priority: '高', estimatedTime: '30分' },
        { name: '本文ドラフトを完成させる', category: '記事作成', priority: '高', estimatedTime: '2時間' },
        { name: 'SEO改善案を実装する', category: '記事作成', priority: '中', estimatedTime: '30分' },
        { name: 'SNS投稿文を投稿する', category: 'SNS', priority: '中', estimatedTime: '15分' },
      ]
    case 'アプリ設計':
      return (c.requiredFeatures ?? []).slice(0, 6).map((name: string) => ({
        name, category: 'アプリ開発', priority: '中', estimatedTime: '2時間',
      }))
    default:
      return []
  }
}

// ── Content renderers per type ─────────────────────────
function ContentMonetize({ c }: { c: any }) {
  return (
    <div className="space-y-4">
      {c.summary && (
        <p className="text-sm text-emerald-900 bg-emerald-50 border border-emerald-100 rounded-xl p-3 leading-relaxed">{c.summary}</p>
      )}
      {/* Methods */}
      {(c.methods ?? []).length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">収益手段</p>
          <div className="space-y-2">
            {(c.methods ?? []).slice(0, 3).map((m: any, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-slate-100">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${DIFFICULTY[m.difficulty] ?? 'bg-slate-100 text-slate-600'}`}>
                  {m.difficulty}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                  <p className="text-xs text-slate-400">{m.monthlyPotential} · {m.revenueTimeline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Today tasks */}
      {(c.timeline?.today ?? []).length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">今日やること</p>
          <ul className="space-y-1.5">
            {c.timeline.today.map((t: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="w-4 h-4 bg-rose-400 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Roadmap phases */}
      {(c.roadmap ?? []).length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">ロードマップ</p>
          <div className="space-y-2">
            {(c.roadmap ?? []).map((phase: any, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-indigo-50 rounded-xl px-3 py-2">
                <span className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</span>
                <div>
                  <span className="text-xs font-semibold text-indigo-800">{phase.phase}</span>
                  <span className="text-xs text-indigo-500 ml-2">{phase.period}</span>
                  <p className="text-xs text-slate-600 mt-0.5">{phase.goal}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ContentAiConsult({ c }: { c: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {c.taskType && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TASK_COLOR[c.taskType] ?? 'bg-slate-100 text-slate-600'}`}>
            {c.taskType}
          </span>
        )}
        {c.summary && <p className="text-sm text-slate-700 leading-relaxed">{c.summary}</p>}
      </div>
      {c.conclusion && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
          <p className="text-xs font-bold text-purple-600 mb-1">⚖️ 審判の結論</p>
          <p className="text-sm text-slate-800 leading-relaxed">{c.conclusion}</p>
        </div>
      )}
      {(c.todayTasks ?? []).length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">今日やること</p>
          <ul className="space-y-1.5">
            {c.todayTasks.map((t: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(c.taskList ?? []).length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">タスクリスト ({c.taskList.length}件)</p>
          <div className="space-y-1">
            {c.taskList.slice(0, 5).map((t: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-white rounded-lg px-3 py-2 border border-slate-100">
                <span className="text-xs text-slate-300 font-mono w-4">{i + 1}.</span>
                <span className="flex-1 truncate">{t.name}</span>
                <span className="text-xs text-slate-400 flex-shrink-0">{t.estimatedTime}</span>
              </div>
            ))}
            {c.taskList.length > 5 && <p className="text-xs text-slate-400 pl-3">他 {c.taskList.length - 5} 件...</p>}
          </div>
        </div>
      )}
      {/* Meeting log preview */}
      {(c.meetingLog ?? []).length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">会議ログ（{c.meetingLog.length}名）</p>
          <div className="space-y-2">
            {(c.meetingLog ?? []).slice(0, 2).map((a: any, i: number) => (
              a.message && <div key={i} className="bg-slate-50 rounded-xl px-3 py-2">
                <p className="text-xs font-bold text-slate-500 mb-0.5">{a.name}</p>
                <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ContentArticle({ c }: { c: any }) {
  return (
    <div className="space-y-4">
      {(c.titleIdeas ?? []).length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">タイトル案</p>
          <ul className="space-y-1">
            {c.titleIdeas.slice(0, 3).map((t: string, i: number) => (
              <li key={i} className="text-sm text-slate-700 bg-white rounded-lg px-3 py-2 border border-slate-100">
                {i + 1}. {t}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(c.headingStructure ?? []).length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">見出し構成</p>
          <div className="space-y-1">
            {c.headingStructure.slice(0, 4).map((s: any, i: number) => (
              <div key={i}>
                <p className="text-sm font-semibold text-slate-700">▸ {s.h2}</p>
                {(s.h3s ?? []).slice(0, 2).map((h3: string, j: number) => (
                  <p key={j} className="text-xs text-slate-500 pl-4">  └ {h3}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {(c.seoSuggestions ?? []).length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">SEO改善案</p>
          <ul className="space-y-1">
            {c.seoSuggestions.slice(0, 3).map((tip: string, i: number) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                <span className="text-emerald-500 flex-shrink-0">✓</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ContentAppDesign({ c }: { c: any }) {
  return (
    <div className="space-y-4">
      {(c.requiredFeatures ?? []).length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">必須機能</p>
          <div className="grid grid-cols-2 gap-1.5">
            {c.requiredFeatures.slice(0, 6).map((f: string, i: number) => (
              <div key={i} className="flex items-start gap-2 bg-blue-50 rounded-xl px-3 py-2">
                <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-xs text-blue-900">{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {c.mvpSpec && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">MVP版仕様</p>
          <p className="text-xs text-slate-700 bg-amber-50 rounded-xl p-3 leading-relaxed">{c.mvpSpec}</p>
        </div>
      )}
      {(c.screens ?? []).length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">画面構成 ({c.screens.length}画面)</p>
          <div className="space-y-1">
            {c.screens.slice(0, 4).map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-xs font-bold text-white bg-slate-500 px-2 py-0.5 rounded">画面{i + 1}</span>
                <span className="text-sm text-slate-700">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ContentTaskSession({ c }: { c: any }) {
  const tasks: any[] = c.tasks ?? []
  const done = tasks.filter((t: any) => t.status === '完了').length
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-slate-700">{done}/{tasks.length} 件完了</span>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} />
        </div>
      </div>
      {c.context && <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-2">{c.context}</p>}
      <div className="space-y-1.5">
        {tasks.slice(0, 6).map((t: any, i: number) => (
          <div key={i} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
            t.status === '完了' ? 'bg-emerald-50' : t.status === '保留' ? 'bg-slate-50 opacity-60' : 'bg-white border border-slate-100'
          }`}>
            <span className="text-base flex-shrink-0">{t.status === '完了' ? '✅' : t.status === '保留' ? '⏸' : '○'}</span>
            <span className="text-sm text-slate-800 flex-1 truncate">{t.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
              t.status === '完了' ? 'bg-emerald-100 text-emerald-700' :
              t.status === '保留' ? 'bg-purple-100 text-purple-600' :
              'bg-slate-100 text-slate-500'
            }`}>{t.status ?? '未着手'}</span>
          </div>
        ))}
        {tasks.length > 6 && <p className="text-xs text-slate-400 pl-3">他 {tasks.length - 6} 件...</p>}
      </div>
    </div>
  )
}

function renderContent(item: SavedItem) {
  const c = item.content
  if (!c) return <p className="text-sm text-slate-400">内容がありません</p>
  switch (item.type) {
    case '収益化相談': return <ContentMonetize c={c} />
    case 'AI相談':     return <ContentAiConsult c={c} />
    case '記事作成':   return <ContentArticle c={c} />
    case 'アプリ設計': return <ContentAppDesign c={c} />
    case 'タスク実行': return <ContentTaskSession c={c} />
    default:
      return (
        <pre className="text-xs text-slate-500 whitespace-pre-wrap font-mono overflow-x-auto max-h-48 overflow-y-auto bg-slate-50 rounded-xl p-3">
          {JSON.stringify(c, null, 2)}
        </pre>
      )
  }
}

// ── Main component ─────────────────────────────────────
export default function SavedItemsPanel({ items, onStatusChange, onDelete, onTaskify }: Props) {
  const [filter,     setFilter]    = useState<FilterStatus>('全て')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = filter === '全て' ? items : items.filter(item => item.status === filter)

  const handleDelete = async (id: string) => {
    if (!confirm('この案件を削除しますか？')) return
    setDeletingId(id)
    await onDelete(id)
    setDeletingId(null)
  }

  const handleTaskify = (item: SavedItem) => {
    if (!onTaskify) return
    const tasks = extractTasks(item)
    if (!tasks.length) { alert('このコンテンツからタスクを生成できませんでした'); return }
    onTaskify(tasks, item.title)
  }

  const canTaskify = (item: SavedItem) =>
    onTaskify && ['AI相談', '収益化相談', '記事作成', 'アプリ設計'].includes(item.type)

  const counts = {
    '全て':  items.length,
    '未着手': items.filter(i => i.status === '未着手').length,
    '作業中': items.filter(i => i.status === '作業中').length,
    '完了':   items.filter(i => i.status === '完了').length,
    '保留':   items.filter(i => i.status === '保留').length,
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-6 border-b border-slate-200 bg-white">
        <h2 className="text-xl font-bold text-slate-800">💾 保存した案件</h2>
        <p className="text-sm text-slate-500 mt-1">AIで生成した結果を管理・ステータス追跡できます</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['全て', '未着手', '作業中', '完了', '保留'] as FilterStatus[]).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status}
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                filter === status ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>{counts[status]}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-4xl mb-4">📂</div>
            <p className="text-slate-500 text-sm">
              {filter === '全て' ? '保存された案件がありません' : `「${filter}」の案件はありません`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG['未着手']
              const isExpanded = expandedId === item.id
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Header row */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICON[item.type] ?? '📄'}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-400">{item.type}</span>
                            <span className="text-slate-200">·</span>
                            <span className="text-xs text-slate-400">
                              {new Date(item.created_at).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                        <select
                          value={item.status}
                          onChange={(e) => onStatusChange(item.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-lg border-0 font-medium cursor-pointer ${statusCfg.cls}`}
                        >
                          <option value="未着手">未着手</option>
                          <option value="作業中">作業中</option>
                          <option value="完了">完了</option>
                          <option value="保留">保留</option>
                        </select>
                        {canTaskify(item) && (
                          <button
                            onClick={() => handleTaskify(item)}
                            className="text-xs px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                          >
                            ✅ タスク化
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          {isExpanded ? '閉じる' : '詳細'}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="text-xs text-rose-400 hover:text-rose-600 px-1.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded: type-specific content */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-4">
                      {renderContent(item)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
