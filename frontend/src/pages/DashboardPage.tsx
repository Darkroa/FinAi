import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getEvents, getBotStatus, getTodayPnl, getBotTrades } from '../lib/api';
import { useTickerPrices, useLivePricesMap } from '../hooks/useTickerPrices';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Bot,
  Newspaper,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowRight,
  Bitcoin,
  DollarSign,
  Send,
  Users,
  Server,
  Package,
  BarChart2,        // Fixed: was missing
} from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

interface TradeLog {
  id: number;
  ticker: string;
  action: string;
  price: number;
  qty: number;
  pnl: number | null;
  created_at: string;
  exchange: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const tickerItems = useTickerPrices(60000);
  const { map: priceMap, refetch: refetchPrices } = useLivePricesMap(60000);

  const [events, setEvents] = useState<
    { id: number; description: string; event_type: string; tickers_affected: string[]; created_at: string }[]
  >([]);
  const [botRunning, setBotRunning] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [btcToggle, setBtcToggle] = useState<'BTC' | 'ETH'>('BTC');
  const [todayPnl, setTodayPnl] = useState(0);
  const [todayPct, setTodayPct] = useState(0);
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [unrealizedPnl, setUnrealizedPnl] = useState(0);
  const [openPositions, setOpenPositions] = useState(0);

  const balance = user?.balance_usdt ?? 0;

  const btcItem = tickerItems.find((t) => t.symbol === 'BTC/USDT');
  const ethItem = tickerItems.find((t) => t.symbol === 'ETH/USDT');

  const parsePrice = (s: string) => parseFloat(s.replace(/[$,]/g, '')) || 0;
  const parseChange = (s: string) => parseFloat(s.replace('%', '')) || 0;

  const btcPrice = btcItem ? parsePrice(btcItem.price) : 0;
  const ethPrice = ethItem ? parsePrice(ethItem.price) : 0;
  const btcChange = btcItem ? parseChange(btcItem.change) : 0;
  const ethChange = ethItem ? parseChange(ethItem.change) : 0;

  const priceLoading = !btcItem?.live;

  const displayPrice =
    (btcToggle === 'BTC' ? btcPrice : ethPrice) ||
    (btcToggle === 'BTC' ? 97000 : 3200);

  const displayChange =
    (btcToggle === 'BTC' ? btcChange : ethChange) ||
    (btcToggle === 'BTC' ? 2.4 : 1.8);

  const btcEquiv = displayPrice > 0 ? (balance / displayPrice).toFixed(6) : '—';

  // Compute unrealized P&L
  useEffect(() => {
    if (trades.length === 0 || Object.keys(priceMap).length === 0) return;

    const positions: Record<string, { qty: number; avgPrice: number; totalCost: number }> = {};

    for (const t of trades) {
      const sym = t.ticker?.replace('-', '/').replace('USD', 'USDT') ?? '';
      if (!sym) continue;

      if (!positions[sym]) {
        positions[sym] = { qty: 0, avgPrice: 0, totalCost: 0 };
      }

      if (t.action?.toUpperCase() === 'BUY') {
        positions[sym].totalCost += (t.price ?? 0) * (t.qty ?? 0);
        positions[sym].qty += t.qty ?? 0;
      } else {
        positions[sym].qty -= t.qty ?? 0;
        if (positions[sym].qty < 0) positions[sym].qty = 0;
      }

      if (positions[sym].qty > 0) {
        positions[sym].avgPrice = positions[sym].totalCost / positions[sym].qty;
      }
    }

    let totalUnrealized = 0;
    let openCount = 0;

    for (const [sym, pos] of Object.entries(positions)) {
      if (pos.qty <= 0) continue;
      const current = priceMap[sym]?.usd ?? priceMap[sym.replace('/USDT', '')]?.usd ?? 0;
      if (current === 0) continue;

      totalUnrealized += (current - pos.avgPrice) * pos.qty;
      openCount++;
    }

    setUnrealizedPnl(totalUnrealized);
    setOpenPositions(openCount);
  }, [trades, priceMap]);

  const fetchData = useCallback(async () => {
    try {
      const [eventsRes, botRes, pnlRes, tradesRes] = await Promise.all([
        getEvents(5),
        getBotStatus(),
        getTodayPnl(),
        getBotTrades(100),
      ]);

      setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : eventsRes.data?.events ?? []);
      setBotRunning(botRes.data?.running ?? false);
      setTodayPnl(pnlRes.data?.today_pnl ?? 0);
      setTodayPct(pnlRes.data?.today_pct ?? 0);
      setTrades(Array.isArray(tradesRes.data) ? tradesRes.data : tradesRes.data?.trades ?? []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }

    refetchPrices();
  }, [refetchPrices]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const firstName = user?.first_name || user?.email?.split('@')[0] || 'Trader';

  return (
    <div className="space-y-4">
    {/* Hero Balance Header */}
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1105 0%, #2a1f00 40%, #1e2329 100%)',
        borderBottom: '1px solid #2b3139',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(ellipse at top left, rgba(240,185,11,0.12) 0%, transparent 60%)',
        }}
      />

