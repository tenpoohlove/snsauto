import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { socialAccounts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  // Get saved accounts from DB
  const accounts = await db
    .select()
    .from(socialAccounts)
    .where(eq(socialAccounts.userId, userId))

  // For each facebook account, try to fetch pages
  const results = []
  for (const account of accounts) {
    if (account.platform === 'facebook') {
      const res = await fetch(
        `https://graph.facebook.com/v22.0/me/accounts?fields=id,name,instagram_business_account&access_token=${account.accessToken}`
      )
      const data = await res.json()
      results.push({
        account: account.accountName,
        accountId: account.accountId,
        pages: data.data ?? [],
        error: data.error ?? null,
      })
    }
  }

  return NextResponse.json({ savedAccounts: accounts.map(a => ({ platform: a.platform, accountName: a.accountName, accountId: a.accountId })), pageResults: results })
}
