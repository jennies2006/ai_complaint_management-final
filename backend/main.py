import json
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone

import models, schemas, crud, auth, services
from database import engine, get_db

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Complaint Management API",
    description="API for the AI-Based Complaint Management System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me/", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.post("/complaints/", response_model=schemas.ComplaintResponse)
def create_complaint(
    complaint: schemas.ComplaintCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # 1. Create complaint record
    db_complaint = crud.create_complaint(db=db, complaint=complaint, user_id=current_user.user_id)
    
    # 2. Call AI Module
    prediction = services.run_ai_prediction(complaint.complaint_text)
    
    if prediction["status"] == "error":
        # Handle error
        db_complaint.department = "Admin / Manual Review"
        db_complaint.status = models.StatusEnum.PENDING
    else:
        # 3. Handle low confidence
        if prediction["category_confidence"] < 0.50:
            db_complaint.department = "Admin / Manual Review"
        else:
            db_complaint.department = services.get_department_for_category(prediction["category"])
        
        db_complaint.ai_category = prediction["category"]
        db_complaint.category_confidence = prediction["category_confidence"]
        db_complaint.ai_priority = prediction["priority"]
        db_complaint.priority_confidence = prediction["priority_confidence"]
        db_complaint.sentiment_score = prediction["sentiment_score"]
        db_complaint.urgency_signals = json.dumps(prediction["urgency_signals"])
        db_complaint.model_version = prediction["model_version"]
        
        # 4. Assign SLA
        db_complaint.sla_deadline = services.calculate_sla_deadline(prediction["priority"])
        
    db.commit()
    db.refresh(db_complaint)
    
    return db_complaint

@app.put("/complaints/{complaint_id}/override", response_model=schemas.ComplaintResponse)
def override_complaint(
    complaint_id: int,
    override_data: schemas.ComplaintOverride,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    complaint = db.query(models.Complaint).filter(models.Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    complaint.ai_category = override_data.category
    complaint.ai_priority = override_data.priority
    complaint.department = override_data.department
    complaint.sla_deadline = services.calculate_sla_deadline(override_data.priority)
    
    db.commit()
    db.refresh(complaint)
    return complaint

@app.put("/complaints/{complaint_id}/resolve", response_model=schemas.ComplaintResponse)
def resolve_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in [models.RoleEnum.ADMIN, models.RoleEnum.STAFF]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    complaint = db.query(models.Complaint).filter(models.Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == models.RoleEnum.STAFF and complaint.assigned_to != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    complaint.status = models.StatusEnum.RESOLVED
    complaint.resolution_time = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(complaint)
    return complaint

@app.put("/complaints/{complaint_id}/status", response_model=schemas.ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    status_update: schemas.ComplaintStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != models.RoleEnum.STAFF:
        raise HTTPException(status_code=403, detail="Not authorized")

    complaint = db.query(models.Complaint).filter(
        models.Complaint.complaint_id == complaint_id
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.assigned_to != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if complaint.status == models.StatusEnum.RESOLVED:
        raise HTTPException(status_code=409, detail="Resolved complaints cannot be reopened")

    complaint.status = status_update.status
    complaint.resolution_time = (
        datetime.now(timezone.utc)
        if status_update.status == models.StatusEnum.RESOLVED
        else None
    )

    db.commit()
    db.refresh(complaint)
    return complaint

@app.get("/users/all", response_model=list[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.User).all()

@app.put("/users/{user_id}/department", response_model=schemas.UserResponse)
def update_user_department(
    user_id: int, 
    update_data: schemas.UserDepartmentUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.department = update_data.department
    user.role = models.RoleEnum.STAFF
    db.commit()
    db.refresh(user)
    return user

@app.get("/users/staff/", response_model=list[schemas.UserResponse])
def get_staff_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.User).filter(models.User.role == models.RoleEnum.STAFF).all()

@app.put("/complaints/{complaint_id}/assign", response_model=schemas.ComplaintResponse)
def assign_complaint(
    complaint_id: int,
    assign_data: schemas.ComplaintAssign,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != models.RoleEnum.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    complaint = db.query(models.Complaint).filter(models.Complaint.complaint_id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    if complaint.assigned_to:
        complaint.previous_assigned_to = complaint.assigned_to
        complaint.reassigned_at = datetime.now()
        
    complaint.department = assign_data.department
    complaint.assigned_to = assign_data.assigned_to
    
    db.commit()
    db.refresh(complaint)
    return complaint

@app.get("/complaints/", response_model=list[schemas.ComplaintResponse])
def get_complaints(
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    hidden_incomplete_ids = crud.get_first_incomplete_complaint_ids(db)
    if current_user.role == models.RoleEnum.ADMIN:
        return crud.get_all_complaints(
            db,
            skip=skip,
            limit=limit,
            exclude_ids=hidden_incomplete_ids,
        )
    elif current_user.role == models.RoleEnum.STAFF:
        query = db.query(models.Complaint).filter(
            models.Complaint.assigned_to == current_user.user_id
        )
        if hidden_incomplete_ids:
            query = query.filter(
                ~models.Complaint.complaint_id.in_(hidden_incomplete_ids)
            )
        return query.offset(skip).limit(limit).all()
    else:
        return crud.get_complaints_by_user(
            db,
            user_id=current_user.user_id,
            skip=skip,
            limit=limit,
            exclude_ids=hidden_incomplete_ids,
        )
