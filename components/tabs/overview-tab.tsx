'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Clock,
  Heart,
  MessageCircle,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { IgData } from '@/lib/instagram'
import { deriveStats, formatNumber, formatPercent } from '@/lib/analytics'

export function OverviewTab({ data }: { data: IgData }) {
  const stats = useMemo(() => deriveStats(data), [data])

  const cards = [
    {
      label: 'Followers',
      value: formatNumber(data.profile.followersCount),
      icon: Users,
      sub: `${formatNumber(data.profile.mediaCount)} total posts`,
    },
    {
      label: 'Avg. engagement / post',
      value: formatNumber(Math.round(stats.avgEngagement)),
      icon: Zap,
      sub: `${formatPercent(stats.avgEngagementRate, 2)} engagement rate`,
    },
    {
      label: 'Total likes',
      value: formatNumber(stats.totalLikes),
      icon: Heart,
      sub: `across ${stats.postsAnalyzed} recent posts`,
    },
    {
      label: 'Total comments',
      value: formatNumber(stats.totalComments),
      icon: MessageCircle,
      sub: `across ${stats.postsAnalyzed} recent posts`,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <c.icon className="size-4 text-primary" />
            </div>
            <p className="mt-3 font-display text-3xl font-bold tracking-tight">
              {c.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
          </Card>
        ))}
      </div>

      {/* Engagement trend chart */}
      <Card className="p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Engagement over time
            </h2>
            <p className="text-sm text-muted-foreground">
              Likes + comments across your {stats.postsAnalyzed} most recent posts
            </p>
          </div>
          <Badge
            variant="secondary"
            className={`gap-1 ${
              stats.trend >= 0 ? 'text-primary' : 'text-destructive'
            }`}
          >
            {stats.trend >= 0 ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            {stats.trend >= 0 ? '+' : ''}
            {stats.trend.toFixed(0)}% trend
          </Badge>
        </div>

        <ChartContainer
          config={{
            engagement: { label: 'Engagement', color: 'var(--chart-1)' },
          }}
          className="mt-6 h-[280px] w-full"
        >
          <AreaChart data={stats.timeSeries} margin={{ left: -12, right: 8 }}>
            <defs>
              <linearGradient id="fillEng" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-engagement)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-engagement)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              fontSize={12}
              tickFormatter={(v) => formatNumber(v)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="engagement"
              stroke="var(--color-engagement)"
              strokeWidth={2}
              fill="url(#fillEng)"
            />
          </AreaChart>
        </ChartContainer>
      </Card>

      {/* Insights row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4" />
            <p className="text-sm">Best time to post</p>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">
            {stats.bestHour
              ? `${stats.bestHour.hour.toString().padStart(2, '0')}:00`
              : '—'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Highest average engagement window
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="size-4" />
            <p className="text-sm">Top format</p>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">
            {stats.formatBreakdown[0]?.format ?? '—'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.formatBreakdown[0]
              ? `${formatNumber(stats.formatBreakdown[0].avgEngagement)} avg engagement`
              : 'No data yet'}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="size-4" />
            <p className="text-sm">Reels share</p>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">
            {formatPercent(stats.reelShare, 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            of your recent content
          </p>
        </Card>
      </div>
    </div>
  )
}
