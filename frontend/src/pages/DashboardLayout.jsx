import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, LayoutDashboard, List, PieChart, Users, UserPlus } from 'lucide-react';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';
import StaffDashboard from './StaffDashboard';
import { apiGetMe } from '../api';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminActiveTab, setAdminActiveTab] = useState('Dashboard');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const userData = await apiGetMe(token);
        setUser(userData);
      } catch (err) {
        console.error(err);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center" style={{ minHeight: '100vh' }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const role = user?.role || 'User';
  const isStaff = role === 'Department Staff';

  const NavItem = ({ label, icon: Icon, active, onClick, title }) => (
    <div 
      className={`btn${role === 'Admin' ? ` admin-nav-item${active ? ' admin-nav-active' : ''}` : ''}`}
      onClick={onClick}
      title={title}
      style={{ 
        justifyContent: 'flex-start', 
        background: active ? 'rgba(255,255,255,0.05)' : 'transparent', 
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        cursor: 'pointer'
      }}>
      <Icon size={18} /> {label}
    </div>
  );

  return (
    <div className={`flex dashboard-shell${isStaff ? ' dashboard-shell-staff' : role === 'User' ? ' dashboard-shell-user' : role === 'Admin' ? ' dashboard-shell-admin' : ''}`} style={{ minHeight: '100vh' }}>
      <aside className={`glass-panel dashboard-sidebar${isStaff ? ' dashboard-sidebar-staff' : role === 'User' ? ' dashboard-sidebar-user' : role === 'Admin' ? ' dashboard-sidebar-admin' : ''}`} style={{ borderRadius: '0', borderLeft: 'none', borderTop: 'none', borderBottom: 'none', display: 'flex', flexDirection: 'column' }}>
        <div className="dashboard-brand" style={{ padding: '2rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', margin: 0 }}>Smart<span style={{color: 'var(--text-primary)'}}>Complain</span></h2>
          <p style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>AI-Powered Management</p>
        </div>
        
        <nav className={`flex-col gap-2 dashboard-nav${isStaff ? ' dashboard-nav-staff' : role === 'Admin' ? ' dashboard-nav-admin' : ''}`} style={{ padding: '2rem', flex: 1, display: 'flex' }}>
          {isStaff && (
            <NavItem label="My Dashboard" icon={LayoutDashboard} active title="My Dashboard" />
          )}
          {!isStaff && role !== 'Admin' && (
             <div className="btn" style={{ justifyContent: 'flex-start', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
               <LayoutDashboard size={18} /> Dashboard
             </div>
          )}

          {role === 'Admin' && (
            <>
              <NavItem label="Dashboard" icon={LayoutDashboard} active={adminActiveTab === 'Dashboard'} onClick={() => setAdminActiveTab('Dashboard')} />
              <NavItem label="All Complaints" icon={List} active={adminActiveTab === 'All Complaints'} onClick={() => setAdminActiveTab('All Complaints')} />
              <NavItem label="Analytics" icon={PieChart} active={adminActiveTab === 'Analytics'} onClick={() => setAdminActiveTab('Analytics')} />
              <NavItem label="Assign Departments" icon={Users} active={adminActiveTab === 'Assign Departments'} onClick={() => setAdminActiveTab('Assign Departments')} />
              <NavItem label="Manage Staff" icon={UserPlus} active={adminActiveTab === 'Manage Staff'} onClick={() => setAdminActiveTab('Manage Staff')} />
            </>
          )}
        </nav>
        
        <div className={`dashboard-sidebar-footer${isStaff ? ' dashboard-sidebar-footer-staff' : role === 'Admin' ? ' dashboard-sidebar-footer-admin' : ''}`} style={{ padding: '2rem', borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-6 dashboard-user-summary">
            <div style={{ background: 'var(--primary-glow)', padding: '0.5rem', borderRadius: '50%' }}>
              <User size={24} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.username}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{role}</div>
            </div>
          </div>
          <button className="btn btn-outline w-full dashboard-logout" onClick={handleLogout} title={isStaff ? 'Logout' : undefined}>
            <LogOut size={18} /> <span>{isStaff ? 'Logout' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      <main className={`dashboard-main${isStaff ? ' dashboard-main-staff' : role === 'User' ? ' dashboard-main-user' : role === 'Admin' ? ' dashboard-main-admin' : ''}`} style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
        <div className="container" style={{ padding: 0 }}>
          {role === 'User' && <UserDashboard />}
          {role === 'Admin' && <AdminDashboard activeTab={adminActiveTab} setAdminActiveTab={setAdminActiveTab} />}
          {role === 'Department Staff' && <StaffDashboard />}
        </div>
      </main>
    </div>
  );
}
