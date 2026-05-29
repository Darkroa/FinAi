import { useEffect, useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { getActiveAd } from '../lib/api'

interface Ad {
  id: number
  title: string
  image_base64?: string
  link_url?: string
}

const AD_DELAY_MS = 80_000
const SESSION_KEY = 'finai-ad-dismissed'

export default function AdPopup() {
  const [ad, setAd] = useState<Ad | null>(null)
  const [visible, setVisible] = useState(false)

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
      }
    }, AD_DELAY_MS)

    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    setVisible(false)
    sessionStorage.setItem(SESSION_KEY, '1')
  }

  if (!visible || !ad) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4">
      <div className="relative bg-[#161a1e] border border-[#2b3139] rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-[#0b0e11] hover:bg-[#2b3139] flex items-center justify-center text-[#848e9c] hover:text-[#eaecef] transition"
        >
          <X size={14} />
        </button>

        {ad.image_base64 && (
          <div className="w-full">
            <img
              src={ad.image_base64}
              alt={ad.title}
              className="w-full object-cover max-h-56"
            />
          </div>
        )}

        <div className="p-5 space-y-3">
          <h3 className="text-base font-bold text-[#eaecef] pr-6">{ad.title}</h3>

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
