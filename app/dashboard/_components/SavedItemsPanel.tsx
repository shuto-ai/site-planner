'use client'

import { useState } from 'react'

type SavedItem = {
  id: string
  title: string
  type: string
  status: '未着手' | '作業中' | '完了'
  content: any
  created_at: string
}

type Props = {
  items: SavedItem[]
  onStatusChange: (id: string, status: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const STATUS_CONFIG = {
  '未着手': { cls: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  '作業中': { cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  '完了': { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
}

const TYPE_ICON: Record<string, string> = {
  'AI相談': '🤖',
  '記事作成': '📝',
  'アプリ設計': '⚙️',
  'シフト作成': '📅',
}

type FilterStatus = '全て' | '未着手' | '作業中' | '完了'

export default function SavedItemsPanel({ items, onStatusChange, onDelete }: Props) {
  const [filter, setFilter] = useState<FilterStatus>('全て')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = filter === '全て' ? items : items.filter(item => item.status === filter)

  const handleDelete = async (id: string) => {
    if (!confirm('この案件を削除しますか？')) return
    setDeletingId(id)
    await onDelete(id)
    setDeletingId(null)
  }

  const counts = {
    '全て': items.length,
    '未着手': items.filter(i => i.status === '未着手').length,
    '作業中': items.filter(i => i.status === '作業中').length,
    '完了': items.filter(i => i.status === '完了').length,
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-6 border-b border-slate-200 bg-white">
        <h2 className="text-xl font-bold text-slate-800">💾 保存した案件</h2>
        <p className="text-sm text-slate-500 mt-1">AIで生成した結果を管理・ステータス追跡できます</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['全て', '未着手', '作業中', '完了'] as FilterStatus[]).map(status => (
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
              }`}>
                {counts[status]}
              </span>
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
              const statusCfg = STATUS_CONFIG[item.status]
              const isExpanded = expandedId === item.id
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Status selector */}
                        <select
                          value={item.status}
                          onChange={(e) => onStatusChange(item.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-lg border-0 font-medium cursor-pointer ${statusCfg.cls}`}
                        >
                          <option value="未着手">未着手</option>
                          <option value="作業中">作業中</option>
                          <option value="完了">完了</option>
                        </select>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          {isExpanded ? '折りたたむ' : '詳細'}
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

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4">
                      <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono overflow-x-auto max-h-60 overflow-y-auto">
                        {JSON.stringify(item.content, null, 2)}
                      </pre>
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
