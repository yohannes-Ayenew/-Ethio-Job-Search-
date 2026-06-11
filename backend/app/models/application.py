from sqlalchemy import Column, String, Text, DateTime, BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"))
    user_id = Column(BigInteger, ForeignKey("users.id"))
    cover_note = Column(Text, nullable=True)
    cv_url = Column(String, nullable=True)
    status = Column(String, default="pending")
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
