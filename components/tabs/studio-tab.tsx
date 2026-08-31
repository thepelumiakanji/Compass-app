'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Copy,
  FileText,
  Lightbulb,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

type Idea = {
  title: string
  format: string
  hook: string
  angle: string
  cta: string
}

type GuidelineResult = {
  score: number
  verdict: string
  risks: { severity: string; issue: string; fix: string }[]
  algorithmTips: string[]
  revised: string
}

type InsightResult = {
  whatWorks: string[]
  whatDoesnt: string[]
  recommendations: { action: string; why: string }[]
  summary: string
}

async function callAI(task: string, input?: string) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, input }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'AI request failed.')
  return data
}

function copy(text: string) {
  navigator.clipboard.writeText(text)
  toast.success('Copied to clipboard')
}

export function StudioTab() {
  return (
    <Tabs defaultValue="ideas" className="w-full">
      <TabsList className="grid w-full max-w-2xl grid-cols-2 sm:grid-cols-4">
        <TabsTrigger value="ideas" className="gap-1.5">
          <Lightbulb className="size-4" />
          <span className="hidden sm:inline">Ideas</span>
        </TabsTrigger>
        <TabsTrigger value="script" className="gap-1.5">
          <FileText className="size-4" />
          <span className="hidden sm:inline">Scripts</span>
        </TabsTrigger>
        <TabsTrigger value="check" className="gap-1.5">
          <ShieldCheck className="size-4" />
          <span className="hidden sm:inline">Guidelines</span>
        </TabsTrigger>
        <TabsTrigger value="insights" className="gap-1.5">
          <TrendingUp className="size-4" />
          <span className="hidden sm:inline">Insights</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ideas" className="mt-6">
        <IdeasPanel />
      </TabsContent>
      <TabsContent value="script" className="mt-6">
        <ScriptPanel />
      </TabsContent>
      <TabsContent value="check" className="mt-6">
        <GuidelinePanel />
      </TabsContent>
      <TabsContent value="insights" className="mt-6">
        <InsightsPanel />
      </TabsContent>
    </Tabs>
  )
}

