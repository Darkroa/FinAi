import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEvents, getBotStatus } from '../lib/api'
import { useLivePrices } from '../hooks/useLivePrices'
import {
  TrendingUp, TrendingDown, Zap, Activity,
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
  { asset: 'BTC/USDT', amount: '0.0842', value: '$5,674.12', pnl: '+$312.40', pnlPct: '+5.8%', up: true },
  { asset: 'ETH/USDT', amount: '1.250', value: '$4,401.25', pnl: '+$88.30', pnlPct: '+2.0%', up: true },
  { asset: 'AAPL', amount: '8', value: '$1,538.80', pnl: '-$24.00', pnlPct: '-1.5%', up: false },
  { asset: 'NVDA', amount: '1.5', value: '$1,312.50', pnl: '+$187.50', pnlPct: '+16.7%', up: true },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { btcPrice, btcChange, ethPrice, ethChange, loading: priceLoading, refetch } = useLivePrices(60000)
  const [events, setEvents] = useState<{
    id: number; description: string; event_type: string; tickers_affected: string[]; created_at: string
  }[]>([])
  const [btcToggle, setBtcToggle] = useState<'BTC' | 'ETH'>('BTC')
  const [botRunning, setBotRunning] = useState(false)

  const totalBalance = 12927.67
  const todayPnl = 324.20
  const todayPct = 2.57

  useEffect(() => {
    getEvents(5).then(r => {
      const data = r.data
      setEvents(Array.isArray(data) ? data : (data?.events ?? []))
    }).catch(() => {})
    getBotStatus().then(r => setBotRunning(r.data?.running ?? false)).catch(() => {})
  }, [])

  const livePrice = btcToggle === 'BTC' ? btcPrice : ethPrice
  const liveChange = btcToggle === 'BTC' ? btcChange : ethChange
  const fallbackPrice = btcToggle === 'BTC' ? 67432.10 : 3521.80
  const fallbackChange = btcToggle === 'BTC' ? 2.4 : 1.8
  const displayPrice = livePrice ?? fallbackPrice
  const displayChange = liveChange ?? fallbackChange

  return (
    <div className="space-y-5">

      {/* ── Row 1: Balance hero + BTC/ETH price card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Balance card (spans 2 cols) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#1e2329] to-[#161a1e] border border-[#2b3139] rounded-2xl p-6">
          <p className="text-xs text-[#848e9c] font-medium mb-1">Total Portfolio Value</p>

          <div className="flex flex-wrap items-end gap-3 mb-5">
            <span className="text-4xl font-bold font-mono text-[#eaecef]">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-sm font-medium flex items-center gap-1 pb-1 ${todayPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {todayPnl >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              +${todayPnl.toFixed(2)} ({todayPct}%) today
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Crypto', value: '$10,075.37', icon: Bitcoin, color: 'text-[#f0b90b]' },
              { label: 'Stocks', value: '$2,851.30', icon: BarChart2, color: 'text-[#0ecb81]' },
              { label: 'Cash (USDT)', value: '$1.00', icon: DollarSign, color: 'text-[#848e9c]' },
            ].map(s => (
              <div key={s.label} className="bg-[#0b0e11] rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <s.icon size={12} className={s.color} />
                  <span className="text-[10px] text-[#848e9c] font-medium">{s.label}</span>
                </div>
                <p className="text-sm font-bold font-mono text-[#eaecef]">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BTC / ETH live price card */}
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-2xl p-5 flex flex-col gap-4">
          {/* Toggle + refresh */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-[#0b0e11] rounded-xl p-1">
              {(['BTC', 'ETH'] as const).map(coin => (
                <button
                  key={coin}
                  onClick={() => setBtcToggle(coin)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    btcToggle === coin
                      ? 'bg-[#f0b90b] text-black'
                      : 'text-[#848e9c] hover:text-[#eaecef]'
                  }`}
                >
                  {coin}
                </button>
              ))}
            </div>
            <button
              onClick={refetch}
              title="Refresh price"
              className="text-[#848e9c] hover:text-[#eaecef] transition"
            >
              <RefreshCw size={13} className={priceLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Price display */}
          <div className="flex-1">
            <p className="text-[10px] text-[#848e9c] font-medium mb-1">
              {btcToggle}/USDT · Live
            </p>
            {priceLoading && !livePrice ? (
              <div className="h-10 bg-[#2b3139] rounded-lg animate-pulse" />
            ) : (
              <p className="text-3xl font-bold font-mono text-[#eaecef]">
                ${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            )}
            <p className={`text-sm font-medium mt-1 flex items-center gap-1 ${displayChange >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {displayChange >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)}%&nbsp;(24h)
            </p>
          </div>

          {/* Trade button */}
          <button
            onClick={() => navigate('/app/trade')}
            className="w-full bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 text-[#f0b90b] text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            Trade {btcToggle} <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* ── Row 2: Quick stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's P&L", value: `+$${todayPnl.toFixed(2)}`, sub: `+${todayPct}%`, up: true, icon: TrendingUp },
          { label: 'Win Rate', value: '68.4%', sub: 'Last 30 days', up: true, icon: Activity },
          { label: 'Active Bots', value: botRunning ? '1' : '0', sub: botRunning ? 'Running' : 'Stopped', up: botRunning, icon: Zap },
          { label: 'AI Events', value: String(events.length), sub: 'Detected', up: true, icon: BarChart2 },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#848e9c] font-medium">{s.label}</span>
                <div className="w-7 h-7 rounded-lg bg-[#f0b90b]/10 flex items-center justify-center">
                  <Icon size={13} className="text-[#f0b90b]" />
                </div>
              </div>
              <p className="text-xl font-bold font-mono text-[#eaecef]">{s.value}</p>
              <p className={`text-xs mt-1 ${s.up ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>{s.sub}</p>
            </div>
          )
        })}
      </div>

      {/* ── Row 3: Chart + Events ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Portfolio chart */}
        <div className="lg:col-span-2 bg-[#161a1e] border border-[#2b3139] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#eaecef]">Portfolio Performance</h2>
            <div className="flex gap-1">
              {['1D', '1W', '1M', '3M'].map(p => (
                <button
                  key={p}
                  className={`text-xs px-2.5 py-1 rounded-lg transition ${
                    p === '1D' ? 'bg-[#f0b90b] text-black font-medium' : 'text-[#848e9c] hover:text-[#eaecef]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={mockChartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f0b90b" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f0b90b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#848e9c', fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                interval={5}
              />
              <YAxis
                tick={{ fill: '#848e9c', fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `$${((v as number) / 1000).toFixed(1)}k`}
                width={45}
              />
              <Tooltip
                contentStyle={{ background: '#1e2329', border: '1px solid #2b3139', borderRadius: 8 }}
                labelStyle={{ color: '#848e9c', fontSize: 10 }}
                itemStyle={{ color: '#f0b90b', fontSize: 10 }}
                formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, 'Portfolio']}
              />
              <Area
                type="monotone"
                dataKey="portfolio"
                stroke="#f0b90b"
                strokeWidth={2}
                fill="url(#pgGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* AI Events feed */}
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-[#eaecef] mb-3">AI Market Events</h2>
          {events.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <Activity size={28} className="text-[#2b3139]" />
              <p className="text-xs text-[#848e9c]">No recent events</p>
            </div>
          ) : (
            <div className="space-y-2 flex-1">
              {events.slice(0, 5).map((ev, i) => (
                <div key={i} className="p-3 rounded-xl bg-[#0b0e11] border border-[#2b3139]">
                  <p className="text-xs text-[#eaecef] leading-relaxed line-clamp-2">
                    {ev.description ?? ev.event_type}
                  </p>
                  <p className="text-[10px] text-[#848e9c] mt-1">
                    {ev.tickers_affected?.[0] ?? ''}&nbsp;·&nbsp;
                    {ev.created_at ? new Date(ev.created_at).toLocaleDateString() : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Bot status + Open positions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bot quick status */}
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#eaecef]">AI Bot Status</h2>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              botRunning
                ? 'bg-[#0ecb81]/10 text-[#0ecb81] border border-[#0ecb81]/20'
                : 'bg-[#2b3139] text-[#848e9c]'
            }`}>
              {botRunning ? 'Live' : 'Offline'}
            </span>
          </div>

          <div className="flex flex-col items-center py-2 gap-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              botRunning
                ? 'bg-[#0ecb81]/10 border-2 border-[#0ecb81]/30'
                : 'bg-[#0b0e11] border-2 border-[#2b3139]'
            }`}>
              <Bot size={24} className={botRunning ? 'text-[#0ecb81]' : 'text-[#848e9c]'} />
            </div>
            <p className="text-xs text-[#848e9c] text-center leading-relaxed">
              {botRunning ? 'Bot is actively trading on paper mode' : 'Bot is not running'}
            </p>
          </div>

          <button
            onClick={() => navigate('/app/bots')}
            className="w-full flex items-center justify-center gap-2 bg-[#f0b90b] hover:bg-[#d4a30a] text-black text-xs font-semibold py-2.5 rounded-xl transition-all"
          >
            <Play size={12} /> Manage Bots
          </button>
        </div>

        {/* Positions table */}
        <div className="lg:col-span-2 bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#2b3139] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#eaecef]">Open Positions</h2>
            <span className="text-xs text-[#848e9c]">{mockPositions.length} positions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#848e9c] text-xs border-b border-[#2b3139]">
                  <th className="text-left px-5 py-3 font-medium">Asset</th>
                  <th className="text-right px-4 py-3 font-medium">Value</th>
                  <th className="text-right px-4 py-3 font-medium">P&L</th>
                  <th className="text-right px-5 py-3 font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {mockPositions.map(p => (
                  <tr key={p.asset} className="border-b border-[#2b3139]/40 hover:bg-[#1e2329] transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#f0b90b]/10 flex items-center justify-center text-[10px] font-bold text-[#f0b90b] flex-shrink-0">
                          {p.asset[0]}
                        </div>
                        <span className="font-medium text-[#eaecef] text-sm">{p.asset}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-[#eaecef]">{p.value}</td>
                    <td className={`px-4 py-3 text-right font-mono text-xs ${p.up ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {p.pnl}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-md ${
                        p.up ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#f6465d]/10 text-[#f6465d]'
                      }`}>
                        {p.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        {p.pnlPct}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}
