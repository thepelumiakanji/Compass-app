'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import {
  ArrowUpDown,
  ExternalLink,
  Heart,
  MessageCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { IgData, IgMedia } from '@/lib/instagram'
import {
  engagementRate,
  formatNumber,
  formatPercent,
  mediaEngagement,
  shortLabel,
} from '@/lib/analytics'

type SortKey = 'recent' | 'engagement' | 'likes' | 'comments'

const FORMAT_STYLES: Record<string, string> = {
  Reel: 'bg-chart-1/15 text-chart-1',
  Carousel: 'bg-chart-3/15 text-chart-3',
  Video: 'bg-chart-2/15 text-chart-2',
  Photo: 'bg-muted text-muted-foreground',
}

export function PostsTab({ data }: { data: IgData }) {
  const [sort, setSort] = useState<SortKey>('engagement')
  const followers = data.profile.followersCount

  const posts = useMemo(() => {
    const arr = [...data.media]
    switch (sort) {
      case 'recent':
        return arr.sort(
          (a, b) => +new Date(b.timestamp) - +new Date(a.timestamp),
        )
      case 'likes':
        return arr.sort((a, b) => b.likeCount - a.likeCount)
      case 'comments':
        return arr.sort((a, b) => b.commentsCount - a.commentsCount)
      default:
        return arr.sort((a, b) => mediaEngagement(b) - mediaEngagement(a))
    }
  }, [data.media, sort])

  if (!posts.length) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        No posts found on this account yet.
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {posts.length} recent posts ranked by performance
        </p>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[180px] gap-2">
            <ArrowUpDown className="size-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="engagement">Top engagement</SelectItem>
            <SelectItem value="likes">Most likes</SelectItem>
            <SelectItem value="comments">Most comments</SelectItem>
            <SelectItem value="recent">Most recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {posts.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            rank={sort === 'engagement' ? i + 1 : undefined}
            followers={followers}
          />
        ))}
      </div>
    </div>
  )
}

function PostCard({
  post,
  rank,
  followers,
}: {
  post: IgMedia
  rank?: number
  followers: number
}) {
  const format = shortLabel(post.mediaType, post.mediaProductType)
  const thumb = post.thumbnailUrl || post.mediaUrl
  const date = new Date(post.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Card className="group flex flex-col overflow-hidden p-0">
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {thumb ? (
          <Image
            src={thumb || '/placeholder.svg'}
            alt={post.caption ? post.caption.slice(0, 60) : 'Instagram post'}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No preview
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2.5">
          <Badge className={`border-0 ${FORMAT_STYLES[format] ?? ''}`}>
            {format}
          </Badge>
          {rank && rank <= 3 && (
            <Badge className="border-0 bg-primary text-primary-foreground">
              #{rank}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-foreground/90">
          {post.caption || (
            <span className="text-muted-foreground">No caption</span>
          )}
        </p>
        <div className="mt-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Heart className="size-4 text-chart-1" />
              {formatNumber(post.likeCount)}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MessageCircle className="size-4 text-chart-3" />
              {formatNumber(post.commentsCount)}
            </span>
          </div>
          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-primary"
              aria-label="Open on Instagram"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span>{date}</span>
          <span className="font-medium text-foreground">
            {formatPercent(engagementRate(post, followers), 2)} eng. rate
          </span>
        </div>
      </div>
    </Card>
  )
}
