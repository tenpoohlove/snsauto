'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

const MODELS = [
  { value: 'claude-haiku-4-5-20251001', label: 'Haiku（最安・高速）', desc: '通常の投稿生成に十分。コスト最小。' },
  { value: 'claude-sonnet-4-6', label: 'Sonnet（バランス）', desc: 'より高品質な文章が必要な場合。' },
  { value: 'claude-opus-4-7', label: 'Opus（最高品質）', desc: '最高精度。コスト高め。' },
]

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [apiKeyPreview, setApiKeyPreview] = useState<string | null>(null)
  const [model, setModel] = useState('claude-haiku-4-5-20251001')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        setHasApiKey(d.hasApiKey)
        setApiKeyPreview(d.apiKeyPreview)
        setModel(d.model ?? 'claude-haiku-4-5-20251001')
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const body: Record<string, string | null> = { model }
      if (apiKey.trim()) body.anthropicApiKey = apiKey.trim()
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ ok: true, text: '設定を保存しました' })
        if (apiKey.trim()) {
          setHasApiKey(true)
          setApiKeyPreview(`sk-ant-...${apiKey.trim().slice(-4)}`)
          setApiKey('')
        }
      } else {
        setMessage({ ok: false, text: data.error ?? '保存に失敗しました' })
      }
    } catch {
      setMessage({ ok: false, text: 'ネットワークエラー' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteKey() {
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
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">ホーム</Link>
          <Link href="/accounts" className="text-sm text-gray-500 hover:text-gray-800">アカウント連携</Link>
          <UserButton />
        </div>
      </header>

      <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">

        {/* モデル選択 */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">AIモデル</h2>
          <p className="text-sm text-gray-500 mb-4">投稿生成に使うモデルを選択してください。</p>
          <div className="space-y-2">
            {MODELS.map((m) => (
              <label
                key={m.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  model === m.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="model"
                  value={m.value}
                  checked={model === m.value}
                  onChange={() => setModel(m.value)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.label}</p>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* APIキー */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Anthropic APIキー</h2>
          <p className="text-sm text-gray-500 mb-4">
            自分のAPIキーを設定するとそのキーで利用できます。未設定の場合はシステムのキーを使用。
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 underline">
              APIキーを取得
            </a>
          </p>

          {hasApiKey && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-700 text-sm font-medium">設定済み：{apiKeyPreview}</span>
              <button onClick={handleDeleteKey} disabled={saving} className="ml-auto text-xs text-red-500 hover:text-red-700 disabled:opacity-50">
                削除
              </button>
            </div>
          )}

          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasApiKey ? '新しいAPIキーを入力して上書き' : 'sk-ant-...'}
            className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        <form onSubmit={handleSave}>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '設定を保存する'}
          </button>
        </form>

        {message && (
          <p className={`text-sm text-center ${message.ok ? 'text-green-600' : 'text-red-500'}`}>
            {message.text}
          </p>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">コスト目安（1回の投稿生成あたり）</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Haiku：約0.5〜1円</li>
            <li>Sonnet：約5〜10円</li>
            <li>Opus：約25〜50円</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
