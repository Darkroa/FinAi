import { useState } from 'react'
import { Search, TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'

const sparkline = (up: boolean) =>
  Array.from({ length: 12 }, (_, i) => ({ v: 50 + (up ? 1 : -1) * i * 3 + Math.random() * 10 - 5 }))

const markets = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', price: 67432.10, change: 2.4, vol: '$28.4B', mcap: '$1.32T', up: true },
  { symbol: 'ETH/USDT', name: 'Ethereum', price: 3521.80, change: 1.8, vol: '$12.1B', mcap: '$423B', up: true },
  { symbol: 'BNB/USDT', name: 'BNB', price: 598.40, change: -0.6, vol: '$1.8B', mcap: '$89B', up: false },
  { symbol: 'SOL/USDT', name: 'Solana', price: 182.30, change: 5.2, vol: '$4.2B', mcap: '$82B', up: true },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 192.35, change: 0.9, vol: '$4.1B', mcap: '$2.95T', up: true },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.70, change: -1.2, vol: '$12.8B', mcap: '$792B', up: false },
  { symbol: 'NVDA', name: 'NVIDIA', price: 875.00, change: 3.1, vol: '$18.5B', mcap: '$2.15T', up: true },
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 530.40, change: 0.5, vol: '$22.3B', mcap: '—', up: true },
]

export default function MarketsPage() {
  const [search, setSearch] = useState('')
  const filtered = markets.filter(m =>
    m.symbol.toLowerCase().includes(search.toLowerCase()) ||
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#eaecef]">Markets</h1>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" />
          <input
            type="text"
            placeholder="Search markets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[#161a1e] border border-[#2b3139] rounded-xl pl-9 pr-4 py-2 text-sm text-[#eaecef] placeholder-[#4a5568] focus:outline-none focus:border-[#f0b90b] w-56 transition"
          />
        </div>
      </div>

      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#848e9c] text-xs border-b border-[#2b3139]">
              <th className="text-left px-5 py-3 font-medium">#</th>
              <th className="text-left px-5 py-3 font-medium">Asset</th>
              <th className="text-right px-5 py-3 font-medium">Price</th>
              <th className="text-right px-5 py-3 font-medium">24h Change</th>
              <th className="text-right px-5 py-3 font-medium">Volume</th>
              <th className="text-right px-5 py-3 font-medium">Market Cap</th>
              <th className="text-right px-5 py-3 font-medium">7D Chart</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.symbol} className="border-b border-[#2b3139]/50 hover:bg-[#1e2329] transition cursor-pointer">
                <td className="px-5 py-4 text-[#848e9c]">{i + 1}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f0b90b]/10 flex items-center justify-center text-xs font-bold text-[#f0b90b]">
                      {m.symbol[0]}
                    </div>
                    <div>
                      <p className="font-medium text-[#eaecef]">{m.symbol}</p>
                      <p className="text-[10px] text-[#848e9c]">{m.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-right font-mono text-[#eaecef]">${m.price.toLocaleString()}</td>
                <td className="px-5 py-4 text-right">
                  <span className={`inline-flex items-center gap-1 text-xs ${m.up ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                    {m.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {m.up ? '+' : ''}{m.change}%
                  </span>
                </td>
                <td className="px-5 py-4 text-right text-[#848e9c] text-xs">{m.vol}</td>
                <td className="px-5 py-4 text-right text-[#848e9c] text-xs">{m.mcap}</td>
                <td className="px-5 py-4">
                  <ResponsiveContainer width={80} height={36}>
                    <LineChart data={sparkline(m.up)}>
                      <Line type="monotone" dataKey="v" stroke={m.up ? '#0ecb81' : '#f6465d'} strokeWidth={1.5} dot={false} />
                      <Tooltip contentStyle={{ display: 'none' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
