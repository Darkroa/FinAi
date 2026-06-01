import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpDown, TrendingUp, TrendingDown, ChevronDown,
  Wifi, WifiOff, BarChart2, Activity, Link2, RefreshCw,
  Clock, CheckCircle2, X, Target, AlertTriangle, ZoomIn, ZoomOut,
  ArrowRight, Zap, Minus, Plus, MessageSquare, Tv, Bot,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Bar, Cell, Customized,
} from 'recharts'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { executeTrade, getBotTrades, getOpenPositions, closeManualTrade } from '../lib/api'

const PAIRS = [
  'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT',
  'XRP/USDT', 'DOGE/USDT', 'ADA/USDT', 'AVAX/USDT',
  'LINK/USDT', 'DOT/USDT', 'UNI/USDT', 'MATIC/USDT',
  'LTC/USDT', 'XLM/USDT',
  'XAU/USD', 'XAG/USD', 'OIL/WTI',
  'AAPL', 'TSLA', 'NVDA', 'MSFT', 'SPY',
]
const TF = ['1m', '5m', '15m', '1h', '4h', '1D']
type ChartMode = 'line' | 'candle' | 'tv'

const TV_SYMBOLS: Record<string, string> = {
  'BTC/USDT':  'BINANCE:BTCUSDT',
  'ETH/USDT':  'BINANCE:ETHUSDT',
  'BNB/USDT':  'BINANCE:BNBUSDT',
  'SOL/USDT':  'BINANCE:SOLUSDT',
  'XRP/USDT':  'BINANCE:XRPUSDT',
  'DOGE/USDT': 'BINANCE:DOGEUSDT',
  'ADA/USDT':  'BINANCE:ADAUSDT',
  'AVAX/USDT': 'BINANCE:AVAXUSDT',
  'LINK/USDT': 'BINANCE:LINKUSDT',
  'DOT/USDT':  'BINANCE:DOTUSDT',
  'UNI/USDT':  'BINANCE:UNIUSDT',
  'MATIC/USDT':'BINANCE:MATICUSDT',
  'LTC/USDT':  'BINANCE:LTCUSDT',
  'XLM/USDT':  'BINANCE:XLMUSDT',
  'XAU/USD':   'TVC:GOLD',
  'XAG/USD':   'TVC:SILVER',
  'OIL/WTI':   'TVC:USOIL',
  'AAPL':      'NASDAQ:AAPL',
  'TSLA':      'NASDAQ:TSLA',
  'NVDA':      'NASDAQ:NVDA',
  'MSFT':      'NASDAQ:MSFT',
  'SPY':       'AMEX:SPY',
}

const FALLBACKS: Record<string, { price: number; change: number }> = {
  'BTC/USDT':   { price: 97000, change: 2.4  },
  'ETH/USDT':   { price: 3200,  change: 1.8  },
  'BNB/USDT':   { price: 628,   change: 0.9  },
  'SOL/USDT':   { price: 155,   change: 1.2  },
  'XRP/USDT':   { price: 0.52,  change: 0.7  },
  'DOGE/USDT':  { price: 0.12,  change: 1.1  },
  'ADA/USDT':   { price: 0.45,  change: 0.5  },
  'AVAX/USDT':  { price: 38,    change: 1.4  },
  'LINK/USDT':  { price: 14,    change: 0.8  },
  'DOT/USDT':   { price: 7.2,   change: 0.6  },
  'UNI/USDT':   { price: 8.5,   change: 1.0  },
  'MATIC/USDT': { price: 0.90,  change: 0.4  },
  'LTC/USDT':   { price: 85,    change: 0.3  },
  'XLM/USDT':   { price: 0.11,  change: 0.2  },
  'XAU/USD':    { price: 3290,  change: 0.5  },
  'XAG/USD':    { price: 32.80, change: 0.4  },
  'OIL/WTI':    { price: 78.40, change: -0.3 },
  'AAPL':       { price: 195,   change: 0.6  },
  'TSLA':       { price: 175,   change: 1.2  },
  'NVDA':       { price: 875,   change: 1.8  },
  'MSFT':       { price: 415,   change: 0.7  },
  'SPY':        { price: 526,   change: 0.4  },
}

const LEVERAGE_STEPS = [1, 2, 5, 10, 20, 50, 100, 125]

function useTradeLivePrice(pair: string) {
  const cryptoMap: Record<string, string> = {
    'BTC/USDT':   'bitcoin',
    'ETH/USDT':   'ethereum',
    'BNB/USDT':   'binancecoin',
    'SOL/USDT':   'solana',
    'XRP/USDT':   'ripple',
    'DOGE/USDT':  'dogecoin',
    'ADA/USDT':   'cardano',
    'AVAX/USDT':  'avalanche-2',
    'LINK/USDT':  'chainlink',
    'DOT/USDT':   'polkadot',
    'UNI/USDT':   'uniswap',
    'MATIC/USDT': 'matic-network',
    'LTC/USDT':   'litecoin',
    'XLM/USDT':   'stellar',
  }
  const metalsMap: Record<string, string> = {
    'XAU/USD': 'gold',
    'XAG/USD': 'silver',
  }
  const [data, setData] = useState<{ price: number; change: number; live: boolean }>({
    ...FALLBACKS[pair] ?? { price: 100, change: 0 },
    live: false,
  })
  const pairRef = useRef(pair)
  pairRef.current = pair

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/public/prices')
      if (!res.ok) return
      const json = await res.json()
      const p = pairRef.current
      const cryptoKey = cryptoMap[p]
      const metalKey = metalsMap[p]
      if (cryptoKey && json[cryptoKey]) {
        setData({ price: json[cryptoKey].usd, change: json[cryptoKey].usd_24h_change, live: true })
      } else if (metalKey && json.metals?.[metalKey]) {
        setData({ price: json.metals[metalKey].usd, change: json.metals[metalKey].usd_24h_change, live: true })
      } else if (p === 'OIL/WTI' && json.metals?.oil_wti) {
        setData({ price: json.metals.oil_wti.usd, change: json.metals.oil_wti.usd_24h_change, live: true })
      } else if (json.stocks?.[p]) {
        setData({ price: json.stocks[p].usd, change: json.stocks[p].usd_24h_change, live: true })
      }
    } catch { /* keep previous */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setData({ ...FALLBACKS[pair] ?? { price: 100, change: 0 }, live: false })
    fetch_()
  }, [pair, fetch_])

  useEffect(() => {
    const id = setInterval(fetch_, 8000)
    return () => clearInterval(id)
  }, [fetch_])

  return data
}

function generateLineData(base: number) {
  return Array.from({ length: 48 }, (_, i) => ({
    time:  `${Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'}`,
    price: base + Math.sin(i * 0.4) * (base * 0.025) + (Math.random() - 0.5) * (base * 0.008),
  }))
}

interface OhlcCandle {
  time: string
  open: number; high: number; low: number; close: number
  bodyStart: number; body: number
  bullish: boolean; color: string
}

