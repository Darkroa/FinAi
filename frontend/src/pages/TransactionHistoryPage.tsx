import { useState, useEffect } from 'react'
import { getMyTransactions } from '../lib/api'
import { ArrowDownLeft, ArrowUpRight, Send, RefreshCw, Clock, CheckCircle, XCircle, Search } from 'lucide-react'

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

function txIcon(type: string) {
  if (type === 'deposit' || type === 'p2p_receive') return <ArrowDownLeft size={14} className="text-[#0ecb81]" />
  if (type === 'withdrawal' || type === 'p2p_send') return <ArrowUpRight size={14} className="text-[#f6465d]" />
  return <RefreshCw size={14} className="text-[#f0b90b]" />
}

function statusBadge(s: string) {
  if (s === 'completed' || s === 'approved') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0ecb81]/10 text-[#0ecb81] inline-flex items-center gap-0.5"><CheckCircle size={9} />{s}</span>
  if (s === 'rejected' || s === 'failed') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f6465d]/10 text-[#f6465d] inline-flex items-center gap-0.5"><XCircle size={9} />{s}</span>
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0b90b]/10 text-[#f0b90b] inline-flex items-center gap-0.5"><Clock size={9} />pending</span>
}

export default function TransactionHistoryPage() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getMyTransactions()
      .then(r => setTxs(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = txs.filter(tx => {
    const matchesFilter = filter === 'all' || tx.tx_type === filter
    const matchesSearch = !search || tx.tx_type.includes(search.toLowerCase()) ||
      tx.method?.includes(search.toLowerCase()) || tx.tx_hash?.includes(search) ||
      tx.note?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const totalIn = txs.filter(t => ['deposit', 'p2p_receive'].includes(t.tx_type) && t.status !== 'rejected')
    .reduce((s, t) => s + t.amount_usdt, 0)
  const totalOut = txs.filter(t => ['withdrawal', 'p2p_send'].includes(t.tx_type) && t.status !== 'rejected')
    .reduce((s, t) => s + t.amount_usdt, 0)

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#eaecef]">Transaction History</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Deposited', value: `+$${totalIn.toFixed(2)}`, color: 'text-[#0ecb81]' },
          { label: 'Total Withdrawn', value: `-$${totalOut.toFixed(2)}`, color: 'text-[#f6465d]' },
          { label: 'Transactions', value: txs.length, color: 'text-[#eaecef]' },
        ].map(s => (
          <div key={s.label} className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
            <p className="text-xs text-[#848e9c] mb-1">{s.label}</p>
            <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="bg-[#161a1e] border border-[#2b3139] rounded-xl pl-9 pr-3 py-2 text-sm text-[#eaecef] placeholder-[#4a5568] focus:outline-none focus:border-[#f0b90b] transition w-52" />
        </div>
        <div className="flex gap-1 bg-[#161a1e] border border-[#2b3139] rounded-xl p-1 flex-wrap">
          {['all', 'deposit', 'withdrawal', 'p2p_send', 'p2p_receive'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg capitalize transition whitespace-nowrap ${filter === f ? 'bg-[#2b3139] text-[#eaecef]' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
              {f === 'all' ? 'All' : TYPE_LABELS[f] || f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-[#848e9c] text-xs border-b border-[#2b3139]">
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Method</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-right px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">TX Hash</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Note</th>
                <th className="text-right px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-[#848e9c] text-sm">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <RefreshCw size={24} className="text-[#2b3139] mx-auto mb-2" />
                    <p className="text-[#848e9c] text-sm">No transactions found</p>
                  </td>
                </tr>
              ) : filtered.map(tx => (
                <tr key={tx.id} className="border-b border-[#2b3139]/50 hover:bg-[#1e2329] transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {txIcon(tx.tx_type)}
                      <span className="text-xs font-medium text-[#eaecef]">{TYPE_LABELS[tx.tx_type] || tx.tx_type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#848e9c] capitalize">{tx.method?.replace(/_/g, ' ')}</td>
                  <td className={`px-4 py-3 text-right font-mono text-sm font-medium ${['deposit', 'p2p_receive'].includes(tx.tx_type) ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                    {['deposit', 'p2p_receive'].includes(tx.tx_type) ? '+' : '-'}${tx.amount_usdt?.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">{statusBadge(tx.status)}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-[#848e9c] hidden md:table-cell max-w-[120px] truncate">
                    {tx.tx_hash ? `${tx.tx_hash.slice(0, 16)}...` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#848e9c] hidden sm:table-cell max-w-[120px] truncate">{tx.note || '—'}</td>
                  <td className="px-4 py-3 text-right text-xs text-[#848e9c] whitespace-nowrap">
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
