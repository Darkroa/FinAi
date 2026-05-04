import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Shield, Bell, Key, User } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState({ email: true, trades: true, news: false })

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold text-[#eaecef]">Settings</h1>

      {/* Profile */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <User size={16} className="text-[#f0b90b]" />
          <h2 className="text-sm font-semibold text-[#eaecef]">Profile</h2>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-[#f0b90b] flex items-center justify-center text-2xl font-bold text-black">
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className="font-medium text-[#eaecef]">{user?.email ?? 'user@example.com'}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${user?.is_admin ? 'bg-[#f0b90b]/10 text-[#f0b90b]' : 'bg-[#0ecb81]/10 text-[#0ecb81]'}`}>
              {user?.is_admin ? 'Admin' : 'Member'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Email</label>
            <input defaultValue={user?.email} className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition" />
          </div>
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Username</label>
            <input placeholder="Set username" className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition" />
          </div>
        </div>
        <button onClick={() => toast.success('Profile updated')} className="mt-4 bg-[#f0b90b] hover:bg-[#d4a30a] text-black text-sm font-semibold px-4 py-2 rounded-xl transition">Save Changes</button>
      </div>

      {/* Security */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <Shield size={16} className="text-[#f0b90b]" />
          <h2 className="text-sm font-semibold text-[#eaecef]">Security</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Current Password</label>
            <input type="password" placeholder="••••••••" className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#848e9c] mb-1.5 block">New Password</label>
              <input type="password" placeholder="••••••••" className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition" />
            </div>
            <div>
              <label className="text-xs text-[#848e9c] mb-1.5 block">Confirm Password</label>
              <input type="password" placeholder="••••••••" className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition" />
            </div>
          </div>
          <button onClick={() => toast.success('Password changed')} className="bg-[#f0b90b] hover:bg-[#d4a30a] text-black text-sm font-semibold px-4 py-2 rounded-xl transition">Update Password</button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <Bell size={16} className="text-[#f0b90b]" />
          <h2 className="text-sm font-semibold text-[#eaecef]">Notifications</h2>
        </div>
        <div className="space-y-4">
          {([['email', 'Email notifications'], ['trades', 'Trade alerts'], ['news', 'Market news']] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-[#2b3139]/50 last:border-0">
              <div>
                <p className="text-sm text-[#eaecef]">{label}</p>
                <p className="text-xs text-[#848e9c]">Receive {label.toLowerCase()} via email</p>
              </div>
              <button
                onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                className={`w-10 h-5 rounded-full transition-colors relative ${notifications[key] ? 'bg-[#f0b90b]' : 'bg-[#2b3139]'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${notifications[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <Key size={16} className="text-[#f0b90b]" />
          <h2 className="text-sm font-semibold text-[#eaecef]">API Keys</h2>
        </div>
        <p className="text-sm text-[#848e9c] mb-4">Create API keys to access FinAi programmatically.</p>
        <button onClick={() => toast('API key generation coming soon')} className="bg-[#2b3139] hover:bg-[#3c4451] text-[#eaecef] text-sm font-medium px-4 py-2 rounded-xl transition">Generate API Key</button>
      </div>
    </div>
  )
}
