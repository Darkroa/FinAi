import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Bot, Plus, MessageSquare, Trash2, Lock, ChevronLeft, Zap,
  TrendingUp, TrendingDown, RefreshCw, Clock,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useLanguage } from '../contexts/LanguageContext'

// ── Types ────────────────────────────────────────────────────────────────────
interface Message { role: 'user' | 'ai'; text: string; time: string }
interface Conversation { id: string; title: string; messages: Message[]; createdAt: string }

interface CoinData      { symbol: string; name: string; cgId: string; price: number; change: number; high: number; low: number; volume: number }
interface FxRate        { code: string; name: string; rate: number; usdRate: number }
interface IndexData     { ticker: string; name: string; price: number; change: number }
interface CommodityData { ticker: string; name: string; symbol: string; unit: string; price: number; change: number }
interface SessionInfo   { tokyo: boolean; london: boolean; new_york: boolean }
interface DateInfo      { utc: string; day: string; is_weekend: boolean; sessions: SessionInfo }

type MarketTab = 'crypto' | 'fx' | 'indexes' | 'metals'

const COINS: { symbol: string; name: string; cgId: string }[] = [
  { symbol: 'BTC',  name: 'Bitcoin',  cgId: 'bitcoin'      },
  { symbol: 'ETH',  name: 'Ethereum', cgId: 'ethereum'     },
  { symbol: 'SOL',  name: 'Solana',   cgId: 'solana'       },
  { symbol: 'BNB',  name: 'BNB',      cgId: 'binancecoin'  },
  { symbol: 'XRP',  name: 'XRP',      cgId: 'ripple'       },
  { symbol: 'ADA',  name: 'Cardano',  cgId: 'cardano'      },
  { symbol: 'DOGE', name: 'Doge',     cgId: 'dogecoin'     },
]

