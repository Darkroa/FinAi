import { Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function FloatingAI() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/app/chat')}
      className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center bg-[#f0b90b] hover:bg-[#d4a30a] transition-all duration-300 select-none"
      style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}
      title="Chat with Fin"
    >
      <Zap size={22} className="text-black pointer-events-none" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0ecb81] rounded-full flex items-center justify-center animate-pulse pointer-events-none">
        <span className="w-2 h-2 bg-[#0ecb81] rounded-full" />
      </span>
    </button>
  )
}