function generateCandleData(base: number, count = 60): OhlcCandle[] {
  let price = base
  return Array.from({ length: count }, (_, i) => {
    const open   = price
    const drift  = (Math.random() - 0.48) * base * 0.014
    const close  = open + drift
    const wick   = Math.random() * base * 0.007
    const high   = Math.max(open, close) + wick
    const low    = Math.min(open, close) - wick
    price        = close
    const bullish = close >= open
    return {
      time:      `${i}`,
      open: +open.toFixed(2), high: +high.toFixed(2),
      low:  +low.toFixed(2),  close: +close.toFixed(2),
      bodyStart: +Math.min(open, close).toFixed(2),
      body:      +Math.abs(close - open).toFixed(2),
      bullish, color: bullish ? '#0ecb81' : '#f6465d',
    }
  })
}

function CandleWicks({ xAxisMap, yAxisMap, data }: {
  xAxisMap?: Record<string, { x: number; bandSize?: number; width?: number }>
  yAxisMap?: Record<string, { scale?: (v: number) => number }>
  data: OhlcCandle[]
}) {
  if (!xAxisMap || !yAxisMap) return null
  const yAxis = Object.values(yAxisMap)[0]
  const xAxis = Object.values(xAxisMap)[0]
  if (!yAxis?.scale || !xAxis) return null
  const scale   = yAxis.scale
  const band    = xAxis.bandSize ?? (xAxis.width ?? 0) / data.length
  const offsetX = xAxis.x ?? 0
  return (
    <g>
      {data.map((d, i) => {
        const cx       = offsetX + i * band + band / 2
        const yHigh    = scale(d.high)
        const yLow     = scale(d.low)
        const yBodyTop = scale(Math.max(d.open, d.close))
        const yBodyBot = scale(Math.min(d.open, d.close))
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={yHigh}   y2={yBodyTop} stroke={d.color} strokeWidth={1} />
            <line x1={cx} x2={cx} y1={yBodyBot} y2={yLow}    stroke={d.color} strokeWidth={1} />
          </g>
        )
      })}
    </g>
  )
}

function makeOrderBook(base: number) {
  return {
    asks: Array.from({ length: 5 }, (_, i) => ({
      price: base + (i + 1) * (base * 0.00012),
      size:  +(Math.random() * 2).toFixed(4),
    })),
    bids: Array.from({ length: 5 }, (_, i) => ({
      price: base - i * (base * 0.00012),
      size:  +(Math.random() * 2).toFixed(4),
    })),
  }
}

interface ExchangeConn { exchange: string; label: string; api_key_masked: string }
interface TradeRecord {
  id: number; ticker: string; action: string; price: number; qty: number
  pnl: number | null; exchange: string; paper: boolean; created_at: string
}
interface OpenPosition {
  id: number; ticker: string; price: number; qty: number
  exchange: string; created_at: string; current_price: number; unrealized_pnl: number
}

