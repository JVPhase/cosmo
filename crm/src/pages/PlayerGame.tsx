import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { API_URL, apiFetch, getAccessToken } from '@/lib/api'

type SearchUser = {
  id: string
  email: string | null
  createdAt: string
  telegramUser: { username: string | null; telegramId: string } | null
}

type GameStateResponse = {
  user: SearchUser
  userSave: { data: unknown; rev: number; updatedAt: string } | null
  gameplaySave: { data: unknown; rev: number; updatedAt: string } | null
  wallet: { credits: string; updatedAt: string } | null
}

function authHeaders(): HeadersInit {
  return { Authorization: `Bearer ${getAccessToken() ?? ''}`, 'Content-Type': 'application/json' }
}

export default function PlayerGamePage() {
  const { userId: userIdParam } = useParams<{ userId?: string }>()
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<SearchUser[]>([])
  const [searchErr, setSearchErr] = useState<string | null>(null)
  const [state, setState] = useState<GameStateResponse | null>(null)
  const [userJson, setUserJson] = useState('')
  const [gameplayJson, setGameplayJson] = useState('')
  const [credits, setCredits] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const loadState = useCallback((uid: string) => {
    setErr(null)
    setBusy(true)
    apiFetch<GameStateResponse>(`/crm/players/${encodeURIComponent(uid)}/game-state`)
      .then((r) => {
        setState(r)
        setUserJson(r.userSave ? JSON.stringify(r.userSave.data, null, 2) : '')
        setGameplayJson(r.gameplaySave ? JSON.stringify(r.gameplaySave.data, null, 2) : '')
        setCredits(r.wallet?.credits ?? '0')
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setBusy(false))
  }, [])

  useEffect(() => {
    if (userIdParam) loadState(userIdParam)
    else {
      setState(null)
      setUserJson('')
      setGameplayJson('')
      setCredits('')
    }
  }, [userIdParam, loadState])

  const runSearch = () => {
    const t = q.trim()
    if (t.length < 2) {
      setSearchErr('Минимум 2 символа')
      return
    }
    setSearchErr(null)
    setBusy(true)
    apiFetch<{ users: SearchUser[] }>(`/crm/players/search?q=${encodeURIComponent(t)}&limit=30`)
      .then((r) => setUsers(r.users))
      .catch((e: Error) => setSearchErr(e.message))
      .finally(() => setBusy(false))
  }

  const saveUserSave = () => {
    if (!userIdParam) return
    let data: unknown
    try {
      data = JSON.parse(userJson)
    } catch {
      setErr('UserSave: невалидный JSON')
      return
    }
    setBusy(true)
    setErr(null)
    fetch(`${API_URL}/crm/players/${encodeURIComponent(userIdParam)}/user-save`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ data })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        loadState(userIdParam)
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setBusy(false))
  }

  const saveGameplaySave = () => {
    if (!userIdParam) return
    let data: unknown
    try {
      data = JSON.parse(gameplayJson)
    } catch {
      setErr('GameplaySave: невалидный JSON')
      return
    }
    setBusy(true)
    setErr(null)
    fetch(`${API_URL}/crm/players/${encodeURIComponent(userIdParam)}/gameplay-save`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ data })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        loadState(userIdParam)
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setBusy(false))
  }

  const saveWallet = () => {
    if (!userIdParam) return
    const n = Number(credits)
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
      setErr('Кредиты: целое неотрицательное число')
      return
    }
    setBusy(true)
    setErr(null)
    fetch(`${API_URL}/crm/players/${encodeURIComponent(userIdParam)}/wallet`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ credits: n })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        loadState(userIdParam)
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setBusy(false))
  }

  if (!userIdParam) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-2xl font-semibold">Игроки</h1>
          <p className="text-sm text-crm-ink/60">
            Поиск по email, username Telegram или префиксу id. Сохранения должны быть конвертами{' '}
            <code className="text-xs">version: 1|2</code> как в мобильном клиенте.
          </p>
        </header>
        <div className="flex max-w-xl flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-crm-ink/50" />
            <Input
              className="pl-9"
              placeholder="email, @username или id…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
          </div>
          <Button disabled={busy} onClick={runSearch}>
            Найти
          </Button>
        </div>
        {searchErr && <p className="text-sm text-red-600">{searchErr}</p>}
        <Card className="border-crm-ink/10 bg-white/80">
          <CardHeader>
            <CardTitle>Результаты</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Id</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telegram</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Link className="font-mono text-xs underline" to={u.id} relative="path">
                        {u.id.slice(0, 12)}…
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{u.email ?? '—'}</TableCell>
                    <TableCell className="text-sm">{u.telegramUser?.username ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {users.length === 0 && !busy && <p className="text-sm text-crm-ink/50">Пока пусто</p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to=".."
          relative="path"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          <ArrowLeft className="h-4 w-4" />
          К поиску
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold">Состояние игры</h1>
          <p className="font-mono text-xs text-crm-ink/60">{state?.user.email ?? state?.user.id}</p>
        </div>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}

      <Card className="border-crm-ink/10 bg-white/80">
        <CardHeader>
          <CardTitle>UserSave</CardTitle>
          <CardDescription>
            Таблица <code className="text-xs">UserSave</code>, rev {state?.userSave?.rev ?? '—'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <textarea
            className="min-h-[220px] w-full rounded-lg border border-crm-ink/15 bg-crm-fog/30 p-3 font-mono text-xs"
            value={userJson}
            onChange={(e) => setUserJson(e.target.value)}
            placeholder="нет записи — создастся при сохранении"
            spellCheck={false}
          />
          <Button size="sm" disabled={busy || !userJson.trim()} onClick={saveUserSave}>
            Сохранить UserSave
          </Button>
        </CardContent>
      </Card>

      <Card className="border-crm-ink/10 bg-white/80">
        <CardHeader>
          <CardTitle>GameplaySave</CardTitle>
          <CardDescription>
            Таблица <code className="text-xs">GameplaySave</code>, rev {state?.gameplaySave?.rev ?? '—'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <textarea
            className="min-h-[220px] w-full rounded-lg border border-crm-ink/15 bg-crm-fog/30 p-3 font-mono text-xs"
            value={gameplayJson}
            onChange={(e) => setGameplayJson(e.target.value)}
            placeholder="нет записи"
            spellCheck={false}
          />
          <Button size="sm" disabled={busy || !gameplayJson.trim()} onClick={saveGameplaySave}>
            Сохранить GameplaySave
          </Button>
        </CardContent>
      </Card>

      <Card className="border-crm-ink/10 bg-white/80">
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
          <CardDescription>Серверные кредиты (если включён WALLET_ENABLED на API)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div>
            <p className="mb-1 text-xs text-crm-ink/50">credits</p>
            <Input
              className="w-48 font-mono"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
            />
          </div>
          <Button size="sm" disabled={busy} onClick={saveWallet}>
            Сохранить wallet
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
