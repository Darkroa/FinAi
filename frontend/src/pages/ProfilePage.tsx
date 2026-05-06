import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import {
  updateProfile, uploadPhoto, sendVerifyEmail, verifyEmail,
  submitKYC, getMe, createApiKey, listApiKeys, revokeApiKey,
  connectExchange, disconnectExchange,
  changePassword, setTransferPin, requestDeleteAccount, saveWebhookSettings,
  sendWhatsAppCode, verifyWhatsApp, getTelegramChatId
} from '../lib/api'
import toast from 'react-hot-toast'
import {
  User, Camera, Shield, CheckCircle, Clock, XCircle,
  Mail, Lock, Key, Zap, Plus, Trash2, Eye, EyeOff,
  Copy, AlertCircle, Star, Send, MessageCircle, LogOut, ChevronDown
} from 'lucide-react'

const TIERS = [
  { tier: 0, label: 'Unverified', color: 'text-[#848e9c]', bg: 'bg-[#2b3139]/30',    border: 'border-[#2b3139]',    limits: 'No withdrawals · No API keys' },
  { tier: 1, label: 'Tier 1',    color: 'text-[#f0b90b]', bg: 'bg-[#f0b90b]/8',      border: 'border-[#f0b90b]/20', limits: '$500/day withdraw · 1 API key' },
  { tier: 2, label: 'Tier 2',    color: 'text-[#0ecb81]', bg: 'bg-[#0ecb81]/8',      border: 'border-[#0ecb81]/20', limits: '$5,000/day withdraw · 5 API keys' },
  { tier: 3, label: 'Tier 3',    color: 'text-[#a78bfa]', bg: 'bg-[#a78bfa]/8',      border: 'border-[#a78bfa]/20', limits: 'Unlimited · Priority support' },
]

const EXCHANGES = [
  { id: 'binance',  label: 'Binance',  logo: 'https://assets.coingecko.com/markets/images/52/small/binance.jpg',  hasPassphrase: false },
  { id: 'bybit',    label: 'Bybit',    logo: 'https://assets.coingecko.com/markets/images/698/small/bybit_spot.jpg', hasPassphrase: false },
  { id: 'okx',      label: 'OKX',      logo: 'https://assets.coingecko.com/markets/images/96/small/WeChat_Image_20220117220452.png', hasPassphrase: true  },
  { id: 'kucoin',   label: 'KuCoin',   logo: 'https://assets.coingecko.com/markets/images/61/small/kucoin.jpg',   hasPassphrase: true  },
  { id: 'kraken',   label: 'Kraken',   logo: 'https://assets.coingecko.com/markets/images/29/small/kraken.jpg',   hasPassphrase: false },
  { id: 'coinbase', label: 'Coinbase', logo: 'https://assets.coingecko.com/markets/images/23/small/Coinbase_Coin_Primary.png', hasPassphrase: false },
]

interface ApiKey { id: number; key_name: string; purpose: string; created_at: string; expires_at: string; is_active: boolean; last_used_at: string }
type Tab = 'personal' | 'finapi' | 'security'

