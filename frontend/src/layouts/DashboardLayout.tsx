import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  TrendingUp, BarChart2, Wallet,
  ShieldCheck, LogOut, Zap, Bell, Bot,
  X, User, MessageSquare,
  Sun, Moon, Crown, BellRing, Newspaper, MessageCircle,
  Home, ChevronRight, Settings,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { getUserNotifications, markAllNotificationsRead } from '../lib/api'
import { useLivePrices } from '../hooks/useLivePrices'
import AdPopup from '../components/AdPopup'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

const TIER_META = [
  { label: 'Unverified', color: 'text-[#848e9c]' },
  { label: 'Tier 1',     color: 'text-[#f0b90b]' },
  { label: 'Tier 2',     color: 'text-[#0ecb81]' },
  { label: 'Tier 3',     color: 'text-[#a78bfa]' },
]

const sideNavItems = [
  { to: '/app/wallet',        icon: Wallet,        label: 'Wallet' },
  { to: '/app/chat',          icon: MessageCircle, label: 'Chat Fin' },
  { to: '/app/news',          icon: Newspaper,     label: 'News' },
  { to: '/app/notifications', icon: BellRing,      label: 'Notifications' },
  { to: '/app/settings',      icon: Settings,      label: 'Settings' },
  { to: '/app/support',       icon: MessageSquare, label: 'Support' },
  { to: '/app/pricing',       icon: Crown,         label: 'Pricing' },
]

