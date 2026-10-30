import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User as UserIcon, Lock, Users, ArrowLeft, Briefcase, UserCheck, ArrowRight, Sparkles, Headphones, MessageCircle, CheckCircle2 } from 'lucide-react';
import { apiLogin, apiRegister } from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null); // 'User', 'Department Staff', 'Admin'
  const [portalChoice, setPortalChoice] = useState('User');
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
      <main className="login-page">
        <section className="portal-showcase animate-fade-in">
          <div className="portal-selection">
            <div className="portal-brand">
              <span className="portal-brand-mark"><CheckCircle2 size={15} /></span>
              <span>SmartComplaint</span>
            </div>

            <div className="portal-picker">
              <header className="portal-heading">
                <h1>Welcome to AI Complaint System</h1>
                <p>Please select your portal to continue</p>
              </header>

              <div className="portal-options" role="group" aria-label="Choose a portal">
                {[
                  { role: 'User', title: 'User Portal', detail: 'Submit complaints and track their status', icon: Users, color: 'blue' },
                  { role: 'Department Staff', title: 'Staff Portal', detail: 'Review, respond to and resolve assigned cases', icon: Briefcase, color: 'gold' },
                  { role: 'Admin', title: 'Admin Portal', detail: 'Manage users, analytics and AI models', icon: UserCheck, color: 'green' }
                ].map(({ role, title, detail, icon: Icon, color }) => (
                  <button
                    key={role}
                    type="button"
                    className={`portal-option portal-option-${color}${portalChoice === role ? ' is-selected' : ''}`}
                    onClick={() => {
                      setPortalChoice(role);
                      handleRoleSelect(role);
                    }}
                  >
                    <span className="portal-option-icon"><Icon size={19} /></span>
                    <span className="portal-option-copy">
                      <strong>{title}</strong>
                      <small>{detail}</small>
                    </span>
                    <span className="portal-option-arrow"><ArrowRight size={15} /></span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="portal-preview" aria-label="Complaint system overview">
            <div className="preview-quote-mark">“</div>
            <h2>Describe your issue once. Our AI categorizes, prioritizes and routes it to the right team, so every complaint gets resolved faster.</h2>
            <div className="preview-sparkle"><Sparkles size={14} /></div>

            <div className="preview-chart">
              <div className="preview-chart-heading">
                <span className="preview-chart-icon"><Sparkles size={13} /></span>
                <strong>Complaint Overview</strong>
                <span className="preview-week">Weekly</span>
              </div>
              <div className="preview-legend"><span>Resolved</span><span>Pending</span></div>
              <div className="preview-bars" aria-hidden="true">
                {[43, 30, 70, 82, 31, 48, 63, 54, 36, 32, 49, 69, 56, 64, 43].map((height, index) => (
                  <i key={index} className={index % 3 === 0 ? 'bar-coral' : index % 3 === 1 ? 'bar-pink' : 'bar-orange'} style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>

            <div className="preview-illustration" aria-hidden="true">
              <div className="illustration-orbit orbit-one"><MessageCircle size={18} /></div>
              <div className="illustration-orbit orbit-two"><CheckCircle2 size={17} /></div>
              <div className="illustration-headset"><Headphones size={66} strokeWidth={1.4} /></div>
              <div className="illustration-caption">HERE TO HELP</div>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  // Form View for the specific role
  const roleClass = selectedRole === 'User'
    ? 'user'
    : selectedRole === 'Admin'
      ? 'admin'
      : 'staff';
  const roleTitle = selectedRole === 'Department Staff' ? 'Department Staff' : selectedRole;

  return (
    <main className={`login-page login-page-form login-page-${roleClass}`}>
      <section className={`auth-card auth-card-${roleClass} animate-fade-in`}>
        <header className="auth-header">
          <button type="button" className="auth-back" onClick={() => setSelectedRole(null)}>
            <ArrowLeft size={15} /> Back
          </button>
          <div className="auth-shield"><Shield size={27} /></div>
          <h1>{isLogin ? `${roleTitle} Login` : `${roleTitle} Registration`}</h1>
          <p>Secure Portal Access</p>
        </header>

        <div className="auth-content">
          {error && (
            <div
              className={`auth-message${error.includes('successful') ? ' auth-message-success' : ''}`}
              role="status"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-username">Username</label>
              <div className="auth-input-wrap">
                <UserIcon size={15} aria-hidden="true" />
                <input
                  id="login-username"
                  type="text"
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={event => setUsername(event.target.value)}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="auth-input-wrap">
                <Lock size={15} aria-hidden="true" />
                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <button
            type="button"
            className="auth-toggle"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <span>{isLogin ? 'Sign up' : 'Sign in'}</span>
          </button>
        </div>
      </section>
    </main>
  );
}
