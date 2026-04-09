import streamlit as st
import requests

st.title("🪪 Complete Account Verification")

with st.form("verify_form"):
    username = st.text_input("Username")
    first_name = st.text_input("First Name")
    middle_name = st.text_input("Middle Name")
    last_name = st.text_input("Last Name")
    sex = st.selectbox("Sex", ["Male", "Female", "Other"])
    phone = st.text_input("Phone Number")
    country = st.text_input("Country")
    dob = st.date_input("Date of Birth")
    address = st.text_area("Full Address")

    if st.form_submit_button("Submit Verification"):
        try:
            resp = requests.post(
                "http://localhost:8000/api/verify-account",
                json={
                    "username": username,
                    "first_name": first_name,
                    "middle_name": middle_name,
                    "last_name": last_name,
                    "sex": sex,
                    "phone": phone,
                    "country": country,
                    "dob": str(dob),
                    "address": address
                },
                headers={"Authorization": f"Bearer {st.session_state.jwt_token}"}
            )
            if resp.status_code == 200:
                st.success(" Account verified successfully!")
                st.switch_page("streamlit_dashboard.py")
            else:
                st.error("Verification failed")
        except Exception as e:
            st.error(f"Error: {e}")