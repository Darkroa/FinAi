import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Clock, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const assets = [
  { symbol: 'BTC', name: 'Bitcoin',  balance: '0.0842',   usd: '$5,674.12', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', balance: '1.2500',   usd: '$4,401.25', icon: 'Ξ' },
  { symbol: 'USDT',name: 'Tether',   balance: '1,234.56', usd: '$1,234.56', icon: '₮' },
  { symbol: 'BNB', name: 'BNB',      balance: '2.400',    usd: '$1,436.16', icon: 'B' },
]

const txHistory = [
  { type: 'deposit',    asset: 'USDT', amount: '+500.00', status: 'completed', date: '2024-01-15', hash: '0x1a2b...3c4d' },
  { type: 'withdrawal', asset: 'BTC',  amount: '-0.015',  status: 'completed', date: '2024-01-12', hash: '0x5e6f...7a8b' },
  { type: 'deposit',    asset: 'ETH',  amount: '+0.50',   status: 'pending',   date: '2024-01-10', hash: '0x9c0d...1e2f' },
  { type: 'withdrawal', asset: 'USDT', amount: '-200.00', status: 'completed', date: '2024-01-08', hash: '0x3a4b...5c6d' },
]

export default function WalletPage() {
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit')
  const totalUSD = 12745.09

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[#eaecef]">Wallet</h1>
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl px-4 py-2 text-right">
          <p className="text-xs text-[#848e9c]">Total Balance</p>
          <p className="text-xl font-bold font-mono text-[#eaecef]">${totalUSD.toLocaleString()}</p>
        </div>
      </div>

      {/* Assets + Transfer panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Assets table */}
        <div className="lg:col-span-2 bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2b3139]">
            <h2 className="text-sm font-semibold text-[#eaecef]">Assets</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#848e9c] text-xs border-b border-[#2b3139]">
                  <th className="text-left px-4 py-3 font-medium">Asset</th>
                  <th className="text-right px-4 py-3 font-medium">Balance</th>
                  <th className="text-right px-4 py-3 font-medium">USD Value</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.symbol} className="border-b border-[#2b3139]/50 hover:bg-[#1e2329] transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f0b90b]/10 flex items-center justify-center text-sm font-bold text-[#f0b90b] flex-shrink-0">{a.icon}</div>
                        <div>
                          <p className="font-medium text-[#eaecef]">{a.symbol}</p>
                          <p className="text-[10px] text-[#848e9c]">{a.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#eaecef]">{a.balance}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#848e9c]">{a.usd}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="text-xs px-2.5 py-1 rounded-lg bg-[#0ecb81]/10 text-[#0ecb81] hover:bg-[#0ecb81]/20 transition flex items-center gap-1 whitespace-nowrap">
                          <ArrowDownLeft size={10} /> Deposit
                        </button>
                        <button className="text-xs px-2.5 py-1 rounded-lg bg-[#f6465d]/10 text-[#f6465d] hover:bg-[#f6465d]/20 transition flex items-center gap-1 whitespace-nowrap">
                          <ArrowUpRight size={10} /> Withdraw
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transfer panel */}
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
          <div className="grid grid-cols-2 gap-1 mb-4 bg-[#0b0e11] p-1 rounded-xl">
            <button
              onClick={() => setTab('deposit')}
              className={`py-2 rounded-lg text-xs font-medium transition ${tab === 'deposit' ? 'bg-[#f0b90b] text-black' : 'text-[#848e9c] hover:text-[#eaecef]'}`}
            >
              Deposit
            </button>
            <button
              onClick={() => setTab('withdraw')}
              className={`py-2 rounded-lg text-xs font-medium transition ${tab === 'withdraw' ? 'bg-[#f0b90b] text-black' : 'text-[#848e9c] hover:text-[#eaecef]'}`}
            >
              Withdraw
            </button>
          </div>

          {tab === 'deposit' ? (
            <div className="space-y-4">
              <p className="text-xs text-[#848e9c]">Send USDT to this address to fund your account:</p>
              <div className="bg-[#0b0e11] rounded-xl p-3 border border-[#2b3139]">
                <p className="text-[10px] font-mono text-[#848e9c] break-all">TRx7Xy1Qk2mN8pLJ3vHg4wEa5rBs6cFd</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText('TRx7Xy1Qk2mN8pLJ3vHg4wEa5rBs6cFd'); toast.success('Address copied!') }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#2b3139] text-xs text-[#848e9c] hover:text-[#eaecef] hover:border-[#3c4451] transition"
              >
                <Copy size={12} /> Copy Address
              </button>
              <p className="text-[10px] text-[#848e9c] text-center">Minimum deposit: $50 USDT (TRC-20)</p>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); toast('Withdrawal request submitted (demo)') }}>
              <div>
                <label className="text-xs text-[#848e9c] mb-1 block">Amount (USDT)</label>
                <input
                  placeholder="0.00"
                  className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm font-mono text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition"
                />
              </div>
              <div>
                <label className="text-xs text-[#848e9c] mb-1 block">Wallet Address</label>
                <input
                  placeholder="Your wallet address"
                  className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition"
                />
              </div>
              <button type="submit" className="w-full bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-semibold py-2.5 rounded-xl text-sm transition">
                Submit Withdrawal
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2b3139]">
          <h2 className="text-sm font-semibold text-[#eaecef]">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-[#848e9c] text-xs border-b border-[#2b3139]">
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Asset</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-right px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Date</th>
                <th className="text-right px-4 py-3 font-medium">Tx Hash</th>
              </tr>
            </thead>
            <tbody>
              {txHistory.map((tx, i) => (
                <tr key={i} className="border-b border-[#2b3139]/50 hover:bg-[#1e2329] transition">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${tx.type === 'deposit' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {tx.type === 'deposit' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#eaecef] font-medium">{tx.asset}</td>
                  <td className={`px-4 py-3 text-right font-mono ${tx.type === 'deposit' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>{tx.amount}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === 'completed' ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#f0b90b]/10 text-[#f0b90b]'}`}>
                      {tx.status === 'pending' && <Clock size={9} className="inline mr-1" />}{tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[#848e9c] text-xs whitespace-nowrap">{tx.date}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#848e9c] text-xs">{tx.hash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
