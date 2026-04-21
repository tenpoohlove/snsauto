'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { UserButton } from '@clerk/nextjs'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'

const MODEL_LABELS: Record<string, string> = {
  'claude-haiku-4-5-20251001': 'Haiku（最安）',
  'claude-sonnet-4-6': 'Sonnet（バランス）',
  'claude-opus-4-7': 'Opus（最高品質）',
}

const LENGTH_LABELS = [
  { value: 'short', label: '短め' },
  { value: 'medium', label: '標準' },
  { value: 'long', label: '長め' },
]

function parsePost(text: string): { caption: string; hashtags: string[] } | null {
  try {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/)
    if (match) {
      const parsed = JSON.parse(match[1])
      if (parsed.caption) return parsed
    }
    // フォールバック: JSON直接
    const directMatch = text.match(/\{[\s\S]*"caption"[\s\S]*\}/)
    if (directMatch) {
      const parsed = JSON.parse(directMatch[0])
      if (parsed.caption) return parsed
    }
  } catch {}
  return null
}

function PostPreview({
  post,
  platform,
  messageId,
  imageUrl,
  setImageUrl,
  onPost,
  posting,
  result,
}: {
  post: { caption: string; hashtags: string[] }
  platform: string
  messageId: string
  imageUrl: string
  setImageUrl: (v: string) => void
  onPost: (id: string, caption: string) => void
  posting: boolean
  result?: { ok: boolean; msg: string }
}) {
  const [tab, setTab] = useState<'preview' | 'raw'>('preview')
  const charCount = post.caption.length
  const fullText = post.hashtags?.length
    ? `${post.caption}\n\n${post.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}`
    : post.caption

  return (
    <div className="mt-2 max-w-[85%] w-full border rounded-xl bg-white shadow-sm overflow-hidden">
      {/* タブ */}
      <div className="flex border-b text-xs">
        <button
          onClick={() => setTab('preview')}
          className={`px-4 py-2 font-medium ${tab === 'preview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-400'}`}
        >
          プレビュー
        </button>
        <button
          onClick={() => setTab('raw')}
          className={`px-4 py-2 font-medium ${tab === 'raw' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-400'}`}
        >
          テキスト
        </button>
        <span className="ml-auto px-4 py-2 text-gray-400">{charCount}文字</span>
      </div>

      <div className="p-4">
        {tab === 'preview' ? (
          <div className="space-y-3">
            {/* キャプション */}
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {post.caption}
            </p>
            {/* ハッシュタグ */}
            {post.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {post.hashtags.map((tag, i) => (
                  <span key={i} className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                    #{tag.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <textarea
            readOnly
            value={fullText}
            className="w-full h-40 text-xs text-gray-700 resize-none focus:outline-none font-mono"
          />
        )}
      </div>

      {/* 投稿エリア */}
      <div className="px-4 pb-4 space-y-2 border-t pt-3">
        {platform === 'instagram' && (
          <input
            type="url"
            placeholder="画像URL（Instagram投稿に必要）"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(fullText)
            }}
            className="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:bg-gray-50"
          >
            コピー
          </button>
          <button
            onClick={() => onPost(messageId, fullText)}
            disabled={posting || (platform === 'instagram' && !imageUrl)}
            className="px-4 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {posting ? '投稿中...' : `${platform === 'instagram' ? 'Instagram' : 'Facebook'}に投稿する`}
          </button>
          {result && (
            <p className={`text-xs ${result.ok ? 'text-green-600' : 'text-red-500'}`}>
              {result.msg}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [platform, setPlatform] = useState<'instagram' | 'facebook'>('instagram')
  const [model, setModel] = useState('claude-haiku-4-5-20251001')
  const [length, setLength] = useState('medium')
  const [input, setInput] = useState('')
  const [postingId, setPostingId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [postResult, setPostResult] = useState<Record<string, { ok: boolean; msg: string }>>({})

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => { if (d.model) setModel(d.model) })
      .catch(() => {})
  }, [])

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat', body: { platform, model, length } }),
    [platform, model, length],
  )

  const { messages, sendMessage, status } = useChat({ transport })
  const isLoading = status === 'streaming' || status === 'submitted'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] })
    setInput('')
  }

  async function handleModelChange(newModel: string) {
    setModel(newModel)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: newModel }),
    }).catch(() => {})
  }

  async function handlePost(messageId: string, caption: string) {
    setPostingId(messageId)
    try {
      const res = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, caption, imageUrl: imageUrl || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        setPostResult((prev) => ({ ...prev, [messageId]: { ok: true, msg: '投稿しました！' } }))
        setImageUrl('')
      } else {
        setPostResult((prev) => ({ ...prev, [messageId]: { ok: false, msg: data.error ?? '投稿に失敗しました' } }))
      }
    } catch {
      setPostResult((prev) => ({ ...prev, [messageId]: { ok: false, msg: 'ネットワークエラー' } }))
    } finally {
      setPostingId(null)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <h1 className="text-xl font-bold text-gray-800">SNS自動投稿</h1>
        <div className="flex items-center gap-3">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as 'instagram' | 'facebook')}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
          </select>
          <select
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            {LENGTH_LABELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <select
            value={model}
            onChange={(e) => handleModelChange(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            {Object.entries(MODEL_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <Link href="/accounts" className="text-sm text-gray-500 hover:text-gray-800">
            アカウント連携
          </Link>
          <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-800">
            設定
          </Link>
          <UserButton />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
        {messages.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium mb-2">投稿したいテーマを入力してください</p>
            <p className="text-sm">例：「ダイエット食事管理の無料チェックリストを配布したい」</p>
          </div>
        )}
        {messages.map((m) => {
          const text = m.parts
            .filter((p) => p.type === 'text')
            .map((p) => (p as { type: 'text'; text: string }).text)
            .join('')

          if (m.role === 'user') {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[80%] px-4 py-3 rounded-2xl text-sm bg-blue-500 text-white">
                  {text}
                </div>
              </div>
            )
          }

          const post = parsePost(text)

          return (
            <div key={m.id} className="flex flex-col items-start">
              {post ? (
                <PostPreview
                  post={post}
                  platform={platform}
                  messageId={m.id}
                  imageUrl={imageUrl}
                  setImageUrl={setImageUrl}
                  onPost={handlePost}
                  posting={postingId === m.id}
                  result={postResult[m.id]}
                />
              ) : (
                <div className="max-w-[80%] px-4 py-3 rounded-2xl text-sm bg-white text-gray-800 border shadow-sm whitespace-pre-wrap">
                  {text}
                </div>
              )}
            </div>
          )
        })}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border shadow-sm px-4 py-3 rounded-2xl text-sm text-gray-400">
              生成中...
            </div>
          </div>
        )}
      </div>

      <div className="border-t bg-white px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="投稿したいテーマや特典の内容を入力..."
            className="flex-1 px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            送信
          </button>
        </form>
      </div>
    </div>
  )
}
