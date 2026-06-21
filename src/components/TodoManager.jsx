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
  if (!DAILY_UPDATES || !Array.isArray(DAILY_UPDATES)) return items;

  DAILY_UPDATES.forEach(update => {
    if (!update || !update.periods || !Array.isArray(update.periods)) return;
    update.periods.forEach(p => {
      if (p && p.homework) {
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

  const handleGeminiClick = (e, prompt) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(prompt).then(() => {
      alert('✨ Prompt copied to clipboard!\n\nPaste it into the chat once Gemini opens.');
      window.open('https://gemini.google.com/app', '_blank');
    }).catch(() => {
      window.open('https://gemini.google.com/app', '_blank');
    });
  };

  const handleLinkClick = (e, url) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank');
  };

  // Grouping logic
  const parseTodoDate = (d) => {
    if (!d) return null;
    const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    
    // Format: DD/MM/YYYY
    let m = d.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) {
      return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
    }
    // Format: DD-MMM-YYYY
    m = d.match(/(\d{1,2})-(\w{3})-(\d{2,4})/);
    if (m) {
      let yr = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
      return new Date(yr, months[m[2]], parseInt(m[1]));
    }
    return null;
  };

  const groupTodos = (items) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const groups = {
      '🚨 Overdue': [],
      '⚡ Immediate (Today/Tomorrow)': [],
      '📅 Upcoming': [],
      '📌 No Due Date': []
    };

    items.forEach(item => {
      if (!item.dueDate) {
        groups['📌 No Due Date'].push(item);
        return;
      }
      const dateObj = parseTodoDate(item.dueDate);
      if (!dateObj) {
        groups['📌 No Due Date'].push(item);
        return;
      }
      
      dateObj.setHours(0,0,0,0);
      if (dateObj < today) {
        groups['🚨 Overdue'].push(item);
      } else if (dateObj <= tomorrow) {
        groups['⚡ Immediate (Today/Tomorrow)'].push(item);
      } else {
        groups['📅 Upcoming'].push(item);
      }
    });

    // Sort items within each group
    Object.keys(groups).forEach(k => {
      groups[k].sort((a, b) => {
        const da = parseTodoDate(a.dueDate) || new Date(8640000000000000); // max date
        const db = parseTodoDate(b.dueDate) || new Date(8640000000000000);
        return da - db;
      });
    });

    return Object.entries(groups).filter(([_, groupItems]) => groupItems.length > 0);
  };

  const groupedFiltered = groupTodos(filtered);

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

        {/* Todo List Grouped */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {groupedFiltered.map(([groupName, groupItems]) => {
            let dueColor = 'var(--text-secondary)';
            if (groupName.includes('Overdue')) dueColor = 'var(--color-holiday, #ef4444)';
            else if (groupName.includes('Immediate')) dueColor = 'var(--color-test, #f59e0b)';
            else if (groupName.includes('Upcoming')) dueColor = 'var(--color-event, #10b981)';

            return (
              <div key={groupName}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>
                  {groupName} ({groupItems.length})
                </div>
                <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {groupItems.map((item) => {
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
                              {item.dueDate && <span className="todo-due" style={{ color: item.completed ? 'var(--text-muted)' : dueColor, fontWeight: item.completed ? 'normal' : 600 }}>📅 Due: {item.dueDate}</span>}
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
                                href="#"
                                style={{ fontSize: 12, color: 'var(--text-primary)', textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}
                                onClick={(e) => handleLinkClick(e, `/docs/${item.sourceFile}`)}
                                title="Click to open Original PDF"
                        >
                          📄 View Original PDF
                        </a>
                      )}
                      {item.subject && (
                        <>
                          <a 
                            href="#"
                            style={{ fontSize: 12, color: '#10b981', textDecoration: 'none', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={(e) => handleGeminiClick(e, `Act as an expert, fun tutor for an 8-year-old (Grade 3).\n\nExplain the topic: "${item.topic || item.text}" for the subject ${item.subject}.\n\nFormat your response:\n1. 🌟 The Big Idea (use a fun analogy)\n2. 🚀 Why It's Cool (real-world example)\n3. 🧠 Quick Quiz (1 interactive question to test them)`)}
                          >
                            ✨ Ask Gemini to Explain
                          </a>
                          <a 
                            href="#"
                            style={{ fontSize: 12, color: '#ef4444', textDecoration: 'none', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={(e) => handleLinkClick(e, `https://www.youtube.com/results?search_query=${encodeURIComponent(`grade 3 ${item.subject} ${item.topic || item.text}`)}`)}
                          >
                            ▶️ Search YouTube Lessons
                          </a>
                        </>
                      )}
                      
                      {item.subject && item.topic && (
                        <a 
                          href="#"
                          style={{ fontSize: 12, color: 'var(--text-primary)', textDecoration: 'none', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}
                          onClick={(e) => handleGeminiClick(e, `Act as a fun, encouraging teacher. Create a 5-question practice quiz for a 3rd grader studying ${item.subject} on the topic of "${item.topic}".\n\nMake the questions interactive. Ask them one at a time, wait for the child's answer, and provide a helpful, cheerful hint if they get it wrong!`)}
                        >
                          ✨ Learn with Gemini
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
              </div>
            </div>
          );
        })}
        {groupedFiltered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">You're all caught up!</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
