import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getEvents, getBotStatus } from '../lib/api'
import { useLivePrices } from '../hooks/useLivePrices'
import {
  TrendingUp, TrendingDown, Zap, Activity, Wallet,
  DollarSign, BarChart2, Bot, Play, ArrowRight, Bitcoin, RefreshCw
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const mockChartData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  portfolio: 10000 + Math.sin(i * 0.4) * 1200 + i * 80 + (Math.random() - 0.5) * 400,
}))

const mockPositions = [
  { asset: 'BTC/USDT', amount: '0.0842', value: '$5,674', pnl: '+$312', pnlPct: '+5.8%', up: true  },
  { asset: 'ETH/USDT', amount: '1.250',  value: '$4,401', pnl: '+$88',  pnlPct: '+2.0%', up: true  },
  { asset: 'AAPL',     amount: '8',      value: '$1,538', pnl: '-$24',  pnlPct: '-1.5%', up: false },
  { asset: 'NVDA',     amount: '1.5',    value: '$1,312', pnl: '+$187', pnlPct: '+16.7%',up: true  },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { btcPrice, btcChange, ethPrice, ethChange, loading: priceLoading, refetch } = useLivePrices(60000)
  const [events, setEvents] = useState<{ id: number; description: string; event_type: string; tickers_affected: string[]; created_at: string }[]>([])
  const [btcToggle, setBtcToggle] = useState<'BTC' | 'ETH'>('BTC')
  const [botRunning, setBotRunning] = useState(false)

  const balance = user?.balance_usdt ?? 0
  const todayPnl = 324.20
  const todayPct = 2.57

  useEffect(() => {
    getEvents(5).then(r => {
      const data = r.data
      setEvents(Array.isArray(data) ? data : (data?.events ?? []))
    }).catch(() => {})
    getBotStatus().then(r => setBotRunning(r.data?.running ?? false)).catch(() => {})
  }, [])

  const displayPrice  = (btcToggle === 'BTC' ? btcPrice  : ethPrice)  ?? (btcToggle === 'BTC' ? 67432.10 : 3521.80)
  const displayChange = (btcToggle === 'BTC' ? btcChange : ethChange) ?? (btcToggle === 'BTC' ? 2.4 : 1.8)

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── Balance hero ── */}
      <div className="relative bg-gradient-to-br from-[#1e2329] via-[#181d22] to-[#161a1e] border border-[#2b3139] rounded-2xl p-5 sm:p-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(ellipse at top right, rgba(240,185,11,0.07) 0%, transparent 60%)',
        }} />
        <div className="relative">
          <p className="text-xs text-[#848e9c] font-medium mb-2 flex items-center gap-1.5">
            <Wallet size={12} /> Available Balance
          </p>
          <div className="flex flex-wrap items-end gap-3 mb-5">
            <span className="text-3xl sm:text-4xl font-bold font-mono text-[#eaecef]">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-medium flex items-center gap-1 pb-1 text-[#0ecb81]">
              <TrendingUp size={13} />+${todayPnl.toFixed(2)} ({todayPct}%) today
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Crypto',      value: '$10,075', icon: Bitcoin,     color: 'text-[#f0b90b]', bg: 'bg-[#f0b90b]/10' },
              { label: 'Stocks',      value: '$2,851',  icon: BarChart2,   color: 'text-[#0ecb81]', bg: 'bg-[#0ecb81]/10' },
              { label: 'Cash (USDT)', value: `$${balance.toFixed(2)}`, icon: DollarSign, color: 'text-[#848e9c]', bg: 'bg-[#2b3139]' },
            ].map(s => (
              <div key={s.label} className="bg-[#0b0e11]/60 rounded-xl p-3 border border-[#2b3139]/60">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className={`w-5 h-5 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon size={10} className={s.color} />
                  </div>
                  <span className="text-[10px] text-[#848e9c] font-medium">{s.label}</span>
                </div>
                <p className="text-sm font-bold font-mono text-[#eaecef]">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Today's P&L",  value: `+$${todayPnl.toFixed(2)}`, sub: `+${todayPct}%`,            up: true,        icon: TrendingUp },
          { label: 'Win Rate',     value: '68.4%',                    sub: 'Last 30 days',             up: true,        icon: Activity   },
          { label: 'AI Bots',      value: botRunning ? '1' : '0',     sub: botRunning ? 'Running' : 'Stopped', up: botRunning, icon: Zap },
          { label: 'AI Events',    value: String(events.length),      sub: 'Detected today',           up: true,        icon: BarChart2  },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#848e9c]">{s.label}</span>
                <div className="w-7 h-7 rounded-lg bg-[#f0b90b]/10 flex items-center justify-center">
                  <Icon size={13} className="text-[#f0b90b]" />
                </div>
              </div>
              <p className="text-xl font-bold font-mono text-[#eaecef]">{s.value}</p>
              <p className={`text-xs mt-1 font-medium ${s.up ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>{s.sub}</p>
            </div>
          )
        })}
      </div>

      {/* ── Chart + live price ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Portfolio chart */}
        <div className="lg:col-span-2 bg-[#161a1e] border border-[#2b3139] rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#eaecef]">Portfolio Performance</h2>
            <div className="flex gap-1">
              {['1D', '1W', '1M'].map((p, i) => (
                <button key={p} className={`text-xs px-2.5 py-1 rounded-lg transition ${i === 0 ? 'bg-[#f0b90b] text-black font-semibold' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>{p}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mockChartData} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f0b90b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f0b90b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
              <XAxis dataKey="time" tick={{ fill: '#848e9c', fontSize: 9 }} tickLine={false} axisLine={false} interval={5} />
              <YAxis tick={{ fill: '#848e9c', fontSize: 9 }} tickLine={false} axisLine={false}
                tickFormatter={v => `$${((v as number) / 1000).toFixed(0)}k`} width={38} />
              <Tooltip
                contentStyle={{ background: '#1e2329', border: '1px solid #2b3139', borderRadius: 10, fontSize: 11 }}
                labelStyle={{ color: '#848e9c' }}
                itemStyle={{ color: '#f0b90b' }}
                formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, 'Portfolio']}
              />
              <Area type="monotone" dataKey="portfolio" stroke="#f0b90b" strokeWidth={2} fill="url(#pgGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* BTC/ETH live price */}
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-[#0b0e11] rounded-xl p-1">
              {(['BTC', 'ETH'] as const).map(coin => (
                <button key={coin} onClick={() => setBtcToggle(coin)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${btcToggle === coin ? 'bg-[#f0b90b] text-black' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
                  {coin}
                </button>
              ))}
            </div>
            <button onClick={refetch} className="text-[#848e9c] hover:text-[#eaecef] transition p-1">
              <RefreshCw size={13} className={priceLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex-1">
            <p className="text-[10px] text-[#848e9c] font-medium mb-1">{btcToggle}/USDT · Live</p>
            {priceLoading && !displayPrice ? (
              <div className="h-10 bg-[#2b3139] rounded-lg animate-pulse" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold font-mono text-[#eaecef]">
                ${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            )}
            <p className={`text-sm font-semibold mt-2 flex items-center gap-1 ${displayChange >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {displayChange >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)}% (24h)
            </p>
          </div>

          <button onClick={() => navigate('/app/trade')}
            className="w-full bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 text-[#f0b90b] text-xs font-semibold py-3 rounded-xl transition flex items-center justify-center gap-1.5">
            Trade {btcToggle} <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* ── Bot status + Events + Positions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bot card */}
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#eaecef]">AI Bot Status</h2>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${botRunning ? 'bg-[#0ecb81]/10 text-[#0ecb81] border-[#0ecb81]/20' : 'bg-[#2b3139] text-[#848e9c] border-transparent'}`}>
              {botRunning ? '● Live' : '○ Offline'}
            </span>
          </div>
          <div className="flex flex-col items-center py-3 gap-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${botRunning ? 'bg-[#0ecb81]/10 border-2 border-[#0ecb81]/30 shadow-lg shadow-[#0ecb81]/10' : 'bg-[#0b0e11] border-2 border-[#2b3139]'}`}>
              <Bot size={24} className={botRunning ? 'text-[#0ecb81]' : 'text-[#848e9c]'} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#eaecef]">FinAi Trading Bot</p>
              <p className="text-xs text-[#848e9c] mt-0.5">{botRunning ? 'Account Trading · Grok AI' : 'Start the bot to begin'}</p>
            </div>
          </div>
          <button onClick={() => navigate('/app/bots')}
            className="w-full flex items-center justify-center gap-2 bg-[#f0b90b] hover:bg-[#d4a30a] text-black text-sm font-bold py-3 rounded-xl transition">
            <Play size={13} /> Manage Bots
          </button>
        </div>

        {/* AI Events */}
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#2b3139] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#eaecef]">AI Market Events</h2>
            <Zap size={13} className="text-[#f0b90b]" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10">
                <Activity size={24} className="text-[#2b3139]" />
                <p className="text-xs text-[#848e9c]">No recent events</p>
              </div>
            ) : events.slice(0, 5).map((ev, i) => (
              <div key={i} className="px-4 py-3 border-b border-[#2b3139]/50 hover:bg-[#1e2329] transition">
                <p className="text-xs text-[#eaecef] leading-relaxed line-clamp-2">{ev.description ?? ev.event_type}</p>
                <p className="text-[10px] text-[#848e9c] mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f0b90b] inline-block" />
                  {ev.tickers_affected?.[0] ?? ''} · {ev.created_at ? new Date(ev.created_at).toLocaleDateString() : ''}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Open positions */}
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2b3139] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#eaecef]">Open Positions</h2>
            <span className="text-xs text-[#848e9c]">{mockPositions.length}</span>
          </div>
          <div className="divide-y divide-[#2b3139]/50">
            {mockPositions.map(p => (
              <div key={p.asset} className="flex items-center justify-between px-4 py-3 hover:bg-[#1e2329] transition">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#f0b90b]/10 flex items-center justify-center text-[10px] font-bold text-[#f0b90b] flex-shrink-0">
                    {p.asset[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#eaecef]">{p.asset}</p>
                    <p className="text-[10px] text-[#848e9c]">{p.value}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold font-mono ${p.up ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>{p.pnl}</p>
                  <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-0.5 ${p.up ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#f6465d]/10 text-[#f6465d]'}`}>
                    {p.pnlPct}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
