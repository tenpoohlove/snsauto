import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { socialAccounts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const accounts = await db
    .select({
      id: socialAccounts.id,
      platform: socialAccounts.platform,
      accountId: socialAccounts.accountId,
      accountName: socialAccounts.accountName,
      tokenExpiresAt: socialAccounts.tokenExpiresAt,
      isActive: socialAccounts.isActive,
      createdAt: socialAccounts.createdAt,
    })
    .from(socialAccounts)
    .where(eq(socialAccounts.userId, userId))

  return NextResponse.json(accounts)
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await req.json()
  if (!id) return new NextResponse('Missing id', { status: 400 })

  await db
    .delete(socialAccounts)
    .where(and(eq(socialAccounts.id, id), eq(socialAccounts.userId, userId)))

  return new NextResponse(null, { status: 204 })
}