interface AppNotification {
  id: number; title: string; message: string; is_read: boolean; created_at: string
}

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [navOpen, setNavOpen]     = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [lightMode, setLightMode] = useState(() => localStorage.getItem('finai-theme') === 'light')
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (lightMode) {
      document.documentElement.classList.add('light')
      localStorage.setItem('finai-theme', 'light')
    } else {
      document.documentElement.classList.remove('light')
      localStorage.setItem('finai-theme', 'dark')
    }
  }, [lightMode])

  useEffect(() => {
    fetchNotifications()
    const iv = setInterval(fetchNotifications, 30000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const fetchNotifications = () => {
    getUserNotifications().then(r => setNotifications(r.data)).catch(() => {})
  }
  const handleMarkAllRead = async () => {
    await markAllNotificationsRead().catch(() => {})
    setNotifications(ns => ns.map(n => ({ ...n, is_read: true })))
  }
  const handleLogout = () => { logout(); navigate('/login') }

  const unread    = notifications.filter(n => !n.is_read).length
  const firstName = user?.first_name || user?.email?.split('@')[0] || 'Trader'
  const tier      = TIER_META[user?.account_tier ?? 0] ?? TIER_META[0]

  return (
    <div className="flex flex-col h-screen bg-[#0b0e11] overflow-hidden">

      {/* Overlay */}
      {navOpen && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setNavOpen(false)} />
      )}

      {/* Nav drawer — slides from RIGHT */}
      <aside className={cn(
        'fixed top-0 right-0 h-full z-50 bg-[#161a1e] border-l border-[#2b3139] flex flex-col transition-transform duration-200 w-64',
        navOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="h-16 flex items-center px-5 border-b border-[#2b3139] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#f0b90b] flex items-center justify-center">
              <Zap size={16} className="text-black" />
            </div>
            <span className="text-[#f0b90b] font-bold text-lg tracking-tight">FinAi</span>
          </div>
          <button onClick={() => setNavOpen(false)} className="ml-auto text-[#848e9c] hover:text-[#eaecef]">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {sideNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setNavOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive ? 'bg-[#f0b90b]/10 text-[#f0b90b]' : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139]/60'
              )}>
              <Icon size={15} />{label}
            </NavLink>
          ))}
          {user?.is_admin && (
            <NavLink to="/app/admin" onClick={() => setNavOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive ? 'bg-[#f6465d]/10 text-[#f6465d]' : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139]/60'
              )}>
              <ShieldCheck size={15} />Admin Panel
            </NavLink>
          )}
        </nav>

        <div className="p-3 border-t border-[#2b3139] flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-[#0b0e11] mb-1">
            <div className="w-8 h-8 rounded-full bg-[#f0b90b] flex items-center justify-center text-black font-bold text-sm flex-shrink-0 overflow-hidden">
              {user?.profile_photo ? <img src={user.profile_photo} className="w-full h-full object-cover" alt="" /> : user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#eaecef] text-xs font-medium truncate">{user?.full_name || user?.email}</p>
              <p className={`text-[10px] ${tier.color}`}>{tier.label}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#848e9c] hover:text-[#f6465d] hover:bg-[#f6465d]/10 transition-all">
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ───── HEADER ───── */}
        <header className="bg-[#161a1e] border-b border-[#2b3139] flex-shrink-0">

          {/* Main row */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 gap-3">

            {/* LEFT — AI Chat + greeting */}
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => navigate('/app/chat')}
                className="w-12 h-12 rounded-full bg-[#f0b90b]/10 border border-[#f0b90b]/20 flex items-center justify-center flex-shrink-0 hover:bg-[#f0b90b]/20 transition">
                <MessageCircle size={22} className="text-[#f0b90b]" />
              </button>
              <div className="min-w-0">
                <p className="text-xs text-[#848e9c] leading-none mb-0.5">{getGreeting()},</p>
                <p className="text-sm font-bold text-[#eaecef] leading-tight truncate">{firstName}</p>
                <p className={`text-[10px] font-semibold leading-none mt-0.5 ${tier.color}`}>{tier.label}</p>
              </div>
            </div>

            {/* RIGHT — Notification + Brightness + Balance + Profile pic */}
            <div className="flex items-center gap-2 flex-shrink-0">

              {/* Notification */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen(v => !v)}
                  className="relative w-9 h-9 rounded-full bg-[#0b0e11] hover:bg-[#2b3139] flex items-center justify-center transition">
                  <Bell size={16} className="text-[#848e9c]" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#f6465d] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-11 w-72 sm:w-80 bg-[#161a1e] border border-[#2b3139] rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b3139]">
                      <span className="text-sm font-semibold text-[#eaecef]">Notifications</span>
                      {unread > 0 && <button onClick={handleMarkAllRead} className="text-xs text-[#f0b90b] hover:underline">Mark all read</button>}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center"><Bell size={20} className="text-[#2b3139] mx-auto mb-2" /><p className="text-xs text-[#848e9c]">No notifications</p></div>
                      ) : notifications.slice(0, 20).map(n => (
                        <div key={n.id} className={cn('px-4 py-3 border-b border-[#2b3139]/50 hover:bg-[#1e2329] transition', !n.is_read && 'bg-[#f0b90b]/5')}>
                          <div className="flex items-start gap-2">
                            {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-[#f0b90b] mt-1.5 flex-shrink-0" />}
                            <div className={cn('flex-1', n.is_read && 'pl-3.5')}>
                              <p className="text-xs font-medium text-[#eaecef]">{n.title}</p>
                              <p className="text-xs text-[#848e9c] mt-0.5 leading-relaxed">{n.message}</p>
                              <p className="text-[10px] text-[#4a5568] mt-1">{new Date(n.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { setNotifOpen(false); navigate('/app/notifications') }}
                      className="w-full px-4 py-2.5 text-xs text-[#f0b90b] hover:bg-[#1e2329] transition border-t border-[#2b3139] font-medium">
                      View all notifications →
                    </button>
                  </div>
                )}
              </div>

              {/* Brightness toggle */}
              <button onClick={() => setLightMode(v => !v)}
                className="w-9 h-9 rounded-full bg-[#0b0e11] hover:bg-[#2b3139] flex items-center justify-center transition">
                {lightMode ? <Moon size={15} className="text-[#848e9c]" /> : <Sun size={15} className="text-[#848e9c]" />}
              </button>

              {/* Balance chip */}
              <div className="hidden sm:flex items-center gap-1.5 bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2">
                <span className="text-xs font-mono text-[#eaecef]">${(user?.balance_usdt ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Profile pic → opens nav drawer */}
              <button onClick={() => setNavOpen(v => !v)}
                className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#f0b90b]/30 hover:border-[#f0b90b] flex-shrink-0 transition">
                {user?.profile_photo
                  ? <img src={user.profile_photo} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-[#f0b90b] flex items-center justify-center text-black font-bold">{user?.email?.[0]?.toUpperCase() ?? 'U'}</div>
                }
              </button>
            </div>
          </div>

          {/* Subscription status row */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Crown size={11} className="text-[#f0b90b]" />
              <span className={`text-[11px] font-semibold ${tier.color}`}>{tier.label}</span>
              <span className="w-1 h-1 rounded-full bg-[#4a5568]" />
              <span className="text-[11px] text-[#848e9c] font-mono">${(user?.balance_usdt ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</span>
            </div>
            <button onClick={() => navigate('/app/pricing')}
              className="flex items-center gap-0.5 text-[11px] text-[#f0b90b] hover:underline">
              Upgrade <ChevronRight size={10} />
            </button>
          </div>
        </header>

        {/* Live ticker strip */}
        <div className="bg-[#0b0e11] border-b border-[#2b3139] overflow-hidden flex-shrink-0">
          <LiveTickerBar />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-24">
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-5 lg:px-6 py-4 sm:py-5 lg:py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ───── BOTTOM NAV ───── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#161a1e] border-t border-[#2b3139]">
        <div className="flex items-end justify-around px-2 pb-2 pt-1 max-w-lg mx-auto relative">

          <NavLink to="/app/dashboard" className={({ isActive }) => cn(
            'flex flex-col items-center gap-0.5 py-1 px-3 transition-colors',
            isActive ? 'text-[#f0b90b]' : 'text-[#848e9c] hover:text-[#eaecef]'
          )}>
            {({ isActive }) => (
              <>
                <Home size={20} />
                <span className="text-[9px] font-medium">Home</span>
                {isActive && <span className="w-4 h-0.5 rounded-full bg-[#f0b90b] mt-0.5" />}
              </>
            )}
          </NavLink>

          <NavLink to="/app/trade" className={({ isActive }) => cn(
            'flex flex-col items-center gap-0.5 py-1 px-3 transition-colors',
            isActive ? 'text-[#f0b90b]' : 'text-[#848e9c] hover:text-[#eaecef]'
          )}>
            {({ isActive }) => (
              <>
                <TrendingUp size={20} />
                <span className="text-[9px] font-medium">Trade</span>
                {isActive && <span className="w-4 h-0.5 rounded-full bg-[#f0b90b] mt-0.5" />}
              </>
            )}
          </NavLink>

          {/* Elevated center FinBot button */}
          <NavLink to="/app/bots" className="flex flex-col items-center gap-1 relative -top-5">
            {({ isActive }) => (
              <>
                <div className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition',
                  isActive
                    ? 'bg-[#f0b90b] shadow-[#f0b90b]/40'
                    : 'bg-[#f0b90b] shadow-[#f0b90b]/20 hover:shadow-[#f0b90b]/50'
                )}>
                  <Bot size={26} className="text-black" />
                </div>
                <span className={cn('text-[9px] font-medium', isActive ? 'text-[#f0b90b]' : 'text-[#848e9c]')}>
                  Fin Bot
                </span>
              </>
            )}
          </NavLink>

          <NavLink to="/app/markets" className={({ isActive }) => cn(
            'flex flex-col items-center gap-0.5 py-1 px-3 transition-colors',
            isActive ? 'text-[#f0b90b]' : 'text-[#848e9c] hover:text-[#eaecef]'
          )}>
            {({ isActive }) => (
              <>
                <BarChart2 size={20} />
                <span className="text-[9px] font-medium">Markets</span>
                {isActive && <span className="w-4 h-0.5 rounded-full bg-[#f0b90b] mt-0.5" />}
              </>
            )}
          </NavLink>

          <NavLink to="/app/profile" className={({ isActive }) => cn(
            'flex flex-col items-center gap-0.5 py-1 px-3 transition-colors',
            isActive ? 'text-[#f0b90b]' : 'text-[#848e9c] hover:text-[#eaecef]'
          )}>
            {({ isActive }) => (
              <>
                <div className="w-5 h-5 rounded-full overflow-hidden border border-current flex-shrink-0">
                  {user?.profile_photo
                    ? <img src={user.profile_photo} className="w-full h-full object-cover" alt="" />
                    : <div className="w-full h-full bg-current/20 flex items-center justify-center">
                        <User size={11} />
                      </div>
                  }
                </div>
                <span className="text-[9px] font-medium">Profile</span>
                {isActive && <span className="w-4 h-0.5 rounded-full bg-[#f0b90b] mt-0.5" />}
              </>
            )}
          </NavLink>

        </div>
      </nav>

      <AdPopup />
    </div>
  )
}

function LiveTickerBar() {
  const { btcPrice, btcChange, ethPrice, ethChange, loading } = useLivePrices(60000)
  const STATIC = [
    { symbol: 'AAPL', price: 192.35, change: 0.9 },
    { symbol: 'NVDA', price: 875,    change: 3.1 },
  ]
  const tickers = [
    { symbol: 'BTC', price: btcPrice ?? 67432, change: btcChange ?? 2.4, live: !loading && btcPrice !== null },
    { symbol: 'ETH', price: ethPrice ?? 3521,  change: ethChange ?? 1.8, live: !loading && ethPrice !== null },
    ...STATIC.map(t => ({ ...t, live: false })),
  ]
  return (
    <div className="flex items-center gap-4 px-4 py-1.5 overflow-hidden">
      {tickers.map(t => (
        <div key={t.symbol} className="flex items-center gap-1 text-xs whitespace-nowrap">
          <span className="text-[#848e9c]">{t.symbol}</span>
          <span className="text-[#eaecef] font-mono">${t.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          <span className={t.change >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
            {t.change >= 0 ? '▲' : '▼'}{Math.abs(t.change).toFixed(1)}%
          </span>
          {t.live && <span className="w-1 h-1 rounded-full bg-[#0ecb81] animate-pulse" />}
        </div>
      ))}
    </div>
  )
}
