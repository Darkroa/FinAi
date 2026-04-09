import streamlit as st
import pandas as pd
from datetime import datetime
import io
from src.database.session import SessionLocal
from src.database.models import User

st.set_page_config(page_title="FinForgeAI Admin", layout="wide")

st.title("🔧 FinForgeAI Admin Panel")

db = SessionLocal()



if "admin_jwt" not in st.session_state:
    st.session_state.admin_jwt = None

if not st.session_state.admin_jwt:
    st.title("🔧 Admin Login")
    email = st.text_input("Admin Email")
    password = st.text_input("Password", type="password")
    if st.button("Login as Admin"):
        resp = requests.post(f"{API_BASE}/auth/login", json={"email": email, "password": password})
        if resp.status_code == 200:
            st.session_state.admin_jwt = resp.json()["access_token"]
            st.rerun()
        else:
            st.error("Invalid admin credentials")
    st.stop()

st.title("🔧 FinForgeAI Admin Panel")

headers = {"Authorization": f"Bearer {st.session_state.admin_jwt}"}

# ===================== ALL USERS TABLE WITH SEARCH & FILTER =====================
st.subheader("All Users")

users = db.query(User).all()


tab1, tab2 = st.tabs(["Users", "Complaints"])

# ===================== USERS TAB =====================
with tab1:
    st.subheader("All Users")
    resp = requests.get(f"{API_BASE}/admin/users", headers=headers)
    users = resp.json() if resp.status_code == 200 else []
    df = pd.DataFrame(users)
    st.dataframe(df, use_container_width=True)

# ===================== COMPLAINTS TAB =====================
with tab2:
    st.subheader("User Complaints & Messages")
    
    resp = requests.get(f"{API_BASE}/admin/complaints", headers=headers)
    complaints = resp.json() if resp.status_code == 200 else []
    
    if complaints:
        for c in complaints:
            with st.expander(f"📩 {c['subject']} - {c['user_email']} ({c['status']})"):
                st.write(f"**Message:** {c['message']}")
                st.write(f"**Submitted:** {c['created_at']}")
                
                reply = st.text_area("Your Reply (will be sent via email)", key=f"reply_{c['id']}")
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("Send Reply", key=f"send_{c['id']}"):
                        if reply:
                            requests.post(f"{API_BASE}/admin/reply-complaint", 
                                        json={"complaint_id": c['id'], "reply": reply},
                                        headers=headers)
                            st.success("Reply sent!")
                            st.rerun()
                with col2:
                    if st.button("Mark as Closed", key=f"close_{c['id']}"):
                        requests.post(f"{API_BASE}/admin/close-complaint", 
                                    json={"complaint_id": c['id']}, headers=headers)
                        st.success("Complaint closed")
                        st.rerun()
    else:
        st.info("No complaints yet.")


# Search and Filter
search_term = st.text_input("Search by Email or Name", "")
filter_status = st.selectbox("Filter by Status", ["All", "Active", "Inactive", "Banned", "Mail Not Verified"])

# Apply filters
filtered_users = users
if search_term:
    filtered_users = [u for u in filtered_users if search_term.lower() in (u.email or "").lower() or 
                      search_term.lower() in (u.full_name or "").lower()]

if filter_status != "All":
    if filter_status == "Active":
        filtered_users = [u for u in filtered_users if u.is_active]
    elif filter_status == "Inactive":
        filtered_users = [u for u in filtered_users if not u.is_active]
    elif filter_status == "Banned":
        filtered_users = [u for u in filtered_users if u.is_banned]
    elif filter_status == "Mail Not Verified":
        filtered_users = [u for u in filtered_users if not u.is_mail_verified]

# Display table
data = []
for u in filtered_users:
    data.append({
        "ID": u.id,
        "Email": u.email,
        "Full Name": u.full_name or "-",
        "Username": u.username or "-",
        "Active": "✅" if u.is_active else "❌",
        "Mail Verified": "✅" if u.is_mail_verified else "❌",
        "Banned": "🚫" if u.is_banned else "✅",
        "Capital (USD)": f"${u.default_capital:,.2f}",
        "Risk %": u.risk_per_trade,
        "Max DD %": u.max_drawdown,
        "Created": u.created_at.strftime("%Y-%m-%d")
    })

df = pd.DataFrame(data)

# Select rows for bulk actions
selected_rows = st.data_editor(
    df,
    hide_index=True,
    use_container_width=True,
    column_config={
        "ID": st.column_config.NumberColumn(disabled=True),
        "Email": st.column_config.TextColumn(disabled=True),
    }
)

# ===================== BULK ACTIONS =====================
st.subheader("Bulk Actions")
col1, col2, col3, col4 = st.columns(4)

with col1:
    if st.button("Ban Selected Users"):
        selected_ids = selected_rows[selected_rows["Banned"] == "✅"]["ID"].tolist()  # Only non-banned
        for uid in selected_ids:
            user = db.query(User).filter(User.id == uid).first()
            if user:
                user.is_banned = True
        db.commit()
        st.success("Selected users banned.")
        st.rerun()

