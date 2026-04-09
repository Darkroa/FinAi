from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, Text, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import bcrypt

Base = declarative_base()


# ===================== USER MODEL =====================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))

    # Verification & Security
    is_active = Column(Boolean, default=True)           # Changed default to True (better UX)
    is_mail_verified = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)

    # Personal Information
    username = Column(String(50), unique=True, nullable=True)
    first_name = Column(String(100), nullable=True)
    middle_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    sex = Column(String(20), nullable=True)
    phone = Column(String(30), nullable=True)
    country = Column(String(100), nullable=True)
    dob = Column(DateTime, nullable=True)
    address = Column(Text, nullable=True)

    # Trading Preferences
    default_capital = Column(Float, default=10000.0)
    risk_per_trade = Column(Float, default=1.0)      # 1% risk per trade
    max_drawdown = Column(Float, default=10.0)
    preferred_tickers = Column(JSON, default=list)   # Better default
    notification_preferences = Column(JSON, default=dict)

    # Broker API Keys (store encrypted in production!)
    alpaca_api_key = Column(String(255), nullable=True)
    alpaca_secret_key = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="user", cascade="all, delete-orphan")
    money_transactions = relationship("UserMoney", back_populates="user", cascade="all, delete-orphan")

    def verify_password(self, plain_password: str) -> bool:
        """Verify plain password against hashed one"""
        if not self.hashed_password:
            return False
        return bcrypt.checkpw(plain_password.encode('utf-8'), self.hashed_password.encode('utf-8'))

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


# ===================== FINANCIAL EVENTS =====================
class FinancialEvent(Base):
    __tablename__ = "financial_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(100), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    tickers_affected = Column(JSON, default=list)
    impact_score = Column(Integer, default=0)
    sentiment = Column(String(20))          # positive, negative, neutral
    confidence = Column(Float, default=0.0)
    short_term_impact = Column(Text)
    medium_term_impact = Column(Text)
    risk_level = Column(String(20))         # low, medium, high
    published_date = Column(DateTime)
    source_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)


# ===================== TREND ANALYSIS =====================
class TrendAnalysis(Base):
    __tablename__ = "trend_analyses"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(20), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    current_price = Column(Float, nullable=False)
    upper_trend = Column(Float)
    lower_trend = Column(Float)
    breakout_up = Column(Boolean, default=False)
    breakout_dn = Column(Boolean, default=False)
    predicted_price = Column(Float)
    confidence = Column(Float, default=0.0)
    prediction_text = Column(Text)
    trend_state = Column(String(20))        # bullish, bearish, sideways
    atr = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


# ===================== API KEYS =====================
class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    key_name = Column(String(100), nullable=False)
    api_key = Column(String(64), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    allowed_scopes = Column(JSON, default=list)

    # Relationship
    user = relationship("User", back_populates="api_keys")


# ===================== API USAGE LOGS =====================
class APIUsageLog(Base):
    __tablename__ = "api_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    endpoint = Column(String(200), nullable=False)
    method = Column(String(10))
    status_code = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
    response_time_ms = Column(Float, nullable=True)


# ===================== COMPLAINTS / CONTACT =====================
class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_email = Column(String(255), nullable=False)
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), default="pending")   # pending, replied, closed
    created_at = Column(DateTime, default=datetime.utcnow)
    replied_at = Column(DateTime, nullable=True)
    admin_reply = Column(Text, nullable=True)

    # Relationship
    user = relationship("User", back_populates="complaints")


# ===================== USER MONEY (Deposits & Withdrawals) =====================
class UserMoney(Base):
    __tablename__ = "usermoney"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_email = Column(String(255), nullable=False)
    amount_usd = Column(DECIMAL(15, 2), nullable=False)
    crypto = Column(String(10), nullable=False)          # BTC, ETH, USDT, etc.
    status = Column(String(20), default="pending")       # pending, approved, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    tx_hash = Column(String(100), nullable=True)

    # Relationship
    user = relationship("User", back_populates="money_transactions")


# ===================== HELPER (Development Only) =====================
def init_db():
    """Create all tables - Use Alembic migrations in production"""
    from sqlalchemy import create_engine
    from src.database.session import DATABASE_URL
    
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("✅ All database tables created successfully.")
