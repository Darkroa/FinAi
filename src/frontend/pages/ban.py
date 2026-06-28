import streamlit as st

st.title("🚫 Account Banned")

st.error("Your account has been banned  for user violations.")
st.write("If you believe this is a mistake, please contact support.")

if st.button("Logout"):
    st.session_state.jwt_token = None
    st.session_state.user_email = None
    st.switch_page("streamlit_dashboard.py")