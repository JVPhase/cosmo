import { Link, NavLink, Outlet } from 'react-router-dom'
import { Gamepad2, Layers, LifeBuoy, Sparkles, Target, TrendingUp, UserRound, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clearTokens } from '@/lib/api'

const nav = [
  { label: 'Overview', to: '/', icon: Target },
  { label: 'Accounts', to: '/accounts', icon: UserRound },
  { label: 'Leads', to: '/leads', icon: Sparkles },
  { label: 'Deals', to: '/deals', icon: TrendingUp },
  { label: 'Activity', to: '/activity', icon: LifeBuoy },
  { label: 'Game config', to: '/game-config', icon: Gamepad2 },
  { label: 'Players', to: '/players', icon: Users }
]

export function Layout() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="glass-card flex h-full flex-col justify-between rounded-2xl border border-crm-ink/10 p-5">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-crm-ink text-crm-fog">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold">Cosmo CRM</p>
                <p className="text-xs text-crm-ink/60">Revenue intelligence</p>
              </div>
            </Link>

            <nav className="space-y-1 text-sm">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                      isActive ? 'bg-crm-ink text-crm-fog' : 'text-crm-ink/70 hover:bg-crm-ink/5'
                    }`
                  }
                  end={item.to === '/'}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="rounded-xl border border-crm-ink/10 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-wide text-crm-ink/50">Session</p>
            <p className="mt-2 text-sm">Signed in</p>
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => {
                clearTokens()
                window.location.href = '/login'
              }}
            >
              Sign out
            </Button>
          </div>
        </aside>

        <main className="space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
