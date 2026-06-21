import { useState, useEffect } from 'react';
import { REVIEW_SCHEDULE } from '../data/schoolData';
import { useUpdatesContext } from '../context/UpdatesContext';

const STORAGE_KEY = 'vibgyor-todos';

function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// Auto-generate homework todos from daily updates
function getHomeworkItems(DAILY_UPDATES) {
  const items = [];
  DAILY_UPDATES.forEach(update => {
    update.periods.forEach(p => {
      if (p.homework) {
        items.push({
          id: `hw-${update.date}-${p.period}`,
          text: `${p.subject}${p.topic ? ` (${p.topic})` : ''}: ${p.homework}`,
          category: 'homework',
          subject: p.subject,
          topic: p.topic,
          date: update.date,
          dueDate: p.submission_date || null,
          source: 'auto',
          sourceFile: update.source_file,
        });
      }
    });
  });

  // Add test preparation items
  REVIEW_SCHEDULE.forEach(r => {
    if (r.periodic_test_date) {
      items.push({
        id: `test-${r.subject}`,
        text: `Prepare for ${r.subject} Periodic Test: ${r.periodic_test_topic}`,
        category: 'test',
        subject: r.subject,
        topic: r.periodic_test_topic,
        dueDate: r.periodic_test_date,
        source: 'auto',
      });
    }
    if (r.sea_date) {
      items.push({
        id: `sea-${r.subject}`,
        text: `Prepare for ${r.subject} SEA: ${r.sea_topic}${r.sea_details ? ' — ' + r.sea_details.slice(0, 100) : ''}`,
        category: 'sea',
        subject: r.subject,
        topic: r.sea_topic,
        dueDate: r.sea_date,
        source: 'auto',
      });
    }
  });

  return items;
}

export default function TodoManager() {
  const { updates: DAILY_UPDATES } = useUpdatesContext();
  const [activeTab, setActiveTab] = useState('pending');
  const [todos, setTodos] = useState(loadTodos);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState('all');
  const [newCategory, setNewCategory] = useState('personal');
  const [expandedItemId, setExpandedItemId] = useState(null);

  const hwItems = getHomeworkItems(DAILY_UPDATES);

  // Merge auto items with manual todos
  const allItems = [
    ...hwItems.map(hw => ({
      ...hw,
      completed: todos.find(t => t.id === hw.id)?.completed || false,
    })),
    ...todos.filter(t => t.source === 'manual'),
  ];

  useEffect(() => { saveTodos(todos); }, [todos]);

  const toggleItem = (id) => {
    const existing = todos.find(t => t.id === id);
    if (existing) {
      setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    } else {
      setTodos([...todos, { id, completed: true }]);
    }
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const todo = {
      id: `manual-${Date.now()}`,
      text: newTodo.trim(),
      category: newCategory,
      source: 'manual',
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTodos([...todos, todo]);
    setNewTodo('');
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const filtered = filter === 'all' ? allItems :
    filter === 'pending' ? allItems.filter(t => !t.completed) :
    filter === 'completed' ? allItems.filter(t => t.completed) :
    allItems.filter(t => t.category === filter);

  const pendingCount = allItems.filter(t => !t.completed).length;
  const completedCount = allItems.filter(t => t.completed).length;

  const categoryColors = {
    homework: 'tag-orange',
    test: 'tag-yellow',
    sea: 'tag-pink',
    personal: 'tag-blue',
  };

  const categoryIcons = {
    homework: '📌',
    test: '📝',
    sea: '🎭',
    personal: '✏️',
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">✅ Homework & Todos</div>
        <div className="page-subtitle">{pendingCount} pending • {completedCount} completed • Auto-synced from daily updates</div>
      </div>

      <div className="page-body">
        {/* Add Todo */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              className="input"
              placeholder="Add a new todo..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              style={{ flex: 1 }}
            />
            <select
              className="input"
              style={{ width: 140 }}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              <option value="personal">Personal</option>
              <option value="homework">Homework</option>
              <option value="test">Test Prep</option>
              <option value="sea">SEA Prep</option>
            </select>
            <button className="btn btn-primary" onClick={addTodo}>Add</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="tabs">
            {[
              { id: 'all', label: `All (${allItems.length})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'completed', label: `Done (${completedCount})` },
              { id: 'homework', label: 'Homework' },
              { id: 'test', label: 'Tests' },
            ].map(f => (
              <button key={f.id} className={`tab ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Todo List */}
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((item) => {
            const isExpanded = expandedItemId === item.id;
            return (
              <div 
                className={`todo-item ${item.completed ? 'completed' : ''}`} 
                key={item.id} 
                style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer' }}
                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                  <div
                    className={`todo-checkbox ${item.completed ? 'checked' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }}
                    style={{ marginTop: 2 }}
                  >
                    {item.completed && '✓'}
                  </div>
                  <div className="todo-text" style={{ flex: 1 }}>
                    <div className={item.completed ? 'todo-text done' : ''} style={{ fontSize: 14, fontWeight: 500 }}>
                      {categoryIcons[item.category] || '📋'} {item.text}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className={`tag ${categoryColors[item.category] || 'tag-blue'}`}>{item.category}</span>
                      {item.subject && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.subject}</span>}
                      {item.dueDate && <span className="todo-due">📅 Due: {item.dueDate}</span>}
                      {item.date && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>From: {item.date}</span>}
                    </div>
                  </div>
                  {item.source === 'manual' && (
                    <button
                      className="btn btn-sm"
                      onClick={(e) => { e.stopPropagation(); deleteTodo(item.id); }}
                      style={{ color: 'var(--color-holiday)', fontSize: 14, padding: '4px 8px' }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 12, marginLeft: 28, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    {item.topic && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Topic / Details</div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.topic}</div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {item.sourceFile && (
                        <a 
                          href={`/docs/${item.sourceFile}`}
                          target="_blank" 
                          rel="noreferrer"
                          style={{ fontSize: 12, color: 'var(--text-primary)', textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}
                          onClick={(e) => e.stopPropagation()}
                          title="Click to open Original PDF"
                        >
                          📄 View Original PDF
                        </a>
                      )}
                      {(item.category === 'test' || item.category === 'sea' || item.category === 'homework') && (
                        <>
                          <a 
                            href={`https://gemini.google.com/app?q=${encodeURIComponent(`Explain the 3rd grade topic: ${item.topic || item.text} for subject ${item.subject}`)}`}
                            target="_blank" 
                            rel="noreferrer"
                            style={{ fontSize: 12, color: '#10b981', textDecoration: 'none', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            ✨ Ask Gemini to Explain
                          </a>
                          <a 
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`grade 3 ${item.subject} ${item.topic || item.text}`)}`}
                            target="_blank" 
                            rel="noreferrer"
                            style={{ fontSize: 12, color: '#ef4444', textDecoration: 'none', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            ▶️ Search YouTube Lessons
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-text">No items match this filter</div>
          </div>
        )}
      </div>
    </>
  );
}
