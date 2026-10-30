import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiGetComplaints, apiGetStaff, apiOverrideComplaint } from '../api';
import DashboardTab from './admin/DashboardTab';
import AllComplaintsTab from './admin/AllComplaintsTab';
import AnalyticsTab from './admin/AnalyticsTab';
import AssignDepartmentsTab from './admin/AssignDepartmentsTab';
import ManageStaffTab from './admin/ManageStaffTab';

export default function AdminDashboard({ activeTab, setAdminActiveTab }) {
  const [complaints, setComplaints] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [complaintToEdit, setComplaintToEdit] = useState(null);
  const [editedPriority, setEditedPriority] = useState('');
  const [savingPriority, setSavingPriority] = useState(false);
  const [overrideError, setOverrideError] = useState('');

  const fetchData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem('token');
      const [compData, staffData] = await Promise.all([
        apiGetComplaints(token),
        apiGetStaff(token)
      ]);
      setCurrentTime(Date.now());
      const mapped = compData.map(c => ({
        id: c.complaint_id,
        text: c.complaint_text,
        category: c.ai_category,
        category_confidence: c.category_confidence,
        priority: c.ai_priority,
        priority_confidence: c.priority_confidence,
        status: c.status,
        sla_deadline: c.sla_deadline,
        department: c.department,
        escalation_status: c.escalation_status,
        assigned_to: c.assigned_to,
        previous_assigned_to: c.previous_assigned_to,
        reassigned_at: c.reassigned_at ? new Date(c.reassigned_at).toLocaleString() : null
      }));
      setComplaints(mapped.reverse());
      setStaff(staffData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    const refreshVisibleData = () => {
      if (document.visibilityState === 'visible') fetchData();
    };
    const refreshInterval = window.setInterval(refreshVisibleData, 15000);
    window.addEventListener('focus', refreshVisibleData);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', refreshVisibleData);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const openPriorityEditor = (complaint) => {
    setComplaintToEdit(complaint);
    setEditedPriority(complaint.priority || 'Medium');
    setOverrideError('');
  };

  const savePriority = async (event) => {
    event.preventDefault();
    if (!complaintToEdit) return;

    setSavingPriority(true);
    setOverrideError('');
    try {
      const token = localStorage.getItem('token');
      await apiOverrideComplaint(
        token,
        complaintToEdit.id,
        complaintToEdit.category,
        editedPriority,
        complaintToEdit.department
      );
      setComplaintToEdit(null);
      await fetchData();
    } catch (err) {
      setOverrideError(err.message || 'Failed to update complaint priority.');
    } finally {
      setSavingPriority(false);
    }
  };

  if (loading) return <div>Loading admin data...</div>;

  return (
    <div className="animate-fade-in admin-dashboard-surface">
      {activeTab === 'Dashboard' && <DashboardTab complaints={complaints} currentTime={currentTime} onOverride={openPriorityEditor} refresh={fetchData} goToAllComplaints={() => setAdminActiveTab('All Complaints')} />}
      {activeTab === 'All Complaints' && <AllComplaintsTab complaints={complaints} currentTime={currentTime} onOverride={openPriorityEditor} refresh={fetchData} />}
      {activeTab === 'Analytics' && <AnalyticsTab complaints={complaints} currentTime={currentTime} />}
      {activeTab === 'Assign Departments' && <AssignDepartmentsTab complaints={complaints} staff={staff} refresh={fetchData} />}
      {activeTab === 'Manage Staff' && <ManageStaffTab staff={staff} goToAssignDepartments={() => setAdminActiveTab('Assign Departments')} />}
      {complaintToEdit && createPortal(
        <div
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !savingPriority) setComplaintToEdit(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.7)'
          }}
        >
          <form
            className="glass-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="priority-dialog-title"
            onSubmit={savePriority}
            style={{ width: '100%', maxWidth: '420px', padding: '2rem', background: 'var(--bg-secondary, #1f2937)' }}
          >
            <h2 id="priority-dialog-title" style={{ marginTop: 0 }}>Change Complaint Priority</h2>
            <p>Complaint #{complaintToEdit.id}</p>
            <label htmlFor="complaint-priority">Priority</label>
            <select
              id="complaint-priority"
              value={editedPriority}
              onChange={event => setEditedPriority(event.target.value)}
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            {overrideError && <p role="alert" style={{ color: 'var(--danger)' }}>{overrideError}</p>}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" className="btn btn-outline" onClick={() => setComplaintToEdit(null)} disabled={savingPriority}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={savingPriority}>
                {savingPriority ? 'Saving...' : 'Save Priority'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}
