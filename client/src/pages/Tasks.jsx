import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { connectSocket } from '../services/socket';
import { demoProjects, demoTasks } from '../services/demoData';

const COLUMNS = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
];

const initialForm = (projectId) => ({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  project: projectId || '',
  dueDate: '',
});

export default function Tasks() {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [form, setForm] = useState(initialForm(projectId));

  useEffect(() => {
    const loadBoard = async () => {
      setLoading(true);
      try {
        const params = projectId ? `?project=${projectId}` : '';
        const [taskResponse, projectResponse] = await Promise.all([
          api.get(`/tasks${params}`),
          api.get('/projects'),
        ]);

        setTasks(taskResponse.data.data);
        setProjects(projectResponse.data.data);
        setForm(initialForm(projectId || projectResponse.data.data[0]?._id || ''));
        setDemoMode(false);
      } catch {
        const fallbackTasks = projectId ? demoTasks.filter((task) => task.project?._id === projectId) : demoTasks;
        setTasks(fallbackTasks);
        setProjects(demoProjects);
        setForm(initialForm(projectId || demoProjects[0]?._id || ''));
        setDemoMode(true);
      } finally {
        setLoading(false);
      }
    };

    loadBoard();
  }, [projectId]);

  useEffect(() => {
    if (demoMode || projects.length === 0) return undefined;

    const socket = connectSocket();
    const projectIds = projectId ? [projectId] : projects.map((project) => project._id);
    projectIds.forEach((id) => socket.emit('join-project', id));

    const upsertTask = (task) => {
      setTasks((current) => {
        const belongsToBoard = !projectId || (task.project?._id || task.project) === projectId;
        if (!belongsToBoard) return current;

        const exists = current.some((item) => item._id === task._id);
        return exists ? current.map((item) => (item._id === task._id ? task : item)) : [task, ...current];
      });
    };
    const removeTask = ({ id }) => setTasks((current) => current.filter((task) => task._id !== id));

    socket.on('task-created', upsertTask);
    socket.on('task-updated', upsertTask);
    socket.on('task-status-changed', upsertTask);
    socket.on('task-deleted', removeTask);

    return () => {
      projectIds.forEach((id) => socket.emit('leave-project', id));
      socket.off('task-created', upsertTask);
      socket.off('task-updated', upsertTask);
      socket.off('task-status-changed', upsertTask);
      socket.off('task-deleted', removeTask);
    };
  }, [demoMode, projectId, projects]);

  const projectById = useMemo(() => new Map(projects.map((project) => [project._id, project])), [projects]);

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!form.project) {
      toast.error('Choose a project first');
      return;
    }

    const payload = { ...form };
    if (!payload.dueDate) delete payload.dueDate;

    try {
      const { data } = await api.post('/tasks', payload);
      setTasks((current) => [data.data, ...current]);
      toast.success('Task created');
      setDemoMode(false);
    } catch {
      if (!demoMode) {
        toast.error('Failed to create task');
      } else {
        const project = projectById.get(payload.project);
        const localTask = {
          ...payload,
          _id: `demo-task-${Date.now()}`,
          project: project ? { _id: project._id, name: project.name, color: project.color } : null,
        };
        setTasks((current) => [localTask, ...current]);
        toast.success('Demo task added locally');
      }
    }

    setShowModal(false);
    setForm(initialForm(projectId || projects[0]?._id || ''));
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const currentTasks = tasks;
    setTasks((items) => items.map((task) => (task._id === taskId ? { ...task, status: newStatus } : task)));

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    } catch {
      if (!demoMode) {
        setTasks(currentTasks);
        toast.error('Status update failed');
      }
    }
  };

  const filtered = tasks.filter((task) => task.title.toLowerCase().includes(search.toLowerCase()));
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : null;

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <>
      <div className="main-header">
        <div className="header-left">
          <h2>Task Board</h2>
          <p>{tasks.length} tasks across {projectId ? 'this project' : 'all projects'}</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Add Task</button>
        </div>
      </div>
      <div className="page-content">
        {demoMode && <div className="notice-banner">Showing sample tasks because the API is not reachable.</div>}

        <div className="search-input toolbar-search">
          <Search />
          <input placeholder="Search tasks..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>

        <div className="board-container">
          {COLUMNS.map((column) => {
            const columnTasks = filtered.filter((task) => task.status === column.id);

            return (
              <div key={column.id} className="board-column">
                <div className="column-header">
                  <div className="column-title"><span className={`column-dot ${column.id}`} />{column.label}</div>
                  <span className="column-count">{columnTasks.length}</span>
                </div>
                <div
                  className="column-tasks"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleStatusChange(event.dataTransfer.getData('taskId'), column.id);
                  }}
                >
                  {columnTasks.map((task, index) => (
                    <motion.div
                      key={task._id}
                      className="task-card"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData('taskId', task._id)}
                    >
                      {task.project?.name && (
                        <div className="task-project-label" style={{ color: task.project.color || 'var(--accent)' }}>
                          <span style={{ background: task.project.color || 'var(--accent)' }} />
                          {task.project.name}
                        </div>
                      )}
                      <div className="task-card-title">{task.title}</div>
                      {task.description && <div className="task-card-desc">{task.description}</div>}
                      <div className="task-card-meta">
                        <span className={`task-priority ${task.priority}`}>{task.priority}</span>
                        {task.dueDate && (
                          <span className={`task-due ${new Date(task.dueDate) < new Date() ? 'overdue' : ''}`}>
                            <Calendar size={12} /> {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  <div className="drop-zone" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div className="modal" onClick={(event) => event.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="modal-header">
              <h3>Create Task</h3>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>x</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title</label>
                  <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Task title" required />
                </div>
                <div className="form-group">
                  <label>Project</label>
                  <select value={form.project} onChange={(event) => setForm({ ...form, project: event.target.value })} disabled={Boolean(projectId)} required>
                    <option value="">Choose project</option>
                    {projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Task description" />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Status</label>
                    <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                      {COLUMNS.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
}
