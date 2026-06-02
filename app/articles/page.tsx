'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Article = {
  title: string
  category: string
  description: string
}

type ArticleContent = {
  title: string
  keywords: string[]
  introduction: string
  sections: { heading: string; content: string }[]
  failure_warning: string
  today_action: string
  conclusion: string
}

export default function ArticlesPage() {
  const [genre, setGenre] = useState('')
  const [target, setTarget] = useState('')
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [articleContent, setArticleContent] = useState<ArticleContent | null>(null)
  const [loadingTitles, setLoadingTitles] = useState(false)
  const [loadingContent, setLoadingContent] = useState(false)
  const router = useRouter()

  const handleGenerateTitles = async () => {
    setLoadingTitles(true)
    setArticles([])
    setSelectedArticle(null)
    setArticleContent(null)

    const res = await fetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'temp', genre, target })
    })
    const { content } = await res.json()
    setArticles(content.articles)
    setLoadingTitles(false)
  }

  const handleSelectArticle = async (article: Article) => {
    setSelectedArticle(article)
    setArticleContent(null)
    setLoadingContent(true)

    const res = await fetch('/api/article-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'temp', title: article.title, genre, target })
    })
    const { content } = await res.json()
    setArticleContent(content)
    setLoadingContent(false)
  }

  return (
    <div style={{ maxWidth: '900px', margin: '50px auto', padding: '20px' }}>
      <button onClick={() => router.push('/dashboard')} style={{ marginBottom: '20px' }}>
        ← ダッシュボードに戻る
      </button>
      <h1>📝 記事エージェント</h1>

      <div style={{ padding: '20px', border: '2px solid #059669', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Step 1：ジャンルとターゲットを入力</h2>
        <label>ジャンル</label>
        <input
          type="text"
          placeholder="例：美容、副業、旅行"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '12px' }}
        />
        <label>ターゲット</label>
        <input
          type="text"
          placeholder="例：20代女性、会社員"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          style={{ display: 'block', width: '100%', padding: '8px', marginBottom: '16px' }}
        />
        <button
          onClick={handleGenerateTitles}
          disabled={loadingTitles || !genre || !target}
          style={{ padding: '10px 24px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }}
        >
          {loadingTitles ? '生成中...' : '🤖 記事タイトルを生成する'}
        </button>
      </div>

      {articles.length > 0 && (
        <div style={{ padding: '20px', border: '2px solid #2563EB', borderRadius: '8px', marginBottom: '20px' }}>
          <h2>Step 2：記事タイトルを選んでください</h2>
          <p style={{ color: '#666' }}>クリックすると本文を自動生成します</p>
          {articles.map((article, i) => (
            <div
              key={i}
              onClick={() => handleSelectArticle(article)}
              style={{
                padding: '12px',
                border: selectedArticle?.title === article.title ? '2px solid #2563EB' : '1px solid #ddd',
                borderRadius: '6px',
                marginBottom: '8px',
                cursor: 'pointer',
                background: selectedArticle?.title === article.title ? '#EFF6FF' : 'white'
              }}
            >
              <strong>{article.title}</strong>
              <p style={{ color: '#666', fontSize: '14px', margin: '4px 0 0' }}>
                📂 {article.category} ／ {article.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {loadingContent && (
        <div style={{ padding: '20px', textAlign: 'center', border: '2px solid #D97706', borderRadius: '8px' }}>
          <p>✍️ 売れる記事を生成中...（10〜30秒かかります）</p>
        </div>
      )}

      {articleContent && (
        <div style={{ padding: '20px', border: '2px solid #D97706', borderRadius: '8px' }}>
          <h2>Step 3：生成された記事</h2>
          <h3>{articleContent.title}</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
            🔑 SEOキーワード：{articleContent.keywords.join('、')}
          </p>
          <hr />

          <div style={{ background: '#FFF7ED', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <p>{articleContent.introduction}</p>
          </div>

          {articleContent.sections.map((section, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <h4 style={{ color: '#1D4ED8' }}>▼ {section.heading}</h4>
              <p style={{ lineHeight: '1.8' }}>{section.content}</p>
            </div>
          ))}

          <div style={{ background: '#FEF2F2', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <strong>⚠️ 初心者がやりがちな失敗</strong>
            <p>{articleContent.failure_warning}</p>
          </div>

          <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <strong>✅ 今日やること</strong>
            <p>{articleContent.today_action}</p>
          </div>

          <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <strong>📌 まとめ</strong>
            <p>{articleContent.conclusion}</p>
          </div>

          <button
            onClick={handleGenerateTitles}
            style={{ marginTop: '16px', padding: '8px 16px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            🔄 別のタイトルで試す
          </button>
        </div>
      )}
    </div>
  )
}