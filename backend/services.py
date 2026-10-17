from datetime import datetime, timedelta, timezone
from ai_module.predict import predict_complaint
import models

# 1. Department Mapping Logic
def get_department_for_category(category: str) -> str:
    mapping = {
        "Delivery": "Logistics & Delivery",
        "Payments & Refunds": "Payments & Refunds",
        "Product Quality": "Quality Assurance",
        "Returns & Replacements": "Returns & Replacements",
        "Seller Support": "Seller Support",
        "Account & Technical": "Technical Support"
    }
    return mapping.get(category, "Admin / Manual Review")

# 2. SLA Calculation Logic
def calculate_sla_deadline(priority: str) -> datetime:
    now = datetime.now(timezone.utc)
    if priority == "Critical":
        return now + timedelta(hours=4)
    elif priority == "High":
        return now + timedelta(hours=24)
    elif priority == "Medium":
        return now + timedelta(hours=72)
    elif priority == "Low":
        return now + timedelta(days=7)
    return now + timedelta(days=7) # Default to 7 days if unknown

# 3. Call Real AI Module
def run_ai_prediction(text: str):
    # Call Member 2's AI prediction function natively
    result = predict_complaint(text)
    
    # If the model returns ok, standardize to success
    if result.get("status") == "ok":
        result["status"] = "success"
    return result
