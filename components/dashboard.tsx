'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Aperture,
  BarChart3,
  LayoutGrid,
  LogOut,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { useInstagram } from '@/lib/use-instagram'
import { OverviewTab } from '@/components/tabs/overview-tab'
import { PostsTab } from '@/components/tabs/posts-tab'
import { AudienceTab } from '@/components/tabs/audience-tab'
import { StudioTab } from '@/components/tabs/studio-tab'
import { DashboardError, DashboardSkeleton } from '@/components/dashboard-states'

type TabKey = 'overview' | 'posts' | 'audience' | 'studio'

const NAV: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'posts', label: 'Posts & Reels', icon: LayoutGrid },
  { key: 'audience', label: 'Audience', icon: Users },
  { key: 'studio', label: 'Content Studio', icon: Sparkles },
]

export function Dashboard() {
  const router = useRouter()
  const { data, error, isLoading, mutate } = useInstagram()
  const [tab, setTab] = useState<TabKey>('overview')

  async function disconnect() {
    await fetch('/api/instagram/connect', { method: 'DELETE' })
    toast.success('Disconnected')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Sidebar / topbar */}
      <aside className="flex shrink-0 flex-col gap-6 border-b border-border bg-sidebar p-4 lg:w-64 lg:border-b-0 lg:border-r lg:p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Aperture className="size-5" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-display text-base font-bold leading-none">
              IG App
            </p>
            <p className="text-xs text-muted-foreground">Creator Studio</p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {NAV.map((item) => {
            const active = tab === item.key
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto hidden flex-col gap-3 lg:flex">
          {data && <ProfileChip data={data} />}
          <Button
            variant="ghost"
            size="sm"
            onClick={disconnect}
            className="justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" /> Disconnect
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 md:px-8">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight md:text-2xl">
              {NAV.find((n) => n.key === tab)?.label}
            </h1>
            <p className="text-sm text-muted-foreground">
              {data ? `@${data.profile.username}` : 'Loading your account…'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                mutate()
                toast.message('Refreshing data…')
              }}
              className="gap-2"
            >
              <RefreshCw className="size-4" /> Refresh
            </Button>
            {data && (
              <Avatar className="size-9 border border-border lg:hidden">
                <AvatarImage src={data.profile.profilePictureUrl} />
                <AvatarFallback>
                  {data.profile.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </header>

        <div className="p-4 md:p-8">
          {isLoading && <DashboardSkeleton />}
          {error && (
            <DashboardError
              message={(error as Error).message}
              status={(error as any).status}
              onRetry={() => mutate()}
              onReconnect={disconnect}
            />
          )}
          {data && !isLoading && !error && (
            <>
              {tab === 'overview' && <OverviewTab data={data} />}
              {tab === 'posts' && <PostsTab data={data} />}
              {tab === 'audience' && <AudienceTab data={data} />}
              {tab === 'studio' && <StudioTab />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function ProfileChip({ data }: { data: ReturnType<typeof useInstagram>['data'] }) {
  if (!data) return null
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <Avatar className="size-9 border border-border">
        <AvatarImage src={data.profile.profilePictureUrl} />
        <AvatarFallback>
          {data.profile.username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">@{data.profile.username}</p>
        <p className="text-xs text-muted-foreground">
          {data.profile.followersCount.toLocaleString()} followers
        </p>
      </div>
    </div>
  )
}
