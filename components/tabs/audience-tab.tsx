'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Info, MapPin, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { IgAudienceBreakdown, IgData } from '@/lib/instagram'
import { formatNumber } from '@/lib/analytics'

const GENDER_LABELS: Record<string, string> = {
  M: 'Men',
  F: 'Women',
  U: 'Unknown',
}

export function AudienceTab({ data }: { data: IgData }) {
  const { audience } = data

  if (!audience.available) {
    return (
      <Card className="mx-auto flex max-w-lg flex-col items-center gap-3 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
          <Users className="size-6" />
        </span>
        <h2 className="font-display text-lg font-semibold">
          Audience data not available yet
        </h2>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          {audience.reason ??
            'Instagram only returns follower demographics once your account has at least 100 followers.'}
        </p>
      </Card>
    )
  }

  const genderTotal = audience.gender.reduce((s, g) => s + g.value, 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gender split */}
        <Card className="p-5 md:p-6">
          <h2 className="font-display text-lg font-semibold">Gender split</h2>
          <p className="text-sm text-muted-foreground">
            How your followers identify
          </p>
          <div className="mt-6 space-y-4">
            {audience.gender.map((g, i) => {
              const pct = genderTotal ? (g.value / genderTotal) * 100 : 0
              return (
                <div key={g.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {GENDER_LABELS[g.label] ?? g.label}
                    </span>
                    <span className="text-muted-foreground">
                      {pct.toFixed(0)}% · {formatNumber(g.value)}
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    className="h-2"
                    style={
                      {
                        // vary the indicator color per row via CSS var override
                        ['--tw-progress' as string]: '',
                      } as React.CSSProperties
                    }
                  />
                </div>
              )
            })}
          </div>
        </Card>

        {/* Age distribution */}
        <Card className="p-5 md:p-6">
          <h2 className="font-display text-lg font-semibold">Age range</h2>
          <p className="text-sm text-muted-foreground">
            Follower distribution by age
          </p>
          <AgeChart data={audience.age} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GeoCard
          title="Top countries"
          icon={<MapPin className="size-4" />}
          items={audience.countries}
        />
        <GeoCard
          title="Top cities"
          icon={<MapPin className="size-4" />}
          items={audience.cities}
        />
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="size-3.5" />
        Demographics are estimated by Instagram and refreshed monthly.
      </p>
    </div>
  )
}

function AgeChart({ data }: { data: IgAudienceBreakdown }) {
  const sorted = [...data].sort((a, b) => a.label.localeCompare(b.label))
  return (
    <ChartContainer
      config={{ value: { label: 'Followers', color: 'var(--chart-1)' } }}
      className="mt-4 h-[220px] w-full"
    >
      <BarChart data={sorted} margin={{ left: -12, right: 8 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
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
        <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

function GeoCard({
  title,
  icon,
  items,
}: {
  title: string
  icon: React.ReactNode
  items: IgAudienceBreakdown
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <Card className="p-5 md:p-6">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Not enough data.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((item) => (
            <li key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">
                  {formatNumber(item.value)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
