import React, { useEffect, useState } from 'react';
import { Filter, Search } from 'lucide-react';
import { apiGetComplaints, apiUpdateComplaintStatus } from '../api';

const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };

const isPastSla = (complaint) => {
  if (!complaint.slaDeadline || complaint.status === 'Resolved') return false;
  const deadline = new Date(complaint.slaDeadline);
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now();
};

const formatDeadline = (deadline) => {
  if (!deadline) return 'Not set';
  const date = new Date(deadline);
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleString();
};

export default function StaffDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await apiGetComplaints(token);
      setComplaints(data.map(complaint => ({
        id: complaint.complaint_id,
        text: complaint.complaint_text,
        category: complaint.ai_category,
        priority: complaint.ai_priority,
        status: complaint.status,
        slaDeadline: complaint.sla_deadline
      })));
      setLoadError('');
    } catch (err) {
      console.error(err);
      setLoadError('Failed to load your assigned complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    const refreshVisibleComplaints = () => {
      if (document.visibilityState === 'visible') fetchComplaints();
    };
    const refreshInterval = window.setInterval(refreshVisibleComplaints, 15000);
    window.addEventListener('focus', refreshVisibleComplaints);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', refreshVisibleComplaints);
    };
  }, []);

  const handleStatusChange = async (complaint, status) => {
    setUpdatingId(complaint.id);
    try {
      const token = localStorage.getItem('token');
      await apiUpdateComplaintStatus(token, complaint.id, status);
      await fetchComplaints();
    } catch (err) {
      console.error(err);
      window.alert('Failed to update complaint status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const summary = {
    assigned: complaints.length,
    inProgress: complaints.filter(complaint => complaint.status === 'In Progress').length,
    pastSla: complaints.filter(isPastSla).length,
    resolved: complaints.filter(complaint => complaint.status === 'Resolved').length
  };

  const filteredComplaints = complaints
    .filter(complaint => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch = !query
        || complaint.id.toString().includes(query)
        || complaint.text.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'All' || complaint.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aResolved = a.status === 'Resolved';
      const bResolved = b.status === 'Resolved';
      if (aResolved !== bResolved) return aResolved ? 1 : -1;
      const priorityDifference = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      return priorityDifference || b.id - a.id;
    });

  return (
    <div className="animate-fade-in staff-dashboard">
      <div className="mb-8">
        <h2 style={{ fontSize: '2rem' }}>My Dashboard</h2>
        <p>Complaints assigned to you.</p>
      </div>

      <section className="staff-summary-grid" aria-label="Complaint summary">
        <div className="glass-card staff-summary-card">
          <span>Assigned to me</span>
          <strong>{summary.assigned}</strong>
        </div>
        <div className="glass-card staff-summary-card">
          <span>In progress</span>
          <strong>{summary.inProgress}</strong>
        </div>
        <div className="glass-card staff-summary-card staff-summary-overdue">
          <span>Past SLA deadline</span>
          <strong>{summary.pastSla}</strong>
        </div>
        <div className="glass-card staff-summary-card staff-summary-resolved">
          <span>Resolved</span>
          <strong>{summary.resolved}</strong>
        </div>
      </section>

      <section aria-labelledby="staff-complaints-heading">
        <h3 id="staff-complaints-heading" className="staff-complaints-heading">My complaints</h3>
        <div className="glass-card staff-complaint-filters">
          <div className="staff-search">
            <Search size={18} color="var(--text-muted)" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search complaints by ID or text"
              placeholder="Search by complaint ID or text..."
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
          </div>
          <label className="staff-status-filter">
            <Filter size={18} color="var(--text-muted)" aria-hidden="true" />
            <select
              aria-label="Filter complaints by status"
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
            >
              <option value="All">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </label>
        </div>

        {loading ? (
          <p>Loading complaints...</p>
        ) : loadError ? (
          <p role="alert" className="staff-error">{loadError}</p>
        ) : filteredComplaints.length === 0 ? (
          <p className="staff-empty-state">
            {complaints.length === 0 ? 'No complaints have been assigned to you.' : 'No complaints match your search.'}
          </p>
        ) : (
          <div className="staff-complaint-list">
            {filteredComplaints.map(complaint => {
              const pastSla = isPastSla(complaint);
              const resolved = complaint.status === 'Resolved';
              const updating = updatingId === complaint.id;
              return (
                <article className="glass-card staff-complaint-card" key={complaint.id}>
                  <div className="staff-card-heading">
                    <h4>Complaint #{complaint.id}</h4>
                    <div className="staff-card-badges">
                      <span className={`badge badge-${(complaint.priority || '').toLowerCase()}`}>
                        {complaint.priority || 'Unprioritized'}
                      </span>
                      <span className={`badge ${resolved ? 'badge-resolved' : complaint.status === 'In Progress' ? 'badge-in-progress' : 'badge-pending'}`}>
                        {complaint.status}
                      </span>
                    </div>
                  </div>

                  <p className="staff-complaint-text">{complaint.text}</p>

                  <div className="staff-complaint-details">
                    <span><strong>Category:</strong> {complaint.category || 'Uncategorized'}</span>
                    <span>
                      <strong>SLA deadline:</strong> {formatDeadline(complaint.slaDeadline)}
                      {resolved && <span className="staff-resolved-label">Resolved</span>}
                      {pastSla && <span className="staff-overdue-label">Past SLA deadline</span>}
                    </span>
                  </div>

                  {!resolved && (
                    <div className="staff-complaint-actions">
                      <label>
                        <span className="sr-only">Update status for complaint {complaint.id}</span>
                        <select
                          value={complaint.status}
                          disabled={updating}
                          onChange={event => handleStatusChange(complaint, event.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                        </select>
                      </label>
                      <button
                        className="btn staff-resolve-button"
                        disabled={updating}
                        onClick={() => handleStatusChange(complaint, 'Resolved')}
                      >
                        {updating ? 'Saving...' : 'Mark resolved'}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