const inp = 'w-full bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-2.5 text-sm text-[#eaecef] placeholder-[#4a5568] focus:outline-none focus:border-[#f0b90b] transition disabled:opacity-50 disabled:cursor-not-allowed'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[#848e9c]">
        {label}{required && <span className="text-[#f0b90b] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#4a5568]">{label}</span>
      <div className="flex-1 h-px bg-[#2b3139]" />
    </div>
  )
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [tab, setTab] = useState<Tab>('personal')

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold text-[#eaecef]">My Profile</h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#161a1e] border border-[#2b3139] rounded-xl p-1">
        {([
          ['personal', 'Personal', User],
          ['finapi',   'FinAPI',   Key],
          ['security', 'Security', Shield],
        ] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id as Tab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${tab === id ? 'bg-[#f0b90b] text-black shadow-md' : 'text-[#848e9c] hover:text-[#eaecef]'}`}>
            <Icon size={13}/>{label}
          </button>
        ))}
      </div>

      {tab === 'personal' && <PersonalTab user={user} setUser={setUser} />}
      {tab === 'finapi'   && <FinApiTab   user={user} setUser={setUser} />}
      {tab === 'security' && <SecurityTab user={user} />}
    </div>
  )
}


/* ─────────────────────────── PERSONAL TAB ─────────────────────────── */
function PersonalTab({ user, setUser }: { user: ReturnType<typeof useAuthStore>['user']; setUser: (u: unknown) => void }) {
  const tier = TIERS[user?.account_tier ?? 0]
  const kycBadge = () => {
    switch (user?.kyc_status) {
      case 'approved':  return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#0ecb81]/10 text-[#0ecb81]"><CheckCircle size={9}/>Approved</span>
      case 'submitted': return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#f0b90b]/10 text-[#f0b90b]"><Clock size={9}/>Under Review</span>
      case 'rejected':  return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#f6465d]/10 text-[#f6465d]"><XCircle size={9}/>Rejected</span>
      default:          return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#2b3139] text-[#848e9c]"><Clock size={9}/>Pending</span>
    }
  }
  const [form, setForm] = useState({
    first_name:  user?.first_name  || '',
    middle_name: user?.middle_name || '',
    last_name:   user?.last_name   || '',
    username:    user?.username    || '',
    phone:       user?.phone       || '',
    dob:         user?.dob         || '',
    sex:         user?.sex         || '',
    address:     user?.address     || '',
    country:     user?.country     || '',
  })
  const [saving, setSaving]           = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [showVerify, setShowVerify]   = useState(false)
  const [verifyCode, setVerifyCode]   = useState('')
  const [verifying, setVerifying]     = useState(false)
  const [devCode, setDevCode]         = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (user?.profile_locked) return toast.error('Profile is locked by admin')
    setSaving(true)
    try {
      const res = await updateProfile(form as Record<string, unknown>)
      setUser(res.data)
      toast.success('Profile updated')
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to update')
    } finally { setSaving(false) }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    try {
      await uploadPhoto(file)
      const res = await getMe()
      setUser(res.data)
      toast.success('Photo updated')
    } catch { toast.error('Failed to upload photo') }
    finally { setPhotoLoading(false) }
  }

  const handleSendCode = async () => {
    setSendingCode(true)
    try {
      const res = await sendVerifyEmail()
      setDevCode(res.data.dev_code || null)
      setShowVerify(true)
      toast.success('Verification code sent')
    } catch { toast.error('Failed to send code') }
    finally { setSendingCode(false) }
  }

  const handleVerify = async () => {
    if (!verifyCode.trim()) return
    setVerifying(true)
    try {
      await verifyEmail(verifyCode.trim())
      const res = await getMe()
      setUser(res.data)
      toast.success('Email verified!')
      setShowVerify(false)
    } catch { toast.error('Invalid or expired code') }
    finally { setVerifying(false) }
  }

  const handleSubmitKYC = async () => {
    try {
      await submitKYC()
      const res = await getMe()
      setUser(res.data)
      toast.success('KYC submitted for admin review')
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Complete all required fields first')
    }
  }

  return (
    <div className="space-y-3">

      {/* 1. Profile picture */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#f0b90b]/10 border-2 border-[#f0b90b]/30 overflow-hidden flex items-center justify-center">
              {user?.profile_photo
                ? <img src={user.profile_photo} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-4xl font-bold text-[#f0b90b]">{user?.email?.[0]?.toUpperCase() ?? 'U'}</span>
              }
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={photoLoading}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#f0b90b] flex items-center justify-center shadow-lg hover:bg-[#d4a30a] transition">
              {photoLoading
                ? <div className="w-3.5 h-3.5 border border-black border-t-transparent rounded-full animate-spin" />
                : <Camera size={13} className="text-black" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          <div>
            <p className="font-bold text-base text-[#eaecef]">{user?.full_name || user?.email}</p>
            <p className="text-xs text-[#848e9c] mt-0.5">@{user?.username || 'no username set'}</p>
            <p className="text-[11px] text-[#4a5568] mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* 2. Unverified / tier status */}
      <div className={`rounded-xl border ${tier.border} ${tier.bg} px-4 py-3`}>
        <div className="flex items-center gap-2 mb-2">
          <Star size={13} className={tier.color} />
          <span className={`font-bold text-sm ${tier.color}`}>{tier.label}</span>
        </div>
        <p className="text-[11px] text-[#848e9c] mb-2">{tier.limits}</p>
        <div className="flex flex-wrap gap-2">
          {kycBadge()}
          {user?.is_mail_verified
            ? <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#0ecb81]/10 text-[#0ecb81]"><CheckCircle size={9}/>Email verified</span>
            : <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#f6465d]/10 text-[#f6465d]">Email unverified</span>
          }
        </div>
      </div>

      {/* 3. Verify email */}
      {!user?.is_mail_verified && (
        <div className="bg-[#f6465d]/5 border border-[#f6465d]/20 rounded-xl px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-start gap-2 flex-1">
              <Mail size={13} className="text-[#f6465d] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#eaecef]">Verify your email address</p>
                <p className="text-[11px] text-[#848e9c]">Required to create API keys and unlock features</p>
              </div>
            </div>
            {!showVerify ? (
              <button onClick={handleSendCode} disabled={sendingCode}
                className="self-start sm:self-auto flex items-center gap-1.5 text-xs bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-semibold px-3 py-2 rounded-lg transition disabled:opacity-60">
                <Mail size={11}/>{sendingCode ? 'Sending…' : 'Send Code'}
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-[#848e9c]">Check your email for the 6-digit code</p>
                <div className="flex items-center gap-2">
                  <input value={verifyCode} onChange={e => setVerifyCode(e.target.value)}
                    placeholder="6-digit code" maxLength={6}
                    className="w-28 bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-2 text-xs text-center text-[#eaecef] focus:outline-none focus:border-[#f0b90b]" />
                  <button onClick={handleVerify} disabled={verifying}
                    className="text-xs bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-semibold px-3 py-2 rounded-lg transition disabled:opacity-60">
                    {verifying ? '…' : 'Verify'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Profile locked */}
      {user?.profile_locked && (
        <div className="flex items-center gap-2 bg-[#f6465d]/5 border border-[#f6465d]/20 rounded-xl px-4 py-3">
          <Lock size={13} className="text-[#f6465d] flex-shrink-0" />
          <p className="text-xs text-[#848e9c]">Your profile is locked by admin. Contact support to request changes.</p>
        </div>
      )}

      {/* KYC submit */}
      {user?.kyc_status === 'pending' && !user?.profile_locked && (
        <div className="bg-[#f0b90b]/5 border border-[#f0b90b]/20 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#eaecef]">Complete KYC to unlock higher tiers</p>
            <p className="text-[11px] text-[#848e9c]">Fill all required fields then submit for admin review.</p>
          </div>
          <button onClick={handleSubmitKYC}
            className="text-xs bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-semibold px-4 py-2 rounded-lg transition flex-shrink-0">
            Submit KYC
          </button>
        </div>
      )}

      {/* Personal info form */}
      <form onSubmit={handleSave} className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2b3139] bg-[#1a1f25]">
          <User size={13} className="text-[#f0b90b]" />
          <span className="text-xs font-semibold text-[#eaecef]">Personal Information</span>
          {user?.profile_locked
            ? <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#f6465d]/10 text-[#f6465d]">Locked</span>
            : <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#f0b90b]/10 text-[#f0b90b]">Required for KYC</span>
          }
        </div>

        <div className="p-4 space-y-5">

          {/* ── Full Name ── */}
          <div className="space-y-3">
            <SectionHeader label="Full Name" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="First Name" required>
                <input value={form.first_name} onChange={set('first_name')}
                  disabled={!!user?.profile_locked} placeholder="First name" className={inp} />
              </Field>
              <Field label="Middle Name">
                <input value={form.middle_name} onChange={set('middle_name')}
                  disabled={!!user?.profile_locked} placeholder="Optional" className={inp} />
              </Field>
              <Field label="Last Name" required>
                <input value={form.last_name} onChange={set('last_name')}
                  disabled={!!user?.profile_locked} placeholder="Last name" className={inp} />
              </Field>
            </div>
          </div>

          {/* ── Account Details ── */}
          <div className="space-y-3">
            <SectionHeader label="Account Details" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Username">
                <input value={form.username} onChange={set('username')}
                  disabled={!!user?.profile_locked} placeholder="@username" className={inp} />
              </Field>
              <Field label="Email">
                <input value={user?.email || ''} disabled className={inp} />
              </Field>
            </div>
          </div>

          {/* ── Contact & Identity ── */}
          <div className="space-y-3">
            <SectionHeader label="Contact & Identity" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone Number" required>
                <input value={form.phone} onChange={set('phone')}
                  disabled={!!user?.profile_locked} placeholder="+1 234 567 8900" className={inp} />
              </Field>
              <Field label="Date of Birth" required>
                <input type="date" value={form.dob} onChange={set('dob')}
                  disabled={!!user?.profile_locked} className={inp} />
              </Field>
              <Field label="Sex">
                <div className="relative">
                  <select value={form.sex} onChange={set('sex')}
                    disabled={!!user?.profile_locked}
                    className={`${inp} appearance-none pr-8`}>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848e9c] pointer-events-none" />
                </div>
              </Field>
              <Field label="Country" required>
                <input value={form.country} onChange={set('country')}
                  disabled={!!user?.profile_locked} placeholder="Country" className={inp} />
              </Field>
              <Field label="Street Address">
                <input value={form.address} onChange={set('address')}
                  disabled={!!user?.profile_locked} placeholder="Street address" className={`${inp} sm:col-span-2`} />
              </Field>
            </div>
          </div>

          {!user?.profile_locked && (
            <button type="submit" disabled={saving}
              className="w-full bg-[#f0b90b] hover:bg-[#d4a30a] disabled:opacity-60 text-black font-bold py-2.5 rounded-lg text-sm transition">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}


/* ─────────────────────────── FINAPI TAB ─────────────────────────── */
function FinApiTab({ user, setUser }: { user: ReturnType<typeof useAuthStore>['user']; setUser: (u: unknown) => void }) {
  const [apiKeys, setApiKeys]         = useState<ApiKey[]>([])
  const [keysLoaded, setKeysLoaded]   = useState(false)
  const [newKeyName, setNewKeyName]   = useState('')
  const [newKeyPurpose, setNewKeyPurpose] = useState('bot')
  const [createdKey, setCreatedKey]   = useState<string | null>(null)
  const [creatingKey, setCreatingKey] = useState(false)

  const [selExchange, setSelExchange] = useState('')
  const [exchApiKey, setExchApiKey]   = useState('')
  const [exchSecret, setExchSecret]   = useState('')
  const [exchPass, setExchPass]       = useState('')
  const [showSecret, setShowSecret]   = useState(false)
  const [connecting, setConnecting]   = useState(false)

  const prefs = (user?.notification_preferences as Record<string, unknown>) || {}
  const [tgToken, setTgToken]   = useState((prefs.telegram_bot_token as string) || '')
  const [tgChatId, setTgChatId] = useState((prefs.telegram_chat_id as string) || '')
  const [savingWebhook, setSavingWebhook]   = useState(false)
  const [findingChatId, setFindingChatId]   = useState(false)
  const [foundChatId, setFoundChatId]       = useState<string | null>(null)

  const waVerified = prefs.whatsapp_verified === true
  const waPhone    = (prefs.whatsapp_number as string) || ''
  const [waInput, setWaInput]               = useState('')
  const [waCode, setWaCode]                 = useState('')
  const [waSending, setWaSending]           = useState(false)
  const [waVerifying, setWaVerifying]       = useState(false)
  const [waCodeSent, setWaCodeSent]         = useState(false)

  const selectedExch = EXCHANGES.find(e => e.id === selExchange)
  const connections  = (user?.exchange_connections as { exchange: string; label?: string; api_key_masked?: string }[]) || []

  useEffect(() => { loadApiKeys() }, [])

  const loadApiKeys = async () => {
    try {
      const res = await listApiKeys()
      setApiKeys(Array.isArray(res.data) ? res.data : [])
      setKeysLoaded(true)
    } catch { /* silent */ }
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

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selExchange || !exchApiKey || !exchSecret) return toast.error('Fill all fields')
    setConnecting(true)
    try {
      await connectExchange({ exchange: selExchange, api_key: exchApiKey, api_secret: exchSecret, passphrase: exchPass || undefined, label: selectedExch?.label })
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
      const res = await getMe()
      setUser(res.data)
      toast.success(`${exchange} disconnected`)
    } catch { toast.error('Failed to disconnect') }
  }

  const handleSaveWebhook = async () => {
    setSavingWebhook(true)
    try {
      await saveWebhookSettings({ telegram_bot_token: tgToken, telegram_chat_id: tgChatId })
      toast.success('Telegram settings saved')
    } catch { toast.error('Failed to save settings') }
    finally { setSavingWebhook(false) }
  }

  const handleFindChatId = async () => {
    if (!tgToken.trim()) return toast.error('Enter your bot token first')
    setFindingChatId(true)
    try {
      const res = await getTelegramChatId(tgToken.trim())
      const { chat_id, first_name, username, message } = res.data
      if (chat_id) {
        setTgChatId(chat_id)
        setFoundChatId(chat_id)
        toast.success(`Found: ${first_name || username || chat_id}`)
      } else {
        toast.error(message || 'No messages found. Send /start to your bot first.')
      }
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to fetch chat ID')
    } finally { setFindingChatId(false) }
  }

  const handleSendWaCode = async () => {
    if (!waInput.trim()) return toast.error('Enter your WhatsApp number (e.g. +1234567890)')
    setWaSending(true)
    try {
      await sendWhatsAppCode(waInput.trim())
      setWaCodeSent(true)
      toast.success('Code sent to WhatsApp!')
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to send code')
    } finally { setWaSending(false) }
  }

  const handleVerifyWa = async () => {
    if (!waCode.trim()) return toast.error('Enter the verification code')
    setWaVerifying(true)
    try {
      await verifyWhatsApp(waCode.trim())
      const res = await getMe()
      setUser(res.data)
      setWaCodeSent(false)
      setWaInput('')
      setWaCode('')
      toast.success('WhatsApp verified!')
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Invalid code')
    } finally { setWaVerifying(false) }
  }

  const handleDisconnectWa = async () => {
    try {
      await saveWebhookSettings({ whatsapp_number: '' })
      const res = await getMe()
      setUser(res.data)
      toast.success('WhatsApp disconnected')
    } catch { toast.error('Failed to disconnect') }
  }

  const canCreateKey = user?.is_mail_verified && (user?.account_tier ?? 0) >= 1

  return (
    <div className="space-y-4">

      {/* API Keys */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2b3139] bg-[#1a1f25]">
          <Key size={13} className="text-[#f0b90b]" />
          <span className="text-xs font-semibold text-[#eaecef]">Your FinAPI Key</span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-[11px] text-[#848e9c]">Your API key is required to activate and control your AI Trading Bot.</p>

          {!canCreateKey && (
            <div className="flex items-start gap-2 bg-[#f0b90b]/5 border border-[#f0b90b]/20 rounded-lg px-3 py-2.5">
              <AlertCircle size={12} className="text-[#f0b90b] flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#848e9c]">Requires email verification + KYC Tier 1 approval to create API keys.</p>
            </div>
          )}

          {createdKey && (
            <div className="bg-[#0ecb81]/5 border border-[#0ecb81]/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-[#0ecb81] mb-2">New API Key — copy now, won't be shown again!</p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-[#eaecef] bg-[#0b0e11] px-2 py-1.5 rounded flex-1 truncate">{createdKey}</code>
                <button onClick={() => { navigator.clipboard.writeText(createdKey); toast.success('Copied!') }}
                  className="p-1.5 text-[#0ecb81] hover:bg-[#0ecb81]/10 rounded-lg transition flex-shrink-0">
                  <Copy size={13}/>
                </button>
              </div>
              <button onClick={() => setCreatedKey(null)} className="text-[10px] text-[#848e9c] mt-2 hover:text-[#eaecef]">Dismiss</button>
            </div>
          )}

          <form onSubmit={handleCreateKey} className="flex flex-wrap gap-2">
            <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} required disabled={!canCreateKey}
              placeholder="Key name (e.g. My Bot)"
              className="flex-1 min-w-0 bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-2 text-xs text-[#eaecef] placeholder-[#4a5568] focus:outline-none focus:border-[#f0b90b] transition disabled:opacity-50" />
            <select value={newKeyPurpose} onChange={e => setNewKeyPurpose(e.target.value)} disabled={!canCreateKey}
              className="bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-2 text-xs text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition disabled:opacity-50">
              <option value="bot">Bot</option>
              <option value="vps">VPS</option>
              <option value="asset">Asset</option>
            </select>
            <button type="submit" disabled={creatingKey || !canCreateKey}
              className="flex items-center gap-1.5 bg-[#f0b90b] hover:bg-[#d4a30a] disabled:opacity-60 text-black font-semibold px-3 py-2 rounded-lg text-xs transition">
              <Plus size={12}/>{creatingKey ? '…' : 'Create Key'}
            </button>
          </form>

          {keysLoaded && (
            <div className="space-y-2">
              {apiKeys.length === 0
                ? <p className="text-xs text-[#848e9c] text-center py-3">No API keys yet</p>
                : apiKeys.map(k => (
                  <div key={k.id} className="flex items-center justify-between bg-[#0b0e11] border border-[#2b3139] rounded-lg px-3 py-2.5">
                    <div>
                      <p className="text-xs font-medium text-[#eaecef]">{k.key_name}</p>
                      <p className="text-[10px] text-[#848e9c]">
                        {k.purpose} · {new Date(k.created_at).toLocaleDateString()}
                        {k.last_used_at && ` · Last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${k.is_active ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'bg-[#2b3139] text-[#848e9c]'}`}>
                        {k.is_active ? 'Active' : 'Revoked'}
                      </span>
                      {k.is_active && (
                        <button onClick={() => handleRevokeKey(k.id)} className="p-1.5 text-[#848e9c] hover:text-[#f6465d] hover:bg-[#f6465d]/10 rounded-lg transition">
                          <Trash2 size={11}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* Exchange Connections */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2b3139] bg-[#1a1f25]">
          <Zap size={13} className="text-[#f0b90b]" />
          <span className="text-xs font-semibold text-[#eaecef]">Exchange Connections</span>
        </div>
        <div className="p-4 space-y-4">
          {connections.length > 0 && (
            <div className="space-y-2">
              {connections.map(c => {
                const exch = EXCHANGES.find(e => e.id === c.exchange)
                return (
                  <div key={c.exchange} className="flex items-center justify-between bg-[#0b0e11] border border-[#0ecb81]/20 rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {exch?.logo
                        ? <img src={exch.logo} alt={exch.label} className="w-6 h-6 rounded-full object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                        : <div className="w-6 h-6 rounded-full bg-[#2b3139] flex-shrink-0" />
                      }
                      <div>
                        <p className="text-xs font-medium text-[#eaecef]">{c.label || c.exchange}</p>
                        <p className="text-[10px] text-[#848e9c] font-mono">{c.api_key_masked}</p>
                      </div>
                      <CheckCircle size={12} className="text-[#0ecb81]" />
                    </div>
                    <button onClick={() => handleDisconnect(c.exchange)}
                      className="p-1.5 rounded-lg text-[#848e9c] hover:text-[#f6465d] hover:bg-[#f6465d]/10 transition">
                      <Trash2 size={12}/>
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-[#848e9c] mb-2 block">Select Exchange</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EXCHANGES.map(ex => (
                <button key={ex.id} type="button" onClick={() => setSelExchange(selExchange === ex.id ? '' : ex.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition text-xs font-medium ${selExchange === ex.id ? 'border-[#f0b90b] bg-[#f0b90b]/10 text-[#f0b90b]' : 'border-[#2b3139] text-[#848e9c] hover:border-[#3c4451] hover:text-[#eaecef]'}`}>
                  <img src={ex.logo} alt={ex.label} className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {selExchange && (
            <form onSubmit={handleConnect} className="space-y-3 border-t border-[#2b3139] pt-4">
              <Field label="API Key" required>
                <input value={exchApiKey} onChange={e => setExchApiKey(e.target.value)} required placeholder="API key" className={inp} />
              </Field>
              <Field label="API Secret" required>
                <div className="relative">
                  <input type={showSecret ? 'text' : 'password'} value={exchSecret}
                    onChange={e => setExchSecret(e.target.value)} required placeholder="API secret" className={`${inp} pr-10`} />
                  <button type="button" onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848e9c] hover:text-[#eaecef]">
                    {showSecret ? <EyeOff size={13}/> : <Eye size={13}/>}
                  </button>
                </div>
              </Field>
              {selectedExch?.hasPassphrase && (
                <Field label="Passphrase">
                  <input type="password" value={exchPass} onChange={e => setExchPass(e.target.value)} placeholder="Passphrase" className={inp} />
                </Field>
              )}
              <button type="submit" disabled={connecting}
                className="w-full bg-[#f0b90b] hover:bg-[#d4a30a] disabled:opacity-60 text-black font-semibold py-2.5 rounded-lg text-xs transition">
                {connecting ? 'Connecting…' : `Connect ${selectedExch?.label}`}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Alert Webhooks */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2b3139] bg-[#1a1f25]">
          <MessageCircle size={13} className="text-[#f0b90b]" />
          <span className="text-xs font-semibold text-[#eaecef]">Alert Channels</span>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-[11px] text-[#848e9c]">Connect Telegram and WhatsApp to receive real-time trade alerts and AI signals.</p>

          {/* Telegram */}
          <div className="bg-[#0b0e11] border border-[#2b3139] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Send size={12} className="text-[#229ED9]" />
              <span className="text-xs font-semibold text-[#eaecef]">Telegram Bot</span>
            </div>
            <ol className="text-[10px] text-[#848e9c] space-y-0.5 list-decimal list-inside">
              <li>Create a bot via <span className="text-[#229ED9]">@BotFather</span> and copy the token</li>
              <li>Send <span className="text-[#f0b90b]">/start</span> to your bot in Telegram</li>
              <li>Paste the token below and click <span className="text-[#f0b90b]">Find Chat ID</span></li>
            </ol>
            <Field label="Bot Token">
              <input value={tgToken} onChange={e => { setTgToken(e.target.value); setFoundChatId(null) }}
                placeholder="1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ" className={inp} />
            </Field>
            <div className="flex gap-2">
              <button type="button" onClick={handleFindChatId} disabled={findingChatId || !tgToken.trim()}
                className="flex-1 bg-[#229ED9]/20 hover:bg-[#229ED9]/30 disabled:opacity-50 border border-[#229ED9]/30 text-[#229ED9] font-semibold py-2 rounded-lg text-xs transition">
                {findingChatId ? 'Searching…' : '🔍 Find My Chat ID'}
              </button>
            </div>
            {foundChatId && (
              <div className="flex items-center gap-2 bg-[#0ecb81]/10 border border-[#0ecb81]/20 rounded-lg px-3 py-2">
                <CheckCircle size={12} className="text-[#0ecb81] flex-shrink-0" />
                <span className="text-xs text-[#0ecb81] font-mono">{foundChatId}</span>
                <span className="text-[10px] text-[#848e9c] ml-auto">auto-filled below</span>
              </div>
            )}
            <Field label="Chat ID">
              <input value={tgChatId} onChange={e => setTgChatId(e.target.value)}
                placeholder="-1001234567890 (auto-filled or paste manually)" className={inp} />
            </Field>
            <button onClick={handleSaveWebhook} disabled={savingWebhook}
              className="w-full bg-[#f0b90b] hover:bg-[#d4a30a] disabled:opacity-60 text-black font-semibold py-2.5 rounded-lg text-xs transition">
              {savingWebhook ? 'Saving…' : 'Save Telegram Settings'}
            </button>
          </div>

          {/* WhatsApp */}
          <div className="bg-[#0b0e11] border border-[#2b3139] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle size={12} className="text-[#25D366]" />
                <span className="text-xs font-semibold text-[#eaecef]">WhatsApp (Twilio)</span>
              </div>
              {waVerified && (
                <span className="flex items-center gap-1 text-[10px] text-[#0ecb81] bg-[#0ecb81]/10 border border-[#0ecb81]/20 px-2 py-0.5 rounded-full">
                  <CheckCircle size={9} /> Verified
                </span>
              )}
            </div>

            {waVerified ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-[#0ecb81]/8 border border-[#0ecb81]/15 rounded-lg px-3 py-2.5">
                  <CheckCircle size={13} className="text-[#0ecb81] flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[#eaecef]">{waPhone}</p>
                    <p className="text-[10px] text-[#848e9c]">Connected · Alerts enabled</p>
                  </div>
                </div>
                <button onClick={handleDisconnectWa}
                  className="w-full border border-[#f6465d]/30 hover:bg-[#f6465d]/10 text-[#f6465d] font-medium py-2 rounded-lg text-xs transition">
                  Disconnect WhatsApp
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-[#848e9c]">
                  First join the Twilio sandbox by sending <span className="text-[#f0b90b] font-mono">join &lt;sandbox-code&gt;</span> to{' '}
                  <span className="text-[#25D366]">+1 415 523 8886</span>, then verify your number below.
                </p>
                {!waCodeSent ? (
                  <div className="space-y-2">
                    <Field label="Your WhatsApp Number">
                      <input value={waInput} onChange={e => setWaInput(e.target.value)}
                        placeholder="+1 234 567 8900" className={inp} />
                    </Field>
                    <button onClick={handleSendWaCode} disabled={waSending || !waInput.trim()}
                      className="w-full bg-[#25D366]/20 hover:bg-[#25D366]/30 disabled:opacity-50 border border-[#25D366]/30 text-[#25D366] font-semibold py-2.5 rounded-lg text-xs transition">
                      {waSending ? 'Sending…' : '📲 Send Verification Code'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-[10px] text-[#0ecb81] bg-[#0ecb81]/8 border border-[#0ecb81]/15 rounded-lg px-3 py-2">
                      Code sent to <span className="font-mono">{waInput}</span> — check WhatsApp
                    </div>
                    <Field label="Enter 6-digit Code">
                      <input value={waCode} onChange={e => setWaCode(e.target.value)}
                        placeholder="123456" maxLength={6} className={inp} />
                    </Field>
                    <div className="flex gap-2">
                      <button onClick={handleVerifyWa} disabled={waVerifying || !waCode.trim()}
                        className="flex-1 bg-[#f0b90b] hover:bg-[#d4a30a] disabled:opacity-60 text-black font-semibold py-2.5 rounded-lg text-xs transition">
                        {waVerifying ? 'Verifying…' : 'Verify Code'}
                      </button>
                      <button onClick={() => { setWaCodeSent(false); setWaCode('') }}
                        className="px-3 border border-[#2b3139] text-[#848e9c] hover:text-[#eaecef] rounded-lg text-xs transition">
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


/* ─────────────────────────── SECURITY TAB ─────────────────────────── */
function SecurityTab({ user }: { user: ReturnType<typeof useAuthStore>['user'] }) {
  const [currentPw, setCurrentPw]   = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [savingPw, setSavingPw]     = useState(false)
  const [pin, setPin]               = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [savingPin, setSavingPin]   = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [showDelConfirm, setShowDelConfirm] = useState(false)

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw !== confirmPw) return toast.error('Passwords do not match')
    if (newPw.length < 8) return toast.error('Password must be at least 8 characters')
    setSavingPw(true)
    try {
      await changePassword(currentPw, newPw)
      toast.success('Password changed successfully')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to change password')
    } finally { setSavingPw(false) }
  }

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin !== confirmPin) return toast.error('PINs do not match')
    if (!/^\d{4,6}$/.test(pin)) return toast.error('PIN must be 4–6 digits')
    setSavingPin(true)
    try {
      await setTransferPin(pin)
      toast.success('Transfer PIN set')
      setPin(''); setConfirmPin('')
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to set PIN')
    } finally { setSavingPin(false) }
  }

  const handleRequestDelete = async () => {
    setDeleting(true)
    try {
      await requestDeleteAccount()
      toast.success('Deletion request submitted. Admin will review within 24–48 hours.')
      setShowDelConfirm(false)
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to submit request')
    } finally { setDeleting(false) }
  }

  return (
    <div className="space-y-4">

      {/* Change Password */}
      <form onSubmit={handleChangePw} className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2b3139] bg-[#1a1f25]">
          <Lock size={13} className="text-[#f0b90b]" />
          <span className="text-xs font-semibold text-[#eaecef]">Change Password</span>
        </div>
        <div className="p-4 space-y-3">
          <Field label="Current Password">
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={currentPw}
                onChange={e => setCurrentPw(e.target.value)} required placeholder="••••••••" className={`${inp} pr-10`} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848e9c] hover:text-[#eaecef]">
                {showPw ? <EyeOff size={13}/> : <Eye size={13}/>}
              </button>
            </div>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="New Password">
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required placeholder="Min 8 characters" className={inp} />
            </Field>
            <Field label="Confirm Password">
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required placeholder="Repeat new password" className={inp} />
            </Field>
          </div>
          <button type="submit" disabled={savingPw}
            className="bg-[#f0b90b] hover:bg-[#d4a30a] disabled:opacity-60 text-black font-semibold px-5 py-2.5 rounded-lg text-xs transition">
            {savingPw ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </form>

      {/* Transfer PIN */}
      <form onSubmit={handleSetPin} className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2b3139] bg-[#1a1f25]">
          <Shield size={13} className="text-[#f0b90b]" />
          <span className="text-xs font-semibold text-[#eaecef]">Transfer PIN</span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-[11px] text-[#848e9c]">4–6 digit PIN required to authorise wallet transfers and withdrawals.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="PIN (4–6 digits)">
              <input type="password" inputMode="numeric" maxLength={6} value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" className={inp} />
            </Field>
            <Field label="Confirm PIN">
              <input type="password" inputMode="numeric" maxLength={6} value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" className={inp} />
            </Field>
          </div>
          <button type="submit" disabled={savingPin}
            className="bg-[#f0b90b] hover:bg-[#d4a30a] disabled:opacity-60 text-black font-semibold px-5 py-2.5 rounded-lg text-xs transition">
            {savingPin ? 'Setting…' : 'Set Transfer PIN'}
          </button>
        </div>
      </form>

      {/* Delete Account */}
      <div className="bg-[#f6465d]/5 border border-[#f6465d]/20 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#f6465d]/10">
          <LogOut size={13} className="text-[#f6465d]" />
          <span className="text-xs font-semibold text-[#f6465d]">Delete My Account</span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-[11px] text-[#848e9c]">
            Submitting this request notifies the admin. Your account and data will be permanently deleted after approval (24–48h). Any remaining balance will be processed per our policy.
          </p>
          {!showDelConfirm ? (
            <button onClick={() => setShowDelConfirm(true)}
              className="text-xs bg-[#f6465d]/10 hover:bg-[#f6465d]/20 text-[#f6465d] border border-[#f6465d]/30 font-semibold px-4 py-2.5 rounded-lg transition">
              Request Account Deletion
            </button>
          ) : (
            <div className="bg-[#0b0e11] border border-[#f6465d]/30 rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-[#eaecef]">Are you sure? This cannot be undone.</p>
              <p className="text-[11px] text-[#848e9c]">Account: <span className="text-[#eaecef]">{user?.email}</span></p>
              <div className="flex gap-2">
                <button onClick={handleRequestDelete} disabled={deleting}
                  className="flex-1 bg-[#f6465d] hover:bg-[#d93d51] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-xs transition">
                  {deleting ? 'Submitting…' : 'Yes, Submit Request'}
                </button>
                <button onClick={() => setShowDelConfirm(false)}
                  className="flex-1 bg-[#2b3139] hover:bg-[#3c4451] text-[#eaecef] font-semibold py-2.5 rounded-lg text-xs transition">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
