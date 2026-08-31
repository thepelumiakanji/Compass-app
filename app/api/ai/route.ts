import { generateText, Output } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchInstagramData, getAccessToken } from '@/lib/instagram'
import { summarizeForAI } from '@/lib/analytics'

export const maxDuration = 60

const MODEL = 'anthropic/claude-sonnet-4.5'

const NICHE =
  'public speaking, communication skills, personal development, and growth mindset'

const GUIDELINES = `Instagram content guidelines & algorithm best practices to align with:
- No hate speech, harassment, nudity/sexual content, graphic violence, or dangerous acts.
- No misinformation or unsubstantiated medical/financial claims. Avoid absolute promises ("guaranteed", "cure").
- Recommendation eligibility: avoid clickbait, engagement-bait ("comment YES"), watermarks from other apps (e.g. TikTok), and low-resolution or heavily bordered video.
- No sale of restricted/prohibited goods; disclose paid partnerships properly (#ad / paid partnership label).
- Music/audio must respect copyright; use in-app licensed audio for Reels.
- Algorithm favors: original content, Reels with strong 3-second hooks, watch-through and re-watches, saves and shares over likes, meaningful comments, consistent posting, and native features (captions, trending audio, collabs).
- Keep hashtags relevant (3-5 focused tags outperform 30 generic ones).`

async function getAnalyticsContext(): Promise<string | null> {
  const token = await getAccessToken()
  if (!token) return null
  try {
    const data = await fetchInstagramData(token)
    return summarizeForAI(data)
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const task: string = body.task
  const input: string = (body.input ?? '').toString().slice(0, 4000)

  try {
    switch (task) {
      case 'ideas':
        return await handleIdeas(input)
      case 'script':
        return await handleScript(input)
      case 'guideline':
        return await handleGuideline(input)
      case 'insights':
        return await handleInsights()
      default:
        return NextResponse.json({ error: 'Unknown task' }, { status: 400 })
    }
  } catch (e: any) {
    console.log('[v0] AI route error:', e?.message)
    return NextResponse.json(
      { error: e?.message ?? 'AI request failed.' },
      { status: 500 },
    )
  }
}

async function handleIdeas(input: string) {
  const analytics = await getAnalyticsContext()
  const { output } = await generateText({
    model: MODEL,
    output: Output.object({
      schema: z.object({
        ideas: z
          .array(
            z.object({
              title: z.string().describe('Short punchy hook / title'),
              format: z
                .enum(['Reel', 'Carousel', 'Photo', 'Story'])
                .describe('Recommended Instagram format'),
              hook: z.string().describe('First 3 seconds / opening line'),
              angle: z.string().describe('Why this resonates with the audience'),
              cta: z.string().describe('Call to action that drives saves/shares'),
            }),
          )
          .min(5)
          .max(6),
      }),
    }),
    prompt: `You are a content strategist for an Instagram creator in the niche of ${NICHE}.
Generate 6 fresh, specific content ideas.${
      input ? `\n\nThe creator specifically wants ideas about: "${input}"` : ''
    }${analytics ? `\n\nHere is their recent performance data — bias ideas toward what is working:\n${analytics}` : ''}

Prioritize Reels with strong hooks and formats that drive saves and shares. Make each idea concrete, not generic.`,
  })
  return NextResponse.json(output)
}

async function handleScript(input: string) {
  const analytics = await getAnalyticsContext()
  const { text } = await generateText({
    model: MODEL,
    prompt: `You are a scriptwriter for an Instagram creator in ${NICHE}.
Write a complete, ready-to-film Reel script for this idea/topic:
"${input || 'A high-value tip about confident public speaking'}"

Structure the script with clear labeled sections:
1. HOOK (0-3s) — a scroll-stopping opening line
2. BODY — the core value, broken into short spoken beats with on-screen text suggestions
3. CTA — an ending that encourages saves, shares, and follows
4. CAPTION — a ready-to-post caption
5. HASHTAGS — 4-5 focused, relevant hashtags

Keep it punchy, spoken-word friendly, and under ~60 seconds of speaking time.${
      analytics ? `\n\nMatch the tone that works for this account:\n${analytics}` : ''
    }
Return clean Markdown.`,
  })
  return NextResponse.json({ text })
}

async function handleGuideline(input: string) {
  if (!input.trim()) {
    return NextResponse.json(
      { error: 'Paste the script or caption you want checked.' },
      { status: 400 },
    )
  }
  const { output } = await generateText({
    model: MODEL,
    output: Output.object({
      schema: z.object({
        score: z
          .number()
          .describe('0-100 how well aligned & likely to be pushed by the algorithm'),
        verdict: z.enum(['Ready to post', 'Minor fixes', 'Needs work']),
        risks: z
          .array(
            z.object({
              severity: z.enum(['low', 'medium', 'high']),
              issue: z.string(),
              fix: z.string(),
            }),
          )
          .describe('Guideline/eligibility risks found, empty if none'),
        algorithmTips: z
          .array(z.string())
          .describe('Specific tweaks to increase reach/distribution'),
        revised: z
          .string()
          .describe('A cleaned-up, guideline-safe, algorithm-optimized rewrite'),
      }),
    }),
    prompt: `${GUIDELINES}

You are reviewing the following Instagram content (script or caption) for a creator in ${NICHE}. Check it against the guidelines above, flag anything that could limit reach or violate policy, and provide an optimized rewrite.

CONTENT TO REVIEW:
"""
${input}
"""`,
  })
  return NextResponse.json(output)
}

async function handleInsights() {
  const analytics = await getAnalyticsContext()
  if (!analytics) {
    return NextResponse.json(
      { error: 'Connect Instagram to generate performance insights.' },
      { status: 401 },
    )
  }
  const { output } = await generateText({
    model: MODEL,
    output: Output.object({
      schema: z.object({
        whatWorks: z
          .array(z.string())
          .describe('Concrete patterns that are working, tied to the data'),
        whatDoesnt: z
          .array(z.string())
          .describe('Patterns that are underperforming'),
        recommendations: z
          .array(
            z.object({
              action: z.string(),
              why: z.string(),
            }),
          )
          .describe('Prioritized, specific next actions'),
        summary: z.string().describe('A 1-2 sentence headline takeaway'),
      }),
    }),
    prompt: `You are an Instagram growth analyst for a creator in ${NICHE}.
Analyze this performance data and tell them clearly what works and what does not, with specific, actionable recommendations. Reference the actual numbers.

${analytics}`,
  })
  return NextResponse.json(output)
}
