'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUserEmail(user.email ?? '')
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>ダッシュボード</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px' }}>
          ログアウト
        </button>
      </div>
      <p>ログイン中: {userEmail}</p>
      <hr />
      <button
        onClick={() => router.push('/projects/new')}
        style={{ padding: '12px 24px', fontSize: '16px', marginTop: '20px' }}
      >
        ＋ 新しいプロジェクトを作成
      </button>
    </div>
  )
}