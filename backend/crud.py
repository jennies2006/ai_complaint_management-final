from sqlalchemy.orm import Session
import models, schemas
from auth import get_password_hash

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.user_id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(username=user.username, password_hash=hashed_password, role=user.role, department=user.department)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_complaint(db: Session, complaint: schemas.ComplaintCreate, user_id: int):
    db_complaint = models.Complaint(
        user_id=user_id,
        complaint_text=complaint.complaint_text,
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)
    return db_complaint

def get_complaints_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Complaint).filter(models.Complaint.user_id == user_id).offset(skip).limit(limit).all()

def get_all_complaints(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Complaint).offset(skip).limit(limit).all()
