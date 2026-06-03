'use client'

import { useState } from 'react'

type Prompt = {
  title: string
  description: string
  text: string
  category: string
}

const PROMPTS: Prompt[] = [
  // ビジネス分析
  {
    category: 'ビジネス分析',
    title: 'SWOT分析',
    description: 'ビジネスアイデアの強み・弱み・機会・脅威を分析',
    text: 'このビジネスアイデアのSWOT分析をしてください。\n\n【アイデア】\n（ここに書く）\n\n強み・弱み・機会・脅威を各3〜5項目挙げ、最後に総合評価と優先すべきアクションを教えてください。',
  },
  {
    category: 'ビジネス分析',
    title: '競合分析レポート',
    description: '市場の競合他社を調査し差別化ポイントを提案',
    text: '以下の市場における主要競合3〜5社を分析してください。\n\n【市場・サービス】\n（ここに書く）\n\n各競合の強み・弱み・価格帯・ターゲット・差別化ポイントを比較表形式でまとめ、私が参入するとしたらどんな差別化ができるか提案してください。',
  },
  {
    category: 'ビジネス分析',
    title: '価格設定プラン',
    description: '3プランの価格設定と料金表を提案',
    text: '以下のサービスの価格設定を考えてください。\n\n【サービス概要】\n（ここに書く）\n\nスターター・スタンダード・プレミアムの3プランを設計し、それぞれの月額料金・含まれる機能・想定ターゲットを提案してください。',
  },
  // マーケティング
  {
    category: 'マーケティング',
    title: 'ペルソナ設計',
    description: '理想的な顧客像を詳細に設計',
    text: '以下のサービス・商品の理想的な顧客ペルソナを作成してください。\n\n【サービス/商品】\n（ここに書く）\n\n年齢・性別・職業・収入・趣味・悩み・目標・普段使うSNS・購買行動パターンを含めた具体的なペルソナを3人作成してください。',
  },
  {
    category: 'マーケティング',
    title: 'SEOコンテンツ戦略',
    description: 'キーワードとコンテンツ計画を立案',
    text: '以下のキーワードでSEO上位を狙うコンテンツ戦略を立案してください。\n\n【メインキーワード】\n（ここに書く）\n\n関連キーワード10個・月間検索ボリューム予測・記事の難易度・推奨する記事テーマ5本・内部リンク構造の提案をお願いします。',
  },
  {
    category: 'マーケティング',
    title: 'LPコピーライティング',
    description: '成約率を高めるLPのコピーを作成',
    text: '以下の商品・サービスのランディングページ（LP）のコピーを作成してください。\n\n【商品/サービス名】：（ここに書く）\n【ターゲット】：（ここに書く）\n【最大の悩み解決】：（ここに書く）\n\nヘッドライン・サブヘッド・ベネフィット3つ・社会的証明・CTA文言を含む構成で作成してください。',
  },
  // 開発・設計
  {
    category: '開発・設計',
    title: 'Claude Code開発指示文',
    description: 'アプリ開発をClaude Codeに依頼するプロンプト',
    text: 'Next.js App Router + TypeScript + Tailwind CSS + Supabaseで以下のアプリを実装してください。\n\n【アプリ概要】\n（ここに書く）\n\n【必要な機能】\n- （機能1）\n- （機能2）\n\n【データベース設計】\n（テーブル構造）\n\nファイル構成・実装手順・コードを順番に教えてください。',
  },
  {
    category: '開発・設計',
    title: 'データベース設計',
    description: 'ERDとSupabaseスキーマを設計',
    text: '以下のアプリのデータベースを設計してください。\n\n【アプリ概要】\n（ここに書く）\n\nSupabase（PostgreSQL）を使用します。テーブル名・カラム・データ型・リレーション・RLSポリシーを含む完全なスキーマを作成してください。',
  },
  {
    category: '開発・設計',
    title: 'バグ修正依頼',
    description: 'エラーの原因と修正コードを依頼',
    text: '以下のコードでエラーが発生しています。原因を特定して修正してください。\n\n【エラーメッセージ】\n（ここに貼る）\n\n【問題のコード】\n```\n（ここに貼る）\n```\n\n原因の説明と修正後のコードを教えてください。',
  },
  // 記事・コンテンツ
  {
    category: '記事・コンテンツ',
    title: '初心者向け解説記事',
    description: '専門的なテーマを初心者向けに解説',
    text: '「（テーマ）」について全くの初心者でもわかるように解説する記事を5000文字で書いてください。\n\n【想定読者】\n（ここに書く）\n\n専門用語は使わず、具体例や比喩を使って説明してください。見出し構成・本文・まとめを含めてください。',
  },
  {
    category: '記事・コンテンツ',
    title: 'SNS投稿1週間分',
    description: '1週間分のSNS投稿をまとめて作成',
    text: '以下のテーマでX（Twitter）に投稿する1週間分の投稿文を作成してください。\n\n【テーマ・ブランド】\n（ここに書く）\n\n各投稿は130文字以内で、日付・曜日・投稿目的（教育・エンタメ・告知・共感など）を明記してください。ハッシュタグも2〜3個つけてください。',
  },
  {
    category: '記事・コンテンツ',
    title: 'FAQページ作成',
    description: 'よくある質問と回答を一括作成',
    text: '以下のサービス・商品に関するFAQ（よくある質問と回答）を15問作成してください。\n\n【サービス/商品】\n（ここに書く）\n\n初心者が持ちやすい疑問・不安・比較検討時の質問を中心に、それぞれ100〜200文字で回答を作成してください。',
  },
  // 生産性向上
  {
    category: '生産性向上',
    title: 'タスク優先度整理',
    description: 'タスクを重要度・緊急度でマトリクス整理',
    text: '以下のタスクを優先度・緊急度マトリクスで整理してください。\n\n【タスクリスト】\n（ここに書く）\n\n「今日やること」「今週やること」「後でやること」「捨てるか委託するもの」に分類し、各タスクの所要時間の目安も教えてください。',
  },
  {
    category: '生産性向上',
    title: '会議メモ整理',
    description: '会議内容から決定事項・アクションアイテムを抽出',
    text: '以下の会議メモを整理してください。\n\n【会議メモ】\n（ここに書く）\n\n「決定事項」「アクションアイテム（担当者・期限付き）」「未解決の課題」「次回議題」の4項目にまとめてください。',
  },
  {
    category: '生産性向上',
    title: '週次業務計画',
    description: '目標から逆算した1週間の業務計画を作成',
    text: '以下の条件で1週間の業務計画を立ててください。\n\n【今週の最重要目標】\n（ここに書く）\n\n【使える時間】\n（例：平日2時間 × 5日）\n\n【制約・予定】\n（ここに書く）\n\n曜日ごとのタスクと所要時間、週末の振り返りポイントを含む計画を作成してください。',
  },
]

const CATEGORIES = ['全て', ...Array.from(new Set(PROMPTS.map(p => p.category)))]

type Props = {
  onUsePrompt: (text: string) => void
}

export default function PromptsPanel({ onUsePrompt }: Props) {
  const [activeCategory, setActiveCategory] = useState('全て')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const filtered = activeCategory === '全て' ? PROMPTS : PROMPTS.filter(p => p.category === activeCategory)

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-6 border-b border-slate-200 bg-white">
        <h2 className="text-xl font-bold text-slate-800">✨ プロンプト集</h2>
        <p className="text-sm text-slate-500 mt-1">すぐ使えるプロンプトテンプレート集。コピーまたはAI相談に送信できます。</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((prompt, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-indigo-200 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {prompt.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{prompt.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{prompt.description}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(prompt.text, i)}
                    className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                  >
                    {copiedIndex === i ? '✓ コピー済み' : 'コピー'}
                  </button>
                  <button
                    onClick={() => onUsePrompt(prompt.text)}
                    className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    AI相談で使う
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed max-h-24 overflow-hidden relative">
                {prompt.text}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 to-transparent" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
