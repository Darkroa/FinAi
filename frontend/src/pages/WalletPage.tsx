import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import {
  getWalletConfig, requestDeposit, requestWithdrawal,
  p2pSend, getMyTransactions, getMe
} from '../lib/api'
import toast from 'react-hot-toast'
import QRCode from 'react-qr-code'
import {
  ArrowDownLeft, ArrowUpRight, Send, Copy, RefreshCw,
  Clock, CheckCircle, XCircle, Server, ShoppingBag, ChevronRight
} from 'lucide-react'

type WalletTab = 'deposit' | 'withdraw' | 'send' | 'vps' | 'asset'

interface WalletCfg { [key: string]: { value: string; label: string } }
interface Tx {
  id: number; tx_type: string; method: string; asset: string
  amount_usdt: number; status: string; note?: string; created_at: string
}

const METHODS = [
  { key: 'crypto_btc',  label: 'Bitcoin (BTC)',   cfgKey: 'btc_address',    icon: '₿' },
  { key: 'crypto_eth',  label: 'Ethereum (ETH)',   cfgKey: 'eth_address',    icon: 'Ξ' },
  { key: 'crypto_usdt', label: 'USDT (TRC-20)',    cfgKey: 'usdt_trc20',     icon: '₮' },
  { key: 'bank',        label: 'Bank Transfer',    cfgKey: 'bank_account',   icon: '🏦' },
]

const VPS_PLANS = [
  { name: 'Basic VPS',    price: 29,  specs: '1 vCPU · 2GB RAM · 50GB SSD' },
  { name: 'Pro VPS',      price: 79,  specs: '4 vCPU · 8GB RAM · 200GB SSD' },
  { name: 'Ultimate VPS', price: 149, specs: '8 vCPU · 16GB RAM · 500GB SSD' },
]

const ASSETS = [
  { name: 'Bitcoin (BTC)', price: 67432, icon: '₿' },
  { name: 'Ethereum (ETH)', price: 3521, icon: 'Ξ' },
  { name: 'Solana (SOL)', price: 182, icon: '◎' },
  { name: 'BNB', price: 598, icon: 'B' },
]

function txIcon(type: string) {
  switch (type) {
    case 'deposit': return <ArrowDownLeft size={13} className="text-[#0ecb81]" />
    case 'withdrawal': return <ArrowUpRight size={13} className="text-[#f6465d]" />
    case 'p2p_send': return <Send size={13} className="text-[#f0b90b]" />
    case 'p2p_receive': return <ArrowDownLeft size={13} className="text-[#0ecb81]" />
    default: return <RefreshCw size={13} className="text-[#848e9c]" />
  }
}
function statusBadge(s: string) {
  if (s === 'completed' || s === 'approved') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0ecb81]/10 text-[#0ecb81]"><CheckCircle size={9} className="inline mr-0.5" />{s}</span>
  if (s === 'rejected' || s === 'failed') return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f6465d]/10 text-[#f6465d]"><XCircle size={9} className="inline mr-0.5" />{s}</span>
  return <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0b90b]/10 text-[#f0b90b]"><Clock size={9} className="inline mr-0.5" />pending</span>
}

