import streamlit as st

st.set_page_config(
    page_title="FinForgeAI Admin",
    page_icon="🔧",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Share API base across all pages
if "API_BASE" not in st.session_state:
    st.session_state.API_BASE = "http://localhost:8000/api"

# ===================== ADMIN LOGIN =====================
if "admin_jwt" not in st.session_state:
    st.session_state.admin_jwt = None

if not st.session_state.admin_jwt:
    st.title("🔧 FinForgeAI Admin Login")
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        email = st.text_input("Admin Email", placeholder="admin@finforge.ai")
        password = st.text_input("Password", type="password")
        
        if st.button("Login", type="primary", use_container_width=True):
            with st.spinner("Authenticating..."):
                import requests
                try:
                    resp = requests.post(
                        f"{st.session_state.API_BASE}/auth/login",
                        json={"email": email, "password": password}
                    )
                    if resp.status_code == 200:
                        st.session_state.admin_jwt = resp.json()["access_token"]
                        st.success("Login successful!")
                        st.rerun()
                    else:
                        st.error("Invalid admin credentials")
                except Exception as e:
                    st.error(f"Connection failed: {e}")
    st.stop()

# ===================== SIDEBAR NAVIGATION =====================
st.sidebar.title("🔧 FinForgeAI Admin")
st.sidebar.success("Connected to Backend")

pg = st.navigation({
    "📊 Overview": st.Page("pages/1_Overview.py", title="Overview"),
    "👥 Users": st.Page("pages/2_Users.py", title="Users Management"),
    "💰 Transactions": st.Page("pages/3_Transactions.py", title="Transactions"),
    "📩 Complaints": st.Page("pages/4_Complaints.py", title="Complaints"),
    "⚙️ System & Celery": st.Page("pages/5_System.py", title="System"),
})

pg.run()

# Logout button
if st.sidebar.button("🚪 Logout"):
    st.session_state.admin_jwt = None
    st.rerun()