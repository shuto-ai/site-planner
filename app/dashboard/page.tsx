'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Project = {
  id: string
  title: string
  genre: string
  target: string
  created_at: string
}

const GENRE_COLORS: { keyword: string; cls: string }[] = [
  { keyword: '美容', cls: 'bg-pink-100 text-pink-700' },
  { keyword: '副業', cls: 'bg-amber-100 text-amber-700' },
  { keyword: '旅行', cls: 'bg-sky-100 text-sky-700' },
  { keyword: '健康', cls: 'bg-green-100 text-green-700' },
  { keyword: 'ビジネス', cls: 'bg-purple-100 text-purple-700' },
  { keyword: '料理', cls: 'bg-orange-100 text-orange-700' },
  { keyword: 'IT', cls: 'bg-cyan-100 text-cyan-700' },
]

function genreColor(genre: string) {
  const hit = GENRE_COLORS.find(({ keyword }) => genre.includes(keyword))
  return hit ? hit.cls : 'bg-indigo-100 text-indigo-700'
}

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserEmail(user.email ?? '')

      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setProjects(data ?? [])
      setLoading(false)
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold tracking-tight">SP</span>
            </div>
            <span className="text-xl font-bold text-slate-800">Site Planner</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-slate-400">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Page heading */}
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">プロジェクト一覧</h1>
            <p className="text-slate-500 mt-1 text-sm">あなたのサイト企画を管理・実行しましょう</p>
          </div>
          <button
            onClick={() => router.push('/projects/new')}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors text-sm"
          >
            <span className="text-base leading-none">＋</span>
            新しいプロジェクト
          </button>
        </div>

        {/* Stats bar */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'プロジェクト数', value: projects.length, color: 'text-slate-800' },
              { label: 'ジャンル数', value: new Set(projects.map(p => p.genre)).size, color: 'text-slate-800' },
              { label: 'AI機能', value: 4, color: 'text-indigo-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">{label}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-9 h-9 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5 text-4xl">
              📋
            </div>
            <h2 className="text-lg font-semibold text-slate-700 mb-2">プロジェクトがまだありません</h2>
            <p className="text-slate-400 text-sm mb-8 max-w-xs">
              最初のプロジェクトを作成して、AIを使ったサイト企画を始めましょう
            </p>
            <button
              onClick={() => router.push('/projects/new')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm"
            >
              最初のプロジェクトを作成
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="group text-left bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="text-white font-bold text-base">
                      {project.title.charAt(0)}
                    </span>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${genreColor(project.genre)}`}>
                    {project.genre}
                  </span>
                </div>

                <h3 className="font-semibold text-slate-800 text-base mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {project.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1">
                  ターゲット：{project.target}
                </p>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-300">
                    {new Date(project.created_at).toLocaleDateString('ja-JP')}
                  </span>
                  <span className="text-xs text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    開く →
                  </span>
                </div>
              </button>
            ))}

            {/* Add project card */}
            <button
              onClick={() => router.push('/projects/new')}
              className="text-left bg-white/60 rounded-2xl p-6 border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-200 flex flex-col items-center justify-center min-h-[190px] gap-3 group"
            >
              <div className="w-11 h-11 bg-indigo-50 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center transition-colors">
                <span className="text-indigo-500 text-2xl leading-none font-light">＋</span>
              </div>
              <span className="text-slate-400 group-hover:text-indigo-500 font-medium text-sm transition-colors">
                新しいプロジェクトを追加
              </span>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
