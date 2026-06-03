'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────
type Project = {
  id: string
  title: string
  genre: string
  target: string
  created_at: string
}

type ProjectTask = {
  id: string
  project_id: string
  name: string
  description: string
  status: '未着手' | '進行中' | '完了'
  category: string
  priority: string
  created_at: string
}

type Consultation = {
  id: string
  project_id: string | null
  title: string
  user_question: string
  ai_answer: any
  status: string
  created_at: string
}

// ── Style helpers ──────────────────────────────────────
const TASK_STATUS_CFG = {
  '未着手': { cls: 'bg-slate-100 text-slate-600',    next: '進行中' },
  '進行中': { cls: 'bg-amber-100 text-amber-700',    next: '完了'   },
  '完了':   { cls: 'bg-emerald-100 text-emerald-700', next: '未着手' },
} as const

const PRIORITY_COLOR: Record<string, string> = {
  '高': 'bg-rose-100 text-rose-700',
  '中': 'bg-amber-100 text-amber-700',
  '低': 'bg-slate-100 text-slate-500',
}

const CATEGORY_LIST = ['記事作成', 'アプリ開発', '営業', 'SNS', '調査', 'その他']
const PRIORITY_LIST = ['高', '中', '低']

// ── Props ──────────────────────────────────────────────
type Props = { userId: string }