with col2:
    if st.button("Unban Selected Users"):
        selected_ids = selected_rows[selected_rows["Banned"] == "🚫"]["ID"].tolist()
        for uid in selected_ids:
            user = db.query(User).filter(User.id == uid).first()
            if user:
                user.is_banned = False
        db.commit()
        st.success("Selected users unbanned.")
        st.rerun()

with col3:
    if st.button("Activate Selected"):
        selected_ids = selected_rows["ID"].tolist()
        for uid in selected_ids:
            user = db.query(User).filter(User.id == uid).first()
            if user:
                user.is_active = True
        db.commit()
        st.success("Selected users activated.")
        st.rerun()

with col4:
    if st.button("Deactivate Selected"):
        selected_ids = selected_rows["ID"].tolist()
        for uid in selected_ids:
            user = db.query(User).filter(User.id == uid).first()
            if user:
                user.is_active = False
        db.commit()
        st.success("Selected users deactivated.")
        st.rerun()

# ===================== SINGLE USER UPDATE & DELETE =====================
st.divider()
st.subheader("Update or Delete User")

email_to_edit = st.text_input("Enter Email to Edit or Delete")

if email_to_edit:
    user = db.query(User).filter(User.email == email_to_edit).first()
    if user:
        st.write(f"Editing: **{user.email}**")
        
        col1, col2 = st.columns(2)
        with col1:
            new_full_name = st.text_input("Full Name", value=user.full_name or "")
            new_capital = st.number_input("Default Capital (USD)", value=user.default_capital)
            new_risk = st.slider("Risk per Trade (%)", 0.5, 5.0, float(user.risk_per_trade), 0.1)
            new_max_dd = st.slider("Max Drawdown (%)", 5.0, 25.0, float(user.max_drawdown), 1.0)

        with col2:
            new_active = st.checkbox("Is Active", value=user.is_active)
            new_mail_verified = st.checkbox("Mail Verified", value=user.is_mail_verified)
            new_banned = st.checkbox("Is Banned", value=user.is_banned)

        if st.button("Update User"):
            user.full_name = new_full_name
            user.default_capital = new_capital
            user.risk_per_trade = new_risk
            user.max_drawdown = new_max_dd
            user.is_active = new_active
            user.is_mail_verified = new_mail_verified
            user.is_banned = new_banned
            db.commit()
            st.success("User updated!")
            st.rerun()

        if st.button("🗑 Delete User", type="secondary"):
            if st.checkbox("Confirm deletion of this user?"):
                db.delete(user)
                db.commit()
                st.success("User deleted.")
                st.rerun()
    else:
        st.error("User not found.")

# ===================== EXPORT TO CSV =====================
if st.button("📥 Export All Users to CSV"):
    csv = df.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="Download CSV",
        data=csv,
        file_name=f"users_{datetime.now().strftime('%Y%m%d')}.csv",
        mime="text/csv"
    )
import streamlit as st
import pandas as pd
import requests
from datetime import datetime
from src.database.session import SessionLocal
from src.database.models import User, Complaint

st.set_page_config(page_title="FinForgeAI Admin", layout="wide")

st.title("🔧 FinForgeAI Admin Panel")

API_BASE = "http://localhost:8000/api"

# Admin JWT Login
if "admin_jwt" not in st.session_state:
    st.session_state.admin_jwt = None

if not st.session_state.admin_jwt:
    st.subheader("Admin Login")
    email = st.text_input("Admin Email")
    password = st.text_input("Password", type="password")
    if st.button("Login as Admin"):
        resp = requests.post(f"{API_BASE}/auth/login", json={"email": email, "password": password})
        if resp.status_code == 200:
            st.session_state.admin_jwt = resp.json()["access_token"]
            st.rerun()
        else:
            st.error("Invalid admin credentials")
    st.stop()

headers = {"Authorization": f"Bearer {st.session_state.admin_jwt}"}

tab1, tab2 = st.tabs(["Users", "Complaints"])

# ===================== USERS TAB =====================
with tab1:
    st.subheader("All Users")
    resp = requests.get(f"{API_BASE}/admin/users", headers=headers)
    users = resp.json() if resp.status_code == 200 else []
    df = pd.DataFrame(users)
    st.dataframe(df, use_container_width=True)

# ===================== COMPLAINTS TAB =====================
with tab2:
    st.subheader("User Complaints & Messages")
    
    resp = requests.get(f"{API_BASE}/admin/complaints", headers=headers)
    complaints = resp.json() if resp.status_code == 200 else []
    
    if complaints:
        for c in complaints:
            with st.expander(f"📩 {c['subject']} - {c['user_email']} ({c['status']})"):
                st.write(f"**Message:** {c['message']}")
                st.write(f"**Submitted:** {c['created_at']}")
                
                reply = st.text_area("Your Reply (will be sent via email)", key=f"reply_{c['id']}")
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("Send Reply", key=f"send_{c['id']}"):
                        if reply:
                            requests.post(f"{API_BASE}/admin/reply-complaint", 
                                        json={"complaint_id": c['id'], "reply": reply},
                                        headers=headers)
                            st.success("Reply sent!")
                            st.rerun()
                with col2:
                    if st.button("Mark as Closed", key=f"close_{c['id']}"):
                        requests.post(f"{API_BASE}/admin/close-complaint", 
                                    json={"complaint_id": c['id']}, headers=headers)
                        st.success("Complaint closed")
                        st.rerun()
    else:
        st.info("No complaints yet.")
        
        
