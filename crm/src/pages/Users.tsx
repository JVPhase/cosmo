import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiFetch } from '@/lib/api'

type CrmUser = {
  userId: string
  email: string | null
  role: 'admin' | 'member' | 'viewer'
  createdAt: string
}

function toFriendlyError(err: unknown) {
  const raw = err instanceof Error ? err.message : 'Request failed'
  try {
    const parsed = JSON.parse(raw) as { error?: string }
    switch (parsed.error) {
      case 'admin_only':
        return 'Only CRM admins can manage users.'
      case 'invalid email format':
        return 'Enter a valid email address.'
      case 'password must be at least 8 characters':
        return 'Password must be at least 8 characters.'
      case 'email already registered':
        return 'This email is already registered.'
      default:
        return parsed.error ?? raw
    }
  } catch {
    return raw
  }
}

function roleBadgeVariant(role: CrmUser['role']) {
  if (role === 'admin') return 'warm'
  if (role === 'viewer') return 'cool'
  return 'default'
}

export default function UsersPage() {
  const [items, setItems] = useState<CrmUser[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<CrmUser['role']>('member')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [forbidden, setForbidden] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ items: CrmUser[] }>('/crm/users')
      setItems(res.items)
      setForbidden(false)
    } catch (err) {
      const message = toFriendlyError(err)
      setForbidden(message === 'Only CRM admins can manage users.')
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const created = await apiFetch<CrmUser>('/crm/users', {
        method: 'POST',
        body: JSON.stringify({ email, password, role })
      })
      setItems((prev) => {
        const next = [created, ...prev]
        next.sort((a, b) => {
          if (a.role === b.role) return a.email?.localeCompare(b.email ?? '') ?? 0
          return a.role.localeCompare(b.role)
        })
        return next
      })
      setEmail('')
      setPassword('')
      setRole('member')
    } catch (err) {
      setError(toFriendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (forbidden) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Team provisioning is restricted to CRM admins.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-crm-ink/70">
            Ask an existing admin to create your account or upgrade your CRM role.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Create CRM staff accounts and assign access roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={createUser}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <select
              className="h-10 rounded-md border border-crm-ink/15 bg-white px-3 text-sm text-crm-ink shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crm-accent"
              value={role}
              onChange={(e) => setRole(e.target.value as CrmUser['role'])}
            >
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create user'}
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Team directory</CardTitle>
          <CardDescription>Provisioned CRM accounts and their current roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.userId}>
                  <TableCell className="font-medium">{item.email ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant(item.role)}>{item.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(item.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                    })}
                  </TableCell>
                </TableRow>
              ))}
              {!items.length && !loading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-crm-ink/50">
                    No CRM users provisioned yet.
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-crm-ink/50">
                    Loading users...
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
