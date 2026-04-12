import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyInstance } from 'fastify'
import { buildApp, cleanupUser, createTestUser, deleteTestShopItem, signToken } from '../setup'

describe('Contract: CRM Stars shop admin', () => {
  let app: FastifyInstance
  let userId: string
  let accessToken: string
  const itemId = `test_crm_stars_${Date.now()}`

  before(async () => {
    app = await buildApp()
    const user = await createTestUser()
    userId = user.id
    accessToken = signToken(app, userId)
  })

  after(async () => {
    await deleteTestShopItem(itemId)
    await cleanupUser(userId)
    await app.close()
  })

  it('creates, lists, and updates a Telegram Stars shop item', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/crm/stars-shop/items',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        id: itemId,
        type: 'currency_pack',
        name: 'CRM Test Credits',
        description: 'Created from CRM test',
        priceStars: 42,
        priceCredits: null,
        sortOrder: 777,
        isActive: true,
        metadata: { creditAmount: 250, deliveryMode: 'grant_sync' },
      },
    })

    assert.equal(createRes.statusCode, 201, createRes.body)
    const created = createRes.json() as { id: string; priceStars: number; metadata: { creditAmount: number } }
    assert.equal(created.id, itemId)
    assert.equal(created.priceStars, 42)
    assert.equal(created.metadata.creditAmount, 250)

    const listRes = await app.inject({
      method: 'GET',
      url: '/crm/stars-shop/items',
      headers: { authorization: `Bearer ${accessToken}` },
    })

    assert.equal(listRes.statusCode, 200, listRes.body)
    const listBody = listRes.json() as {
      items: Array<{ id: string; deliveryMode: string | null }>
    }
    const listed = listBody.items.find((item) => item.id === itemId)
    assert.ok(listed, 'Created Stars shop item was not returned by list route')
    assert.equal(listed!.deliveryMode, 'grant_sync')

    const updateRes = await app.inject({
      method: 'PUT',
      url: `/crm/stars-shop/items/${encodeURIComponent(itemId)}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        type: 'currency_pack',
        name: 'CRM Test Credits Updated',
        description: 'Updated from CRM test',
        priceStars: 55,
        priceCredits: 100,
        sortOrder: 778,
        isActive: false,
        metadata: { creditAmount: 500, deliveryMode: 'grant_sync' },
      },
    })

    assert.equal(updateRes.statusCode, 200, updateRes.body)
    const updated = updateRes.json() as {
      name: string
      priceStars: number
      priceCredits: number | null
      isActive: boolean
      metadata: { creditAmount: number }
    }
    assert.equal(updated.name, 'CRM Test Credits Updated')
    assert.equal(updated.priceStars, 55)
    assert.equal(updated.priceCredits, 100)
    assert.equal(updated.isActive, false)
    assert.equal(updated.metadata.creditAmount, 500)
  })

  it('rejects invalid metadata for supported grant_sync items', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/crm/stars-shop/items',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        id: `${itemId}_bad`,
        type: 'metal_pack',
        name: 'Bad Metal Pack',
        description: 'Invalid metadata',
        priceStars: 5,
        priceCredits: null,
        sortOrder: 1,
        isActive: true,
        metadata: { metalId: 'iron', deliveryMode: 'grant_sync' },
      },
    })

    assert.equal(res.statusCode, 400, res.body)
    assert.match(res.body, /metadata\.quantity/i)
  })
})
