'use client'

import { useState } from 'react'

type ArticleResult = {
  titleIdeas: string[]
  headingStructure: { h2: string; h3s: string[] }[]
  bodyDraft: string
  seoSuggestions: string[]
  snsPost: { twitter: string; instagram: string; line: string }
}

type Props = {
  onSave: (title: string, type: string, content: any) => Promise<void>
}

const SNS_TABS = [
  { key: 'twitter', label: 'X (Twitter)', icon: '🐦' },
  { key: 'instagram', label: 'Instagram', icon: '📸' },
  { key: 'line', label: 'LINE', icon: '💬' },
] as const

export default function ArticlePanel({ onSave }: Props) {
  const [topic, setTopic] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [keywords, setKeywords] = useState('')
  const [result, setResult] = useState<ArticleResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeSns, setActiveSns] = useState<'twitter' | 'instagram' | 'line'>('twitter')
  const [selectedTitle, setSelectedTitle] = useState<number | null>(null)
  const [bodyExpanded, setBodyExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copiedSns, setCopiedSns] = useState(false)

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setResult(null)
    setSelectedTitle(null)
    try {
      const res = await fetch('/api/article-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, targetAudience, keywords })
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

  const handleCopySns = () => {
    if (!result) return
    navigator.clipboard.writeText(result.snsPost[activeSns])
    setCopiedSns(true)
    setTimeout(() => setCopiedSns(false), 2000)
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    const title = selectedTitle !== null ? result.titleIdeas[selectedTitle] : result.titleIdeas[0]
    await onSave(title, '記事作成', result)
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-6 border-b border-slate-200 bg-white">
        <h2 className="text-xl font-bold text-slate-800">📝 記事作成</h2>
        <p className="text-sm text-slate-500 mt-1">テーマを入力するとタイトル案・構成・本文・SNS投稿まで一括生成</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {/* Inputs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">テーマ・タイトル案 *</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例：副業初心者がブログで月5万稼ぐ方法"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">ターゲット読者</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="例：20代会社員"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">SEOキーワード</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="例：副業 ブログ 始め方"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />生成中...</>
              ) : '🤖 一括生成する'}
            </button>
          </div>
        </div>

        {result && (
          <>
            {/* Title ideas */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-3">📌 タイトル案（クリックで選択）</h4>
              <div className="space-y-2">
                {result.titleIdeas.map((title, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedTitle(i)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors border ${
                      selectedTitle === i
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800 font-medium'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {i + 1}. {title}
                  </button>
                ))}
              </div>
            </div>

            {/* Heading structure */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-3">🗂 見出し構成</h4>
              <div className="space-y-3">
                {result.headingStructure.map((section, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">H2</span>
                      <span className="text-sm font-semibold text-slate-800">{section.h2}</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      {section.h3s.map((h3, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">H3</span>
                          <span className="text-xs text-slate-600">{h3}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Body draft */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-700">✍️ 本文ドラフト</h4>
                <button
                  onClick={() => setBodyExpanded(!bodyExpanded)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {bodyExpanded ? '折りたたむ ▲' : '全文を見る ▼'}
                </button>
              </div>
              <div className={`text-sm text-slate-700 leading-relaxed whitespace-pre-wrap overflow-hidden transition-all ${bodyExpanded ? '' : 'max-h-24'}`}>
                {result.bodyDraft}
              </div>
              {!bodyExpanded && <div className="h-8 bg-gradient-to-t from-white to-transparent -mt-8 relative" />}
            </div>

            {/* SEO suggestions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-3">🔍 SEO改善案</h4>
              <ul className="space-y-2">
                {result.seoSuggestions.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* SNS posts */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-3">📣 SNS投稿文</h4>
              <div className="flex gap-1 mb-4 bg-slate-100 rounded-xl p-1">
                {SNS_TABS.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveSns(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      activeSns === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span>{icon}</span>{label}
                  </button>
                ))}
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[80px]">
                {result.snsPost[activeSns]}
              </div>
              <button
                onClick={handleCopySns}
                className="mt-3 text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                {copiedSns ? '✓ コピー済み' : 'コピー'}
              </button>
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