      <div className="relative p-5">
        {/* Header with greeting and eye icon */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-[#848e9c] font-medium">{getGreeting()},</p>
            <p className="text-base font-bold text-[#eaecef] leading-tight">{firstName}</p>
          </div>

          <button
            onClick={() => setHideBalance((h) => !h)}
            className="w-8 h-8 rounded-full bg-[#0b0e11]/60 flex items-center justify-center text-[#848e9c] hover:text-[#eaecef] transition border border-[#2b3139]/60"
          >
            {hideBalance ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>

        {/* Balance Section */}
        <div className="mb-2">
          <p className="text-[8px] font-semibold uppercase tracking-widest text-[#848e9c] mb-2">
            Total Balance
          </p>
          <p className="text-3xl font-extrabold font-mono text-[#eaecef] leading-none tracking-tight">
            {hideBalance ? '••••••' : `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </p>
        </div>

        {/* BTC/ETH Toggle + Rate Info */}
        <div className="flex items-center gap-3 mt-2 mb-5">
          <div className="flex items-center gap-1 bg-[#0b0e11]/50 rounded-lg p-1">
            {(['BTC', 'ETH'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setBtcToggle(c)}
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  btcToggle === c
                    ? 'bg-[#f0b90b] text-black'
                    : 'text-[#848e9c] hover:text-[#eaecef]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {priceLoading ? (
            <div className="h-3 w-24 bg-[#2b3139] rounded animate-pulse" />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#848e9c] font-mono">
                {hideBalance ? '••••••' : btcEquiv} {btcToggle}
              </span>
              <span className="text-[10px] text-[#848e9c]">·</span>
              <span className="text-[10px] text-[#848e9c]">
                Rate: 1 {btcToggle} = ${displayPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
              <button onClick={fetchData} className="text-[#848e9c] hover:text-[#f0b90b] transition">
                <RefreshCw size={10} />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons - Deposit, Withdraw, Send */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <button
            onClick={() => navigate('/app/wallet?tab=deposit')}
            className="bg-[#0ecb81]/10 hover:bg-[#0ecb81]/20 text-[#0ecb81] py-2.5 rounded-xl text-xs font-semibold transition"
          >
            Deposit
          </button>
          <button
            onClick={() => navigate('/app/wallet?tab=withdraw')}
            className="bg-[#f6465d]/10 hover:bg-[#f6465d]/20 text-[#f6465d] py-2.5 rounded-xl text-xs font-semibold transition"
          >
            Withdraw
          </button>
          <button
            onClick={() => navigate('/app/wallet?tab=p2p')}
            className="bg-[#f0b90b]/10 hover:bg-[#f0b90b]/20 text-[#f0b90b] py-2.5 rounded-xl text-xs font-semibold transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
      
      {/* Small P&L Cards */}
      <div className="grid grid-cols-2 gap-3">
        
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl px-4 py-3">
          <div className="flex items-center gap-1">
            {todayPnl >= 0 ? <TrendingUp size={13} className="text-[#0ecb81]" /> : <TrendingDown size={13} className="text-[#f6465d]" />}
            <span className="text-[10px] text-[#848e9c]">Today's P&L</span>
          </div>
          <p className={`text-lg font-bold font-mono ${todayPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            {todayPnl >= 0 ? '+' : ''}${todayPnl.toFixed(2)}
          </p>
        </div>

        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5">
            <DollarSign size={2} className="text-[#f0b90b]" />
            <span className="text-[8px] text-[#848e9c]">Unrealized P&L</span>
          </div>
          <p className={`text-lg font-bold font-mono ${unrealizedPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
            {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}
          </p>
          <p className="text-[8px] text-[#848e9c]">{openPositions} open</p>
        </div>
      </div>
      
      {/* Open Positions - Separate Box */}
      {openPositions > 0 && (
        <div className="bg-[#161a1e] border border-[#f0b90b]/20 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#f0b90b]/10 flex items-center justify-center">
                <BarChart2 size={11} className="text-[#f0b90b]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#eaecef]">
                  {openPositions} Open Position{openPositions !== 1 ? 's' : ''}
                </p>
                <p className="text-[10px] text-[#848e9c]">Unrealized P&L vs current market</p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-bold font-mono ${
                  unrealizedPnl >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'
                }`}
              >
                {unrealizedPnl >= 0 ? '+' : ''}${Math.abs(unrealizedPnl).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </p>
              <button
                onClick={() => navigate('/app/trade')}
                className="text-[10px] text-[#f0b90b] hover:text-[#eaecef] transition flex items-center gap-0.5 ml-auto"
              >
                View <ArrowRight size={8} />
              </button>
            </div>
          </div>
        </div>
      )}
     
      {/* Activity Center */}
      <div>
        <p className="text-xs font-bold text-[#eaecef] mb-3">Activity Center</p>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => navigate('/app/markets?tab=news')} className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-6 flex flex-col items-center justify-center">
            <Newspaper size={28} className="text-[#f0b90b] mb-2" />
            <span className="text-sm font-semibold">News</span>
          </button>

          <button onClick={() => navigate('/app/bots')} className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-6 flex flex-col items-center justify-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${botRunning ? 'bg-[#0ecb81]/10' : 'bg-[#2b3139]'}`}>
              <Bot size={28} className={botRunning ? 'text-[#0ecb81]' : 'text-[#848e9c]'} />
            </div>
            <span className="text-sm font-semibold">AI Bot</span>
            <span className={`text-xs mt-1 ${botRunning ? 'text-[#0ecb81]' : 'text-[#848e9c]'}`}>{botRunning ? 'Live' : 'Offline'}</span>
          </button>
          
          <button onClick={() => navigate('/app/trade')} className="bg-[#161a1e] border border-[#2b3139] rounded-xl p-6 flex flex-col items-center justify-center">
            <Activity size={28} className="text-[#eaecef] mb-2" />
            <span className="text-sm font-semibold">Trade</span>
          </button>
        </div>
      </div>


      {/* Quick Actions */}
      <div>
        <p className="text-xs font-bold text-[#eaecef] mb-3">Quick Actions</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Rent VPS', icon: Server, path: '/app/wallet?tab=vps' },
            { label: 'Buy Asset', icon: Package, path: '/app/wallet?tab=asset' },
            { label: 'Send', icon: Send, path: '/app/wallet?tab=p2p' },
            { label: 'P2P', icon: Users, path: '/app/wallet?tab=p2p' },
          ].map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="bg-[#161a1e] border border-[#2b3139] rounded-xl py-4 flex flex-col items-center justify-center gap-1 hover:bg-[#1e2329]"
            >
              <Icon size={20} className="text-[#f0b90b]" />
              <span className="text-[10px] text-[#848e9c] text-center">{label}</span>
            </button>
          ))}
        </div>
      </div>
      {/* ─── LIVE MARKET SNAPSHOT ─── */}
      <section className="py-12 sm:py-16 bg-[#0d1014]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tickerItems.slice(0, 4).map(t => (
              <div key={t.symbol}
                className="bg-[#161a1e] border border-[#2b3139] hover:border-[#f0b90b]/25 rounded-xl p-4 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[#848e9c] font-medium">{t.symbol}</p>
                  {t.live && <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] animate-pulse" />}
                </div>
                <p className="text-base font-bold font-mono text-[#eaecef]">{t.price}</p>
                <p className={`text-xs font-semibold mt-1 ${t.up ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                  {t.change} <span className="text-[#4a5568] font-normal">24h</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* AI Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[#eaecef]">AI Market Events</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] inline-block animate-pulse" />
            <Zap size={12} className="text-[#f0b90b]" />
          </div>
        </div>
        <div className="bg-[#161a1e] border border-[#2b3139] rounded-xl divide-y divide-[#2b3139]">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Activity size={20} className="text-[#2b3139]" />
              <p className="text-xs text-[#848e9c]">No recent AI events</p>
              <p className="text-[10px] text-[#4a5568]">Events are ingested every 15 minutes</p>
            </div>
          ) : (
            events.slice(0, 5).map((ev, i) => (
              <div key={i} className="px-4 py-3 hover:bg-[#1e2329] transition">
                <p className="text-xs text-[#eaecef] leading-relaxed line-clamp-2">
                  {ev.description ?? ev.event_type}
                </p>
                <p className="text-[10px] text-[#848e9c] mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f0b90b] inline-block" />
                  {ev.tickers_affected?.[0] ?? 'Market'} ·{' '}
                  {ev.created_at ? new Date(ev.created_at).toLocaleDateString() : ''}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}