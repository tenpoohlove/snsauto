import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { prompt } = await req.json()
  if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 })

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: `SNS投稿用の魅力的な画像を生成してください。${prompt}。プロフェッショナルで洗練されたデザイン、日本のSNS向け。文字やテキストは含めない。`,
    config: { responseModalities: ['IMAGE', 'TEXT'] },
  })

  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { mimeType?: string; data?: string } }) => p.inlineData?.mimeType?.startsWith('image/')
  )

  if (!imagePart?.inlineData?.data) {
    return NextResponse.json({ error: '画像生成に失敗しました' }, { status: 500 })
  }

  // base64 → Vercel Blobに保存
  const buffer = Buffer.from(imagePart.inlineData.data, 'base64')
  const filename = `posts/${userId}/${Date.now()}.png`
  const blob = await put(filename, buffer, { access: 'public', contentType: 'image/png' })

  return NextResponse.json({ url: blob.url })
}
