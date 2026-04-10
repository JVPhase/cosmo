/**
 * Block metrics collector.
 *
 * Keeps lightweight in-memory counters and a rolling window of recent block
 * events. Emit these via the /metrics admin endpoint or pipe them into an
 * external sink (Prometheus, Datadog, etc.) as needed.
 *
 * Thread-safety: single-threaded Node.js — no locks required.
 */
import type { FastifyRequest } from 'fastify'

export type BlockReason = 'rate_limit' | 'ban' | 'slow_down'

export interface BlockEvent {
  timestamp: number
  ip: string
  /** Decoded from JWT — null when the request is unauthenticated. */
  userId: string | null
  url: string
  method: string
  reason: BlockReason
  /** Composite rate-limit key (e.g. "1.2.3.4:userId:tgId"). */
  key: string
}

class BlockMetrics {
  private readonly totals = new Map<BlockReason, number>()
  private readonly recent: BlockEvent[] = []
  /** Keep at most this many events in memory. */
  private readonly MAX_EVENTS = 500

  record(req: FastifyRequest, key: string, reason: BlockReason): void {
    this.totals.set(reason, (this.totals.get(reason) ?? 0) + 1)

    const userId = this._decodeUserId(req)

    const event: BlockEvent = {
      timestamp: Date.now(),
      ip: req.ip,
      userId,
      url: req.url,
      method: req.method,
      reason,
      key,
    }

    this.recent.push(event)
    if (this.recent.length > this.MAX_EVENTS) this.recent.shift()

    // Structured log so external log shippers can index these automatically.
    req.log.warn(
      {
        blockEvent: {
          reason,
          key,
          ip: req.ip,
          userId,
          url: req.url,
          method: req.method,
        },
      },
      `[anti-bot] ${reason} — ${req.method} ${req.url}`,
    )
  }

  /** Summary for a metrics/health endpoint. */
  getSummary() {
    return {
      totals: Object.fromEntries(this.totals) as Record<BlockReason, number>,
      recentEventsCount: this.recent.length,
      /** Last 20 events for quick inspection without exposing full history. */
      recentSample: this.recent.slice(-20),
    }
  }

  /** Pull the full rolling window (for export / flushing). */
  drainRecent(): BlockEvent[] {
    return this.recent.splice(0)
  }

  // ── private helpers ─────────────────────────────────────────────────────────

  private _decodeUserId(req: FastifyRequest): string | null {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return null
    try {
      const payload = JSON.parse(
        Buffer.from(auth.slice(7).split('.')[1], 'base64url').toString(),
      ) as { userId?: string }
      return payload.userId ?? null
    } catch {
      return null
    }
  }
}

export const blockMetrics = new BlockMetrics()
