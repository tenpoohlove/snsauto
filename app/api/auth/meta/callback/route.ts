import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { socialAccounts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001').trim()
const REDIRECT_URI = `${APP_URL}/api/auth/meta/callback`

async function exchangeCodeForToken(code: string): Promise<{
  access_token: string
  token_type: string
}> {
  const url = new URL('https://graph.facebook.com/v22.0/oauth/access_token')
  url.searchParams.set('client_id', process.env.INSTAGRAM_APP_ID!.trim())
  url.searchParams.set('client_secret', process.env.INSTAGRAM_APP_SECRET!.trim())
  url.searchParams.set('redirect_uri', REDIRECT_URI)
  url.searchParams.set('code', code)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }
  return res.json()
}

async function getLongLivedToken(shortToken: string): Promise<{
  access_token: string
  expires_in: number
}> {
  const url = new URL('https://graph.facebook.com/v22.0/oauth/access_token')
  url.searchParams.set('grant_type', 'fb_exchange_token')
  url.searchParams.set('client_id', process.env.INSTAGRAM_APP_ID!.trim())
  url.searchParams.set('client_secret', process.env.INSTAGRAM_APP_SECRET!.trim())
  url.searchParams.set('fb_exchange_token', shortToken)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error('Long-lived token exchange failed')
  return res.json()
}

async function getPages(userToken: string): Promise<
  Array<{ id: string; name: string; access_token: string }>
> {
  const res = await fetch(
    `https://graph.facebook.com/v22.0/me/accounts?fields=id,name,access_token&access_token=${userToken}`,
  )
  if (!res.ok) throw new Error('Failed to fetch pages')
  const data = await res.json()
  return data.data ?? []
}

async function getInstagramAccount(
  pageId: string,
  pageToken: string,
): Promise<{ id: string; name: string; username: string } | null> {
  const res = await fetch(
    `https://graph.facebook.com/v22.0/${pageId}?fields=instagram_business_account{id,name,username}&access_token=${pageToken}`,
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.instagram_business_account ?? null
}

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.redirect(`${APP_URL}/sign-in`)

  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${APP_URL}/accounts?error=access_denied`)
  }

  // CSRF check
  const storedState = req.cookies.get('meta_oauth_state')?.value
  if (!state || state !== storedState) {
    return NextResponse.redirect(`${APP_URL}/accounts?error=invalid_state`)
  }

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/accounts?error=no_code`)
  }

  try {
    const { access_token: shortToken } = await exchangeCodeForToken(code)
    const { access_token: longToken, expires_in } = await getLongLivedToken(shortToken)
    const expiresAt = new Date(Date.now() + expires_in * 1000)

    // Get Facebook user profile
    const meRes = await fetch(
      `https://graph.facebook.com/v22.0/me?fields=id,name&access_token=${longToken}`,
    )
    const me = meRes.ok ? await meRes.json() : null

    // Save Facebook user account
    if (me?.id) {
      await db
        .insert(socialAccounts)
        .values({
          userId,
          platform: 'facebook',
          accountId: me.id,
          accountName: me.name ?? me.id,
          accessToken: longToken,
          tokenExpiresAt: expiresAt,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: [socialAccounts.userId, socialAccounts.accountId],
          set: {
            accountName: me.name ?? me.id,
            accessToken: longToken,
            tokenExpiresAt: expiresAt,
            isActive: true,
          },
        })
    }

    // Get Facebook Pages and linked Instagram Business Accounts
    const pages = await getPages(longToken)
    console.log(`Meta OAuth: found ${pages.length} pages for user ${userId}`)

    for (const page of pages) {
      await db
        .insert(socialAccounts)
        .values({
          userId,
          platform: 'facebook',
          accountId: page.id,
          accountName: page.name,
          accessToken: page.access_token,
          tokenExpiresAt: expiresAt,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: [socialAccounts.userId, socialAccounts.accountId],
          set: {
            accountName: page.name,
            accessToken: page.access_token,
            tokenExpiresAt: expiresAt,
            isActive: true,
          },
        })

      const igAccount = await getInstagramAccount(page.id, page.access_token)
      if (igAccount) {
        await db
          .insert(socialAccounts)
          .values({
            userId,
            platform: 'instagram',
            accountId: igAccount.id,
            accountName: igAccount.username ?? igAccount.name,
            accessToken: page.access_token,
            tokenExpiresAt: expiresAt,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: [socialAccounts.userId, socialAccounts.accountId],
            set: {
              accountName: igAccount.username ?? igAccount.name,
              accessToken: page.access_token,
              tokenExpiresAt: expiresAt,
              isActive: true,
            },
          })
      }
    }

    const response = NextResponse.redirect(`${APP_URL}/accounts?success=connected`)
    response.cookies.delete('meta_oauth_state')
    return response
  } catch (err) {
    console.error('Meta OAuth callback error:', err)
    return NextResponse.redirect(`${APP_URL}/accounts?error=oauth_failed`)
  }
}