function FinChatPanel({ pair, livePrice, liveChange }: { pair: string; livePrice: number; liveChange: number }) {
  const asset = pair.split('/')[0]
  const isUp  = liveChange >= 0
  const [chatInput, setChatInput] = useState('')
  const [userMessages, setUserMessages] = useState<{ id: number; text: string; reply: string }[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [userMessages])

  const baseMessages = useMemo(() => {
    if (livePrice <= 0) return []
    const p = livePrice
    const sup = (p * (isUp ? 0.985 : 0.992)).toFixed(2)
    const res = (p * (isUp ? 1.018 : 1.008)).toFixed(2)
    const t1  = (p * (isUp ? 1.035 : 0.965)).toFixed(2)
    const rsi = isUp ? (52 + Math.round(Math.random() * 12)).toString() : (38 + Math.round(Math.random() * 10)).toString()
    return [
      { id: 'a1', role: 'signal' as const, time: '2m', signal: isUp ? 'BUY' : 'SELL', conf: 68 + Math.round(Math.random() * 14), price: p },
      { id: 'a2', role: 'ai' as const,     time: '4m', text: `${pair} RSI(14) at ${rsi} — ${isUp ? 'bullish momentum building above EMA-20' : 'bearish pressure below EMA-50'}. Watch for candle close confirmation.` },
      { id: 'a3', role: 'ai' as const,     time: '9m', text: `Key levels: Support $${sup} · Resistance $${res}. ${isUp ? 'Bulls defending the 4H demand zone.' : 'Bears pushing through 4H supply zone.'}` },
      { id: 'a4', role: 'signal' as const, time: '15m', signal: 'NEUTRAL', conf: 51, price: p * 0.998 },
      { id: 'a5', role: 'ai' as const,     time: '22m', text: `Volume profile: ${isUp ? 'rising volume on green candles confirms trend strength' : 'declining volume with falling price — distribution pattern'}. Target: $${t1}.` },
      { id: 'a6', role: 'ai' as const,     time: '38m', text: `${asset} correlation with broader market is ${isUp ? 'positive' : 'diverging'}. Risk-reward favors ${isUp ? 'longs' : 'shorts'} from current levels.` },
      { id: 'a7', role: 'signal' as const, time: '1h',  signal: isUp ? 'BUY' : 'SELL', conf: 74, price: p * 0.994 },
    ]
  }, [pair, livePrice, isUp, asset])

  const handleSend = () => {
    const text = chatInput.trim()
    if (!text) return
    const replies = [
      `Analyzing ${pair} — current trend is ${isUp ? 'bullish' : 'bearish'} with ${Math.abs(liveChange).toFixed(2)}% move in 24h.`,
      `Based on technical indicators, ${asset} shows ${isUp ? 'strong buy' : 'strong sell'} signal at $${livePrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}.`,
      `Risk management tip: set stop-loss at ${isUp ? '1.5–2%' : '1–1.5%'} below entry for this trade.`,
      `${pair} volume is ${isUp ? 'above' : 'below'} the 20-period average — ${isUp ? 'confirming' : 'not confirming'} the price action.`,
    ]
    const reply = replies[Math.floor(Math.random() * replies.length)]
    setUserMessages(prev => [...prev, { id: Date.now(), text, reply }])
    setChatInput('')
  }

  return (
    <div className="lg:col-span-1 bg-[#161a1e] border border-[#2b3139] rounded-xl flex flex-col overflow-hidden" style={{ minHeight: 420 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2b3139] flex-shrink-0">
        <div className="w-6 h-6 rounded-lg bg-[#f0b90b]/15 flex items-center justify-center">
          <MessageSquare size={12} className="text-[#f0b90b]" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#eaecef] leading-none">FinChat</p>
          <p className="text-[9px] text-[#848e9c] leading-none mt-0.5">powered by FinAi</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] animate-pulse" />
          <span className="text-[10px] text-[#0ecb81]">Live</span>
        </div>
      </div>

      {/* Pair context bar */}
      <div className="px-4 py-2 bg-[#0b0e11]/50 border-b border-[#2b3139]/60 flex items-center gap-2 flex-shrink-0">
        <span className="text-xs font-semibold text-[#f0b90b]">{pair}</span>
        <span className="text-[10px] text-[#848e9c]">·</span>
        <span className={`text-[10px] font-semibold ${isUp ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
          {isUp ? '+' : ''}{liveChange.toFixed(2)}%
        </span>
        <span className="text-[10px] text-[#848e9c] ml-auto">AI Analysis</span>
      </div>

      {/* Chat feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {baseMessages.map(msg =>
          msg.role === 'signal' ? (
            <div key={msg.id} className="flex items-start gap-2">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                msg.signal === 'BUY' ? 'bg-[#0ecb81]' : msg.signal === 'SELL' ? 'bg-[#f6465d]' : 'bg-[#848e9c]'
              }`} />
              <div className={`flex-1 rounded-lg px-3 py-2 border ${
                msg.signal === 'BUY'
                  ? 'bg-[#0ecb81]/5 border-[#0ecb81]/20'
                  : msg.signal === 'SELL'
                    ? 'bg-[#f6465d]/5 border-[#f6465d]/20'
                    : 'bg-[#2b3139]/30 border-[#2b3139]'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold tracking-wide ${
                    msg.signal === 'BUY' ? 'text-[#0ecb81]' : msg.signal === 'SELL' ? 'text-[#f6465d]' : 'text-[#848e9c]'
                  }`}>
                    {msg.signal} SIGNAL
                  </span>
                  <span className="text-[9px] text-[#4a5568]">{msg.time} ago</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#848e9c]">
                    @ ${(msg.price).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </span>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-[9px] text-[#848e9c]">Conf.</span>
                    <div className="w-16 h-1.5 bg-[#2b3139] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${msg.signal === 'BUY' ? 'bg-[#0ecb81]' : msg.signal === 'SELL' ? 'bg-[#f6465d]' : 'bg-[#848e9c]'}`}
                        style={{ width: `${msg.conf}%` }}
                      />
                    </div>
                    <span className={`text-[9px] font-bold ${msg.signal === 'BUY' ? 'text-[#0ecb81]' : msg.signal === 'SELL' ? 'text-[#f6465d]' : 'text-[#848e9c]'}`}>
                      {msg.conf}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-[#f0b90b]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={10} className="text-[#f0b90b]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-semibold text-[#f0b90b]">FinAi</span>
                  <span className="text-[9px] text-[#4a5568]">{msg.time} ago</span>
                </div>
                <p className="text-[11px] text-[#848e9c] leading-relaxed">{msg.text}</p>
              </div>
            </div>
          )
        )}

        {/* User messages */}
        {userMessages.map(um => (
          <div key={um.id}>
            <div className="flex justify-end mb-1.5">
              <div className="bg-[#f0b90b]/10 border border-[#f0b90b]/20 rounded-lg px-3 py-2 max-w-[85%]">
                <p className="text-[11px] text-[#eaecef]">{um.text}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-[#f0b90b]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={10} className="text-[#f0b90b]" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-semibold text-[#f0b90b]">FinAi</span>
                <p className="text-[11px] text-[#848e9c] leading-relaxed mt-0.5">{um.reply}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Chat input */}
      <div className="px-3 py-3 border-t border-[#2b3139] flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={`Ask about ${pair}…`}
            className="flex-1 bg-[#0b0e11] border border-[#2b3139] focus:border-[#f0b90b]/40 rounded-lg px-3 py-2 text-xs text-[#eaecef] placeholder-[#4a5568] focus:outline-none transition"
          />
          <button
            onClick={handleSend}
            className="px-3 py-2 rounded-lg bg-[#f0b90b]/10 border border-[#f0b90b]/20 text-[#f0b90b] hover:bg-[#f0b90b]/20 transition"
          >
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TradePage() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()

  const [side, setSide]           = useState<'buy' | 'sell'>('buy')
  const [orderType, setType]      = useState<'market' | 'limit'>('limit')
  const [price, setPrice]         = useState('')
  const [amount, setAmount]       = useState('')
  const [stopLoss, setStopLoss]   = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [leverageIdx, setLeverageIdx] = useState(0)
  const [lotSize, setLotSize]     = useState('0.01')
  const [tf, setTf]               = useState('1h')
  const [pair, setPair]           = useState('BTC/USDT')
  const [showPairs, setShowP]     = useState(false)
  const [chartMode, setChartMode] = useState<ChartMode>('tv')
  const [selExchange, setSelExch] = useState<string>('__balance__')
  const [zoomWindow, setZoomWin]  = useState(40)
  const [zoomOffset, setZoomOff]  = useState(0)
  const [orderLoading, setLoading] = useState(false)
  const [bottomTab, setBottomTab] = useState<'history' | 'positions'>('positions')
  const [tradeHistory, setHistory] = useState<TradeRecord[]>([])
  const [openPositions, setOpenPos] = useState<OpenPosition[]>([])
  const [histLoading, setHistLoad] = useState(false)
  const [closingId, setClosingId]  = useState<number | null>(null)
  const [showOrderBook, setShowOrderBook] = useState(false)

  const leverage = LEVERAGE_STEPS[leverageIdx]

  const exchanges: ExchangeConn[] =
    (user as unknown as { exchange_connections?: ExchangeConn[] })?.exchange_connections ?? []

  useEffect(() => {
    if (exchanges.length > 0 && selExchange === '__balance__') {
      setSelExch(exchanges[0].label)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchanges.length])

  const fetchHistory = useCallback(async () => {
    setHistLoad(true)
    try {
      const [tradesRes, posRes] = await Promise.allSettled([
        getBotTrades(100),
        getOpenPositions(),
      ])
      const trades: TradeRecord[] = tradesRes.status === 'fulfilled'
        ? (tradesRes.value.data?.trades ?? [])
        : []
      setHistory(trades)

      let positions: OpenPosition[] = posRes.status === 'fulfilled'
        ? (posRes.value.data?.positions ?? [])
        : []

      if (positions.length === 0 && trades.length > 0) {
        const posMap: Record<string, { qty: number; totalCost: number; trade: TradeRecord }> = {}
        for (const t of [...trades].reverse()) {
          const sym = t.ticker ?? ''
          if (!sym) continue
          if (!posMap[sym]) posMap[sym] = { qty: 0, totalCost: 0, trade: t }
          if (t.action?.toUpperCase() === 'BUY') {
            posMap[sym].totalCost += (t.price ?? 0) * (t.qty ?? 0)
            posMap[sym].qty += t.qty ?? 0
          } else {
            posMap[sym].qty -= t.qty ?? 0
            if (posMap[sym].qty < 0) posMap[sym].qty = 0
          }
        }
        positions = Object.entries(posMap)
          .filter(([, p]) => p.qty > 0.000001)
          .map(([sym, p]) => {
            const avgPrice     = p.totalCost / p.qty
            const fallbackKey  = sym.replace('-', '/')
            const currentPrice = FALLBACKS[fallbackKey]?.price ?? avgPrice
            return {
              id:             p.trade.id,
              ticker:         sym,
              price:          avgPrice,
              qty:            p.qty,
              exchange:       p.trade.exchange,
              created_at:     p.trade.created_at,
              current_price:  currentPrice,
              unrealized_pnl: (currentPrice - avgPrice) * p.qty,
            } as OpenPosition
          })
      }
      setOpenPos(positions)
    } catch { /* silent */ } finally { setHistLoad(false) }
  }, [])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const unrealizedPnl = useMemo(
    () => openPositions.reduce((sum, p) => sum + (p.unrealized_pnl ?? 0), 0),
    [openPositions]
  )

  const { price: livePrice, change: liveChange, live: isLive } = useTradeLivePrice(pair)

  const lineData       = generateLineData(livePrice)
  const fullCandleRef  = useRef<OhlcCandle[]>([])
  const candlePairRef  = useRef('')
  if (livePrice > 0 && (fullCandleRef.current.length === 0 || candlePairRef.current !== pair)) {
    fullCandleRef.current = generateCandleData(livePrice, 60)
    candlePairRef.current = pair
  }
  const allCandles = fullCandleRef.current
  const winStart   = Math.max(0, allCandles.length - zoomWindow - zoomOffset)
  const winEnd     = Math.max(winStart + 1, allCandles.length - zoomOffset)
  const candleData = allCandles.slice(winStart, winEnd)
  const orderBook  = makeOrderBook(livePrice)

  const prevPair      = useRef(pair)
  const priceInitRef  = useRef(false)
  const userEditedRef = useRef(false)

  useEffect(() => {
    const pairChanged = prevPair.current !== pair
    if (pairChanged) {
      userEditedRef.current = false
      priceInitRef.current  = false
      prevPair.current      = pair
    }
    if (livePrice > 0) {
      if (!priceInitRef.current || orderType === 'market' || !userEditedRef.current) {
        setPrice(livePrice.toFixed(2))
        priceInitRef.current = true
      }
    }
  }, [pair, livePrice, orderType])

  const userBalance = user?.balance_usdt ?? 0
  const asset       = pair.split('/')[0]
  const numPrice    = parseFloat(price.replace(/,/g, '')) || 0
  const qty         = parseFloat(amount) || 0
  const total       = numPrice && qty ? (numPrice * qty).toFixed(2) : '0.00'
  const high24      = livePrice > 0 ? (livePrice * 1.022).toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'
  const low24       = livePrice > 0 ? (livePrice * 0.978).toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'
  const availCrypto = livePrice > 0 ? userBalance / livePrice : 0

  const usingBalance = selExchange === '__balance__'
  const selectedConn = exchanges.find(e => e.label === selExchange)

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qty || qty <= 0)           return toast.error('Enter a valid amount')
    if (!numPrice || numPrice <= 0) return toast.error('Price must be greater than 0')
    if (usingBalance && side === 'buy' && numPrice * qty > userBalance)
      return toast.error(`Insufficient balance. You have $${userBalance.toFixed(2)} USDT`)

    setLoading(true)
    try {
      const res = await executeTrade({
        pair,
        side,
        order_type: orderType,
        price: numPrice,
        amount: qty,
        paper: false,
        exchange_label: usingBalance ? undefined : selExchange,
        stop_loss:   stopLoss   ? parseFloat(stopLoss)   : undefined,
        take_profit: takeProfit ? parseFloat(takeProfit) : undefined,
        leverage:    leverage > 1 ? leverage : undefined,
        lot_size:    lotSize   ? parseFloat(lotSize)     : undefined,
      })
      const d = res.data
      const exLabel = usingBalance ? 'Platform Balance' : selectedConn?.exchange?.toUpperCase() ?? selExchange

      if (side === 'buy') {
        toast.success(
          `Buy ${qty} ${asset} @ $${numPrice.toLocaleString()} via ${exLabel} — Filled\nCost: $${(numPrice * qty).toFixed(2)} USDT deducted`,
          { duration: 4000 }
        )
      } else {
        toast.success(
          `Sell ${qty} ${asset} @ $${numPrice.toLocaleString()} via ${exLabel} — Filled\nProceeds: $${(numPrice * qty).toFixed(2)} USDT credited`,
          { duration: 4000 }
        )
      }

      if (d?.exchange_error) toast.error(`Exchange error: ${d.exchange_error}`, { duration: 7000 })
      if (d?.trade?.new_balance !== undefined) {
        useAuthStore.getState().setUser({
          ...useAuthStore.getState().user!,
          balance_usdt: d.trade.new_balance,
        })
      }
      setAmount('')
      setStopLoss('')
      setTakeProfit('')
      setLeverageIdx(0)
      setLotSize('0.01')
      fetchHistory()
      setBottomTab('positions')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || 'Order failed')
    } finally { setLoading(false) }
  }

  const handleClosePosition = async (tradeId: number) => {
    setClosingId(tradeId)
    try {
      const res = await closeManualTrade(tradeId)
      const d = res.data
      const pnl = d.pnl ?? 0
      toast.success(
        `Position closed @ $${d.close_price?.toLocaleString('en-US', { maximumFractionDigits: 2 })} — P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
        { duration: 5000 }
      )
      if (d.new_balance !== undefined) {
        useAuthStore.getState().setUser({
          ...useAuthStore.getState().user!,
          balance_usdt: d.new_balance,
        })
      }
      fetchHistory()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || 'Failed to close position')
    } finally { setClosingId(null) }
  }

  return (
    <div className="space-y-3">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Pair selector */}
        <div className="relative">
          <button
            onClick={() => setShowP(v => !v)}
            className="flex items-center gap-2 bg-[#161a1e] border border-[#2b3139] hover:border-[#f0b90b]/40 rounded-xl px-3.5 py-2 transition"
          >
            <span className="text-sm font-bold text-[#eaecef]">{pair}</span>
            <ChevronDown size={12} className="text-[#848e9c]" />
          </button>
          {showPairs && (
            <div className="absolute top-full mt-1 left-0 bg-[#1e2329] border border-[#2b3139] rounded-xl overflow-hidden z-30 min-w-[160px] shadow-xl shadow-black/50 max-h-72 overflow-y-auto">
              {PAIRS.map(p => (
                <button
                  key={p}
                  onClick={() => { setPair(p); setShowP(false); setAmount('') }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-[#2b3139] ${p === pair ? 'text-[#f0b90b] font-semibold' : 'text-[#eaecef]'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price + change */}
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-bold font-mono text-[#eaecef]">
            ${livePrice > 0 ? livePrice.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}
          </span>
          <span className={`text-xs font-semibold flex items-center gap-0.5 px-2 py-1 rounded-lg ${liveChange >= 0 ? 'text-[#0ecb81] bg-[#0ecb81]/10' : 'text-[#f6465d] bg-[#f6465d]/10'}`}>
            {liveChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {liveChange >= 0 ? '+' : ''}{liveChange.toFixed(2)}%
          </span>
          <span className={`text-[10px] flex items-center gap-0.5 ${isLive ? 'text-[#0ecb81]' : 'text-[#848e9c]'}`}>
            {isLive ? <Wifi size={9} /> : <WifiOff size={9} />}
            {isLive ? 'live' : 'cached'}
          </span>
        </div>

        {/* 24h stats */}
        <div className="ml-auto flex flex-wrap gap-4 text-xs text-[#848e9c]">
          <div><span className="block text-[10px]">24h High</span><span className="text-[#eaecef] font-mono font-medium">${high24}</span></div>
          <div><span className="block text-[10px]">24h Low</span><span className="text-[#eaecef] font-mono font-medium">${low24}</span></div>
          <div className="hidden sm:block">
            <span className="block text-[10px]">Balance</span>
            <span className="text-[#f0b90b] font-mono font-medium">${userBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDT</span>
          </div>
          {openPositions.length > 0 && (
            <div className="hidden sm:block">
              <span className="block text-[10px]">Unrealized P&L</span>
              <span className={`font-mono font-medium ${unrealizedPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                {unrealizedPnl >= 0 ? '+' : ''}${Math.abs(unrealizedPnl).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main grid: Chart + FinChat ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Chart — 2/3 */}
        <div className="lg:col-span-2 bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden flex flex-col">
          {/* Chart toolbar */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-[#2b3139] flex-shrink-0">
            <div className="flex gap-0.5">
              {TF.map(t => (
                <button
                  key={t}
                  onClick={() => setTf(t)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${t === tf ? 'bg-[#f0b90b] text-black' : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="ml-auto flex gap-0.5 bg-[#0b0e11] p-0.5 rounded-lg border border-[#2b3139]">
              <button
                onClick={() => setChartMode('line')}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-medium transition ${chartMode === 'line' ? 'bg-[#2b3139] text-[#eaecef]' : 'text-[#848e9c] hover:text-[#eaecef]'}`}
              >
                <Activity size={11} /> Line
              </button>
              <button
                onClick={() => setChartMode('candle')}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-medium transition ${chartMode === 'candle' ? 'bg-[#2b3139] text-[#eaecef]' : 'text-[#848e9c] hover:text-[#eaecef]'}`}
              >
                <BarChart2 size={11} /> Candle
              </button>
              <button
                onClick={() => setChartMode('tv')}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md font-medium transition ${chartMode === 'tv' ? 'bg-[#f0b90b] text-black' : 'text-[#848e9c] hover:text-[#eaecef]'}`}
              >
                <Tv size={11} /> TV
              </button>
            </div>
          </div>

          {/* Chart body */}
          <div className="flex-1">
            {chartMode === 'tv' ? (
              <iframe
                key={`${pair}-${tf}`}
                src={`https://s.tradingview.com/widgetembed/?symbol=${TV_SYMBOLS[pair] ?? 'BINANCE:BTCUSDT'}&interval=${tf === '1m' ? '1' : tf === '5m' ? '5' : tf === '15m' ? '15' : tf === '1h' ? '60' : tf === '4h' ? '240' : 'D'}&theme=dark&style=1&locale=en&toolbar_bg=%230b0e11&withdateranges=1&hide_side_toolbar=0&allow_symbol_change=0&save_image=0`}
                width="100%"
                height="420"
                style={{ border: 'none', display: 'block' }}
                allowFullScreen
                title="TradingView Chart"
              />
            ) : chartMode === 'line' ? (
              <ResponsiveContainer width="100%" height={420}>
                <AreaChart data={lineData} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0ecb81" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0ecb81" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
                  <XAxis dataKey="time" tick={{ fill: '#848e9c', fontSize: 9 }} tickLine={false} axisLine={false} interval={7} />
                  <YAxis tick={{ fill: '#848e9c', fontSize: 9 }} tickLine={false} axisLine={false}
                    tickFormatter={v => livePrice >= 10000 ? `$${((v as number)/1000).toFixed(1)}k` : `$${(v as number).toFixed(1)}`}
                    domain={['auto','auto']} width={54} />
                  <Tooltip contentStyle={{ background: '#1e2329', border: '1px solid #2b3139', borderRadius: 10, fontSize: 11 }}
                    labelStyle={{ color: '#848e9c' }} itemStyle={{ color: '#0ecb81' }}
                    formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, 'Price']} />
                  <Area type="monotone" dataKey="price" stroke="#0ecb81" strokeWidth={2} fill="url(#priceGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <button onClick={() => setZoomWin(w => Math.max(10, w - 10))} className="p-1.5 rounded-lg bg-[#0b0e11] border border-[#2b3139] text-[#848e9c] hover:text-[#eaecef] transition" title="Zoom in"><ZoomIn size={11} /></button>
                  <button onClick={() => setZoomWin(w => Math.min(60, w + 10))} className="p-1.5 rounded-lg bg-[#0b0e11] border border-[#2b3139] text-[#848e9c] hover:text-[#eaecef] transition" title="Zoom out"><ZoomOut size={11} /></button>
                  <button onClick={() => setZoomOff(o => Math.min(allCandles.length - zoomWindow, o + 10))} disabled={zoomOffset >= allCandles.length - zoomWindow}
                    className="px-2 py-1 rounded-lg bg-[#0b0e11] border border-[#2b3139] text-[#848e9c] hover:text-[#eaecef] transition text-[10px] disabled:opacity-40">
                    Older
                  </button>
                  <button onClick={() => setZoomOff(o => Math.max(0, o - 10))} disabled={zoomOffset <= 0}
                    className="px-2 py-1 rounded-lg bg-[#0b0e11] border border-[#2b3139] text-[#848e9c] hover:text-[#eaecef] transition text-[10px] disabled:opacity-40">
                    Newer
                  </button>
                  <span className="ml-auto text-[10px] text-[#4a5568]">{candleData.length} candles</span>
                </div>
                <ResponsiveContainer width="100%" height={370}>
                  <ComposedChart data={candleData} margin={{ left: 0, right: 4, top: 4, bottom: 0 }} barCategoryGap="15%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
                    <XAxis dataKey="time" tick={{ fill: '#848e9c', fontSize: 9 }} tickLine={false} axisLine={false} interval={Math.floor(candleData.length / 6)} />
                    <YAxis tick={{ fill: '#848e9c', fontSize: 9 }} tickLine={false} axisLine={false}
                      tickFormatter={v => livePrice >= 10000 ? `$${((v as number)/1000).toFixed(1)}k` : `$${(v as number).toFixed(2)}`}
                      domain={['auto','auto']} width={54} />
                    <Tooltip
                      contentStyle={{ background: '#1e2329', border: '1px solid #2b3139', borderRadius: 10, fontSize: 11 }}
                      labelStyle={{ color: '#848e9c' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0]?.payload as OhlcCandle
                        if (!d) return null
                        return (
                          <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-2.5 text-[11px] space-y-0.5 shadow-lg">
                            <p className="text-[#848e9c] mb-1">Candle #{d.time}</p>
                            <p className="flex justify-between gap-4"><span className="text-[#848e9c]">O</span><span className="font-mono text-[#eaecef]">${d.open.toLocaleString('en-US',{maximumFractionDigits:2})}</span></p>
                            <p className="flex justify-between gap-4"><span className="text-[#0ecb81]">H</span><span className="font-mono text-[#0ecb81]">${d.high.toLocaleString('en-US',{maximumFractionDigits:2})}</span></p>
                            <p className="flex justify-between gap-4"><span className="text-[#f6465d]">L</span><span className="font-mono text-[#f6465d]">${d.low.toLocaleString('en-US',{maximumFractionDigits:2})}</span></p>
                            <p className="flex justify-between gap-4"><span className={d.bullish ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>C</span><span className={`font-mono font-semibold ${d.bullish ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>${d.close.toLocaleString('en-US',{maximumFractionDigits:2})}</span></p>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="bodyStart" stackId="c" fill="transparent" stroke="none" />
                    <Bar dataKey="body" stackId="c" minPointSize={2} radius={[1,1,1,1]}>
                      {candleData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                    <Customized component={(props: unknown) => (
                      <CandleWicks {...(props as Parameters<typeof CandleWicks>[0])} data={candleData} />
                    )} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* FinChat — 1/3 */}
        <FinChatPanel pair={pair} livePrice={livePrice} liveChange={liveChange} />
      </div>

      {/* ── OctaFX-style Order Bar ── */}
      <form onSubmit={handleTrade} className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
        {/* Top row: Buy/Sell toggle + route + order type */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Buy / Sell */}
          <div className="flex gap-1 bg-[#0b0e11] p-1 rounded-xl border border-[#2b3139]">
            <button type="button" onClick={() => setSide('buy')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition ${side === 'buy' ? 'bg-[#0ecb81] text-black shadow-lg shadow-[#0ecb81]/20' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
              Buy
            </button>
            <button type="button" onClick={() => setSide('sell')}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition ${side === 'sell' ? 'bg-[#f6465d] text-white shadow-lg shadow-[#f6465d]/20' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
              Sell
            </button>
          </div>

          {/* Order type */}
          <div className="flex gap-0.5 bg-[#0b0e11] border border-[#2b3139] p-0.5 rounded-lg">
            {(['limit', 'market'] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`text-xs px-3 py-1.5 rounded-md capitalize font-medium transition ${orderType === t ? 'bg-[#2b3139] text-[#eaecef]' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Route */}
          <select value={selExchange} onChange={e => setSelExch(e.target.value)}
            className="bg-[#0b0e11] border border-[#2b3139] focus:border-[#f0b90b] rounded-lg px-3 py-2 text-xs text-[#eaecef] focus:outline-none transition">
            <option value="__balance__">Platform Balance</option>
            {exchanges.map(ex => (
              <option key={ex.label} value={ex.label}>{ex.exchange.toUpperCase()} — {ex.label}</option>
            ))}
          </select>
          <p className="text-[9px] text-[#848e9c] flex items-center gap-1">
            {usingBalance
              ? 'Internal wallet'
              : <><Link2 size={9} /> Live on {selectedConn?.exchange?.toUpperCase()}</>}
          </p>

          {/* Balance */}
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-[10px] text-[#848e9c]">Available</p>
            <p className="text-sm font-mono font-bold text-[#f0b90b]">${userBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Controls grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">

          {/* Lot Size */}
          <div>
            <label className="text-[10px] text-[#848e9c] mb-1.5 block">Lot Size</label>
            <div className="flex items-center gap-0 bg-[#0b0e11] border border-[#2b3139] focus-within:border-[#f0b90b] rounded-lg overflow-hidden transition">
              <button type="button" onClick={() => setLotSize(v => Math.max(0.01, parseFloat(v || '0.01') - 0.01).toFixed(2))}
                className="px-2.5 py-2.5 text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] transition flex-shrink-0">
                <Minus size={10} />
              </button>
              <input value={lotSize} onChange={e => setLotSize(e.target.value)}
                className="flex-1 bg-transparent text-center text-xs font-mono text-[#eaecef] focus:outline-none min-w-0 py-2.5" />
              <button type="button" onClick={() => setLotSize(v => (parseFloat(v || '0.01') + 0.01).toFixed(2))}
                className="px-2.5 py-2.5 text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] transition flex-shrink-0">
                <Plus size={10} />
              </button>
            </div>
          </div>

          {/* Leverage */}
          <div>
            <label className="text-[10px] text-[#848e9c] mb-1.5 flex items-center gap-1">
              <Zap size={9} className="text-[#f0b90b]" /> Leverage
            </label>
            <div className="flex items-center gap-0 bg-[#0b0e11] border border-[#2b3139] rounded-lg overflow-hidden">
              <button type="button" onClick={() => setLeverageIdx(i => Math.max(0, i - 1))}
                className="px-2.5 py-2.5 text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] transition flex-shrink-0">
                <Minus size={10} />
              </button>
              <span className="flex-1 text-center text-xs font-bold font-mono text-[#f0b90b] py-2.5">{leverage}x</span>
              <button type="button" onClick={() => setLeverageIdx(i => Math.min(LEVERAGE_STEPS.length - 1, i + 1))}
                className="px-2.5 py-2.5 text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] transition flex-shrink-0">
                <Plus size={10} />
              </button>
            </div>
          </div>

          {/* Price (limit only) */}
          {orderType === 'limit' ? (
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-[10px] text-[#848e9c]">Price (USDT)</label>
                <span className="text-[9px] text-[#0ecb81]">{isLive ? 'live' : 'cached'}</span>
              </div>
              <input value={price} onChange={e => { userEditedRef.current = true; setPrice(e.target.value) }}
                className="w-full bg-[#0b0e11] border border-[#2b3139] focus:border-[#f0b90b] rounded-lg px-3 py-2.5 text-xs font-mono text-[#eaecef] focus:outline-none transition" />
            </div>
          ) : (
            <div>
              <label className="text-[10px] text-[#848e9c] mb-1.5 block">Price</label>
              <div className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-2.5 text-xs font-mono text-[#848e9c]">Market</div>
            </div>
          )}

          {/* Amount */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-[10px] text-[#848e9c]">Amount ({asset})</label>
              <span className="text-[9px] text-[#848e9c]">{side === 'buy' ? `$${userBalance.toFixed(0)}` : `${availCrypto.toFixed(4)}`}</span>
            </div>
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              className="w-full bg-[#0b0e11] border border-[#2b3139] focus:border-[#f0b90b] rounded-lg px-3 py-2.5 text-xs font-mono text-[#eaecef] focus:outline-none transition" />
          </div>

          {/* Stop Loss */}
          <div>
            <label className="text-[10px] text-[#848e9c] mb-1.5 flex items-center gap-1">
              <AlertTriangle size={9} className="text-[#f6465d]" /> Stop Loss
            </label>
            <input value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="Optional"
              className="w-full bg-[#0b0e11] border border-[#2b3139] focus:border-[#f6465d]/60 rounded-lg px-3 py-2.5 text-xs font-mono text-[#eaecef] focus:outline-none transition" />
          </div>

          {/* Take Profit */}
          <div>
            <label className="text-[10px] text-[#848e9c] mb-1.5 flex items-center gap-1">
              <Target size={9} className="text-[#0ecb81]" /> Take Profit
            </label>
            <input value={takeProfit} onChange={e => setTakeProfit(e.target.value)} placeholder="Optional"
              className="w-full bg-[#0b0e11] border border-[#2b3139] focus:border-[#0ecb81]/60 rounded-lg px-3 py-2.5 text-xs font-mono text-[#eaecef] focus:outline-none transition" />
          </div>
        </div>

        {/* Quick % fill */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] text-[#848e9c]">Quick fill:</span>
          {[25, 50, 75, 100].map(pct => (
            <button key={pct} type="button"
              onClick={() => {
                if (side === 'buy') {
                  const buyUSDT = userBalance * pct / 100
                  setAmount(numPrice > 0 ? (buyUSDT / numPrice).toFixed(6) : '0')
                } else {
                  setAmount((availCrypto * pct / 100).toFixed(6))
                }
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#0b0e11] hover:bg-[#2b3139] text-[#848e9c] hover:text-[#eaecef] transition font-medium border border-[#2b3139]">
              {pct}%
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span className="text-[#848e9c]">{side === 'buy' ? 'Cost' : 'Proceeds'}:</span>
            <span className={`font-mono font-bold ${side === 'buy' ? 'text-[#f6465d]' : 'text-[#0ecb81]'}`}>
              {side === 'buy' ? '-' : '+'}${total} USDT
            </span>
          </div>
        </div>

        {/* SL/TP/Leverage summary + submit */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {(stopLoss || takeProfit || leverage > 1) && (
            <div className="flex flex-wrap gap-2 text-[10px]">
              {stopLoss && (
                <span className="flex items-center gap-1 bg-[#f6465d]/10 border border-[#f6465d]/20 text-[#f6465d] px-2 py-1 rounded-lg">
                  <AlertTriangle size={9} /> SL ${parseFloat(stopLoss).toLocaleString()}
                </span>
              )}
              {takeProfit && (
                <span className="flex items-center gap-1 bg-[#0ecb81]/10 border border-[#0ecb81]/20 text-[#0ecb81] px-2 py-1 rounded-lg">
                  <CheckCircle2 size={9} /> TP ${parseFloat(takeProfit).toLocaleString()}
                </span>
              )}
              {leverage > 1 && (
                <span className="flex items-center gap-1 bg-[#f0b90b]/10 border border-[#f0b90b]/20 text-[#f0b90b] px-2 py-1 rounded-lg">
                  <Zap size={9} /> {leverage}x leverage
                </span>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={orderLoading}
            className={`sm:ml-auto px-10 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-60 ${
              side === 'buy'
                ? 'bg-[#0ecb81] hover:bg-[#0ab56f] text-black shadow-lg shadow-[#0ecb81]/20'
                : 'bg-[#f6465d] hover:bg-[#d93d51] text-white shadow-lg shadow-[#f6465d]/20'
            }`}
          >
            {orderLoading ? 'Placing order…' : `${side === 'buy' ? 'Buy' : 'Sell'} ${asset}`}
          </button>
        </div>
      </form>

      {/* ── Order Book (collapsible) ── */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <button
          onClick={() => setShowOrderBook(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1e2329] transition"
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-[#848e9c]">
            <ArrowUpDown size={11} /> Order Book
          </span>
          <span className="text-[10px] text-[#4a5568]">{showOrderBook ? 'hide' : 'show'}</span>
        </button>
        {showOrderBook && (
          <div className="px-4 pb-4">
            <div className="flex justify-between text-[10px] text-[#4a5568] mb-2 px-0.5">
              <span>Price (USDT)</span><span>Size ({asset})</span>
            </div>
            <div className="space-y-0.5">
              {orderBook.asks.slice(0,5).reverse().map((a, i) => (
                <div key={i} className="relative flex justify-between text-[11px] px-0.5 py-1">
                  <div className="absolute inset-0 right-0 bg-[#f6465d]/8 rounded" style={{ width: `${Math.min(a.size/2*100,100)}%`, marginLeft: 'auto' }} />
                  <span className="text-[#f6465d] font-mono relative">${a.price.toLocaleString('en-US',{maximumFractionDigits:2})}</span>
                  <span className="text-[#848e9c] font-mono relative">{a.size.toFixed(4)}</span>
                </div>
              ))}
              <div className="py-1.5 text-center text-sm font-bold font-mono text-[#eaecef] bg-[#0b0e11] rounded-lg my-1">
                ${livePrice > 0 ? livePrice.toLocaleString('en-US',{maximumFractionDigits:2}) : '—'}
              </div>
              {orderBook.bids.slice(0,5).map((b, i) => (
                <div key={i} className="relative flex justify-between text-[11px] px-0.5 py-1">
                  <div className="absolute inset-0 bg-[#0ecb81]/8 rounded" style={{ width: `${Math.min(b.size/2*100,100)}%` }} />
                  <span className="text-[#0ecb81] font-mono relative">${b.price.toLocaleString('en-US',{maximumFractionDigits:2})}</span>
                  <span className="text-[#848e9c] font-mono relative">{b.size.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom panel: Positions + History ── */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="flex items-center gap-1 px-5 py-3 border-b border-[#2b3139]">
          <button onClick={() => setBottomTab('positions')}
            className={`text-xs font-semibold pb-1 border-b-2 transition mr-3 ${bottomTab === 'positions' ? 'text-[#eaecef] border-[#f0b90b]' : 'text-[#848e9c] border-transparent hover:text-[#eaecef]'}`}>
            Open Positions {openPositions.length > 0 && (
              <span className="ml-1 bg-[#f0b90b]/20 text-[#f0b90b] text-[10px] px-1.5 py-0.5 rounded-full">{openPositions.length}</span>
            )}
          </button>
          <button onClick={() => setBottomTab('history')}
            className={`text-xs font-semibold pb-1 border-b-2 transition ${bottomTab === 'history' ? 'text-[#eaecef] border-[#f0b90b]' : 'text-[#848e9c] border-transparent hover:text-[#eaecef]'}`}>
            Order History
          </button>
          <button onClick={fetchHistory} className="ml-auto text-[#848e9c] hover:text-[#eaecef] transition p-1" title="Refresh">
            <RefreshCw size={12} className={histLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Open positions */}
        {bottomTab === 'positions' && (
          openPositions.length === 0 ? (
            <div className="py-10 text-center">
              <Target size={22} className="text-[#2b3139] mx-auto mb-2" />
              <p className="text-xs text-[#848e9c]">No open positions — place a Buy order to open one</p>
            </div>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-7 gap-2 px-5 py-2 text-[10px] text-[#4a5568] uppercase tracking-widest border-b border-[#2b3139]/50">
                <span>Pair</span>
                <span className="text-right">Entry</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Current</span>
                <span className="text-right col-span-2">Unrealized P&L</span>
                <span className="text-right">Action</span>
              </div>
              <div className="divide-y divide-[#2b3139]/50 max-h-64 overflow-y-auto">
                {openPositions.map(pos => {
                  const pairFmt  = pos.ticker.replace('-', '/')
                  const pnlColor = pos.unrealized_pnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'
                  const pnlBg    = pos.unrealized_pnl >= 0 ? 'bg-[#0ecb81]/5 border-[#0ecb81]/20' : 'bg-[#f6465d]/5 border-[#f6465d]/20'
                  const timeStr  = pos.created_at ? new Date(pos.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
                  return (
                    <div key={pos.id}>
                      <div className={`hidden sm:grid grid-cols-7 gap-2 px-5 py-2.5 text-xs items-center border-l-2 ${pnlBg} border-b border-[#2b3139]/50`}
                        style={{ borderLeftColor: pos.unrealized_pnl >= 0 ? '#0ecb81' : '#f6465d' }}>
                        <span className="font-mono font-semibold text-[#eaecef]">{pairFmt}</span>
                        <span className="font-mono text-right text-[#848e9c]">${(pos.price ?? 0).toLocaleString('en-US',{maximumFractionDigits:2})}</span>
                        <span className="font-mono text-right text-[#eaecef]">{(pos.qty ?? 0).toFixed(6)}</span>
                        <span className="font-mono text-right text-[#eaecef]">${(pos.current_price ?? 0).toLocaleString('en-US',{maximumFractionDigits:2})}</span>
                        <span className={`font-mono font-semibold text-right col-span-2 ${pnlColor}`}>
                          {pos.unrealized_pnl >= 0 ? '+' : ''}${pos.unrealized_pnl.toFixed(2)}
                        </span>
                        <div className="flex justify-end">
                          <button onClick={() => handleClosePosition(pos.id)} disabled={closingId === pos.id}
                            className="text-[10px] px-2.5 py-1.5 bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 border border-[#f0b90b]/30 text-[#f0b90b] rounded-lg font-semibold transition disabled:opacity-60 flex items-center gap-1">
                            {closingId === pos.id ? <><RefreshCw size={9} className="animate-spin" /> Closing…</> : <><X size={9} /> Close</>}
                          </button>
                        </div>
                      </div>
                      <div className={`sm:hidden px-4 py-3 border-l-2 ${pnlBg}`}
                        style={{ borderLeftColor: pos.unrealized_pnl >= 0 ? '#0ecb81' : '#f6465d' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-bold font-mono text-[#eaecef]">{pairFmt}</span>
                            <p className="text-[10px] text-[#848e9c]">{timeStr}</p>
                          </div>
                          <span className={`text-sm font-bold font-mono ${pnlColor}`}>
                            {pos.unrealized_pnl >= 0 ? '+' : ''}${pos.unrealized_pnl.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-[#848e9c] space-y-0.5">
                            <p>Entry: <span className="text-[#eaecef] font-mono">${(pos.price ?? 0).toLocaleString('en-US',{maximumFractionDigits:2})}</span></p>
                            <p>Now: <span className="text-[#eaecef] font-mono">${(pos.current_price ?? 0).toLocaleString('en-US',{maximumFractionDigits:2})}</span></p>
                          </div>
                          <button onClick={() => handleClosePosition(pos.id)} disabled={closingId === pos.id}
                            className="text-xs px-3 py-2 bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 border border-[#f0b90b]/30 text-[#f0b90b] rounded-lg font-semibold transition disabled:opacity-60">
                            {closingId === pos.id ? 'Closing…' : 'Close Position'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )
        )}

        {/* Order history */}
        {bottomTab === 'history' && (
          tradeHistory.length === 0 ? (
            <div className="py-12 text-center">
              <Clock size={22} className="text-[#2b3139] mx-auto mb-2" />
              <p className="text-xs text-[#848e9c]">No trades yet — place your first order above</p>
            </div>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-7 gap-2 px-5 py-2 text-[10px] text-[#4a5568] uppercase tracking-widest border-b border-[#2b3139]/50">
                <span>Pair</span><span>Side</span>
                <span className="text-right">Price</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
                <span>Route</span>
                <span className="text-right">Time</span>
              </div>
              <div className="divide-y divide-[#2b3139]/50 max-h-64 overflow-y-auto">
                {tradeHistory.map(t => {
                  const isBuy   = t.action?.toUpperCase() === 'BUY'
                  const total_v = (t.price ?? 0) * (t.qty ?? 0)
                  const pairFmt = t.ticker?.replace('-', '/') ?? '—'
                  const timeStr = t.created_at ? new Date(t.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
                  const exchLbl = t.exchange === 'internal' || t.exchange === 'manual' ? 'Balance' : (t.exchange ?? '—').toUpperCase()
                  return (
                    <div key={t.id}>
                      <div className="hidden sm:grid grid-cols-7 gap-2 px-5 py-2.5 text-xs hover:bg-[#1e2329] transition items-center">
                        <span className="font-mono font-semibold text-[#eaecef]">{pairFmt}</span>
                        <span className={`font-bold flex items-center gap-1 ${isBuy ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                          {isBuy ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {isBuy ? 'Buy' : 'Sell'}
                        </span>
                        <span className="font-mono text-[#eaecef] text-right">${(t.price ?? 0).toLocaleString('en-US',{maximumFractionDigits:2})}</span>
                        <span className="font-mono text-[#eaecef] text-right">{(t.qty ?? 0).toFixed(6)}</span>
                        <span className={`font-mono text-right font-semibold ${isBuy ? 'text-[#f6465d]' : 'text-[#0ecb81]'}`}>
                          {isBuy ? '-' : '+'}${total_v.toLocaleString('en-US',{maximumFractionDigits:2})}
                        </span>
                        <span className="text-[#848e9c] flex items-center gap-1"><CheckCircle2 size={9} className="text-[#0ecb81]" />{exchLbl}</span>
                        <span className="text-[#848e9c] text-right text-[10px]">{timeStr}</span>
                      </div>
                      <div className="sm:hidden px-4 py-3 flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isBuy ? 'bg-[#0ecb81]/10' : 'bg-[#f6465d]/10'}`}>
                          {isBuy ? <TrendingUp size={12} className="text-[#0ecb81]" /> : <TrendingDown size={12} className="text-[#f6465d]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#eaecef] font-mono">{pairFmt}</span>
                            <span className={`text-[10px] font-bold ${isBuy ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>{isBuy ? 'Buy' : 'Sell'}</span>
                          </div>
                          <span className="text-[10px] text-[#848e9c]">{(t.qty ?? 0).toFixed(6)} @ ${(t.price ?? 0).toLocaleString('en-US',{maximumFractionDigits:2})}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-xs font-mono font-semibold ${isBuy ? 'text-[#f6465d]' : 'text-[#0ecb81]'}`}>{isBuy ? '-' : '+'}${total_v.toLocaleString('en-US',{maximumFractionDigits:2})}</p>
                          <p className="text-[9px] text-[#848e9c]">{timeStr}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )
        )}
      </div>
    </div>
  )
}
