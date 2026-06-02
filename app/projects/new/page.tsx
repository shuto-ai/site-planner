'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewProjectPage() {
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [target, setTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCreate = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({ title, genre, target, user_id: user.id })
      .select()
      .single()

    if (error) {
      alert('エラーが発生しました: ' + error.message)
      setLoading(false)
      return
    }

    router.push(`/projects/${data.id}`)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h1>新しいプロジェクト</h1>
      <label>プロジェクト名</label>
      <input
        type="text"
        placeholder="例：美容メディア"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '16px' }}
      />
      <label>ジャンル</label>
      <input
        type="text"
        placeholder="例：美容、副業、旅行"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '16px' }}
      />
      <label>ターゲット</label>
      <input
        type="text"
        placeholder="例：20代女性、会社員"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '24px' }}
      />
      <button
        onClick={handleCreate}
        disabled={loading}
        style={{ padding: '12px 24px', fontSize: '16px' }}
      >
        {loading ? '作成中...' : 'プロジェクトを作成してAI生成へ'}
      </button>
    </div>
  )
}