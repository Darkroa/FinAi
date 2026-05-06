import { useState, useEffect, useCallback } from 'react'
import { listAlerts, createAlert, deleteAlert, toggleAlert } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, ToggleLeft, ToggleRight, RefreshCw, AlertCircle } from 'lucide-react'

interface PriceAlert {
  id: number
  symbol: string
  target_price: number
  direction: 'above' | 'below'
  is_active: boolean
  notify_browser: boolean
  notify_telegram: boolean
  notify_whatsapp: boolean
  triggered_at: string | null
  created_at: string
}

const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT']

export default function AlertsPage() {
  const { user } = useAuthStore()
  const [alerts, setAlerts]     = useState<PriceAlert[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    symbol: 'BTC/USDT',
    target_price: '',
    direction: 'above' as 'above' | 'below',
    notify_browser: true,
    notify_telegram: false,
    notify_whatsapp: false,
  })
  const [submitting, setSubmitting] = useState(false)

  const prefs = user ? (user as unknown as { notification_preferences?: Record<string, unknown> })?.notification_preferences ?? {} : {}
  const hasTelegram = !!(prefs as Record<string, unknown>)?.telegram_chat_id
  const hasWhatsapp = !!(prefs as Record<string, unknown>)?.whatsapp_verified

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await listAlerts()
      setAlerts(res.data ?? [])
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAlerts(); const id = setInterval(fetchAlerts, 30000); return () => clearInterval(id) }, [fetchAlerts])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(form.target_price)
    if (!price || price <= 0) return toast.error('Enter a valid target price')
    setSubmitting(true)
    try {
      await createAlert({
        symbol: form.symbol,
        target_price: price,
        direction: form.direction,
        notify_browser: form.notify_browser,
        notify_telegram: form.notify_telegram,
        notify_whatsapp: form.notify_whatsapp,
      })
      toast.success('Price alert created')
      setShowForm(false)
      setForm(f => ({ ...f, target_price: '' }))
      fetchAlerts()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || 'Failed to create alert')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteAlert(id)
      setAlerts(a => a.filter(x => x.id !== id))
      toast.success('Alert deleted')
    } catch { toast.error('Failed to delete alert') }
  }

  const handleToggle = async (id: number) => {
    try {
      const res = await toggleAlert(id)
      setAlerts(a => a.map(x => x.id === id ? { ...x, is_active: res.data.is_active } : x))
    } catch { toast.error('Failed to toggle alert') }
  }

  const active   = alerts.filter(a => a.is_active && !a.triggered_at)
  const triggered = alerts.filter(a => a.triggered_at)
  const paused   = alerts.filter(a => !a.is_active && !a.triggered_at)

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#eaecef]">Price Alerts</h1>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#f0b90b]/10 text-[#f0b90b] border border-[#f0b90b]/20 font-medium">
            {active.length} active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAlerts}
            className="flex items-center gap-1.5 text-xs text-[#848e9c] hover:text-[#eaecef] transition">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 text-xs bg-[#f0b90b] hover:bg-[#d9a60b] text-black font-bold px-3 py-2 rounded-xl transition">
            <Plus size={13} /> New Alert
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 bg-[#f0b90b]/5 border border-[#f0b90b]/15 rounded-xl px-4 py-3">
        <Bell size={13} className="text-[#f0b90b] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#848e9c]">
          Alerts are checked every 30 seconds against live prices. Browser notifications fire instantly.
          Connect <span className="text-[#eaecef]">Telegram</span> or <span className="text-[#eaecef]">WhatsApp</span> in{' '}
          <a href="/app/profile" className="text-[#f0b90b] underline">Profile → Security</a> to receive push notifications.
        </p>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#161a1e] border border-[#f0b90b]/20 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#eaecef] flex items-center gap-2">
            <Bell size={14} className="text-[#f0b90b]" /> Create Price Alert
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Symbol */}
            <div>
              <label className="text-xs text-[#848e9c] mb-1.5 block">Asset</label>
              <select value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
                className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition">
                {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Target price */}
            <div>
              <label className="text-xs text-[#848e9c] mb-1.5 block">Target Price (USDT)</label>
              <input type="number" step="any" min="0" placeholder="e.g. 100000"
                value={form.target_price}
                onChange={e => setForm(f => ({ ...f, target_price: e.target.value }))}
                className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-xl px-3 py-2.5 text-sm font-mono text-[#eaecef] focus:outline-none focus:border-[#f0b90b] transition" />
            </div>
          </div>

          {/* Direction */}
          <div>
            <label className="text-xs text-[#848e9c] mb-1.5 block">Alert when price goes</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setForm(f => ({ ...f, direction: 'above' }))}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition ${form.direction === 'above' ? 'bg-[#0ecb81]/10 border-[#0ecb81]/40 text-[#0ecb81]' : 'border-[#2b3139] text-[#848e9c] hover:text-[#eaecef]'}`}>
                <TrendingUp size={14} /> Above target
              </button>
              <button type="button" onClick={() => setForm(f => ({ ...f, direction: 'below' }))}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition ${form.direction === 'below' ? 'bg-[#f6465d]/10 border-[#f6465d]/40 text-[#f6465d]' : 'border-[#2b3139] text-[#848e9c] hover:text-[#eaecef]'}`}>
                <TrendingDown size={14} /> Below target
              </button>
            </div>
          </div>

          {/* Notification channels */}
          <div>
            <label className="text-xs text-[#848e9c] mb-2 block">Notify via</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'notify_browser', label: 'Browser', always: true },
                { key: 'notify_telegram', label: 'Telegram', always: false, available: hasTelegram },
                { key: 'notify_whatsapp', label: 'WhatsApp', always: false, available: hasWhatsapp },
              ].map(({ key, label, always, available }) => (
                <button key={key} type="button"
                  disabled={!always && !available}
                  onClick={() => setForm(f => ({ ...f, [key]: !f[key as keyof typeof f] }))}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                    form[key as keyof typeof form]
                      ? 'bg-[#f0b90b]/10 border-[#f0b90b]/40 text-[#f0b90b]'
                      : !always && !available
                      ? 'border-[#2b3139] text-[#4a5568] opacity-50 cursor-not-allowed'
                      : 'border-[#2b3139] text-[#848e9c] hover:text-[#eaecef]'
                  }`}>
                  <Bell size={11} /> {label}
                  {!always && !available && <span className="text-[#4a5568] ml-1">(not set up)</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={submitting}
              className="flex-1 bg-[#f0b90b] hover:bg-[#d9a60b] disabled:opacity-60 text-black font-bold py-2.5 rounded-xl text-sm transition">
              {submitting ? 'Creating...' : 'Create Alert'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl border border-[#2b3139] text-[#848e9c] hover:text-[#eaecef] text-sm transition">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Active alerts */}
      {active.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#848e9c] uppercase tracking-widest mb-2">Active ({active.length})</p>
          <div className="space-y-2">
            {active.map(alert => (
              <AlertRow key={alert.id} alert={alert} onDelete={handleDelete} onToggle={handleToggle} />
            ))}
          </div>
        </div>
      )}

      {/* Paused */}
      {paused.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#848e9c] uppercase tracking-widest mb-2">Paused ({paused.length})</p>
          <div className="space-y-2">
            {paused.map(alert => (
              <AlertRow key={alert.id} alert={alert} onDelete={handleDelete} onToggle={handleToggle} />
            ))}
          </div>
        </div>
      )}

      {/* Triggered */}
      {triggered.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#848e9c] uppercase tracking-widest mb-2">Triggered ({triggered.length})</p>
          <div className="space-y-2">
            {triggered.map(alert => (
              <AlertRow key={alert.id} alert={alert} onDelete={handleDelete} onToggle={handleToggle} triggered />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {alerts.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-16 h-16 rounded-full bg-[#2b3139] flex items-center justify-center">
            <Bell size={24} className="text-[#4a5568]" />
          </div>
          <p className="text-sm text-[#848e9c]">No price alerts set up yet</p>
          <p className="text-xs text-[#4a5568]">Click "New Alert" to get notified when prices hit your targets</p>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs bg-[#f0b90b] hover:bg-[#d9a60b] text-black font-bold px-4 py-2 rounded-xl mt-1 transition">
            <Plus size={12} /> Create your first alert
          </button>
        </div>
      )}
    </div>
  )
}

function AlertRow({ alert, onDelete, onToggle, triggered = false }: {
  alert: PriceAlert
  onDelete: (id: number) => void
  onToggle: (id: number) => void
  triggered?: boolean
}) {
  return (
    <div className={`bg-[#161a1e] border rounded-xl px-4 py-3 flex items-center gap-3 ${
      triggered ? 'border-[#2b3139] opacity-70' : alert.is_active ? 'border-[#2b3139] hover:border-[#3c4451]' : 'border-[#2b3139] opacity-60'
    } transition`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        triggered ? 'bg-[#f0b90b]/10' : alert.direction === 'above' ? 'bg-[#0ecb81]/10' : 'bg-[#f6465d]/10'
      }`}>
        {triggered ? <AlertCircle size={14} className="text-[#f0b90b]" /> :
          alert.direction === 'above'
            ? <TrendingUp size={14} className="text-[#0ecb81]" />
            : <TrendingDown size={14} className="text-[#f6465d]" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[#eaecef] font-mono">{alert.symbol}</span>
          <span className={`text-xs font-medium ${alert.direction === 'above' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            {alert.direction === 'above' ? '↑' : '↓'} ${alert.target_price.toLocaleString()}
          </span>
          {triggered && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0b90b]/10 text-[#f0b90b] font-medium">
              Triggered {alert.triggered_at ? new Date(alert.triggered_at).toLocaleDateString() : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {alert.notify_browser && <span className="text-[10px] text-[#4a5568]">Browser</span>}
          {alert.notify_telegram && <span className="text-[10px] text-[#4a5568]">· Telegram</span>}
          {alert.notify_whatsapp && <span className="text-[10px] text-[#4a5568]">· WhatsApp</span>}
          <span className="text-[10px] text-[#4a5568]">· {new Date(alert.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!triggered && (
          <button onClick={() => onToggle(alert.id)}
            className="text-[#848e9c] hover:text-[#eaecef] transition p-1" title={alert.is_active ? 'Pause' : 'Resume'}>
            {alert.is_active ? <ToggleRight size={18} className="text-[#0ecb81]" /> : <ToggleLeft size={18} />}
          </button>
        )}
        <button onClick={() => onDelete(alert.id)}
          className="text-[#848e9c] hover:text-[#f6465d] transition p-1" title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
