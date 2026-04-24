import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
].join(',')

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const appId = process.env.INSTAGRAM_APP_ID?.trim()
  if (!appId) return new NextResponse('Meta App ID not configured', { status: 500 })

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001').trim()
  const redirectUri = `${appUrl}/api/auth/meta/callback`

  // CSRF protection via state param
  const state = crypto.randomBytes(16).toString('hex')

  const url = new URL('https://www.facebook.com/v22.0/dialog/oauth')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', SCOPES)
  url.searchParams.set('state', state)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('auth_type', 'rerequest')

  const response = NextResponse.redirect(url.toString())
  // Store state in cookie for verification in callback
  response.cookies.set('meta_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return response
}
