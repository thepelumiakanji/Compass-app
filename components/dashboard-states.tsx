'use client'

import { AlertTriangle, RefreshCw, Unplug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-3 h-3 w-20" />
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-6 h-64 w-full" />
      </Card>
    </div>
  )
}

export function DashboardError({
  message,
  status,
  onRetry,
  onReconnect,
}: {
  message: string
  status?: number
  onRetry: () => void
  onReconnect: () => void
}) {
  const isAuth = status === 401
  return (
    <Card className="mx-auto flex max-w-lg flex-col items-center gap-4 p-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <div className="space-y-1.5">
        <h2 className="font-display text-lg font-semibold">
          {isAuth ? 'Session expired' : 'Could not load your data'}
        </h2>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onRetry} className="gap-2">
          <RefreshCw className="size-4" /> Try again
        </Button>
        <Button variant="outline" onClick={onReconnect} className="gap-2">
          <Unplug className="size-4" /> Reconnect
        </Button>
      </div>
    </Card>
  )
}
