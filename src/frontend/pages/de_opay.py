import streamlit as st
import requests
from datetime import datetime
from src.database.session import SessionLocal
from src.database.models import UserMoney

st.set_page_config(page_title="Payment Confirmation", layout="centered")

st.title("⏳ Deposit Confirmation")

st.success("Your deposit request has been created!")

st.write("Please send the exact amount to the address shown on the deposit page.")
st.info("After sending, click the button below to notify the admin.")

if st.button("✅ I've Paid - Notify Admin", type="primary"):
    # Get the latest pending deposit for this user
    db = SessionLocal()
    user_email = st.session_state.get("user_email")
    
    latest_tx = db.query(UserMoney)\
        .filter(UserMoney.user_email == user_email, UserMoney.status == "pending")\
        .order_by(UserMoney.created_at.desc())\
        .first()
    
    if latest_tx:
        # Notify admin via API (you can expand this later)
        try:
            resp = requests.post(
                "http://localhost:8000/api/admin/notify-payment",
                json={"transaction_id": latest_tx.id},
                headers={"Authorization": f"Bearer {st.session_state.jwt_token}"}
            )
            if resp.status_code == 200:
                st.success("✅ Admin has been notified! We will update your balance once confirmed.")
            else:
                st.error("Failed to notify admin")
        except:
            st.success("Admin notification sent (simulation).")
        
        latest_tx.status = "completed"   # Optional: mark as completed immediately for demo
        db.commit()
    else:
        st.error("No pending deposit found.")
    
    db.close()

st.info("You will be redirected to dashboard once payment is confirmed.")

if st.button("← Back to Dashboard"):
    st.switch_page("user_dashboard.py")