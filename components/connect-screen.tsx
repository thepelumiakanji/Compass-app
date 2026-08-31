'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Activity,
  ArrowRight,
  Aperture,
  Check,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

const STEPS = [
  'Convert your Instagram to a Business or Creator account and link it to a Facebook Page.',
  'In Meta for Developers, create an app and add the Instagram Graph API product.',
  'Generate a long-lived User access token with the instagram_basic, instagram_manage_insights, pages_show_list and pages_read_engagement permissions.',
  'Paste the token below — it is stored securely and never leaves your session.',
]

const FEATURES = [
  { icon: Activity, label: 'Real engagement, reach & audience analytics' },
  { icon: Sparkles, label: 'AI scripts, captions & content ideas' },
  { icon: ShieldCheck, label: 'Guideline & algorithm alignment checks' },
]

export function ConnectScreen() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)

  async function connect() {
    if (!token.trim()) {
      toast.error('Paste your access token first.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/instagram/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not connect.')
      toast.success(`Connected as @${data.username}`)
      router.refresh()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]"
      />
      <div className="relative grid w-full max-w-5xl gap-8 lg:grid-cols-2">
        {/* Left: brand + value */}
        <div className="flex flex-col justify-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Aperture className="size-6" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-none">
                IG App
              </p>
              <p className="text-sm text-muted-foreground">
                Creator analytics + AI studio
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-balance font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Turn your Instagram data into{' '}
              <span className="text-primary">content that performs.</span>
            </h1>
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
              Connect your account to see what actually works, then let AI write
              and optimize scripts, captions, and ideas built to move your reach
              forward.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-primary">
                  <f.icon className="size-4" />
                </span>
                <span className="text-sm text-foreground/90">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: connect card */}
        <Card className="flex flex-col gap-6 border-border/60 bg-card/80 p-6 backdrop-blur md:p-8">
          <div className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">
              Connect Instagram
            </h2>
          </div>

          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="leading-relaxed text-muted-foreground">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          <div className="space-y-3">
            <label
              htmlFor="ig-token"
              className="text-sm font-medium text-foreground"
            >
              Long-lived access token
            </label>
            <Input
              id="ig-token"
              type="password"
              placeholder="IGAA... or EAAB..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  !e.nativeEvent.isComposing &&
                  e.keyCode !== 229
                )
                  connect()
              }}
              className="font-mono text-sm"
            />
            <Button
              onClick={connect}
              disabled={loading}
              className="w-full gap-2"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Verifying…
                </>
              ) : (
                <>
                  Connect account <ArrowRight className="size-4" />
                </>
              )}
            </Button>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="size-3.5 text-primary" />
              Stored in a secure, http-only session cookie. Never shared.
            </p>
          </div>
        </Card>
      </div>
    </main>
  )
}
