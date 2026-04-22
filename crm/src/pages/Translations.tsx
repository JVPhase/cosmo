import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Save, Trash2, Search, Languages } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

type NamespaceGroup = {
  app: string
  namespace: string
  locales: BundleMeta[]
}

const APPS = ['mobile', 'crm'] as const
const NAMESPACES = ['ui', 'alerts', 'intro', 'story', 'dialogues', 'config'] as const

const LOCALE_LABELS: Record<string, string> = {
  ru: 'Russian',
  en: 'English',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  zh: 'Chinese',
  tr: 'Turkish',
  pt: 'Portuguese',
  ar: 'Arabic',
}
const localeLabel = (loc: string) => LOCALE_LABELS[loc] ?? loc.toUpperCase()

// ── Namespace list ─────────────────────────────────────────────────────────────

function BundleList() {
  const [bundles, setBundles] = useState<BundleMeta[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [showAddLocale, setShowAddLocale] = useState(false)
  const [showAddKey, setShowAddKey] = useState(false)

  const load = useCallback(() => {
    apiFetch<{ bundles: BundleMeta[] }>('/crm/locales')
      .then((r) => setBundles(r.bundles))
      .catch((e: Error) => setErr(e.message))
  }, [])

  useEffect(() => { load() }, [load])

  const groups: NamespaceGroup[] = []
  for (const b of bundles ?? []) {
    const g = groups.find((g) => g.app === b.app && g.namespace === b.namespace)
    if (g) g.locales.push(b)
    else groups.push({ app: b.app, namespace: b.namespace, locales: [b] })
  }

  const totalKeys = (g: NamespaceGroup) => Math.max(...g.locales.map((l) => l.keyCount), 0)
  const coverage = (g: NamespaceGroup) => {
    const base = g.locales.find((l) => l.locale === 'ru') ?? g.locales[0]
    if (!base || base.keyCount === 0) return 100
    return Math.round((base.translatedCount / base.keyCount) * 100)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Translations</h1>
          <p className="text-sm text-crm-ink/60">
            Manage localisation bundles for mobile and CRM. Base locale: <code className="text-xs">ru</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowAddLocale((v) => !v); setShowAddKey(false) }}>
            <Languages className="mr-2 h-4 w-4" />
            Add locale
          </Button>
          <Button size="sm" onClick={() => { setShowAddKey((v) => !v); setShowAddLocale(false) }}>
            <Plus className="mr-2 h-4 w-4" />
            Add key
          </Button>
        </div>
      </header>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {showAddLocale && <AddLocaleForm onDone={() => { setShowAddLocale(false); load() }} />}
      {showAddKey && <AddKeyForm onDone={() => { setShowAddKey(false); load() }} />}

      <Card className="border-crm-ink/10 bg-white/80">
        <CardHeader>
          <CardTitle>Namespaces</CardTitle>
          <CardDescription>Click a namespace to edit all locales together.</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-crm-ink/10 text-left text-xs font-medium text-crm-ink/50">
                <th className="pb-2 pr-4">App</th>
                <th className="pb-2 pr-4">Namespace</th>
                <th className="pb-2 pr-4">Locales</th>
                <th className="pb-2 pr-4">Keys</th>
                <th className="pb-2 pr-4">Coverage (ru)</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const pct = coverage(g)
                return (
                  <tr key={`${g.app}/${g.namespace}`} className="border-b border-crm-ink/5 last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs text-crm-ink/60">{g.app}</td>
                    <td className="py-2 pr-4 font-mono text-xs font-medium">{g.namespace}</td>
                    <td className="py-2 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {g.locales.map((l) => (
                          <Badge key={l.locale} variant={l.locale === 'ru' ? 'default' : 'cool'}>{l.locale}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-xs">{totalKeys(g)}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-crm-ink/10">
                          <div className="h-1.5 rounded-full bg-crm-ink" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-crm-ink/60">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-2">
                      <Link className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))} to={`${g.app}/${g.namespace}`}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Multi-locale editor (Lokalise-style) ───────────────────────────────────────

