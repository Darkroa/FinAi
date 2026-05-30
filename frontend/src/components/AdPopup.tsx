import { useEffect, useRef, useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { getAllActiveAds } from '../lib/api'

interface Ad {
  id: number
  title: string
  image_base64?: string
  link_url?: string
}

const FIRST_DELAY_MS = 300_000  // 5 minutes after login
const CYCLE_DELAY_MS = 180_000  // 3 minutes between ads
const DISPLAY_SECS   = 80       // auto-dismiss countdown

export default function AdPopup() {
  const [ads,      setAds]      = useState<Ad[]>([])
  const [adIndex,  setAdIndex]  = useState(0)
  const [visible,  setVisible]  = useState(false)
  const [secs,     setSecs]     = useState(DISPLAY_SECS)
  const cycleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch all active ads and shuffle once on mount
  useEffect(() => {
    getAllActiveAds()
      .then(res => {
        const data: Ad[] = Array.isArray(res.data) ? res.data : []
        const shuffled = [...data].sort(() => Math.random() - 0.5)
        setAds(shuffled)
      })
      .catch(() => {})
  }, [])

  // Schedule first show at 5 minutes
  useEffect(() => {
    if (ads.length === 0) return
    const timer = setTimeout(() => setVisible(true), FIRST_DELAY_MS)
    return () => clearTimeout(timer)
  }, [ads])

  // Countdown + auto-dismiss
  useEffect(() => {
    if (!visible) return
    setSecs(DISPLAY_SECS)
    const tick = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(tick)
          scheduleNext()
          return 0
        }
        return s - 1
      })
    }, 1_000)
    return () => clearInterval(tick)
  }, [visible, adIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleNext = () => {
    setVisible(false)
    if (ads.length <= 1) return
    if (cycleTimer.current) clearTimeout(cycleTimer.current)
    cycleTimer.current = setTimeout(() => {
      setAdIndex(i => (i + 1) % ads.length)
      setVisible(true)
    }, CYCLE_DELAY_MS)
  }

  const dismiss = () => {
    setVisible(false)
    scheduleNext()
  }

  // Cleanup cycle timer on unmount
  useEffect(() => () => { if (cycleTimer.current) clearTimeout(cycleTimer.current) }, [])

  const ad = ads[adIndex]
  if (!visible || !ad) return null

  const pct  = secs / DISPLAY_SECS
  const r    = 11
  const circ = 2 * Math.PI * r

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="relative bg-[#161a1e] border border-[#2b3139] rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
        style={{ animation: 'adFadeIn .3s ease-out' }}
      >
        <style>{`
          @keyframes adFadeIn {
            from { opacity: 0; transform: scale(.92) translateY(8px); }
            to   { opacity: 1; transform: scale(1)  translateY(0);    }
          }
        `}</style>

        {/* Countdown ring (top-left) */}
        <div className="absolute top-3 left-3 z-10 w-8 h-8 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 28 28" className="absolute -rotate-90">
            <circle cx="14" cy="14" r={r} fill="none" stroke="#2b3139" strokeWidth="2.5" />
            <circle
              cx="14" cy="14" r={r}
              fill="none"
              stroke="#f0b90b"
              strokeWidth="2.5"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span className="text-[9px] font-bold text-[#f0b90b] relative z-10 leading-none">{secs}</span>
        </div>

        {/* Ad counter badge (top-center) */}
        {ads.length > 1 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
            <span className="text-[9px] text-[#848e9c] bg-[#0b0e11]/70 px-2 py-0.5 rounded-full">
              {adIndex + 1}/{ads.length}
            </span>
          </div>
        )}

        {/* Close button (top-right) */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-[#0b0e11] hover:bg-[#2b3139] flex items-center justify-center text-[#848e9c] hover:text-[#eaecef] transition"
        >
          <X size={14} />
        </button>

        {/* Ad image */}
        {ad.image_base64 ? (
          <img
            src={ad.image_base64}
            alt={ad.title}
            className="w-full object-cover max-h-56"
          />
        ) : (
          <div className="w-full h-28 bg-gradient-to-br from-[#f0b90b]/10 via-[#161a1e] to-[#0ecb81]/10 flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#f0b90b] flex items-center justify-center text-3xl font-black text-black select-none">F</div>
          </div>
        )}

        {/* Content */}
        <div className="p-5 space-y-3">
          <h3 className="text-base font-bold text-[#eaecef] pr-4 leading-snug">{ad.title}</h3>

          <div className="flex items-center gap-2 pt-1">
            {ad.link_url && (
              <a
                href={ad.link_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-semibold text-xs py-2.5 rounded-xl transition"
              >
                Learn More <ExternalLink size={11} />
              </a>
            )}
            <button
              onClick={dismiss}
              className="flex-1 text-xs text-[#848e9c] hover:text-[#eaecef] py-2.5 rounded-xl border border-[#2b3139] hover:bg-[#2b3139] transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
