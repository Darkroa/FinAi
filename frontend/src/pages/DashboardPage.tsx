import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { getEvents } from '../lib/api'
import { formatCurrency, formatPercent } from '../lib/utils'
import { TrendingUp, TrendingDown, Zap, Activity, DollarSign, BarChart2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const mockChartData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  portfolio: 10000 + Math.sin(i * 0.4) * 1200 + i * 80 + Math.random() * 400,
  btc: 65000 + Math.sin(i * 0.3) * 3000 + Math.random() * 1000,
}))

const mockStats = [
  { label: 'Portfolio Value', value: '$12,847.50', change: '+8.3%', up: true, icon: DollarSign },
  { label: 'Today\'s P&L', value: '+$324.20', change: '+2.6%', up: true, icon: TrendingUp },
  { label: 'Active Bots', value: '3', change: 'Running', up: true, icon: Zap },
  { label: 'Win Rate', value: '68.4%', change: 'Last 30d', up: true, icon: Activity },
]

const mockPositions = [
  { asset: 'BTC/USDT', amount: '0.0842', value: '$5,674.12', pnl: '+$312.40', pnlPct: '+5.8%', up: true },
  { asset: 'ETH/USDT', amount: '1.250', value: '$4,401.25', pnl: '+$88.30', pnlPct: '+2.0%', up: true },
  { asset: 'AAPL', amount: '8', value: '$1,538.80', pnl: '-$24.00', pnlPct: '-1.5%', up: false },
  { asset: 'NVDA', amount: '1.5', value: '$1,312.50', pnl: '+$187.50', pnlPct: '+16.7%', up: true },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    getEvents(5).then(r => setEvents(r.data)).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#eaecef]">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h1>
          <p className="text-sm text-[#848e9c] mt-0.5">Here's what's happening with your portfolio</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#848e9c]">Last updated</p>
          <p className="text-xs text-[#eaecef]">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        {mockStats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#848e9c] font-medium">{stat.label}</span>
                <div className="w-7 h-7 rounded-lg bg-[#f0b90b]/10 flex items-center justify-center">
                  <Icon size={13} className="text-[#f0b90b]" />
                </div>
              </div>
              <p className="text-xl font-bold text-[#eaecef] font-mono">{stat.value}</p>
              <p className={`text-xs mt-1 ${stat.up ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>{stat.change}</p>
            </div>
          )
        })}
      </div>

      {/* Chart + Events */}
      <div className="grid grid-cols-3 gap-4">
        {/* Portfolio chart */}
        <div className="col-span-2 bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#eaecef]">Portfolio Performance</h2>
            <div className="flex gap-2">
              {['1D', '1W', '1M', '3M'].map((p) => (
                <button key={p} className={`text-xs px-2.5 py-1 rounded-lg transition ${p === '1D' ? 'bg-[#f0b90b] text-black font-medium' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>{p}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockChartData}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f0b90b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f0b90b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
              <XAxis dataKey="time" tick={{ fill: '#848e9c', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#848e9c', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e2329', border: '1px solid #2b3139', borderRadius: 8 }}
                labelStyle={{ color: '#848e9c', fontSize: 11 }}
                itemStyle={{ color: '#f0b90b', fontSize: 11 }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, 'Value']}
              />
              <Area type="monotone" dataKey="portfolio" stroke="#f0b90b" strokeWidth={2} fill="url(#portfolioGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Events feed */}
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
          <h2 className="text-sm font-semibold text-[#eaecef] mb-4">AI Market Events</h2>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Activity size={24} className="text-[#2b3139]" />
              <p className="text-xs text-[#848e9c]">No recent events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-[#0b0e11] border border-[#2b3139]">
                  <p className="text-xs text-[#eaecef] leading-relaxed">{ev.description ?? ev.event_type}</p>
                  <p className="text-[10px] text-[#848e9c] mt-1">{ev.symbol} · {ev.created_at ? new Date(ev.created_at).toLocaleDateString() : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Positions table */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2b3139] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#eaecef]">Open Positions</h2>
          <span className="text-xs text-[#848e9c]">{mockPositions.length} positions</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#848e9c] text-xs border-b border-[#2b3139]">
              <th className="text-left px-4 py-3 font-medium">Asset</th>
              <th className="text-right px-4 py-3 font-medium">Amount</th>
              <th className="text-right px-4 py-3 font-medium">Value</th>
              <th className="text-right px-4 py-3 font-medium">P&L</th>
              <th className="text-right px-4 py-3 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {mockPositions.map((p) => (
              <tr key={p.asset} className="border-b border-[#2b3139]/50 hover:bg-[#1e2329] transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#f0b90b]/10 flex items-center justify-center text-[10px] font-bold text-[#f0b90b]">
                      {p.asset.split('/')[0][0]}
                    </div>
                    <span className="font-medium text-[#eaecef]">{p.asset}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-[#848e9c] font-mono text-xs">{p.amount}</td>
                <td className="px-4 py-3 text-right font-mono text-[#eaecef]">{p.value}</td>
                <td className={`px-4 py-3 text-right font-mono ${p.up ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>{p.pnl}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${p.up ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#f6465d]/10 text-[#f6465d]'}`}>
                    {p.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {p.pnlPct}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
