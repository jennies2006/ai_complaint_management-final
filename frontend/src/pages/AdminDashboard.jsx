import React, { useState, useEffect } from 'react';
import { apiGetComplaints, apiGetStaff } from '../api';
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

  if (loading) return <div>Loading admin data...</div>;

  return (
    <div className="animate-fade-in">
      {activeTab === 'Dashboard' && <DashboardTab complaints={complaints} currentTime={currentTime} refresh={fetchData} goToAllComplaints={() => setAdminActiveTab('All Complaints')} />}
      {activeTab === 'All Complaints' && <AllComplaintsTab complaints={complaints} currentTime={currentTime} refresh={fetchData} />}
      {activeTab === 'Analytics' && <AnalyticsTab complaints={complaints} currentTime={currentTime} />}
      {activeTab === 'Assign Departments' && <AssignDepartmentsTab complaints={complaints} staff={staff} refresh={fetchData} />}
      {activeTab === 'Manage Staff' && <ManageStaffTab staff={staff} goToAssignDepartments={() => setAdminActiveTab('Assign Departments')} />}
      {activeTab === 'Settings' && <div>Settings coming soon</div>}
    </div>
  );
}
