import { useEffect, useState, useRef } from 'react'
import {
  Users, Receipt, DollarSign, Activity, ShieldCheck, RefreshCw,
  UserCheck, Bell, Wallet, MessageSquare, Gift, Share2, Megaphone,
  ShoppingBag, Star, Globe, Clock, MessageCircle, Server, Terminal,
  Key, CreditCard, BarChart2, X, ChevronRight,
} from 'lucide-react'
import { adminGetUsers, adminGetTransactions, adminHealthCheck } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import AdminPage from './AdminPage'

type AdminTab =
  | 'users' | 'transactions' | 'notifications' | 'wallet-config'
  | 'api-users' | 'support' | 'health' | 'subscriptions' | 'visitors'
  | 'bonuses' | 'referrals' | 'ads' | 'products' | 'testimonials'
  | 'activity' | 'platform-stats' | 'whatsapp-bot' | 'server-monitor' | 'api-console'

const NAV_ICONS: { id: AdminTab; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'users',          label: 'Users',          icon: Users,         color: '#60a5fa' },
  { id: 'transactions',   label: 'Transactions',   icon: Receipt,       color: '#0ecb81' },
  { id: 'subscriptions',  label: 'Subscriptions',  icon: CreditCard,    color: '#a78bfa' },
  { id: 'notifications',  label: 'Notifications',  icon: Bell,          color: '#f0b90b' },
  { id: 'wallet-config',  label: 'Wallet',         icon: Wallet,        color: '#22d3ee' },
  { id: 'support',        label: 'Support',        icon: MessageSquare, color: '#fb923c' },
  { id: 'bonuses',        label: 'Bonuses',        icon: Gift,          color: '#f0b90b' },
  { id: 'referrals',      label: 'Referrals',      icon: Share2,        color: '#0ecb81' },
  { id: 'ads',            label: 'Ads',            icon: Megaphone,     color: '#a78bfa' },
  { id: 'products',       label: 'Products',       icon: ShoppingBag,   color: '#fb923c' },
  { id: 'testimonials',   label: 'Testimonials',   icon: Star,          color: '#f0b90b' },
  { id: 'visitors',       label: 'Visitors',       icon: Globe,         color: '#22d3ee' },
  { id: 'health',         label: 'Health',         icon: Activity,      color: '#0ecb81' },
  { id: 'activity',       label: 'Activity',       icon: Clock,         color: '#848e9c' },
  { id: 'platform-stats', label: 'Stats',          icon: BarChart2,     color: '#f0b90b' },
  { id: 'whatsapp-bot',   label: 'WhatsApp',       icon: MessageCircle, color: '#25D366' },
  { id: 'server-monitor', label: 'Server',         icon: Server,        color: '#60a5fa' },
  { id: 'api-console',    label: 'API Console',    icon: Terminal,      color: '#a78bfa' },
  { id: 'api-users',      label: 'API Users',      icon: Key,           color: '#fb923c' },
]

