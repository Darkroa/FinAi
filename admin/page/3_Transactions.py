import streamlit as st
import pandas as pd
import requests

st.title("💰 Transaction Management")

API_BASE = st.session_state.API_BASE
headers = {"Authorization": f"Bearer {st.session_state.admin_jwt}"}

with st.spinner("Loading transactions..."):
    resp = requests.get(f"{API_BASE}/admin/transactions", headers=headers)
    txs = resp.json() if resp.status_code == 200 else []

if txs:
    df = pd.DataFrame(txs)
    st.dataframe(df, use_container_width=True, hide_index=True)
    
    st.divider()
    st.subheader("Approve or Reject Transaction")
    tx_id = st.text_input("Transaction ID")
    
    col1, col2 = st.columns(2)
    with col1:
        if st.button("✅ Approve Transaction", type="primary", use_container_width=True):
            if tx_id:
                r = requests.post(
                    f"{API_BASE}/admin/approve-transaction",
                    json={"transaction_id": tx_id},
                    headers=headers
                )
                if r.status_code == 200:
                    st.success("Transaction approved and user balance updated!")
                    st.rerun()
                else:
                    st.error("Failed to approve")
    with col2:
        if st.button("❌ Reject Transaction", use_container_width=True):
            if tx_id:
                r = requests.post(
                    f"{API_BASE}/admin/reject-transaction",
                    json={"transaction_id": tx_id},
                    headers=headers
                )
                if r.status_code == 200:
                    st.success("Transaction rejected")
                    st.rerun()
else:
    st.info("No transactions at the moment.")