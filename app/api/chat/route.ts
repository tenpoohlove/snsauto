import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText, convertToModelMessages } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { userSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const maxDuration = 60

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { messages, platform, model: bodyModel } = await req.json()

  const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1)
  const userApiKey = rows[0]?.anthropicApiKey
  const selectedModel = bodyModel ?? rows[0]?.model ?? 'claude-haiku-4-5-20251001'
  const anthropic = createAnthropic({ apiKey: userApiKey || process.env.ANTHROPIC_API_KEY! })

  const systemPrompt = `あなたはSNSマーケティングの専門家です。
ユーザーが入力したテーマに基づいて、以下を行います：

1. まずテーマについてリサーチし、重要なポイントを整理する
2. ${platform === 'instagram' ? 'Instagram' : 'Facebook'}向けの投稿文を生成する
   - Instagramの場合: キャプション（最大2200文字）+ ハッシュタグ（最大30個）
   - Facebookの場合: 投稿文（自然な日本語で）
3. 投稿文は日本語で、ターゲットに響く魅力的な内容にする
4. 最後に生成した投稿を以下のJSON形式で出力する：

\`\`\`json
{
  "caption": "投稿テキスト",
  "hashtags": ["ハッシュタグ1", "ハッシュタグ2"],
  "platform": "${platform}"
}
\`\`\`

ユーザーの無料特典（リードマグネット）を宣伝する投稿を作成することが多いです。
フォロワーにDMで特典を受け取ってもらえるよう誘導する文章を心がけてください。`

  console.log('[chat] messages count:', messages?.length, 'platform:', platform)

  try {
    const coreMessages = await convertToModelMessages(messages)
    console.log('[chat] coreMessages:', JSON.stringify(coreMessages).slice(0, 200))

    const result = streamText({
      model: anthropic(selectedModel),
      system: systemPrompt,
      messages: coreMessages,
      onError: (e) => console.error('[chat] streamText error:', e),
    })

    return result.toUIMessageStreamResponse()
  } catch (e) {
    console.error('[chat] caught error:', e)
    return new Response(String(e), { status: 500 })
  }
}
