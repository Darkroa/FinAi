import streamlit as st
import requests

st.title("✉️ Verify Your Email")

st.write("We have sent a verification link to your registered email.")
st.write("Please check your inbox and click the verification link.")

if st.button(" I have verified my email"):
    try:
        resp = requests.post(
            "http://localhost:8000/api/verify-email",
            headers={"Authorization": f"Bearer {st.session_state.jwt_token}"}
        )
        if resp.status_code == 200:
            st.success("Email verified successfully!")
            st.switch_page("streamlit_dashboard.py")
        else:
            st.error("Verification failed. Please try again.")
    except Exception as e:
        st.error(f"Error: {e}")