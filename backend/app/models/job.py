from sqlalchemy import Column, String, Text, Date, Boolean, DateTime, BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String)
    category = Column(String)
    job_type = Column(String)
    description = Column(Text)
    salary = Column(String, nullable=True)
    deadline = Column(Date, nullable=True)
    posted_by = Column(BigInteger, ForeignKey("users.id"))
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
