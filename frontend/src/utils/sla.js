export function hasExceededSla(complaint, currentTime) {
  if (complaint.escalation_status === 'Escalated') return true;
  if (complaint.status === 'Resolved' || !complaint.sla_deadline || complaint.sla_deadline === 'Pending') {
    return false;
  }

  const deadlineValue = complaint.sla_deadline;
  const deadline = new Date(
    /[zZ]|[+-]\d{2}:\d{2}$/.test(deadlineValue) ? deadlineValue : `${deadlineValue}Z`
  );
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() <= currentTime;
}
