import React, { useState, useEffect } from 'react';
import ComplaintCard from '../components/ComplaintCard';
import { PlusCircle, Loader2 } from 'lucide-react';
import { apiGetComplaints, apiSubmitComplaint } from '../api';

export default function UserDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await apiGetComplaints(token);
      setCurrentTime(Date.now());
      // Map API fields to UI expectations
      const mapped = data.map(c => ({
        id: c.complaint_id,
        text: c.complaint_text,
        category: c.ai_category,
        priority: c.ai_priority,
        status: c.status,
        sla_deadline: c.sla_deadline,
        department: c.department,
        escalation_status: c.escalation_status
      }));
      setComplaints(mapped.reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const handleSubmit = async () => {
    if (!complaintText.trim()) return;
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem('token');
      await apiSubmitComplaint(token, complaintText);
      setComplaintText('');
      setIsSubmitting(false);
      await fetchComplaints(); // Refresh the list
    } catch (err) {
      alert("Error submitting complaint: " + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 style={{ fontSize: '2rem' }}>My Complaints</h2>
          <p>Track and manage your submitted complaints.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsSubmitting(!isSubmitting)}>
          <PlusCircle size={18} /> New Complaint
        </button>
      </div>

      {isSubmitting && (
        <div className="glass-card mb-8 animate-fade-in">
          <h3>Submit a New Complaint</h3>
          <p className="mb-4">Our AI will automatically categorize and prioritize your issue to ensure rapid routing and resolution.</p>
          <textarea 
            rows="4" 
            placeholder="Describe your issue in detail..." 
            className="mb-4"
            value={complaintText}
            onChange={e => setComplaintText(e.target.value)}
          ></textarea>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitLoading}>
              {submitLoading ? 'AI Analyzing...' : 'Submit to AI'}
            </button>
            <button className="btn btn-outline" onClick={() => setIsSubmitting(false)} disabled={submitLoading}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading complaints...</p>
      ) : complaints.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>You haven't submitted any complaints yet.</p>
      ) : (
        <div>
          {complaints.map(c => <ComplaintCard key={c.id} complaint={c} role="User" currentTime={currentTime} />)}
        </div>
      )}
    </div>
  );
}
