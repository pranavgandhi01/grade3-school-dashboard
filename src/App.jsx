import { useState } from 'react';
import './index.css';

// Components
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import DailyUpdates from './components/DailyUpdates';
import StudyPlanner from './components/StudyPlanner';
import TodoManager from './components/TodoManager';
import DictationWords from './components/DictationWords';
import Events from './components/Events';
import CafeteriaMenu from './components/CafeteriaMenu';
import AdminPortal from './components/AdminPortal';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard', section: 'overview' },
  { id: 'calendar', icon: '📅', label: 'Calendar', section: 'overview' },
  { id: 'daily', icon: '📝', label: 'Daily Updates', section: 'academics' },
  { id: 'study', icon: '📚', label: 'Study Planner', section: 'academics' },
  { id: 'todos', icon: '✅', label: 'Homework & Todos', section: 'academics' },
  { id: 'dictation', icon: '📖', label: 'Dictation Words', section: 'academics' },
  { id: 'events', icon: '🎯', label: 'Events & Activities', section: 'school' },
  { id: 'menu', icon: '🍽️', label: 'Cafeteria Menu', section: 'school' },
  { id: 'admin', icon: '⚙️', label: 'Admin Portal', section: 'settings' },
];

const PAGES = {
  dashboard: Dashboard,
  calendar: Calendar,
  daily: DailyUpdates,
  study: StudyPlanner,
  todos: TodoManager,
  dictation: DictationWords,
  events: Events,
  menu: CafeteriaMenu,
  admin: AdminPortal,
};

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const PageComponent = PAGES[activePage] || Dashboard;

  const handleNavClick = (id) => {
    setActivePage(id);
    setSidebarOpen(false);
  };

  let currentSection = '';

  return (
    <div className="app-layout">
      {/* Mobile menu toggle */}
      <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">V</div>
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-title">Grade 3B Dashboard</span>
              <span className="sidebar-logo-subtitle">VIBGYOR Rise • AY 2026-27</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const showSection = item.section !== currentSection;
            if (showSection) currentSection = item.section;

            return (
              <div key={item.id}>
                {showSection && (
                  <div className="nav-section-title">
                    {item.section === 'overview' ? 'Overview' :
                     item.section === 'academics' ? 'Academics' : 'School Life'}
                  </div>
                )}
                <div
                  className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sync-status">
            <span className="sync-dot" />
            <span>Knowledge Graph synced</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <PageComponent setActivePage={setActivePage} />
      </main>
    </div>
  );
}

export default App;
