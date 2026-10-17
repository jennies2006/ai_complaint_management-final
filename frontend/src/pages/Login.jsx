import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User as UserIcon, Lock, Users, ArrowLeft, Briefcase, UserCheck } from 'lucide-react';
import { apiLogin, apiRegister } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null); // 'User', 'Department Staff', 'Admin'
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setIsLogin(true);
    setError('');
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        const data = await apiLogin(username, password);
        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      } else {
        await apiRegister(username, password, selectedRole);
        setIsLogin(true);
        setError('Registration successful! Please sign in.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRole) {
    return (
      <div className="container flex flex-col items-center justify-center animate-fade-in" style={{ minHeight: '100vh', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome to AI Complaint System</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Please select your portal to continue</p>
        </div>

        <div className="flex gap-6 flex-wrap justify-center" style={{ maxWidth: '900px' }}>
          {/* User Card */}
          <div 
            className="glass-card hover-glow flex flex-col items-center justify-center gap-4 cursor-pointer" 
            style={{ width: '250px', height: '200px', transition: 'all 0.3s ease', borderTop: '4px solid #3b82f6' }}
            onClick={() => handleRoleSelect('User')}
          >
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.2rem', borderRadius: '50%' }}>
              <Users size={48} color="#3b82f6" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#3b82f6' }}>User Portal</h3>
          </div>

          {/* Staff Card */}
          <div 
            className="glass-card hover-glow flex flex-col items-center justify-center gap-4 cursor-pointer" 
            style={{ width: '250px', height: '200px', transition: 'all 0.3s ease', borderTop: '4px solid #eab308' }}
            onClick={() => handleRoleSelect('Department Staff')}
          >
            <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '1.2rem', borderRadius: '50%' }}>
              <Briefcase size={48} color="#eab308" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#eab308' }}>Staff Portal</h3>
          </div>

          {/* Admin Card */}
          <div 
            className="glass-card hover-glow flex flex-col items-center justify-center gap-4 cursor-pointer" 
            style={{ width: '250px', height: '200px', transition: 'all 0.3s ease', borderTop: '4px solid #22c55e' }}
            onClick={() => handleRoleSelect('Admin')}
          >
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1.2rem', borderRadius: '50%' }}>
              <UserCheck size={48} color="#22c55e" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#22c55e' }}>Admin Portal</h3>
          </div>
        </div>
      </div>
    );
  }

  // Form View for the specific role
  const roleColors = {
    'User': '#3b82f6',
    'Department Staff': '#eab308',
    'Admin': '#22c55e'
  };
  const themeColor = roleColors[selectedRole];

  return (
    <div className="container flex justify-center items-center" style={{ minHeight: '100vh' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', position: 'relative', borderTop: `4px solid ${themeColor}` }}>
        
        <button 
          onClick={() => setSelectedRole(null)} 
          style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          className="flex items-center gap-2 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div className="flex flex-col items-center mb-8 mt-6">
          <div style={{ background: `${themeColor}20`, padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <Shield size={36} color={themeColor} />
          </div>
          <h2>{isLogin ? `${selectedRole} Login` : `${selectedRole} Registration`}</h2>
          <p style={{ textAlign: 'center' }}>Secure Portal Access</p>
        </div>

        {error && <div style={{ color: error.includes('successful') ? 'var(--success)' : 'var(--danger)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label>Username</label>
            <div style={{ position: 'relative' }}>
              <input type="text" placeholder="Enter your username" required style={{ paddingLeft: '2.5rem' }} value={username} onChange={e => setUsername(e.target.value)} />
              <UserIcon size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input type="password" placeholder="Enter your password" required style={{ paddingLeft: '2.5rem' }} value={password} onChange={e => setPassword(e.target.value)} />
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button type="submit" className="btn w-full mt-4" style={{ backgroundColor: themeColor, color: '#fff', border: 'none' }} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="flex justify-center mt-6">
          <button 
            type="button"
            className="btn btn-outline" 
            style={{ border: 'none', color: 'var(--text-secondary)' }} 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
