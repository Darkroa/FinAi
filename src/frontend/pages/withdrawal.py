import streamlit as st
from decimal import Decimal
from datetime import datetime
import yfinance as yf
from src.database.session import SessionLocal
from src.database.models import User, UserMoney

st.set_page_config(page_title="Withdrawal", layout="centered")

st.title("💸 Withdrawal Request")

if "jwt_token" not in st.session_state or not st.session_state.jwt_token:
    st.error("Please login first.")
    st.stop()

user_email = st.session_state.user_email
db = SessionLocal()
user = db.query(User).filter(User.email == user_email).first()

if not user:
    st.error("User not found.")
    st.stop()

st.subheader(f"Available Balance: ${user.default_capital:,.2f} USD")

coin = st.selectbox("Select Cryptocurrency", ["BTC", "ETH", "USDT"])

amount_usd = st.number_input("Amount in USD to Withdraw", 
                           min_value=10.0, 
                           max_value=float(user.default_capital), 
                           value=100.0, 
                           step=10.0)

# Live conversion
try:
    ticker = yf.Ticker(f"{coin}-USD")
    price = ticker.history(period="1d")['Close'].iloc[-1]
    amount_crypto = amount_usd / price
    st.metric(f"Equivalent in {coin}", f"{amount_crypto:.6f} {coin}")
except:
    st.warning("Live price unavailable.")
    amount_crypto = amount_usd / 60000 if coin == "BTC" else amount_usd / 3000 if coin == "ETH" else amount_usd

destination_address = st.text_input(f"{coin} Destination Wallet Address", 
                                  placeholder="Enter your external wallet address")

if st.button("🚀 Submit Withdrawal Request", type="primary"):
    if amount_usd > user.default_capital:
        st.error("Insufficient balance!")
    elif not destination_address.strip():
        st.error("Please enter a valid destination address")
    else:
        withdrawal = UserMoney(
            user_id=user.id,
            user_email=user.email,
            amount_usd=Decimal(str(-amount_usd)),   # negative for withdrawal
            crypto=coin,
            status="pending",
            created_at=datetime.utcnow()
        )
        db.add(withdrawal)
        db.commit()
        
        st.success(f"Withdrawal request for ${amount_usd} submitted successfully!")
        st.info("Your request is now pending admin approval.")
        st.switch_page("user_dashboard.py")

db.close()