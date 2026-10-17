from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timezone
from database import Base

class RoleEnum(str, enum.Enum):
    USER = "User"
    ADMIN = "Admin"
    STAFF = "Department Staff"

class StatusEnum(str, enum.Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"
    ESCALATED = "Escalated"

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.USER, nullable=False)
    department = Column(String, nullable=True)
    
    complaints = relationship("Complaint", foreign_keys="[Complaint.user_id]", back_populates="user")

class Complaint(Base):
    __tablename__ = "complaints"

    complaint_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    complaint_text = Column(Text, nullable=False)
    
    # AI Predictions
    ai_category = Column(String, nullable=True)
    category_confidence = Column(Float, nullable=True)
    ai_priority = Column(String, nullable=True) 
    priority_confidence = Column(Float, nullable=True)
    sentiment_score = Column(Float, nullable=True)
    urgency_signals = Column(String, nullable=True) 
    
    department = Column(String, nullable=True)
    status = Column(Enum(StatusEnum), default=StatusEnum.PENDING, nullable=False)
    
    submission_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    sla_deadline = Column(DateTime, nullable=True)
    
    escalation_status = Column(String, nullable=True)
    escalation_time = Column(DateTime, nullable=True)
    resolution_time = Column(DateTime, nullable=True)
    
    # AI Info / Admin Override
    model_version = Column(String, nullable=True)
    admin_override_category = Column(String, nullable=True)
    admin_override_priority = Column(String, nullable=True)
    admin_override_department = Column(String, nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    previous_assigned_to = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    reassigned_at = Column(DateTime, nullable=True)
    
    user = relationship("User", foreign_keys=[user_id], back_populates="complaints")
    assignee = relationship("User", foreign_keys=[assigned_to])
