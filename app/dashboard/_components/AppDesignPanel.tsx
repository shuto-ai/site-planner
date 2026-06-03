'use client'

import { useState } from 'react'

type Screen = { name: string; description: string; components: string[] }
type DataTable = { table: string; fields: string[] }

type AppDesignResult = {
  requiredFeatures: string[]
  screens: Screen[]
  dataStructure: DataTable[]
  mvpSpec: string
  claudeCodeInstruction: string
}

type Props = {
  onSave: (title: string, type: string, content: any) => Promise<void>
}

export default function AppDesignPanel({ onSave }: Props) {
  const [appName, setAppName] = useState('')
  const [targetUsers, setTargetUsers] = useState('')
  const [mainFeature, setMainFeature] = useState('')
  const [result, setResult] = useState<AppDesignResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [copiedInstruction, setCopiedInstruction] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleGenerate = async () => {
    if (!appName.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/app-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName, targetUsers, mainFeature })
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

  const handleCopyInstruction = () => {
    if (!result) return
    navigator.clipboard.writeText(result.claudeCodeInstruction)
    setCopiedInstruction(true)
    setTimeout(() => setCopiedInstruction(false), 2000)
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    await onSave(appName, 'アプリ設計', result)
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-6 border-b border-slate-200 bg-white">
        <h2 className="text-xl font-bold text-slate-800">⚙️ アプリ設計</h2>
        <p className="text-sm text-slate-500 mt-1">アプリの概要を入力すると設計書とClaude Code指示文を自動生成</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Inputs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">アプリ名 *</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="例：シフト管理アプリ"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">ターゲットユーザー</label>
              <input
                type="text"
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
                placeholder="例：中小飲食店のオーナー・店長"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">主な機能・解決したい問題</label>
              <textarea
                value={mainFeature}
                onChange={(e) => setMainFeature(e.target.value)}
                placeholder="例：スタッフのシフト希望を収集し、自動でシフト表を生成する。LINEで通知も送れる。"
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleGenerate}
              disabled={loading || !appName.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />設計中...</>
              ) : '🤖 設計書を生成する'}
            </button>
          </div>
        </div>

        {result && (
          <>
            {/* Required features */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-3">✅ 必須機能リスト</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.requiredFeatures.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-blue-50 rounded-xl px-3 py-2.5">
                    <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-sm text-blue-900">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Screens */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-3">🖥 画面構成</h4>
              <div className="space-y-3">
                {result.screens.map((screen, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-white bg-slate-600 px-2 py-0.5 rounded">画面{i + 1}</span>
                      <span className="text-sm font-semibold text-slate-800">{screen.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{screen.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {screen.components.map((comp, j) => (
                        <span key={j} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{comp}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data structure */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-3">🗄 データ構造</h4>
              <div className="space-y-3">
                {result.dataStructure.map((tbl, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4 font-mono text-xs">
                    <p className="text-indigo-600 font-bold mb-1.5">TABLE: {tbl.table}</p>
                    {tbl.fields.map((field, j) => (
                      <p key={j} className="text-slate-600 pl-3">— {field}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* MVP spec */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-amber-800 mb-2">🚀 MVP版仕様</h4>
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{result.mvpSpec}</p>
            </div>

            {/* Claude Code instruction */}
            <div className="bg-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-300">🤖 Claude Codeへの開発指示文</h4>
                <button
                  onClick={handleCopyInstruction}
                  className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  {copiedInstruction ? '✓ コピー済み' : 'コピーして使う'}
                </button>
              </div>
              <pre className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap overflow-x-auto">
                {result.claudeCodeInstruction}
              </pre>
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
