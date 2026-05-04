import streamlit as st
import requests
import jwt
import os

st.set_page_config(
    page_title="FinAi — AI Trading Platform",
    layout="wide",
    page_icon="📈",
    initial_sidebar_state="collapsed",
)

API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000/api")

if "jwt_token" not in st.session_state:
    st.session_state.jwt_token = None
if "user_email" not in st.session_state:
    st.session_state.user_email = None
if "show_auth" not in st.session_state:
    st.session_state.show_auth = False
if "auth_tab" not in st.session_state:
    st.session_state.auth_tab = "login"

if st.session_state.jwt_token:
    st.switch_page("src/frontend/user_dashboard.py")

CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; }

html, body,
[data-testid="stApp"],
[data-testid="stAppViewContainer"],
[data-testid="stMain"],
.main, section.main { 
    background-color: #0b0e11 !important;
    color: #eaecef !important;
    font-family: 'Inter', sans-serif !important;
}

/* Hide all Streamlit chrome */
[data-testid="stToolbar"],
[data-testid="stDecoration"],
[data-testid="stStatusWidget"],
.stDeployButton,
footer,
#MainMenu { display: none !important; }

[data-testid="stSidebar"] { display: none !important; }

/* Remove default padding */
[data-testid="block-container"] {
    padding: 0 !important;
    max-width: 100% !important;
}
.stMainBlockContainer { padding: 0 !important; max-width: 100% !important; }

/* ── NAV using Streamlit columns ── */
.nav-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 22px;
    font-weight: 800;
    color: #f0b90b;
    letter-spacing: -0.5px;
    padding: 14px 0;
}
.nav-logo-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #f0b90b, #f8d254);
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
}
.nav-links-html {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 36px;
    padding: 14px 0;
}
.nav-link-item {
    color: #848e9c;
    font-size: 14px;
    font-weight: 500;
    cursor: default;
}

/* Nav button overrides — target the last two buttons in nav row */
div[data-testid="column"]:nth-child(4) [data-testid="stButton"] > button {
    background: transparent !important;
    color: #eaecef !important;
    border: 1px solid #2b3139 !important;
    border-radius: 6px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    padding: 8px 18px !important;
    transition: all 0.2s !important;
    white-space: nowrap !important;
}
div[data-testid="column"]:nth-child(4) [data-testid="stButton"] > button:hover {
    border-color: #f0b90b !important;
    color: #f0b90b !important;
}
div[data-testid="column"]:nth-child(5) [data-testid="stButton"] > button {
    background: #f0b90b !important;
    color: #0b0e11 !important;
    border: none !important;
    border-radius: 6px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    padding: 8px 20px !important;
    transition: all 0.2s !important;
    white-space: nowrap !important;
}
div[data-testid="column"]:nth-child(5) [data-testid="stButton"] > button:hover {
    background: #f8d254 !important;
}

/* Global button base */
[data-testid="stButton"] > button {
    background: #2b3139 !important;
    color: #eaecef !important;
    border: 1px solid #2b3139 !important;
    border-radius: 8px !important;
    font-size: 15px !important;
    font-weight: 600 !important;
    transition: all 0.2s !important;
}
[data-testid="stButton"] > button:hover {
    background: #363c46 !important;
    border-color: #f0b90b !important;
    color: #f0b90b !important;
}

/* Hero get-started / sign-in buttons */
.hero-btn-col [data-testid="stButton"] > button {
    padding: 13px 32px !important;
    font-size: 15px !important;
    font-weight: 700 !important;
}
.hero-btn-gs [data-testid="stButton"] > button {
    background: #f0b90b !important;
    color: #0b0e11 !important;
    border: none !important;
}
.hero-btn-gs [data-testid="stButton"] > button:hover {
    background: #f8d254 !important;
    color: #0b0e11 !important;
}

/* Nav separator */
.nav-bar-wrap {
    background: #0d1117;
    border-bottom: 1px solid #1e2329;
    padding: 0 40px;
}

