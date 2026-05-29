import { useEffect, useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { getActiveAd } from '../lib/api'

interface Ad {
  id: number
  title: string
  image_base64?: string
  link_url?: string
}

const SHOW_DELAY_MS  = 3_000   // appear 3 s after login
const DISPLAY_SECS   = 80      // auto-dismiss after 80 s
const SESSION_KEY    = 'finai-ad-dismissed'

export default function AdPopup() {
  const [ad,       setAd]       = useState<Ad | null>(null)
  const [visible,  setVisible]  = useState(false)
  const [secs,     setSecs]     = useState(DISPLAY_SECS)

  // Fetch and schedule show
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return

    const timer = setTimeout(async () => {
      try {
        const res = await getActiveAd()
        if (res.data && res.data.id) {
          setAd(res.data)
          setVisible(true)
        }
      } catch {
        // no ad or network error — silent
      }
    }, SHOW_DELAY_MS)

    return () => clearTimeout(timer)
  }, [])

  // Countdown + auto-dismiss
  useEffect(() => {
    if (!visible) return
    setSecs(DISPLAY_SECS)
    const tick = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(tick)
          dismiss()
          return 0
        }
        return s - 1
      })
    }, 1_000)
    return () => clearInterval(tick)
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    setVisible(false)
    sessionStorage.setItem(SESSION_KEY, '1')
  }

  if (!visible || !ad) return null

  const pct = secs / DISPLAY_SECS
  const r   = 11
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
