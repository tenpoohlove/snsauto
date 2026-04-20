import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { socialAccounts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

async function publishInstagram(igAccountId: string, pageToken: string, caption: string, imageUrl: string) {
  // Step 1: Create media container
  const containerRes = await fetch(
    `https://graph.facebook.com/v22.0/${igAccountId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: pageToken }),
    },
  )
  if (!containerRes.ok) {
    const err = await containerRes.json()
    throw new Error(err.error?.message ?? 'Failed to create IG media container')
  }
  const { id: creationId } = await containerRes.json()

  // Step 2: Publish
  const publishRes = await fetch(
    `https://graph.facebook.com/v22.0/${igAccountId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: creationId, access_token: pageToken }),
    },
  )
  if (!publishRes.ok) {
    const err = await publishRes.json()
    throw new Error(err.error?.message ?? 'Failed to publish IG media')
  }
  return publishRes.json()
}

async function publishFacebook(pageId: string, pageToken: string, message: string, imageUrl?: string) {
  const body: Record<string, string> = { message, access_token: pageToken }
  if (imageUrl) body.url = imageUrl

  const endpoint = imageUrl
    ? `https://graph.facebook.com/v22.0/${pageId}/photos`
    : `https://graph.facebook.com/v22.0/${pageId}/feed`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? 'Failed to publish FB post')
  }
  return res.json()
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { platform, caption, imageUrl } = await req.json()
  if (!platform || !caption) {
    return NextResponse.json({ error: 'platform and caption are required' }, { status: 400 })
  }

  const accounts = await db
    .select()
    .from(socialAccounts)
    .where(and(eq(socialAccounts.userId, userId), eq(socialAccounts.platform, platform), eq(socialAccounts.isActive, true)))

  if (accounts.length === 0) {
    return NextResponse.json({ error: `No connected ${platform} account found` }, { status: 400 })
  }

  const account = accounts[0]

  try {
    let result
    if (platform === 'instagram') {
      if (!imageUrl) {
        return NextResponse.json({ error: 'Instagram投稿には画像URLが必要です' }, { status: 400 })
      }
      result = await publishInstagram(account.accountId, account.accessToken, caption, imageUrl)
    } else {
      result = await publishFacebook(account.accountId, account.accessToken, caption, imageUrl)
    }
    return NextResponse.json({ success: true, result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
