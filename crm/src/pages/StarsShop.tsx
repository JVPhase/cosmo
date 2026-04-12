import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, RefreshCw, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiFetch } from '@/lib/api'
import { cn } from '@/lib/utils'

type StarsShopItemSummary = {
  id: string
  type: string
  name: string
  description: string
  priceStars: number
  priceCredits: number | null
  isActive: boolean
  sortOrder: number
  deliveryMode: string | null
  updatedAt: string
}

type StarsShopListResponse = { items: StarsShopItemSummary[] }

type StarsShopItemDetail = {
  id: string
  type: string
  name: string
  description: string
  priceStars: number
  priceCredits: number | null
  metadata: Record<string, unknown>
  isActive: boolean
  sortOrder: number
  updatedAt: string
  createdAt: string
}

type FormState = {
  id: string
  type: string
  name: string
  description: string
  priceStars: string
  priceCredits: string
  sortOrder: string
  isActive: boolean
  metadataText: string
}

const TYPE_OPTIONS = [
  'currency_pack',
  'metal_pack',
  'booster',
  'loot_box',
  'premium_unlock'
] as const

function metadataTemplate(type: string): Record<string, unknown> {
  switch (type) {
    case 'currency_pack':
      return { creditAmount: 100, deliveryMode: 'grant_sync' }
    case 'metal_pack':
      return { metalId: 'iron', quantity: 50, deliveryMode: 'grant_sync' }
    case 'booster':
      return {
        effectType: 'clickMultiplier',
        multiplier: 2,
        durationMs: 3_600_000,
        deliveryMode: 'grant_sync'
      }
    case 'loot_box':
      return { tier: 'basic', deliveryMode: 'grant_sync' }
    case 'premium_unlock':
      return { effect: 'unlockNextSector', deliveryMode: 'unsupported' }
    default:
      return { deliveryMode: 'grant_sync' }
  }
}

function emptyForm(type = 'currency_pack'): FormState {
  return {
    id: '',
    type,
    name: '',
    description: '',
    priceStars: '',
    priceCredits: '',
    sortOrder: '0',
    isActive: true,
    metadataText: JSON.stringify(metadataTemplate(type), null, 2)
  }
}

function metadataHint(type: string): string {
  switch (type) {
    case 'currency_pack':
      return 'Нужны metadata.creditAmount и metadata.deliveryMode.'
    case 'metal_pack':
      return 'Нужны metadata.metalId, metadata.quantity и metadata.deliveryMode.'
    case 'booster':
      return 'Нужны metadata.effectType, metadata.durationMs и хотя бы один из metadata.multiplier / metadata.bonus.'
    case 'loot_box':
      return 'Нужны metadata.tier (basic | advanced | premium) и metadata.deliveryMode.'
    case 'premium_unlock':
      return 'Нужны metadata.effect и deliveryMode не равный grant_sync.'
    default:
      return 'Проверьте metadata вручную.'
  }
}

