import { useEffect, useState, useCallback, useRef } from 'react'
import {
  getBotStatus, startBot, stopBot, closeBotPosition,
  getBotTrades, updateBotParams, getBotPnlHistory, listApiKeys,
  getSubscriptionLimits,
  finEventStart, finEventStop, finEventTrades, finEventListBots,
} from '../lib/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import {
  Bot, Play, Square, RefreshCw, TrendingUp, Activity, Zap, Brain,
  Save, ChevronDown, BarChart2, Lock, KeyRound, ArrowRight,
  DollarSign, Cpu, Plus, X,
  ChevronUp, Crown, Edit2, Check,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, AreaChart, Area,
} from 'recharts'
import { useNavigate } from 'react-router-dom'

interface TradeLog {
  id: number; ticker: string; action: string; price: number; qty: number
  pnl: number | null; reason: string | null; exchange: string; created_at: string
}

interface BotDetail {
  running: boolean; bot_id: string; bot_name: string; ticker: string
  strategy: string; direction: string; take_profit_pct: number; mode: string
  balance: number; portfolio_value: number; unrealized_pnl: number; realized_pnl: number
  win_rate: number; position: number; entry_price: number; current_price: number
  signal: string; current_drawdown_pct: number; total_trades: number
  price_chart: { time: string; price: number }[]
  entry_markers: { time: string; price: number }[]
  exit_markers: { time: string; price: number; pnl: number }[]
  recent_trades: { time: string; action: string; price: number; qty: number; pnl: number | null; reason: string }[]
}

interface BotStatus { running: boolean; bots?: Record<string, BotDetail>; capital?: number }
interface SubLimits { subscription: string; limits: { api_keys: number; bots: number }; used: { api_keys: number } }
interface PnlPoint { date: string; pnl: number; cumulative: number }

interface FeBot {
  bot_name: string; active_tickers: string[]; min_impact_score: number
  total_pnl: number; trades_count: number; running: boolean
}
interface FeTrade {
  id?: number; action: string; ticker: string; price: number; reason: string; created_at: string
}

const TICKERS = [
  'BTC-USD','ETH-USD','SOL-USD','XRP-USD','BNB-USD','ADA-USD',
  'AVAX-USD','DOGE-USD','NVDA','AAPL','TSLA','MSFT','GOOGL','AMZN','META',
]

function fmt(n: number, d = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
}

const MIN_CAPITAL = 200
const MAX_CAPITAL = 2_000_000

interface BotParams {
  ticker: string; route: string; initial_capital: number; lot_size: number
  max_drawdown_pct: number; strategy: 'sma' | 'finlux' | 'auto' | 'live'
  take_profit_pct: number; stop_loss_pct: number; leverage: number
  direction: 'auto' | 'buy' | 'sell'; bot_name: string
}

const EMPTY_PARAMS: BotParams = {
  ticker: 'BTC-USD', route: '__balance__', initial_capital: 200,
  lot_size: 1, max_drawdown_pct: 25, strategy: 'finlux',
  take_profit_pct: 50, stop_loss_pct: 30, leverage: 10,
  direction: 'auto', bot_name: '',
}

