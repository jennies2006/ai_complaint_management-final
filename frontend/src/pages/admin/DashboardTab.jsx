import React, { useState } from 'react';
import ComplaintCard from '../../components/ComplaintCard';
import { Search, Filter } from 'lucide-react';
import { hasExceededSla } from '../../utils/sla';

export default function DashboardTab({ complaints, currentTime, onOverride, goToAllComplaints }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const summary = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    escalated: complaints.filter(c => hasExceededSla(c, currentTime)).length
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.id.toString().includes(searchTerm);
    const matchesCategory = filterCategory === 'All' || c.status === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const recentComplaints = filteredComplaints.slice(0, 3);

  return (
    <div className="admin-tab admin-tab-dashboard">
      <div className="flex justify-between items-center mb-8">
        <h2 style={{ fontSize: '2rem', margin: 0 }}>Welcome, Admin</h2>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Complaints</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{summary.total}</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Pending</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--warning)' }}>{summary.pending}</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>In Progress</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--primary)' }}>{summary.inProgress}</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Resolved</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--success)' }}>{summary.resolved}</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(239,68,68,0.3)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>SLA Escalated</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--danger)' }}>{summary.escalated}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Recent Complaints</h3>
        <button onClick={goToAllComplaints} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}>View All Complaints &rarr;</button>
      </div>

      <div className="glass-card mb-6 flex gap-4">
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search by ID or text..." 
            style={{ paddingLeft: '2.5rem', marginTop: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Filter size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
          <select 
            style={{ paddingLeft: '2.5rem', margin: 0, height: '100%', minWidth: '150px' }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div>
        {recentComplaints.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No complaints found.</p>
        ) : (
          recentComplaints.map(c => <ComplaintCard key={c.id} complaint={c} role="Admin" currentTime={currentTime} onOverride={onOverride} />)
        )}
      </div>
    </div>
  );
}
