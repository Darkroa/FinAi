import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getEvents, getBotStatus, getTodayPnl, getBotTrades } from '../lib/api'
import { useTickerPrices, useLivePricesMap } from '../hooks/useTickerPrices'
import {
  TrendingUp, TrendingDown, Zap, Activity,
  ArrowUpRight, Bot, BarChart2, RefreshCw, Eye, EyeOff,
  ArrowRight, Bitcoin, DollarSign
} from 'lucide-react'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

interface TradeLog {
  id: number; ticker: string; action: string; price: number; qty: number
  pnl: number | null; created_at: string; exchange: string
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const tickerItems = useTickerPrices(60000)
  const { map: priceMap, refetch: refetchPrices } = useLivePricesMap(60000)

  const [events, setEvents] = useState<{ id: number; description: string; event_type: string; tickers_affected: string[]; created_at: string }[]>([])
  const [botRunning, setBotRunning] = useState(false)
  const [hideBalance, setHideBalance] = useState(false)
  const [btcToggle, setBtcToggle] = useState<'BTC' | 'ETH'>('BTC')
  const [todayPnl, setTodayPnl] = useState(0)
  const [todayPct, setTodayPct] = useState(0)
  const [trades, setTrades] = useState<TradeLog[]>([])
  const [unrealizedPnl, setUnrealizedPnl] = useState(0)
  const [openPositions, setOpenPositions] = useState(0)

  const balance = user?.balance_usdt ?? 0

  const btcItem  = tickerItems.find(t => t.symbol === 'BTC/USDT')
  const ethItem  = tickerItems.find(t => t.symbol === 'ETH/USDT')
  const parsePrice  = (s: string) => parseFloat(s.replace(/[$,]/g, '')) || 0
  const parseChange = (s: string) => parseFloat(s.replace('%', '')) || 0
  const btcPrice  = btcItem  ? parsePrice(btcItem.price)   : 0
  const ethPrice  = ethItem  ? parsePrice(ethItem.price)   : 0
  const btcChange = btcItem  ? parseChange(btcItem.change) : 0
  const ethChange = ethItem  ? parseChange(ethItem.change) : 0
  const priceLoading = !btcItem?.live

  const displayPrice  = (btcToggle === 'BTC' ? btcPrice  : ethPrice)  || (btcToggle === 'BTC' ? 97000 : 3200)
  const displayChange = (btcToggle === 'BTC' ? btcChange : ethChange) || (btcToggle === 'BTC' ? 2.4 : 1.8)
  const btcEquiv      = displayPrice > 0 ? (balance / displayPrice).toFixed(6) : '—'

  // ── Compute unrealized P&L from open buy positions vs current prices ──
  useEffect(() => {
    if (trades.length === 0 || Object.keys(priceMap).length === 0) return

    // Build net position per ticker (buys - sells)
    const positions: Record<string, { qty: number; avgPrice: number; totalCost: number }> = {}
    for (const t of trades) {
      const sym = t.ticker?.replace('-', '/').replace('USD', 'USDT') ?? ''
      if (!sym) continue
      if (!positions[sym]) positions[sym] = { qty: 0, avgPrice: 0, totalCost: 0 }
      if (t.action?.toUpperCase() === 'BUY') {
        positions[sym].totalCost += (t.price ?? 0) * (t.qty ?? 0)
        positions[sym].qty += (t.qty ?? 0)
      } else {
        positions[sym].qty -= (t.qty ?? 0)
        if (positions[sym].qty < 0) positions[sym].qty = 0
      }
      positions[sym].avgPrice = positions[sym].qty > 0
        ? positions[sym].totalCost / positions[sym].qty
        : 0
    }

    let totalUnrealized = 0
    let openCount = 0
    for (const [sym, pos] of Object.entries(positions)) {
      if (pos.qty <= 0) continue
      const current = priceMap[sym]?.usd ?? priceMap[sym.replace('/USDT', '')]?.usd ?? 0
      if (current === 0) continue
      totalUnrealized += (current - pos.avgPrice) * pos.qty
      openCount++
    }
    setUnrealizedPnl(totalUnrealized)
    setOpenPositions(openCount)
  }, [trades, priceMap])

  const fetchData = useCallback(async () => {
    getEvents(5).then(r => {
      const data = r.data
      setEvents(Array.isArray(data) ? data : (data?.events ?? []))
    }).catch(() => {})
    getBotStatus().then(r => setBotRunning(r.data?.running ?? false)).catch(() => {})
    getTodayPnl().then(r => {
      setTodayPnl(r.data?.today_pnl ?? 0)
      setTodayPct(r.data?.today_pct ?? 0)
    }).catch(() => {})
    getBotTrades(100).then(r => {
      const d = r.data
      setTrades(Array.isArray(d) ? d : (d?.trades ?? []))
    }).catch(() => {})
    refetchPrices()
  }, [refetchPrices])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const firstName = user?.first_name || user?.email?.split('@')[0] || 'Trader'

