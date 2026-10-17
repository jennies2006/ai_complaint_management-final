const API_URL = 'http://127.0.0.1:8000';

export const apiLogin = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  const res = await fetch(`${API_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData
  });
  if (!res.ok) throw new Error('Invalid credentials');
  return res.json();
};

export const apiRegister = async (username, password, role, department = null) => {
  const body = { username, password, role };
  if (department) body.department = department;
  
  const res = await fetch(`${API_URL}/users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Registration failed. Username may exist.');
  return res.json();
};

export const apiGetMe = async (token) => {
  const res = await fetch(`${API_URL}/users/me/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to get user profile');
  return res.json();
};

export const apiSubmitComplaint = async (token, text) => {
  const res = await fetch(`${API_URL}/complaints/`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ complaint_text: text })
  });
  if (!res.ok) throw new Error('Failed to submit complaint');
  return res.json();
};

export const apiGetComplaints = async (token) => {
  const res = await fetch(`${API_URL}/complaints/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch complaints');
  return res.json();
};

export const apiOverrideComplaint = async (token, id, category, priority, department) => {
  const res = await fetch(`${API_URL}/complaints/${id}/override`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ category, priority, department })
  });
  if (!res.ok) throw new Error('Failed to override complaint');
  return res.json();
};

export const apiResolveComplaint = async (token, id) => {
  const res = await fetch(`${API_URL}/complaints/${id}/resolve`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to resolve complaint');
  return res.json();
};

export const apiUpdateComplaintStatus = async (token, id, status) => {
  const res = await fetch(`${API_URL}/complaints/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update complaint status');
  return res.json();
};

export const apiGetStaff = async (token) => {
  const res = await fetch(`${API_URL}/users/staff/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to get staff');
  return res.json();
};

export const apiAssignComplaint = async (token, complaintId, assignedTo, department) => {
  const res = await fetch(`${API_URL}/complaints/${complaintId}/assign`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ assigned_to: assignedTo, department })
  });
  if (!res.ok) throw new Error('Failed to assign complaint');
  return res.json();
};

export const apiGetAllUsers = async (token) => {
  const res = await fetch(`${API_URL}/users/all`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to get users');
  return res.json();
};

export const apiPromoteToStaff = async (token, userId, department) => {
  const res = await fetch(`${API_URL}/users/${userId}/department`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ department })
  });
  if (!res.ok) throw new Error('Failed to assign department');
  return res.json();
};
