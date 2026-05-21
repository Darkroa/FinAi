import { useState, useEffect, useRef, useCallback } from 'react'

export interface Candle {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface UseWebSocketCandlesResult {
  candles: Candle[]
  connected: boolean
  lastPrice: number | null
}

const PAIR_BASE_PRICES: Record<string, number> = {
  'BTC/USDT':   97000,
  'ETH/USDT':   3200,
  'BNB/USDT':   628,
  'SOL/USDT':   155,
  'XRP/USDT':   0.52,
  'DOGE/USDT':  0.12,
  'ADA/USDT':   0.45,
  'AVAX/USDT':  38,
  'LINK/USDT':  14,
  'DOT/USDT':   7.2,
  'UNI/USDT':   8.5,
  'MATIC/USDT': 0.90,
  'LTC/USDT':   85,
  'XLM/USDT':   0.11,
  'XAU/USD':    3200,
  'XAG/USD':    32,
  'OIL/WTI':    71,
  'AAPL':       195,
  'TSLA':       175,
  'NVDA':       875,
  'MSFT':       415,
  'SPY':        526,
}

export function useWebSocketCandles(pair: string, tf: string): UseWebSocketCandlesResult {
  const [candles, setCandles] = useState<Candle[]>([])
  const [connected, setConnected] = useState(false)
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pairRef = useRef(pair)
  const tfRef = useRef(tf)
  pairRef.current = pair
  tfRef.current = tf

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    const symbol = encodeURIComponent(pair.replace('/', '_'))
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/prices/${symbol}?tf=${tf}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
      }

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data)
          if (data.type === 'candles') {
            setCandles(data.candles)
            if (data.candles.length > 0) {
              setLastPrice(data.candles[data.candles.length - 1].close)
            }
          } else if (data.type === 'tick') {
            setCandles(prev => {
              if (prev.length === 0) return prev
              const updated = [...prev]
              const last = { ...updated[updated.length - 1] }
              const p = data.price
              last.close = p
              last.high = Math.max(last.high, p)
              last.low = Math.min(last.low, p)
              updated[updated.length - 1] = last
              return updated
            })
            setLastPrice(data.price)
          }
        } catch {
        }
      }

      ws.onerror = () => {
        setConnected(false)
      }

      ws.onclose = () => {
        setConnected(false)
        wsRef.current = null
        reconnectTimer.current = setTimeout(() => {
          if (pairRef.current === pair && tfRef.current === tf) {
            connect()
          }
        }, 3000)
      }
    } catch {
      setConnected(false)
    }
  }, [pair, tf])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setConnected(false)
    }
  }, [connect])

  return { candles, connected, lastPrice }
}
