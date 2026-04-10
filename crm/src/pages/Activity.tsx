import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiFetch } from '@/lib/api'
import { formatDate } from '@/lib/format'

type Activity = {
  id: string
  title: string
  type: string
  notes: string | null
  createdAt: string
}

export default function ActivityPage() {
  const [items, setItems] = useState<Activity[]>([])
  const [title, setTitle] = useState('')
  const [type, setType] = useState('Note')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    apiFetch<Activity[]>('/crm/activities').then(setItems)
  }, [])

  async function addActivity(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      title,
      type,
      notes: notes || undefined
    }
    const created = await apiFetch<Activity>('/crm/activities', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    setItems((prev) => [created, ...prev])
    setTitle('')
    setType('Note')
    setNotes('')
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Log touches, calls, and follow-ups.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-3" onSubmit={addActivity}>
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Input placeholder="Type" value={type} onChange={(e) => setType(e.target.value)} />
            <Input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="md:col-span-3">
              <Button type="submit">Add activity</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.notes ?? '—'}</TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                </TableRow>
              ))}
              {!items.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-crm-ink/50">
                    No activity yet.
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
