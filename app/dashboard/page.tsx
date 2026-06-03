'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import AiConsultPanel from './_components/AiConsultPanel'
import ArticlePanel from './_components/ArticlePanel'
import AppDesignPanel from './_components/AppDesignPanel'
import MonetizePanel from './_components/MonetizePanel'
import TaskPanel, { type GeneratedTask } from './_components/TaskPanel'
import SavedItemsPanel from './_components/SavedItemsPanel'
import PromptsPanel from './_components/PromptsPanel'
import RightPanel from './_components/RightPanel'

type SavedItem = {
  id: string
  title: string
  type: string
  status: '未着手' | '作業中' | '完了' | '保留'
  content: any
  created_at: string
}

type Mode = 'ai-consult' | 'article' | 'app-design' | 'monetize' | 'tasks' | 'saved' | 'prompts'

const MENU: { mode: Mode; icon: string; label: string }[] = [
  { mode: 'ai-consult', icon: '🤖', label: 'AI相談' },
  { mode: 'monetize',   icon: '💰', label: '収益化相談' },
  { mode: 'article',    icon: '📝', label: '記事作成' },
  { mode: 'app-design', icon: '⚙️', label: 'アプリ設計' },
  { mode: 'tasks',      icon: '✅', label: 'タスク実行' },
  { mode: 'saved',      icon: '💾', label: '保存した案件' },
  { mode: 'prompts',    icon: '✨', label: 'プロンプト集' },
]

export default function DashboardPage() {
  const [mode,             setMode]           = useState<Mode>('ai-consult')
  const [userEmail,        setUserEmail]       = useState('')
  const [userId,           setUserId]          = useState('')
  const [savedItems,       setSavedItems]      = useState<SavedItem[]>([])
  const [pendingPrompt,    setPendingPrompt]   = useState('')
  const [pendingTasks,     setPendingTasks]    = useState<GeneratedTask[]>([])
  const [taskContext,      setTaskContext]     = useState('')
  const [pendingTopic,     setPendingTopic]    = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserEmail(user.email ?? '')
      setUserId(user.id)
      loadSavedItems(user.id)
    }
    init()
  }, [])

  const loadSavedItems = async (uid: string) => {
    const { data } = await supabase
      .from('saved_items')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setSavedItems(data ?? [])
  }

  const handleSave = async (title: string, type: string, content: any) => {
    const { data, error } = await supabase
      .from('saved_items')
      .insert({ title, type, content, user_id: userId, status: '未着手' })
      .select()
      .single()
    if (!error && data) setSavedItems(prev => [data, ...prev])
  }

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('saved_items').update({ status }).eq('id', id)
    setSavedItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: status as SavedItem['status'] } : item
    ))
  }

  const handleDelete = async (id: string) => {
    await supabase.from('saved_items').delete().eq('id', id)
    setSavedItems(prev => prev.filter(item => item.id !== id))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // AI相談 → プロンプト集からのプロンプト送り込み
  const handleUsePrompt = (text: string) => {
    setPendingPrompt(text)
    setMode('ai-consult')
  }

  // AI相談 → タスク化
  const handleTaskify = (tasks: GeneratedTask[], context: string) => {
    setPendingTasks(tasks)
    setTaskContext(context)
    setMode('tasks')
  }

  // AI相談 → 記事作成へ
  const handleNavigateArticle = (topic: string) => {
    setPendingTopic(topic)
    setMode('article')
  }

  const commonProps = { onSave: handleSave }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Left Sidebar ── */}
      <aside className="w-56 bg-slate-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-500 rounded-md flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-black tracking-tighter">AI</span>
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-tight">作業支援AI</p>
              <p className="text-slate-500 text-xs leading-tight">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {MENU.map(({ mode: m, icon, label }) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="text-base leading-none">{icon}</span>
              <span className="flex-1 text-left">{label}</span>
              {m === 'tasks' && pendingTasks.length > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                  mode === m ? 'bg-white/20 text-white' : 'bg-indigo-700 text-indigo-300'
                }`}>{pendingTasks.length}</span>
              )}
              {m === 'saved' && savedItems.length > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                  mode === m ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                }`}>{savedItems.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-slate-700/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{userEmail.charAt(0).toUpperCase()}</span>
            </div>
            <p className="text-slate-400 text-xs truncate">{userEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-slate-500 hover:text-slate-300 transition-colors px-1"
          >
            ログアウト →
          </button>
        </div>
      </aside>

      {/* ── Center Main ── */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {mode === 'ai-consult' && (
          <AiConsultPanel
            key={pendingPrompt}
            defaultInput={pendingPrompt}
            onSave={handleSave}
            onTaskify={handleTaskify}
            onNavigateArticle={handleNavigateArticle}
          />
        )}
        {mode === 'monetize'   && <MonetizePanel   {...commonProps} />}
        {mode === 'article'    && (
          <ArticlePanel
            key={pendingTopic}
            defaultTopic={pendingTopic}
            onSave={handleSave}
          />
        )}
        {mode === 'app-design' && <AppDesignPanel  {...commonProps} />}
        {mode === 'tasks'      && (
          <TaskPanel
            key={pendingTasks.map(t => t.name).join('|')}
            tasks={pendingTasks}
            context={taskContext}
          />
        )}
        {mode === 'saved'      && (
          <SavedItemsPanel
            items={savedItems}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}
        {mode === 'prompts'    && (
          <PromptsPanel onUsePrompt={handleUsePrompt} />
        )}
      </main>

      {/* ── Right Panel ── */}
      <RightPanel
        savedItems={savedItems}
        onNavigateToSaved={() => setMode('saved')}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
