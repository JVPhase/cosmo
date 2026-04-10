import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Save, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { API_URL, apiFetch, getAccessToken } from '@/lib/api'

type KeyRow = {
  key: string
  hint: string
  overridden: boolean
  updatedAt: string | null
  version: number | null
}

type KeysResponse = { keys: KeyRow[] }

type ConfigDetail = {
  key: string
  overridden: boolean
  data: unknown
  version: number | null
  updatedAt: string | null
}

export default function GameConfigPage() {
  const { key: keyParam } = useParams<{ key?: string }>()
  const [keys, setKeys] = useState<KeyRow[] | null>(null)
  const [detail, setDetail] = useState<ConfigDetail | null>(null)
  const [jsonText, setJsonText] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const loadKeys = useCallback(() => {
    apiFetch<KeysResponse>('/crm/game-config/keys')
      .then((r) => setKeys(r.keys))
      .catch((e: Error) => setErr(e.message))
  }, [])

  useEffect(() => {
    setErr(null)
    loadKeys()
  }, [loadKeys])

  useEffect(() => {
    if (!keyParam) {
      setDetail(null)
      setJsonText('')
      return
    }
    setErr(null)
    setBusy(true)
    apiFetch<ConfigDetail>(`/crm/game-config/${encodeURIComponent(keyParam)}`)
      .then((d) => {
        setDetail(d)
        setJsonText(JSON.stringify(d.data, null, 2))
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setBusy(false))
  }, [keyParam])

  const save = () => {
    if (!keyParam) return
    let data: unknown
    try {
      data = JSON.parse(jsonText)
    } catch {
      setErr('Невалидный JSON')
      return
    }
    setBusy(true)
    setErr(null)
    fetch(`${API_URL}/crm/game-config/${encodeURIComponent(keyParam)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken() ?? ''}`
      },
      body: JSON.stringify({ data })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text())
        loadKeys()
        return apiFetch<ConfigDetail>(`/crm/game-config/${encodeURIComponent(keyParam)}`)
      })
      .then((d) => {
        setDetail(d)
        setJsonText(JSON.stringify(d.data, null, 2))
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setBusy(false))
  }

  const removeOverride = () => {
    if (!keyParam || !detail?.overridden) return
    if (!window.confirm('Удалить оверрайд из БД и вернуться к дефолту из кода?')) return
    setBusy(true)
    setErr(null)
    fetch(`${API_URL}/crm/game-config/${encodeURIComponent(keyParam)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` }
    })
      .then(async (res) => {
        if (!res.ok && res.status !== 204) throw new Error(await res.text())
        loadKeys()
        return apiFetch<ConfigDetail>(`/crm/game-config/${encodeURIComponent(keyParam)}`)
      })
      .then((d) => {
        setDetail(d)
        setJsonText(JSON.stringify(d.data, null, 2))
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setBusy(false))
  }

  if (!keyParam) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-2xl font-semibold">Конфиг игры</h1>
          <p className="text-sm text-crm-ink/60">
            Секции совпадают с ответом <code className="text-xs">GET /config</code>. Запись в БД полностью
            подменяет дефолт из <code className="text-xs">@cosmo/game-config</code> для этого ключа. Клиенты
            кэшируют конфиг до ~1 часа.
          </p>
        </header>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <Card className="border-crm-ink/10 bg-white/80">
          <CardHeader>
            <CardTitle>Секции</CardTitle>
            <CardDescription>Выберите секцию для правки JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ключ</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(keys ?? []).map((k) => (
                  <TableRow key={k.key}>
                    <TableCell>
                      <Link className="font-mono text-sm text-crm-ink underline" to={k.key} relative="path">
                        {k.key}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-crm-ink/70">{k.hint || '—'}</TableCell>
                    <TableCell>
                      {k.overridden ? (
                        <Badge variant="default">БД v{k.version}</Badge>
                      ) : (
                        <Badge variant="cool">дефолт из кода</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          Все секции
        </Link>
        <h1 className="font-display text-2xl font-semibold">
          <span className="font-mono text-lg">{keyParam}</span>
        </h1>
        {detail?.overridden ? (
          <Badge>оверрайд БД v{detail.version}</Badge>
        ) : (
          <Badge variant="cool">редактируется дефолт (сохранение создаст оверрайд)</Badge>
        )}
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <Card className="border-crm-ink/10 bg-white/80">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>JSON</CardTitle>
            <CardDescription>
              Ачивки / корабли / исследования и т.д. лежат в соответствующих ключах (
              <code className="text-xs">achievements</code>, <code className="text-xs">ships</code>,{' '}
              <code className="text-xs">research</code>…)
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={busy} onClick={() => keyParam && loadKeys()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Обновить список ключей
            </Button>
            {detail?.overridden && (
              <Button variant="outline" size="sm" disabled={busy} onClick={removeOverride}>
                <Trash2 className="mr-2 h-4 w-4" />
                Сбросить оверрайд
              </Button>
            )}
            <Button size="sm" disabled={busy} onClick={save}>
              <Save className="mr-2 h-4 w-4" />
              Сохранить в БД
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            className="min-h-[480px] w-full rounded-lg border border-crm-ink/15 bg-crm-fog/30 p-3 font-mono text-xs leading-relaxed"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
          />
          {detail?.updatedAt && (
            <p className="mt-2 text-xs text-crm-ink/50">Последнее обновление в БД: {detail.updatedAt}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