/* TICKER */
.ticker-wrap {
    background: #161a1e;
    border-bottom: 1px solid #1e2329;
    padding: 10px 24px;
    overflow: hidden;
    white-space: nowrap;
}
.ticker-inner { display: inline-flex; gap: 40px; font-size: 13px; }
.t-sym { color: #848e9c; font-weight: 500; margin-right: 4px; }
.t-up { color: #0ecb81; font-weight: 600; }
.t-dn { color: #f6465d; font-weight: 600; }
.t-sep { color: #2b3139; }

/* HERO */
.hero-wrap {
    padding: 80px 24px 60px;
    text-align: center;
    background: radial-gradient(ellipse at 50% -10%, rgba(240,185,11,0.1) 0%, transparent 65%);
}
.hero-badge {
    display: inline-block;
    background: rgba(240,185,11,0.12);
    border: 1px solid rgba(240,185,11,0.35);
    color: #f0b90b;
    font-size: 11px;
    font-weight: 700;
    padding: 5px 14px;
    border-radius: 20px;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 26px;
}
.hero-h1 {
    font-size: 58px;
    font-weight: 900;
    line-height: 1.08;
    color: #eaecef;
    margin: 0 auto 18px;
    max-width: 720px;
    letter-spacing: -2px;
}
.hero-h1 em { font-style: normal; color: #f0b90b; }
.hero-sub {
    font-size: 17px;
    color: #848e9c;
    max-width: 520px;
    margin: 0 auto 36px;
    line-height: 1.65;
}

/* STATS */
.stats-wrap {
    background: #161a1e;
    border-top: 1px solid #1e2329;
    border-bottom: 1px solid #1e2329;
    display: flex;
    justify-content: center;
    gap: 72px;
    padding: 28px 24px;
    flex-wrap: wrap;
}
.stat-num { font-size: 28px; font-weight: 800; color: #f0b90b; display: block; }
.stat-lbl { font-size: 12px; color: #848e9c; margin-top: 3px; text-align: center; }

/* FEATURES */
.feat-wrap { padding: 72px 40px; background: #0b0e11; }
.feat-head { text-align: center; font-size: 34px; font-weight: 800; color: #eaecef; margin-bottom: 10px; letter-spacing: -0.5px; }
.feat-sub  { text-align: center; font-size: 15px; color: #848e9c; margin-bottom: 48px; }
.feat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 18px; max-width: 1060px; margin: 0 auto; }
.feat-card { background: #161a1e; border: 1px solid #1e2329; border-radius: 12px; padding: 26px; transition: border-color .2s, transform .2s; }
.feat-card:hover { border-color: rgba(240,185,11,.5); transform: translateY(-2px); }
.feat-icon { font-size: 30px; margin-bottom: 14px; display: block; }
.feat-title { font-size: 16px; font-weight: 700; color: #eaecef; margin-bottom: 8px; }
.feat-desc  { font-size: 13px; color: #848e9c; line-height: 1.6; }

/* CTA */
.cta-wrap { background: linear-gradient(160deg, #161a1e, #0b0e11); border-top: 1px solid #1e2329; padding: 72px 24px; text-align: center; }
.cta-h { font-size: 38px; font-weight: 800; color: #eaecef; margin-bottom: 12px; letter-spacing: -0.5px; }
.cta-sub { font-size: 15px; color: #848e9c; margin-bottom: 32px; }
.cta-btn [data-testid="stButton"] > button {
    background: #f0b90b !important;
    color: #0b0e11 !important;
    border: none !important;
    font-size: 15px !important;
    font-weight: 700 !important;
    padding: 14px 40px !important;
    border-radius: 8px !important;
}
.cta-btn [data-testid="stButton"] > button:hover { background: #f8d254 !important; }

/* FOOTER */
.footer-wrap { background: #0b0e11; border-top: 1px solid #1e2329; padding: 20px 24px; text-align: center; color: #4a5568; font-size: 13px; }

/* ── AUTH PANEL ── */
.auth-panel {
    background: #161a1e;
    border: 1px solid #2b3139;
    border-radius: 16px;
    padding: 36px 32px 28px;
    max-width: 420px;
    margin: 40px auto;
    box-shadow: 0 20px 60px rgba(0,0,0,.5);
}
.auth-panel-logo {
    text-align: center;
    margin-bottom: 20px;
}

/* Auth tab buttons */
.auth-tab-active [data-testid="stButton"] > button {
    background: #f0b90b !important;
    color: #0b0e11 !important;
    border: none !important;
    font-weight: 700 !important;
}
.auth-tab-inactive [data-testid="stButton"] > button {
    background: #0b0e11 !important;
    color: #848e9c !important;
    border: 1px solid #2b3139 !important;
}

/* Auth form fields */
[data-testid="stTextInput"] input {
    background: #0b0e11 !important;
    border: 1px solid #2b3139 !important;
    color: #eaecef !important;
    border-radius: 8px !important;
    padding: 11px 14px !important;
    font-size: 14px !important;
    font-family: 'Inter', sans-serif !important;
}
[data-testid="stTextInput"] input:focus {
    border-color: #f0b90b !important;
    box-shadow: 0 0 0 2px rgba(240,185,11,.15) !important;
    outline: none !important;
}
[data-testid="stTextInput"] label {
    color: #c8cdd4 !important;
    font-size: 13px !important;
    font-weight: 600 !important;
}

/* Login / signup submit button — RED like the image */
[data-testid="stFormSubmitButton"] button {
    background: #b91c1c !important;
    color: #fff !important;
    font-weight: 700 !important;
    font-size: 15px !important;
    border-radius: 8px !important;
    border: none !important;
    padding: 12px !important;
    width: 100% !important;
    letter-spacing: 0.3px !important;
    transition: background .2s !important;
}
[data-testid="stFormSubmitButton"] button:hover {
    background: #dc2626 !important;
}

hr { border-color: #1e2329 !important; }
</style>
"""
st.markdown(CSS, unsafe_allow_html=True)


# ── Helper functions ──────────────────────────────────────────────

def login_user(email: str, password: str):
    try:
        resp = requests.post(f"{API_BASE}/auth/login",
                             json={"email": email, "password": password}, timeout=10)
        if resp.status_code == 200:
            token = resp.json()["access_token"]
            decoded = jwt.decode(token, options={"verify_signature": False})
            st.session_state.jwt_token = token
            st.session_state.user_email = decoded.get("sub")
            st.session_state.show_auth = False
            st.rerun()
        else:
            st.error(resp.json().get("detail", "Invalid email or password"))
    except requests.exceptions.ConnectionError:
        st.error("Cannot connect to backend. Is the API running?")
    except Exception as e:
        st.error(f"Login error: {e}")


def signup_user(email: str, password: str, full_name: str):
    try:
        resp = requests.post(f"{API_BASE}/auth/signup",
                             json={"email": email, "password": password, "full_name": full_name},
                             timeout=10)
        if resp.status_code == 200:
            st.success("Account created! Sign in below.")
            st.session_state.auth_tab = "login"
            st.rerun()
        else:
            st.error(resp.json().get("detail", "Signup failed"))
    except Exception as e:
        st.error(f"Signup error: {e}")


# ── If auth panel is open, show it FIRST (full-width centered) ───
if st.session_state.show_auth:
    # Minimal nav still visible
    st.markdown('<div class="nav-bar-wrap">', unsafe_allow_html=True)
    nc1, nc2, nc3, nc4, nc5 = st.columns([0.15, 2, 2, 0.55, 0.6])
    with nc1:
        st.markdown('<div class="nav-logo"><div class="nav-logo-icon">📈</div></div>',
                    unsafe_allow_html=True)
    with nc2:
        st.markdown('<div style="padding:16px 0;font-size:20px;font-weight:800;color:#f0b90b;">FinAi</div>',
                    unsafe_allow_html=True)
    with nc4:
        if st.button("Sign In", key="nav_login_auth", use_container_width=True):
            st.session_state.auth_tab = "login"
            st.rerun()
    with nc5:
        if st.button("Get Started", key="nav_gs_auth", use_container_width=True):
            st.session_state.auth_tab = "signup"
            st.rerun()
    st.markdown('</div>', unsafe_allow_html=True)

    # Auth card
    _, col_card, _ = st.columns([1, 1.1, 1])
    with col_card:
        st.markdown('<div class="auth-panel">', unsafe_allow_html=True)

        # Logo + title
        st.markdown("""
        <div class="auth-panel-logo">
            <div style="width:50px;height:50px;background:linear-gradient(135deg,#f0b90b,#f8d254);
            border-radius:12px;display:inline-flex;align-items:center;justify-content:center;
            font-size:24px;margin-bottom:10px;">📈</div>
            <div style="font-size:20px;font-weight:800;color:#eaecef;">FinAi</div>
            <div style="font-size:13px;color:#848e9c;">AI-Powered Trading Platform</div>
        </div>
        """, unsafe_allow_html=True)

        # Tab switcher
        t1, t2 = st.columns(2)
        with t1:
            active = st.session_state.auth_tab == "login"
            st.markdown(f'<div class="{"auth-tab-active" if active else "auth-tab-inactive"}">', unsafe_allow_html=True)
            if st.button("Sign In", key="tab_si", use_container_width=True):
                st.session_state.auth_tab = "login"
                st.rerun()
            st.markdown('</div>', unsafe_allow_html=True)
        with t2:
            active2 = st.session_state.auth_tab == "signup"
            st.markdown(f'<div class="{"auth-tab-active" if active2 else "auth-tab-inactive"}">', unsafe_allow_html=True)
            if st.button("Sign Up", key="tab_su", use_container_width=True):
                st.session_state.auth_tab = "signup"
                st.rerun()
            st.markdown('</div>', unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)

        if st.session_state.auth_tab == "login":
            st.markdown("""
            <div style="margin-bottom:18px;">
                <div style="font-size:20px;font-weight:800;color:#eaecef;">Welcome back</div>
                <div style="font-size:13px;color:#848e9c;margin-top:3px;">Enter your credentials to access your account</div>
            </div>
            """, unsafe_allow_html=True)
            with st.form("login_form"):
                email    = st.text_input("Email", placeholder="name@example.com")
                password = st.text_input("Password", type="password", placeholder="••••••••")
                if st.form_submit_button("Login", use_container_width=True):
                    if email and password:
                        login_user(email, password)
                    else:
                        st.warning("Please fill in all fields.")
            st.markdown("""
            <div style="text-align:center;margin-top:14px;font-size:13px;color:#848e9c;">
                Need help? <a href="mailto:support@finai.io" style="color:#f0b90b;text-decoration:none;">support@finai.io</a>
            </div>
            """, unsafe_allow_html=True)

        else:
            st.markdown("""
            <div style="margin-bottom:18px;">
                <div style="font-size:20px;font-weight:800;color:#eaecef;">Create account</div>
                <div style="font-size:13px;color:#848e9c;margin-top:3px;">Start trading with AI — it's free</div>
            </div>
            """, unsafe_allow_html=True)
            with st.form("signup_form"):
                full_name = st.text_input("Full Name", placeholder="John Doe")
                email     = st.text_input("Email", placeholder="name@example.com")
                password  = st.text_input("Password", type="password", placeholder="Min. 8 characters")
                password2 = st.text_input("Confirm Password", type="password", placeholder="••••••••")
                if st.form_submit_button("Create Account", use_container_width=True):
                    if not all([full_name, email, password, password2]):
                        st.warning("Please fill in all fields.")
                    elif password != password2:
                        st.error("Passwords do not match.")
                    elif len(password) < 8:
                        st.error("Password must be at least 8 characters.")
                    else:
                        signup_user(email, password, full_name)

        st.markdown('</div>', unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        _, bc, _ = st.columns([1, 2, 1])
        with bc:
            if st.button("← Back to Home", key="back_home", use_container_width=True):
                st.session_state.show_auth = False
                st.rerun()

    st.stop()


# ── LANDING PAGE ─────────────────────────────────────────────────

# ── NAV BAR (real Streamlit columns for interactive buttons) ──
st.markdown('<div class="nav-bar-wrap">', unsafe_allow_html=True)
nc1, nc2, nc3, nc4, nc5 = st.columns([0.12, 1.2, 2.5, 0.55, 0.62])
with nc1:
    st.markdown('<div style="padding:12px 0;font-size:20px;">📈</div>', unsafe_allow_html=True)
with nc2:
    st.markdown('<div style="padding:14px 0;font-size:20px;font-weight:800;color:#f0b90b;">FinAi</div>',
                unsafe_allow_html=True)
with nc3:
    st.markdown("""
    <div class="nav-links-html">
        <span class="nav-link-item">Features</span>
        <span class="nav-link-item">Markets</span>
        <span class="nav-link-item">Pricing</span>
        <span class="nav-link-item">Docs</span>
    </div>
    """, unsafe_allow_html=True)
with nc4:
    if st.button("Sign In", key="nav_login", use_container_width=True):
        st.session_state.show_auth = True
        st.session_state.auth_tab = "login"
        st.rerun()
with nc5:
    if st.button("Get Started", key="nav_gs", use_container_width=True):
        st.session_state.show_auth = True
        st.session_state.auth_tab = "signup"
        st.rerun()
st.markdown('</div>', unsafe_allow_html=True)

# ── TICKER TAPE ──
st.markdown("""
<div class="ticker-wrap">
  <div class="ticker-inner">
    <span><span class="t-sym">BTC/USD</span><span class="t-up">$67,432 ▲ +2.4%</span></span>
    <span class="t-sep">|</span>
    <span><span class="t-sym">ETH/USD</span><span class="t-up">$3,521 ▲ +1.8%</span></span>
    <span class="t-sep">|</span>
    <span><span class="t-sym">AAPL</span><span class="t-up">$192.35 ▲ +0.9%</span></span>
    <span class="t-sep">|</span>
    <span><span class="t-sym">TSLA</span><span class="t-dn">$248.70 ▼ −1.2%</span></span>
    <span class="t-sep">|</span>
    <span><span class="t-sym">SPX</span><span class="t-up">5,304 ▲ +0.5%</span></span>
    <span class="t-sep">|</span>
    <span><span class="t-sym">NVDA</span><span class="t-up">$875 ▲ +3.1%</span></span>
    <span class="t-sep">|</span>
    <span><span class="t-sym">MSFT</span><span class="t-up">$415 ▲ +0.7%</span></span>
    <span class="t-sep">|</span>
    <span><span class="t-sym">BNB/USD</span><span class="t-dn">$412 ▼ −0.3%</span></span>
  </div>
</div>
""", unsafe_allow_html=True)

# ── HERO ──
st.markdown("""
<div class="hero-wrap">
  <div class="hero-badge">🤖 Powered by Grok AI</div>
  <div class="hero-h1">Trade Smarter with<br><em>AI-Powered</em> Insights</div>
  <div class="hero-sub">
    FinAi reads real-time financial news, detects market events, and executes
    automated trading strategies — all powered by Grok's advanced intelligence.
  </div>
</div>
""", unsafe_allow_html=True)

# Hero CTA buttons — full Streamlit buttons, centered
_, hb1, hb2, _ = st.columns([2, 1, 1, 2])
with hb1:
    st.markdown('<div class="hero-btn-col hero-btn-gs">', unsafe_allow_html=True)
    if st.button("Get Started →", key="hero_gs", use_container_width=True):
        st.session_state.show_auth = True
        st.session_state.auth_tab = "signup"
        st.rerun()
    st.markdown('</div>', unsafe_allow_html=True)
with hb2:
    st.markdown('<div class="hero-btn-col">', unsafe_allow_html=True)
    if st.button("Sign In", key="hero_si", use_container_width=True):
        st.session_state.show_auth = True
        st.session_state.auth_tab = "login"
        st.rerun()
    st.markdown('</div>', unsafe_allow_html=True)

# ── STATS ──
st.markdown("""
<div class="stats-wrap">
  <div><span class="stat-num">$2.4B+</span><div class="stat-lbl">Volume Analyzed</div></div>
  <div><span class="stat-num">50K+</span><div class="stat-lbl">News Articles / Day</div></div>
  <div><span class="stat-num">99.9%</span><div class="stat-lbl">Uptime</div></div>
  <div><span class="stat-num">12ms</span><div class="stat-lbl">Signal Latency</div></div>
</div>
""", unsafe_allow_html=True)

# ── FEATURES ──
st.markdown("""
<div class="feat-wrap">
  <div class="feat-head">Everything you need to trade intelligently</div>
  <div class="feat-sub">From AI news analysis to automated order execution</div>
  <div class="feat-grid">
    <div class="feat-card">
      <span class="feat-icon">🧠</span>
      <div class="feat-title">Grok AI Analysis</div>
      <div class="feat-desc">Real-time sentiment analysis and market impact scoring powered by Grok LLM for precise trading signals.</div>
    </div>
    <div class="feat-card">
      <span class="feat-icon">📰</span>
      <div class="feat-title">News Ingestion Engine</div>
      <div class="feat-desc">Aggregates Bloomberg, CNBC, Reuters, 50+ sources. Events detected and ranked by market impact in seconds.</div>
    </div>
    <div class="feat-card">
      <span class="feat-icon">🤖</span>
      <div class="feat-title">Automated Trading Bots</div>
      <div class="feat-desc">Per-user bots with configurable risk, drawdown limits, Alpaca paper &amp; live trading support.</div>
    </div>
    <div class="feat-card">
      <span class="feat-icon">📊</span>
      <div class="feat-title">Trendline Forecasting</div>
      <div class="feat-desc">ATR-based breakout detection with AI-powered price forecasting across any timeframe.</div>
    </div>
    <div class="feat-card">
      <span class="feat-icon">🔔</span>
      <div class="feat-title">Multi-Channel Alerts</div>
      <div class="feat-desc">Trade alerts via Telegram, WhatsApp, Slack, or email the instant high-impact events are detected.</div>
    </div>
    <div class="feat-card">
      <span class="feat-icon">🔑</span>
      <div class="feat-title">Secure API Access</div>
      <div class="feat-desc">Scoped, rate-limited API keys for external automations. Full audit log.</div>
    </div>
  </div>
</div>
""", unsafe_allow_html=True)

# ── CTA ──
st.markdown("""
<div class="cta-wrap">
  <div class="cta-h">Ready to trade with AI?</div>
  <div class="cta-sub">Join thousands of traders using FinAi to stay ahead of the market.</div>
</div>
""", unsafe_allow_html=True)
_, cb, _ = st.columns([3, 1, 3])
with cb:
    st.markdown('<div class="cta-btn">', unsafe_allow_html=True)
    if st.button("Create Free Account", key="cta_btn", use_container_width=True):
        st.session_state.show_auth = True
        st.session_state.auth_tab = "signup"
        st.rerun()
    st.markdown('</div>', unsafe_allow_html=True)

# ── FOOTER ──
st.markdown("""
<div class="footer-wrap">
  © 2026 FinAi — AI-Powered Financial Intelligence Platform. All rights reserved.
</div>
""", unsafe_allow_html=True)
