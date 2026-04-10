import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiFetch } from '@/lib/api'

type Lead = {
  id: string
  name: string
  email: string | null
  company: string | null
  source: string | null
  status: string
  score: number | null
}

export default function LeadsPage() {
  const [items, setItems] = useState<Lead[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [source, setSource] = useState('')
  const [score, setScore] = useState('')

  useEffect(() => {
    apiFetch<Lead[]>('/crm/leads').then(setItems)
  }, [])

  async function addLead(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      name,
      email: email || undefined,
      company: company || undefined,
      source: source || undefined,
      score: score ? Number(score) : undefined
    }
    const created = await apiFetch<Lead>('/crm/leads', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    setItems((prev) => [created, ...prev])
    setName('')
    setEmail('')
    setCompany('')
    setSource('')
    setScore('')
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>Capture inbound and outbound interest.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-3" onSubmit={addLead}>
            <Input placeholder="Lead name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
            <Input placeholder="Source" value={source} onChange={(e) => setSource(e.target.value)} />
            <Input placeholder="Score" value={score} onChange={(e) => setScore(e.target.value)} />
            <div className="md:col-span-3">
              <Button type="submit">Add lead</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Lead list</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.email ?? '—'}</TableCell>
                  <TableCell>{item.company ?? '—'}</TableCell>
                  <TableCell>{item.source ?? '—'}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>{item.score ?? '—'}</TableCell>
                </TableRow>
              ))}
              {!items.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-crm-ink/50">
                    No leads yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