export default function AdminDashboardPage({ onNavigate }: { onNavigate?: (tab: string) => void } = {}) {
  const user = useAuthStore(s => s.user)
  const [stats, setStats] = useState({ users: 0, activeUsers: 0, totalTx: 0, pendingTx: 0, revenue: 0, kycPending: 0 })
  const [recentTx, setRecentTx] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedTab, setExpandedTab] = useState<AdminTab | null>(null)
  const inlinePanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([adminGetUsers(), adminGetTransactions(), adminHealthCheck()])
      .then(([ur, tr, hr]) => {
        const users = ur.data || []
        const txs = tr.data || []
        const h = hr.data || {}
        setStats({
          users: users.length,
          activeUsers: users.filter((u: any) => u.is_active && !u.is_banned).length,
          totalTx: txs.length,
          pendingTx: txs.filter((t: any) => t.status === 'pending').length,
          revenue: txs.filter((t: any) => t.status === 'approved' && t.tx_type === 'deposit').reduce((s: number, t: any) => s + (t.amount_usdt || t.amount || 0), 0),
          kycPending: users.filter((u: any) => u.kyc_status === 'pending').length,
        })
        setRecentTx(txs.slice(0, 6))
        setRecentUsers(users.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5))
        setHealth(h)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleNavClick = (tab: AdminTab) => {
    if (expandedTab === tab) {
      setExpandedTab(null)
    } else {
      setExpandedTab(tab)
      setTimeout(() => inlinePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }

  const statusDot = (status: string) => ({ healthy: '#0ecb81', degraded: '#f0b90b', error: '#f6465d' }[status] || '#848e9c')
  const txStatusColor = (s: string) => ({ approved: 'text-[#0ecb81]', rejected: 'text-[#f6465d]', pending: 'text-[#f0b90b]' }[s] || 'text-[#848e9c]')

  const statCards = [
    { label: 'Total Users',    value: stats.users,   sub: `${stats.activeUsers} active`,    icon: Users,     color: '#f0b90b' },
    { label: 'Transactions',   value: stats.totalTx, sub: `${stats.pendingTx} pending`,     icon: Receipt,   color: '#0ecb81' },
    { label: 'Revenue (USDT)', value: `$${stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, sub: 'approved deposits', icon: DollarSign, color: '#a78bfa' },
    { label: 'KYC Pending',    value: stats.kycPending, sub: 'awaiting review',             icon: UserCheck, color: '#f6465d' },
  ]

  const activeNavItem = expandedTab ? NAV_ICONS.find(n => n.id === expandedTab) : null

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <RefreshCw size={20} className="text-[#f0b90b] animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#f6465d]/10 flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={18} className="text-[#f6465d]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#eaecef]">Admin Dashboard</h1>
          <p className="text-xs text-[#848e9c]">Welcome back, {user?.first_name || 'Admin'}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(c => (
          <div key={c.label} className="bg-[#161a1e] border border-[#2b3139] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${c.color}15` }}>
                <c.icon size={14} style={{ color: c.color }} />
              </div>
              <span className="text-[10px] text-[#848e9c] uppercase tracking-wide font-medium">{c.label}</span>
            </div>
            <p className="text-xl font-bold text-[#eaecef]">{c.value}</p>
            <p className="text-[10px] text-[#848e9c] mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Inline expanded panel — appears ABOVE the nav icon grid */}
      {expandedTab && activeNavItem && (
        <div ref={inlinePanelRef} className="bg-[#161a1e] border border-[#2b3139] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2b3139] bg-[#1e2329]">
            <activeNavItem.icon size={15} style={{ color: activeNavItem.color }} />
            <span className="text-sm font-semibold text-[#eaecef]">{activeNavItem.label}</span>
            {onNavigate && (
              <button
                onClick={() => { onNavigate(expandedTab); setExpandedTab(null) }}
                className="ml-auto flex items-center gap-1 text-xs text-[#f0b90b] hover:text-[#d4a30a] transition font-medium"
              >
                Full Panel <ChevronRight size={12} />
              </button>
            )}
            <button
              onClick={() => setExpandedTab(null)}
              className="text-[#848e9c] hover:text-[#eaecef] transition p-1"
            >
              <X size={15} />
            </button>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <AdminPage key={expandedTab} initialTab={expandedTab} embedded />
          </div>
        </div>
      )}

      {/* Recent data — hidden while a tab is expanded */}
      {!expandedTab && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[#161a1e] border border-[#2b3139] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#848e9c] uppercase tracking-wide">Recent Transactions</p>
              <button onClick={() => handleNavClick('transactions')} className="text-[10px] text-[#f0b90b] hover:underline">View all</button>
            </div>
            <div className="space-y-2">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[#2b3139]/50">
                  <div>
                    <p className="text-xs text-[#eaecef] truncate max-w-[180px]">{tx.user_email || `User #${tx.user_id}`}</p>
                    <p className="text-[10px] text-[#848e9c] capitalize">{(tx.tx_type || 'deposit').replace(/_/g, ' ')} · #{tx.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-[#eaecef]">${(tx.amount_usdt || tx.amount || 0).toFixed(2)}</p>
                    <p className={`text-[10px] font-medium capitalize ${txStatusColor(tx.status)}`}>{tx.status}</p>
                  </div>
                </div>
              ))}
              {recentTx.length === 0 && <p className="text-xs text-[#848e9c] py-4 text-center">No transactions yet</p>}
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-[#161a1e] border border-[#2b3139] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#848e9c] uppercase tracking-wide">System Health</p>
                <Activity size={13} className="text-[#848e9c]" />
              </div>
              <div className="space-y-2">
                {health && Object.entries(health).map(([key, val]: any) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-[#848e9c] capitalize">{key.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-1.5">
                      {val?.latency_ms && <span className="text-[10px] text-[#848e9c]">{val.latency_ms}ms</span>}
                      <div className="w-2 h-2 rounded-full" style={{ background: statusDot(val?.status) }} />
                      <span className="text-[10px] capitalize" style={{ color: statusDot(val?.status) }}>{val?.status || 'unknown'}</span>
                    </div>
                  </div>
                ))}
                {!health && <p className="text-xs text-[#848e9c]">Health data unavailable</p>}
              </div>
            </div>

            <div className="bg-[#161a1e] border border-[#2b3139] rounded-2xl p-4">
              <p className="text-xs font-semibold text-[#848e9c] uppercase tracking-wide mb-3">New Users</p>
              <div className="space-y-2">
                {recentUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#f0b90b]/10 flex items-center justify-center shrink-0">
                      <Users size={12} className="text-[#f0b90b]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#eaecef] truncate">{u.first_name} {u.last_name}</p>
                      <p className="text-[10px] text-[#848e9c] truncate">{u.email}</p>
                    </div>
                  </div>
                ))}
                {recentUsers.length === 0 && <p className="text-xs text-[#848e9c]">No users yet</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Nav Icon Grid — always visible, always at bottom ── */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-2xl p-4">
        <p className="text-xs font-semibold text-[#848e9c] uppercase tracking-wide mb-3">Admin Panels</p>
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
          {NAV_ICONS.map(({ id, label, icon: Icon, color }) => {
            const active = expandedTab === id
            return (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  active
                    ? 'border-opacity-50 bg-[#1e2329]'
                    : 'border-[#2b3139] hover:border-[#3c4451] hover:bg-[#1e2329]/60'
                }`}
                style={{ borderColor: active ? color : undefined }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}${active ? '25' : '15'}` }}
                >
                  <Icon size={15} style={{ color }} />
                </div>
                <span
                  className="text-[9px] font-medium text-center leading-tight"
                  style={{ color: active ? color : '#848e9c' }}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
