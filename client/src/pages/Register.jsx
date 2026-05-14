import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import useAuthStore from '../stores/authStore';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await register(name, email, password);
    if (success) navigate('/');
  };

  return (
    <div className="auth-container">
      <motion.div className="auth-card" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon"><Sparkles size={28} /></div>
          <h2>Create Account</h2>
          <p>Get started with TaskFlow AI</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={name} onChange={(event) => { setName(event.target.value); clearError(); }} placeholder="Enter your name" required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(event) => { setEmail(event.target.value); clearError(); }} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(event) => { setPassword(event.target.value); clearError(); }} placeholder="Min 6 characters" required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="spinner mini" /> : <>Create Account <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="auth-footer">Already have an account? <Link to="/login">Sign In</Link></div>
      </motion.div>
    </div>
  );
}
