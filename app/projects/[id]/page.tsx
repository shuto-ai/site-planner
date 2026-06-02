'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

type SiteStructure = {
  siteName: string
  concept: string
  categories: string[]
  topPages: { title: string; description: string }[]
}

type Articles = {
  articles: { title: string; category: string; description: string }[]
}

type SalesMail = {
  subject: string
  body: string
  targetCompanies: string[]
}

type Analysis = {
  persona: {
    age: string
    gender: string
    occupation: string
    income: string
    interests: string[]
    problems: string[]
    goals: string[]
  }
  marketSize: string
  competitors: string[]
  differentiation: string
}

export default function ProjectPage() {
  const [project, setProject] = useState<any>(null)
  const [siteStructure, setSiteStructure] = useState<SiteStructure | null>(null)
  const [articles, setArticles] = useState<Articles | null>(null)
  const [salesMail, setSalesMail] = useState<SalesMail | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single()
      setProject(data)

      const { data: gens } = await supabase
        .from('generations')
        .select('*')
        .eq('project_id', params.id)

      if (gens) {
        gens.forEach((gen: any) => {
          if (gen.type === 'site_structure') setSiteStructure(gen.content)
          if (gen.type === 'articles') setArticles(gen.content)
          if (gen.type === 'sales_mail') setSalesMail(gen.content)
          if (gen.type === 'analyze') setAnalysis(gen.content)
        })
      }
    }
    fetchProject()
  }, [])

  const handleGenerate = async (type: string) => {
    setLoading(type)
    const endpoints: any = {
      site_structure: '/api/generate',
      articles: '/api/articles',
      sales_mail: '/api/sales-mail',
      analyze: '/api/analyze'
    }

    const res = await fetch(endpoints[type], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: params.id,
        genre: project.genre,
        target: project.target,
        siteName: siteStructure?.siteName ?? project.title
      })
    })
    const { content } = await res.json()

    if (type === 'site_structure') setSiteStructure(content)
    if (type === 'articles') setArticles(content)
    if (type === 'sales_mail') setSalesMail(content)
    if (type === 'analyze') setAnalysis(content)
    setLoading(null)
  }

  if (!project) return <p>読み込み中...</p>

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <button onClick={() => router.push('/dashboard')} style={{ marginBottom: '20px' }}>
        ← ダッシュボードに戻る
      </button>
      <h1>{project.title}</h1>
      <p>ジャンル：{project.genre} ／ ターゲット：{project.target}</p>
      <hr />

      {/* サイト構成エージェント */}
      <div style={{ marginTop: '30px', padding: '20px', border: '2px solid #4F46E5', borderRadius: '8px' }}>
        <h2>🌐 サイト構成エージェント</h2>
        <button onClick={() => handleGenerate('site_structure')} disabled={loading === 'site_structure'} style={{ padding: '10px 20px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {loading === 'site_structure' ? '生成中...' : siteStructure ? '🔄 再生成' : '🤖 生成する'}
        </button>
        {siteStructure && (
          <div style={{ marginTop: '16px' }}>
            <h3>サイト名：{siteStructure.siteName}</h3>
            <p>コンセプト：{siteStructure.concept}</p>
            <p>カテゴリ：{siteStructure.categories.join('、')}</p>
            {siteStructure.topPages.map((page, i) => (
              <div key={i} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}>
                <strong>{page.title}</strong><p>{page.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 記事タイトルエージェント */}
      <div style={{ marginTop: '20px', padding: '20px', border: '2px solid #059669', borderRadius: '8px' }}>
        <h2>📝 記事タイトルエージェント</h2>
        <button onClick={() => handleGenerate('articles')} disabled={loading === 'articles'} style={{ padding: '10px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {loading === 'articles' ? '生成中...' : articles ? '🔄 再生成' : '🤖 生成する'}
        </button>
        {articles && (
          <div style={{ marginTop: '16px' }}>
            {articles.articles.map((article, i) => (
              <div key={i} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}>
                <strong>{article.title}</strong>
                <p style={{ color: '#666', fontSize: '14px' }}>📂 {article.category} ／ {article.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 営業メールエージェント */}
      <div style={{ marginTop: '20px', padding: '20px', border: '2px solid #D97706', borderRadius: '8px' }}>
        <h2>📧 営業メールエージェント</h2>
        <button onClick={() => handleGenerate('sales_mail')} disabled={loading === 'sales_mail'} style={{ padding: '10px 20px', background: '#D97706', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {loading === 'sales_mail' ? '生成中...' : salesMail ? '🔄 再生成' : '🤖 生成する'}
        </button>
        {salesMail && (
          <div style={{ marginTop: '16px' }}>
            <p><strong>件名：</strong>{salesMail.subject}</p>
            <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>{salesMail.body}</pre>
            <h4>営業先企業候補：</h4>
            <ul>{salesMail.targetCompanies.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </div>
        )}
      </div>

      {/* ターゲット分析エージェント */}
      <div style={{ marginTop: '20px', padding: '20px', border: '2px solid #DC2626', borderRadius: '8px' }}>
        <h2>🔍 ターゲット分析エージェント</h2>
        <button onClick={() => handleGenerate('analyze')} disabled={loading === 'analyze'} style={{ padding: '10px 20px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {loading === 'analyze' ? '生成中...' : analysis ? '🔄 再生成' : '🤖 生成する'}
        </button>
        {analysis && (
          <div style={{ marginTop: '16px' }}>
            <h3>ペルソナ</h3>
            <p>年齢：{analysis.persona.age} ／ 性別：{analysis.persona.gender}</p>
            <p>職業：{analysis.persona.occupation} ／ 収入：{analysis.persona.income}</p>
            <p>興味：{analysis.persona.interests.join('、')}</p>
            <p>悩み：{analysis.persona.problems.join('、')}</p>
            <p>目標：{analysis.persona.goals.join('、')}</p>
            <h3>市場規模</h3>
            <p>{analysis.marketSize}</p>
            <h3>競合サイト</h3>
            <ul>{analysis.competitors.map((c, i) => <li key={i}>{c}</li>)}</ul>
            <h3>差別化ポイント</h3>
            <p>{analysis.differentiation}</p>
          </div>
        )}
      </div>
    </div>
  )
}