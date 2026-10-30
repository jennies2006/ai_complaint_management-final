import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { hasExceededSla } from '../../utils/sla';

export default function AnalyticsTab({ complaints, currentTime }) {
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];
  
  // Category Data
  const categories = {};
  complaints.forEach(c => {
    categories[c.category] = (categories[c.category] || 0) + 1;
  });
  const categoryData = Object.keys(categories).map(k => ({
    name: k,
    value: categories[k]
  }));

  // Priority Data
  const priorities = { 'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0 };
  complaints.forEach(c => {
    if (priorities[c.priority] !== undefined) priorities[c.priority]++;
  });
  const priorityData = Object.keys(priorities).map(k => ({
    name: k,
    count: priorities[k]
  }));

  // Resolution Data
  const total = complaints.length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const escalatedCount = complaints.filter(c => hasExceededSla(c, currentTime)).length;
  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;
  
  const resolutionData = [
    { name: 'Resolved', value: resolvedCount },
    { name: 'Unresolved', value: total - resolvedCount }
  ];

  return (
    <div className="admin-tab admin-tab-analytics">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>Analytics</h2>
          <p>System performance and complaint insights.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Category Donut */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 className="mb-4">Complaints by Category</h3>
          <div className="admin-category-chart" style={{ height: '300px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} innerRadius={54} outerRadius={78} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} (${Math.round(value/total*100)}%)`, name]} />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
            <div className="admin-category-total" style={{ position: 'absolute', top: '50%', left: '30%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{total}</div>
              <div style={{ fontSize: '0.875rem', color: '#405847' }}>Total</div>
            </div>
          </div>
        </div>

        {/* Priority Bar Chart */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 className="mb-4">Complaints by Priority</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#405847" />
                <YAxis stroke="#405847" />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#183a2a' }}>
                  {priorityData.map((entry, index) => {
                    const color = entry.name === 'Critical' ? '#ef4444' : entry.name === 'High' ? '#f59e0b' : entry.name === 'Medium' ? '#3b82f6' : '#22a06b';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Resolution Rate */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 className="mb-4 text-center">Resolution Rate</h3>
        <div className="flex justify-center items-center gap-12">
          <div style={{ height: '200px', width: '200px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={resolutionData} innerRadius={70} outerRadius={90} dataKey="value" startAngle={90} endAngle={-270}>
                  <Cell fill="#10b981" />
                  <Cell fill="rgba(255,255,255,0.1)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#183a2a' }}>{resolutionRate}%</div>
              <div style={{ fontSize: '0.875rem', color: '#405847' }}>Resolved</div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }}></div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{resolvedCount}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Resolved</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }}></div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{pendingCount}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Pending</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }}></div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>{escalatedCount}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Escalated</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
