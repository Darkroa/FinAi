import streamlit as st
import requests

st.title("⚙️ System & Celery Monitoring")

API_BASE = st.session_state.API_BASE
headers = {"Authorization": f"Bearer {st.session_state.admin_jwt}"}

col1, col2 = st.columns(2)

with col1:
    st.subheader("Celery Workers")
    if st.button("Refresh Worker Status"):
        try:
            r = requests.get(f"{API_BASE}/celery/workers", headers=headers)
            if r.status_code == 200:
                data = r.json()
                st.write(f"**Active Workers:** {data.get('active_workers', 0)}")
                st.json(data)
            else:
                st.error("Failed to fetch worker status")
        except:
            st.error("Celery not reachable")

    flower_url = "http://localhost:5555"
    st.markdown(f"[🌸 Open Flower Dashboard (Real-time)]({flower_url})")

with col2:
    st.subheader("API & Health")
    if st.button("Check API Health"):
        try:
            r = requests.get(f"{API_BASE}/health")
            st.success(f"API Status: {r.json()}")
        except:
            st.error("API unreachable")

st.divider()
st.info("You can add Redis status, logs viewer, or backup buttons here.")