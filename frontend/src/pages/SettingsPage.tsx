import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { updateNotificationPreferences } from '../lib/api';
import toast from 'react-hot-toast';
import { Bell, Mail, MessageCircle, Send, Zap, Shield, Globe, Info } from 'lucide-react';

interface NotifPrefs {
  email: boolean;
  whatsapp: boolean;
  telegram: boolean;
}

// Extended user type for this page (safe approach)
interface UserWithNotifs {
  notification_preferences?: NotifPrefs;
  // Add other user properties if needed
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();

  const [notifs, setNotifs] = useState<NotifPrefs>({
    email: true,
    whatsapp: false,
    telegram: false,
  });
  const [saving, setSaving] = useState(false);

  // Load preferences from user when available
  useEffect(() => {
    if (user?.notification_preferences) {
      setNotifs(user.notification_preferences);
    }
  }, [user]);

  const notifItems = [
    {
      key: 'email' as const,
      label: 'Email Notifications',
      desc: 'Trade alerts, account updates, and security events',
      icon: Mail,
      color: 'text-[#f0b90b]',
      bg: 'bg-[#f0b90b]/10',
    },
    {
      key: 'whatsapp' as const,
      label: 'WhatsApp Alerts',
      desc: 'Real-time trade signals and bot status via WhatsApp',
      icon: MessageCircle,
      color: 'text-[#0ecb81]',
      bg: 'bg-[#0ecb81]/10',
    },
    {
      key: 'telegram' as const,
      label: 'Telegram Alerts',
      desc: 'Market events and trade notifications via Telegram',
      icon: Send,
      color: 'text-[#3b82f6]',
      bg: 'bg-blue-500/10',
    },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateNotificationPreferences(notifs);

      // Update store with new preferences
      if (res.data) {
        setUser(res.data);
      }

      toast.success('Notification preferences saved successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof NotifPrefs) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold text-[#eaecef]">Settings</h1>

      {/* Notifications Section */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#2b3139]">
          <div className="w-7 h-7 rounded-lg bg-[#f0b90b]/10 flex items-center justify-center">
            <Bell size={14} className="text-[#f0b90b]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#eaecef]">Notifications</h2>
            <p className="text-[10px] text-[#848e9c]">Choose where to receive alerts</p>
          </div>
        </div>

        <div className="divide-y divide-[#2b3139]/60">
          {notifItems.map(({ key, label, desc, icon: Icon, color, bg }) => (
            <div key={key} className="flex items-center gap-4 px-5 py-4">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={16} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#eaecef]">{label}</p>
                <p className="text-xs text-[#848e9c] leading-relaxed mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${
                  notifs[key] ? 'bg-[#f0b90b]' : 'bg-[#2b3139]'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    notifs[key] ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-[#2b3139] bg-[#0b0e11]/30">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#f0b90b] hover:bg-[#d4a30a] disabled:opacity-60 text-black font-semibold px-6 py-2.5 rounded-xl text-sm transition w-full sm:w-auto"
          >
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* App Preferences */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#2b3139]">
          <div className="w-7 h-7 rounded-lg bg-[#0ecb81]/10 flex items-center justify-center">
            <Zap size={14} className="text-[#0ecb81]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#eaecef]">App Preferences</h2>
            <p className="text-[10px] text-[#848e9c]">Trading and display settings</p>
          </div>
        </div>
        <div className="divide-y divide-[#2b3139]/60">
          {[
            { label: 'Confirm before trade orders', desc: 'Show a confirmation dialog before placing orders' },
            { label: 'Sound alerts', desc: 'Play audio when a trade executes or a bot signals' },
            { label: 'Compact number format', desc: 'Display large numbers as 1.2M instead of 1,200,000' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-[#eaecef]">{item.label}</p>
                <p className="text-xs text-[#848e9c] mt-0.5">{item.desc}</p>
              </div>
              <button className="relative w-11 h-6 rounded-full bg-[#2b3139] transition-all flex-shrink-0">
                <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Language & Region */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#2b3139]">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Globe size={14} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#eaecef]">Language & Region</h2>
            <p className="text-[10px] text-[#848e9c]">Locale and display preferences</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Language</label>
            <select className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition">
              <option>English (US)</option>
              <option>English (UK)</option>
              <option>Français</option>
              <option>Español</option>
              <option>Deutsch</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Currency display</label>
            <select className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition">
              <option>USD — US Dollar</option>
              <option>EUR — Euro</option>
              <option>GBP — British Pound</option>
              <option>BTC — Bitcoin</option>
            </select>
          </div>
          <button
            onClick={() => toast.success('Preferences saved')}
            className="bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition"
          >
            Save
          </button>
        </div>
      </div>

      {/* Security Note */}
      <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#2b3139]">
          <div className="w-7 h-7 rounded-lg bg-[#f6465d]/10 flex items-center justify-center">
            <Shield size={14} className="text-[#f6465d]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#eaecef]">Security & Account</h2>
            <p className="text-[10px] text-[#848e9c]">Password, PIN, and account deletion</p>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center gap-3">
          <Info size={14} className="text-[#848e9c] flex-shrink-0" />
          <p className="text-xs text-[#848e9c] leading-relaxed">
            Security settings including password change, Transfer PIN, exchange connections, and API keys are managed in your{' '}
            <span className="text-[#f0b90b] font-medium">Profile</span> page.
          </p>
        </div>
      </div>
    </div>
  );
}