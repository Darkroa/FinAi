import streamlit as st
import yfinance as yf
from datetime import datetime, timedelta
from decimal import Decimal
from src.database.session import SessionLocal
from src.database.models import UserMoney, User
import qrcode
from io import BytesIO
import base64

st.set_page_config(page_title="Deposit", layout="centered")

st.title("💰 Deposit Funds")

if "jwt_token" not in st.session_state or not st.session_state.jwt_token:
    st.error("Please login first.")
    st.stop()

user_email = st.session_state.user_email
db = SessionLocal()
user = db.query(User).filter(User.email == user_email).first()

if not user:
    st.error("User not found.")
    st.stop()

# Coin data
coin_data = {
    "BTC": {"name": "Bitcoin", "symbol": "BTC", "min": 0.00001, "address": "1FMXu8fTqFHALrsxavrYAS5wD3urbPk6hh"},
    "ETH": {"name": "Ethereum", "symbol": "ETH", "min": 0.001,   "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"},
    "USDT": {"name": "Tether (ERC20)", "symbol": "USDT", "min": 1.0, "address": "0x28c6c06298d514db089934071355e5743bf21d60"}
}

selected_coin = st.selectbox("Select Cryptocurrency", options=list(coin_data.keys()))

coin = coin_data[selected_coin]

st.subheader(f"Deposit {coin['name']} ({coin['symbol']})")

# Amount in USD
amount_usd = st.number_input("Amount in USD ($)", min_value=10.0, value=100.0, step=10.0)

# Live crypto price & equivalent
try:
    ticker = yf.Ticker(f"{selected_coin}-USD")
    price = ticker.history(period="1d")['Close'].iloc[-1]
    amount_crypto = amount_usd / price
    st.metric(f"Equivalent in {selected_coin}", f"{amount_crypto:.6f} {selected_coin}")
    st.metric("Current Price", f"${price:,.2f}")
except:
    st.error("Could not fetch live price. Using approximate values.")
    amount_crypto = amount_usd / 60000 if selected_coin == "BTC" else amount_usd / 3000 if selected_coin == "ETH" else amount_usd

if amount_crypto < coin["min"]:
    st.warning(f"Minimum deposit is {coin['min']} {selected_coin}")

# QR Code
qr = qrcode.make(coin["address"])
buffer = BytesIO()
qr.save(buffer, format="PNG")
qr_base64 = base64.b64encode(buffer.getvalue()).decode()

st.image(f"data:image/png;base64,{qr_base64}", width=200)

st.code(coin["address"], language=None)
if st.button("📋 Copy Address"):
    st.success("Address copied to clipboard! (In real app this would use JS)")

st.info(f"**Important:** Send only {selected_coin} on the correct network. Wrong network = loss of funds.")

if st.button(" Confirm Deposit Request", type="primary"):
    if amount_usd < 10:
        st.error("Minimum deposit is $10")
    else:
        expires = datetime.utcnow() + timedelta(hours=1)
        
        deposit = UserMoney(
            user_id=user.id,
            user_email=user.email,
            amount_usd=Decimal(str(amount_usd)),
            crypto=selected_coin,
            status="pending",
            expires_at=expires
        )
        db.add(deposit)
        db.commit()
        
        st.success(f"Deposit request for ${amount_usd} ({amount_crypto:.6f} {selected_coin}) created!")
        st.info("Waiting for payment confirmation... (expires in 1 hour)")
        
        # Redirect to payment confirmation page
        st.switch_page("pages/de_opay.py")

db.close()