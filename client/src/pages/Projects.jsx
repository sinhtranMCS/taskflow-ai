import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderKanban, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { connectSocket } from '../services/socket';
import { demoProjects } from '../services/demoData';

const PROJECT_COLORS = ['#14b8a6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#ef4444', '#64748b', '#0ea5e9'];
const PROJECT_ICONS = ['TF', 'EC', 'AI', 'UX', 'BI', 'API', 'QA', 'SEC'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: PROJECT_COLORS[0],
    icon: PROJECT_ICONS[0],
    tags: [],
  });
  const navigate = useNavigate();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data.data);
        setDemoMode(false);
      } catch {
        setProjects(demoProjects);
        setDemoMode(true);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  useEffect(() => {
    if (demoMode) return undefined;

    const socket = connectSocket();
    const upsertProject = (project) => {
      setProjects((current) => {
        const exists = current.some((item) => item._id === project._id);
        return exists ? current.map((item) => (item._id === project._id ? project : item)) : [project, ...current];
      });
    };
    const removeProject = ({ id }) => setProjects((current) => current.filter((project) => project._id !== id));

    socket.on('project-created', upsertProject);
    socket.on('project-updated', upsertProject);
    socket.on('project-deleted', removeProject);

    return () => {
      socket.off('project-created', upsertProject);
      socket.off('project-updated', upsertProject);
      socket.off('project-deleted', removeProject);
    };
  }, [demoMode]);

  const handleCreate = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      tags: form.tagsText ? form.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    };
    delete payload.tagsText;

    try {
      const { data } = await api.post('/projects', payload);
      setProjects((current) => [data.data, ...current]);
      toast.success('Project created');
      setDemoMode(false);
    } catch {
      if (!demoMode) {
        toast.error('Failed to create project');
      } else {
        const localProject = {
          ...payload,
          _id: `demo-project-${Date.now()}`,
          status: 'active',
          priority: 'medium',
          progress: 0,
          members: [],
          taskStats: { total: 0, done: 0 },
        };
        setProjects((current) => [localProject, ...current]);
        toast.success('Demo project added locally');
      }
    }

    setShowModal(false);
    setForm({ name: '', description: '', color: PROJECT_COLORS[0], icon: PROJECT_ICONS[0], tags: [] });
  };

  const filtered = projects.filter((project) => project.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="main-header">
        <div className="header-left">
          <h2>Projects</h2>
          <p>{projects.length} projects across your workspace</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> New Project</button>
        </div>
      </div>
      <div className="page-content">
        {demoMode && <div className="notice-banner">Showing sample projects because the API is not reachable.</div>}

        <div className="search-input toolbar-search">
          <Search />
          <input placeholder="Search projects..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>

        <div className="projects-grid">
          {filtered.map((project, index) => (
            <motion.div
              key={project._id}
              className="project-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => navigate(`/tasks/${project._id}`)}
            >
              <div className="project-top-strip" style={{ background: `linear-gradient(90deg, ${project.color}, ${project.color}88)` }} />
              <div className="project-header">
                <div className="project-icon" style={{ background: `${project.color}20`, color: project.color }}>{project.icon}</div>
                <span className={`project-status ${project.status}`}>{project.status}</span>
              </div>
              <div className="project-name">{project.name}</div>
              <div className="project-desc">{project.description}</div>
              <div className="project-progress">
                <div className="project-progress-header"><span>Progress</span><span>{project.progress || 0}%</span></div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${project.progress || 0}%`, background: project.color }} />
                </div>
              </div>
              <div className="project-footer">
                <div className="task-tags">{project.tags?.slice(0, 3).map((tag) => <span key={tag} className="task-tag">{tag}</span>)}</div>
                <span className="muted-small">{project.taskStats?.total || 0} tasks</span>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <FolderKanban size={64} />
            <h3>No Projects Found</h3>
            <p>Create your first project to get started.</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> New Project</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div className="modal" onClick={(event) => event.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="modal-header">
              <h3>Create Project</h3>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>x</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Project Name</label>
                  <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Enter project name" required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Brief description" />
                </div>
                <div className="form-group">
                  <label>Tags</label>
                  <input value={form.tagsText || ''} onChange={(event) => setForm({ ...form, tagsText: event.target.value })} placeholder="react, api, launch" />
                </div>
                <div className="form-group">
                  <label>Icon</label>
                  <div className="choice-row">
                    {PROJECT_ICONS.map((icon) => (
                      <button type="button" key={icon} onClick={() => setForm({ ...form, icon })} className={`choice-chip ${form.icon === icon ? 'selected' : ''}`}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <div className="choice-row">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setForm({ ...form, color })}
                        className={`color-choice ${form.color === color ? 'selected' : ''}`}
                        style={{ background: color }}
                        aria-label={`Use color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
}
