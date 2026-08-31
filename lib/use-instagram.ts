'use client'

import useSWR from 'swr'
import type { IgData } from './instagram'

async function fetcher(url: string): Promise<IgData> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error ?? 'Failed to load Instagram data.')
    ;(err as any).status = res.status
    throw err
  }
  return res.json()
}

export function useInstagram() {
  const { data, error, isLoading, mutate } = useSWR<IgData>(
    '/api/instagram/data',
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  return { data, error, isLoading, mutate }
}
