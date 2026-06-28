import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import AdminPage from './AdminPage'
import AdminDashboardPage from './AdminDashboardPage'
import {
  ShieldCheck, LogOut, User, BarChart2, Activity,
  ChevronLeft, ChevronRight, Zap, Monitor, LayoutDashboard,
  Settings, ExternalLink, Globe,
} from 'lucide-react'
import { cn } from '../lib/utils'

type View = 'overview' | 'panel' | 'grafana' | 'prometheus'

const NAV_ITEMS: { id: View; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'overview',   label: 'Overview',    icon: LayoutDashboard, color: '#f0b90b' },
  { id: 'panel',      label: 'Admin Panel',  icon: Settings,        color: '#a78bfa' },
  { id: 'grafana',    label: 'Grafana',      icon: BarChart2,       color: '#f46800' },
  { id: 'prometheus', label: 'Prometheus',   icon: Activity,        color: '#e6522c' },
]

function MonitorFrame({ title, storageKey, defaultUrl, accentColor }: {
  title: string
  storageKey: string
  defaultUrl: string
  accentColor: string
}) {
  const [url, setUrl] = useState(() => localStorage.getItem(storageKey) || defaultUrl)
  const [inputUrl, setInputUrl] = useState(url)
  const [editing, setEditing] = useState(false)
  const [key, setKey] = useState(0)

  const applyUrl = () => {
    const trimmed = inputUrl.trim()
    setUrl(trimmed)
    localStorage.setItem(storageKey, trimmed)
    setEditing(false)
    setKey(k => k + 1)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#161a1e] border-b border-[#2b3139] flex-shrink-0">
        <Monitor size={14} style={{ color: accentColor }} />
        <span className="text-sm font-semibold text-[#eaecef]">{title}</span>
        {!editing ? (
          <>
            <span className="text-xs text-[#848e9c] truncate max-w-xs">{url}</span>
            <button
              onClick={() => { setInputUrl(url); setEditing(true) }}
              className="ml-auto text-xs text-[#848e9c] hover:text-[#eaecef] transition px-2 py-0.5 rounded border border-[#2b3139] hover:border-[#3c4451]"
            >
              Change URL
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="text-xs flex items-center gap-1 text-[#848e9c] hover:text-[#eaecef] transition">
              <ExternalLink size={12} /> Open
            </a>
          </>
        ) : (
          <form onSubmit={e => { e.preventDefault(); applyUrl() }} className="flex items-center gap-2 flex-1 ml-2">
            <input
              type="text"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              autoFocus
              placeholder="http://..."
              className="flex-1 bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-1 text-xs text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition"
            />
            <button type="submit"
              className="text-xs bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-semibold px-3 py-1 rounded-lg transition">
              Apply
            </button>
            <button type="button" onClick={() => setEditing(false)}
              className="text-xs text-[#848e9c] hover:text-[#eaecef] transition px-2 py-1">
              Cancel
            </button>
          </form>
        )}
      </div>
      <div className="flex-1 relative">
        <iframe
          key={key}
          src={url}
          className="w-full h-full border-0"
          title={title}
          allow="fullscreen"
        />
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
        </div>
      </div>
    </div>
  )
}

export default function AdminFullDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [view, setView] = useState<View>('overview')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/admin-login', { replace: true })
    }
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const switchToUserView = () => {
    navigate('/app/dashboard')
  }

  if (!user?.is_admin) return null

  return (
    <div className="flex h-screen bg-[#0b0e11] overflow-hidden">
      <aside className={cn(
        'flex-shrink-0 flex flex-col bg-[#161a1e] border-r border-[#2b3139] transition-all duration-200',
        collapsed ? 'w-14' : 'w-56'
      )}>
        <div className={cn(
          'flex items-center border-b border-[#2b3139] h-14 px-3 gap-2.5 flex-shrink-0',
          collapsed && 'justify-center'
        )}>
          <div className="w-8 h-8 rounded-xl bg-[#f6465d] flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#eaecef] leading-tight">FinAi</p>
              <p className="text-[10px] text-[#f6465d] font-semibold leading-tight">Admin Panel</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(v => !v)}
            className={cn('text-[#848e9c] hover:text-[#eaecef] transition', collapsed ? '' : 'ml-auto')}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {!collapsed && (
          <div className="px-3 py-2.5 border-b border-[#2b3139] flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#f6465d]/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={13} className="text-[#f6465d]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#eaecef] truncate">
                  {user?.first_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-[#f6465d] font-medium">Administrator</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              title={collapsed ? label : undefined}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all',
                collapsed && 'justify-center',
                view === id
                  ? 'bg-white/5 text-[#eaecef]'
                  : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139]/60'
              )}
            >
              <Icon
                size={15}
                style={{ color: view === id ? color : undefined }}
                className={view === id ? '' : 'text-[#848e9c]'}
              />
              {!collapsed && (
                <span style={{ color: view === id ? color : undefined }}>{label}</span>
              )}
              {!collapsed && view === id && (
                <span className="ml-auto w-1 h-1 rounded-full" style={{ background: color }} />
              )}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-[#2b3139] flex-shrink-0 space-y-1">
          <button
            onClick={switchToUserView}
            title={collapsed ? 'User View' : undefined}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-[#0ecb81] hover:bg-[#0ecb81]/10 transition-all',
              collapsed && 'justify-center'
            )}
          >
            <User size={14} />
            {!collapsed && <span>User View</span>}
          </button>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign Out' : undefined}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-[#848e9c] hover:text-[#f6465d] hover:bg-[#f6465d]/10 transition-all',
              collapsed && 'justify-center'
            )}
          >
            <LogOut size={14} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col">
        {(view === 'grafana' || view === 'prometheus') ? (
          <div className="flex-1 overflow-hidden">
            {view === 'grafana' && (
              <MonitorFrame
                title="Grafana"
                storageKey="finai-grafana-url"
                defaultUrl="http://localhost:3000"
                accentColor="#f46800"
              />
            )}
            {view === 'prometheus' && (
              <MonitorFrame
                title="Prometheus"
                storageKey="finai-prometheus-url"
                defaultUrl="http://localhost:9090"
                accentColor="#e6522c"
              />
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pb-6">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#2b3139] bg-[#161a1e] flex-shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                {(() => {
                  const item = NAV_ITEMS.find(n => n.id === view)
                  if (!item) return null
                  const Icon = item.icon
                  return (
                    <>
                      <Icon size={16} style={{ color: item.color }} />
                      <span className="text-sm font-semibold text-[#eaecef]">{item.label}</span>
                    </>
                  )
                })()}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={switchToUserView}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#0ecb81] bg-[#0ecb81]/10 hover:bg-[#0ecb81]/20 px-3 py-1.5 rounded-lg transition"
                >
                  <User size={13} />
                  Switch to User View
                </button>
                <div className="flex items-center gap-1">
                  {(['grafana', 'prometheus'] as const).map(id => {
                    const item = NAV_ITEMS.find(n => n.id === id)!
                    const Icon = item.icon
                    return (
                      <button
                        key={id}
                        onClick={() => setView(id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-[#848e9c] hover:text-[#eaecef] bg-[#0b0e11] hover:bg-[#2b3139] px-2.5 py-1.5 rounded-lg transition border border-[#2b3139]"
                      >
                        <Icon size={12} style={{ color: item.color }} />
                        {item.label}
                        <Globe size={10} className="text-[#4a5568]" />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-5 lg:px-6 py-4">
              {view === 'overview' && <AdminDashboardPage />}
              {view === 'panel' && <AdminPage />}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