  return (
    <div className="space-y-4">

      {/* Hero balance header */}
      <div className="relative rounded-2xl overflow-hidden" style={{
        background: 'linear-gradient(135deg, #1a1105 0%, #2a1f00 40%, #1e2329 100%)',
        borderBottom: '1px solid #2b3139',
      }}>
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
                <button onClick={fetchData} className="text-[#848e9c] hover:text-[#f0b90b] transition">
                  <RefreshCw size={10} />
                </button>
              </div>
            )}
          </div>

          {/* 2 action buttons */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Withdraw', icon: ArrowUpRight, path: '/app/wallet', color: 'text-[#f6465d]', bg: 'bg-[#f6465d]/10 hover:bg-[#f6465d]/20 border-[#f6465d]/20' },
              { label: 'Markets',  icon: BarChart2,   path: '/app/markets', color: 'text-[#848e9c]', bg: 'bg-[#2b3139]/50 hover:bg-[#2b3139] border-[#2b3139]/60' },
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

      {/* P&L row — Today + Unrealized side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between bg-[#161a1e] border border-[#2b3139] rounded-xl px-3 py-3">
          <div className="flex items-center gap-1.5">
            {todayPnl >= 0 ? <TrendingUp size={13} className="text-[#0ecb81]" /> : <TrendingDown size={13} className="text-[#f6465d]" />}
            <span className="text-[10px] text-[#848e9c] leading-tight">Today<br/>P&L</span>
          </div>
          <div className="text-right">
            <p className={`text-sm font-bold font-mono ${todayPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {todayPnl >= 0 ? '+' : ''}${Math.abs(todayPnl).toFixed(2)}
            </p>
            <p className={`text-[10px] font-medium ${todayPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {todayPct >= 0 ? '+' : ''}{todayPct.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-[#161a1e] border border-[#2b3139] rounded-xl px-3 py-3">
          <div className="flex items-center gap-1.5">
            <DollarSign size={13} className={unrealizedPnl >= 0 ? 'text-[#f0b90b]' : 'text-[#848e9c]'} />
            <span className="text-[10px] text-[#848e9c] leading-tight">Unrealized<br/>P&L</span>
          </div>
          <div className="text-right">
            <p className={`text-sm font-bold font-mono ${unrealizedPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {unrealizedPnl >= 0 ? '+' : ''}${Math.abs(unrealizedPnl).toFixed(2)}
            </p>
            <p className="text-[10px] text-[#848e9c]">{openPositions} open</p>
          </div>
        </div>
      </div>

      {/* Activity Center */}
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

      {/* Quick Access */}
      <div>
        <p className="text-xs font-bold text-[#eaecef] mb-3">Quick Access</p>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Withdraw', icon: ArrowUpRight, path: '/app/wallet',  color: 'text-[#f6465d]', bg: 'bg-[#f6465d]/10' },
            { label: 'Markets',  icon: BarChart2,    path: '/app/markets', color: 'text-[#848e9c]', bg: 'bg-[#2b3139]'    },
            { label: 'Bots',     icon: Zap,          path: '/app/bots',    color: 'text-[#f0b90b]', bg: 'bg-[#f0b90b]/10' },
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

      {/* AI Events — live from backend */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[#eaecef]">AI Market Events</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] inline-block animate-pulse" />
            <Zap size={12} className="text-[#f0b90b]" />
          </div>
        </div>
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl divide-y divide-[#2b3139]">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Activity size={20} className="text-[#2b3139]" />
              <p className="text-xs text-[#848e9c]">No recent AI events</p>
              <p className="text-[10px] text-[#4a5568]">Events are ingested every 15 minutes</p>
            </div>
          ) : events.slice(0, 5).map((ev, i) => (
            <div key={i} className="px-4 py-3 hover:bg-[#1e2329] transition">
              <p className="text-xs text-[#eaecef] leading-relaxed line-clamp-2">{ev.description ?? ev.event_type}</p>
              <p className="text-[10px] text-[#848e9c] mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f0b90b] inline-block" />
                {ev.tickers_affected?.[0] ?? 'Market'} · {ev.created_at ? new Date(ev.created_at).toLocaleDateString() : ''}
              </p>
            </div>
          ))}
        </div>
        {events.length > 0 && (
          <button onClick={fetchData} className="w-full mt-2 text-[10px] text-[#848e9c] hover:text-[#f0b90b] transition flex items-center justify-center gap-1 py-1">
            <RefreshCw size={9} /> Refresh events
          </button>
        )}
      </div>

      {/* Open positions summary (if any) */}
      {openPositions > 0 && (
        <div className="bg-[#161a1e] border border-[#f0b90b]/20 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#f0b90b]/10 flex items-center justify-center">
                <BarChart2 size={11} className="text-[#f0b90b]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#eaecef]">{openPositions} Open Position{openPositions !== 1 ? 's' : ''}</p>
                <p className="text-[10px] text-[#848e9c]">Unrealized P&L vs current market</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold font-mono ${unrealizedPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                {unrealizedPnl >= 0 ? '+' : ''}${Math.abs(unrealizedPnl).toFixed(2)}
              </p>
              <button onClick={() => navigate('/app/trade')} className="text-[10px] text-[#f0b90b] hover:text-[#eaecef] transition flex items-center gap-0.5 ml-auto">
                View <ArrowRight size={8} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
