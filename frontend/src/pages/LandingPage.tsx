import { useNavigate } from 'react-router-dom'
import {
  Zap, TrendingUp, Shield, BarChart2, Bot, Globe,
  ArrowRight, Activity, Lock, Cpu, ChevronRight
} from 'lucide-react'

const features = [
  { icon: Bot,       title: 'AI-Powered Bots',    desc: 'Automated strategies driven by Grok AI that react to live market events in real-time.' },
  { icon: BarChart2, title: 'Live Market Data',    desc: 'Real-time price feeds for crypto and stocks. Monitor BTC, ETH, SPY, NVDA and more.' },
  { icon: TrendingUp,title: 'Trendline Analysis',  desc: 'AI-generated insights and predicted price movements from advanced technical analysis.' },
  { icon: Shield,    title: 'Risk Management',     desc: 'Configurable stop-loss, max drawdown, and position sizing to protect your capital.' },
  { icon: Activity,  title: 'Event Detection',     desc: 'AI scans thousands of news sources to flag high-impact events before prices move.' },
  { icon: Globe,     title: 'Multi-Asset',         desc: 'Trade crypto on Binance, stocks via Alpaca, and get alerts on Telegram, WhatsApp, email.' },
]

const stats = [
  { value: '$2.4B+', label: 'Volume Analyzed' },
  { value: '68%',   label: 'Avg Win Rate'    },
  { value: '15ms',  label: 'Signal Latency'  },
  { value: '24/7',  label: 'Always Running'  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef]">

      {/* ─── NAVBAR ─── */}
      <header className="sticky top-0 z-50 bg-[#0b0e11]/95 backdrop-blur-md border-b border-[#2b3139]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f0b90b] flex items-center justify-center">
              <Zap size={15} className="text-black" />
            </div>
            <span className="text-[#f0b90b] font-bold text-xl tracking-tight">FinAi</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[#848e9c] hover:text-[#eaecef] transition">Features</a>
            <a href="#markets"  className="text-sm text-[#848e9c] hover:text-[#eaecef] transition">Markets</a>
            <a href="#cta"      className="text-sm text-[#848e9c] hover:text-[#eaecef] transition">Pricing</a>
          </nav>

          {/* Only a plain text link — no "Get Started" or "Login" buttons in nav */}
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-[#848e9c] hover:text-[#eaecef] transition font-medium"
          >
            Sign in
          </button>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="py-24 px-6 border-b border-[#2b3139] relative overflow-hidden">
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(240,185,11,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(240,185,11,0.05) 1px,transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        {/* Glow blob – smaller and lower opacity so it doesn't bleed */}
        <div className="absolute inset-x-0 top-0 mx-auto w-96 h-48 bg-[#f0b90b]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#f0b90b]/10 border border-[#f0b90b]/25 text-[#f0b90b] text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
            <Cpu size={11} />
            Powered by Grok AI
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight text-[#eaecef] mb-5">
            Trade Smarter with{' '}
            <span className="text-[#f0b90b]">AI&#8209;Powered</span>{' '}
            Insights
          </h1>

          {/* Body */}
          <p className="text-[#848e9c] text-base leading-relaxed mb-10">
            FinAi reads real-time market news, detects high-impact events, and executes
            automated trading strategies — all driven by Grok AI.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-semibold px-7 py-3 rounded-xl text-sm transition-all"
            >
              Start Trading Free <ArrowRight size={15} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[#2b3139] hover:border-[#f0b90b]/30 hover:text-[#f0b90b] text-[#848e9c] px-7 py-3 rounded-xl text-sm transition-all"
            >
              View Dashboard <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section id="markets" className="bg-[#161a1e] border-b border-[#2b3139]">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-[#2b3139]">
            {stats.map(s => (
              <div key={s.label} className="text-center px-4">
                <p className="text-3xl font-bold text-[#f0b90b] font-mono">{s.value}</p>
                <p className="text-sm text-[#848e9c] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 px-6 border-b border-[#2b3139]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-[#eaecef] mb-3">
              Everything you need to trade smarter
            </h2>
            <p className="text-[#848e9c] text-sm max-w-md mx-auto">
              A complete AI trading suite — from market monitoring to automated execution.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-[#161a1e] border border-[#2b3139] rounded-2xl p-5 hover:border-[#f0b90b]/30 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#f0b90b]/10 flex items-center justify-center mb-3 group-hover:bg-[#f0b90b]/20 transition-colors">
                  <Icon size={16} className="text-[#f0b90b]" />
                </div>
                <h3 className="font-semibold text-[#eaecef] text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-[#848e9c] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MARKET PREVIEW ─── */}
      <section className="py-16 px-6 border-b border-[#2b3139] bg-[#0b0e11]">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-[#848e9c] font-semibold uppercase tracking-widest mb-6 text-center">
            Live Market Snapshot
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { symbol: 'BTC/USDT', price: '$67,432', change: '+2.4%', up: true  },
              { symbol: 'ETH/USDT', price: '$3,521',  change: '+1.8%', up: true  },
              { symbol: 'NVDA',     price: '$875.00', change: '+3.1%', up: true  },
              { symbol: 'SPY',      price: '$530.40', change: '+0.5%', up: true  },
            ].map(t => (
              <div key={t.symbol} className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-4">
                <p className="text-xs text-[#848e9c] mb-2">{t.symbol}</p>
                <p className="text-lg font-bold font-mono text-[#eaecef]">{t.price}</p>
                <p className={`text-xs font-medium mt-1 ${t.up ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                  {t.change}&nbsp;(24h)
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section id="cta" className="py-20 px-6 bg-[#161a1e] border-b border-[#2b3139]">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f0b90b]/10 border border-[#f0b90b]/25 flex items-center justify-center mx-auto mb-5">
            <Lock size={20} className="text-[#f0b90b]" />
          </div>
          <h2 className="text-2xl font-bold text-[#eaecef] mb-3">
            Ready to automate your trading?
          </h2>
          <p className="text-[#848e9c] text-sm mb-8 leading-relaxed">
            Join traders using FinAi to get an edge in the markets every day.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-semibold px-9 py-3 rounded-xl text-sm transition-all"
          >
            Create Free Account <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-8 px-6 bg-[#0b0e11]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#f0b90b] flex items-center justify-center">
              <Zap size={11} className="text-black" />
            </div>
            <span className="text-[#f0b90b] font-bold text-sm">FinAi</span>
          </div>
          <p className="text-xs text-[#4a5568]">
            © {new Date().getFullYear()} FinAi · Not financial advice · Trade at your own risk
          </p>
        </div>
      </footer>

    </div>
  )
}
