import { useEffect, useState } from 'react'
import { ArrowUpRight, Bell, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiFetch } from '@/lib/api'
import { formatCurrency } from '@/lib/format'

type OverviewResponse = {
  counts: { leads: number; accounts: number; deals: number }
  pipeline: { stage: string; value: number; deals: number }[]
  recentActivities: {
    id: string
    title: string
    type: string
    createdAt: string
  }[]
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null)

  useEffect(() => {
    apiFetch<OverviewResponse>('/crm/overview').then(setData).catch(() => setData(null))
  }, [])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-crm-ink/10 bg-white/80 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-crm-ink/50">Friday, 10 April</p>
          <h1 className="font-display text-2xl font-semibold">Revenue control center</h1>
          <p className="text-sm text-crm-ink/60">Track live opportunities, renewals, and risk.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-crm-ink/50" />
            <Input className="pl-9" placeholder="Search accounts" />
          </div>
          <Button variant="outline" className="gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </Button>
          <Button className="gap-2">
            New deal
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Accounts', value: data?.counts.accounts ?? 0 },
          { label: 'Leads', value: data?.counts.leads ?? 0 },
          { label: 'Deals', value: data?.counts.deals ?? 0 },
          {
            label: 'Pipeline value',
            value: formatCurrency(data?.pipeline.reduce((sum, item) => sum + item.value, 0) ?? 0)
          }
        ].map((stat) => (
          <Card key={stat.label} className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-crm-ink/70">{stat.label}</CardTitle>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-semibold">{stat.value}</span>
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Pipeline flow</CardTitle>
            <CardDescription>Focus on mid-funnel conversions and renewals.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {data?.pipeline.map((stage) => (
                <div key={stage.stage} className="rounded-xl border border-crm-ink/10 bg-white/70 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{stage.stage}</p>
                    <Badge variant="cool">{formatCurrency(stage.value)}</Badge>
                  </div>
                  <Separator className="my-3" />
                  <p className="text-xs text-crm-ink/60">Deals: {stage.deals}</p>
                </div>
              ))}
              {!data?.pipeline.length && (
                <div className="rounded-xl border border-crm-ink/10 bg-white/70 p-4">
                  <p className="text-sm">No deals yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Live activity</CardTitle>
            <CardDescription>Recent updates from the team.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.recentActivities.map((item) => (
                <div key={item.id} className="rounded-lg border border-crm-ink/10 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{item.title}</p>
                    <Badge variant="warm">{item.type}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-crm-ink/60">
                    {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
              {!data?.recentActivities.length && <p className="text-sm text-crm-ink/60">No activity yet.</p>}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Quick insights</CardTitle>
            <CardDescription>Use this space for renewals and risks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Avg. deal size</TableCell>
                  <TableCell>{formatCurrency(data?.pipeline.length ? Math.round((data?.pipeline.reduce((sum, item) => sum + item.value, 0) ?? 0) / (data?.pipeline.reduce((sum, item) => sum + item.deals, 0) || 1)) : 0)}</TableCell>
                  <TableCell>Keep pricing discipline</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Renewals this month</TableCell>
                  <TableCell>{data?.counts.accounts ?? 0}</TableCell>
                  <TableCell>Top 10 accounts need QBR</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
