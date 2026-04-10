import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiFetch } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/format'

type Deal = {
  id: string
  name: string
  stage: string
  value: number | null
  closeDate: string | null
  accountId: string | null
}

export default function DealsPage() {
  const [items, setItems] = useState<Deal[]>([])
  const [name, setName] = useState('')
  const [stage, setStage] = useState('Qualified')
  const [value, setValue] = useState('')
  const [closeDate, setCloseDate] = useState('')
  const [accountId, setAccountId] = useState('')

  useEffect(() => {
    apiFetch<Deal[]>('/crm/deals').then(setItems)
  }, [])

  async function addDeal(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      name,
      stage,
      value: value ? Number(value) : undefined,
      closeDate: closeDate || undefined,
      accountId: accountId || undefined
    }
    const created = await apiFetch<Deal>('/crm/deals', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    setItems((prev) => [created, ...prev])
    setName('')
    setStage('Qualified')
    setValue('')
    setCloseDate('')
    setAccountId('')
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Deals</CardTitle>
          <CardDescription>Track pipeline progress.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-3" onSubmit={addDeal}>
            <Input placeholder="Deal name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input placeholder="Stage" value={stage} onChange={(e) => setStage(e.target.value)} />
            <Input placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} />
            <Input placeholder="Close date (YYYY-MM-DD)" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
            <Input placeholder="Account ID" value={accountId} onChange={(e) => setAccountId(e.target.value)} />
            <div className="md:col-span-3">
              <Button type="submit">Add deal</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Deal list</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Close date</TableHead>
                <TableHead>Account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.stage}</TableCell>
                  <TableCell>{formatCurrency(item.value)}</TableCell>
                  <TableCell>{formatDate(item.closeDate)}</TableCell>
                  <TableCell>{item.accountId ?? '—'}</TableCell>
                </TableRow>
              ))}
              {!items.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-crm-ink/50">
                    No deals yet.
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
