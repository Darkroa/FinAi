import streamlit as st
import yfinance as yf
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime

from src.database.session import SessionLocal
from src.database.models import User, TrendAnalysis
from src.users.bot_manager import get_user_bot_manager
from src.analysis.full_analyzer import FullAnalyzer

st.set_page_config(page_title="FinAi", layout="wide", initial_sidebar_state="expanded")

# ===================== AUTH PROTECTION =====================
if "jwt_token" not in st.session_state or not st.session_state.jwt_token:
    st.switch_page("login.py")

user_email = st.session_state.user_email
db = SessionLocal()
user = db.query(User).filter(User.email == user_email).first()

if not user:
    st.error("Session invalid.")
    st.switch_page("login.py")

# ===================== CUSTOM CSS FOR PREMIUM LOOK =====================
st.markdown("""
<style>
    .main { background-color: #0e1117; }
    .stMetric {
        background-color: #1a1f2e;
        padding: 15px 20px;
        border-radius: 12px;
        border: 1px solid #00ff8833;
        box-shadow: 0 4px 12px rgba(0, 255, 136, 0.1);
    }
    .stMetric label { color: #00ff88; font-weight: 600; }
    .bot-card {
        background-color: #1a1f2e;
        border-radius: 12px;
        padding: 20px;
        border: 1px solid #00ff8833;
        margin-bottom: 15px;
    }
    .balance-card {
        background: linear-gradient(135deg, #1a1f2e, #00ff8822);
        border-radius: 16px;
        padding: 25px;
        border: 2px solid #00ff88;
        box-shadow: 0 8px 25px rgba(0, 255, 136, 0.15);
    }
    h1 { color: #00ff88; font-weight: 700; }
</style>
""", unsafe_allow_html=True)

# ===================== TOP BAR =====================
col_avatar, col_title, col_notify, col_logout = st.columns([0.8, 5, 1, 1])

with col_avatar:
    first_letter = (user.full_name or user_email)[0].upper()
    st.markdown(f"""
        <div style="width:56px;height:56px;border-radius:50%;background:#00ff88;color:#000;
        display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;border:3px solid #fff;">
            {first_letter}
        </div>
    """, unsafe_allow_html=True)

with col_title:
    st.markdown("<h1 style='margin:0;padding-top:8px;'>FinAi</h1>", unsafe_allow_html=True)

with col_notify:
    if st.button("🛎️", help="Notifications"):
        st.info("No new notifications.")

with col_logout:
    if st.button("Logout"):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.switch_page("login.py")

st.markdown("---")

# ===================== FANCY BALANCE CARD =====================
st.subheader("💰 Account Balance")

if "show_balance" not in st.session_state:
    st.session_state.show_balance = True

with st.container():
    col_bal, col_actions = st.columns([3.5, 1.5])
    
    with col_bal:
        st.markdown('<div class="balance-card">', unsafe_allow_html=True)
        if st.session_state.show_balance:
            usd = user.default_capital
            try:
                btc = yf.Ticker("BTC-USD")
                btc_price = btc.history(period="1d")['Close'].iloc[-1]
                btc_eq = usd / btc_price
                st.metric("USD Balance", f"${usd:,.2f}", delta=None)
                st.metric("BTC Equivalent", f"{btc_eq:.6f} BTC")
            except:
                st.metric("USD Balance", f"${usd:,.2f}")
        else:
            st.metric("USD Balance", "•••••• ••••")
            st.metric("BTC Equivalent", "••••••")
        st.markdown('</div>', unsafe_allow_html=True)

    with col_actions:
        if st.button("👁 Toggle Balance", use_container_width=True):
            st.session_state.show_balance = not st.session_state.show_balance
            st.rerun()
        if st.button("💵 Top Up", use_container_width=True, type="primary"):
            st.success("Top-up feature coming soon!")

st.markdown("---")

# Quick Actions
col_a, col_b, col_c = st.columns(3)
with col_a:
    if st.button("🖥️ Rent Trading Server", use_container_width=True):
        st.switch_page("pages/rent_server.py")
with col_b:
    if st.button("💼 Digital Investment", use_container_width=True):
        st.switch_page("pages/digital_investment.py")
with col_c:
    if st.button("🤖 Ask FinAi", use_container_width=True):
        st.markdown('<a href="http://localhost:7860" target="_blank">Open FinAi Chat →</a>', unsafe_allow_html=True)