export default function WalletPage() {
  const { user, setUser } = useAuthStore()
  const [tab, setTab] = useState<WalletTab>('deposit')
  const [cfg, setCfg] = useState<WalletCfg>({})
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Deposit form
  const [depMethod, setDepMethod] = useState('crypto_btc')
  const [depAmount, setDepAmount] = useState('')
  const [depTxHash, setDepTxHash] = useState('')
  const [depBankRef, setDepBankRef] = useState('')

  // Withdraw form
  const [wdMethod, setWdMethod] = useState('crypto_btc')
  const [wdAmount, setWdAmount] = useState('')
  const [wdAddress, setWdAddress] = useState('')
  const [wdBankRef, setWdBankRef] = useState('')

  // P2P
  const [p2pEmail, setP2pEmail] = useState('')
  const [p2pAmount, setP2pAmount] = useState('')
  const [p2pNote, setP2pNote] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([getWalletConfig(), getMyTransactions()])
      .then(([cfgRes, txRes]) => {
        setCfg(cfgRes.data)
        setTxs(Array.isArray(txRes.data) ? txRes.data : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const refreshBalance = async () => {
    try { const res = await getMe(); setUser(res.data) } catch {}
  }

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!depAmount || parseFloat(depAmount) <= 0) return toast.error('Enter a valid amount')
    setSubmitting(true)
    try {
      const method = METHODS.find(m => m.key === depMethod)
      await requestDeposit({
        method: depMethod, asset: method?.label?.split(' ')[0] || 'USDT',
        amount_usdt: parseFloat(depAmount),
        tx_hash: depTxHash || undefined,
        bank_ref: depBankRef || undefined,
      })
      toast.success('Deposit request submitted — awaiting admin approval')
      setDepAmount(''); setDepTxHash(''); setDepBankRef('')
      const txRes = await getMyTransactions()
      setTxs(Array.isArray(txRes.data) ? txRes.data : [])
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed')
    } finally { setSubmitting(false) }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wdAmount || parseFloat(wdAmount) <= 0) return toast.error('Enter a valid amount')
    setSubmitting(true)
    try {
      await requestWithdrawal({
        method: wdMethod, asset: METHODS.find(m => m.key === wdMethod)?.label?.split(' ')[0] || 'USDT',
        amount_usdt: parseFloat(wdAmount),
        wallet_address: wdAddress || undefined,
        bank_ref: wdBankRef || undefined,
      })
      toast.success('Withdrawal request submitted')
      setWdAmount(''); setWdAddress(''); setWdBankRef('')
      await refreshBalance()
      const txRes = await getMyTransactions()
      setTxs(Array.isArray(txRes.data) ? txRes.data : [])
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Insufficient balance')
    } finally { setSubmitting(false) }
  }

  const handleP2P = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!p2pEmail || !p2pAmount) return toast.error('Fill all fields')
    setSubmitting(true)
    try {
      await p2pSend({ recipient_email: p2pEmail, amount_usdt: parseFloat(p2pAmount), note: p2pNote || undefined })
      toast.success(`Sent $${p2pAmount} to ${p2pEmail}`)
      setP2pEmail(''); setP2pAmount(''); setP2pNote('')
      await refreshBalance()
      const txRes = await getMyTransactions()
      setTxs(Array.isArray(txRes.data) ? txRes.data : [])
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed')
    } finally { setSubmitting(false) }
  }

  const inp = 'w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] placeholder-[#4a5568] focus:outline-none focus:border-[#f0b90b] transition'

  const depCfgKey = METHODS.find(m => m.key === depMethod)?.cfgKey
  const depAddress = depCfgKey ? cfg[depCfgKey]?.value : undefined
  const isCrypto = (method: string) => method !== 'bank'

  const tabs = [
    { key: 'deposit',  label: 'Deposit',  icon: ArrowDownLeft },
    { key: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
    { key: 'send',     label: 'Send P2P', icon: Send },
    { key: 'vps',      label: 'Rent VPS', icon: Server },
    { key: 'asset',    label: 'Buy Asset',icon: ShoppingBag },
  ] as const

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Balance hero card */}
      <div className="relative bg-gradient-to-br from-[#1e2329] via-[#181d22] to-[#161a1e] border border-[#2b3139] rounded-2xl p-5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(ellipse at top right, rgba(14,203,129,0.07) 0%, transparent 60%)',
        }} />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[#848e9c] font-medium mb-1">Available Balance</p>
            <p className="text-3xl font-bold font-mono text-[#eaecef]">
              ${(user?.balance_usdt ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-[#848e9c] mt-1">USDT · Updated just now</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab('deposit')} className="flex items-center gap-1.5 bg-[#0ecb81] hover:bg-[#0ab56f] text-black font-semibold text-xs px-4 py-2.5 rounded-xl transition">
              <ArrowDownLeft size={13} /> Deposit
            </button>
            <button onClick={() => setTab('withdraw')} className="flex items-center gap-1.5 bg-[#0b0e11] hover:bg-[#2b3139] text-[#848e9c] hover:text-[#eaecef] font-semibold text-xs px-4 py-2.5 rounded-xl border border-[#2b3139] transition">
              <ArrowUpRight size={13} /> Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Action tabs */}
      <div className="grid grid-cols-5 gap-1 bg-[#161a1e] border border-[#2b3139] rounded-xl p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as WalletTab)}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2 py-2.5 rounded-lg text-[10px] sm:text-xs font-medium transition ${tab === key ? 'bg-[#f0b90b] text-black' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
            <Icon size={13} /><span className="leading-tight text-center">{label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: form */}
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5">

          {/* DEPOSIT */}
          {tab === 'deposit' && (
            <form onSubmit={handleDeposit} className="space-y-4">
              <h2 className="text-sm font-semibold text-[#eaecef]">Deposit Funds</h2>

              <div>
                <label className="text-xs text-[#848e9c] mb-1.5 block">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {METHODS.map(m => (
                    <button key={m.key} type="button" onClick={() => setDepMethod(m.key)}
                      className={`text-xs px-3 py-2 rounded-xl border transition text-left ${depMethod === m.key ? 'border-[#f0b90b] bg-[#f0b90b]/10 text-[#f0b90b]' : 'border-[#2b3139] text-[#848e9c] hover:border-[#3c4451]'}`}>
                      <span className="font-mono mr-1">{m.icon}</span>{m.label}
                    </button>
                  ))}
                </div>
              </div>

              {depAddress && isCrypto(depMethod) && (
                <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b3139] space-y-3">
                  <div className="flex justify-center">
                    <div className="p-2 bg-white rounded-lg">
                      <QRCode value={depAddress} size={120} />
                    </div>
                  </div>
                  <p className="text-[10px] font-mono text-[#848e9c] break-all text-center">{depAddress}</p>
                  <button type="button"
                    onClick={() => { navigator.clipboard.writeText(depAddress); toast.success('Address copied!') }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[#2b3139] text-xs text-[#848e9c] hover:text-[#eaecef] transition">
                    <Copy size={11} /> Copy Address
                  </button>
                </div>
              )}

              {!depAddress && isCrypto(depMethod) && (
                <div className="bg-[#f0b90b]/5 border border-[#f0b90b]/20 rounded-xl px-4 py-3 text-xs text-[#848e9c]">
                  Admin has not configured this deposit address yet.
                </div>
              )}

              {depMethod === 'bank' && (
                <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b3139] space-y-1 text-xs text-[#848e9c]">
                  {['bank_name', 'bank_account', 'bank_routing', 'bank_swift'].map(k => cfg[k] && (
                    <div key={k} className="flex justify-between">
                      <span className="capitalize">{cfg[k].label || k.replace(/_/g, ' ')}</span>
                      <span className="font-mono text-[#eaecef]">{cfg[k].value}</span>
                    </div>
                  ))}
                  {!cfg['bank_account'] && <p>Bank details not yet configured by admin.</p>}
                </div>
              )}

              <div>
                <label className="text-xs text-[#848e9c] mb-1.5 block">Amount (USDT equivalent) *</label>
                <input type="number" min="0" step="0.01" value={depAmount} onChange={e => setDepAmount(e.target.value)}
                  required placeholder="0.00" className={inp} />
              </div>
              {isCrypto(depMethod) && (
                <div>
                  <label className="text-xs text-[#848e9c] mb-1.5 block">TX Hash (optional)</label>
                  <input value={depTxHash} onChange={e => setDepTxHash(e.target.value)} placeholder="0x..." className={inp} />
                </div>
              )}
              {!isCrypto(depMethod) && (
                <div>
                  <label className="text-xs text-[#848e9c] mb-1.5 block">Bank Reference</label>
                  <input value={depBankRef} onChange={e => setDepBankRef(e.target.value)} placeholder="Transfer reference" className={inp} />
                </div>
              )}
              <button type="submit" disabled={submitting}
                className="w-full bg-[#0ecb81] hover:bg-[#0ab56f] disabled:opacity-60 text-black font-semibold py-3 rounded-xl text-sm transition">
                {submitting ? 'Submitting...' : 'Submit Deposit Request'}
              </button>
            </form>
          )}

          {/* WITHDRAW */}
          {tab === 'withdraw' && (
            <form onSubmit={handleWithdraw} className="space-y-4">
              <h2 className="text-sm font-semibold text-[#eaecef]">Withdraw Funds</h2>
              <p className="text-xs text-[#848e9c]">Balance: <span className="text-[#eaecef] font-mono">${(user?.balance_usdt ?? 0).toFixed(2)}</span></p>

              <div>
                <label className="text-xs text-[#848e9c] mb-1.5 block">Withdrawal Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {METHODS.map(m => (
                    <button key={m.key} type="button" onClick={() => setWdMethod(m.key)}
                      className={`text-xs px-3 py-2 rounded-xl border transition ${wdMethod === m.key ? 'border-[#f0b90b] bg-[#f0b90b]/10 text-[#f0b90b]' : 'border-[#2b3139] text-[#848e9c] hover:border-[#3c4451]'}`}>
                      <span className="font-mono mr-1">{METHODS.find(x => x.key === m.key)?.icon}</span>{m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-[#848e9c] mb-1.5 block">Amount (USDT) *</label>
                <input type="number" min="0" step="0.01" value={wdAmount} onChange={e => setWdAmount(e.target.value)}
                  required placeholder="0.00" className={inp} />
              </div>
              {isCrypto(wdMethod) && (
                <div>
                  <label className="text-xs text-[#848e9c] mb-1.5 block">Destination Wallet *</label>
                  <input value={wdAddress} onChange={e => setWdAddress(e.target.value)} required placeholder="Your wallet address" className={inp} />
                </div>
              )}
              {!isCrypto(wdMethod) && (
                <div>
                  <label className="text-xs text-[#848e9c] mb-1.5 block">Bank Account / Reference</label>
                  <input value={wdBankRef} onChange={e => setWdBankRef(e.target.value)} placeholder="Your bank account / IBAN" className={inp} />
                </div>
              )}
              <button type="submit" disabled={submitting}
                className="w-full bg-[#f6465d] hover:bg-[#d93d51] disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition">
                {submitting ? 'Submitting...' : 'Request Withdrawal'}
              </button>
            </form>
          )}

          {/* P2P SEND */}
          {tab === 'send' && (
            <form onSubmit={handleP2P} className="space-y-4">
              <h2 className="text-sm font-semibold text-[#eaecef]">Send to User (P2P)</h2>
              <p className="text-xs text-[#848e9c]">Instant transfer to any FinAi user by email</p>
              <div>
                <label className="text-xs text-[#848e9c] mb-1.5 block">Recipient Email *</label>
                <input type="email" value={p2pEmail} onChange={e => setP2pEmail(e.target.value)} required placeholder="user@example.com" className={inp} />
              </div>
              <div>
                <label className="text-xs text-[#848e9c] mb-1.5 block">Amount (USDT) *</label>
                <input type="number" min="0.01" step="0.01" value={p2pAmount} onChange={e => setP2pAmount(e.target.value)} required placeholder="0.00" className={inp} />
              </div>
              <div>
                <label className="text-xs text-[#848e9c] mb-1.5 block">Note (optional)</label>
                <input value={p2pNote} onChange={e => setP2pNote(e.target.value)} placeholder="Payment note" className={inp} />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-[#f0b90b] hover:bg-[#d4a30a] disabled:opacity-60 text-black font-semibold py-3 rounded-xl text-sm transition">
                {submitting ? 'Sending...' : 'Send Funds'}
              </button>
            </form>
          )}

          {/* RENT VPS */}
          {tab === 'vps' && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#eaecef]">Rent a VPS for your Bot</h2>
              <p className="text-xs text-[#848e9c]">Run your FinAi bot 24/7 on a dedicated server. Billed monthly from your balance.</p>
              {VPS_PLANS.map(plan => (
                <div key={plan.name} className="flex items-center justify-between bg-[#0b0e11] border border-[#2b3139] rounded-xl px-4 py-3 hover:border-[#f0b90b]/30 transition">
                  <div>
                    <p className="text-sm font-medium text-[#eaecef]">{plan.name}</p>
                    <p className="text-xs text-[#848e9c]">{plan.specs}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-[#f0b90b]">${plan.price}<span className="text-xs text-[#848e9c]">/mo</span></p>
                    <button onClick={() => {
                      if ((user?.balance_usdt ?? 0) < plan.price) return toast.error('Insufficient balance')
                      toast.success(`${plan.name} order submitted!`)
                    }} className="mt-1 text-xs bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 text-[#f0b90b] px-3 py-1 rounded-lg transition flex items-center gap-1">
                      Rent <ChevronRight size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BUY ASSET */}
          {tab === 'asset' && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-[#eaecef]">Buy Crypto Assets</h2>
              <p className="text-xs text-[#848e9c]">Purchase crypto directly from your USDT balance.</p>
              {ASSETS.map(asset => (
                <div key={asset.name} className="flex items-center justify-between bg-[#0b0e11] border border-[#2b3139] rounded-xl px-4 py-3 hover:border-[#f0b90b]/30 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f0b90b]/10 flex items-center justify-center font-bold text-[#f0b90b]">{asset.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-[#eaecef]">{asset.name}</p>
                      <p className="text-xs text-[#848e9c]">${asset.price.toLocaleString()} / unit</p>
                    </div>
                  </div>
                  <button onClick={() => toast('Asset purchase coming soon')}
                    className="text-xs bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 text-[#f0b90b] px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                    Buy <ChevronRight size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: transaction history */}
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[#2b3139] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#eaecef]">Recent Transactions</h2>
            <span className="text-xs text-[#848e9c]">{txs.length} total</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[480px]">
            {loading ? (
              <div className="py-12 text-center text-[#848e9c] text-sm">Loading...</div>
            ) : txs.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2">
                <RefreshCw size={24} className="text-[#2b3139]" />
                <p className="text-sm text-[#848e9c]">No transactions yet</p>
              </div>
            ) : txs.map(tx => (
              <div key={tx.id} className="flex items-start justify-between gap-3 px-4 py-3 border-b border-[#2b3139]/50 hover:bg-[#1e2329] transition">
                <div className="w-7 h-7 rounded-full bg-[#0b0e11] border border-[#2b3139] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {txIcon(tx.tx_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#eaecef] capitalize">{tx.tx_type.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-[#848e9c]">{tx.method?.replace(/_/g, ' ')} · {new Date(tx.created_at).toLocaleDateString()}</p>
                  {tx.note && <p className="text-[10px] text-[#4a5568] truncate">{tx.note}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-mono font-medium ${['deposit', 'p2p_receive'].includes(tx.tx_type) ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                    {['deposit', 'p2p_receive'].includes(tx.tx_type) ? '+' : '-'}${tx.amount_usdt.toFixed(2)}
                  </p>
                  <div className="flex justify-end mt-0.5">{statusBadge(tx.status)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
