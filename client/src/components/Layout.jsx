import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../stores/authStore';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/tasks', icon: CheckSquare, label: 'All Tasks' },
    { to: '/ai', icon: Sparkles, label: 'AI Assistant' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h1>TaskFlow</h1>
            <span>AI Powered</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Workspace</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={handleLogout} title="Click to logout">
            <div className="user-avatar">{user?.initials || user?.name?.charAt(0) || 'U'}</div>
            <div className="user-info">
              <div className="name">{user?.name || 'User'}</div>
              <div className="role">{user?.role || 'Member'}</div>
            </div>
            <LogOut size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
