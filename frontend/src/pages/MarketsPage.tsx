import { useState } from 'react'
import { Search, TrendingUp, TrendingDown, LayoutGrid, LayoutList } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

const sparkline = (up: boolean) =>
  Array.from({ length: 12 }, (_, i) => ({ v: 50 + (up ? 1 : -1) * i * 3 + Math.random() * 10 - 5 }))

const markets = [
  { symbol: 'BTC/USDT', name: 'Bitcoin',     price: 67432.10, change: 2.4,  vol: '$28.4B', mcap: '$1.32T', up: true,  cat: 'crypto' },
  { symbol: 'ETH/USDT', name: 'Ethereum',    price: 3521.80,  change: 1.8,  vol: '$12.1B', mcap: '$423B',  up: true,  cat: 'crypto' },
  { symbol: 'BNB/USDT', name: 'BNB',         price: 598.40,   change: -0.6, vol: '$1.8B',  mcap: '$89B',   up: false, cat: 'crypto' },
  { symbol: 'SOL/USDT', name: 'Solana',      price: 182.30,   change: 5.2,  vol: '$4.2B',  mcap: '$82B',   up: true,  cat: 'crypto' },
  { symbol: 'AAPL',     name: 'Apple Inc.',  price: 192.35,   change: 0.9,  vol: '$4.1B',  mcap: '$2.95T', up: true,  cat: 'stocks' },
  { symbol: 'TSLA',     name: 'Tesla Inc.',  price: 248.70,   change: -1.2, vol: '$12.8B', mcap: '$792B',  up: false, cat: 'stocks' },
  { symbol: 'NVDA',     name: 'NVIDIA',      price: 875.00,   change: 3.1,  vol: '$18.5B', mcap: '$2.15T', up: true,  cat: 'stocks' },
  { symbol: 'SPY',      name: 'S&P 500 ETF', price: 530.40,   change: 0.5,  vol: '$22.3B', mcap: '—',      up: true,  cat: 'stocks' },
]

export default function MarketsPage() {
  const [search, setSearch] = useState('')
  const [cat, setCat]       = useState<'all' | 'crypto' | 'stocks'>('all')
  const [view, setView]     = useState<'table' | 'grid'>('table')

  const filtered = markets.filter(m =>
    (cat === 'all' || m.cat === cat) &&
    (m.symbol.toLowerCase().includes(search.toLowerCase()) || m.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[#eaecef]">Markets</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('table')} className={`p-2 rounded-lg transition ${view === 'table' ? 'bg-[#f0b90b] text-black' : 'bg-[#161a1e] border border-[#2b3139] text-[#848e9c] hover:text-[#eaecef]'}`}>
            <LayoutList size={14} />
          </button>
          <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition ${view === 'grid' ? 'bg-[#f0b90b] text-black' : 'bg-[#161a1e] border border-[#2b3139] text-[#848e9c] hover:text-[#eaecef]'}`}>
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" />
          <input type="text" placeholder="Search markets…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#161a1e] border border-[#2b3139] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#eaecef] placeholder-[#4a5568] focus:outline-none focus:border-[#f0b90b] transition" />
        </div>
        <div className="flex gap-1 bg-[#161a1e] border border-[#2b3139] rounded-xl p-1">
          {(['all', 'crypto', 'stocks'] as const).map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`text-xs px-4 py-1.5 rounded-lg capitalize font-medium transition ${cat === c ? 'bg-[#f0b90b] text-black' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
              {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(m => (
            <div key={m.symbol} className="bg-[#161a1e] border border-[#2b3139] hover:border-[#f0b90b]/30 rounded-2xl p-4 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-[#f0b90b]/10 flex items-center justify-center text-sm font-bold text-[#f0b90b]">
                  {m.symbol[0]}
                </div>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${m.up ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                  {m.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {m.up ? '+' : ''}{m.change}%
                </span>
              </div>
              <p className="text-xs font-semibold text-[#eaecef]">{m.symbol}</p>
              <p className="text-[10px] text-[#848e9c] mb-2">{m.name}</p>
              <p className="text-sm font-bold font-mono text-[#eaecef]">${m.price.toLocaleString()}</p>
              <div className="mt-2 h-9">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkline(m.up)}>
                    <Line type="monotone" dataKey="v" stroke={m.up ? '#0ecb81' : '#f6465d'} strokeWidth={1.5} dot={false} />
                    <Tooltip contentStyle={{ display: 'none' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-[#2b3139]/60">
            {filtered.map((m, i) => (
              <div key={m.symbol} className="flex items-center justify-between px-4 py-3.5 hover:bg-[#1e2329] transition cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#4a5568] w-4 text-center">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-[#f0b90b]/10 flex items-center justify-center text-xs font-bold text-[#f0b90b] flex-shrink-0">
                    {m.symbol[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#eaecef]">{m.symbol}</p>
                    <p className="text-[10px] text-[#848e9c]">{m.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-[#eaecef]">${m.price.toLocaleString()}</p>
                  <span className={`text-xs font-semibold ${m.up ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                    {m.up ? '+' : ''}{m.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-[#848e9c] text-xs border-b border-[#2b3139] bg-[#0b0e11]/40">
                  <th className="text-left px-5 py-3 font-medium">#</th>
                  <th className="text-left px-5 py-3 font-medium">Asset</th>
                  <th className="text-right px-5 py-3 font-medium">Price</th>
                  <th className="text-right px-5 py-3 font-medium">24h Change</th>
                  <th className="text-right px-5 py-3 font-medium hidden md:table-cell">Volume</th>
                  <th className="text-right px-5 py-3 font-medium hidden lg:table-cell">Market Cap</th>
                  <th className="text-right px-5 py-3 font-medium hidden xl:table-cell">7D</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.symbol} className="border-b border-[#2b3139]/50 hover:bg-[#1e2329] transition cursor-pointer">
                    <td className="px-5 py-4 text-[#848e9c] text-xs">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f0b90b]/10 flex items-center justify-center text-xs font-bold text-[#f0b90b] flex-shrink-0">
                          {m.symbol[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-[#eaecef] text-sm">{m.symbol}</p>
                          <p className="text-[10px] text-[#848e9c]">{m.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-sm text-[#eaecef] font-medium">${m.price.toLocaleString()}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${m.up ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#f6465d]/10 text-[#f6465d]'}`}>
                        {m.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {m.up ? '+' : ''}{m.change}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-[#848e9c] text-xs hidden md:table-cell">{m.vol}</td>
                    <td className="px-5 py-4 text-right text-[#848e9c] text-xs hidden lg:table-cell">{m.mcap}</td>
                    <td className="px-5 py-4 hidden xl:table-cell">
                      <div className="flex justify-end">
                        <ResponsiveContainer width={80} height={36}>
                          <LineChart data={sparkline(m.up)}>
                            <Line type="monotone" dataKey="v" stroke={m.up ? '#0ecb81' : '#f6465d'} strokeWidth={1.5} dot={false} />
                            <Tooltip contentStyle={{ display: 'none' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
