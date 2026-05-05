import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import {
  updateProfile, uploadPhoto, sendVerifyEmail, verifyEmail,
  submitKYC, getMe
} from '../lib/api'
import toast from 'react-hot-toast'
import {
  User, Camera, Shield, CheckCircle, Clock, XCircle,
  Mail, Lock, Upload, Star
} from 'lucide-react'

const TIERS = [
  { tier: 0, label: 'Unverified', color: 'text-[#848e9c]', bg: 'bg-[#2b3139]', limits: 'No withdrawals · No API keys' },
  { tier: 1, label: 'Tier 1', color: 'text-[#f0b90b]', bg: 'bg-[#f0b90b]/10', limits: '$500/day withdraw · 1 API key' },
  { tier: 2, label: 'Tier 2', color: 'text-[#0ecb81]', bg: 'bg-[#0ecb81]/10', limits: '$5,000/day withdraw · 5 API keys' },
  { tier: 3, label: 'Tier 3', color: 'text-[#a78bfa]', bg: 'bg-[#a78bfa]/10', limits: 'Unlimited · Priority support' },
]

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    middle_name: user?.middle_name || '',
    last_name: user?.last_name || '',
    username: user?.username || '',
    phone: user?.phone || '',
    dob: user?.dob || '',
    sex: user?.sex || '',
    address: user?.address || '',
    country: user?.country || '',
  })
  const [saving, setSaving] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [showVerifyInput, setShowVerifyInput] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const tier = TIERS[user?.account_tier ?? 0]

  const kycStatusBadge = () => {
    switch (user?.kyc_status) {
      case 'approved': return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#0ecb81]/10 text-[#0ecb81]"><CheckCircle size={10} /> Approved</span>
      case 'submitted': return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#f0b90b]/10 text-[#f0b90b]"><Clock size={10} /> Under Review</span>
      case 'rejected': return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#f6465d]/10 text-[#f6465d]"><XCircle size={10} /> Rejected</span>
      default: return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#2b3139] text-[#848e9c]"><Clock size={10} /> Pending</span>
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (user?.profile_locked) return toast.error('Profile is locked by admin')
    setSaving(true)
    try {
      const res = await updateProfile(form as Record<string, unknown>)
      setUser(res.data)
      toast.success('Profile updated')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      toast.error(msg || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    try {
      const res = await uploadPhoto(file)
      const meRes = await getMe()
      setUser(meRes.data)
      toast.success('Photo updated')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setPhotoLoading(false)
    }
  }

  const handleSendCode = async () => {
    setSendingCode(true)
    try {
      const res = await sendVerifyEmail()
      setDevCode(res.data.dev_code || null)
      setShowVerifyInput(true)
      toast.success('Verification code sent to your email')
    } catch {
      toast.error('Failed to send code')
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerify = async () => {
    if (!verifyCode.trim()) return
    setVerifying(true)
    try {
      await verifyEmail(verifyCode.trim())
      const res = await getMe()
      setUser(res.data)
      toast.success('Email verified!')
      setShowVerifyInput(false)
    } catch {
      toast.error('Invalid or expired code')
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmitKYC = async () => {
    try {
      await submitKYC()
      const res = await getMe()
      setUser(res.data)
      toast.success('KYC submitted for admin review')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
      toast.error(msg || 'Failed to submit KYC')
    }
  }

  const inp = 'w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] placeholder-[#4a5568] focus:outline-none focus:border-[#f0b90b] transition disabled:opacity-50'

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-xl font-bold text-[#eaecef]">My Profile</h1>

      {/* Profile photo + tier banner */}
      <div className="bg-gradient-to-br from-[#1e2329] to-[#161a1e] border border-[#2b3139] rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-[#f0b90b]/10 border-2 border-[#f0b90b]/30 overflow-hidden flex items-center justify-center">
              {user?.profile_photo ? (
                <img src={user.profile_photo} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-[#f0b90b]">
                  {user?.email?.[0]?.toUpperCase() ?? 'U'}
                </span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={photoLoading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#f0b90b] flex items-center justify-center shadow-lg hover:bg-[#d4a30a] transition"
            >
              {photoLoading ? <div className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" /> : <Camera size={12} className="text-black" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-bold text-[#eaecef]">{user?.full_name || user?.email}</h2>
            <p className="text-[#848e9c] text-sm">@{user?.username || 'no username set'}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${tier.bg} ${tier.color}`}>
                <Star size={10} className="inline mr-1" />{tier.label}
              </span>
              {kycStatusBadge()}
              {user?.is_mail_verified ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#0ecb81]/10 text-[#0ecb81]"><CheckCircle size={10} className="inline mr-1" />Email verified</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#f6465d]/10 text-[#f6465d]">Email unverified</span>
              )}
              {user?.is_admin && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#f0b90b]/10 text-[#f0b90b]">Admin</span>
              )}
            </div>
            <p className="text-xs text-[#848e9c] mt-1">{tier.limits}</p>
          </div>

          {/* Email verify */}
          {!user?.is_mail_verified && (
            <div className="flex-shrink-0">
              {!showVerifyInput ? (
                <button onClick={handleSendCode} disabled={sendingCode}
                  className="flex items-center gap-1.5 text-xs bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 text-[#f0b90b] px-3 py-2 rounded-xl transition">
                  <Mail size={12} /> Verify Email
                </button>
              ) : (
                <div className="space-y-2">
                  {devCode && <p className="text-[10px] text-[#848e9c]">Dev code: <span className="text-[#f0b90b]">{devCode}</span></p>}
                  <input value={verifyCode} onChange={e => setVerifyCode(e.target.value)}
                    placeholder="6-digit code" maxLength={6}
                    className="w-32 bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2 text-sm text-[#eaecef] text-center focus:outline-none focus:border-[#f0b90b]" />
                  <button onClick={handleVerify} disabled={verifying}
                    className="w-full text-xs bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-semibold py-2 rounded-xl transition">
                    {verifying ? '...' : 'Verify'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KYC submit */}
      {user?.kyc_status === 'pending' && (
        <div className="bg-[#f0b90b]/5 border border-[#f0b90b]/20 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#eaecef]">Complete KYC to unlock higher tiers</p>
            <p className="text-xs text-[#848e9c]">Fill in all profile fields below, then submit for admin review.</p>
          </div>
          <button onClick={handleSubmitKYC}
            className="text-xs bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-semibold px-4 py-2 rounded-xl transition flex-shrink-0">
            Submit KYC
          </button>
        </div>
      )}

      {/* Profile locked notice */}
      {user?.profile_locked && (
        <div className="flex items-center gap-2 bg-[#f6465d]/5 border border-[#f6465d]/20 rounded-xl px-4 py-3">
          <Lock size={14} className="text-[#f6465d] flex-shrink-0" />
          <p className="text-xs text-[#848e9c]">Your profile is locked by admin. Contact support to request changes.</p>
        </div>
      )}

      {/* Profile form */}
      <form onSubmit={handleSave} className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <User size={15} className="text-[#f0b90b]" />
          <h2 className="text-sm font-semibold text-[#eaecef]">Personal Information</h2>
          <span className="text-xs text-[#848e9c] ml-auto">
            {user?.profile_locked ? 'Locked' : 'Once saved, only admin can edit'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">First Name *</label>
            <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
              disabled={!!user?.profile_locked} placeholder="First name" className={inp} />
          </div>
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Middle Name</label>
            <input value={form.middle_name} onChange={e => setForm(f => ({ ...f, middle_name: e.target.value }))}
              disabled={!!user?.profile_locked} placeholder="Middle name (optional)" className={inp} />
          </div>
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Last Name *</label>
            <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
              disabled={!!user?.profile_locked} placeholder="Last name" className={inp} />
          </div>
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Username</label>
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              disabled={!!user?.profile_locked} placeholder="@username" className={inp} />
          </div>
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Email</label>
            <input value={user?.email || ''} disabled className={inp} />
          </div>
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Phone Number *</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              disabled={!!user?.profile_locked} placeholder="+1 234 567 8900" className={inp} />
          </div>
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Date of Birth *</label>
            <input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
              disabled={!!user?.profile_locked} className={inp} />
          </div>
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Sex</label>
            <select value={form.sex} onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}
              disabled={!!user?.profile_locked}
              className={inp}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Country *</label>
            <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              disabled={!!user?.profile_locked} placeholder="Country" className={inp} />
          </div>
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Address</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              disabled={!!user?.profile_locked} placeholder="Street address" className={inp} />
          </div>
        </div>

        {!user?.profile_locked && (
          <button type="submit" disabled={saving}
            className="mt-5 bg-[#f0b90b] hover:bg-[#d4a30a] disabled:opacity-60 text-black font-semibold px-6 py-2.5 rounded-xl text-sm transition">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        )}
      </form>

      {/* Account tier breakdown */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={15} className="text-[#f0b90b]" />
          <h2 className="text-sm font-semibold text-[#eaecef]">Account Tiers</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TIERS.map(t => (
            <div key={t.tier} className={`rounded-xl p-3 border ${(user?.account_tier ?? 0) >= t.tier ? 'border-[#f0b90b]/20' : 'border-[#2b3139]'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold ${t.color}`}>{t.label}</span>
                {(user?.account_tier ?? 0) >= t.tier && t.tier > 0 && (
                  <CheckCircle size={11} className="text-[#0ecb81]" />
                )}
              </div>
              <p className="text-[10px] text-[#848e9c]">{t.limits}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