// Clickable percentage selector + manual input
function ClickBox({ value, onChange, options, suffix = '%', label }: {
  value: number; onChange: (v: number) => void; options: number[]; suffix?: string; label: string
}) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState(String(value))
  return (
    <div>
      <label className="text-xs text-[#848e9c] mb-1.5 block">{label}</label>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {options.map(o => (
          <button key={o} onClick={() => { onChange(o); setRaw(String(o)) }}
            className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${value === o ? 'bg-[#f0b90b] text-black' : 'bg-[#2b3139] text-[#848e9c] hover:text-[#eaecef]'}`}>
            {o}{suffix}
          </button>
        ))}
      </div>
      {editing ? (
        <div className="flex gap-1">
          <input type="number" value={raw} onChange={e => setRaw(e.target.value)} autoFocus
            className="flex-1 bg-[#0b0e11] border border-[#f0b90b] rounded-lg px-2 py-1.5 text-xs text-[#eaecef] focus:outline-none" />
          <button onClick={() => { onChange(Number(raw)); setEditing(false) }}
            className="px-2.5 py-1.5 bg-[#f0b90b] text-black rounded-lg text-xs font-bold">
            <Check size={11} />
          </button>
        </div>
      ) : (
        <button onClick={() => { setRaw(String(value)); setEditing(true) }}
          className="w-full flex items-center justify-between bg-[#0b0e11] border border-[#2b3139] hover:border-[#f0b90b]/50 rounded-lg px-3 py-1.5 text-xs text-[#eaecef] transition">
          <span className="font-mono">{value}{suffix}</span>
          <Edit2 size={10} className="text-[#4a5568]" />
        </button>
      )}
    </div>
  )
}

function BotPriceChart({ bot }: { bot: BotDetail }) {
  if (!bot.price_chart || bot.price_chart.length < 2) {
    return <div className="flex items-center justify-center h-24 text-[#4a5568] text-xs">Warming up… ({bot.price_chart?.length ?? 0} ticks)</div>
  }
  const entrySet = new Set(bot.entry_markers.map(m => m.time))
  const exitSet = new Set(bot.exit_markers.map(m => m.time))
  const data = bot.price_chart.map(p => ({
    ...p,
    entry: entrySet.has(p.time) ? p.price : undefined,
    exit: exitSet.has(p.time) ? p.price : undefined,
  }))
  const prices = bot.price_chart.map(p => p.price)
  const domain: [number, number] = [Math.min(...prices) * 0.9995, Math.max(...prices) * 1.0005]
  const isUp = prices[prices.length - 10] >= prices[0]
  return (
    <ResponsiveContainer width="100%" height={100}>
      <LineChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 2" stroke="#2b3139" vertical={false} />
        <XAxis dataKey="time" hide /><YAxis domain={domain} hide />
        <Tooltip contentStyle={{ background: '#1e2329', border: '1px solid #2b3139', borderRadius: 8, fontSize: 10 }} labelStyle={{ color: '#848e9c' }} formatter={(v: unknown) => [`$${(v as number).toLocaleString('en-US', { maximumFractionDigits: 2 })}`, 'Price']} />
        {bot.entry_price > 0 && <ReferenceLine y={bot.entry_price} stroke="#f0b90b" strokeDasharray="3 3" strokeWidth={1} />}
        <Line type="monotone" dataKey="price" stroke={isUp ? '#0ecb81' : '#f6465d'} strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
        <Line type="monotone" dataKey="entry" stroke="#0ecb81" dot={{ r: 4, fill: '#0ecb81', stroke: '#0b0e11', strokeWidth: 1 }} strokeWidth={0} activeDot={false} connectNulls={false} />
        <Line type="monotone" dataKey="exit" stroke="#f6465d" dot={{ r: 4, fill: '#f6465d', stroke: '#0b0e11', strokeWidth: 1 }} strokeWidth={0} activeDot={false} connectNulls={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Shared config panel for AI Bot and Event Bot
function BotConfigPanel({
  title, icon: Icon, accentColor = '#f0b90b',
  params, setParams, exchanges,
  showTickerDD, setShowTickerDD, showRouteDD, setShowRouteDD,
  onStart, onSave, actionLoading, savingParams, startLabel = 'Start Bot', onClose, closeLabel,
}: {
  title: string; icon: React.ElementType; accentColor?: string
  params: BotParams; setParams: React.Dispatch<React.SetStateAction<BotParams>>
  exchanges: { exchange: string; label: string }[]
  showTickerDD: boolean; setShowTickerDD: (v: boolean) => void
  showRouteDD: boolean; setShowRouteDD: (v: boolean) => void
  onStart: () => void; onSave: () => void
  actionLoading: string | null; savingParams: boolean
  startLabel?: string; onClose: () => void; closeLabel?: string
}) {
  const routeLabel = params.route === '__balance__' ? 'Platform Balance' : (exchanges.find(e => e.label === params.route)?.label ?? params.route)
  return (
    <div className="bg-[#161a1e] border rounded-2xl p-5" style={{ borderColor: `${accentColor}44` }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-[#eaecef] flex items-center gap-2">
          <Icon size={14} style={{ color: accentColor }} /> {title}
        </h3>
        <button onClick={onClose} className="text-[10px] text-[#848e9c] hover:text-[#eaecef] flex items-center gap-1 transition">
          {closeLabel ? closeLabel : <X size={14} />}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Bot Name */}
        <div>
          <label className="text-xs text-[#848e9c] mb-1.5 block">Bot Name (optional)</label>
          <input value={params.bot_name} onChange={e => setParams(p => ({ ...p, bot_name: e.target.value }))}
            placeholder="e.g. BTC-Scalper"
            className="w-full bg-[#0b0e11] border border-[#2b3139] focus:border-[#f0b90b] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] focus:outline-none transition" />
        </div>
        {/* Ticker */}
        <div>
          <label className="text-xs text-[#848e9c] mb-1.5 block">Asset / Ticker</label>
          <div className="relative">
            <button onClick={() => { setShowTickerDD(!showTickerDD); setShowRouteDD(false) }}
              className="w-full flex items-center justify-between bg-[#0b0e11] border border-[#2b3139] hover:border-[#f0b90b]/50 rounded-xl px-3 py-2.5 text-sm text-[#eaecef] transition">
              <span className="font-mono font-medium">{params.ticker}</span><ChevronDown size={12} className="text-[#848e9c]" />
            </button>
            {showTickerDD && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-[#1e2329] border border-[#2b3139] rounded-xl z-20 shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                {TICKERS.map(t => (
                  <button key={t} onClick={() => { setParams(p => ({ ...p, ticker: t })); setShowTickerDD(false) }}
                    className={`w-full text-left px-4 py-2 text-sm transition hover:bg-[#2b3139] font-mono ${t === params.ticker ? 'text-[#f0b90b] font-semibold' : 'text-[#eaecef]'}`}>{t}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Strategy */}
        <div>
          <label className="text-xs text-[#848e9c] mb-1.5 block">Strategy</label>
          <div className="grid grid-cols-2 gap-1 bg-[#0b0e11] p-1 rounded-xl border border-[#2b3139]">
            {(['sma', 'finlux', 'auto', 'live'] as const).map(s => (
              <button key={s} onClick={() => setParams(p => ({ ...p, strategy: s }))}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${params.strategy === s ? 'bg-[#f0b90b] text-black' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
                {s === 'auto' ? '🤖 AUTO' : s === 'live' ? '⚡ LIVE' : s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {/* Capital */}
        <div>
          <label className="text-xs text-[#848e9c] mb-1.5 block">Capital (USDT) <span className="text-[#4a5568] font-normal">${MIN_CAPITAL.toLocaleString()}–$2M</span></label>
          <div className="relative">
            <input type="number" min={MIN_CAPITAL} max={MAX_CAPITAL} value={params.initial_capital}
              onChange={e => setParams(p => ({ ...p, initial_capital: Number(e.target.value) }))}
              className="w-full bg-[#0b0e11] border border-[#2b3139] focus:border-[#f0b90b] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] focus:outline-none transition" />
            <span className="absolute right-3 top-2.5 text-xs text-[#4a5568]">USDT</span>
          </div>
        </div>
        {/* Lot Size */}
        <div>
          <label className="text-xs text-[#848e9c] mb-1.5 block">Lot Size <span className="text-[#4a5568] font-normal">1–100</span></label>
          <input type="number" min={1} max={100} value={params.lot_size}
            onChange={e => setParams(p => ({ ...p, lot_size: Math.min(100, Math.max(1, Number(e.target.value))) }))}
            className="w-full bg-[#0b0e11] border border-[#2b3139] focus:border-[#f0b90b] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] focus:outline-none transition" />
        </div>
        {/* Leverage */}
        <div>
          <label className="text-xs text-[#848e9c] mb-1.5 block">Leverage</label>
          <div className="relative">
            <input type="number" min={1} max={500} value={params.leverage}
              onChange={e => setParams(p => ({ ...p, leverage: Number(e.target.value) }))}
              className="w-full bg-[#0b0e11] border border-[#2b3139] focus:border-[#f0b90b] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] focus:outline-none transition" />
            <span className="absolute right-3 top-2.5 text-xs text-[#4a5568]">x</span>
          </div>
        </div>
        {/* Take Profit */}
        <ClickBox label="Take Profit" value={params.take_profit_pct}
          onChange={v => setParams(p => ({ ...p, take_profit_pct: v }))}
          options={[5, 10, 25, 50, 100, 150, 200]} suffix="%" />
        {/* Stop Loss */}
        <ClickBox label="Stop Loss" value={params.stop_loss_pct}
          onChange={v => setParams(p => ({ ...p, stop_loss_pct: v }))}
          options={[5, 10, 20, 30, 50, 75, 100]} suffix="%" />
        {/* Direction */}
        <div>
          <label className="text-xs text-[#848e9c] mb-1.5 block">Direction</label>
          <div className="grid grid-cols-3 gap-1 bg-[#0b0e11] p-1 rounded-xl border border-[#2b3139]">
            {(['auto', 'buy', 'sell'] as const).map(d => (
              <button key={d} onClick={() => setParams(p => ({ ...p, direction: d }))}
                className={`px-2 py-1.5 text-xs font-semibold rounded-lg transition ${params.direction === d ? 'bg-[#f0b90b] text-black' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
                {d === 'buy' ? 'Long' : d === 'sell' ? 'Short' : 'Auto'}
              </button>
            ))}
          </div>
        </div>
        {/* Execute On */}
        <div>
          <label className="text-xs text-[#848e9c] mb-1.5 block">Execute On</label>
          <div className="relative">
            <button onClick={() => { setShowRouteDD(!showRouteDD); setShowTickerDD(false) }}
              className="w-full flex items-center justify-between bg-[#0b0e11] border border-[#2b3139] hover:border-[#f0b90b]/50 rounded-xl px-3 py-2.5 text-sm text-[#eaecef] transition">
              <span className="truncate">{routeLabel}</span><ChevronDown size={12} className="text-[#848e9c]" />
            </button>
            {showRouteDD && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-[#1e2329] border border-[#2b3139] rounded-xl z-20 shadow-xl overflow-hidden">
                <button onClick={() => { setParams(p => ({ ...p, route: '__balance__' })); setShowRouteDD(false) }}
                  className={`w-full text-left px-4 py-2.5 text-xs transition hover:bg-[#2b3139] ${params.route === '__balance__' ? 'text-[#f0b90b] font-semibold' : 'text-[#eaecef]'}`}>
                  Platform Balance (FinAi Wallet)
                </button>
                {exchanges.map(e => (
                  <button key={e.label} onClick={() => { setParams(p => ({ ...p, route: e.label })); setShowRouteDD(false) }}
                    className={`w-full text-left px-4 py-2.5 text-xs transition hover:bg-[#2b3139] ${params.route === e.label ? 'text-[#f0b90b] font-semibold' : 'text-[#eaecef]'}`}>
                    {e.label} ({e.exchange})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-5 pt-4 border-t border-[#2b3139] flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] text-[#848e9c]">2-min warm-up before first trade · Auto-compounding enabled · Risk limited to initial capital</p>
        <div className="flex items-center gap-2">
          <button onClick={onSave} disabled={savingParams}
            className="flex items-center gap-1.5 text-xs text-[#848e9c] hover:text-[#eaecef] bg-[#2b3139] px-4 py-2.5 rounded-xl transition">
            <Save size={13} /> {savingParams ? 'Saving…' : 'Save Default'}
          </button>
          <button onClick={onStart} disabled={!!actionLoading}
            className="flex items-center gap-2 text-black font-bold px-6 py-2.5 rounded-xl shadow-lg transition disabled:opacity-50"
            style={{ backgroundColor: accentColor }}>
            {actionLoading === 'start' ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
            {startLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BotsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const exchanges = (user as unknown as { exchange_connections?: { exchange: string; label: string; api_key_masked?: string }[] })?.exchange_connections ?? []

  const [status, setStatus] = useState<BotStatus>({ running: false })
  const [trades, setTrades] = useState<TradeLog[]>([])
  const [pnlHistory, setPnlHistory] = useState<PnlPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showAddBot, setShowAddBot] = useState(false)
  const [savingParams, setSavingParams] = useState(false)
  const [showTickerDD, setShowTickerDD] = useState(false)
  const [showRouteDD, setShowRouteDD] = useState(false)
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)
  const [subLimits, setSubLimits] = useState<SubLimits | null>(null)
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({})
  const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down'>>({})
  const [collapsedBots, setCollapsedBots] = useState<Record<string, boolean>>({})
  const [editingBot, setEditingBot] = useState<string | null>(null)
  const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const [params, setParams] = useState<BotParams>({ ...EMPTY_PARAMS })

  // FinEventAI
  const [feBots, setFeBots] = useState<FeBot[]>([])
  const [feMaxBots, setFeMaxBots] = useState(0)
  const [feTrades, setFeTrades] = useState<FeTrade[]>([])
  const [feLoading, setFeLoading] = useState(false)
  const [feParams, setFeParams] = useState({ bot_name: '', min_impact_score: 7, tickers: ['BTC-USD','ETH-USD'], capital_per_trade: 500, max_trades_per_day: 10, balance_to_use: 1000, sentiment_filter: 'both' })
  const [feTickerInput, setFeTickerInput] = useState('BTC-USD,ETH-USD')
  const [showFePanel, setShowFePanel] = useState(false)
  const [feCollapsed, setFeCollapsed] = useState(false)
  const [editingFe, setEditingFe] = useState<string | null>(null)

  useEffect(() => {
    Promise.allSettled([listApiKeys(), getSubscriptionLimits()]).then(([keysRes, limitsRes]) => {
      if (keysRes.status === 'fulfilled') {
        const keys = Array.isArray(keysRes.value.data) ? keysRes.value.data : []
        setHasApiKey(keys.some((k: { is_active: boolean }) => k.is_active))
      } else setHasApiKey(false)
      if (limitsRes.status === 'fulfilled') setSubLimits(limitsRes.value.data)
    })
  }, [])

  useEffect(() => {
    if (user) {
      const u = user as unknown as { default_capital?: number; max_drawdown?: number }
      setParams(p => ({ ...p, initial_capital: u.default_capital || p.initial_capital, max_drawdown_pct: u.max_drawdown || p.max_drawdown_pct }))
    }
  }, [user])

  const fetchFeStatus = useCallback(async () => {
    try {
      const [listRes, tRes] = await Promise.allSettled([finEventListBots(), finEventTrades(20)])
      if (listRes.status === 'fulfilled') {
        const d = listRes.value.data
        setFeBots(Array.isArray(d.bots) ? d.bots : [])
        setFeMaxBots(d.max_event_bots ?? 0)
      }
      if (tRes.status === 'fulfilled') setFeTrades(Array.isArray(tRes.value.data) ? tRes.value.data : [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchFeStatus(); const id = setInterval(fetchFeStatus, 30_000); return () => clearInterval(id) }, [fetchFeStatus])

  const handleFeStart = async () => {
    const botName = feParams.bot_name.trim() || `Bot ${feBots.length + 1}`
    setFeLoading(true)
    try {
      await finEventStart({ ...feParams, bot_name: botName, tickers: feTickerInput.split(',').map(s => s.trim()).filter(Boolean) })
      toast.success(`FinEventAI "${botName}" started`)
      await fetchFeStatus(); setShowFePanel(false); setFeParams(p => ({ ...p, bot_name: '' }))
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to start FinEventAI')
    } finally { setFeLoading(false) }
  }

  const handleFeStop = async (botName: string) => {
    setFeLoading(true)
    try { await finEventStop(botName); toast.success(`"${botName}" stopped`); await fetchFeStatus() }
    catch { toast.error('Failed to stop FinEventAI') } finally { setFeLoading(false) }
  }

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, tradesRes, pnlRes] = await Promise.allSettled([getBotStatus(), getBotTrades(50), getBotPnlHistory(30)])
      if (statusRes.status === 'fulfilled') {
        const d = statusRes.value.data
        setStatus(() => {
          const newBots = (d.bots as Record<string, BotDetail>) ?? {}
          const newPrices: Record<string, number> = {}
          Object.entries(newBots).forEach(([bid, bot]) => {
            const newP = bot.current_price ?? 0; newPrices[bid] = newP
            const oldP = prevPrices[bid]
            if (oldP && newP !== oldP) {
              const dir: 'up' | 'down' = newP > oldP ? 'up' : 'down'
              setPriceFlash(f => ({ ...f, [bid]: dir }))
              if (flashTimers.current[bid]) clearTimeout(flashTimers.current[bid])
              flashTimers.current[bid] = setTimeout(() => setPriceFlash(f => { const n = { ...f }; delete n[bid]; return n }), 600)
            }
          })
          setPrevPrices(newPrices)
          return { running: d.running, bots: newBots, capital: d.capital }
        })
      }
      if (tradesRes.status === 'fulfilled') { const d = tradesRes.value.data; setTrades(Array.isArray(d) ? d : (d?.trades ?? [])) }
      if (pnlRes.status === 'fulfilled') setPnlHistory(pnlRes.value.data?.history ?? [])
    } catch { /* silent */ } finally { setLoading(false) }
  }, [prevPrices])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, status.running ? 5000 : 15000)
    return () => clearInterval(id)
  }, [fetchData, status.running])

  const handleStart = async () => {
    if (params.initial_capital < MIN_CAPITAL) { toast.error(`Minimum capital is $${MIN_CAPITAL}`); return }
    if (subLimits && activeBots.filter(b => b.running).length >= subLimits.limits.bots) {
      toast.error(`Bot limit reached.`); navigate('/app/pricing'); return
    }
    setActionLoading('start')
    try {
      const res = await startBot({
        ticker: params.ticker, paper: false, initial_capital: params.initial_capital,
        risk_per_trade_pct: 100, max_drawdown_pct: params.max_drawdown_pct,
        exchange_label: params.route === '__balance__' ? undefined : params.route,
        strategy: params.strategy, take_profit_pct: params.take_profit_pct,
        stop_loss_pct: params.stop_loss_pct, direction: params.direction,
        bot_name: params.bot_name || undefined, leverage: params.leverage, lot_size: params.lot_size,
      })
      setStatus(s => ({ ...s, running: true }))
      toast.success(res.data?.message || 'Bot started')
      setShowAddBot(false); setParams({ ...EMPTY_PARAMS }); fetchData()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to start bot')
    } finally { setActionLoading(null) }
  }

  const handleStop = async (botId = 'ALL') => {
    setActionLoading(botId)
    try {
      await stopBot(botId)
      if (botId === 'ALL') setStatus(s => ({ ...s, running: false }))
      toast.success(botId === 'ALL' ? 'All bots stopped' : `Bot stopped`)
      fetchData()
    } catch { toast.error('Failed to stop bot') } finally { setActionLoading(null) }
  }

  const handleClosePosition = async (botId: string) => {
    setActionLoading(`close_${botId}`)
    try {
      const res = await closeBotPosition(botId); toast.success(res.data?.message || 'Position closed'); fetchData()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to close position')
    } finally { setActionLoading(null) }
  }

  const handleSaveDefaults = async () => {
    setSavingParams(true)
    try { await updateBotParams({ default_capital: params.initial_capital, risk_per_trade: 100, max_drawdown: params.max_drawdown_pct, preferred_tickers: [params.ticker] }); toast.success('Defaults saved') }
    catch { toast.error('Failed to save') } finally { setSavingParams(false) }
  }

  const activeBots = Object.values(status.bots ?? {}) as BotDetail[]
  const pnlTrades = trades.filter(t => t.pnl !== null)
  const totalPnl = pnlTrades.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const winningTrades = pnlTrades.filter(t => (t.pnl ?? 0) > 0).length
  const winRate = pnlTrades.length > 0 ? ((winningTrades / pnlTrades.length) * 100).toFixed(1) : '—'
  const totalUnrealized = activeBots.reduce((s, b) => s + (b.unrealized_pnl ?? 0), 0)
  const totalPortfolio = activeBots.reduce((s, b) => s + (b.portfolio_value ?? 0), 0)
  const runningBotCount = activeBots.filter(b => b.running).length
  const botLimit = subLimits?.limits?.bots ?? 999
  const atBotLimit = runningBotCount >= botLimit

  if (hasApiKey === null) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-[#f0b90b] border-t-transparent rounded-full animate-spin" /></div>

  if (hasApiKey === false) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-[#f0b90b]/10 border-2 border-[#f0b90b]/30 flex items-center justify-center"><Lock size={36} className="text-[#f0b90b]" /></div>
      <div><h2 className="text-xl font-bold text-[#eaecef] mb-2">FinAi API Key Required</h2><p className="text-sm text-[#848e9c] max-w-md">To access the AI Trading Bot, you need a FinAi API key.</p></div>
      <div className="bg-[#161a1e] border border-[#f0b90b]/20 rounded-2xl p-6 max-w-sm w-full space-y-3 text-left">
        <p className="text-xs font-semibold text-[#f0b90b] uppercase tracking-widest">How to get access</p>
        <ol className="space-y-2 text-sm text-[#848e9c]">
          <li className="flex gap-2"><span className="text-[#f0b90b] font-bold">1.</span> Go to your Profile page</li>
          <li className="flex gap-2"><span className="text-[#f0b90b] font-bold">2.</span> Open the <span className="text-[#eaecef] font-medium">FinAPI</span> tab</li>
          <li className="flex gap-2"><span className="text-[#f0b90b] font-bold">3.</span> Create a new API key</li>
          <li className="flex gap-2"><span className="text-[#f0b90b] font-bold">4.</span> Return here to start trading</li>
        </ol>
      </div>
      <button onClick={() => navigate('/app/profile')} className="flex items-center gap-2 bg-[#f0b90b] hover:bg-[#d9a60b] text-black font-bold px-6 py-3 rounded-xl transition">
        <KeyRound size={16} /> Go to Profile — Create Key <ArrowRight size={14} />
      </button>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-[#eaecef]">AI Trading Bots</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${status.running ? 'bg-[#0ecb81]/10 text-[#0ecb81] border-[#0ecb81]/20 animate-pulse' : 'bg-[#2b3139] text-[#848e9c] border-[#2b3139]'}`}>
            AI Bot {status.running ? `● ${activeBots.length} Live` : 'Offline'}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${feBots.filter(b => b.running).length > 0 ? 'bg-[#627eea]/10 text-[#627eea] border-[#627eea]/20 animate-pulse' : 'bg-[#2b3139] text-[#848e9c] border-[#2b3139]'}`}>
            FinEventAI {feBots.filter(b => b.running).length > 0 ? `● ${feBots.filter(b => b.running).length} Live` : 'Offline'}
          </span>
          {subLimits && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${atBotLimit ? 'bg-[#f6465d]/10 text-[#f6465d] border-[#f6465d]/30' : 'bg-[#2b3139] text-[#848e9c] border-[#2b3139]'}`}>
              {runningBotCount}/{botLimit === 9999 ? '∞' : botLimit} bots · {subLimits.subscription.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status.running && (
            <button onClick={() => handleStop('ALL')} disabled={!!actionLoading}
              className="flex items-center gap-1.5 text-xs bg-[#f6465d]/10 hover:bg-[#f6465d]/20 border border-[#f6465d]/30 text-[#f6465d] px-3 py-1.5 rounded-lg transition">
              <Square size={11} /> Stop All
            </button>
          )}
          {atBotLimit ? (
            <button onClick={() => navigate('/app/pricing')} className="flex items-center gap-1.5 text-xs bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 border border-[#f0b90b]/30 text-[#f0b90b] px-3 py-1.5 rounded-lg transition">
              <Crown size={11} /> Upgrade
            </button>
          ) : (
            <button onClick={() => setShowAddBot(v => !v)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${showAddBot ? 'bg-[#2b3139] text-[#848e9c]' : 'bg-[#f0b90b] hover:bg-[#d9a60b] text-black'}`}>
              {showAddBot ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add Bot</>}
            </button>
          )}
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-1.5 text-xs text-[#848e9c] hover:text-[#eaecef] transition">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* AI Bot Config Panel — toggled by Add Bot */}
      {showAddBot && (
        <BotConfigPanel
          title="Configure New AI Bot" icon={Bot} accentColor="#f0b90b"
          params={params} setParams={setParams} exchanges={exchanges}
          showTickerDD={showTickerDD} setShowTickerDD={setShowTickerDD}
          showRouteDD={showRouteDD} setShowRouteDD={setShowRouteDD}
          onStart={handleStart} onSave={handleSaveDefaults}
          actionLoading={actionLoading} savingParams={savingParams}
          startLabel="Start AI Bot"
          onClose={() => setShowAddBot(false)}
        />
      )}

      {/* Active Bots Grid */}
      {activeBots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeBots.map(bot => (
            <div key={bot.bot_id} className="bg-[#161a1e] border border-[#2b3139] rounded-2xl overflow-hidden flex flex-col">
              <div className="p-4 flex items-center justify-between border-b border-[#2b3139]/50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bot.running ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#2b3139] text-[#848e9c]'}`}><Bot size={16} /></div>
                  <div>
                    <h3 className="text-sm font-bold text-[#eaecef]">{bot.bot_name || `${bot.ticker} Bot`}</h3>
                    <p className="text-[10px] text-[#848e9c] uppercase font-semibold tracking-wider">{bot.strategy} · {bot.direction} · {bot.mode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditingBot(editingBot === bot.bot_id ? null : bot.bot_id)}
                    className="p-1.5 text-[#848e9c] hover:text-[#f0b90b] hover:bg-[#2b3139] rounded-lg transition" title="Edit">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => setCollapsedBots(c => ({ ...c, [bot.bot_id]: !c[bot.bot_id] }))}
                    className="p-1.5 text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] rounded-lg transition">
                    {collapsedBots[bot.bot_id] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                  {bot.running ? (
                    <button onClick={() => handleStop(bot.bot_id)} disabled={actionLoading === bot.bot_id}
                      className="flex items-center gap-1.5 text-[10px] font-bold bg-[#f6465d]/10 hover:bg-[#f6465d]/20 text-[#f6465d] px-2.5 py-1.5 rounded-lg border border-[#f6465d]/20 transition">
                      <Square size={10} fill="currentColor" /> STOP
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-[#848e9c] bg-[#2b3139] px-2.5 py-1.5 rounded-lg">OFFLINE</span>
                  )}
                </div>
              </div>
              {editingBot === bot.bot_id && (
                <div className="p-3 bg-[#0b0e11] border-b border-[#2b3139] text-xs text-[#848e9c]">
                  Stop this bot, then click <span className="text-[#f0b90b]">"Add Bot"</span> above to reconfigure with new settings.
                </div>
              )}
              {!collapsedBots[bot.bot_id] && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0b0e11] rounded-xl p-3 border border-[#2b3139]/30">
                      <p className="text-[10px] text-[#848e9c] mb-1">Portfolio Value</p>
                      <p className="text-sm font-bold text-[#eaecef] font-mono">${fmt(bot.portfolio_value)}</p>
                    </div>
                    <div className="bg-[#0b0e11] rounded-xl p-3 border border-[#2b3139]/30">
                      <p className="text-[10px] text-[#848e9c] mb-1">Unrealized P&L</p>
                      <p className={`text-sm font-bold font-mono ${bot.unrealized_pnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>{bot.unrealized_pnl >= 0 ? '+' : ''}${fmt(bot.unrealized_pnl)}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <BotPriceChart bot={bot} />
                    <div className="absolute top-1 right-2 bg-[#0b0e11]/80 backdrop-blur-sm border border-[#2b3139] rounded px-2 py-1 flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold transition-colors duration-300 ${priceFlash[bot.bot_id] === 'up' ? 'text-[#0ecb81]' : priceFlash[bot.bot_id] === 'down' ? 'text-[#f6465d]' : 'text-[#eaecef]'}`}>${bot.current_price?.toLocaleString() || '—'}</span>
                      {bot.signal && <span className={`text-[9px] font-bold px-1.5 rounded ${bot.signal === 'BUY' ? 'bg-[#0ecb81] text-black' : bot.signal === 'SELL' ? 'bg-[#f6465d] text-white' : 'bg-[#2b3139] text-[#848e9c]'}`}>{bot.signal}</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center"><p className="text-[9px] text-[#4a5568] uppercase font-bold">Trades</p><p className="text-xs text-[#eaecef] font-semibold">{bot.total_trades}</p></div>
                    <div className="text-center"><p className="text-[9px] text-[#4a5568] uppercase font-bold">Win Rate</p><p className="text-xs text-[#eaecef] font-semibold">{(bot.win_rate * 100).toFixed(1)}%</p></div>
                    <div className="text-center"><p className="text-[9px] text-[#4a5568] uppercase font-bold">Drawdown</p><p className="text-xs text-[#f6465d] font-semibold">{bot.current_drawdown_pct.toFixed(1)}%</p></div>
                  </div>
                  {bot.position > 0 && (
                    <div className="bg-[#f0b90b]/5 border border-[#f0b90b]/20 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-[#f0b90b] font-bold uppercase">Active Position</p>
                        <p className="text-xs text-[#eaecef] font-mono mt-0.5">{bot.position.toFixed(6)} {bot.ticker.split('-')[0]} @ ${fmt(bot.entry_price)}</p>
                      </div>
                      <button onClick={() => handleClosePosition(bot.bot_id)} disabled={actionLoading === `close_${bot.bot_id}`}
                        className="text-[10px] font-bold bg-[#f0b90b] hover:bg-[#d9a60b] text-black px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                        {actionLoading === `close_${bot.bot_id}` ? <RefreshCw size={10} className="animate-spin" /> : 'CLOSE NOW'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FinEventAI Section — redesigned to match AI bot card style */}
      <div className="bg-[#161a1e] border border-[#627eea]/30 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2b3139] flex items-center justify-between bg-[#627eea]/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#627eea] flex items-center justify-center text-white"><Brain size={20} /></div>
            <div>
              <h2 className="text-base font-bold text-[#eaecef] flex items-center gap-2">FinEventAI <span className="text-[10px] font-black bg-white/10 px-1.5 py-0.5 rounded tracking-tighter uppercase">Proprietary</span></h2>
              <p className="text-xs text-[#848e9c]">AI event-driven multi-asset trading engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setFeCollapsed(!feCollapsed)} className="p-2 text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] rounded-xl transition">
              {feCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            <button onClick={() => setShowFePanel(!showFePanel)} className="flex items-center gap-1.5 bg-[#627eea] hover:bg-[#5568cc] text-white text-xs font-bold px-4 py-2 rounded-xl transition">
              <Plus size={14} /> Add Event Bot
            </button>
          </div>
        </div>
        {!feCollapsed && (
          <>
            {feBots.length > 0 && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 border-b border-[#2b3139]">
                {feBots.map(b => (
                  <div key={b.bot_name} className="bg-[#0b0e11] border border-[#2b3139] rounded-xl overflow-hidden">
                    <div className="p-3 flex items-center justify-between border-b border-[#2b3139]/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${b.running ? 'bg-[#627eea]/10 text-[#627eea]' : 'bg-[#2b3139] text-[#848e9c]'}`}><Brain size={13} /></div>
                        <div>
                          <p className="text-xs font-bold text-[#eaecef] truncate max-w-[100px]">{b.bot_name}</p>
                          <p className="text-[9px] text-[#848e9c]">{b.active_tickers?.length || 0} assets · Impact ≥{b.min_impact_score}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingFe(editingFe === b.bot_name ? null : b.bot_name)} className="p-1 text-[#848e9c] hover:text-[#627eea]" title="Edit"><Edit2 size={11} /></button>
                        <button onClick={() => handleFeStop(b.bot_name)} className="text-[9px] font-bold text-[#f6465d] hover:bg-[#f6465d]/10 px-2 py-1 rounded-lg transition">STOP</button>
                      </div>
                    </div>
                    {editingFe === b.bot_name && <div className="px-3 py-2 text-[10px] text-[#848e9c] bg-[#161a1e] border-b border-[#2b3139]">Stop bot then click "Add Event Bot" to reconfigure.</div>}
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-bold font-mono ${b.total_pnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>{b.total_pnl >= 0 ? '+' : ''}{b.total_pnl?.toFixed(2)} USDT</p>
                        <p className="text-[9px] text-[#4a5568]">{b.trades_count} trades</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.running ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#2b3139] text-[#848e9c]'}`}>{b.running ? '● Live' : 'Offline'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showFePanel && (
              <div className="p-5 bg-[#0b0e11] border-b border-[#2b3139]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#eaecef] flex items-center gap-2"><Zap size={14} className="text-[#627eea]" /> New FinEventAI Instance</h3>
                  <button onClick={() => setShowFePanel(false)} className="text-[#848e9c] hover:text-[#eaecef]"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-[#4a5568] uppercase mb-1.5 block">Monitored Tickers</label>
                    <input value={feTickerInput} onChange={e => setFeTickerInput(e.target.value)} placeholder="BTC-USD,ETH-USD,SOL-USD"
                      className="w-full bg-[#161a1e] border border-[#2b3139] rounded-xl px-3 py-2 text-sm text-[#eaecef] focus:outline-none focus:border-[#627eea]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#4a5568] uppercase mb-1.5 block">Min Impact Score (0–10)</label>
                    <div className="flex gap-1 flex-wrap mb-1">
                      {[5,6,7,8,9,10].map(v => (
                        <button key={v} onClick={() => setFeParams(p => ({ ...p, min_impact_score: v }))}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${feParams.min_impact_score === v ? 'bg-[#627eea] text-white' : 'bg-[#2b3139] text-[#848e9c] hover:text-[#eaecef]'}`}>{v}</button>
                      ))}
                    </div>
                    <input type="number" value={feParams.min_impact_score} onChange={e => setFeParams(p => ({ ...p, min_impact_score: Number(e.target.value) }))}
                      className="w-full bg-[#161a1e] border border-[#2b3139] rounded-xl px-3 py-2 text-sm text-[#eaecef] focus:outline-none focus:border-[#627eea]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#4a5568] uppercase mb-1.5 block">Capital per Trade (USDT)</label>
                    <input type="number" value={feParams.capital_per_trade} onChange={e => setFeParams(p => ({ ...p, capital_per_trade: Number(e.target.value) }))}
                      className="w-full bg-[#161a1e] border border-[#2b3139] rounded-xl px-3 py-2 text-sm text-[#eaecef] focus:outline-none focus:border-[#627eea]" />
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
                  <p className="text-[10px] text-[#848e9c] max-w-lg">FinEventAI scans global news, earnings, and macro events in real-time, executing on high-sentiment breakouts.</p>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-[#848e9c]">{feBots.length}/{feMaxBots || '∞'} slots used</p>
                    <button onClick={handleFeStart} disabled={feLoading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#627eea] hover:bg-[#5568cc] disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition">
                      {feLoading ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                      {feLoading ? 'Starting…' : 'Launch Bot'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {feTrades.length > 0 && (
              <div className="border-t border-[#2b3139]">
                <div className="px-5 py-3 border-b border-[#2b3139]"><p className="text-xs font-semibold text-[#848e9c] uppercase tracking-wide">Recent Event Trades</p></div>
                <div className="divide-y divide-[#2b3139]/50 max-h-48 overflow-y-auto">
                  {feTrades.slice(0, 10).map((t, i) => (
                    <div key={t.id ?? i} className="px-5 py-2.5 flex flex-wrap items-center gap-3 text-xs hover:bg-[#1e2329] transition">
                      <span className={`px-2 py-0.5 rounded font-bold ${t.action === 'BUY' ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#f6465d]/10 text-[#f6465d]'}`}>{t.action}</span>
                      <span className="font-mono font-semibold text-[#f0b90b]">{t.ticker}</span>
                      <span className="text-[#eaecef] font-mono">${t.price < 1 ? t.price.toFixed(5) : Number(t.price).toLocaleString()}</span>
                      <span className="text-[#848e9c] flex-1 truncate">{(t.reason || '').replace('FinEventAI | ', '')}</span>
                      <span className="text-[#4a5568] whitespace-nowrap">{t.created_at ? new Date(t.created_at).toLocaleString() : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {feBots.length === 0 && feTrades.length === 0 && !showFePanel && (
              <div className="py-8 text-center border-t border-[#2b3139]">
                <Brain size={28} className="text-[#2b3139] mx-auto mb-2" />
                {feMaxBots === 0 ? (<><p className="text-sm text-[#848e9c]">FinEventAI requires a Pro subscription</p><p className="text-xs text-[#4a5568] mt-0.5">Upgrade to unlock up to 50 bots</p></>) : (<><p className="text-sm text-[#848e9c]">No FinEventAI bots running</p><p className="text-xs text-[#4a5568] mt-0.5">Your plan allows {feMaxBots} bot{feMaxBots !== 1 ? 's' : ''}</p></>)}
              </div>
            )}
          </>
        )}
      </div>

      {/* P&L Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Realized P&L', value: `${totalPnl >= 0 ? '+' : ''}$${fmt(totalPnl)}`, sub: `${pnlTrades.length} closed`, up: totalPnl >= 0, icon: TrendingUp },
          { label: 'Unrealized P&L', value: totalUnrealized !== 0 ? `${totalUnrealized >= 0 ? '+' : ''}$${fmt(totalUnrealized)}` : '—', sub: activeBots.filter(b => b.position > 0).length + ' open', up: totalUnrealized >= 0, icon: Activity },
          { label: 'Win Rate', value: `${winRate}%`, sub: `${winningTrades} of ${pnlTrades.length}`, up: parseFloat(winRate as string) > 50, icon: Cpu },
          { label: 'Portfolio', value: totalPortfolio > 0 ? `$${fmt(totalPortfolio)}` : '—', sub: `${activeBots.length} active bots`, up: true, icon: DollarSign },
        ].map(s => { const Icon = s.icon; return (
          <div key={s.label} className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3"><span className="text-xs text-[#848e9c]">{s.label}</span><div className="w-7 h-7 rounded-lg bg-[#f0b90b]/10 flex items-center justify-center"><Icon size={13} className="text-[#f0b90b]" /></div></div>
            <p className={`text-xl font-bold font-mono ${s.up ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>{s.value}</p>
            <p className="text-xs text-[#848e9c] mt-1">{s.sub}</p>
          </div>
        )})}
      </div>

      {/* P&L Chart */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><BarChart2 size={14} className="text-[#f0b90b]" /><h3 className="text-sm font-semibold text-[#eaecef]">Cumulative P&L (30 days)</h3></div>
          {pnlHistory.length > 0 && <span className={`text-xs font-bold font-mono ${(pnlHistory[pnlHistory.length - 1]?.cumulative ?? 0) >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>{(pnlHistory[pnlHistory.length - 1]?.cumulative ?? 0) >= 0 ? '+' : ''}${(pnlHistory[pnlHistory.length - 1]?.cumulative ?? 0).toFixed(2)}</span>}
        </div>
        {pnlHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-36 gap-2"><BarChart2 size={24} className="text-[#2b3139]" /><p className="text-xs text-[#848e9c]">No P&L history yet — run a bot to begin</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={pnlHistory} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
              <defs><linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ecb81" stopOpacity={0.2} /><stop offset="95%" stopColor="#0ecb81" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
              <XAxis dataKey="date" tick={{ fill: '#848e9c', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#848e9c', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${v.toFixed(0)}`} width={52} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#1e2329', border: '1px solid #2b3139', borderRadius: 10, fontSize: 11 }} labelStyle={{ color: '#848e9c' }} formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, 'P&L']} />
              <ReferenceLine y={0} stroke="#2b3139" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="cumulative" stroke="#0ecb81" strokeWidth={2} fill="url(#pnlGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Strategy info */}
      <div className="flex items-start gap-3 bg-[#f0b90b]/5 border border-[#f0b90b]/20 rounded-xl px-4 py-3">
        <Brain size={16} className="text-[#f0b90b] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#848e9c] space-y-1">
          <p><span className="text-[#f0b90b] font-semibold">SMA:</span> Price crossover with 6-period moving average. Buys on bullish cross, sells on bearish cross or TP/SL.</p>
          <p><span className="text-[#f0b90b] font-semibold">FinLux:</span> LuxAlgo Trendlines with Breaks — detects pivots, draws dynamic trendlines, fires on breakouts.</p>
          <p className="text-[#4a5568]">2-min warm-up before first trade · Green = BUY · Red = SELL · Yellow dashed = entry price</p>
        </div>
      </div>

      {/* Live Trade Log — max 10 rows */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2b3139] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-[#f0b90b]" />
            <h2 className="text-sm font-semibold text-[#eaecef]">Live Trade Log</h2>
            {status.running && <span className="text-[10px] bg-[#0ecb81]/10 text-[#0ecb81] border border-[#0ecb81]/20 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#848e9c]">{trades.length} trades</span>
            {trades.length > 10 && (
              <button onClick={() => navigate('/app/transactions')} className="flex items-center gap-1 text-xs text-[#f0b90b] hover:text-[#d9a60b] transition font-medium">
                View All <ArrowRight size={11} />
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-[#848e9c] text-xs border-b border-[#2b3139]">
                {['Time','Asset','Action','Price','Qty','P&L','Reason'].map(h => (
                  <th key={h} className={`px-4 py-3 font-medium ${['Price','Qty','P&L'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><div className="flex flex-col items-center gap-2"><Bot size={28} className="text-[#2b3139]" /><p className="text-sm text-[#848e9c]">No trades yet — start a bot to begin</p></div></td></tr>
              ) : trades.slice(0, 10).map((t, i) => (
                <tr key={t.id ?? i} className="border-b border-[#2b3139]/50 hover:bg-[#1e2329] transition">
                  <td className="px-4 py-3 text-xs text-[#848e9c] whitespace-nowrap">{t.created_at ? new Date(t.created_at).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3"><span className="text-xs font-mono font-semibold text-[#f0b90b]">{t.ticker}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded ${t.action === 'BUY' ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#f6465d]/10 text-[#f6465d]'}`}>{t.action}</span></td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[#eaecef]">${t.price < 1 ? t.price.toFixed(5) : fmt(t.price)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-[#eaecef]">{t.qty.toFixed(6)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{t.pnl !== null ? <span className={t.pnl >= 0 ? 'text-[#0ecb81] font-semibold' : 'text-[#f6465d] font-semibold'}>{t.pnl >= 0 ? '+' : ''}${fmt(t.pnl)}</span> : <span className="text-[#848e9c]">Open</span>}</td>
                  <td className="px-4 py-3 text-xs text-[#848e9c]">{(t.reason ?? '').replace(/_/g, ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {trades.length > 10 && (
          <div className="px-4 py-3 border-t border-[#2b3139] text-center">
            <button onClick={() => navigate('/app/transactions')} className="text-xs text-[#f0b90b] hover:text-[#d9a60b] font-medium flex items-center gap-1 mx-auto transition">
              View all {trades.length} trades in History <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
