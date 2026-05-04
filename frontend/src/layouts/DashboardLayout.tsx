import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard, TrendingUp, BarChart2, Wallet,
  Settings, ShieldCheck, LogOut, Zap, Bell, ChevronDown
} from 'lucide-react'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/markets', icon: BarChart2, label: 'Markets' },
  { to: '/trade', icon: TrendingUp, label: 'Trade' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#0b0e11] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#161a1e] border-r border-[#2b3139] flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[#2b3139]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#f0b90b] flex items-center justify-center">
              <Zap size={16} className="text-black" />
            </div>
            <span className="text-[#f0b90b] font-bold text-lg tracking-tight">FinAi</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#f0b90b]/10 text-[#f0b90b]'
                  : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139]'
              )}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          {user?.is_admin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#f6465d]/10 text-[#f6465d]'
                  : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139]'
              )}
            >
              <ShieldCheck size={16} />
              Admin Panel
            </NavLink>
          )}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-[#2b3139]">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[#2b3139] cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-[#f0b90b] flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#eaecef] text-xs font-medium truncate">{user?.email ?? 'User'}</p>
              <p className="text-[#848e9c] text-xs">{user?.is_admin ? 'Admin' : 'Member'}</p>
            </div>
            <ChevronDown size={14} className="text-[#848e9c] flex-shrink-0" />
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#848e9c] hover:text-[#f6465d] hover:bg-[#f6465d]/10 transition-all"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 border-b border-[#2b3139] bg-[#161a1e] flex items-center justify-between px-6">
          <TickerBar />
          <button className="w-8 h-8 rounded-full bg-[#2b3139] flex items-center justify-center hover:bg-[#3c4451] transition">
            <Bell size={15} className="text-[#848e9c]" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const TICKERS = [
  { symbol: 'BTC/USDT', price: 67432, change: 2.4 },
  { symbol: 'ETH/USDT', price: 3521, change: 1.8 },
  { symbol: 'AAPL', price: 192.35, change: 0.9 },
  { symbol: 'TSLA', price: 248.7, change: -1.2 },
  { symbol: 'SPY', price: 530.4, change: 0.5 },
  { symbol: 'NVDA', price: 875, change: 3.1 },
]

function TickerBar() {
  return (
    <div className="flex items-center gap-6 overflow-hidden">
      {TICKERS.map((t) => (
        <div key={t.symbol} className="flex items-center gap-2 text-xs whitespace-nowrap">
          <span className="text-[#848e9c]">{t.symbol}</span>
          <span className="text-[#eaecef] font-mono font-medium">${t.price.toLocaleString()}</span>
          <span className={t.change >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
            {t.change >= 0 ? '▲' : '▼'} {Math.abs(t.change)}%
          </span>
        </div>
      ))}
    </div>
  )
}
