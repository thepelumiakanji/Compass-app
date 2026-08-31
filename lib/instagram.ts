import { cookies } from 'next/headers'

export const IG_COOKIE = 'ig_token'
const GRAPH = 'https://graph.facebook.com/v21.0'

export type IgProfile = {
  id: string
  username: string
  name?: string
  biography?: string
  profilePictureUrl?: string
  followersCount: number
  followsCount: number
  mediaCount: number
}

export type IgMedia = {
  id: string
  caption: string
  mediaType: string
  mediaProductType?: string
  mediaUrl?: string
  thumbnailUrl?: string
  permalink?: string
  timestamp: string
  likeCount: number
  commentsCount: number
}

export type IgAudienceBreakdown = { label: string; value: number }[]

export type IgAudience = {
  gender: IgAudienceBreakdown
  age: IgAudienceBreakdown
  countries: IgAudienceBreakdown
  cities: IgAudienceBreakdown
  available: boolean
  reason?: string
}

export type IgData = {
  profile: IgProfile
  media: IgMedia[]
  audience: IgAudience
}

/** Read the stored long-lived access token (cookie first, then env fallback). */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(IG_COOKIE)?.value
  if (fromCookie) return fromCookie
  return process.env.INSTAGRAM_ACCESS_TOKEN ?? null
}

class GraphError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function graphGet(
  path: string,
  params: Record<string, string>,
  token: string,
) {
  const url = new URL(`${GRAPH}/${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  url.searchParams.set('access_token', token)

  const res = await fetch(url.toString(), { cache: 'no-store' })
  const json = await res.json()
  if (!res.ok) {
    const msg =
      json?.error?.message ?? `Instagram API error (${res.status})`
    throw new GraphError(msg, res.status)
  }
  return json
}

/** Resolve the Instagram Business Account connected to the user's Facebook Pages. */
async function resolveIgUserId(token: string): Promise<string> {
  const data = await graphGet(
    'me/accounts',
    { fields: 'instagram_business_account,name', limit: '50' },
    token,
  )
  const page = (data.data ?? []).find(
    (p: any) => p.instagram_business_account?.id,
  )
  if (!page) {
    throw new GraphError(
      'No Instagram Business/Creator account was found on your connected Facebook Pages. Make sure your Instagram account is a Business or Creator account linked to a Facebook Page.',
      400,
    )
  }
  return page.instagram_business_account.id
}

async function getProfile(igId: string, token: string): Promise<IgProfile> {
  const p = await graphGet(
    igId,
    {
      fields:
        'id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count',
    },
    token,
  )
  return {
    id: p.id,
    username: p.username,
    name: p.name,
    biography: p.biography,
    profilePictureUrl: p.profile_picture_url,
    followersCount: p.followers_count ?? 0,
    followsCount: p.follows_count ?? 0,
    mediaCount: p.media_count ?? 0,
  }
}

async function getMedia(igId: string, token: string): Promise<IgMedia[]> {
  const m = await graphGet(
    `${igId}/media`,
    {
      fields:
        'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
      limit: '30',
    },
    token,
  )
  return (m.data ?? []).map((item: any) => ({
    id: item.id,
    caption: item.caption ?? '',
    mediaType: item.media_type ?? 'IMAGE',
    mediaProductType: item.media_product_type,
    mediaUrl: item.media_url,
    thumbnailUrl: item.thumbnail_url,
    permalink: item.permalink,
    timestamp: item.timestamp,
    likeCount: item.like_count ?? 0,
    commentsCount: item.comments_count ?? 0,
  }))
}

function parseBreakdown(results: any[]): {
  gender: IgAudienceBreakdown
  age: IgAudienceBreakdown
  countries: IgAudienceBreakdown
  cities: IgAudienceBreakdown
} {
  const out = {
    gender: [] as IgAudienceBreakdown,
    age: [] as IgAudienceBreakdown,
    countries: [] as IgAudienceBreakdown,
    cities: [] as IgAudienceBreakdown,
  }
  for (const r of results ?? []) {
    const dimension: string = r.dimension_keys?.[0] ?? ''
    const values: { value: number; dimension_values: string[] }[] =
      r.total_value?.breakdowns?.[0]?.results ?? []
    const mapped = values
      .map((v) => ({ label: v.dimension_values[0], value: v.value }))
      .sort((a, b) => b.value - a.value)
    if (dimension === 'gender') out.gender = mapped
    else if (dimension === 'age') out.age = mapped
    else if (dimension === 'country') out.countries = mapped.slice(0, 8)
    else if (dimension === 'city') out.cities = mapped.slice(0, 8)
  }
  return out
}

async function getAudience(igId: string, token: string): Promise<IgAudience> {
  const empty = { gender: [], age: [], countries: [], cities: [] }
  try {
    const [demo, geo] = await Promise.all([
      graphGet(
        `${igId}/insights`,
        {
          metric: 'follower_demographics',
          period: 'lifetime',
          metric_type: 'total_value',
          breakdown: 'age,gender',
          timeframe: 'this_month',
        },
        token,
      ).catch(() => ({ data: [] })),
      graphGet(
        `${igId}/insights`,
        {
          metric: 'follower_demographics',
          period: 'lifetime',
          metric_type: 'total_value',
          breakdown: 'country,city',
          timeframe: 'this_month',
        },
        token,
      ).catch(() => ({ data: [] })),
    ])
    const a = parseBreakdown(demo.data)
    const b = parseBreakdown(geo.data)
    const merged = {
      gender: a.gender,
      age: a.age,
      countries: b.countries,
      cities: b.cities,
    }
    const available =
      merged.gender.length + merged.age.length + merged.countries.length > 0
    return {
      ...merged,
      available,
      reason: available
        ? undefined
        : 'Audience demographics require at least 100 followers and are only returned by Instagram once enough data is available.',
    }
  } catch (e: any) {
    return { ...empty, available: false, reason: e?.message }
  }
}

export async function fetchInstagramData(token: string): Promise<IgData> {
  const igId = await resolveIgUserId(token)
  const [profile, media, audience] = await Promise.all([
    getProfile(igId, token),
    getMedia(igId, token),
    getAudience(igId, token),
  ])
  return { profile, media, audience }
}

/** Validate a token by attempting to resolve the connected IG account. */
export async function validateToken(
  token: string,
): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  try {
    const igId = await resolveIgUserId(token)
    const profile = await getProfile(igId, token)
    return { ok: true, username: profile.username }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Invalid access token.' }
  }
}
