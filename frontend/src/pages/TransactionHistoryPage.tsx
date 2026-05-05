import { useState, useEffect } from 'react'
import { getMyTransactions } from '../lib/api'
import {
  ArrowDownLeft, ArrowUpRight, Send, RefreshCw,
  Clock, CheckCircle, XCircle, Search, SlidersHorizontal
} from 'lucide-react'

interface Tx {
  id: number; tx_type: string; method: string; asset: string
  amount_usdt: number; status: string; note?: string; tx_hash?: string
  wallet_address?: string; created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  deposit: 'Deposit', withdrawal: 'Withdrawal',
  p2p_send: 'P2P Send', p2p_receive: 'P2P Receive',
  trade: 'Trade', vps: 'VPS Rent', asset: 'Asset Buy',
}

const FILTERS = ['all', 'deposit', 'withdrawal', 'p2p_send', 'p2p_receive'] as const

function txIcon(type: string) {
  if (type === 'deposit'    || type === 'p2p_receive') return <ArrowDownLeft size={14} className="text-[#0ecb81]" />
  if (type === 'withdrawal' || type === 'p2p_send')    return <ArrowUpRight   size={14} className="text-[#f6465d]" />
  return <RefreshCw size={14} className="text-[#f0b90b]" />
}

function txIconBg(type: string) {
  if (type === 'deposit'    || type === 'p2p_receive') return 'bg-[#0ecb81]/10 border-[#0ecb81]/20'
  if (type === 'withdrawal' || type === 'p2p_send')    return 'bg-[#f6465d]/10 border-[#f6465d]/20'
  return 'bg-[#f0b90b]/10 border-[#f0b90b]/20'
}

function statusBadge(s: string) {
  if (s === 'completed' || s === 'approved')
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0ecb81]/10 text-[#0ecb81] inline-flex items-center gap-0.5 font-medium"><CheckCircle size={9} />Approved</span>
  if (s === 'rejected'  || s === 'failed')
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f6465d]/10 text-[#f6465d] inline-flex items-center gap-0.5 font-medium"><XCircle size={9} />Failed</span>
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0b90b]/10 text-[#f0b90b] inline-flex items-center gap-0.5 font-medium"><Clock size={9} />Pending</span>
}

function isIn(type: string) {
  return ['deposit', 'p2p_receive'].includes(type)
}

