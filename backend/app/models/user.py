from sqlalchemy import Column, BigInteger, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True)
    username = Column(String, nullable=True)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    cv_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
