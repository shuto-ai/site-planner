'use client'

type SavedItem = {
  id: string
  title: string
  type: string
  status: '未着手' | '作業中' | '完了'
  content: any
  created_at: string
}

type Props = {
  savedItems: SavedItem[]
  onNavigateToSaved: () => void
  onStatusChange: (id: string, status: string) => Promise<void>
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

export default function RightPanel({ savedItems, onNavigateToSaved, onStatusChange }: Props) {
  const inProgress = savedItems.filter(i => i.status === '作業中')
  const notStarted = savedItems.filter(i => i.status === '未着手').length
  const done = savedItems.filter(i => i.status === '完了').length
  const recent = savedItems.slice(0, 6)

  return (
    <aside className="w-64 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
      <div className="px-5 py-5 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-700">アクションリスト</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Status summary */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">ステータス概要</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: '未着手', count: notStarted, color: 'text-slate-700 bg-slate-50 border-slate-200' },
              { label: '作業中', count: inProgress.length, color: 'text-amber-700 bg-amber-50 border-amber-200' },
              { label: '完了', count: done, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`rounded-xl border p-2 text-center ${color}`}>
                <p className="text-lg font-bold leading-none">{count}</p>
                <p className="text-xs mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* In progress */}
        {inProgress.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">作業中</p>
            <div className="space-y-2">
              {inProgress.slice(0, 3).map(item => (
                <div key={item.id} className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <span className="text-sm flex-shrink-0">{TYPE_ICON[item.type] ?? '📄'}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-amber-900 truncate">{item.title}</p>
                    <button
                      onClick={() => onStatusChange(item.id, '完了')}
                      className="text-xs text-amber-600 hover:text-amber-800 mt-1"
                    >
                      完了にする →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent items */}
        {recent.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">最近の案件</p>
            <div className="space-y-2">
              {recent.map(item => {
                const statusCfg = STATUS_CONFIG[item.status]
                return (
                  <div key={item.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-start gap-2">
                      <span className="text-sm flex-shrink-0">{TYPE_ICON[item.type] ?? '📄'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-800 truncate">{item.title}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusCfg.cls}`}>
                            {item.status}
                          </span>
                          <select
                            value={item.status}
                            onChange={(e) => onStatusChange(item.id, e.target.value)}
                            className="text-xs text-slate-400 bg-transparent border-0 cursor-pointer hover:text-slate-600"
                          >
                            <option value="未着手">未着手</option>
                            <option value="作業中">作業中</option>
                            <option value="完了">完了</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {savedItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-xs text-slate-400">保存した案件がありません</p>
            <p className="text-xs text-slate-300 mt-1">AIで生成した結果を保存すると<br />ここに表示されます</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100">
        <button
          onClick={onNavigateToSaved}
          className="w-full text-center text-xs text-indigo-600 hover:text-indigo-700 font-medium py-2 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          すべての案件を見る →
        </button>
      </div>
    </aside>
  )
}
