import { useState, useEffect, useCallback } from "react";

const TOKEN_KEY = "finai_server_token";
const IS_ADMIN_KEY = "finai_server_is_admin";

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t: string) { localStorage.setItem(TOKEN_KEY, t); }
function clearAuth() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(IS_ADMIN_KEY); }

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  return res;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface HealthCheck {
  status: "healthy" | "degraded" | "error";
  latency_ms?: number;
  provider?: string;
  workers?: number;
  error?: string;
  [key: string]: unknown;
}

interface HealthData {
  overall: "healthy" | "degraded";
  checks: Record<string, HealthCheck>;
  timestamp: string;
}

// ── Login ─────────────────────────────────────────────────────────────────────

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Login failed");
        return;
      }
      const token = data.access_token || data.token;
      if (!token) {
        setError("No token returned.");
        return;
      }
      setToken(token);
      const meRes = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const me = await meRes.json();
      if (!me.is_admin) {
        clearAuth();
        setError("Admin access required.");
        return;
      }
      onLogin();
    } catch {
      setError("Network error — is the API running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080c18] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">FinAi Server Panel</h1>
          <p className="text-sm text-slate-400 mt-1">Admin access only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@example.com"
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-all"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Health badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    healthy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    degraded: "bg-amber-500/15 text-amber-300 border-amber-500/20",
    error: "bg-red-500/15 text-red-300 border-red-500/20",
  };
  const dot: Record<string, string> = {
    healthy: "bg-emerald-400 shadow-emerald-400/50",
    degraded: "bg-amber-400 shadow-amber-400/50",
    error: "bg-red-400 shadow-red-400/50",
  };
  const cls = map[status] ?? "bg-slate-500/15 text-slate-300 border-slate-500/20";
  const d = dot[status] ?? "bg-slate-400";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shadow-lg ${d}`} />
      {status}
    </span>
  );
}

// ── Service icons ─────────────────────────────────────────────────────────────

const SERVICE_META: Record<string, { label: string; emoji: string; desc: string }> = {
  database:     { label: "PostgreSQL",      emoji: "🗄️", desc: "Primary database" },
  supabase_env: { label: "Supabase Env",    emoji: "☁️", desc: "Supabase configuration" },
  celery:       { label: "Celery Worker",   emoji: "⚙️", desc: "Async task queue" },
  coingecko:    { label: "CoinGecko API",   emoji: "🦎", desc: "Crypto price feed" },
  binance:      { label: "Binance API",     emoji: "🔶", desc: "Exchange connectivity" },
};

function CheckCard({ name, check }: { name: string; check: HealthCheck }) {
  const meta = SERVICE_META[name] ?? { label: name.replace(/_/g, " "), emoji: "🔧", desc: "" };
  const extras = Object.entries(check).filter(
    ([k]) => !["status", "error"].includes(k)
  );

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      check.status === "healthy"
        ? "border-emerald-500/20 bg-emerald-500/5"
        : check.status === "degraded"
        ? "border-amber-500/20 bg-amber-500/5"
        : "border-red-500/20 bg-red-500/5"
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none">{meta.emoji}</span>
          <div>
            <div className="text-sm font-semibold text-white capitalize">{meta.label}</div>
            {meta.desc && <div className="text-xs text-slate-500">{meta.desc}</div>}
          </div>
        </div>
        <StatusBadge status={check.status} />
      </div>

      {check.error && (
        <div className="text-xs text-red-400 font-mono bg-red-500/10 rounded-lg px-3 py-2 mb-2 break-all">
          {check.error}
        </div>
      )}

      {extras.length > 0 && (
        <div className="space-y-1">
          {extras.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-xs">
              <span className="text-slate-500 capitalize">{k.replace(/_/g, " ")}</span>
              <span className="text-slate-300 font-mono">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setError("");
    try {
      const res = await apiFetch("/api/admin/health");
      if (res.status === 401 || res.status === 403) {
        clearAuth();
        onLogout();
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: HealthData = await res.json();
      setHealth(data);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch health data");
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const checks = health?.checks ?? {};
  const healthy = Object.values(checks).filter((c) => c.status === "healthy").length;
  const total = Object.values(checks).length;

  return (
    <div className="min-h-screen bg-[#080c18]">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#080c18]/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-white">FinAi Server Panel</div>
              <div className="text-xs text-slate-500">Admin · Health Monitor</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {health && (
              <div className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                health.overall === "healthy"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-300"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${health.overall === "healthy" ? "bg-emerald-400" : "bg-amber-400"}`} />
                {healthy}/{total} healthy
              </div>
            )}
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => { clearAuth(); onLogout(); }}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1.5"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            {error}
          </div>
        )}

        {/* Summary */}
        {health && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Healthy", value: healthy, color: "text-emerald-400", bg: "bg-emerald-500/8" },
              { label: "Issues", value: total - healthy, color: total - healthy > 0 ? "text-amber-400" : "text-slate-500", bg: "bg-white/3" },
              { label: "Total Checks", value: total, color: "text-blue-400", bg: "bg-blue-500/8" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} border border-white/5 rounded-xl p-4`}>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Overall banner */}
        {health && (
          <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${
            health.overall === "healthy"
              ? "bg-emerald-500/8 border-emerald-500/20"
              : "bg-amber-500/8 border-amber-500/20"
          }`}>
            <span className="text-xl">{health.overall === "healthy" ? "✅" : "⚠️"}</span>
            <div>
              <div className="text-sm font-semibold text-white capitalize">
                System {health.overall}
              </div>
              {lastRefresh && (
                <div className="text-xs text-slate-500">
                  Last checked {lastRefresh.toLocaleTimeString()} · auto-refreshes every 30s
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !health && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-white/5 border border-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {/* Health checks */}
        {health && Object.keys(checks).length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Services
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(checks).map(([name, check]) => (
                <CheckCard key={name} name={name} check={check} />
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        {health?.timestamp && (
          <p className="text-xs text-slate-600 text-center">
            Server time: {new Date(health.timestamp).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}

// ── App shell ─────────────────────────────────────────────────────────────────

export default function App() {
  const [authed, setAuthed] = useState(() => {
    const t = getToken();
    return !!t;
  });

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  return <Dashboard onLogout={() => setAuthed(false)} />;
}
