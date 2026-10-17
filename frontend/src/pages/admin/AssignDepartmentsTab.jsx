import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { apiAssignComplaint } from '../../api';

export default function AssignDepartmentsTab({ complaints, staff, refresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [assignedSessionCount, setAssignedSessionCount] = useState(0);
  
  const [innerTab, setInnerTab] = useState('Waiting'); // 'Waiting' | 'Assigned'
  const [selections, setSelections] = useState({});
  const [reassigningId, setReassigningId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const STAFF_CAPACITY = 10;

  const openComplaints = complaints.filter(c => c.status !== 'Resolved');
  const waitingList = openComplaints.filter(c => !c.assigned_to);
  const assignedList = complaints.filter(c => c.assigned_to);

  const staffWorkload = {};
  const staffMap = {};
  staff.forEach(s => {
    staffWorkload[s.user_id] = openComplaints.filter(c => c.assigned_to === s.user_id).length;
    staffMap[s.user_id] = s;
  });

  const getStaffForDepartment = (dept) => {
    // Return all staff sorted by workload, department restriction removed
    return [...staff].sort((a, b) => staffWorkload[a.user_id] - staffWorkload[b.user_id]);
  };

  const handleStaffChange = (complaintId, staffId) => {
    setSelections(prev => ({ ...prev, [complaintId]: staffId }));
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 5000);
  };

  const handleAssign = async (complaint) => {
    const dept = complaint.department;
    let staffId = selections[complaint.id];
    
    if (!staffId) {
      const deptStaff = getStaffForDepartment(dept);
      if (deptStaff.length > 0) staffId = deptStaff[0].user_id;
    }

    if (!staffId) {
      alert('No staff available. Add staff in Manage Staff.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await apiAssignComplaint(token, complaint.id, staffId, dept);
      
      const newStaffName = staffMap[staffId]?.username || 'Unknown';
      if (complaint.assigned_to) {
        const oldStaffName = staffMap[complaint.assigned_to]?.username || 'Unknown';
        showToast(`Complaint #${complaint.id} reassigned from ${oldStaffName} to ${newStaffName}`);
      } else {
        showToast(`Complaint #${complaint.id} assigned to ${newStaffName}`);
        setAssignedSessionCount(prev => prev + 1);
      }
      
      setReassigningId(null);
      refresh();
    } catch (err) {
      alert('Failed to assign');
    }
  };

  const priorityWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
  
  const getFilteredList = (list) => {
    return list.filter(c => {
      const matchesSearch = c.text.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toString().includes(searchTerm);
      const matchesPriority = filterPriority === 'All' || c.priority === filterPriority;
      return matchesSearch && matchesPriority;
    }).sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
  };

  const renderComplaintCard = (c, isAssigned) => {
    const deptStaff = getStaffForDepartment(c.department);
    let selectedStaffId = selections[c.id];
    
    if (!selectedStaffId && !isAssigned && deptStaff.length > 0) {
      selectedStaffId = deptStaff[0].user_id;
    }
    if (!selectedStaffId && isAssigned && reassigningId === c.id) {
      selectedStaffId = c.assigned_to;
    }

    return (
      <div key={c.id} className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <div className="flex justify-between items-center mb-2">
          <h4 style={{ margin: 0 }}>Complaint #{c.id}</h4>
          <span className={`badge badge-${(c.priority || 'pending').toLowerCase()}`}>{c.priority || 'Pending'}</span>
        </div>
        <p className="mb-4 text-sm">{c.text}</p>
        
        <div className="flex items-center gap-6 mb-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex items-center gap-1">
            <strong>Category:</strong> {c.category}
          </div>
        </div>

        {c.previous_assigned_to && (
          <div className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <em>Previous Staff: {staffMap[c.previous_assigned_to]?.username || 'Unknown'} (Reassigned: {c.reassigned_at})</em>
          </div>
        )}

        {!isAssigned && (
          <div className="flex gap-4 items-end">
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem' }}>Staff Member</label>
              <select value={selectedStaffId || ''} onChange={e => handleStaffChange(c.id, e.target.value)} style={{ margin: 0, fontSize: '0.875rem', padding: '0.5rem' }}>
                {deptStaff.length === 0 ? <option value="">No staff available. Add staff in Manage Staff.</option> : null}
                {deptStaff.map(s => (
                  <option key={s.user_id} value={s.user_id}>{s.username} ({staffWorkload[s.user_id]} open)</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={() => handleAssign(c)}>Assign</button>
          </div>
        )}

        {isAssigned && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex gap-4">
                 <span><strong>Current Staff:</strong> {staffMap[c.assigned_to]?.username || 'Unknown'}</span>
                 <span><strong>Status:</strong> {c.status}</span>
              </div>
              {c.status !== 'Resolved' && reassigningId !== c.id && (
                <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => {
                  setReassigningId(c.id);
                  setSelections(prev => ({...prev, [c.id]: c.assigned_to}));
                }}>Reassign</button>
              )}
            </div>
            
            {reassigningId === c.id && (
              <div className="flex gap-4 items-end mt-2 p-3" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem' }}>New Staff Member</label>
                  <select value={selectedStaffId || ''} onChange={e => handleStaffChange(c.id, e.target.value)} style={{ margin: 0, fontSize: '0.875rem', padding: '0.5rem' }}>
                    {deptStaff.length === 0 ? <option value="">No staff available. Add staff in Manage Staff.</option> : null}
                    {deptStaff.map(s => (
                      <option key={s.user_id} value={s.user_id}>
                        {s.username} ({staffWorkload[s.user_id]} open) {s.user_id === c.assigned_to ? '(current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-outline" onClick={() => setReassigningId(null)}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => handleAssign(c)}>Confirm Reassign</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const overCapacityStaff = staff.filter(s => staffWorkload[s.user_id] >= STAFF_CAPACITY * 0.9).length;

  const deptGroups = {};
  staff.forEach(s => {
    const assigned = openComplaints.filter(c => c.assigned_to === s.user_id);
    const depts = Array.from(new Set(assigned.map(c => c.department)));
    if (depts.length === 0) depts.push('Idle / General');
    
    depts.forEach(d => {
      if (!deptGroups[d]) deptGroups[d] = { totalOpen: 0, staff: [] };
      // Note: we push the staff member and their total workload
      deptGroups[d].staff.push(s);
      deptGroups[d].totalOpen += assigned.filter(c => c.department === d).length;
    });
  });

  const displayList = innerTab === 'Waiting' ? getFilteredList(waitingList) : getFilteredList(assignedList);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>Assign Departments</h2>
          <p>Allocate incoming complaints to appropriate staff members or reassign existing ones.</p>
        </div>
      </div>
      
      {toastMsg && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', background: '#10b981', color: '#fff', padding: '1rem 1.5rem', borderRadius: '8px', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {toastMsg}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Waiting for Assignment</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--warning)' }}>{waitingList.length}</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Assigned This Session</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--success)' }}>{assignedSessionCount}</div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', border: overCapacityStaff > 0 ? '1px solid rgba(239,68,68,0.3)' : '' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Staff Near/Over Capacity</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: overCapacityStaff > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{overCapacityStaff}</div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Left Side: Complaints List */}
        <div style={{ flex: 3 }}>
          <div className="flex gap-4 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <button 
              style={{ padding: '0.5rem 1rem', background: 'transparent', border: 'none', color: innerTab === 'Waiting' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: innerTab === 'Waiting' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: innerTab === 'Waiting' ? 600 : 'normal' }}
              onClick={() => setInnerTab('Waiting')}
            >
              Waiting for Assignment
            </button>
            <button 
              style={{ padding: '0.5rem 1rem', background: 'transparent', border: 'none', color: innerTab === 'Assigned' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: innerTab === 'Assigned' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', fontWeight: innerTab === 'Assigned' ? 600 : 'normal' }}
              onClick={() => setInnerTab('Assigned')}
            >
              Assigned Complaints
            </button>
          </div>
          
          <div className="glass-card mb-6 flex gap-4">
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Search complaints..." style={{ paddingLeft: '2.5rem', marginTop: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Filter size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem' }} />
              <select style={{ paddingLeft: '2.5rem', margin: 0, height: '100%', minWidth: '150px' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col">
            {displayList.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No complaints found.</p> : null}
            {displayList.map(c => renderComplaintCard(c, innerTab === 'Assigned'))}
          </div>
        </div>

        {/* Right Side: Staff Workload */}
        <div style={{ flex: 2 }}>
          <h3 className="mb-4">Staff Workload</h3>
          {Object.keys(deptGroups).length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No staff registered.</p> : null}
          
          <div className="flex flex-col gap-6">
            {Object.keys(deptGroups).map(dept => (
              <div key={dept} className="glass-card">
                <div className="flex justify-between items-center mb-4">
                  <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{dept}</h4>
                  <span className="badge badge-pending">{deptGroups[dept].totalOpen} Open Complaints</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  {deptGroups[dept].staff.map(s => {
                    const load = staffWorkload[s.user_id];
                    const percent = Math.min((load / STAFF_CAPACITY) * 100, 100);
                    let color = '#10b981'; // green
                    if (percent >= 90) color = '#ef4444'; // red
                    else if (percent >= 70) color = '#f59e0b'; // orange

                    return (
                      <div key={s.user_id}>
                        <div className="flex justify-between items-center mb-1 text-sm">
                          <span>{s.username}</span>
                          <span style={{ color: percent >= 100 ? '#ef4444' : 'var(--text-secondary)' }}>
                            {percent >= 100 ? 'Full' : `${load}/${STAFF_CAPACITY}`}
                          </span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${percent}%`, background: color, transition: 'width 0.3s ease' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
