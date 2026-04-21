'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [apiKeyPreview, setApiKeyPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        setHasApiKey(d.hasApiKey)
        setApiKeyPreview(d.apiKeyPreview)
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anthropicApiKey: apiKey || null }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ ok: true, text: 'APIキーを保存しました' })
        setHasApiKey(!!apiKey)
        setApiKeyPreview(apiKey ? `sk-ant-...${apiKey.slice(-4)}` : null)
        setApiKey('')
      } else {
        setMessage({ ok: false, text: data.error ?? '保存に失敗しました' })
      }
    } catch {
      setMessage({ ok: false, text: 'ネットワークエラー' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anthropicApiKey: null }),
      })
      if (res.ok) {
        setHasApiKey(false)
        setApiKeyPreview(null)
        setApiKey('')
        setMessage({ ok: true, text: 'APIキーを削除しました' })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <h1 className="text-xl font-bold text-gray-800">設定</h1>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">
            ホーム
          </Link>
          <Link href="/accounts" className="text-sm text-gray-500 hover:text-gray-800">
            アカウント連携
          </Link>
          <UserButton />
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Anthropic APIキー</h2>
          <p className="text-sm text-gray-500 mb-4">
            自分のAPIキーを設定すると、そのキーでAIを利用できます。
            未設定の場合はシステムのAPIキーを使用します。
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-blue-500 underline"
            >
              APIキーはこちらで取得
            </a>
          </p>

          {hasApiKey && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-700 text-sm font-medium">設定済み：{apiKeyPreview}</span>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="ml-auto text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                削除
              </button>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasApiKey ? '新しいAPIキーを入力して上書き' : 'sk-ant-...'}
              className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <button
              type="submit"
              disabled={saving || !apiKey.trim()}
              className="px-5 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存する'}
            </button>
          </form>

          {message && (
            <p className={`mt-3 text-sm ${message.ok ? 'text-green-600' : 'text-red-500'}`}>
              {message.text}
            </p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">コスト削減のポイント</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>本アプリはClaude Haikuモデルを使用（最も低コスト）</li>
            <li>自分のAPIキーを設定すれば、コストを直接管理できます</li>
            <li>Anthropicアカウントの作成は無料、$5から利用可能</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
