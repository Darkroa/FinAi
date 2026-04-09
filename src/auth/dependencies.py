from fastapi import Depends, HTTPException, status
from src.auth.auth import get_current_user
from src.database.session import SessionLocal
from src.database.models import User

def require_admin(current_user=Depends(get_current_user)):
    db = SessionLocal()
    user = db.query(User).filter(User.email == current_user["email"]).first()
    db.close()
    if not user or not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user