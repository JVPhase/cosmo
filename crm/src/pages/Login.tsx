import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { clearTokens, fetchMe, login } from '@/lib/api'

function toFriendlyError(err: unknown) {
  const raw = err instanceof Error ? err.message : 'Failed to authenticate'
  try {
    const parsed = JSON.parse(raw) as { error?: string }
    switch (parsed.error) {
      case 'crm_access_required':
        return 'Your account has not been provisioned for CRM access yet.'
      case 'invalid credentials':
        return 'Invalid email or password.'
      default:
        return parsed.error ?? raw
    }
  } catch {
    return raw
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      await fetchMe()
      navigate('/')
    } catch (err) {
      clearTokens()
      setError(toFriendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
        <Card className="glass-card w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Cosmo CRM</CardTitle>
            <CardDescription>
              Sign in with your provisioned CRM admin or staff account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
