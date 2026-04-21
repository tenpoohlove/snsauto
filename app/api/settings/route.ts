import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const VALID_MODELS = ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-7'] as const

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1)
  const setting = rows[0]

  return NextResponse.json({
    hasApiKey: !!setting?.anthropicApiKey,
    apiKeyPreview: setting?.anthropicApiKey
      ? `sk-ant-...${setting.anthropicApiKey.slice(-4)}`
      : null,
    model: setting?.model ?? 'claude-haiku-4-5-20251001',
  })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { anthropicApiKey, model } = await req.json()

  if (anthropicApiKey && !anthropicApiKey.startsWith('sk-ant-')) {
    return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 })
  }

  if (model && !VALID_MODELS.includes(model)) {
    return NextResponse.json({ error: 'Invalid model' }, { status: 400 })
  }

  await db
    .insert(userSettings)
    .values({ userId, anthropicApiKey: anthropicApiKey || null, model: model ?? 'claude-haiku-4-5-20251001', updatedAt: new Date() })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: {
        ...(anthropicApiKey !== undefined && { anthropicApiKey: anthropicApiKey || null }),
        ...(model !== undefined && { model }),
        updatedAt: new Date(),
      },
    })

  return NextResponse.json({ ok: true })
}