// ── Component ──────────────────────────────────────────
export default function ProjectsPanel({ userId }: Props) {
  const supabase = createClient()

  // View state
  const [view, setView]                     = useState<'list' | 'detail'>('list')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab]           = useState<'tasks' | 'consult'>('tasks')

  // Data
  const [projects,       setProjects]       = useState<Project[]>([])
  const [tasks,          setTasks]          = useState<ProjectTask[]>([])
  const [consultations,  setConsultations]  = useState<Consultation[]>([])

  // Loading
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingTasks,    setLoadingTasks]    = useState(false)
  const [loadingConsults, setLoadingConsults] = useState(false)

  // New project form
  const [showNewProject, setShowNewProject] = useState(false)
  const [newTitle,  setNewTitle]  = useState('')
  const [newGenre,  setNewGenre]  = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [savingProject, setSavingProject] = useState(false)

  // New task form
  const [taskName,     setTaskName]     = useState('')
  const [taskCategory, setTaskCategory] = useState('その他')
  const [taskPriority, setTaskPriority] = useState('中')
  const [addingTask,   setAddingTask]   = useState(false)

  // Consultation form (Phase 2)
  const [consultTitle,    setConsultTitle]    = useState('')
  const [consultQuestion, setConsultQuestion] = useState('')
  const [consultingAI,    setConsultingAI]    = useState(false)
  const [expandedConsult, setExpandedConsult] = useState<string | null>(null)
  const [taskifyingId,    setTaskifyingId]    = useState<string | null>(null)

  // ── Load projects ────────────────────────────────────
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoadingProjects(true)
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setProjects(data ?? [])
    setLoadingProjects(false)
  }

  // ── Load tasks for selected project ─────────────────
  const loadTasks = async (projectId: string) => {
    setLoadingTasks(true)
    const { data } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setTasks((data ?? []) as ProjectTask[])
    setLoadingTasks(false)
  }

  // ── Load consultations for selected project ──────────
  const loadConsultations = async (projectId: string) => {
    setLoadingConsults(true)
    const { data } = await supabase
      .from('consultation_history')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setConsultations((data ?? []) as Consultation[])
    setLoadingConsults(false)
  }

  // ── Select project → detail view ─────────────────────
  const handleSelectProject = async (project: Project) => {
    setSelectedProject(project)
    setView('detail')
    setActiveTab('tasks')
    await Promise.all([loadTasks(project.id), loadConsultations(project.id)])
  }

  const handleBack = () => {
    setView('list')
    setSelectedProject(null)
    setTasks([])
    setConsultations([])
  }

  // ── Create new project ───────────────────────────────
  const handleCreateProject = async () => {
    if (!newTitle.trim()) return
    setSavingProject(true)
    const { data, error } = await supabase
      .from('projects')
      .insert({ title: newTitle, genre: newGenre, target: newTarget, user_id: userId })
      .select()
      .single()
    if (!error && data) {
      setProjects(prev => [data, ...prev])
      setNewTitle(''); setNewGenre(''); setNewTarget('')
      setShowNewProject(false)
    } else {
      alert('作成に失敗しました: ' + (error?.message ?? ''))
    }
    setSavingProject(false)
  }

  // ── Task CRUD ────────────────────────────────────────
  const handleAddTask = async () => {
    if (!taskName.trim() || !selectedProject) return
    setAddingTask(true)
    const { data, error } = await supabase
      .from('project_tasks')
      .insert({
        project_id: selectedProject.id,
        user_id: userId,
        name: taskName,
        description: '',
        status: '未着手',
        category: taskCategory,
        priority: taskPriority,
      })
      .select()
      .single()
    if (!error && data) {
      setTasks(prev => [...prev, data as ProjectTask])
      setTaskName('')
    } else {
      alert('タスク追加に失敗しました: ' + (error?.message ?? ''))
    }
    setAddingTask(false)
  }

  const handleToggleTaskStatus = async (task: ProjectTask) => {
    const next = TASK_STATUS_CFG[task.status].next
    const { error } = await supabase
      .from('project_tasks')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', task.id)
    if (!error) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('このタスクを削除しますか？')) return
    const { error } = await supabase.from('project_tasks').delete().eq('id', taskId)
    if (!error) setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  // ── Consultation (Phase 2) ───────────────────────────
  const handleConsult = async () => {
    if (!consultQuestion.trim() || !selectedProject) return
    setConsultingAI(true)
    try {
      const context = `案件名: ${selectedProject.title}\nジャンル: ${selectedProject.genre}\nターゲット: ${selectedProject.target}`
      const res = await fetch('/api/quick-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: consultQuestion, context }),
      })
      const { content } = await res.json()

      const title = consultTitle.trim() || content.summary || consultQuestion.slice(0, 40)
      const { data, error } = await supabase
        .from('consultation_history')
        .insert({
          project_id: selectedProject.id,
          user_id: userId,
          title,
          user_question: consultQuestion,
          ai_answer: content,
          status: 'active',
        })
        .select()
        .single()

      if (!error && data) {
        setConsultations(prev => [data as Consultation, ...prev])
        setConsultQuestion('')
        setConsultTitle('')
        setExpandedConsult(data.id)
      } else {
        alert('保存に失敗しました: ' + (error?.message ?? ''))
      }
    } catch {
      alert('AI相談中にエラーが発生しました')
    } finally {
      setConsultingAI(false)
    }
  }

  // Taskify from consultation
  const handleTaskifyConsult = async (consult: Consultation) => {
    if (!selectedProject) return
    const taskList: any[] = consult.ai_answer?.taskList ?? []
    if (!taskList.length) { alert('タスクリストが見つかりませんでした'); return }

    setTaskifyingId(consult.id)
    const rows = taskList.map((t: any) => ({
      project_id: selectedProject.id,
      user_id: userId,
      name: t.name,
      description: '',
      status: '未着手',
      category: t.category ?? 'その他',
      priority: t.priority ?? '中',
    }))

    const { data, error } = await supabase.from('project_tasks').insert(rows).select()
    if (!error && data) {
      setTasks(prev => [...prev, ...(data as ProjectTask[])])
      setActiveTab('tasks')
    } else {
      alert('タスク化に失敗しました: ' + (error?.message ?? ''))
    }
    setTaskifyingId(null)
  }

  // ── Render: List view ─────────────────────────────────
  if (view === 'list') {
    return (
      <div className="h-full flex flex-col">
        <div className="px-8 py-6 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">📁 案件管理</h2>
              <p className="text-sm text-slate-500 mt-1">案件ごとにタスクと相談履歴を管理します</p>
            </div>
            <button
              onClick={() => setShowNewProject(!showNewProject)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              ＋ 新しい案件
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* New project form */}
          {showNewProject && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-indigo-800">新しい案件を作成</h3>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="案件名 *"
                className="w-full rounded-xl border border-indigo-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={newGenre}
                  onChange={e => setNewGenre(e.target.value)}
                  placeholder="ジャンル（例：美容、副業）"
                  className="rounded-xl border border-indigo-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                />
                <input
                  value={newTarget}
                  onChange={e => setNewTarget(e.target.value)}
                  placeholder="ターゲット（例：20代女性）"
                  className="rounded-xl border border-indigo-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowNewProject(false); setNewTitle(''); setNewGenre(''); setNewTarget('') }}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={savingProject || !newTitle.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {savingProject ? '作成中...' : '作成する'}
                </button>
              </div>
            </div>
          )}

          {/* Project grid */}
          {loadingProjects ? (
            <div className="flex justify-center py-16">
              <span className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-4xl mb-4">📁</p>
              <p className="text-slate-500 text-sm font-medium">案件がありません</p>
              <p className="text-slate-400 text-xs mt-1">「新しい案件」ボタンから作成してください</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className="group text-left bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-sm mb-3">
                    {project.title.charAt(0)}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                    {project.title}
                  </h3>
                  {project.genre && (
                    <span className="inline-block text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full mt-1.5 font-medium">
                      {project.genre}
                    </span>
                  )}
                  {project.target && (
                    <p className="text-xs text-slate-400 mt-1.5 truncate">対象：{project.target}</p>
                  )}
                  <p className="text-xs text-slate-300 mt-3">
                    {new Date(project.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Render: Detail view ───────────────────────────────
  const project = selectedProject!
  const doneTasks = tasks.filter(t => t.status === '完了').length

  return (
    <div className="h-full flex flex-col">
      {/* Detail header */}
      <div className="px-8 py-5 border-b border-slate-200 bg-white flex-shrink-0">
        <button
          onClick={handleBack}
          className="text-xs text-slate-400 hover:text-slate-600 mb-3 transition-colors"
        >
          ← 案件一覧に戻る
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{project.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              {project.genre && (
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                  {project.genre}
                </span>
              )}
              {project.target && (
                <span className="text-xs text-slate-400">対象：{project.target}</span>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 flex-shrink-0">
            <p>タスク {doneTasks}/{tasks.length} 完了</p>
            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${tasks.length ? (doneTasks / tasks.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mt-4 bg-slate-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'tasks' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ✅ タスク ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('consult')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'consult' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            💬 相談履歴 ({consultations.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">

        {/* ── Tab: タスク ─────────────────────────────── */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {/* Add task form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">タスクを追加</p>
              <div className="flex gap-2 flex-wrap">
                <input
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                  placeholder="タスク名を入力..."
                  className="flex-1 min-w-[200px] rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <select
                  value={taskCategory}
                  onChange={e => setTaskCategory(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {CATEGORY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={taskPriority}
                  onChange={e => setTaskPriority(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {PRIORITY_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button
                  onClick={handleAddTask}
                  disabled={addingTask || !taskName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-medium transition-colors"
                >
                  {addingTask ? '追加中...' : '＋ 追加'}
                </button>
              </div>
            </div>

            {/* Task list */}
            {loadingTasks ? (
              <div className="flex justify-center py-8">
                <span className="w-6 h-6 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm">タスクがありません。上のフォームから追加してください。</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => {
                  const statusCfg = TASK_STATUS_CFG[task.status]
                  return (
                    <div key={task.id} className={`bg-white rounded-2xl border p-4 flex items-center gap-3 shadow-sm transition-all ${
                      task.status === '完了' ? 'border-emerald-200 opacity-70' : 'border-slate-200'
                    }`}>
                      {/* Status toggle */}
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className={`flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors hover:opacity-80 ${statusCfg.cls}`}
                        title={`クリックで「${statusCfg.next}」へ`}
                      >
                        {task.status}
                      </button>

                      {/* Task info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${task.status === '完了' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {task.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{task.category}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${PRIORITY_COLOR[task.priority] ?? 'bg-slate-100 text-slate-500'}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-xs text-rose-300 hover:text-rose-500 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors flex-shrink-0"
                      >
                        削除
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: 相談履歴 (Phase 2) ─────────────────── */}
        {activeTab === 'consult' && (
          <div className="space-y-5">
            {/* New consultation form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                この案件についてAIに相談する
              </p>
              <input
                value={consultTitle}
                onChange={e => setConsultTitle(e.target.value)}
                placeholder="タイトル（省略可：自動生成）"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3"
              />
              <textarea
                value={consultQuestion}
                onChange={e => setConsultQuestion(e.target.value)}
                placeholder="相談内容を入力してください..."
                rows={4}
                disabled={consultingAI}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-slate-50"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleConsult}
                  disabled={consultingAI || !consultQuestion.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  {consultingAI
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />AI相談中...</>
                    : '🤖 AIに相談する'}
                </button>
              </div>
            </div>

            {/* Consultation list */}
            {loadingConsults ? (
              <div className="flex justify-center py-8">
                <span className="w-6 h-6 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : consultations.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-3xl mb-2">💬</p>
                <p className="text-sm">相談履歴がありません。上のフォームからAIに相談してください。</p>
              </div>
            ) : (
              <div className="space-y-3">
                {consultations.map(c => {
                  const isExpanded = expandedConsult === c.id
                  const answer = c.ai_answer
                  return (
                    <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{c.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(c.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                          {!isExpanded && (
                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">{c.user_question}</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {answer?.taskList?.length > 0 && (
                            <button
                              onClick={() => handleTaskifyConsult(c)}
                              disabled={taskifyingId === c.id}
                              className="text-xs px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-lg font-medium transition-colors"
                            >
                              {taskifyingId === c.id ? '追加中...' : '✅ タスク化'}
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedConsult(isExpanded ? null : c.id)}
                            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            {isExpanded ? '閉じる' : '詳細'}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
                          {/* User question */}
                          <div>
                            <p className="text-xs font-bold text-slate-400 mb-1">相談内容</p>
                            <p className="text-sm text-slate-700 leading-relaxed bg-white rounded-xl p-3 border border-slate-100">
                              {c.user_question}
                            </p>
                          </div>
                          {/* AI answer */}
                          {answer && (
                            <>
                              {answer.answer && (
                                <div>
                                  <p className="text-xs font-bold text-indigo-600 mb-1">🤖 AIの回答</p>
                                  <p className="text-sm text-slate-700 leading-relaxed bg-indigo-50 rounded-xl p-3">
                                    {answer.answer}
                                  </p>
                                </div>
                              )}
                              {(answer.actionItems ?? []).length > 0 && (
                                <div>
                                  <p className="text-xs font-bold text-amber-600 mb-1">⚡ 今すぐやること</p>
                                  <ul className="space-y-1">
                                    {answer.actionItems.map((item: string, i: number) => (
                                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                        <span className="w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {(answer.taskList ?? []).length > 0 && (
                                <p className="text-xs text-slate-400">
                                  タスク {answer.taskList.length} 件が生成されています →「✅ タスク化」で案件のタスクに追加
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