const QUICK_CHIPS = [
  'BTC analysis right now',
  'What time is it and what session is open?',
  'EUR/USD outlook today',
  'S&P 500 — buy or sell?',
  'Gold XAU/USD analysis',
  'WTI Oil price and trend',
  'Best crypto to trade this session',
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeId()  { return Math.random().toString(36).slice(2) }
function makeTitle(msg: string) { return msg.slice(0, 40) + (msg.length > 40 ? '…' : '') }
function fmtPrice(p: number, decimals = 2) {
  if (p === 0) return '—'
  if (p < 0.01) return p.toFixed(6)
  if (p < 1)    return p.toFixed(4)
  return p.toLocaleString('en-US', { maximumFractionDigits: decimals })
}

const WELCOME: Message = {
  role: 'ai',
  text: "Hello! I'm Chat Fin — your AI financial assistant with live market data. I know today's date, time, open trading sessions, live crypto prices, FX rates, and stock indexes. Ask me anything!",
  time: new Date().toLocaleTimeString(),
}

function loadConversations(): Conversation[] {
  try { return JSON.parse(localStorage.getItem('chatfin-convos') || '[]') } catch { return [] }
}
function saveConversations(c: Conversation[]) {
  localStorage.setItem('chatfin-convos', JSON.stringify(c))
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ChatFinPage() {
  const navigate = useNavigate()
  const { token, user } = useAuthStore()
  const { t }   = useLanguage()
  const isSubscriber = (user?.account_tier ?? 0) >= 1

  const [conversations, setConversations] = useState<Conversation[]>(loadConversations)
  const [activeId, setActiveId] = useState<string | null>(() => {
    const s = loadConversations(); return s.length > 0 ? s[0].id : null
  })
  const [input,  setInput]  = useState('')
  const [typing, setTyping] = useState(false)

  // Market data state
  const [marketTab,   setMarketTab]   = useState<MarketTab>('crypto')
  const [coins,       setCoins]       = useState<CoinData[]>([])
  const [fxRates,     setFxRates]     = useState<FxRate[]>([])
  const [indexes,     setIndexes]     = useState<IndexData[]>([])
  const [dateInfo,    setDateInfo]    = useState<DateInfo | null>(null)
  const [mktLoading,  setMktLoading]  = useState(true)
  const [commodities,    setCommodities]    = useState<CommodityData[]>([])
  const [selectedCoin,   setSelectedCoin]   = useState<CoinData | null>(null)
  const [selectedFx,     setSelectedFx]     = useState<FxRate | null>(null)
  const [selectedIndex,  setSelectedIndex]  = useState<IndexData | null>(null)
  const [selectedCommod, setSelectedCommod] = useState<CommodityData | null>(null)

  const endRef   = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeConvo = conversations.find(c => c.id === activeId) ?? null
  const messages    = activeConvo?.messages ?? [WELCOME]

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  // ── Fetch all market data ──
  const fetchMarketData = useCallback(async () => {
    setMktLoading(true)
    try {
      const [pricesRes, extRes] = await Promise.all([
        fetch('/api/public/prices'),
        fetch('/api/public/market-extended'),
      ])
      const pricesData = await pricesRes.json()
      const extData    = await extRes.json()

      // Crypto
      const built: CoinData[] = COINS.map(c => {
        const d = pricesData[c.cgId] ?? {}
        return { ...c, price: d.usd ?? 0, change: d.usd_24h_change ?? 0, high: d.usd_24h_high ?? 0, low: d.usd_24h_low ?? 0, volume: d.usd_24h_vol ?? 0 }
      }).filter(c => c.price > 0)
      setCoins(built)
      if (built.length > 0 && !selectedCoin) setSelectedCoin(built[0])

      // FX
      const fxRaw: Record<string, { rate: number; name: string }> = extData?.fx?.rates ?? {}
      const fxBuilt: FxRate[] = Object.entries(fxRaw).map(([code, info]) => ({
        code,
        name: info.name,
        rate: info.rate,
        usdRate: code === 'JPY' ? info.rate : (info.rate > 0 ? 1 / info.rate : 0),
      }))
      setFxRates(fxBuilt)

      // Indexes
      const idxRaw: Record<string, { name: string; price: number; change: number }> = extData?.indexes ?? {}
      const idxBuilt: IndexData[] = Object.entries(idxRaw).map(([ticker, info]) => ({
        ticker, name: info.name, price: info.price, change: info.change,
      })).filter(i => i.price > 0)
      setIndexes(idxBuilt)

      // Commodities (Gold, Silver, Oil)
      const comRaw: Record<string, { name: string; symbol: string; unit: string; price: number; change: number }> = extData?.commodities ?? {}
      const comBuilt: CommodityData[] = Object.entries(comRaw).map(([ticker, info]) => ({
        ticker, name: info.name, symbol: info.symbol, unit: info.unit,
        price: info.price, change: info.change,
      })).filter(c => c.price > 0)
      setCommodities(comBuilt)
      if (comBuilt.length > 0 && !selectedCommod) setSelectedCommod(comBuilt[0])

      // DateTime
      if (extData?.datetime) setDateInfo(extData.datetime)
    } catch {
      /* keep stale data */
    } finally {
      setMktLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchMarketData()
    const id = setInterval(fetchMarketData, 60_000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Conversation helpers ──
  const persistConvos = useCallback((c: Conversation[]) => { setConversations(c); saveConversations(c) }, [])

  const newConversation = useCallback(() => {
    const id = makeId()
    persistConvos([{ id, title: 'New conversation', messages: [{ ...WELCOME, time: new Date().toLocaleTimeString() }], createdAt: new Date().toISOString() }, ...conversations])
    setActiveId(id)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [conversations, persistConvos])

  const deleteConversation = useCallback((id: string) => {
    const updated = conversations.filter(c => c.id !== id)
    persistConvos(updated)
    if (activeId === id) setActiveId(updated[0]?.id ?? null)
  }, [conversations, activeId, persistConvos])

  // ── Send message ──
  const sendMessage = async (text: string) => {
    const q = text.trim()
    if (!q) return
    setInput('')

    const userMsg: Message = { role: 'user', text: q, time: new Date().toLocaleTimeString() }
    let targetId      = activeId
    let updatedConvos = [...conversations]

    if (!targetId) {
      const id = makeId()
      updatedConvos = [{ id, title: makeTitle(q), messages: [{ ...WELCOME, time: new Date().toLocaleTimeString() }, userMsg], createdAt: new Date().toISOString() }, ...updatedConvos]
      persistConvos(updatedConvos)
      setActiveId(id)
      targetId = id
    } else {
      updatedConvos = updatedConvos.map(c => {
        if (c.id !== targetId) return c
        const isFirst = c.messages.filter(m => m.role === 'user').length === 0
        return { ...c, title: isFirst ? makeTitle(q) : c.title, messages: [...c.messages, userMsg] }
      })
      persistConvos(updatedConvos)
    }

    setTyping(true)
    try {
      const body: Record<string, unknown> = { message: q }
      // Inject selected asset context
      if (marketTab === 'crypto' && selectedCoin && selectedCoin.price > 0) {
        body.pair = `${selectedCoin.symbol}/USDT`; body.price = selectedCoin.price
        body.change_24h = selectedCoin.change; body.high_24h = selectedCoin.high
        body.low_24h = selectedCoin.low; body.volume_24h = selectedCoin.volume
      } else if (marketTab === 'fx' && selectedFx) {
        body.pair = `${selectedFx.code}/USD`
      } else if (marketTab === 'indexes' && selectedIndex) {
        body.pair = selectedIndex.name
      } else if (marketTab === 'metals' && selectedCommod) {
        body.pair = selectedCommod.symbol
      }

      const res  = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      const aiMsg: Message = { role: 'ai', text: data.reply || 'Sorry, I could not process that.', time: new Date().toLocaleTimeString() }
      updatedConvos = updatedConvos.map(c => c.id === targetId ? { ...c, messages: [...c.messages, aiMsg] } : c)
      persistConvos(updatedConvos)
    } catch {
      const errMsg: Message = { role: 'ai', text: 'Connection error — please try again.', time: new Date().toLocaleTimeString() }
      updatedConvos = updatedConvos.map(c => c.id === targetId ? { ...c, messages: [...c.messages, errMsg] } : c)
      persistConvos(updatedConvos)
    } finally { setTyping(false) }
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input) }

  // ── Paywall ──
  if (!isSubscriber) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="w-16 h-16 rounded-2xl bg-[#f0b90b]/10 border border-[#f0b90b]/20 flex items-center justify-center mx-auto mb-5">
            <Lock size={28} className="text-[#f0b90b]" />
          </div>
          <h2 className="text-lg font-bold text-[#eaecef] mb-2">Chat Fin is available to subscribers</h2>
          <p className="text-sm text-[#848e9c] leading-relaxed mb-6">
            Upgrade your account to unlock Chat Fin — your AI financial assistant for real-time market analysis, trading signals, and strategy advice.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button onClick={() => navigate('/app/pricing')}
              className="inline-flex items-center justify-center gap-2 bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-bold px-6 py-2.5 rounded-xl text-sm transition">
              <Zap size={14} /> See Pricing &amp; Upgrade
            </button>
            <button onClick={() => navigate('/app/support')}
              className="inline-flex items-center justify-center text-xs text-[#848e9c] hover:text-[#eaecef] border border-[#2b3139] px-4 py-2.5 rounded-xl transition">
              Contact support
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Session badge helper ──
  const sessionBadges = dateInfo ? [
    { label: 'Tokyo',    open: dateInfo.sessions.tokyo    },
    { label: 'London',   open: dateInfo.sessions.london   },
    { label: 'New York', open: dateInfo.sessions.new_york },
  ] : []

  return (
    <div className="fixed inset-x-0 flex flex-col bg-[#0b0e11] z-20" style={{ top: '56px', bottom: '56px' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-[#2b3139] bg-[#0b0e11] flex-shrink-0">
        <button onClick={() => navigate('/app/dashboard')}
          className="flex items-center gap-1 text-sm text-[#848e9c] hover:text-[#eaecef] transition font-medium">
          <ChevronLeft size={16} /><span>{t('chat.dashboard')}</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#f0b90b] flex items-center justify-center">
            <Bot size={12} className="text-black" />
          </div>
          <p className="text-sm font-bold text-[#eaecef]">Chat Fin</p>
          <span className="w-1.5 h-1.5 bg-[#0ecb81] rounded-full animate-pulse" />
        </div>
        <button onClick={newConversation}
          className="flex items-center gap-1 text-xs text-[#f0b90b] border border-[#f0b90b]/30 bg-[#f0b90b]/10 px-3 py-1.5 rounded-xl hover:bg-[#f0b90b]/20 transition">
          <Plus size={12} /> {t('btn.newchat')}
        </button>
      </div>

      {/* ── Market strip ── */}
      <div className="flex-shrink-0 bg-[#161a1e] border-b border-[#2b3139]">

        {/* Date + sessions row */}
        {dateInfo && (
          <div className="flex items-center gap-3 px-3 pt-1.5 pb-0.5 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 flex-shrink-0">
              <Clock size={9} className="text-[#848e9c]" />
              <span className="text-[10px] text-[#848e9c]">{dateInfo.utc} UTC · {dateInfo.day}</span>
            </div>
            {sessionBadges.map(s => (
              <span key={s.label}
                className={`flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.open ? 'bg-[#0ecb81]/15 text-[#0ecb81]' : 'bg-[#2b3139] text-[#4a5568]'}`}>
                {s.label} {s.open ? '●' : '○'}
              </span>
            ))}
          </div>
        )}

        {/* Tab row */}
        <div className="flex items-center gap-0 px-3 pt-1">
          {(['crypto', 'fx', 'indexes', 'metals'] as MarketTab[]).map(tab => (
            <button key={tab}
              onClick={() => setMarketTab(tab)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-t-lg border-b-2 transition ${
                marketTab === tab
                  ? 'border-[#f0b90b] text-[#f0b90b]'
                  : 'border-transparent text-[#848e9c] hover:text-[#eaecef]'
              }`}>
              {tab === 'fx' ? 'FX / Forex' : tab === 'indexes' ? 'Indexes' : tab === 'metals' ? 'Metals & Oil' : 'Crypto'}
            </button>
          ))}
          <button onClick={fetchMarketData} className="ml-auto text-[#848e9c] hover:text-[#f0b90b] transition p-1.5">
            <RefreshCw size={10} className={mktLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Asset scroll row */}
        <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto scrollbar-none">
          {mktLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 h-7 w-24 bg-[#2b3139] rounded-lg animate-pulse" />
            ))
          ) : marketTab === 'crypto' ? (
            coins.map(coin => {
              const isUp = coin.change >= 0
              const active = selectedCoin?.symbol === coin.symbol
              return (
                <button key={coin.symbol} onClick={() => setSelectedCoin(coin)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                    active ? 'bg-[#f0b90b]/10 border-[#f0b90b]/40' : 'border-transparent hover:border-[#2b3139] hover:bg-[#1e2329]'
                  }`}>
                  <span className="text-[11px] font-bold text-[#eaecef]">{coin.symbol}</span>
                  <span className="text-[10px] font-mono text-[#848e9c]">${fmtPrice(coin.price)}</span>
                  <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${isUp ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                    {isUp ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                    {isUp ? '+' : ''}{coin.change.toFixed(2)}%
                  </span>
                </button>
              )
            })
          ) : marketTab === 'fx' ? (
            fxRates.map(fx => {
              const active = selectedFx?.code === fx.code
              return (
                <button key={fx.code} onClick={() => setSelectedFx(fx)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                    active ? 'bg-[#f0b90b]/10 border-[#f0b90b]/40' : 'border-transparent hover:border-[#2b3139] hover:bg-[#1e2329]'
                  }`}>
                  <span className="text-[11px] font-bold text-[#eaecef]">{fx.code === 'JPY' ? `USD/${fx.code}` : `${fx.code}/USD`}</span>
                  <span className="text-[10px] font-mono text-[#848e9c]">
                    {fx.code === 'JPY' ? fx.rate.toFixed(2) : fmtPrice(fx.usdRate, 5)}
                  </span>
                </button>
              )
            })
          ) : marketTab === 'indexes' ? (
            indexes.map(idx => {
              const isUp = idx.change >= 0
              const active = selectedIndex?.ticker === idx.ticker
              return (
                <button key={idx.ticker} onClick={() => setSelectedIndex(idx)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                    active ? 'bg-[#f0b90b]/10 border-[#f0b90b]/40' : 'border-transparent hover:border-[#2b3139] hover:bg-[#1e2329]'
                  }`}>
                  <span className="text-[11px] font-bold text-[#eaecef]">{idx.name}</span>
                  <span className="text-[10px] font-mono text-[#848e9c]">{fmtPrice(idx.price)}</span>
                  <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${isUp ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                    {isUp ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                    {isUp ? '+' : ''}{idx.change.toFixed(2)}%
                  </span>
                </button>
              )
            })
          ) : (
            /* Metals & Oil */
            commodities.map(com => {
              const isUp = com.change >= 0
              const active = selectedCommod?.ticker === com.ticker
              return (
                <button key={com.ticker} onClick={() => setSelectedCommod(com)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                    active ? 'bg-[#f0b90b]/10 border-[#f0b90b]/40' : 'border-transparent hover:border-[#2b3139] hover:bg-[#1e2329]'
                  }`}>
                  <span className="text-[11px] font-bold text-[#eaecef]">{com.symbol}</span>
                  <span className="text-[10px] font-mono text-[#848e9c]">${fmtPrice(com.price)}<span className="text-[9px] text-[#4a5568]">/{com.unit}</span></span>
                  <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${isUp ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                    {isUp ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                    {isUp ? '+' : ''}{com.change.toFixed(2)}%
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Context info row */}
        <div className="px-3 pb-1.5 flex items-center gap-2 text-[10px] text-[#4a5568]">
          {marketTab === 'crypto' && selectedCoin && (
            <>
              <span className="text-[#848e9c]">{selectedCoin.name} context active</span>
              {selectedCoin.high > 0 && <span>H: <span className="text-[#0ecb81]">${fmtPrice(selectedCoin.high)}</span></span>}
              {selectedCoin.low  > 0 && <span>L: <span className="text-[#f6465d]">${fmtPrice(selectedCoin.low)}</span></span>}
            </>
          )}
          {marketTab === 'fx' && selectedFx && (
            <span className="text-[#848e9c]">{selectedFx.name} — AI will use live FX context</span>
          )}
          {marketTab === 'indexes' && selectedIndex && (
            <span className="text-[#848e9c]">{selectedIndex.name} — AI will use live index context</span>
          )}
          {marketTab === 'metals' && selectedCommod && (
            <>
              <span className="text-[#848e9c]">{selectedCommod.name} ({selectedCommod.symbol}) context active</span>
              <span className="text-[#eaecef]">${fmtPrice(selectedCommod.price)}<span className="text-[#4a5568]">/{selectedCommod.unit}</span></span>
            </>
          )}
          {!selectedCoin && !selectedFx && !selectedIndex && !selectedCommod && (
            <span>Select an asset above to focus AI context</span>
          )}
        </div>
      </div>

      {/* ── Body: sidebar + chat ── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar — desktop only */}
        <aside className="hidden sm:flex w-56 flex-shrink-0 bg-[#161a1e] border-r border-[#2b3139] flex-col">
          <div className="flex-1 overflow-y-auto py-2">
            {conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <MessageSquare size={20} className="text-[#2b3139]" />
                <p className="text-xs text-[#848e9c]">No conversations yet</p>
              </div>
            )}
            {conversations.map(convo => (
              <div key={convo.id}
                className={`group flex items-center gap-2 px-3 py-2.5 mx-2 rounded-xl cursor-pointer transition mb-0.5 ${
                  activeId === convo.id ? 'bg-[#f0b90b]/10 border border-[#f0b90b]/20' : 'hover:bg-[#2b3139]/60'
                }`}
                onClick={() => setActiveId(convo.id)}>
                <MessageSquare size={13} className={activeId === convo.id ? 'text-[#f0b90b] flex-shrink-0' : 'text-[#848e9c] flex-shrink-0'} />
                <p className={`text-xs flex-1 truncate ${activeId === convo.id ? 'text-[#eaecef] font-medium' : 'text-[#848e9c]'}`}>
                  {convo.title}
                </p>
                <button onClick={e => { e.stopPropagation(); deleteConversation(convo.id) }}
                  className="opacity-0 group-hover:opacity-100 transition text-[#4a5568] hover:text-[#f6465d] flex-shrink-0">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat column */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0b0e11]">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

            {/* Quick chips — only on fresh conversation */}
            {messages.filter(m => m.role === 'user').length === 0 && (
              <div className="pb-2">
                <p className="text-[10px] text-[#4a5568] mb-2 text-center">Suggested questions</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {QUICK_CHIPS.map(chip => (
                    <button key={chip} onClick={() => sendMessage(chip)}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-[#2b3139] text-[#848e9c] hover:border-[#f0b90b]/40 hover:text-[#eaecef] hover:bg-[#f0b90b]/5 transition">
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-[#f0b90b] flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <Bot size={13} className="text-black" />
                  </div>
                )}
                <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user' ? 'bg-[#f0b90b]/10 border border-[#f0b90b]/20' : 'bg-[#1e2329] border border-[#2b3139]'
                }`}>
                  <p className="text-sm text-[#eaecef] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <p className="text-[9px] text-[#4a5568] mt-1">{msg.time}</p>
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-lg bg-[#f0b90b] flex items-center justify-center mr-2 flex-shrink-0">
                  <Bot size={13} className="text-black" />
                </div>
                <div className="bg-[#1e2329] border border-[#2b3139] rounded-2xl px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-1.5 h-1.5 bg-[#848e9c] rounded-full animate-bounce"
                        style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input bar */}
          <div className="border-t border-[#2b3139] px-4 pt-3 pb-3 bg-[#161a1e] flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                placeholder={
                  marketTab === 'crypto'  && selectedCoin   ? `Ask about ${selectedCoin.symbol} or any market…`
                  : marketTab === 'fx'   && selectedFx      ? `Ask about ${selectedFx.code}/USD or any forex pair…`
                  : marketTab === 'indexes' && selectedIndex ? `Ask about ${selectedIndex.name}…`
                  : marketTab === 'metals' && selectedCommod ? `Ask about ${selectedCommod.name} (${selectedCommod.symbol})…`
                  : t('chat.placeholder')
                }
                className="flex-1 bg-[#0b0e11] border border-[#2b3139] rounded-xl px-4 py-3 text-sm text-[#eaecef] placeholder-[#4a5568] focus:outline-none focus:border-[#f0b90b] transition" />
              <button type="submit" disabled={typing || !input.trim()}
                className="w-12 h-12 flex items-center justify-center bg-[#f0b90b] hover:bg-[#d9a60b] disabled:opacity-50 text-black rounded-xl transition flex-shrink-0">
                <Send size={16} />
              </button>
            </form>
            <p className="text-[10px] text-[#4a5568] text-center mt-2">
              {t('chat.disclaimer')} ·{' '}
              <a href="mailto:supportfinaibot@gmail.com" className="hover:text-[#848e9c] transition">
                supportfinaibot@gmail.com
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
