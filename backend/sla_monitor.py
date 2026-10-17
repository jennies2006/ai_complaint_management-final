import time
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from database import SessionLocal
import models

def check_slas():
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        
        # Find complaints that are not resolved, have an SLA, deadline passed, and not yet escalated
        breached_complaints = db.query(models.Complaint).filter(
            models.Complaint.status != models.StatusEnum.RESOLVED,
            models.Complaint.sla_deadline != None,
            models.Complaint.sla_deadline < now,
            (models.Complaint.escalation_status == None) | (models.Complaint.escalation_status != "Escalated")
        ).all()
        
        for complaint in breached_complaints:
            print(f"Escalating Complaint #{complaint.complaint_id}")
            complaint.escalation_status = "Escalated"
            complaint.escalation_time = now
            # Status could also be automatically updated here if desired
            
        if breached_complaints:
            db.commit()
            print(f"Escalated {len(breached_complaints)} complaints.")
    except Exception as e:
        print(f"Error in SLA Monitor: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting SLA Monitor Background Process...")
    while True:
        check_slas()
        # In production this might run every 5 minutes or use APScheduler
        time.sleep(60) 
