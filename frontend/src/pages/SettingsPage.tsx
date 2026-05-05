import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { connectExchange, disconnectExchange, createApiKey, listApiKeys, revokeApiKey } from '../lib/api'
import toast from 'react-hot-toast'
import { Shield, Bell, Key, Zap, Plus, Trash2, Eye, EyeOff, CheckCircle, Copy, AlertCircle } from 'lucide-react'

const EXCHANGES = [
  { id: 'binance',  label: 'Binance',  icon: '🟡', hasPassphrase: false },
  { id: 'bybit',    label: 'Bybit',    icon: '🟠', hasPassphrase: false },
  { id: 'okx',      label: 'OKX',      icon: '⚫', hasPassphrase: true  },
  { id: 'kucoin',   label: 'KuCoin',   icon: '🟢', hasPassphrase: true  },
  { id: 'kraken',   label: 'Kraken',   icon: '🔵', hasPassphrase: false },
  { id: 'coinbase', label: 'Coinbase', icon: '🔷', hasPassphrase: false },
]

interface ApiKey { id: number; key_name: string; purpose: string; created_at: string; expires_at: string; is_active: boolean; last_used_at: string }

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const [notifications, setNotifications] = useState(user?.notification_preferences || { email: true, whatsapp: false, telegram: false })

  // Exchange connection
  const [selExchange, setSelExchange] = useState('')
  const [exchApiKey, setExchApiKey] = useState('')
  const [exchSecret, setExchSecret] = useState('')
  const [exchPass, setExchPass] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [connecting, setConnecting] = useState(false)

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [keysLoaded, setKeysLoaded] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPurpose, setNewKeyPurpose] = useState('bot')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [creatingKey, setCreatingKey] = useState(false)

  const selectedExch = EXCHANGES.find(e => e.id === selExchange)
  const connections = user?.exchange_connections || []

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selExchange || !exchApiKey || !exchSecret) return toast.error('Fill all fields')
    setConnecting(true)
    try {
      await connectExchange({ exchange: selExchange, api_key: exchApiKey, api_secret: exchSecret, passphrase: exchPass || undefined, label: selectedExch?.label })
      // Refresh user
      const { getMe } = await import('../lib/api')
      const res = await getMe()
      setUser(res.data)
      toast.success(`${selectedExch?.label} connected!`)
      setExchApiKey(''); setExchSecret(''); setExchPass(''); setSelExchange('')
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to connect')
    } finally { setConnecting(false) }
  }

  const handleDisconnect = async (exchange: string) => {
    try {
      await disconnectExchange(exchange)
      const { getMe } = await import('../lib/api')
      const res = await getMe()
      setUser(res.data)
      toast.success(`${exchange} disconnected`)
    } catch { toast.error('Failed to disconnect') }
  }

  const loadApiKeys = async () => {
    try {
      const res = await listApiKeys()
      setApiKeys(Array.isArray(res.data) ? res.data : [])
      setKeysLoaded(true)
    } catch { toast.error('Failed to load API keys') }
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) return
    setCreatingKey(true)
    try {
      const res = await createApiKey(newKeyName.trim(), newKeyPurpose)
      setCreatedKey(res.data.api_key)
      toast.success('API key created — copy it now!')
      setNewKeyName('')
      await loadApiKeys()
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to create key')
    } finally { setCreatingKey(false) }
  }

  const handleRevokeKey = async (id: number) => {
    try {
      await revokeApiKey(id)
      toast.success('Key revoked')
      await loadApiKeys()
    } catch { toast.error('Failed to revoke') }
  }

  const inp = 'w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] placeholder-[#4a5568] focus:outline-none focus:border-[#f0b90b] transition'

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold text-[#eaecef]">Settings</h1>

      {/* Exchange Connections */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Zap size={15} className="text-[#f0b90b]" />
          <h2 className="text-sm font-semibold text-[#eaecef]">Exchange Connections</h2>
        </div>

        {/* Connected exchanges */}
        {connections.length > 0 && (
          <div className="mb-4 space-y-2">
            {connections.map((c) => {
              const exch = EXCHANGES.find(e => e.id === c.exchange)
              return (
                <div key={c.exchange} className="flex items-center justify-between bg-[#0b0e11] border border-[#0ecb81]/20 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{exch?.icon || '🔗'}</span>
                    <div>
                      <p className="text-sm font-medium text-[#eaecef]">{c.label || c.exchange}</p>
                      <p className="text-[10px] text-[#848e9c] font-mono">{c.api_key_masked}</p>
                    </div>
                    <CheckCircle size={13} className="text-[#0ecb81]" />
                  </div>
                  <button onClick={() => handleDisconnect(c.exchange)}
                    className="p-1.5 rounded-lg text-[#848e9c] hover:text-[#f6465d] hover:bg-[#f6465d]/10 transition">
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Connect form */}
        <form onSubmit={handleConnect} className="space-y-3">
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Select Exchange</label>
            <div className="grid grid-cols-3 gap-2">
              {EXCHANGES.map(ex => (
                <button key={ex.id} type="button" onClick={() => setSelExchange(ex.id)}
                  className={`text-xs px-2 py-2 rounded-xl border transition flex items-center gap-1.5 justify-center ${selExchange === ex.id ? 'border-[#f0b90b] bg-[#f0b90b]/10 text-[#f0b90b]' : 'border-[#2b3139] text-[#848e9c] hover:border-[#3c4451]'}`}>
                  <span>{ex.icon}</span>{ex.label}
                </button>
              ))}
            </div>
          </div>
          {selExchange && (
            <>
              <div>
                <label className="text-xs text-[#848e9c] mb-1.5 block">API Key *</label>
                <input value={exchApiKey} onChange={e => setExchApiKey(e.target.value)} required placeholder="API key" className={inp} />
              </div>
              <div>
                <label className="text-xs text-[#848e9c] mb-1.5 block">API Secret *</label>
                <div className="relative">
                  <input type={showSecret ? 'text' : 'password'} value={exchSecret} onChange={e => setExchSecret(e.target.value)} required placeholder="API secret" className={`${inp} pr-10`} />
                  <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848e9c] hover:text-[#eaecef]">
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              {selectedExch?.hasPassphrase && (
                <div>
                  <label className="text-xs text-[#848e9c] mb-1.5 block">Passphrase</label>
                  <input type="password" value={exchPass} onChange={e => setExchPass(e.target.value)} placeholder="API passphrase" className={inp} />
                </div>
              )}
              <button type="submit" disabled={connecting}
                className="w-full bg-[#f0b90b] hover:bg-[#d4a30a] disabled:opacity-60 text-black font-semibold py-2.5 rounded-xl text-sm transition">
                {connecting ? 'Connecting...' : `Connect ${selectedExch?.label}`}
              </button>
            </>
          )}
        </form>
      </div>

      {/* Security */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={15} className="text-[#f0b90b]" />
          <h2 className="text-sm font-semibold text-[#eaecef]">Security</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Current Password</label>
            <input type="password" placeholder="••••••••" className={inp} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#848e9c] mb-1.5 block">New Password</label>
              <input type="password" placeholder="••••••••" className={inp} />
            </div>
            <div>
              <label className="text-xs text-[#848e9c] mb-1.5 block">Confirm Password</label>
              <input type="password" placeholder="••••••••" className={inp} />
            </div>
          </div>
          <button onClick={() => toast.success('Password changed')}
            className="bg-[#f0b90b] hover:bg-[#d4a30a] text-black text-sm font-semibold px-4 py-2.5 rounded-xl transition">
            Update Password
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={15} className="text-[#f0b90b]" />
          <h2 className="text-sm font-semibold text-[#eaecef]">Notifications</h2>
        </div>
        <div className="space-y-3">
          {([['email', 'Email notifications'], ['whatsapp', 'WhatsApp alerts'], ['telegram', 'Telegram alerts']] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-[#2b3139]/50 last:border-0">
              <div>
                <p className="text-sm text-[#eaecef]">{label}</p>
                <p className="text-xs text-[#848e9c]">Receive trade and event alerts</p>
              </div>
              <button
                onClick={() => setNotifications((n: typeof notifications) => ({ ...n, [key]: !n[key] }))}
                className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${notifications[key] ? 'bg-[#f0b90b]' : 'bg-[#2b3139]'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${notifications[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Key size={15} className="text-[#f0b90b]" />
            <h2 className="text-sm font-semibold text-[#eaecef]">API Keys</h2>
          </div>
          {!keysLoaded && (
            <button onClick={loadApiKeys} className="text-xs text-[#f0b90b] hover:underline">Load keys</button>
          )}
        </div>

        {/* Requirements notice */}
        {(!user?.is_mail_verified || (user?.account_tier ?? 0) < 1) && (
          <div className="flex items-start gap-2 bg-[#f0b90b]/5 border border-[#f0b90b]/20 rounded-xl px-3 py-2.5 mb-4">
            <AlertCircle size={13} className="text-[#f0b90b] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#848e9c]">API key creation requires email verification and KYC tier 1 approval.</p>
          </div>
        )}

        {/* New key created */}
        {createdKey && (
          <div className="bg-[#0ecb81]/5 border border-[#0ecb81]/20 rounded-xl p-3 mb-4">
            <p className="text-xs font-semibold text-[#0ecb81] mb-1.5">New API Key — Copy now, won't be shown again!</p>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-[#eaecef] bg-[#0b0e11] px-2 py-1 rounded flex-1 truncate">{createdKey}</code>
              <button onClick={() => { navigator.clipboard.writeText(createdKey); toast.success('Copied!') }}
                className="p-1.5 text-[#0ecb81] hover:bg-[#0ecb81]/10 rounded-lg transition flex-shrink-0">
                <Copy size={13} />
              </button>
            </div>
            <button onClick={() => setCreatedKey(null)} className="text-[10px] text-[#848e9c] mt-2 hover:text-[#eaecef]">Dismiss</button>
          </div>
        )}

        {/* Create form */}
        <form onSubmit={handleCreateKey} className="flex flex-wrap gap-2 mb-4">
          <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} required
            placeholder="Key name (e.g. My Bot)" className="flex-1 bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2 text-sm text-[#eaecef] placeholder-[#4a5568] focus:outline-none focus:border-[#f0b90b] transition min-w-0" />
          <select value={newKeyPurpose} onChange={e => setNewKeyPurpose(e.target.value)}
            className="bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2 text-sm text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition">
            <option value="bot">Bot</option>
            <option value="vps">VPS</option>
            <option value="asset">Asset</option>
          </select>
          <button type="submit" disabled={creatingKey}
            className="flex items-center gap-1.5 bg-[#f0b90b] hover:bg-[#d4a30a] disabled:opacity-60 text-black font-semibold px-4 py-2 rounded-xl text-sm transition">
            <Plus size={13} />{creatingKey ? '...' : 'Create'}
          </button>
        </form>

        {/* Keys list */}
        {keysLoaded && (
          <div className="space-y-2">
            {apiKeys.length === 0 ? (
              <p className="text-sm text-[#848e9c] text-center py-4">No API keys yet</p>
            ) : apiKeys.map(k => (
              <div key={k.id} className="flex items-center justify-between bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-[#eaecef]">{k.key_name}</p>
                  <p className="text-[10px] text-[#848e9c]">
                    {k.purpose} · Created {new Date(k.created_at).toLocaleDateString()}
                    {k.last_used_at && ` · Last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${k.is_active ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#2b3139] text-[#848e9c]'}`}>
                    {k.is_active ? 'Active' : 'Revoked'}
                  </span>
                  {k.is_active && (
                    <button onClick={() => handleRevokeKey(k.id)} className="p-1.5 text-[#848e9c] hover:text-[#f6465d] hover:bg-[#f6465d]/10 rounded-lg transition">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