export default function StarsShopPage() {
  const { itemId } = useParams<{ itemId?: string }>()
  const navigate = useNavigate()
  const isCreate = itemId === 'new'

  const [items, setItems] = useState<StarsShopItemSummary[]>([])
  const [detail, setDetail] = useState<StarsShopItemDetail | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const loadItems = useCallback(() => {
    apiFetch<StarsShopListResponse>('/crm/stars-shop/items')
      .then((res) => setItems(res.items))
      .catch((e: Error) => setErr(e.message))
  }, [])

  useEffect(() => {
    setErr(null)
    loadItems()
  }, [loadItems])

  useEffect(() => {
    setErr(null)

    if (!itemId) {
      setDetail(null)
      setForm(emptyForm())
      return
    }

    if (isCreate) {
      setDetail(null)
      setForm(emptyForm())
      return
    }

    setBusy(true)
    apiFetch<StarsShopItemDetail>(`/crm/stars-shop/items/${encodeURIComponent(itemId)}`)
      .then((item) => {
        setDetail(item)
        setForm({
          id: item.id,
          type: item.type,
          name: item.name,
          description: item.description,
          priceStars: String(item.priceStars),
          priceCredits: item.priceCredits === null ? '' : String(item.priceCredits),
          sortOrder: String(item.sortOrder),
          isActive: item.isActive,
          metadataText: JSON.stringify(item.metadata, null, 2)
        })
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setBusy(false))
  }, [isCreate, itemId])

  function patchForm(patch: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  function applyMetadataTemplate() {
    patchForm({
      metadataText: JSON.stringify(metadataTemplate(form.type), null, 2)
    })
  }

  async function saveItem() {
    let metadata: unknown
    try {
      metadata = JSON.parse(form.metadataText)
    } catch {
      setErr('Невалидный JSON в metadata')
      return
    }

    const payload = {
      ...(isCreate ? { id: form.id.trim() } : {}),
      type: form.type,
      name: form.name.trim(),
      description: form.description.trim(),
      priceStars: Number(form.priceStars),
      priceCredits: form.priceCredits.trim() === '' ? null : Number(form.priceCredits),
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
      metadata
    }

    setBusy(true)
    setErr(null)
    try {
      const saved = isCreate
        ? await apiFetch<StarsShopItemDetail>('/crm/stars-shop/items', {
            method: 'POST',
            body: JSON.stringify(payload)
          })
        : await apiFetch<StarsShopItemDetail>(`/crm/stars-shop/items/${encodeURIComponent(itemId!)}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          })

      setDetail(saved)
      setForm({
        id: saved.id,
        type: saved.type,
        name: saved.name,
        description: saved.description,
        priceStars: String(saved.priceStars),
        priceCredits: saved.priceCredits === null ? '' : String(saved.priceCredits),
        sortOrder: String(saved.sortOrder),
        isActive: saved.isActive,
        metadataText: JSON.stringify(saved.metadata, null, 2)
      })
      loadItems()
      if (isCreate) {
        navigate(`/stars-shop/${encodeURIComponent(saved.id)}`, { replace: true })
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось сохранить товар')
    } finally {
      setBusy(false)
    }
  }

  if (!itemId) {
    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">Telegram Stars shop</h1>
            <p className="text-sm text-crm-ink/60">
              Здесь редактируются товары из таблицы <code className="text-xs">ShopItem</code> с ценой в Stars.
              Изменения применяются без правки seed.
            </p>
          </div>
          <Link to="/stars-shop/new" className={cn(buttonVariants({ size: 'sm' }))}>
            <Plus className="mr-2 h-4 w-4" />
            Новый товар
          </Link>
        </header>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <Card className="border-crm-ink/10 bg-white/80">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Stars товары</CardTitle>
              <CardDescription>Активные и скрытые позиции Telegram-магазина.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadItems}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Обновить
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Stars</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        className="font-mono text-sm text-crm-ink underline"
                        to={`/stars-shop/${encodeURIComponent(item.id)}`}
                      >
                        {item.id}
                      </Link>
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.priceStars}</TableCell>
                    <TableCell>{item.deliveryMode ?? '—'}</TableCell>
                    <TableCell>
                      {item.isActive ? <Badge>active</Badge> : <Badge variant="cool">inactive</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
                {!items.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-crm-ink/50">
                      Stars-товаров пока нет.
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/stars-shop" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          <ArrowLeft className="h-4 w-4" />
          К списку
        </Link>
        <Link to="/stars-shop/new" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          <Plus className="h-4 w-4" />
          Новый
        </Link>
        <h1 className="font-display text-2xl font-semibold">
          {isCreate ? 'Новый Stars товар' : <span className="font-mono text-lg">{form.id}</span>}
        </h1>
        {form.isActive ? <Badge>active</Badge> : <Badge variant="cool">inactive</Badge>}
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <Card className="border-crm-ink/10 bg-white/80">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Параметры товара</CardTitle>
            <CardDescription>
              Изменение товара влияет на новые покупки. Уже созданные инвойсы исполняются по snapshot версии.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={applyMetadataTemplate} disabled={busy}>
              Шаблон metadata
            </Button>
            <Button size="sm" onClick={saveItem} disabled={busy}>
              <Save className="mr-2 h-4 w-4" />
              {isCreate ? 'Создать' : 'Сохранить'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              placeholder="id"
              value={form.id}
              onChange={(e) => patchForm({ id: e.target.value })}
              disabled={!isCreate}
            />
            <label className="flex flex-col gap-1 text-sm text-crm-ink">
              <span>type</span>
              <select
                className="h-10 rounded-md border border-crm-ink/15 bg-white px-3 text-sm text-crm-ink shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crm-accent"
                value={form.type}
                onChange={(e) => patchForm({ type: e.target.value })}
                disabled={busy}
              >
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <Input
              placeholder="Название"
              value={form.name}
              onChange={(e) => patchForm({ name: e.target.value })}
            />
            <Input
              placeholder="Цена в Stars"
              inputMode="numeric"
              value={form.priceStars}
              onChange={(e) => patchForm({ priceStars: e.target.value })}
            />
            <Input
              placeholder="Цена в credits (опционально)"
              inputMode="numeric"
              value={form.priceCredits}
              onChange={(e) => patchForm({ priceCredits: e.target.value })}
            />
            <Input
              placeholder="sortOrder"
              inputMode="numeric"
              value={form.sortOrder}
              onChange={(e) => patchForm({ sortOrder: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-crm-ink">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => patchForm({ isActive: e.target.checked })}
            />
            isActive
          </label>

          <textarea
            className="min-h-[96px] w-full rounded-lg border border-crm-ink/15 bg-crm-fog/30 p-3 text-sm text-crm-ink"
            value={form.description}
            onChange={(e) => patchForm({ description: e.target.value })}
            placeholder="Описание"
          />

          <div className="space-y-2">
            <p className="text-sm text-crm-ink/70">{metadataHint(form.type)}</p>
            <textarea
              className="min-h-[320px] w-full rounded-lg border border-crm-ink/15 bg-crm-fog/30 p-3 font-mono text-xs leading-relaxed"
              value={form.metadataText}
              onChange={(e) => patchForm({ metadataText: e.target.value })}
              spellCheck={false}
            />
          </div>

          {detail?.updatedAt && (
            <p className="text-xs text-crm-ink/50">
              Обновлено: {detail.updatedAt} | Создано: {detail.createdAt}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
