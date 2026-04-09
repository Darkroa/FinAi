import streamlit as st
import pandas as pd
from src.database.session import SessionLocal
from src.database.models import UserMoney

st.set_page_config(page_title="Transaction History", layout="wide")

st.title("📜 Transaction History")

if "jwt_token" not in st.session_state or not st.session_state.jwt_token:
    st.error("Please login first.")
    st.stop()

user_email = st.session_state.user_email
db = SessionLocal()

transactions = db.query(UserMoney)\
    .filter(UserMoney.user_email == user_email)\
    .order_by(UserMoney.created_at.desc())\
    .all()

if transactions:
    data = []
    for t in transactions:
        amount = float(t.amount_usd)
        data.append({
            "Date": t.created_at.strftime("%Y-%m-%d %H:%M"),
            "Type": "Deposit" if amount > 0 else "Withdrawal",
            "Amount USD": f"${abs(amount):,.2f}",
            "Crypto": t.crypto,
            "Status": t.status.capitalize(),
            "Expires": t.expires_at.strftime("%Y-%m-%d %H:%M") if t.expires_at else "-"
        })

    df = pd.DataFrame(data)
    st.dataframe(df, use_container_width=True, hide_index=True)
    
    st.success(f"Total Transactions: {len(transactions)}")
else:
    st.info("No transactions yet. Make a deposit or withdrawal to see history here.")

db.close()

if st.button("← Back to Dashboard"):
    st.switch_page("user_dashboard.py")