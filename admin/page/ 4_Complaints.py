import streamlit as st
import requests

st.title("📩 Complaints & Messages")

API_BASE = st.session_state.API_BASE
headers = {"Authorization": f"Bearer {st.session_state.admin_jwt}"}

with st.spinner("Loading complaints..."):
    resp = requests.get(f"{API_BASE}/admin/complaints", headers=headers)
    complaints = resp.json() if resp.status_code == 200 else []

if complaints:
    for c in complaints:
        with st.expander(f"📨 {c.get('subject')} — {c.get('user_email')}"):
            st.write(f"**Message:** {c.get('message')}")
            st.write(f"**Submitted:** {c.get('created_at')}")
            
            reply = st.text_area("Your Reply", key=f"reply_{c.get('id')}")
            
            col1, col2 = st.columns(2)
            with col1:
                if st.button("Send Reply", key=f"send_{c.get('id')}"):
                    if reply:
                        requests.post(
                            f"{API_BASE}/admin/reply-complaint",
                            json={"complaint_id": c.get('id'), "reply": reply},
                            headers=headers
                        )
                        st.success("Reply sent!")
                        st.rerun()
            with col2:
                if st.button("Mark as Closed", key=f"close_{c.get('id')}"):
                    requests.post(
                        f"{API_BASE}/admin/close-complaint",
                        json={"complaint_id": c.get('id')},
                        headers=headers
                    )
                    st.success("Complaint closed")
                    st.rerun()
else:
    st.info("No complaints received yet.")