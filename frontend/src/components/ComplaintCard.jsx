import React from 'react';
import { AlertCircle, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { hasExceededSla } from '../utils/sla';

export default function ComplaintCard({ complaint, role, onOverride, onResolve, currentTime = 0 }) {
  const deadlineValue = complaint.sla_deadline && complaint.sla_deadline !== 'Pending'
    ? complaint.sla_deadline
    : null;
  const deadlineDate = deadlineValue
    ? new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(deadlineValue) ? deadlineValue : `${deadlineValue}Z`)
    : null;
  const hasValidDeadline = deadlineDate && !Number.isNaN(deadlineDate.getTime());
  const isSlaExceeded = hasExceededSla(complaint, currentTime);
  const slaLabel = hasValidDeadline ? deadlineDate.toLocaleString() : 'Pending';

  const getPriorityBadge = (p) => {
    switch(p) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Medium': return 'badge-medium';
      case 'Low': return 'badge-low';
      default: return 'badge-pending';
    }
  };

  return (
    <div className="glass-card mb-4 flex flex-col gap-4" style={{ border: isSlaExceeded ? '1px solid var(--danger)' : '' }}>
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <h3 style={{ margin: 0 }}>Complaint #{complaint.id}</h3>
          <span className={`badge ${getPriorityBadge(complaint.priority)}`}>{complaint.priority} Priority</span>
          <span className="badge badge-pending">{complaint.status}</span>
        </div>
        {isSlaExceeded && (
          <div className="flex items-center gap-1" style={{ color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 500 }}>
            <AlertCircle size={16} />
            {complaint.escalation_status === 'Escalated' ? 'Escalated (SLA Exceeded)' : 'SLA Exceeded'}
          </div>
        )}
      </div>
      
      <p style={{ color: 'var(--text-primary)' }}>{complaint.text}</p>
      
      <div className="flex justify-between items-center mt-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-6">
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <TrendingUp size={16} color="var(--primary)" /> 
            <span><strong>Category:</strong> {complaint.category}</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <Clock size={16} color={isSlaExceeded ? 'var(--danger)' : 'var(--warning)'} />
            <span style={{ color: isSlaExceeded ? 'var(--danger)' : undefined }}>
              <strong>SLA:</strong> {slaLabel}
            </span>
          </div>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <CheckCircle2 size={16} color="var(--success)" /> 
            <span><strong>Dept:</strong> {complaint.department}</span>
          </div>
        </div>
        
        {role === 'Admin' && (
          <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => onOverride(complaint)}>
            Override AI
          </button>
        )}
        {role === 'Staff' && complaint.status !== 'Resolved' && (
          <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} onClick={() => onResolve(complaint)}>
            Resolve Issue
          </button>
        )}
      </div>
    </div>
  );
}
