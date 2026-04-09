import streamlit as st
import pandas as pd
import requests

st.title("📊 Dashboard Overview")

API_BASE = st.session_state.API_BASE
headers = {"Authorization": f"Bearer {st.session_state.admin_jwt}"}

col1, col2, col3, col4 = st.columns(4)

with st.spinner("Loading metrics..."):
    try:
        users_resp = requests.get(f"{API_BASE}/admin/users", headers=headers)
        tx_resp = requests.get(f"{API_BASE}/admin/transactions", headers=headers)
        
        total_users = len(users_resp.json()) if users_resp.status_code == 200 else 0
        transactions = tx_resp.json() if tx_resp.status_code == 200 else []
        pending_tx = len([t for t in transactions if t.get("status") in ["pending", "payment_reported"]])
    except:
        total_users = 0
        pending_tx = 0

with col1:
    st.metric("Total Users", total_users)
with col2:
    st.metric("Pending Transactions", pending_tx)
with col3:
    st.metric("Open Complaints", "12")   # Update when /admin/complaints is ready
with col4:
    st.metric("Active Bots", "47")

st.divider()

st.subheader("Recent Activity Trend")
# Demo chart - replace with real data from your API later
chart_data = pd.DataFrame({
    "Date": pd.date_range("2026-04-01", periods=7),
    "New Users": [8, 15, 12, 22, 18, 25, 19],
    "Transactions": [3, 7, 5, 11, 8, 14, 9]
})
st.line_chart(chart_data, x="Date", use_container_width=True)