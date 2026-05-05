import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getEvents, getBotStatus } from '../lib/api'
import { useLivePrices } from '../hooks/useLivePrices'
import {
  TrendingUp, TrendingDown, Zap, Activity, ArrowDownLeft,
  ArrowUpRight, History, Bot, BarChart2, RefreshCw, Eye, EyeOff,
  ArrowRight, Bitcoin
} from 'lucide-react'

const mockPositions = [
  { asset: 'BTC/USDT', amount: '0.0842', value: '$5,674', pnl: '+$312', pnlPct: '+5.8%', up: true  },
  { asset: 'ETH/USDT', amount: '1.250',  value: '$4,401', pnl: '+$88',  pnlPct: '+2.0%', up: true  },
  { asset: 'AAPL',     amount: '8',      value: '$1,538', pnl: '-$24',  pnlPct: '-1.5%', up: false },
  { asset: 'NVDA',     amount: '1.5',    value: '$1,312', pnl: '+$187', pnlPct: '+16.7%',up: true  },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { btcPrice, btcChange, ethPrice, ethChange, loading: priceLoading, refetch } = useLivePrices(60000)
  const [events, setEvents] = useState<{ id: number; description: string; event_type: string; tickers_affected: string[]; created_at: string }[]>([])
  const [botRunning, setBotRunning] = useState(false)
  const [hideBalance, setHideBalance] = useState(false)
  const [btcToggle, setBtcToggle] = useState<'BTC' | 'ETH'>('BTC')

  const balance = user?.balance_usdt ?? 0
  const todayPnl = 324.20
  const todayPct = 2.57
  const displayPrice  = (btcToggle === 'BTC' ? btcPrice  : ethPrice)  ?? (btcToggle === 'BTC' ? 67432.10 : 3521.80)
  const displayChange = (btcToggle === 'BTC' ? btcChange : ethChange) ?? (btcToggle === 'BTC' ? 2.4 : 1.8)
  const btcEquiv      = displayPrice > 0 ? (balance / displayPrice).toFixed(6) : '—'

  const fetchData = useCallback(async () => {
    getEvents(5).then(r => {
      const data = r.data
      setEvents(Array.isArray(data) ? data : (data?.events ?? []))
    }).catch(() => {})
    getBotStatus().then(r => setBotRunning(r.data?.running ?? false)).catch(() => {})
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const firstName = user?.first_name || user?.email?.split('@')[0] || 'Trader'

  return (
    <div className="space-y-4">

      {/* ── Hero balance header ── */}
      <div className="relative rounded-2xl overflow-hidden" style={{
        background: 'linear-gradient(135deg, #1a1105 0%, #2a1f00 40%, #1e2329 100%)',
        borderBottom: '1px solid #2b3139',
      }}>
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(ellipse at top left, rgba(240,185,11,0.12) 0%, transparent 60%)',
        }} />

        <div className="relative p-5">
          {/* Greeting row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-[#848e9c] font-medium">{getGreeting()},</p>
              <p className="text-base font-bold text-[#eaecef] leading-tight">{firstName}</p>
            </div>
            <button onClick={() => setHideBalance(h => !h)}
              className="w-8 h-8 rounded-full bg-[#0b0e11]/60 flex items-center justify-center text-[#848e9c] hover:text-[#eaecef] transition border border-[#2b3139]/60">
              {hideBalance ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>

          {/* Balance */}
          <div className="mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#848e9c] mb-1">Total Balance</p>
            <p className="text-4xl font-extrabold font-mono text-[#eaecef] leading-none tracking-tight">
              {hideBalance ? '••••••' : `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </p>
          </div>

          {/* BTC/ETH rate */}
          <div className="flex items-center gap-3 mt-2 mb-5">
            <div className="flex items-center gap-1 bg-[#0b0e11]/50 rounded-lg p-1">
              {(['BTC', 'ETH'] as const).map(c => (
                <button key={c} onClick={() => setBtcToggle(c)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${btcToggle === c ? 'bg-[#f0b90b] text-black' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
                  {c}
                </button>
              ))}
            </div>
            {priceLoading ? (
              <div className="h-3 w-24 bg-[#2b3139] rounded animate-pulse" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#848e9c] font-mono">
                  {hideBalance ? '••••••' : btcEquiv} {btcToggle}
                </span>
                <span className="text-[10px] text-[#848e9c]">·</span>
                <span className="text-[10px] text-[#848e9c]">
                  Rate: 1 {btcToggle} = ${displayPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                <button onClick={refetch} className="text-[#848e9c] hover:text-[#f0b90b] transition">
                  <RefreshCw size={10} />
                </button>
              </div>
            )}
          </div>

          {/* 3 action buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Deposit',  icon: ArrowDownLeft,  path: '/app/wallet', color: 'text-[#0ecb81]', bg: 'bg-[#0ecb81]/10 hover:bg-[#0ecb81]/20 border-[#0ecb81]/20' },
              { label: 'Trade',    icon: TrendingUp,      path: '/app/trade',  color: 'text-[#f0b90b]', bg: 'bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 border-[#f0b90b]/20' },
              { label: 'History',  icon: History,         path: '/app/history',color: 'text-[#848e9c]', bg: 'bg-[#2b3139]/50 hover:bg-[#2b3139] border-[#2b3139]/60' },
            ].map(({ label, icon: Icon, path, color, bg }) => (
              <button key={label} onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${bg}`}>
                <Icon size={18} className={color} />
                <span className="text-[11px] font-semibold text-[#eaecef]">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Today's P&L strip ── */}
      <div className="flex items-center justify-between bg-[#161a1e] border border-[#2b3139] rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-[#0ecb81]" />
          <span className="text-xs text-[#848e9c]">Today's P&L</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold font-mono text-[#0ecb81]">+${todayPnl.toFixed(2)}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#0ecb81]/10 text-[#0ecb81] font-medium">+{todayPct}%</span>
        </div>
      </div>

      {/* ── Activity Center ── */}
      <div>
        <p className="text-xs font-bold text-[#eaecef] mb-3">Activity Center</p>
        <div className="grid grid-cols-2 gap-3">
          {/* Live price card */}
          <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#f0b90b] mb-2">LIVE PRICE</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-[#f0b90b]/10 flex items-center justify-center flex-shrink-0">
                <Bitcoin size={14} className="text-[#f0b90b]" />
              </div>
              <span className="text-xs font-semibold text-[#eaecef]">{btcToggle} Trading</span>
            </div>
            {priceLoading ? (
              <div className="h-5 bg-[#2b3139] rounded animate-pulse mb-1" />
            ) : (
              <p className="text-lg font-bold font-mono text-[#eaecef] leading-tight">
                ${displayPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            )}
            <p className={`text-xs flex items-center gap-0.5 mt-0.5 font-semibold ${displayChange >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {displayChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)}% 24h
            </p>
          </div>

          {/* Bot status card */}
          <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#f0b90b] mb-2">AI BOT</p>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${botRunning ? 'bg-[#0ecb81]/10' : 'bg-[#2b3139]'}`}>
                <Bot size={14} className={botRunning ? 'text-[#0ecb81]' : 'text-[#848e9c]'} />
              </div>
              <span className="text-xs font-semibold text-[#eaecef]">FinAi Bot</span>
            </div>
            <p className="text-lg font-bold text-[#eaecef] leading-tight">
              {botRunning ? 'Live' : 'Offline'}
            </p>
            <p className={`text-xs font-semibold mt-0.5 ${botRunning ? 'text-[#0ecb81]' : 'text-[#848e9c]'}`}>
              {botRunning ? 'Trading active' : 'Start in Bots'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick Access ── */}
      <div>
        <p className="text-xs font-bold text-[#eaecef] mb-3">Quick Access</p>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Trade',    icon: TrendingUp,  path: '/app/trade',   color: 'text-[#f0b90b]', bg: 'bg-[#f0b90b]/10' },
            { label: 'Deposit',  icon: ArrowDownLeft,path: '/app/wallet',  color: 'text-[#0ecb81]', bg: 'bg-[#0ecb81]/10' },
            { label: 'Withdraw', icon: ArrowUpRight, path: '/app/wallet',  color: 'text-[#f6465d]', bg: 'bg-[#f6465d]/10' },
            { label: 'Markets',  icon: BarChart2,    path: '/app/markets', color: 'text-[#848e9c]', bg: 'bg-[#2b3139]'    },
            { label: 'Bots',     icon: Zap,          path: '/app/bots',    color: 'text-[#f0b90b]', bg: 'bg-[#f0b90b]/10' },
            { label: 'History',  icon: History,      path: '/app/history', color: 'text-[#848e9c]', bg: 'bg-[#2b3139]'    },
          ].map(({ label, icon: Icon, path, color, bg }) => (
            <button key={label} onClick={() => navigate(path)}
              className="flex flex-col items-center gap-2 bg-[#161a1e] border border-[#2b3139] rounded-xl py-4 hover:border-[#3c4451] hover:bg-[#1e2329] transition-all">
              <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center`}>
                <Icon size={16} className={color} />
              </div>
              <span className="text-[11px] font-semibold text-[#848e9c]">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── AI Events ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[#eaecef]">AI Market Events</p>
          <Zap size={12} className="text-[#f0b90b]" />
        </div>
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl divide-y divide-[#2b3139]">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Activity size={20} className="text-[#2b3139]" />
              <p className="text-xs text-[#848e9c]">No recent events</p>
            </div>
          ) : events.slice(0, 4).map((ev, i) => (
            <div key={i} className="px-4 py-3 hover:bg-[#1e2329] transition">
              <p className="text-xs text-[#eaecef] leading-relaxed line-clamp-2">{ev.description ?? ev.event_type}</p>
              <p className="text-[10px] text-[#848e9c] mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f0b90b] inline-block" />
                {ev.tickers_affected?.[0] ?? 'Market'} · {ev.created_at ? new Date(ev.created_at).toLocaleDateString() : ''}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Open Positions ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[#eaecef]">Open Positions</p>
          <button onClick={() => navigate('/app/trade')}
            className="flex items-center gap-1 text-[10px] text-[#f0b90b] hover:text-[#d4a30a] transition">
            View all <ArrowRight size={10} />
          </button>
        </div>
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl divide-y divide-[#2b3139]">
          {mockPositions.map(p => (
            <div key={p.asset} className="flex items-center justify-between px-4 py-3 hover:bg-[#1e2329] transition">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#f0b90b]/10 flex items-center justify-center text-[11px] font-bold text-[#f0b90b] flex-shrink-0">
                  {p.asset[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#eaecef]">{p.asset}</p>
                  <p className="text-[10px] text-[#848e9c]">{p.value}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xs font-bold font-mono ${p.up ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>{p.pnl}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${p.up ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#f6465d]/10 text-[#f6465d]'}`}>
                  {p.pnlPct}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
