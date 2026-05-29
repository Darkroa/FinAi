import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { updateNotificationPreferences } from '../lib/api';
import toast from 'react-hot-toast';
import { Bell, Mail, MessageCircle, Send, Zap, Shield, Globe, Info, Check } from 'lucide-react';

interface NotifPrefs {
  email: boolean;
  whatsapp: boolean;
  telegram: boolean;
}

interface AppPrefs {
  confirm_before_trade: boolean;
  sound_alerts: boolean;
  compact_numbers: boolean;
}

const APP_PREFS_KEY = 'finai-app-prefs';

function loadAppPrefs(): AppPrefs {
  try {
    const raw = localStorage.getItem(APP_PREFS_KEY);
    if (raw) return JSON.parse(raw) as AppPrefs;
  } catch { /* ignore */ }
  return { confirm_before_trade: true, sound_alerts: false, compact_numbers: false };
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();

  const [notifs, setNotifs] = useState<NotifPrefs>({
    email: true,
    whatsapp: false,
    telegram: false,
  });
  const [saving, setSaving] = useState(false);

  const [appPrefs, setAppPrefs] = useState<AppPrefs>(loadAppPrefs);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const [language, setLanguage]   = useState(() => localStorage.getItem('finai-language') || 'en-US');
  const [currency, setCurrency]   = useState(() => localStorage.getItem('finai-currency') || 'USD');
  const [localeSaved, setLocaleSaved] = useState(false);

  // Load notification preferences from user store
  useEffect(() => {
    if (user?.notification_preferences) {
      setNotifs(user.notification_preferences as NotifPrefs);
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
      if (res.data) setUser(res.data);
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof NotifPrefs) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAppPref = (key: keyof AppPrefs) => {
    setAppPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(APP_PREFS_KEY, JSON.stringify(next));
      return next;
    });
    setPrefsSaved(false);
  };

  const saveAppPrefs = () => {
    localStorage.setItem(APP_PREFS_KEY, JSON.stringify(appPrefs));
    setPrefsSaved(true);
    toast.success('App preferences saved');
    setTimeout(() => setPrefsSaved(false), 2000);
  };

  const saveLocale = () => {
    localStorage.setItem('finai-language', language);
    localStorage.setItem('finai-currency', currency);
    setLocaleSaved(true);
    toast.success('Language & region saved');
    setTimeout(() => setLocaleSaved(false), 2000);
  };

  const appPrefItems: { key: keyof AppPrefs; label: string; desc: string }[] = [
    { key: 'confirm_before_trade', label: 'Confirm before trade orders',  desc: 'Show a confirmation dialog before placing orders' },
    { key: 'sound_alerts',         label: 'Sound alerts',                  desc: 'Play audio when a trade executes or a bot signals' },
    { key: 'compact_numbers',      label: 'Compact number format',         desc: 'Display large numbers as 1.2M instead of 1,200,000' },
  ];

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
            <p className="text-[10px] text-[#848e9c]">Trading and display settings — saved to this device</p>
          </div>
        </div>
        <div className="divide-y divide-[#2b3139]/60">
          {appPrefItems.map(item => (
            <div key={item.key} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-[#eaecef]">{item.label}</p>
                <p className="text-xs text-[#848e9c] mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => toggleAppPref(item.key)}
                className={`relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${
                  appPrefs[item.key] ? 'bg-[#0ecb81]' : 'bg-[#2b3139]'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    appPrefs[item.key] ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-[#2b3139] bg-[#0b0e11]/30">
          <button
            onClick={saveAppPrefs}
            className="flex items-center gap-2 bg-[#0ecb81] hover:bg-[#0aaf6f] text-black font-semibold px-6 py-2.5 rounded-xl text-sm transition w-full sm:w-auto"
          >
            {prefsSaved ? <><Check size={14} /> Saved!</> : 'Save App Preferences'}
          </button>
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
            <p className="text-[10px] text-[#848e9c]">Locale and display preferences — saved to this device</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Language</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Currency display</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition"
            >
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="BTC">BTC — Bitcoin</option>
            </select>
          </div>
          <button
            onClick={saveLocale}
            className="flex items-center gap-2 bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition"
          >
            {localeSaved ? <><Check size={14} /> Saved!</> : 'Save'}
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
            <span className="text-[#f0b90b] font-medium">Profile</span> page under the Security tab.
          </p>
        </div>
      </div>
    </div>
  );
}
