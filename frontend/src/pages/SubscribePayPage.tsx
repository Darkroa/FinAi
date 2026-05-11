import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Check, Zap, ArrowLeft, CreditCard, Wallet, Copy } from 'lucide-react'

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: 500,
    period: '/month',
    highlight: false,
    features: ['10 AI bots', '5 API keys', 'Live market data', 'Telegram & WhatsApp alerts', 'Priority support'],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 1000,
    period: '/month',
    highlight: true,
    features: ['20 AI bots', '20 API keys', 'VPS hosting included', 'Custom strategies', 'Dedicated support'],
  },
  {
    id: 'elite+',
    name: 'Elite+',
    price: 2000,
    period: '/month',
    highlight: false,
    features: ['40 AI bots', '40 API keys', 'All Elite features', 'White-label option', 'SLA guarantee'],
  },
  {
    id: 'custom',
    name: 'Custom',
    price: -1,
    period: 'Contact us',
    highlight: false,
    features: ['Unlimited bots & keys', 'Custom infrastructure', 'On-premise option', 'Enterprise SLA', 'Dedicated team'],
  },
]

const DEPOSIT_ADDRESS = 'TRX7xK9mPqNvBxAYT3jLQZwKpZ8uEfDmRe'

export default function SubscribePayPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [selectedPlan, setSelectedPlan] = useState<string>('elite')
  const [payMethod, setPayMethod] = useState<'wallet' | 'crypto'>('wallet')
  const [confirming, setConfirming] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const plan = PLANS.find(p => p.id === selectedPlan)
  const balance = user?.balance_usdt ?? 0
  const canAffordWallet = plan && plan.price > 0 && balance >= plan.price

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plan || plan.price === -1) {
      toast('Contact our sales team at sales@finai.com', { icon: '📧' })
      return
    }
    setConfirming(true)
    try {
      await new Promise(r => setTimeout(r, 1200))
      setSubmitted(true)
      toast.success('Subscription request submitted! Admin will activate your plan within 24h.')
    } catch {
      toast.error('Submission failed, please try again.')
    } finally {
      setConfirming(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-[#0ecb81]/10 flex items-center justify-center">
          <Check size={28} className="text-[#0ecb81]" />
        </div>
        <h2 className="text-xl font-bold text-[#eaecef]">Request Submitted!</h2>
        <p className="text-sm text-[#848e9c] max-w-xs">
          Your subscription request for <span className="text-[#f0b90b] font-semibold">{plan?.name}</span> has been submitted.
          Admin will activate your plan within 24 hours.
        </p>
        <div className="flex gap-3 mt-2">
          <button onClick={() => navigate('/app/dashboard')}
            className="bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition">
            Go to Dashboard
          </button>
          <button onClick={() => navigate('/app/support')}
            className="border border-[#2b3139] text-[#848e9c] hover:text-[#eaecef] font-medium px-5 py-2.5 rounded-xl text-sm transition">
            Contact Support
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-[#848e9c] hover:text-[#eaecef] rounded-lg hover:bg-[#161a1e] transition">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#eaecef]">Subscribe</h1>
          <p className="text-xs text-[#848e9c]">Choose your plan and payment method</p>
        </div>
      </div>

      {/* Current sub */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#848e9c]">Current Plan</p>
          <p className="text-sm font-bold text-[#eaecef] capitalize">{user?.subscription || 'Free'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#848e9c]">Wallet Balance</p>
          <p className="text-sm font-bold font-mono text-[#0ecb81]">${balance.toFixed(2)} USDT</p>
        </div>
      </div>

      {/* Plan selector */}
      <div>
        <p className="text-xs font-bold text-[#eaecef] mb-3">Select Plan</p>
        <div className="grid grid-cols-2 gap-3">
          {PLANS.map(p => (
            <button key={p.id} onClick={() => setSelectedPlan(p.id)}
              className={[
                'relative text-left rounded-xl border p-4 transition-all flex flex-col gap-2',
                selectedPlan === p.id
                  ? 'border-[#f0b90b] bg-[#f0b90b]/5'
                  : 'border-[#2b3139] bg-[#161a1e] hover:border-[#3c4451]',
              ].join(' ')}>
              {p.highlight && (
                <span className="absolute -top-2 right-3 text-[9px] font-extrabold bg-[#f0b90b] text-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${selectedPlan === p.id ? 'text-[#f0b90b]' : 'text-[#eaecef]'}`}>{p.name}</span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selectedPlan === p.id ? 'border-[#f0b90b] bg-[#f0b90b]' : 'border-[#2b3139]'}`}>
                  {selectedPlan === p.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
              </div>
              <p className="text-[#f0b90b] font-mono font-bold text-sm">
                {p.price === -1 ? 'Custom' : p.price === 0 ? 'Free' : `$${p.price.toLocaleString()}`}
                {p.price > 0 && <span className="text-[#848e9c] font-normal text-xs">{p.period}</span>}
              </p>
              <ul className="space-y-1">
                {p.features.slice(0, 3).map(f => (
                  <li key={f} className="text-[10px] text-[#848e9c] flex items-center gap-1">
                    <Check size={8} className="text-[#0ecb81] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>

      {/* Plan features detail */}
      {plan && plan.price > 0 && (
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
          <p className="text-xs font-semibold text-[#eaecef] mb-3">{plan.name} — All features</p>
          <ul className="grid grid-cols-2 gap-2">
            {plan.features.map(f => (
              <li key={f} className="flex items-center gap-1.5 text-xs text-[#848e9c]">
                <Check size={10} className="text-[#0ecb81] flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Payment method */}
      {plan && plan.price > 0 && (
        <div>
          <p className="text-xs font-bold text-[#eaecef] mb-3">Payment Method</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => setPayMethod('wallet')}
              className={`flex items-center gap-2 rounded-xl border p-3.5 transition ${payMethod === 'wallet' ? 'border-[#f0b90b] bg-[#f0b90b]/5' : 'border-[#2b3139] bg-[#161a1e] hover:border-[#3c4451]'}`}>
              <Wallet size={16} className={payMethod === 'wallet' ? 'text-[#f0b90b]' : 'text-[#848e9c]'} />
              <div className="text-left">
                <p className={`text-xs font-semibold ${payMethod === 'wallet' ? 'text-[#f0b90b]' : 'text-[#eaecef]'}`}>Platform Wallet</p>
                <p className="text-[10px] text-[#848e9c]">Balance: ${balance.toFixed(0)}</p>
              </div>
            </button>
            <button onClick={() => setPayMethod('crypto')}
              className={`flex items-center gap-2 rounded-xl border p-3.5 transition ${payMethod === 'crypto' ? 'border-[#f0b90b] bg-[#f0b90b]/5' : 'border-[#2b3139] bg-[#161a1e] hover:border-[#3c4451]'}`}>
              <CreditCard size={16} className={payMethod === 'crypto' ? 'text-[#f0b90b]' : 'text-[#848e9c]'} />
              <div className="text-left">
                <p className={`text-xs font-semibold ${payMethod === 'crypto' ? 'text-[#f0b90b]' : 'text-[#eaecef]'}`}>Crypto Transfer</p>
                <p className="text-[10px] text-[#848e9c]">USDT / BTC / ETH</p>
              </div>
            </button>
          </div>

          {payMethod === 'wallet' && (
            <div className={`rounded-xl border p-4 mb-4 ${canAffordWallet ? 'border-[#0ecb81]/20 bg-[#0ecb81]/5' : 'border-[#f6465d]/20 bg-[#f6465d]/5'}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#848e9c]">Subscription cost</p>
                <p className="text-sm font-bold font-mono text-[#eaecef]">${plan.price.toLocaleString()} USDT</p>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-[#848e9c]">Your balance</p>
                <p className={`text-sm font-bold font-mono ${canAffordWallet ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>${balance.toFixed(2)} USDT</p>
              </div>
              {!canAffordWallet && (
                <p className="text-[10px] text-[#f6465d] mt-2">
                  Insufficient balance. <button onClick={() => navigate('/app/wallet?tab=deposit')} className="underline">Deposit now →</button>
                </p>
              )}
            </div>
          )}

          {payMethod === 'crypto' && (
            <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4 mb-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#eaecef] mb-1">Send exactly <span className="text-[#f0b90b]">${plan.price.toLocaleString()} USDT (TRC20)</span> to:</p>
                <div className="flex items-center gap-2 bg-[#0b0e11] rounded-lg px-3 py-2 border border-[#2b3139]">
                  <code className="text-xs font-mono text-[#eaecef] flex-1 break-all">{DEPOSIT_ADDRESS}</code>
                  <button onClick={() => { navigator.clipboard.writeText(DEPOSIT_ADDRESS); toast.success('Address copied!') }}
                    className="flex-shrink-0 text-[#848e9c] hover:text-[#f0b90b] transition">
                    <Copy size={12} />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-[#848e9c]">After sending, click the button below. Admin will verify and activate your plan within 24 hours.</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <button type="submit"
              disabled={confirming || (payMethod === 'wallet' && !canAffordWallet)}
              className="w-full bg-[#f0b90b] hover:bg-[#d4a30a] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
              <Zap size={14} />
              {confirming ? 'Submitting…' : `Subscribe to ${plan.name}`}
            </button>
          </form>
        </div>
      )}

      {/* Custom plan */}
      {plan && plan.price === -1 && (
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5 text-center space-y-3">
          <Zap size={24} className="text-[#f0b90b] mx-auto" />
          <p className="text-sm font-semibold text-[#eaecef]">Custom Enterprise Plan</p>
          <p className="text-xs text-[#848e9c]">Contact our sales team for a tailored plan with unlimited bots, custom infrastructure, and enterprise SLA.</p>
          <a href="mailto:sales@finai.com"
            className="inline-flex items-center gap-2 bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-bold px-6 py-2.5 rounded-xl text-sm transition">
            Contact Sales
          </a>
        </div>
      )}
    </div>
  )
}
