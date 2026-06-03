'use client'

import { useState } from 'react'

type ShiftResult = {
  month: string
  daysCount: number
  staff: string[]
  shifts: Record<string, string[]>
  dailyCount: number[]
  warnings: string[]
  summary: string
}

type Props = {
  onSave: (title: string, type: string, content: any) => Promise<void>
}

export default function ShiftPanel({ onSave }: Props) {
  const [staffList, setStaffList] = useState('')
  const [preferences, setPreferences] = useState('')
  const [requiredCount, setRequiredCount] = useState('2')
  const [month, setMonth] = useState('')
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<ShiftResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleGenerate = async () => {
    if (!staffList.trim() || !month.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/shift-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffList, preferences, requiredCount: Number(requiredCount), month, notes })
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

  const handleExportCSV = () => {
    if (!result) return
    const days = Array.from({ length: result.daysCount }, (_, i) => `${i + 1}日`)
    const header = ['スタッフ名', ...days, '出勤日数']
    const rows = result.staff.map(name => {
      const shifts = result.shifts[name] ?? []
      const workDays = shifts.filter(s => s === '出').length
      return [name, ...shifts, String(workDays)]
    })
    const countRow = ['必要人数', ...result.dailyCount.map(String), '']
    const csv = [header, ...rows, countRow].map(row => row.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shift_${result.month.replace(/[年月]/g, '-').replace(/-$/, '')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    await onSave(`${result.month}シフト表`, 'シフト作成', result)
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-6 border-b border-slate-200 bg-white">
        <h2 className="text-xl font-bold text-slate-800">📅 シフト作成</h2>
        <p className="text-sm text-slate-500 mt-1">スタッフ情報を入力するとAIがシフト表を自動作成・CSV出力可能</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Inputs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">スタッフ名（1行に1人）*</label>
              <textarea
                value={staffList}
                onChange={(e) => setStaffList(e.target.value)}
                placeholder={'山田太郎\n佐藤花子\n田中誠'}
                rows={5}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">希望休・シフト希望</label>
              <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder={'山田：毎週月曜休み\n佐藤：15日〜17日希望休\n田中：週3日出勤希望'}
                rows={5}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">対象月 *</label>
              <input
                type="text"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="例：2024年7月"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">1日の必要人数</label>
              <input
                type="number"
                value={requiredCount}
                onChange={(e) => setRequiredCount(e.target.value)}
                min={1}
                max={20}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">備考・ルール</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例：連続勤務は最大5日まで。土日は必ず2人以上。"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleGenerate}
              disabled={loading || !staffList.trim() || !month.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />作成中...</>
              ) : '🤖 シフト表を作成する'}
            </button>
          </div>
        </div>

        {result && (
          <>
            {/* Summary & warnings */}
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
              <p className="text-sm text-orange-900">{result.summary}</p>
              {result.warnings.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-orange-700">
                      <span className="flex-shrink-0">⚠️</span>{w}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Shift table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-700">{result.month} シフト表</h4>
                <button
                  onClick={handleExportCSV}
                  className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1"
                >
                  📥 CSVダウンロード
                </button>
              </div>
              <table className="min-w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-3 py-2 bg-slate-100 border border-slate-200 rounded-tl-lg font-semibold text-slate-600 sticky left-0 min-w-[80px]">
                      スタッフ
                    </th>
                    {Array.from({ length: result.daysCount }, (_, i) => (
                      <th key={i} className="px-1.5 py-2 bg-slate-100 border border-slate-200 text-center font-medium text-slate-600 min-w-[28px]">
                        {i + 1}
                      </th>
                    ))}
                    <th className="px-2 py-2 bg-slate-100 border border-slate-200 text-center font-semibold text-slate-600">出勤日数</th>
                  </tr>
                </thead>
                <tbody>
                  {result.staff.map((name) => {
                    const shifts = result.shifts[name] ?? []
                    const workDays = shifts.filter(s => s === '出').length
                    return (
                      <tr key={name} className="hover:bg-slate-50">
                        <td className="px-3 py-2 border border-slate-200 font-medium text-slate-700 sticky left-0 bg-white">
                          {name}
                        </td>
                        {shifts.map((shift, i) => (
                          <td key={i} className={`px-1 py-2 border border-slate-200 text-center font-medium ${
                            shift === '出' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'
                          }`}>
                            {shift}
                          </td>
                        ))}
                        <td className="px-2 py-2 border border-slate-200 text-center font-bold text-slate-700">{workDays}</td>
                      </tr>
                    )
                  })}
                  {/* Daily count row */}
                  <tr className="bg-slate-50">
                    <td className="px-3 py-2 border border-slate-200 font-bold text-slate-600 text-xs sticky left-0 bg-slate-50">人数計</td>
                    {result.dailyCount.map((count, i) => (
                      <td key={i} className={`px-1 py-2 border border-slate-200 text-center text-xs font-bold ${
                        count >= Number(requiredCount) ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {count}
                      </td>
                    ))}
                    <td className="border border-slate-200" />
                  </tr>
                </tbody>
              </table>
            </div>

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
