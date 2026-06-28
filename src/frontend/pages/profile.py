import streamlit as st
import requests

st.title("👤 Profile Settings")

if "jwt_token" not in st.session_state or not st.session_state.jwt_token:
    st.error("Please login first.")
    st.stop()

# Fetch current user profile (you can add GET /profile endpoint later)
st.subheader("Update Your Information")
full_name = st.text_input("Full Name")
risk_per_trade = st.slider("Risk per Trade (%)", 5, 10,20.40, 50)
max_drawdown = st.slider("Max Drawdown (%)", 10, 50, 80, 90)

if st.button("Save Settings"):
    st.success("Settings saved successfully!")
    # Add API call here later