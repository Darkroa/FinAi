import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { getAllActiveAds } from '../lib/api'
import { Megaphone, ExternalLink, RefreshCw, ImageOff } from 'lucide-react'

interface Ad {
  id: number
  title: string
  description: string | null
  ad_type: string
  image_base64: string | null
  link_url: string | null
  created_at: string
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5)  return 'Good early morning'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 22) return 'Good evening'
  return 'Good night'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AdsPage() {
  const { user }      = useAuthStore()
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)

  const firstName = user?.first_name || user?.username || user?.email?.split('@')[0] || 'there'

  useEffect(() => {
    getAllActiveAds()
      .then(r => setAds(Array.isArray(r.data) ? r.data : []))
      .catch(() => setAds([]))
      .finally(() => setLoading(false))
    const iv = setInterval(() => {
      getAllActiveAds().then(r => setAds(Array.isArray(r.data) ? r.data : [])).catch(() => {})
    }, 60_000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-10">

      {/* ── Greeting header ── */}
      <div>
        <p className="text-2xl font-bold text-[#eaecef]">
          Hello 👋 <span className="text-[#f0b90b] capitalize">{firstName}</span>
        </p>
        <p className="text-sm text-[#848e9c] mt-1">{getGreeting()} · Here's what's new for you today</p>
      </div>

      {/* ── Page title ── */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#f0b90b]/10 flex items-center justify-center">
          <Megaphone size={15} className="text-[#f0b90b]" />
        </div>
        <div>
          <h1 className="text-base font-bold text-[#eaecef]">Announcements &amp; Ads</h1>
          <p className="text-[10px] text-[#848e9c]">Latest promotions from FinAi</p>
        </div>
      </div>

      {/* ── Ad cards ── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-[#161a1e] border border-[#2b3139] rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-[#1e2329]" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-[#2b3139] rounded w-2/3" />
                <div className="h-3 bg-[#2b3139] rounded w-full" />
                <div className="h-3 bg-[#2b3139] rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : ads.length === 0 ? (
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-full bg-[#0b0e11] border border-[#2b3139] flex items-center justify-center">
            <Megaphone size={22} className="text-[#2b3139]" />
          </div>
          <p className="text-sm text-[#848e9c]">No announcements right now</p>
          <p className="text-[10px] text-[#4a5568]">Check back later for promotions &amp; updates</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map(ad => (
            <div key={ad.id}
              className="bg-[#161a1e] border border-[#2b3139] rounded-2xl overflow-hidden hover:border-[#f0b90b]/25 transition-colors">

              {/* ── Title at top ── */}
              <div className="px-4 pt-4 pb-3 border-b border-[#2b3139]">
                <p className="text-sm font-bold text-[#eaecef] leading-snug">{ad.title}</p>
                <p className="text-[10px] text-[#4a5568] mt-0.5">{timeAgo(ad.created_at)}</p>
              </div>

              {/* ── Instagram-style image ── */}
              <div className="w-full aspect-square bg-[#0b0e11] flex items-center justify-center overflow-hidden">
                {ad.image_base64 ? (
                  <img
                    src={`data:image/jpeg;base64,${ad.image_base64}`}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#2b3139]">
                    <ImageOff size={36} />
                    <p className="text-[10px] text-[#4a5568]">No image</p>
                  </div>
                )}
              </div>

              {/* ── Description + CTA ── */}
              <div className="p-4 space-y-3">
                {ad.description && (
                  <p className="text-sm text-[#848e9c] leading-relaxed whitespace-pre-line">
                    {ad.description}
                  </p>
                )}

                {/* Type chip */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0b90b]/10 text-[#f0b90b] font-medium capitalize border border-[#f0b90b]/20">
                    {ad.ad_type || 'promo'}
                  </span>

                  {ad.link_url && (
                    <a
                      href={ad.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#f0b90b] hover:text-[#d4a30a] bg-[#f0b90b]/8 hover:bg-[#f0b90b]/15 border border-[#f0b90b]/20 px-3 py-1.5 rounded-xl transition"
                    >
                      Learn more <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Refresh note */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#4a5568] pt-2">
            <RefreshCw size={10} />
            <span>Auto-refreshes every minute</span>
          </div>
        </div>
      )}
    </div>
  )
}
