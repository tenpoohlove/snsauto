import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText, convertToModelMessages } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { userSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const maxDuration = 60

const lengthGuide = {
  short: {
    ig: 'キャプション150〜300文字、ハッシュタグ10〜15個',
    fb: '本文150〜300文字、テンポよく読めるシンプルな構成',
  },
  medium: {
    ig: 'キャプション400〜700文字、ハッシュタグ20〜25個',
    fb: '本文400〜700文字、ストーリー性を持たせた構成',
  },
  long: {
    ig: 'キャプション800〜1200文字、ハッシュタグ25〜30個',
    fb: '本文800〜1200文字、共感→問題提起→解決策→CTAの構成',
  },
}

function buildSystemPrompt(platform: string, length: string) {
  const len = lengthGuide[length as keyof typeof lengthGuide] ?? lengthGuide.medium

  if (platform === 'instagram') {
    return `あなたはInstagramマーケティングの専門家です。
ユーザーのテーマをもとに、エンゲージメントの高いInstagram投稿を作成します。

【文字数・ハッシュタグ】
${len.ig}

【Instagram投稿の鉄則】
- 冒頭1〜2行で引きつける（最初の一言が命）
- 短い段落で改行を多用（読みやすさ最優先）
- 絵文字を自然に使う（行頭や強調に）
- フォロワーにDMで特典を受け取ってもらえるよう誘導する
- ハッシュタグは投稿本文の最後にまとめる

【禁止事項】
- 「\\n」「\\t」などの記号をそのまま出力しない
- JSONのエスケープ文字を出力しない
- 説明文・前置きを投稿に含めない

必ず以下のJSON形式のみで回答してください（他のテキストは不要）：

\`\`\`json
{
  "caption": "投稿本文（改行は実際の改行で表現）",
  "hashtags": ["ハッシュタグ1", "ハッシュタグ2"]
}
\`\`\``
  }

  return `あなたはFacebookマーケティングの専門家です。
ユーザーのテーマをもとに、シェアされやすいFacebook投稿を作成します。

【文字数】
${len.fb}

【Facebook投稿の鉄則】
- 共感を呼ぶ書き出し（自分ごと化できる問いかけや体験談）
- 段落ごとに1行空白を入れて読みやすくする
- 具体的な数字や事例を入れると信頼感UP
- 最後に行動を促すCTA（「コメントください」「シェアしてね」など）
- ハッシュタグは3〜5個のみ（Facebookでは少なめが効果的）

【禁止事項】
- 「\\n」「\\t」などの記号をそのまま出力しない
- JSONのエスケープ文字を出力しない
- 説明文・前置きを投稿に含めない

必ず以下のJSON形式のみで回答してください（他のテキストは不要）：

\`\`\`json
{
  "caption": "投稿本文（改行は実際の改行で表現）",
  "hashtags": ["ハッシュタグ1", "ハッシュタグ2"]
}
\`\`\``
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { messages, platform, model: bodyModel, length = 'medium' } = await req.json()

  const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1)
  const userApiKey = rows[0]?.anthropicApiKey
  const selectedModel = bodyModel ?? rows[0]?.model ?? 'claude-haiku-4-5-20251001'
  const anthropic = createAnthropic({ apiKey: userApiKey || process.env.ANTHROPIC_API_KEY! })

  const systemPrompt = buildSystemPrompt(platform, length)

  try {
    const coreMessages = await convertToModelMessages(messages)

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
