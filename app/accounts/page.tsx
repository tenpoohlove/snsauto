'use client'

import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type Account = {
  id: string
  platform: 'instagram' | 'facebook'
  accountId: string
  accountName: string
  tokenExpiresAt: string | null
  isActive: boolean
  createdAt: string
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const error = searchParams.get('error')

  async function fetchAccounts() {
    setLoading(true)
    const res = await fetch('/api/accounts')
    if (res.ok) setAccounts(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  async function disconnect(id: string) {
    setDeleting(id)
    await fetch('/api/accounts', { method: 'DELETE', body: JSON.stringify({ id }), headers: { 'Content-Type': 'application/json' } })
    setAccounts((prev) => prev.filter((a) => a.id !== id))
    setDeleting(null)
  }

  const instagram = accounts.filter((a) => a.platform === 'instagram')
  const facebook = accounts.filter((a) => a.platform === 'facebook')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-800 text-sm">← チャットに戻る</Link>
          <h1 className="text-xl font-bold text-gray-800">SNSアカウント連携</h1>
        </div>
        <UserButton />
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {success === 'connected' && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
            アカウントを連携しました！
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
            {error === 'access_denied' && 'アクセスが拒否されました。'}
            {error === 'invalid_state' && 'セッションが無効です。もう一度お試しください。'}
            {error === 'oauth_failed' && 'OAuth認証に失敗しました。Meta App IDとSecretを確認してください。'}
            {!['access_denied', 'invalid_state', 'oauth_failed'].includes(error) && 'エラーが発生しました。'}
          </div>
        )}

        {/* Connect button */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Facebookでログインして連携</h2>
          <p className="text-sm text-gray-500 mb-4">
            FacebookページとInstagramビジネスアカウントを一括で連携できます。
          </p>
          <a
            href="/api/auth/meta/connect"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Facebookでログイン
          </a>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">読み込み中...</p>
        ) : (
          <>
            <AccountList
              title="Instagram"
              icon="📸"
              accounts={instagram}
              deleting={deleting}
              onDisconnect={disconnect}
            />
            <AccountList
              title="Facebook ページ"
              icon="📘"
              accounts={facebook}
              deleting={deleting}
              onDisconnect={disconnect}
            />
          </>
        )}
      </div>
    </div>
  )
}

function AccountList({
  title,
  icon,
  accounts,
  deleting,
  onDisconnect,
}: {
  title: string
  icon: string
  accounts: Account[]
  deleting: string | null
  onDisconnect: (id: string) => void
}) {
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b bg-gray-50">
        <h2 className="font-semibold text-gray-700 text-sm">{icon} {title}</h2>
      </div>
      {accounts.length === 0 ? (
        <p className="px-5 py-4 text-sm text-gray-400">未連携</p>
      ) : (
        <ul className="divide-y">
          {accounts.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">@{a.accountName}</p>
                <p className="text-xs text-gray-400">
                  ID: {a.accountId}
                  {a.tokenExpiresAt && (
                    <> · トークン期限: {new Date(a.tokenExpiresAt).toLocaleDateString('ja-JP')}</>
                  )}
                </p>
              </div>
              <button
                onClick={() => onDisconnect(a.id)}
                disabled={deleting === a.id}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
              >
                {deleting === a.id ? '削除中...' : '連携解除'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
