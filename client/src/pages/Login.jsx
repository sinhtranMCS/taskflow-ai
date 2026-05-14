import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import useAuthStore from '../stores/authStore';

export default function Login() {
  const [email, setEmail] = useState('alex@taskflow.ai');
  const [password, setPassword] = useState('password123');
  const { login, demoLogin, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await login(email, password);
    if (success) navigate('/');
  };

  const handleDemo = () => {
    demoLogin();
    navigate('/');
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="auth-logo">
          <motion.div className="auth-logo-icon" initial={{ rotate: -10 }} animate={{ rotate: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Sparkles size={28} />
          </motion.div>
          <h2>Welcome Back</h2>
          <p>Sign in to your TaskFlow AI account</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); clearError(); }}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => { setPassword(event.target.value); clearError(); }}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="spinner mini" /> : <>Sign In <ArrowRight size={18} /></>}
          </button>
          <button type="button" className="btn btn-secondary auth-submit" onClick={handleDemo}>
            View Demo Workspace
          </button>
        </form>

        <div className="auth-footer">
          Do not have an account? <Link to="/register">Sign Up</Link>
        </div>
      </motion.div>
    </div>
  );
}