st.markdown("---")

# ===================== SIDEBAR =====================
with st.sidebar:
    st.markdown("### Navigation")
    main_page = st.radio("Section", ["Overview", "Trading", "Funds", "Analysis", "Account"], label_visibility="collapsed")

    if main_page == "Trading":
        sub_page = st.radio("Trading", ["My Bots", "Trade History"])
    elif main_page == "Funds":
        sub_page = st.radio("Funds", ["Deposit", "Withdrawal", "Transaction History"])
    elif main_page == "Analysis":
        sub_page = st.radio("Analysis", ["Quick Analysis", "My Analysis History"])
    elif main_page == "Account":
        sub_page = st.radio("Account", ["Profile Settings", "API Keys", "Reset Password", "Contact Us"])
    else:
        sub_page = "Overview"

# ===================== OVERVIEW (with Sample Chart) =====================
if main_page == "Overview":
    st.title("Dashboard Overview")
    
    col1, col2, col3, col4 = st.columns(4)
    with col1: st.metric("Default Capital", f"${user.default_capital:,.0f}")
    with col2: st.metric("Risk per Trade", f"{user.risk_per_trade}%")
    with col3: st.metric("Max Drawdown", f"{user.max_drawdown}%")
    with col4: 
        manager = get_user_bot_manager(user.email, user.id)
        st.metric("Active Bots", len(manager.get_status() or {}))

    st.divider()
    st.subheader("Market Snapshot - AAPL")
    
    # Sample Price Chart (Candlestick + Moving Average)
    try:
        df = yf.download("AAPL", period="3mo", interval="1d", progress=False)
        fig = go.Figure()
        fig.add_trace(go.Candlestick(
            x=df.index,
            open=df['Open'],
            high=df['High'],
            low=df['Low'],
            close=df['Close'],
            name="AAPL"
        ))
        fig.add_trace(go.Scatter(
            x=df.index, y=df['Close'].rolling(20).mean(),
            line=dict(color='#00ff88', width=2), name="20-day MA"
        ))
        fig.update_layout(
            title="AAPL Price Chart (Last 3 Months)",
            xaxis_title="Date",
            yaxis_title="Price (USD)",
            template="plotly_dark",
            height=500,
            plot_bgcolor="#1a1f2e",
            paper_bgcolor="#0e1117"
        )
        st.plotly_chart(fig, use_container_width=True)
    except:
        st.info("Chart temporarily unavailable.")

# ===================== TRADING - IMPROVED MY BOTS PAGE =====================
elif main_page == "Trading" and sub_page == "My Bots":
    st.title("🤖 My Trading Bots")
    
    manager = get_user_bot_manager(user.email, user.id)
    status = manager.get_status()

    if status:
        for ticker, s in status.items():
            st.markdown(f'<div class="bot-card">', unsafe_allow_html=True)
            col1, col2, col3 = st.columns([3, 2, 1])
            with col1:
                st.subheader(f"{ticker} Bot")
                st.write(f"**Portfolio Value:** ${s.get('portfolio_value', 0):,.2f}")
            with col2:
                st.metric("Unrealized P&L", f"${s.get('unrealized_pnl', 0):.2f}", 
                         delta=f"{s.get('unrealized_pnl', 0):+.2f}")
                st.write(f"Position: {s.get('position', 0):.4f} shares")
            with col3:
                if st.button("Stop Bot", key=f"stop_{ticker}", type="secondary"):
                    manager.stop_bot(ticker)
                    st.success(f"{ticker} bot stopped")
                    st.rerun()
            st.markdown('</div>', unsafe_allow_html=True)
    else:
        st.warning("You don't have any active bots yet.")

    st.divider()
    st.subheader("🚀 Launch New Bot")
    col_t, col_p = st.columns([3, 1])
    with col_t:
        ticker = st.text_input("Ticker Symbol", value="SPX", key="bot_ticker")
    with col_p:
        paper = st.checkbox("Paper Trading", value=True, key="bot_paper")
    
    if st.button("Start Bot", type="primary", use_container_width=True):
        result = manager.start_bot(ticker, paper)
        st.success(result)
        st.rerun()

# (Other pages like Quick Analysis, Trade History, etc. remain similar to previous version — you can keep them)

db.close()