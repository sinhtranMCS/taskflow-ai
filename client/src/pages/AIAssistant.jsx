import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Send, Sparkles, WandSparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { demoProjects, generateDemoTaskBreakdown } from '../services/demoData';

const defaultGoal = 'Launch an AI-powered sprint planning dashboard that highlights risky tasks and recommends next actions.';

export default function AIAssistant() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [goal, setGoal] = useState(defaultGoal);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data.data);
        setSelectedProjectId(response.data.data[0]?._id || '');
        setDemoMode(false);
      } catch {
        setProjects(demoProjects);
        setSelectedProjectId(demoProjects[0]?._id || '');
        setDemoMode(true);
      }
    };

    loadProjects();
  }, []);

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const handleGenerate = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/ai/suggest-tasks', {
        goal,
        projectId: selectedProjectId,
      });
      setSuggestions(response.data.data.tasks);
      setDemoMode(false);
    } catch {
      setSuggestions(generateDemoTaskBreakdown(goal, selectedProject?.name));
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTasks = async () => {
    if (!selectedProjectId || suggestions.length === 0) return;

    if (demoMode) {
      toast.success('Demo mode: suggestions are ready to discuss, but not saved.');
      return;
    }

    try {
      await Promise.all(
        suggestions.map((task) =>
          api.post('/tasks', {
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            estimatedHours: task.estimatedHours,
            project: selectedProjectId,
          })
        )
      );
      toast.success('Suggested tasks created');
    } catch {
      toast.error('Could not create suggested tasks');
    }
  };

  return (
    <>
      <div className="main-header">
        <div className="header-left">
          <h2>AI Assistant</h2>
          <p>Generate explainable task breakdowns and discuss delivery risk across active projects.</p>
        </div>
      </div>

      <div className="page-content">
        {demoMode && <div className="notice-banner">AI Assistant is using local demo generation because the API is not reachable.</div>}

        <div className="assistant-layout">
          <motion.form className="assistant-panel card" onSubmit={handleGenerate} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="eyebrow"><Sparkles size={14} /> Planning Assistant</div>
            <h3>Turn a product goal into scoped work</h3>
            <p className="panel-copy">
              The backend uses explainable heuristics, not a hidden black box, so the output is deterministic, auditable, and easy to review with stakeholders.
            </p>

            <div className="form-group">
              <label>Project</label>
              <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
                {projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Goal</label>
              <textarea rows={7} value={goal} onChange={(event) => setGoal(event.target.value)} />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading || goal.trim().length < 8}>
              {loading ? <span className="spinner mini" /> : <><Send size={18} /> Generate Plan</>}
            </button>
          </motion.form>

          <motion.div className="assistant-results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="results-header">
              <div>
                <div className="eyebrow"><WandSparkles size={14} /> Suggested Work</div>
                <h3>{suggestions.length ? `${suggestions.length} suggested tasks` : 'No plan generated yet'}</h3>
              </div>
              <button className="btn btn-secondary" onClick={handleCreateTasks} disabled={!suggestions.length || !selectedProjectId}>
                <Plus size={18} /> Create All
              </button>
            </div>

            <div className="suggestion-list">
              {suggestions.length === 0 ? (
                <div className="empty-state compact">
                  <Sparkles size={48} />
                  <h3>Generate a plan</h3>
                  <p>Use a concrete goal to produce tasks, priorities, estimates, and confidence scores.</p>
                </div>
              ) : (
                suggestions.map((task, index) => (
                  <motion.div key={`${task.title}-${index}`} className="suggestion-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <div className="suggestion-index">{index + 1}</div>
                    <div className="suggestion-body">
                      <div className="suggestion-title">{task.title}</div>
                      <p>{task.description}</p>
                      <div className="task-card-meta">
                        <span className={`task-priority ${task.priority}`}>{task.priority}</span>
                        <span className="muted-small">{task.estimatedHours}h estimate</span>
                        <span className="muted-small">{Math.round((task.confidence || 0.7) * 100)}% confidence</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
