import type { IgData, IgMedia } from './instagram'

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0'
  if (Math.abs(n) >= 1_000_000)
    return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M'
  if (Math.abs(n) >= 1_000)
    return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'K'
  return n.toLocaleString('en-US')
}

export function formatPercent(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`
}

export function mediaEngagement(m: IgMedia): number {
  return m.likeCount + m.commentsCount
}

export function engagementRate(m: IgMedia, followers: number): number {
  if (!followers) return 0
  return (mediaEngagement(m) / followers) * 100
}

export function shortLabel(type: string, productType?: string): string {
  if (productType === 'REELS') return 'Reel'
  if (type === 'VIDEO') return 'Video'
  if (type === 'CAROUSEL_ALBUM') return 'Carousel'
  return 'Photo'
}

export type DerivedStats = {
  totalLikes: number
  totalComments: number
  totalEngagement: number
  avgEngagement: number
  avgEngagementRate: number
  bestPost: IgMedia | null
  worstPost: IgMedia | null
  postsAnalyzed: number
  reelShare: number
  timeSeries: { date: string; label: string; likes: number; comments: number; engagement: number }[]
  formatBreakdown: { format: string; count: number; avgEngagement: number }[]
  bestHour: { hour: number; avgEngagement: number } | null
  trend: number
}

export function deriveStats(data: IgData): DerivedStats {
  const media = [...data.media].sort(
    (a, b) => +new Date(a.timestamp) - +new Date(b.timestamp),
  )
  const followers = data.profile.followersCount
  const totalLikes = media.reduce((s, m) => s + m.likeCount, 0)
  const totalComments = media.reduce((s, m) => s + m.commentsCount, 0)
  const totalEngagement = totalLikes + totalComments
  const postsAnalyzed = media.length
  const avgEngagement = postsAnalyzed ? totalEngagement / postsAnalyzed : 0
  const avgEngagementRate = postsAnalyzed
    ? media.reduce((s, m) => s + engagementRate(m, followers), 0) / postsAnalyzed
    : 0

  const sortedByEng = [...media].sort(
    (a, b) => mediaEngagement(b) - mediaEngagement(a),
  )
  const bestPost = sortedByEng[0] ?? null
  const worstPost = sortedByEng[sortedByEng.length - 1] ?? null

  const reels = media.filter((m) => m.mediaProductType === 'REELS').length
  const reelShare = postsAnalyzed ? (reels / postsAnalyzed) * 100 : 0

  const timeSeries = media.map((m) => {
    const d = new Date(m.timestamp)
    return {
      date: m.timestamp,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      likes: m.likeCount,
      comments: m.commentsCount,
      engagement: mediaEngagement(m),
    }
  })

  // format breakdown
  const formatMap = new Map<string, { count: number; eng: number }>()
  for (const m of media) {
    const f = shortLabel(m.mediaType, m.mediaProductType)
    const cur = formatMap.get(f) ?? { count: 0, eng: 0 }
    cur.count += 1
    cur.eng += mediaEngagement(m)
    formatMap.set(f, cur)
  }
  const formatBreakdown = [...formatMap.entries()]
    .map(([format, v]) => ({
      format,
      count: v.count,
      avgEngagement: v.count ? Math.round(v.eng / v.count) : 0,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)

  // best posting hour
  const hourMap = new Map<number, { count: number; eng: number }>()
  for (const m of media) {
    const h = new Date(m.timestamp).getHours()
    const cur = hourMap.get(h) ?? { count: 0, eng: 0 }
    cur.count += 1
    cur.eng += mediaEngagement(m)
    hourMap.set(h, cur)
  }
  let bestHour: { hour: number; avgEngagement: number } | null = null
  for (const [hour, v] of hourMap.entries()) {
    const avg = v.eng / v.count
    if (!bestHour || avg > bestHour.avgEngagement)
      bestHour = { hour, avgEngagement: Math.round(avg) }
  }

  // trend: compare recent half vs older half of engagement
  let trend = 0
  if (timeSeries.length >= 4) {
    const mid = Math.floor(timeSeries.length / 2)
    const older = timeSeries.slice(0, mid)
    const recent = timeSeries.slice(mid)
    const olderAvg =
      older.reduce((s, x) => s + x.engagement, 0) / (older.length || 1)
    const recentAvg =
      recent.reduce((s, x) => s + x.engagement, 0) / (recent.length || 1)
    trend = olderAvg ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0
  }

  return {
    totalLikes,
    totalComments,
    totalEngagement,
    avgEngagement,
    avgEngagementRate,
    bestPost,
    worstPost,
    postsAnalyzed,
    reelShare,
    timeSeries,
    formatBreakdown,
    bestHour,
    trend,
  }
}

export function summarizeForAI(data: IgData): string {
  const s = deriveStats(data)
  const p = data.profile
  const topPosts = [...data.media]
    .sort((a, b) => mediaEngagement(b) - mediaEngagement(a))
    .slice(0, 5)
    .map(
      (m, i) =>
        `${i + 1}. [${shortLabel(m.mediaType, m.mediaProductType)}] ${m.likeCount} likes, ${m.commentsCount} comments — "${(m.caption || '(no caption)').slice(0, 120)}"`,
    )
    .join('\n')
  const bottomPosts = [...data.media]
    .sort((a, b) => mediaEngagement(a) - mediaEngagement(b))
    .slice(0, 3)
    .map(
      (m, i) =>
        `${i + 1}. [${shortLabel(m.mediaType, m.mediaProductType)}] ${m.likeCount} likes, ${m.commentsCount} comments — "${(m.caption || '(no caption)').slice(0, 120)}"`,
    )
    .join('\n')

  return `Account: @${p.username} (${p.name ?? ''})
Followers: ${p.followersCount} | Following: ${p.followsCount} | Total posts: ${p.mediaCount}
Posts analyzed (recent): ${s.postsAnalyzed}
Average engagement per post: ${Math.round(s.avgEngagement)} (${s.avgEngagementRate.toFixed(2)}% engagement rate)
Reels share of recent posts: ${s.reelShare.toFixed(0)}%
Engagement trend (recent vs older): ${s.trend >= 0 ? '+' : ''}${s.trend.toFixed(0)}%
Best format by avg engagement: ${s.formatBreakdown[0]?.format ?? 'n/a'}
Best posting hour: ${s.bestHour ? `${s.bestHour.hour}:00` : 'n/a'}

TOP PERFORMING POSTS:
${topPosts || 'none'}

LOWEST PERFORMING POSTS:
${bottomPosts || 'none'}`
}
