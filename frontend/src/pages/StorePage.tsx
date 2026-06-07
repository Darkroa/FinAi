import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useLanguage } from '../contexts/LanguageContext'
import { formatCurrency } from '../lib/i18n'
import { getVpsPlans, getAssetProducts, buyAsset, rentVps, getMe } from '../lib/api'
import toast from 'react-hot-toast'
import { Server, ShoppingBag, RefreshCw } from 'lucide-react'

interface VpsPlan { id: number; name: string; price: number; specs: string }
interface AssetProduct { id: number; name: string; price: number; icon: string }

export default function StorePage() {
  const { user, setUser } = useAuthStore()
  const { currency } = useLanguage()
  const [vpsPlans, setVpsPlans] = useState<VpsPlan[]>([])
  const [assetProducts, setAssetProducts] = useState<AssetProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<number | null>(null)
  const [rentingId, setRentingId] = useState<number | null>(null)

  const balance = user?.balance_usdt ?? 0

  useEffect(() => {
    Promise.all([getVpsPlans(), getAssetProducts()])
      .then(([v, a]) => {
        if (Array.isArray(v.data) && v.data.length > 0) setVpsPlans(v.data)
        if (Array.isArray(a.data) && a.data.length > 0) setAssetProducts(a.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleBuyAsset = async (asset: AssetProduct) => {
    if (balance < asset.price) return toast.error('Insufficient balance')
    setBuyingId(asset.id)
    try {
      await buyAsset({ asset_id: asset.id, name: asset.name, price: asset.price })
      toast.success(`${asset.name} purchase submitted — pending admin approval`)
      getMe().then(r => { if (r.data) setUser(r.data) }).catch(() => {})
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || 'Purchase failed')
    } finally {
      setBuyingId(null)
    }
  }

  const handleRentVps = async (plan: VpsPlan) => {
    if (balance < plan.price) return toast.error('Insufficient balance')
    setRentingId(plan.id)
    try {
      await rentVps({ plan_id: plan.id, name: plan.name, price: plan.price })
      toast.success(`${plan.name} rental submitted — pending admin approval`)
      getMe().then(r => { if (r.data) setUser(r.data) }).catch(() => {})
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg || 'Rental failed')
    } finally {
      setRentingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-[#eaecef]">Store</h1>

      {/* Balance card */}
      <div className="relative bg-gradient-to-br from-[#1e2329] via-[#181d22] to-[#161a1e] border border-[#2b3139] rounded-2xl p-5 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse at top right, rgba(240,185,11,0.08) 0%, transparent 60%)' }}
        />
        <div className="relative">
          <p className="text-xs text-[#848e9c] font-medium mb-1">Available Balance</p>
          <p className="text-3xl font-bold font-mono text-[#eaecef]">{formatCurrency(balance, currency)}</p>
          <p className="text-xs text-[#848e9c] mt-1">USDT · Used for purchases &amp; rentals</p>
        </div>
      </div>

      {/* Two-column store grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Left: Buy Asset */}
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2b3139] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#f0b90b]/10 flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={15} className="text-[#f0b90b]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#eaecef]">Buy Crypto Assets</h2>
              <p className="text-[10px] text-[#848e9c]">Purchase directly from your balance</p>
            </div>
          </div>
          <div className="p-4 space-y-2.5">
            {loading ? (
              <div className="py-10 flex items-center justify-center">
                <RefreshCw size={20} className="text-[#2b3139] animate-spin" />
              </div>
            ) : assetProducts.length === 0 ? (
              <p className="text-xs text-[#848e9c] text-center py-8">No assets available</p>
            ) : assetProducts.map(asset => (
              <div
                key={asset.id}
                className="flex items-center justify-between bg-[#0b0e11] border border-[#2b3139] rounded-xl px-4 py-3 hover:border-[#f0b90b]/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f0b90b]/10 flex items-center justify-center font-bold text-[#f0b90b] text-sm flex-shrink-0">
                    {asset.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#eaecef]">{asset.name}</p>
                    <p className="text-xs text-[#848e9c]">${Number(asset.price).toLocaleString()} / unit</p>
                  </div>
                </div>
                <button
                  onClick={() => handleBuyAsset(asset)}
                  disabled={buyingId === asset.id}
                  className="flex items-center gap-1.5 text-xs bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 disabled:opacity-60 text-[#f0b90b] px-3 py-1.5 rounded-lg transition font-medium flex-shrink-0"
                >
                  {buyingId === asset.id && <RefreshCw size={10} className="animate-spin" />}
                  Buy
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Rent VPS */}
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2b3139] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0ecb81]/10 flex items-center justify-center flex-shrink-0">
              <Server size={15} className="text-[#0ecb81]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#eaecef]">Rent a VPS</h2>
              <p className="text-[10px] text-[#848e9c]">Run your bot 24/7 on a dedicated server</p>
            </div>
          </div>
          <div className="p-4 space-y-2.5">
            {loading ? (
              <div className="py-10 flex items-center justify-center">
                <RefreshCw size={20} className="text-[#2b3139] animate-spin" />
              </div>
            ) : vpsPlans.length === 0 ? (
              <p className="text-xs text-[#848e9c] text-center py-8">No VPS plans available</p>
            ) : vpsPlans.map(plan => (
              <div
                key={plan.id}
                className="flex items-center justify-between bg-[#0b0e11] border border-[#2b3139] rounded-xl px-4 py-3 hover:border-[#0ecb81]/30 transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#eaecef]">{plan.name}</p>
                  <p className="text-xs text-[#848e9c] truncate">{plan.specs}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-bold text-[#0ecb81]">
                    ${plan.price}<span className="text-[10px] text-[#848e9c] font-normal">/mo</span>
                  </p>
                  <button
                    onClick={() => handleRentVps(plan)}
                    disabled={rentingId === plan.id}
                    className="mt-1 flex items-center gap-1.5 text-xs bg-[#0ecb81]/10 hover:bg-[#0ecb81]/20 disabled:opacity-60 text-[#0ecb81] px-3 py-1 rounded-lg transition font-medium ml-auto"
                  >
                    {rentingId === plan.id && <RefreshCw size={10} className="animate-spin" />}
                    Rent
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
