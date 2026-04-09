import streamlit as st
import pandas as pd
import requests

st.title("👥 Users Management")

API_BASE = st.session_state.API_BASE
headers = {"Authorization": f"Bearer {st.session_state.admin_jwt}"}

with st.spinner("Loading users..."):
    resp = requests.get(f"{API_BASE}/admin/users", headers=headers)
    users = resp.json() if resp.status_code == 200 else []

if users:
    df = pd.DataFrame(users)
    
    col1, col2 = st.columns([3, 1])
    with col1:
        search = st.text_input("🔍 Search Email or Name", "")
    with col2:
        status_filter = st.selectbox("Status Filter", ["All", "Active", "Banned", "Mail Not Verified"])
    
    filtered = df
    if search:
        filtered = filtered[
            filtered['email'].str.contains(search, case=False, na=False) |
            filtered.get('full_name', '').str.contains(search, case=False, na=False)
        ]
    
    st.dataframe(filtered, use_container_width=True, hide_index=True)
    
    st.divider()
    st.subheader("Quick Edit / Delete")
    email_edit = st.text_input("User Email to Edit/Delete")
    
    if email_edit:
        user = next((u for u in users if u.get("email") == email_edit), None)
        if user:
            c1, c2 = st.columns(2)
            with c1:
                name = st.text_input("Full Name", user.get("full_name", ""))
                capital = st.number_input("Default Capital ($)", value=float(user.get("default_capital", 10000)))
                risk = st.slider("Risk %", 0.5, 5.0, float(user.get("risk_per_trade", 1.0)), 0.1)
            with c2:
                active = st.checkbox("Active", user.get("is_active", True))
                verified = st.checkbox("Mail Verified", user.get("is_mail_verified", False))
                banned = st.checkbox("Banned", user.get("is_banned", False))
            
            if st.button("Update User", type="primary"):
                payload = {
                    "email": email_edit,
                    "full_name": name,
                    "default_capital": capital,
                    "risk_per_trade": risk,
                    "is_active": active,
                    "is_mail_verified": verified,
                    "is_banned": banned
                }
                r = requests.post(f"{API_BASE}/admin/update-user", json=payload, headers=headers)
                if r.status_code == 200:
                    st.success("User updated successfully!")
                    st.rerun()
            
            if st.button("🗑 Delete User", type="secondary"):
                if st.checkbox("Confirm deletion? This cannot be undone."):
                    r = requests.post(f"{API_BASE}/admin/delete-user?email={email_edit}", headers=headers)
                    if r.status_code == 200:
                        st.success("User deleted")
                        st.rerun()
        else:
            st.error("User not found")
else:
    st.info("No users found.")