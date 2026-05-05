import { useState } from 'react'
import { ArrowUpDown, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

const generateCandles = () =>
  Array.from({ length: 48 }, (_, i) => ({
    time: `${Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'}`,
    price: 67000 + Math.sin(i * 0.4) * 2000 + Math.random() * 800,
  }))

const orderBook = {
  asks: Array.from({ length: 7 }, (_, i) => ({ price: 67500 + i * 10, size: +(Math.random() * 2).toFixed(4) })),
  bids: Array.from({ length: 7 }, (_, i) => ({ price: 67450 - i * 10, size: +(Math.random() * 2).toFixed(4) })),
}

const PAIRS = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT']
const TF    = ['1m', '5m', '15m', '1h', '4h', '1D']

export default function TradePage() {
  const [side, setSide]         = useState<'buy' | 'sell'>('buy')
  const [orderType, setType]    = useState<'market' | 'limit'>('limit')
  const [price, setPrice]       = useState('67,432.10')
  const [amount, setAmount]     = useState('')
  const [tf, setTf]             = useState('1h')
  const [pair, setPair]         = useState('BTC/USDT')
  const [showPairs, setShowP]   = useState(false)
  const chartData = generateCandles()

  const total = price && amount ? (parseFloat(price.replace(/,/g, '')) * parseFloat(amount)).toFixed(2) : '0.00'

  const handleTrade = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`${side === 'buy' ? '▲ Buy' : '▼ Sell'} order placed (demo mode)`)
    setAmount('')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <button onClick={() => setShowP(v => !v)}
            className="flex items-center gap-2 bg-[#161a1e] border border-[#2b3139] hover:border-[#f0b90b]/40 rounded-xl px-3.5 py-2 transition">
            <span className="text-sm font-bold text-[#eaecef]">{pair}</span>
            <ChevronDown size={12} className="text-[#848e9c]" />
          </button>
          {showPairs && (
            <div className="absolute top-full mt-1 left-0 bg-[#1e2329] border border-[#2b3139] rounded-xl overflow-hidden z-20 min-w-[150px] shadow-xl shadow-black/40">
              {PAIRS.map(p => (
                <button key={p} onClick={() => { setPair(p); setShowP(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-[#2b3139] ${p === pair ? 'text-[#f0b90b] font-semibold' : 'text-[#eaecef]'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-bold font-mono text-[#eaecef]">$67,432</span>
          <span className="text-xs font-semibold text-[#0ecb81] flex items-center gap-0.5 bg-[#0ecb81]/10 px-2 py-1 rounded-lg">
            <TrendingUp size={11} /> +2.4%
          </span>
        </div>
        <div className="ml-auto flex flex-wrap gap-3 text-xs text-[#848e9c]">
          <div><span className="block text-[10px]">24h High</span><span className="text-[#eaecef] font-mono font-medium">$68,820</span></div>
          <div><span className="block text-[10px]">24h Low</span><span className="text-[#eaecef] font-mono font-medium">$65,940</span></div>
          <div className="hidden sm:block"><span className="block text-[10px]">Volume</span><span className="text-[#eaecef] font-mono font-medium">$28.4B</span></div>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
          <div className="flex flex-wrap gap-1 mb-4">
            {TF.map(t => (
              <button key={t} onClick={() => setTf(t)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${t === tf ? 'bg-[#f0b90b] text-black' : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139]'}`}>
                {t}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0ecb81" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0ecb81" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
              <XAxis dataKey="time" tick={{ fill: '#848e9c', fontSize: 9 }} tickLine={false} axisLine={false} interval={7} />
              <YAxis tick={{ fill: '#848e9c', fontSize: 9 }} tickLine={false} axisLine={false}
                tickFormatter={v => `$${((v as number) / 1000).toFixed(1)}k`} domain={['auto', 'auto']} width={42} />
              <Tooltip
                contentStyle={{ background: '#1e2329', border: '1px solid #2b3139', borderRadius: 10, fontSize: 11 }}
                labelStyle={{ color: '#848e9c' }}
                itemStyle={{ color: '#0ecb81' }}
                formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, 'Price']}
              />
              <Area type="monotone" dataKey="price" stroke="#0ecb81" strokeWidth={2} fill="url(#priceGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Order form */}
          <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
            <div className="grid grid-cols-2 gap-1 mb-4 bg-[#0b0e11] p-1 rounded-xl">
              <button onClick={() => setSide('buy')}
                className={`py-2.5 rounded-lg text-sm font-bold transition ${side === 'buy' ? 'bg-[#0ecb81] text-black shadow-lg shadow-[#0ecb81]/20' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
                Buy
              </button>
              <button onClick={() => setSide('sell')}
                className={`py-2.5 rounded-lg text-sm font-bold transition ${side === 'sell' ? 'bg-[#f6465d] text-white shadow-lg shadow-[#f6465d]/20' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
                Sell
              </button>
            </div>

            <div className="flex gap-1 mb-4">
              {(['limit', 'market'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition ${orderType === t ? 'bg-[#2b3139] text-[#eaecef]' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleTrade} className="space-y-3">
              {orderType === 'limit' && (
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-xs text-[#848e9c]">Price (USDT)</label>
                    <span className="text-[10px] text-[#848e9c]">Best: $67,432</span>
                  </div>
                  <input value={price} onChange={e => setPrice(e.target.value)}
                    className="w-full bg-[#0b0e11] border border-[#2b3139] focus:border-[#f0b90b] rounded-xl px-3 py-2.5 text-sm font-mono text-[#eaecef] focus:outline-none transition" />
                </div>
              )}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs text-[#848e9c]">Amount (BTC)</label>
                  <span className="text-[10px] text-[#848e9c]">Avail: 0.1280 BTC</span>
                </div>
                <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  className="w-full bg-[#0b0e11] border border-[#2b3139] focus:border-[#f0b90b] rounded-xl px-3 py-2.5 text-sm font-mono text-[#eaecef] focus:outline-none transition" />
              </div>

              {/* Quick %  */}
              <div className="grid grid-cols-4 gap-1">
                {[25, 50, 75, 100].map(p => (
                  <button key={p} type="button" onClick={() => setAmount((0.1280 * p / 100).toFixed(4))}
                    className="text-xs py-1.5 rounded-lg bg-[#0b0e11] hover:bg-[#2b3139] text-[#848e9c] hover:text-[#eaecef] transition font-medium border border-[#2b3139]">
                    {p}%
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs py-2 border-t border-[#2b3139]">
                <span className="text-[#848e9c]">Total</span>
                <span className="font-mono font-semibold text-[#eaecef]">${total} USDT</span>
              </div>

              <button type="submit"
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${side === 'buy' ? 'bg-[#0ecb81] hover:bg-[#0ab56f] text-black shadow-lg shadow-[#0ecb81]/20' : 'bg-[#f6465d] hover:bg-[#d93d51] text-white shadow-lg shadow-[#f6465d]/20'}`}>
                {side === 'buy' ? `Buy ${pair.split('/')[0]}` : `Sell ${pair.split('/')[0]}`}
              </button>
            </form>
          </div>

          {/* Order book */}
          <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#848e9c] mb-3 flex items-center gap-1.5">
              <ArrowUpDown size={11} /> Order Book
            </p>
            <div className="flex justify-between text-[10px] text-[#4a5568] mb-2 px-0.5">
              <span>Price (USDT)</span>
              <span>Size (BTC)</span>
            </div>
            <div className="space-y-1">
              {orderBook.asks.slice(0, 5).reverse().map((a, i) => (
                <div key={i} className="relative flex justify-between text-[11px] px-0.5 py-0.5">
                  <div className="absolute inset-0 right-0 bg-[#f6465d]/8 rounded"
                    style={{ width: `${Math.min(a.size / 2 * 100, 100)}%`, marginLeft: 'auto' }} />
                  <span className="text-[#f6465d] font-mono relative">${a.price.toLocaleString()}</span>
                  <span className="text-[#848e9c] font-mono relative">{a.size.toFixed(4)}</span>
                </div>
              ))}
              <div className="py-2 text-center text-sm font-bold font-mono text-[#eaecef] bg-[#0b0e11] rounded-lg my-1">$67,432</div>
              {orderBook.bids.slice(0, 5).map((b, i) => (
                <div key={i} className="relative flex justify-between text-[11px] px-0.5 py-0.5">
                  <div className="absolute inset-0 bg-[#0ecb81]/8 rounded"
                    style={{ width: `${Math.min(b.size / 2 * 100, 100)}%` }} />
                  <span className="text-[#0ecb81] font-mono relative">${b.price.toLocaleString()}</span>
                  <span className="text-[#848e9c] font-mono relative">{b.size.toFixed(4)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#848e9c] mt-3 pt-2 border-t border-[#2b3139]">
              <span className="text-[#f6465d]">Asks: {orderBook.asks.reduce((s, a) => s + a.size, 0).toFixed(3)}</span>
              <span className="text-[#0ecb81]">Bids: {orderBook.bids.reduce((s, b) => s + b.size, 0).toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Open orders */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[#2b3139]">
          {['Open Orders (0)', 'Order History'].map((tab, i) => (
            <button key={tab} className={`text-xs font-semibold pb-1 border-b-2 transition ${i === 0 ? 'text-[#eaecef] border-[#f0b90b]' : 'text-[#848e9c] border-transparent hover:text-[#eaecef]'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="py-10 text-center">
          <TrendingDown size={24} className="text-[#2b3139] mx-auto mb-2" />
          <p className="text-xs text-[#848e9c]">No open orders</p>
        </div>
      </div>
    </div>
  )
}
