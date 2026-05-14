import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BarChart3, CheckCircle2, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';
import { demoDashboard, demoInsights } from '../services/demoData';

const COLORS = ['#64748b', '#3b82f6', '#f59e0b', '#14b8a6', '#10b981'];
const STATUS_LABELS = { backlog: 'Backlog', todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [dashboardResponse, insightsResponse] = await Promise.all([
          api.get('/dashboard'),
          api.get('/ai/insights'),
        ]);

        setData(dashboardResponse.data.data);
        setInsights(insightsResponse.data.data);
        setDemoMode(false);
      } catch {
        setData(demoDashboard);
        setInsights(demoInsights);
        setDemoMode(true);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const stats = [
    { label: 'Total Tasks', value: data.overview.totalTasks, icon: BarChart3, color: 'purple', change: '+12%' },
    { label: 'Completed', value: data.overview.completedTasks, icon: CheckCircle2, color: 'green', change: '+8%' },
    { label: 'In Progress', value: data.overview.inProgressTasks, icon: Clock, color: 'orange', change: '+3%' },
    { label: 'Overdue', value: data.overview.overdueTasks, icon: AlertTriangle, color: 'red', change: '-2%' },
  ];

  const pieData = Object.entries(data.tasksByStatus || {}).map(([key, value]) => ({
    name: STATUS_LABELS[key],
    value,
  }));

  return (
    <>
      <div className="main-header">
        <div className="header-left">
          <h2>Dashboard</h2>
          <p>Project health, delivery risk, and team activity in one view.</p>
        </div>
      </div>
      <div className="page-content">
        {demoMode && (
          <div className="notice-banner">
            API is unavailable, so this workspace is showing interview demo data. Start MongoDB and seed the database for live data.
          </div>
        )}

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className={`stat-card ${stat.color}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <div className={`stat-icon ${stat.color}`}><stat.icon size={24} /></div>
              <div className="stat-info">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
                <div className={`stat-change ${stat.change.startsWith('+') ? 'up' : 'down'}`}>
                  <TrendingUp size={14} /> {stat.change} this week
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div className="ai-focus-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="ai-score">
            <div className="ai-score-ring">{insights.healthScore}</div>
            <div>
              <div className="eyebrow"><Sparkles size={14} /> AI Focus</div>
              <h3>Delivery health score</h3>
              <p>{insights.summary.openTasks} open tasks, {insights.summary.overdueTasks} overdue, {insights.summary.urgentOpenTasks} urgent.</p>
            </div>
          </div>
          <div className="ai-recommendations">
            {insights.recommendations.slice(0, 3).map((item) => (
              <div key={item.title} className="ai-recommendation">
                <strong>{item.title}</strong>
                <span>{item.impact}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="dashboard-grid">
          <motion.div className="card chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3>Weekly Activity</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.weeklyData}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, color: '#e2e8f0' }} />
                <Bar dataKey="completed" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div className="card chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h3>Task Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, color: '#e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {pieData.map((item, index) => (
                <div key={item.name} className="legend-item">
                  <span style={{ background: COLORS[index] }} />
                  {item.name}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="dashboard-grid lower-grid">
          <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h3 className="section-title">Top Risk Tasks</h3>
            <div className="risk-list">
              {insights.riskTasks.map((task) => (
                <div key={task.id} className="risk-item">
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.project} - {task.reason}</span>
                  </div>
                  <span className={`risk-badge ${task.severity}`}>{task.severity}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {data.activeProjects?.length > 0 && (
            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h3 className="section-title">Active Projects</h3>
              <div className="project-progress-list">
                {data.activeProjects.map((project) => (
                  <div key={project.id} className="project-progress-row">
                    <div className="project-icon compact" style={{ background: `${project.color}20`, color: project.color }}>{project.icon}</div>
                    <div>
                      <div className="project-row-title">{project.name}</div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${project.progress}%`, background: project.color }} /></div>
                    </div>
                    <span style={{ color: project.color }}>{project.progress}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