export default function TransactionHistoryPage() {
  const [txs, setTxs]       = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]  = useState('')
  const [filter, setFilter]  = useState<typeof FILTERS[number]>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    getMyTransactions()
      .then(r => setTxs(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = txs.filter(tx => {
    const matchFilter = filter === 'all' || tx.tx_type === filter
    const matchSearch = !search
      || tx.tx_type.includes(search.toLowerCase())
      || tx.method?.includes(search.toLowerCase())
      || tx.tx_hash?.includes(search)
      || tx.note?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const totalIn  = txs.filter(t => isIn(t.tx_type)  && t.status !== 'rejected').reduce((s, t) => s + t.amount_usdt, 0)
  const totalOut = txs.filter(t => !isIn(t.tx_type) && t.status !== 'rejected' && ['withdrawal', 'p2p_send'].includes(t.tx_type)).reduce((s, t) => s + t.amount_usdt, 0)

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#eaecef]">Transactions</h1>
        <button onClick={() => setShowFilters(v => !v)} className="sm:hidden flex items-center gap-1.5 text-xs text-[#848e9c] bg-[#161a1e] border border-[#2b3139] px-3 py-2 rounded-xl">
          <SlidersHorizontal size={12} /> Filters
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
          <p className="text-[10px] text-[#848e9c] mb-1.5 font-medium uppercase tracking-wide">Deposited</p>
          <p className="text-lg font-bold font-mono text-[#0ecb81]">+${totalIn.toFixed(2)}</p>
        </div>
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
          <p className="text-[10px] text-[#848e9c] mb-1.5 font-medium uppercase tracking-wide">Withdrawn</p>
          <p className="text-lg font-bold font-mono text-[#f6465d]">-${totalOut.toFixed(2)}</p>
        </div>
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
          <p className="text-[10px] text-[#848e9c] mb-1.5 font-medium uppercase tracking-wide">Total Txs</p>
          <p className="text-lg font-bold font-mono text-[#eaecef]">{txs.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className={`gap-3 items-center flex-wrap ${showFilters ? 'flex' : 'hidden sm:flex'}`}>
        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="w-full bg-[#161a1e] border border-[#2b3139] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#eaecef] placeholder-[#4a5568] focus:outline-none focus:border-[#f0b90b] transition" />
        </div>
        <div className="flex gap-1 bg-[#161a1e] border border-[#2b3139] rounded-xl p-1 overflow-x-auto flex-shrink-0">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${filter === f ? 'bg-[#f0b90b] text-black' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
              {f === 'all' ? 'All' : TYPE_LABELS[f] || f}
            </button>
          ))}
        </div>
      </div>

      {/* Card list (mobile) */}
      <div className="sm:hidden space-y-2">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-[#161a1e] border border-[#2b3139] animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-center">
            <RefreshCw size={28} className="text-[#2b3139]" />
            <p className="text-sm text-[#848e9c]">No transactions found</p>
          </div>
        ) : filtered.map(tx => (
          <div key={tx.id} className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 ${txIconBg(tx.tx_type)}`}>
              {txIcon(tx.tx_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#eaecef]">{TYPE_LABELS[tx.tx_type] || tx.tx_type}</p>
                <p className={`text-sm font-bold font-mono ${isIn(tx.tx_type) ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                  {isIn(tx.tx_type) ? '+' : '-'}${tx.amount_usdt.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2 mt-1.5">
                <p className="text-[10px] text-[#848e9c] capitalize">{tx.method?.replace(/_/g, ' ')} · {new Date(tx.created_at).toLocaleDateString()}</p>
                {statusBadge(tx.status)}
              </div>
              {tx.note && <p className="text-[10px] text-[#4a5568] mt-1 truncate">{tx.note}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Table (desktop) */}
      <div className="hidden sm:block bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-[#848e9c] text-xs border-b border-[#2b3139] bg-[#0b0e11]/40">
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-left px-5 py-3 font-medium">Method</th>
                <th className="text-right px-5 py-3 font-medium">Amount</th>
                <th className="text-right px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">TX Hash</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Note</th>
                <th className="text-right px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-[#848e9c] text-sm">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[#f0b90b]" />Loading…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-14 text-center">
                  <RefreshCw size={24} className="text-[#2b3139] mx-auto mb-2" />
                  <p className="text-[#848e9c] text-sm">No transactions found</p>
                </td></tr>
              ) : filtered.map(tx => (
                <tr key={tx.id} className="border-b border-[#2b3139]/50 hover:bg-[#1e2329] transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${txIconBg(tx.tx_type)}`}>
                        {txIcon(tx.tx_type)}
                      </div>
                      <span className="text-xs font-semibold text-[#eaecef]">{TYPE_LABELS[tx.tx_type] || tx.tx_type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#848e9c] capitalize">{tx.method?.replace(/_/g, ' ')}</td>
                  <td className={`px-5 py-3.5 text-right font-mono text-sm font-bold ${isIn(tx.tx_type) ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                    {isIn(tx.tx_type) ? '+' : '-'}${tx.amount_usdt?.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-right">{statusBadge(tx.status)}</td>
                  <td className="px-5 py-3.5 font-mono text-[10px] text-[#848e9c] hidden lg:table-cell max-w-[120px] truncate">
                    {tx.tx_hash ? `${tx.tx_hash.slice(0, 14)}…` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#848e9c] hidden md:table-cell max-w-[120px] truncate">{tx.note || '—'}</td>
                  <td className="px-5 py-3.5 text-right text-[10px] text-[#848e9c] whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
