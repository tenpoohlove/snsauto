import { NextResponse } from 'next/server'

export async function GET() {
  const appId = process.env.INSTAGRAM_APP_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
  const redirectUri = `${appUrl}/api/auth/meta/callback`

  const oauthUrl = new URL('https://www.facebook.com/v22.0/dialog/oauth')
  oauthUrl.searchParams.set('client_id', appId ?? 'MISSING')
  oauthUrl.searchParams.set('redirect_uri', redirectUri)
  oauthUrl.searchParams.set('scope', 'pages_show_list,pages_read_engagement')
  oauthUrl.searchParams.set('state', 'debug')
  oauthUrl.searchParams.set('response_type', 'code')

  return NextResponse.json({
    appId,
    appUrl,
    redirectUri,
    oauthUrl: oauthUrl.toString(),
  })
}
