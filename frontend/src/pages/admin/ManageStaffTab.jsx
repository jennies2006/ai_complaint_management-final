import React from 'react';

export default function ManageStaffTab({ staff, goToAssignDepartments }) {
  return (
    <div className="admin-tab admin-tab-staff">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>Manage Staff</h2>
          <p>Staff accounts registered through the Staff Portal.</p>
        </div>
        <button className="btn btn-outline" onClick={goToAssignDepartments}>
          View Assign Departments &rarr;
        </button>
      </div>

      <div className="glass-card">
        <h3 className="mb-4">Staff Directory</h3>
        {staff.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>
            No staff accounts yet. Staff members can register through the Staff Portal.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem 0', fontWeight: 'normal' }}>Username</th>
                <th style={{ padding: '1rem 0', fontWeight: 'normal' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(member => (
                <tr key={member.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0' }}>{member.username}</td>
                  <td style={{ padding: '1rem 0' }}>
                    <span className="badge badge-pending">Staff</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
