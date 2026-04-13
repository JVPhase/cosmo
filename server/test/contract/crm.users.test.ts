import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { FastifyInstance } from 'fastify'
import { buildApp, cleanupUser, createTestUser, db, signToken } from '../setup'

describe('Contract: CRM user provisioning', () => {
  let app: FastifyInstance
  let adminUserId: string
  let memberUserId: string
  let plainUserId: string
  let adminAccessToken: string
  let memberAccessToken: string
  let plainAccessToken: string
  const createdEmails: string[] = []

  before(async () => {
    app = await buildApp()

    const adminUser = await createTestUser()
    adminUserId = adminUser.id
    await db.crmUser.create({ data: { userId: adminUserId, role: 'admin' } })
    adminAccessToken = signToken(app, adminUserId)

    const memberUser = await createTestUser()
    memberUserId = memberUser.id
    await db.crmUser.create({ data: { userId: memberUserId, role: 'member' } })
    memberAccessToken = signToken(app, memberUserId)

    const plainUser = await createTestUser()
    plainUserId = plainUser.id
    plainAccessToken = signToken(app, plainUserId)
  })

  after(async () => {
    for (const email of createdEmails) {
      const created = await db.user.findUnique({ where: { email } })
      if (created) await cleanupUser(created.id)
    }
    await cleanupUser(adminUserId)
    await cleanupUser(memberUserId)
    await cleanupUser(plainUserId)
    await app.close()
  })

  it('allows admins to create CRM users and list them', async () => {
    const email = `crm-user-${Date.now()}@example.com`
    createdEmails.push(email)

    const createRes = await app.inject({
      method: 'POST',
      url: '/crm/users',
      headers: { authorization: `Bearer ${adminAccessToken}` },
      payload: {
        email,
        password: 'supersecret123',
        role: 'viewer'
      }
    })

    assert.equal(createRes.statusCode, 201, createRes.body)
    const created = createRes.json() as {
      userId: string
      email: string
      role: string
      createdAt: string
    }
    assert.equal(created.email, email)
    assert.equal(created.role, 'viewer')
    assert.ok(created.userId)
    assert.ok(created.createdAt)

    const row = await db.user.findUnique({
      where: { email },
      include: { crmUser: true }
    })
    assert.ok(row, 'Provisioned user was not created in DB')
    assert.equal(row!.crmUser?.role, 'viewer')
    assert.ok(row!.passwordHash, 'Provisioned user is missing password hash')

    const listRes = await app.inject({
      method: 'GET',
      url: '/crm/users',
      headers: { authorization: `Bearer ${adminAccessToken}` }
    })

    assert.equal(listRes.statusCode, 200, listRes.body)
    const listBody = listRes.json() as {
      items: Array<{ email: string | null; role: string }>
    }
    const listed = listBody.items.find((item) => item.email === email)
    assert.ok(listed, 'Provisioned user was not returned by list route')
    assert.equal(listed!.role, 'viewer')
  })

  it('rejects provisioning requests from non-admin CRM users', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/crm/users',
      headers: { authorization: `Bearer ${memberAccessToken}` },
      payload: {
        email: `member-attempt-${Date.now()}@example.com`,
        password: 'supersecret123',
        role: 'member'
      }
    })

    assert.equal(res.statusCode, 403, res.body)
    assert.match(res.body, /admin_only/i)
  })

  it('rejects CRM access for users that were not provisioned into CRM', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/crm/me',
      headers: { authorization: `Bearer ${plainAccessToken}` }
    })

    assert.equal(res.statusCode, 403, res.body)
    assert.match(res.body, /crm_access_required/i)
  })
})
