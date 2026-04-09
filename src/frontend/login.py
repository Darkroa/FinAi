import streamlit as st
import requests
import jwt

st.set_page_config(page_title="FinAi - Login", layout="centered")

API_BASE = "http://localhost:8000/api"   # Change to production URL later

# Session State
if "jwt_token" not in st.session_state:
    st.session_state.jwt_token = None
if "user_email" not in st.session_state:
    st.session_state.user_email = None

def login_user(email: str, password: str):
    try:
        resp = requests.post(f"{API_BASE}/auth/login", json={"email": email, "password": password})
        if resp.status_code == 200:
            data = resp.json()
            st.session_state.jwt_token = data["access_token"]
            decoded = jwt.decode(data["access_token"], options={"verify_signature": False})
            st.session_state.user_email = decoded.get("sub")
            st.success("✅ Login successful!")
            st.rerun()
        else:
            st.error("❌ Invalid email or password")
    except Exception as e:
        st.error(f"Login failed: {str(e)}")

def signup_user(email: str, password: str, full_name: str):
    try:
        resp = requests.post(f"{API_BASE}/auth/signup", json={
            "email": email,
            "password": password,
            "full_name": full_name
        })
        if resp.status_code == 200:
            st.success("✅ Account created successfully! Please log in.")
            st.session_state.show_login = True
            st.rerun()
        else:
            st.error(f"Signup failed: {resp.json().get('detail', 'Unknown error')}")
    except Exception as e:
        st.error(f"Signup error: {str(e)}")

def logout():
    st.session_state.jwt_token = None
    st.session_state.user_email = None
    st.rerun()

# ===================== LOGIN / SIGNUP PAGE =====================
st.title("🔐 Welcome to FinAi")
st.markdown("### Intelligent Trading & Investment Platform")

tab1, tab2 = st.tabs(["Sign In", "Create Account"])

with tab1:
    with st.form("login_form"):
        st.subheader("Sign In")
        email = st.text_input("Email Address")
        password = st.text_input("Password", type="password")
        if st.form_submit_button("Login", use_container_width=True):
            login_user(email, password)

with tab2:
    with st.form("signup_form"):
        st.subheader("Create New Account")
        full_name = st.text_input("Full Name")
        email = st.text_input("Email Address")
        password = st.text_input("Password", type="password")
        password_confirm = st.text_input("Confirm Password", type="password")

        if st.form_submit_button("Create Account", use_container_width=True):
            if password != password_confirm:
                st.error("Passwords do not match")
            elif len(password) < 6:
                st.error("Password must be at least 6 characters")
            else:
                signup_user(email, password, full_name)

st.divider()
st.info("**Demo Admin Account**\n\n`admin@finevent.ai` / `AdminChangeMe123!`")