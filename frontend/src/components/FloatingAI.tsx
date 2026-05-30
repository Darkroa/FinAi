import { useRef, useCallback, useEffect, useState } from 'react'
import { Zap, GripVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function FloatingAI() {
  const navigate = useNavigate()
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const dragging = useRef(false)
  const startMouse = useRef({ x: 0, y: 0 })
  const startPos = useRef({ x: 0, y: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const hasDragged = useRef(false)

  const onDragStart = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    hasDragged.current = false
    startMouse.current = { x: e.clientX, y: e.clientY }
    startPos.current = pos
      ? { x: pos.x, y: pos.y }
      : { x: window.innerWidth - 88, y: window.innerHeight - 88 }
    e.preventDefault()
  }, [pos])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - startMouse.current.x
      const dy = e.clientY - startMouse.current.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 56, startPos.current.x + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 56, startPos.current.y + dy)),
      })
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const btnStyle: React.CSSProperties = pos
    ? { position: 'fixed', left: pos.x, top: pos.y, bottom: 'auto', right: 'auto' }
    : { position: 'fixed', bottom: 24, right: 24 }

  return (
    <button
      ref={btnRef}
      onMouseDown={onDragStart}
      onClick={() => { if (!hasDragged.current) navigate('/app/chat') }}
      className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center bg-[#f0b90b] hover:bg-[#d4a30a] transition-all duration-300 cursor-grab active:cursor-grabbing select-none"
      style={{ ...btnStyle, zIndex: 9999 }}
      title="Drag to move · Click to open Chat Fin"
    >
      <Zap size={22} className="text-black pointer-events-none" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0ecb81] rounded-full flex items-center justify-center animate-pulse pointer-events-none">
        <span className="w-2 h-2 bg-[#0ecb81] rounded-full" />
      </span>
      <span className="absolute -bottom-1 -left-1 opacity-0 hover:opacity-60 transition pointer-events-none">
        <GripVertical size={10} className="text-[#848e9c]" />
      </span>
    </button>
  )
}
