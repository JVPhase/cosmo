import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiFetch } from '@/lib/api'
import { formatCurrency } from '@/lib/format'

type Account = {
  id: string
  name: string
  industry: string | null
  region: string | null
  status: string
  health: string
  arr: number | null
}

export default function AccountsPage() {
  const [items, setItems] = useState<Account[]>([])
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [region, setRegion] = useState('')
  const [arr, setArr] = useState('')

  useEffect(() => {
    apiFetch<Account[]>('/crm/accounts').then(setItems)
  }, [])

  async function addAccount(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      name,
      industry: industry || undefined,
      region: region || undefined,
      arr: arr ? Number(arr) : undefined
    }
    const created = await apiFetch<Account>('/crm/accounts', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    setItems((prev) => [created, ...prev])
    setName('')
    setIndustry('')
    setRegion('')
    setArr('')
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>Track strategic customers and health.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={addAccount}>
            <Input placeholder="Account name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input placeholder="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            <Input placeholder="Region" value={region} onChange={(e) => setRegion(e.target.value)} />
            <Input placeholder="ARR" value={arr} onChange={(e) => setArr(e.target.value)} />
            <div className="md:col-span-4">
              <Button type="submit">Add account</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Account list</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>ARR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.industry ?? '—'}</TableCell>
                  <TableCell>{item.region ?? '—'}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>{item.health}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.arr)}</TableCell>
                </TableRow>
              ))}
              {!items.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-crm-ink/50">
                    No accounts yet.
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