function BundleEditor({ app: appParam, namespace }: { app: string; namespace: string }) {
  const [locales, setLocales] = useState<string[]>([])
  const [keys, setKeys] = useState<string[]>([])
  // edits[locale][key] = value
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({})
  const [search, setSearch] = useState('')
  const [missingOnly, setMissingOnly] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [showAddLocale, setShowAddLocale] = useState(false)

  const load = useCallback(async () => {
    setErr(null)
    try {
      const { bundles } = await apiFetch<{ bundles: BundleMeta[] }>('/crm/locales')
      const relevant = bundles.filter((b) => b.app === appParam && b.namespace === namespace)
      const localeList = relevant
        .map((b) => b.locale)
        .sort((a, b) => (a === 'ru' ? -1 : b === 'ru' ? 1 : a.localeCompare(b)))

      const details = await Promise.all(
        localeList.map((loc) =>
          apiFetch<BundleDetail>(
            `/crm/locales/${encodeURIComponent(appParam)}/${encodeURIComponent(namespace)}/${encodeURIComponent(loc)}`
          )
        )
      )

      const data: Record<string, Record<string, string>> = {}
      const allKeys = new Set<string>()
      for (const d of details) {
        data[d.locale] = Object.fromEntries(Object.entries(d.messages).map(([k, v]) => [k, v ?? '']))
        for (const k of Object.keys(d.messages)) allKeys.add(k)
      }

      const ruKeys = details.find((d) => d.locale === 'ru')
      const keyOrder = ruKeys ? Object.keys(ruKeys.messages) : [...allKeys].sort()
      const remaining = [...allKeys].filter((k) => !keyOrder.includes(k)).sort()

      setLocales(localeList)
      setKeys([...keyOrder, ...remaining])
      setEdits(data)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    }
  }, [appParam, namespace])

  useEffect(() => { load() }, [load])

  const save = async () => {
    setBusy(true)
    setErr(null)
    setSaved(false)
    try {
      await Promise.all(
        locales.map((loc) =>
          apiFetch(
            `/crm/locales/${encodeURIComponent(appParam)}/${encodeURIComponent(namespace)}/${encodeURIComponent(loc)}`,
            { method: 'PUT', body: JSON.stringify({ messages: edits[loc] ?? {} }) }
          )
        )
      )
      setSaved(true)
      await load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const deleteKey = async (key: string) => {
    if (!window.confirm(`Delete key "${key}" from all locales in ${namespace}?`)) return
    try {
      await apiFetch('/crm/locales/keys', {
        method: 'DELETE',
        body: JSON.stringify({ app: appParam, namespace, key }),
      })
      await load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    }
  }

  const setCell = (locale: string, key: string, val: string) =>
    setEdits((prev) => ({ ...prev, [locale]: { ...prev[locale], [key]: val } }))

  const missingCount = keys.filter((k) =>
    locales.some((loc) => loc !== 'ru' && !(edits[loc]?.[k] ?? '').trim())
  ).length

  const filteredKeys = keys.filter((k) => {
    if (missingOnly && !locales.some((loc) => loc !== 'ru' && !(edits[loc]?.[k] ?? '').trim())) return false
    if (search) {
      const q = search.toLowerCase()
      if (!k.toLowerCase().includes(q) && !locales.some((loc) => (edits[loc]?.[k] ?? '').toLowerCase().includes(q))) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/translations" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          <ArrowLeft className="h-4 w-4" />
          All bundles
        </Link>
        <h1 className="font-display text-2xl font-semibold">
          <span className="font-mono text-lg">{appParam} / {namespace}</span>
        </h1>
        <div className="flex flex-wrap gap-1">
          {locales.map((loc) => (
            <Badge key={loc} variant={loc === 'ru' ? 'default' : 'cool'}>{loc}</Badge>
          ))}
        </div>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {saved && <p className="text-sm text-green-600">Saved.</p>}

      {showAddLocale && (
        <AddLocaleForm
          fixedApp={appParam}
          fixedNamespace={namespace}
          onDone={() => { setShowAddLocale(false); load() }}
        />
      )}

      <Card className="border-crm-ink/10 bg-white/80">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Keys ({keys.length})</CardTitle>
            {missingCount > 0 && (
              <CardDescription className="text-amber-600">{missingCount} keys missing in non-ru locales</CardDescription>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAddLocale((v) => !v)}>
              <Languages className="mr-2 h-4 w-4" />
              Add locale
            </Button>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-crm-ink/40" />
              <input
                className="h-8 w-48 rounded-md border border-crm-ink/15 bg-white pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-crm-ink/20"
                placeholder="Search keys…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant={missingOnly ? 'default' : 'outline'} size="sm" onClick={() => setMissingOnly((v) => !v)}>
              Missing only
            </Button>
            <Button size="sm" disabled={busy} onClick={save}>
              <Save className="mr-2 h-4 w-4" />
              Save all
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredKeys.length === 0 ? (
            <p className="py-10 text-center text-sm text-crm-ink/50">
              {missingOnly ? 'All keys translated.' : 'No keys found.'}
            </p>
          ) : (
            <div className="divide-y divide-crm-ink/8">
              {filteredKeys.map((key) => (
                <KeyBlock
                  key={key}
                  keyName={key}
                  locales={locales}
                  edits={edits}
                  onChange={setCell}
                  onDelete={deleteKey}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Key block (Lokalise-style: key name + stacked locale rows) ─────────────────

function KeyBlock({
  keyName,
  locales,
  edits,
  onChange,
  onDelete,
}: {
  keyName: string
  locales: string[]
  edits: Record<string, Record<string, string>>
  onChange: (locale: string, key: string, val: string) => void
  onDelete: (key: string) => void
}) {
  const anyMissing = locales.some((loc) => loc !== 'ru' && !(edits[loc]?.[keyName] ?? '').trim())

  return (
    <div className="group flex">
      {/* Key name column */}
      <div className="w-56 shrink-0 border-r border-crm-ink/8 px-4 py-3">
        <div className="flex items-start justify-between gap-1">
          <span className={cn('font-mono text-xs break-all leading-relaxed', anyMissing ? 'text-crm-ink' : 'text-crm-ink/70')}>
            {keyName}
          </span>
          <button
            className="mt-0.5 shrink-0 rounded p-0.5 text-crm-ink/20 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
            title={`Delete "${keyName}"`}
            onClick={() => onDelete(keyName)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {anyMissing && <span className="mt-1 inline-block text-[10px] text-amber-500 font-medium">missing</span>}
      </div>

      {/* Locale rows */}
      <div className="flex-1 divide-y divide-crm-ink/5">
        {locales.map((loc) => {
          const val = edits[loc]?.[keyName] ?? ''
          const missing = loc !== 'ru' && !val.trim()
          return (
            <div key={loc} className="flex items-start gap-3 px-4 py-2">
              <span className={cn(
                'mt-1.5 w-16 shrink-0 text-xs font-medium',
                loc === 'ru' ? 'text-crm-ink' : missing ? 'text-amber-500' : 'text-crm-ink/50'
              )}>
                {localeLabel(loc)}
              </span>
              <AutoResizeTextarea
                value={val}
                onChange={(v) => onChange(loc, keyName, v)}
                missing={missing}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AutoResizeTextarea({
  value,
  onChange,
  missing,
}: {
  value: string
  onChange: (v: string) => void
  missing: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }, [value])

  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full resize-none overflow-hidden rounded border bg-transparent p-1.5 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-crm-ink/20 focus:bg-white',
        missing ? 'border-amber-200 bg-amber-50/30' : 'border-transparent hover:border-crm-ink/10'
      )}
      value={value}
      rows={1}
      spellCheck={false}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

// ── Add locale form ────────────────────────────────────────────────────────────

function AddLocaleForm({
  onDone,
  fixedApp,
  fixedNamespace,
}: {
  onDone: () => void
  fixedApp?: string
  fixedNamespace?: string
}) {
  const [app, setApp] = useState<string>(fixedApp ?? 'mobile')
  const [locale, setLocale] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const namespacesToCreate = fixedNamespace ? [fixedNamespace] : [...NAMESPACES]

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      await Promise.all(
        namespacesToCreate.map((ns) =>
          apiFetch(
            `/crm/locales/${encodeURIComponent(app)}/${encodeURIComponent(ns)}/${encodeURIComponent(locale)}`,
            { method: 'PUT', body: JSON.stringify({ messages: {} }) }
          )
        )
      )
      onDone()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-crm-ink/10 bg-white/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-4 w-4" />
          Add locale
        </CardTitle>
        <CardDescription>
          {fixedNamespace
            ? `Creates an empty bundle for ${fixedApp}/${fixedNamespace} in the new locale.`
            : 'Creates empty bundles for all namespaces of the selected app.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {!fixedApp && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-crm-ink/70">App</span>
              <select
                className="h-9 rounded-md border border-crm-ink/15 bg-white px-3 text-sm"
                value={app}
                onChange={(e) => setApp(e.target.value)}
              >
                {APPS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </label>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-crm-ink/70">Locale code</span>
            <input
              className="h-9 rounded-md border border-crm-ink/15 bg-white px-3 font-mono text-sm"
              placeholder="en"
              value={locale}
              pattern="^[a-z]{2}(-[A-Z]{2})?$"
              title="Two-letter code like en or zh-CN"
              onChange={(e) => setLocale(e.target.value)}
              required
            />
          </label>
          {err && <p className="sm:col-span-2 text-sm text-red-600">{err}</p>}
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancel</Button>
            <Button type="submit" size="sm" disabled={busy}>
              <Plus className="mr-2 h-4 w-4" />
              Create locale
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ── Add key form ───────────────────────────────────────────────────────────────

function AddKeyForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ app: 'mobile', namespace: 'ui', key: '', baseLocale: 'ru', baseValue: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    apiFetch('/crm/locales/keys', { method: 'POST', body: JSON.stringify(form) })
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
          The key will be created in all existing locales. Only the base locale value is set immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-crm-ink/70">App</span>
            <select className="h-9 rounded-md border border-crm-ink/15 bg-white px-3 text-sm" value={form.app} onChange={set('app')}>
              {APPS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-crm-ink/70">Namespace</span>
            <select className="h-9 rounded-md border border-crm-ink/15 bg-white px-3 text-sm" value={form.namespace} onChange={set('namespace')}>
              {NAMESPACES.map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-crm-ink/70">Key</span>
            <input className="h-9 rounded-md border border-crm-ink/15 bg-white px-3 font-mono text-sm" placeholder="tabs.game" value={form.key} onChange={set('key')} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-crm-ink/70">Base locale</span>
            <input className="h-9 rounded-md border border-crm-ink/15 bg-white px-3 text-sm" placeholder="ru" value={form.baseLocale} onChange={set('baseLocale')} required />
          </label>
          <label className="sm:col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-crm-ink/70">Base value ({form.baseLocale})</span>
            <textarea className="min-h-[72px] w-full resize-y rounded-md border border-crm-ink/15 bg-white p-3 text-sm" value={form.baseValue} onChange={set('baseValue')} required />
          </label>
          {err && <p className="sm:col-span-2 text-sm text-red-600">{err}</p>}
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancel</Button>
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

// ── Router entry ───────────────────────────────────────────────────────────────

export default function TranslationsPage() {
  const { app: appParam, namespace } = useParams<{ app?: string; namespace?: string }>()

  if (appParam && namespace) {
    return <BundleEditor app={appParam} namespace={namespace} />
  }

  return <BundleList />
}
