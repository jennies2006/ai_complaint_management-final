import React, { useState } from 'react';
import ComplaintCard from '../../components/ComplaintCard';
import { Search, Filter } from 'lucide-react';

export default function AllComplaintsTab({ complaints, currentTime }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.id.toString().includes(searchTerm);
    
    let matchesCategory = true;
    if (filterCategory !== 'All') {
      if (filterCategory === 'Escalated') {
        matchesCategory = c.escalation_status === 'Escalated';
      } else {
        matchesCategory = c.status === filterCategory;
      }
    }
    return matchesSearch && matchesCategory;
  });

  // Sorting logic
  const priorityWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
  
  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    // 1. Escalated first
    if (a.escalation_status === 'Escalated' && b.escalation_status !== 'Escalated') return -1;
    if (b.escalation_status === 'Escalated' && a.escalation_status !== 'Escalated') return 1;
    
    // 2. Priority
    const pA = priorityWeight[a.priority] || 0;
    const pB = priorityWeight[b.priority] || 0;
    if (pA !== pB) return pB - pA;
    
    // 3. Newest first (ID desc)
    return b.id - a.id;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>All Complaints</h2>
          <p>Comprehensive list of all system complaints.</p>
        </div>
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
            <option value="Escalated">Escalated</option>
          </select>
        </div>
      </div>

      <div>
        {sortedComplaints.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No complaints found.</p>
        ) : (
          sortedComplaints.map(c => <ComplaintCard key={c.id} complaint={c} role="AdminList" currentTime={currentTime} />)
        )}
      </div>
    </div>
  );
}
