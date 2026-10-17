from pydantic import BaseModel
from typing import Literal, Optional, List
from datetime import datetime
from models import RoleEnum, StatusEnum

class UserCreate(BaseModel):
    username: str
    password: str
    role: RoleEnum = RoleEnum.USER
    department: Optional[str] = None

class UserDepartmentUpdate(BaseModel):
    department: str

class UserResponse(BaseModel):
    user_id: int
    username: str
    role: RoleEnum
    department: Optional[str] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class ComplaintAssign(BaseModel):
    assigned_to: int
    department: str

class ComplaintCreate(BaseModel):
    complaint_text: str

class ComplaintOverride(BaseModel):
    category: str
    priority: str
    department: str

class ComplaintStatusUpdate(BaseModel):
    status: Literal[
        StatusEnum.PENDING,
        StatusEnum.IN_PROGRESS,
        StatusEnum.RESOLVED,
    ]

    
class ComplaintResponse(BaseModel):
    complaint_id: int
    user_id: int
    assigned_to: Optional[int] = None
    complaint_text: str
    ai_category: Optional[str]
    category_confidence: Optional[float]
    ai_priority: Optional[str]
    priority_confidence: Optional[float]
    sentiment_score: Optional[float]
    urgency_signals: Optional[str]
    department: Optional[str]
    status: StatusEnum
    submission_time: datetime
    sla_deadline: Optional[datetime]
    escalation_status: Optional[str]
    escalation_time: Optional[datetime]
    resolution_time: Optional[datetime]
    previous_assigned_to: Optional[int] = None
    reassigned_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