function PanelHeader({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Sparkles
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

const FORMAT_STYLES: Record<string, string> = {
  Reel: 'bg-chart-1/15 text-chart-1',
  Carousel: 'bg-chart-3/15 text-chart-3',
  Photo: 'bg-muted text-muted-foreground',
  Story: 'bg-chart-2/15 text-chart-2',
}

function IdeasPanel() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<Idea[]>([])

  async function run() {
    setLoading(true)
    try {
      const data = await callAI('ideas', topic)
      setIdeas(data.ideas ?? [])
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5 md:p-6">
        <PanelHeader
          icon={Lightbulb}
          title="Content ideas generator"
          desc="Fresh, data-informed ideas for public speaking & personal growth content."
        />
        <Textarea
          placeholder="Optional: focus the ideas on a theme, e.g. 'overcoming stage fright' or 'morning routines'…"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={2}
        />
        <Button onClick={run} disabled={loading} className="gap-2">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Generate ideas
        </Button>
      </Card>

      {ideas.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {ideas.map((idea, i) => (
            <Card key={i} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-base font-semibold leading-snug">
                  {idea.title}
                </h3>
                <Badge className={`border-0 ${FORMAT_STYLES[idea.format] ?? ''}`}>
                  {idea.format}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-primary">Hook: </span>
                  <span className="text-foreground/90">{idea.hook}</span>
                </p>
                <p className="text-muted-foreground">{idea.angle}</p>
                <p>
                  <span className="font-medium text-primary">CTA: </span>
                  <span className="text-foreground/90">{idea.cta}</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-auto w-fit gap-1.5 px-2 text-muted-foreground"
                onClick={() =>
                  copy(
                    `${idea.title}\nFormat: ${idea.format}\nHook: ${idea.hook}\nAngle: ${idea.angle}\nCTA: ${idea.cta}`,
                  )
                }
              >
                <Copy className="size-3.5" /> Copy
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function ScriptPanel() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [script, setScript] = useState('')

  async function run() {
    if (!topic.trim()) {
      toast.error('Enter a topic or idea first.')
      return
    }
    setLoading(true)
    try {
      const data = await callAI('script', topic)
      setScript(data.text ?? '')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5 md:p-6">
        <PanelHeader
          icon={FileText}
          title="Reel script writer"
          desc="Turn any idea into a ready-to-film script with hook, body, CTA and caption."
        />
        <Textarea
          placeholder="What's the Reel about? e.g. 'How to open a speech so people stop scrolling'"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={3}
        />
        <Button onClick={run} disabled={loading} className="gap-2">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileText className="size-4" />
          )}
          Write script
        </Button>
      </Card>

      {script && (
        <Card className="p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Your script</h3>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => copy(script)}
            >
              <Copy className="size-3.5" /> Copy
            </Button>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
            {script}
          </pre>
        </Card>
      )}
    </div>
  )
}

const SEVERITY_STYLES: Record<string, string> = {
  high: 'bg-destructive/15 text-destructive',
  medium: 'bg-chart-2/15 text-chart-2',
  low: 'bg-muted text-muted-foreground',
}

function GuidelinePanel() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GuidelineResult | null>(null)

  async function run() {
    if (!input.trim()) {
      toast.error('Paste a script or caption to check.')
      return
    }
    setLoading(true)
    try {
      const data = await callAI('guideline', input)
      setResult(data)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const scoreColor =
    result && result.score >= 80
      ? 'text-primary'
      : result && result.score >= 60
        ? 'text-chart-2'
        : 'text-destructive'

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5 md:p-6">
        <PanelHeader
          icon={ShieldCheck}
          title="Guideline & algorithm check"
          desc="Scan content for policy risks and get an optimized, reach-friendly rewrite."
        />
        <Textarea
          placeholder="Paste your script or caption here…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
        />
        <Button onClick={run} disabled={loading} className="gap-2">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}
          Check content
        </Button>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card className="p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Alignment score</p>
                <p className={`font-display text-4xl font-bold ${scoreColor}`}>
                  {result.score}
                  <span className="text-lg text-muted-foreground">/100</span>
                </p>
              </div>
              <Badge
                variant="secondary"
                className="text-sm"
              >
                {result.verdict}
              </Badge>
            </div>
            <Progress value={result.score} className="mt-4 h-2" />
          </Card>

          {result.risks.length > 0 && (
            <Card className="space-y-3 p-5 md:p-6">
              <h3 className="font-display text-base font-semibold">
                Flagged risks
              </h3>
              {result.risks.map((r, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border p-3 text-sm"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Badge className={`border-0 ${SEVERITY_STYLES[r.severity]}`}>
                      {r.severity}
                    </Badge>
                    <span className="font-medium">{r.issue}</span>
                  </div>
                  <p className="text-muted-foreground">{r.fix}</p>
                </div>
              ))}
            </Card>
          )}

          {result.algorithmTips.length > 0 && (
            <Card className="space-y-2 p-5 md:p-6">
              <h3 className="font-display text-base font-semibold">
                Algorithm boosts
              </h3>
              <ul className="space-y-2 text-sm">
                {result.algorithmTips.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <TrendingUp className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-foreground/90">{t}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-5 md:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">
                Optimized rewrite
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => copy(result.revised)}
              >
                <Copy className="size-3.5" /> Copy
              </Button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
              {result.revised}
            </pre>
          </Card>
        </div>
      )}
    </div>
  )
}

function InsightsPanel() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InsightResult | null>(null)

  async function run() {
    setLoading(true)
    try {
      const data = await callAI('insights')
      setResult(data)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5 md:p-6">
        <PanelHeader
          icon={TrendingUp}
          title="Performance insights"
          desc="Let AI read your analytics and tell you what works and what doesn't."
        />
        <Button onClick={run} disabled={loading} className="gap-2">
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Analyze my account
        </Button>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card className="border-primary/30 bg-primary/5 p-5 md:p-6">
            <p className="text-pretty font-display text-lg font-medium leading-relaxed">
              {result.summary}
            </p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="space-y-3 p-5">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold text-primary">
                <TrendingUp className="size-4" /> What works
              </h3>
              <ul className="space-y-2 text-sm">
                {result.whatWorks.map((w, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-foreground/90">{w}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="space-y-3 p-5">
              <h3 className="flex items-center gap-2 font-display text-base font-semibold text-muted-foreground">
                <TrendingUp className="size-4 rotate-180" /> What doesn&apos;t
              </h3>
              <ul className="space-y-2 text-sm">
                {result.whatDoesnt.map((w, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                    <span className="text-foreground/90">{w}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="space-y-3 p-5 md:p-6">
            <h3 className="font-display text-base font-semibold">
              Recommended next actions
            </h3>
            <div className="space-y-3">
              {result.recommendations.map((r, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-lg border border-border p-3"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div className="text-sm">
                    <p className="font-medium">{r.action}</p>
                    <p className="text-muted-foreground">{r.why}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
