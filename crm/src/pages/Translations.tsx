import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Save, Trash2, Search, Languages } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiFetch } from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

type BundleMeta = {
  id: string
  app: string
  namespace: string
  locale: string
  version: number
  updatedAt: string
  keyCount: number
  translatedCount: number
}

type BundleDetail = BundleMeta & { messages: Record<string, string | null> }

// ── List page ─────────────────────────────────────────────────────────────────

function BundleList() {
  const [bundles, setBundles] = useState<BundleMeta[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [showAddKey, setShowAddKey] = useState(false)

  const load = useCallback(() => {
    apiFetch<{ bundles: BundleMeta[] }>('/crm/locales')
      .then((r) => setBundles(r.bundles))
      .catch((e: Error) => setErr(e.message))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const coverage = (b: BundleMeta) =>
    b.keyCount === 0 ? 100 : Math.round((b.translatedCount / b.keyCount) * 100)

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Translations</h1>
          <p className="text-sm text-crm-ink/60">
            Manage localisation bundles for mobile and CRM. Base locale: <code className="text-xs">ru</code>.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddKey((v) => !v)}>
          <Plus className="mr-2 h-4 w-4" />
          Add key
        </Button>
      </header>

      {err && <p className="text-sm text-red-600">{err}</p>}

      {showAddKey && <AddKeyForm onDone={() => { setShowAddKey(false); load() }} />}

      <Card className="border-crm-ink/10 bg-white/80">
        <CardHeader>
          <CardTitle>Bundles</CardTitle>
          <CardDescription>One row per app / namespace / locale combination.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App</TableHead>
                <TableHead>Namespace</TableHead>
                <TableHead>Locale</TableHead>
                <TableHead>Keys</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(bundles ?? []).map((b) => {
                const pct = coverage(b)
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.app}</TableCell>
                    <TableCell className="font-mono text-xs">{b.namespace}</TableCell>
                    <TableCell>
                      <Badge variant={b.locale === 'ru' ? 'default' : 'cool'}>{b.locale}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{b.keyCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-crm-ink/10">
                          <div
                            className="h-1.5 rounded-full bg-crm-ink"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-crm-ink/60">{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-crm-ink/60">v{b.version}</TableCell>
                    <TableCell className="text-xs text-crm-ink/50">
                      {new Date(b.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link
                        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                        to={`${b.app}/${b.namespace}/${b.locale}`}
                      >
                        Edit
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Bundle editor ─────────────────────────────────────────────────────────────

function BundleEditor({
  app: appParam,
  namespace,
  locale,
}: {
  app: string
  namespace: string
  locale: string
}) {
  const [bundle, setBundle] = useState<BundleDetail | null>(null)
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [missingOnly, setMissingOnly] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const load = useCallback(() => {
    apiFetch<BundleDetail>(`/crm/locales/${encodeURIComponent(appParam)}/${encodeURIComponent(namespace)}/${encodeURIComponent(locale)}`)
      .then((d) => {
        setBundle(d)
        setEdits(Object.fromEntries(Object.entries(d.messages).map(([k, v]) => [k, v ?? ''])))
      })
      .catch((e: Error) => setErr(e.message))
  }, [appParam, namespace, locale])

  useEffect(() => {
    load()
  }, [load])

  const save = () => {
    setBusy(true)
    setErr(null)
    setSaved(false)
    apiFetch(`/crm/locales/${encodeURIComponent(appParam)}/${encodeURIComponent(namespace)}/${encodeURIComponent(locale)}`, {
      method: 'PUT',
      body: JSON.stringify({ messages: edits }),
    })
      .then(() => {
        setSaved(true)
        load()
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setBusy(false))
  }

  const deleteKey = (key: string) => {
    if (!window.confirm(`Delete key "${key}" from all locales in ${namespace}?`)) return
    apiFetch('/crm/locales/keys', {
      method: 'DELETE',
      body: JSON.stringify({ app: appParam, namespace, key }),
    })
      .then(() => load())
      .catch((e: Error) => setErr(e.message))
  }

  const entries = Object.entries(edits).filter(([k, v]) => {
    if (missingOnly && v.trim()) return false
    if (search && !k.toLowerCase().includes(search.toLowerCase()) && !v.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const missingCount = Object.values(edits).filter((v) => !v.trim()).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to=".."
          relative="path"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          <ArrowLeft className="h-4 w-4" />
          All bundles
        </Link>
        <h1 className="font-display text-2xl font-semibold">
          <span className="font-mono text-lg">{appParam} / {namespace} / </span>
          <Badge variant={locale === 'ru' ? 'default' : 'cool'} className="ml-1 text-sm">{locale}</Badge>
        </h1>
        {bundle && <span className="text-xs text-crm-ink/50">v{bundle.version}</span>}
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {saved && <p className="text-sm text-green-600">Saved.</p>}

      <Card className="border-crm-ink/10 bg-white/80">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Keys ({Object.keys(edits).length})</CardTitle>
            {missingCount > 0 && (
              <CardDescription className="text-amber-600">{missingCount} keys not yet translated</CardDescription>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-crm-ink/40" />
              <input
                className="h-8 w-48 rounded-md border border-crm-ink/15 bg-white pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-crm-ink/20"
                placeholder="Search keys…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant={missingOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMissingOnly((v) => !v)}
            >
              Missing only
            </Button>
            <Button size="sm" disabled={busy} onClick={save}>
              <Save className="mr-2 h-4 w-4" />
              Save bundle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {entries.length === 0 && (
              <p className="py-8 text-center text-sm text-crm-ink/50">
                {missingOnly ? 'All keys translated.' : 'No keys found.'}
              </p>
            )}
            {entries.map(([key, val]) => (
              <div key={key} className="group flex items-start gap-2 rounded-lg border border-crm-ink/8 bg-crm-fog/20 p-2">
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-crm-ink/60">{key}</span>
                    {!val.trim() && (
                      <Badge variant="warm" className="text-[10px]">missing</Badge>
                    )}
                  </div>
                  <textarea
                    className="min-h-[48px] w-full resize-y rounded border border-crm-ink/10 bg-white/80 p-2 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-crm-ink/20"
                    value={val}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                    spellCheck={false}
                    rows={val.includes('\n') ? Math.min(val.split('\n').length + 1, 8) : 1}
                  />
                </div>
                <button
                  className="mt-1 rounded p-1 text-crm-ink/20 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                  title={`Delete key "${key}"`}
                  onClick={() => deleteKey(key)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Add key form ──────────────────────────────────────────────────────────────

const APPS = ['mobile', 'crm'] as const
const NAMESPACES = ['ui', 'alerts', 'intro', 'story', 'dialogues', 'config'] as const

function AddKeyForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    app: 'mobile',
    namespace: 'ui',
    key: '',
    baseLocale: 'ru',
    baseValue: '',
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    apiFetch('/crm/locales/keys', {
      method: 'POST',
      body: JSON.stringify(form),
    })
      .then(() => onDone())
      .catch((e: Error) => setErr(e.message))
      .finally(() => setBusy(false))
  }

  return (
    <Card className="border-crm-ink/10 bg-white/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-4 w-4" />
          Add translation key
        </CardTitle>
        <CardDescription>
          The key will be created in all existing locales for the selected app + namespace.
          Only the base locale value is set immediately; others default to empty.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-crm-ink/70">App</span>
            <select
              className="h-9 rounded-md border border-crm-ink/15 bg-white px-3 text-sm"
              value={form.app}
              onChange={set('app')}
            >
              {APPS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-crm-ink/70">Namespace</span>
            <select
              className="h-9 rounded-md border border-crm-ink/15 bg-white px-3 text-sm"
              value={form.namespace}
              onChange={set('namespace')}
            >
              {NAMESPACES.map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-crm-ink/70">Key</span>
            <input
              className="h-9 rounded-md border border-crm-ink/15 bg-white px-3 font-mono text-sm"
              placeholder="tabs.game"
              value={form.key}
              onChange={set('key')}
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-crm-ink/70">Base locale</span>
            <input
              className="h-9 rounded-md border border-crm-ink/15 bg-white px-3 text-sm"
              placeholder="ru"
              value={form.baseLocale}
              onChange={set('baseLocale')}
              required
            />
          </label>

          <label className="sm:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-crm-ink/70">Base value ({form.baseLocale})</span>
            <textarea
              className="min-h-[72px] w-full resize-y rounded-md border border-crm-ink/15 bg-white p-3 text-sm"
              placeholder="The translated text…"
              value={form.baseValue}
              onChange={set('baseValue')}
              required
            />
          </label>

          {err && <p className="sm:col-span-2 text-sm text-red-600">{err}</p>}

          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onDone}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={busy}>
              <Plus className="mr-2 h-4 w-4" />
              Create key
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ── Router entry ──────────────────────────────────────────────────────────────

export default function TranslationsPage() {
  const { app: appParam, namespace, locale } = useParams<{
    app?: string
    namespace?: string
    locale?: string
  }>()

  if (appParam && namespace && locale) {
    return <BundleEditor app={appParam} namespace={namespace} locale={locale} />
  }

  return <BundleList />
}
