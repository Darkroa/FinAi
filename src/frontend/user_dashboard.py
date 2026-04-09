import streamlit as st
import yfinance as yf
import plotly.graph_objects as go
from datetime import datetime

from src.database.session import SessionLocal
from src.database.models import User
from src.users.bot_manager import get_user_bot_manager
from src.analysis.full_analyzer import FullAnalyzer

st.set_page_config(page_title="FinAi Dashboard", layout="wide", initial_sidebar_state="expanded")

# ===================== AUTH CHECK =====================
if "jwt_token" not in st.session_state or not st.session_state.jwt_token:
    st.error("Please log in first")
    st.switch_page("login.py")

user_email = st.session_state.get("user_email")
if not user_email:
    st.switch_page("login.py")

db = SessionLocal()
user = db.query(User).filter(User.email == user_email).first()

if not user:
    st.error("User session invalid. Please login again.")
    st.switch_page("login.py")

# ===================== CUSTOM STYLING =====================
st.markdown("""
<style>
    .main { background-color: #0e1117; }
    .balance-card {
        background: linear-gradient(135deg, #1a1f2e, #00ff8822);
        border-radius: 16px;
        padding: 25px;
        border: 2px solid #00ff88;
        box-shadow: 0 8px 25px rgba(0, 255, 136, 0.15);
    }
    h1 { color: #00ff88; }
</style>
""", unsafe_allow_html=True)

# ===================== HEADER =====================
col1, col2, col3 = st.columns([1, 6, 1])
with col1:
    first_letter = (user.full_name or user_email)[0].upper()
    st.markdown(f"""
        <div style="width:60px;height:60px;border-radius:50%;background:#00ff88;color:#000;
        display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;">
            {first_letter}
        </div>
    """, unsafe_allow_html=True)

with col2:
    st.title(f"Welcome back, {user.full_name or user_email.split('@')[0]}")

with col3:
    if st.button("Logout"):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.switch_page("login.py")

st.divider()

# ===================== BALANCE CARD =====================
st.subheader("💰 Account Overview")
col_bal, col_actions = st.columns([3, 1])

with col_bal:
    st.markdown('<div class="balance-card">', unsafe_allow_html=True)
    st.metric("USD Balance", f"${user.default_capital:,.2f}")
    try:
        btc = yf.Ticker("BTC-USD").history(period="1d")['Close'].iloc[-1]
        st.metric("BTC Equivalent", f"{user.default_capital / btc:.6f} BTC")
    except:
        pass
    st.markdown('</div>', unsafe_allow_html=True)

with col_actions:
    st.button("💵 Top Up", use_container_width=True, type="primary")
    if st.button("👁 Hide Balance"):
        st.session_state.show_balance = False

# ===================== SIDEBAR NAVIGATION =====================
with st.sidebar:
    st.markdown("### Navigation")
    page = st.radio("Go to", ["Overview", "Trading Bots", "Market Analysis", "Funds", "Account"], label_visibility="collapsed")

# ===================== OVERVIEW =====================
if page == "Overview":
    st.title("Dashboard Overview")
    cols = st.columns(4)
    with cols[0]: st.metric("Default Capital", f"${user.default_capital:,.0f}")
    with cols[1]: st.metric("Risk per Trade", f"{user.risk_per_trade}%")
    with cols[2]: st.metric("Max Drawdown", f"{user.max_drawdown}%")
    with cols[3]:
        manager = get_user_bot_manager(user.email, user.id)
        st.metric("Active Bots", len(manager.get_status()))

    # Sample Chart
    st.subheader("AAPL Market Snapshot")
    try:
        df = yf.download("AAPL", period="3mo", interval="1d", progress=False)
        fig = go.Figure(data=[go.Candlestick(x=df.index,
                                             open=df['Open'], high=df['High'],
                                             low=df['Low'], close=df['Close'])])
        fig.update_layout(title="AAPL Price (Last 3 Months)", template="plotly_dark", height=500)
        st.plotly_chart(fig, use_container_width=True)
    except Exception as e:
        st.info("Chart data temporarily unavailable.")

# ===================== TRADING BOTS =====================
elif page == "Trading Bots":
    st.title("🤖 My Trading Bots")
    manager = get_user_bot_manager(user.email, user.id)
    status = manager.get_status()

    if status:
        for ticker, s in status.items():
            st.subheader(f"{ticker} Bot")
            col1, col2 = st.columns([3, 1])
            with col1:
                st.write(f"Portfolio Value: **${s.get('portfolio_value', 0):,.2f}**")
            with col2:
                if st.button("Stop", key=f"stop_{ticker}"):
                    manager.stop_bot(ticker)
                    st.rerun()
    else:
        st.info("No active bots. Launch one below.")

    st.divider()
    ticker = st.text_input("Ticker", value="AAPL")
    paper = st.checkbox("Paper Trading Mode", value=True)
    if st.button("🚀 Start New Bot", type="primary"):
        result = manager.start_bot(ticker, paper)
        st.success(result)
        st.rerun()

db.close()