db.close()

import streamlit as st
import pandas as pd
import requests
from datetime import datetime
from src.database.session import SessionLocal
from src.database.models import User, Complaint

st.set_page_config(page_title="FinForgeAI Admin", layout="wide")

st.title("🔧 FinForgeAI Admin Panel")

API_BASE = "http://localhost:8000/api"

# Admin Login with JWT
if "admin_jwt" not in st.session_state:
    st.session_state.admin_jwt = None

if not st.session_state.admin_jwt:
    st.subheader("Admin Login")
    email = st.text_input("Admin Email")
    password = st.text_input("Password", type="password")
    if st.button("Login as Admin"):
        resp = requests.post(f"{API_BASE}/auth/login", json={"email": email, "password": password})
        if resp.status_code == 200:
            st.session_state.admin_jwt = resp.json()["access_token"]
            st.rerun()
        else:
            st.error("Invalid admin credentials")
    st.stop()

headers = {"Authorization": f"Bearer {st.session_state.admin_jwt}"}

tab1, tab2 = st.tabs(["👥 Users Management", "📩 Complaints & Messages"])

# ===================== USERS TAB =====================
with tab1:
    st.subheader("All Users")
    resp = requests.get(f"{API_BASE}/admin/users", headers=headers)
    users = resp.json() if resp.status_code == 200 else []
    
    if users:
        df = pd.DataFrame(users)
        st.dataframe(df, use_container_width=True, hide_index=True)
        
        st.divider()
        st.subheader("Update or Delete User")
        email_to_edit = st.text_input("Enter User Email")
        
        if email_to_edit:
            user = next((u for u in users if u["email"] == email_to_edit), None)
            if user:
                col1, col2 = st.columns(2)
                with col1:
                    new_full_name = st.text_input("Full Name", value=user.get("full_name", ""))
                    new_capital = st.number_input("Default Capital ($)", value=user.get("default_capital", 10000.0))
                    new_risk = st.slider("Risk %", 0.5, 5.0, float(user.get("risk_per_trade", 1.0)), 0.1)
                with col2:
                    new_active = st.checkbox("Is Active", value=user.get("is_active", False))
                    new_verified = st.checkbox("Mail Verified", value=user.get("is_mail_verified", False))
                    new_banned = st.checkbox("Is Banned", value=user.get("is_banned", False))
                
                if st.button("Update User"):
                    requests.post(f"{API_BASE}/admin/update-user", 
                                json={"email": email_to_edit, "full_name": new_full_name, 
                                      "default_capital": new_capital, "risk_per_trade": new_risk,
                                      "is_active": new_active, "is_mail_verified": new_verified, 
                                      "is_banned": new_banned},
                                headers=headers)
                    st.success("User updated successfully!")
                    st.rerun()
                
                if st.button("🗑 Delete User", type="secondary"):
                    if st.checkbox("Confirm deletion?"):
                        requests.post(f"{API_BASE}/admin/delete-user?email={email_to_edit}", headers=headers)
                        st.success("User deleted")
                        st.rerun()
            else:
                st.error("User not found")
    else:
        st.info("No users found.")

# ===================== COMPLAINTS TAB =====================
with tab2:
    st.subheader("📩 User Complaints & Messages")
    
    resp = requests.get(f"{API_BASE}/admin/complaints", headers=headers)
    complaints = resp.json() if resp.status_code == 200 else []
    
    if complaints:
        for c in complaints:
            with st.expander(f"📨 {c['subject']} — {c['user_email']} ({c['status']})"):
                st.write(f"**Message:** {c['message']}")
                st.write(f"**Submitted:** {c['created_at']}")
                
                reply_text = st.text_area("Write Reply (will be sent via email)", key=f"reply_{c['id']}")
                
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("📧 Send Reply", key=f"send_{c['id']}"):
                        if reply_text:
                            requests.post(f"{API_BASE}/admin/reply-complaint", 
                                        json={"complaint_id": c['id'], "reply": reply_text},
                                        headers=headers)
                            st.success("Reply sent successfully!")
                            st.rerun()
                with col2:
                    if st.button("✅ Mark as Closed", key=f"close_{c['id']}"):
                        requests.post(f"{API_BASE}/admin/close-complaint", 
                                    json={"complaint_id": c['id']}, headers=headers)
                        st.success("Complaint closed")
                        st.rerun()
    else:
        st.info("No complaints or messages from users yet.")

st.sidebar.success("Admin Panel Active")

if st.button("Approve This Transaction"):
    resp = requests.post(
        f"{API_BASE}/admin/approve-transaction",
        json={"transaction_id": tx_id},
        headers=headers
    )
    if resp.status_code == 200:
        st.success("Transaction approved and balance updated!")