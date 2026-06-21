import { useState } from 'react';
import { REVIEW_SCHEDULE } from '../data/schoolData';
import { useUpdatesContext } from '../context/UpdatesContext';

// Build study plan from daily updates and review schedule
function buildStudyPlan(DAILY_UPDATES) {
  const subjects = {};

  if (!DAILY_UPDATES || !Array.isArray(DAILY_UPDATES)) return [];

  // Gather topics from daily updates
  DAILY_UPDATES.forEach(update => {
    if (!update || !update.periods || !Array.isArray(update.periods)) return;
    update.periods.forEach(p => {
      if (!p.subject || p.subject === 'SPA' || p.subject === 'ASSEMBLY') return;
      const rawSubj = p.subject.replace(/\s+SUPPORT$/i, '').replace(/\s+PROGRAMME$/i, '').trim();
      const subj = rawSubj.toUpperCase();
      if (!subjects[subj]) {
        subjects[subj] = { name: rawSubj.charAt(0).toUpperCase() + rawSubj.slice(1).toLowerCase(), topics: [], testDate: null, seaDate: null, testTopics: null, seaTopics: null };
      }
      if (p.topic && !subjects[subj].topics.find(t => t.name === p.topic)) {
        subjects[subj].topics.push({
          name: p.topic,
          subTopics: p.sub_topic ? [p.sub_topic] : [],
          lastCovered: update.date,
          classwork: p.classwork,
          videoLink: p.video_link || null,
        });
      } else if (p.topic && p.sub_topic) {
        const existing = subjects[subj].topics.find(t => t.name === p.topic);
        if (existing) {
          if (!existing.subTopics.includes(p.sub_topic)) {
            existing.subTopics.push(p.sub_topic);
          }
          if (p.video_link && !existing.videoLink) {
            existing.videoLink = p.video_link;
          }
        }
      }
    });
  });

  // Add test dates from review schedule
  REVIEW_SCHEDULE.forEach(r => {
    const subj = r.subject.toUpperCase();
    const match = Object.keys(subjects).find(k => k.toUpperCase().includes(subj) || subj.includes(k.toUpperCase()));
    if (match) {
      subjects[match].testDate = r.periodic_test_date;
      subjects[match].testTopics = r.periodic_test_topic;
      subjects[match].seaDate = r.sea_date;
      subjects[match].seaTopics = r.sea_topic;
    }
  });

  return Object.values(subjects).sort((a, b) => {
    if (a.testDate && !b.testDate) return -1;
    if (!a.testDate && b.testDate) return 1;
    return a.name.localeCompare(b.name);
  });
}

export default function StudyPlanner() {
  const { updates: DAILY_UPDATES } = useUpdatesContext();
  const [activeView, setActiveView] = useState('subjects');
  const [expandedSubject, setExpandedSubject] = useState(null);
  const studyPlan = buildStudyPlan(DAILY_UPDATES);

  const subjectEmojis = {
    'ENGLISH': '📚',
    'MATH': '🔢',
    'SCIENCE': '🔬',
    'HINDI': '🕉️',
    'SOCIAL STUDIES': '🌍',
    'ENRICHMENT PROGRAMME': '🌟',
    'ART': '🎨',
    'ROBOTICS': '🤖',
    'Marathi': '📜',
    'SKILL PROGRAMME': '💡',
    'FIT': '💻',
  };

  const getEmoji = (name) => {
    const key = Object.keys(subjectEmojis).find(k => name.toUpperCase().includes(k.toUpperCase()));
    return subjectEmojis[key] || '📘';
  };

  const getSubjectContext = (subjectName) => {
    const s = subjectName.toUpperCase();
    if (s.includes('ROBOTICS')) return "This is for CBSE Grade 3 Robotics. Skills: Tinkercad 3D modeling, basic electrical circuits. Suggested tools: Tinkercad, Code.org.";
    if (s.includes('FIT') || s.includes('COMPUTER')) return "This is for CBSE Grade 3 IT/FIT. Skills: Scratch visual programming, MS Word formatting, Tux Paint drawing.";
    if (s.includes('MATH')) return "This is for CBSE Grade 3 Mathematics. Skills: Addition, Subtraction, basic Multiplication, Time, Money, Shapes. Suggested tools: Khan Academy Kids, Prodigy Math.";
    if (s.includes('SCIENCE') || s.includes('EVS') || s.includes('ENVIRONMENT')) return "This is for CBSE Grade 3 Environmental Studies (EVS) / Science. Skills: Plants, animals, water, weather, human body. Suggested tools: National Geographic Kids, Dr. Binocs Show.";
    if (s.includes('ENGLISH')) return "This is for CBSE Grade 3 English. Skills: Grammar (nouns, verbs, adjectives), Reading Comprehension, Creative Writing. Suggested tools: Epic! reading, Oxford Owl.";
    if (s.includes('HINDI')) return "This is for CBSE Grade 3 Hindi. Skills: Vyakaran (grammar), vocabulary building, sentence formation. Suggested tools: Hindi Kahaniya for kids, Panchatantra stories.";
    if (s.includes('MARATHI')) return "This is for Grade 3 basic Marathi language learning.";
    return "This is for the standard CBSE Grade 3 syllabus.";
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

  return (
    <>
      <div className="page-header">
        <div className="page-title">📚 Study Planner</div>
        <div className="page-subtitle">Auto-generated from daily updates & review schedule • {studyPlan.length} subjects tracked</div>
      </div>

      <div className="page-body">
        {/* Overview Stats (Clickable) */}
        <div className="stat-grid stagger" style={{ marginBottom: 28 }}>
          <div className={`stat-card ${activeView === 'subjects' ? 'active-stat' : ''}`} style={{ cursor: 'pointer', border: activeView === 'subjects' ? '2px solid var(--accent)' : '' }} onClick={() => setActiveView('subjects')}>
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>📘</div>
            <div className="stat-info">
              <div className="stat-value">{studyPlan.length}</div>
              <div className="stat-label">Subjects Tracked</div>
            </div>
          </div>
          <div className={`stat-card ${activeView === 'tests' ? 'active-stat' : ''}`} style={{ cursor: 'pointer', border: activeView === 'tests' ? '2px solid var(--accent)' : '' }} onClick={() => setActiveView('tests')}>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>📝</div>
            <div className="stat-info">
              <div className="stat-value">{studyPlan.filter(s => s.testDate).length}</div>
              <div className="stat-label">Upcoming Tests</div>
            </div>
          </div>
          <div className={`stat-card ${activeView === 'seas' ? 'active-stat' : ''}`} style={{ cursor: 'pointer', border: activeView === 'seas' ? '2px solid var(--accent)' : '' }} onClick={() => setActiveView('seas')}>
            <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)' }}>🎭</div>
            <div className="stat-info">
              <div className="stat-value">{studyPlan.filter(s => s.seaDate).length}</div>
              <div className="stat-label">Upcoming SEAs</div>
            </div>
          </div>
          <div className={`stat-card ${activeView === 'topics' ? 'active-stat' : ''}`} style={{ cursor: 'pointer', border: activeView === 'topics' ? '2px solid var(--accent)' : '' }} onClick={() => setActiveView('topics')}>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>📖</div>
            <div className="stat-info">
              <div className="stat-value">{studyPlan.reduce((acc, s) => acc + s.topics.length, 0)}</div>
              <div className="stat-label">Topics Covered</div>
            </div>
          </div>
          <div className={`stat-card ${activeView === 'resources' ? 'active-stat' : ''}`} style={{ cursor: 'pointer', border: activeView === 'resources' ? '2px solid var(--accent)' : '' }} onClick={() => setActiveView('resources')}>
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>💡</div>
            <div className="stat-info">
              <div className="stat-value">6+</div>
              <div className="stat-label">Curated Resources</div>
            </div>
          </div>
        </div>

        {/* Dynamic View Content */}
        <div className="card animate-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 240px)' }}>
          <div className="card-header">
            <span className="card-title">
              {activeView === 'subjects' && '📘 All Subjects'}
              {activeView === 'tests' && '📝 Upcoming Tests Details'}
              {activeView === 'seas' && '🎭 Upcoming SEA Details'}
              {activeView === 'topics' && '📖 Subject-wise Topics Covered'}
              {activeView === 'resources' && '💡 Curated STEM & Coding Resources'}
            </span>
          </div>
          <div className="card-body" style={{ overflowY: 'auto', padding: activeView === 'topics' ? 0 : 20 }}>
            
            {activeView === 'resources' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ padding: 16, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--yellow)' }}>1. The "Gold Standard" (Best for Starting)</h3>
                  <ul style={{ fontSize: 13, paddingLeft: 20, margin: 0 }}>
                    <li><a href="https://scratch.mit.edu/" target="_blank" rel="noreferrer">Scratch</a>: <strong>(Ages 8+)</strong> The definitive platform for visual, block-based coding. It is entirely free, managed by MIT, and has a massive community where kids can explore and "remix" other people's projects to learn how they work.</li>
                    <li style={{ marginTop: 8 }}><a href="https://www.tinkercad.com/" target="_blank" rel="noreferrer">Tinkercad</a>: <strong>(All Ages)</strong> Since you already know this, you likely know it’s the best free tool for 3D design and circuit simulation. It’s professional-grade but simplified for kids, and it’s completely ad-free.</li>
                  </ul>
                </div>

                <div style={{ padding: 16, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--blue)' }}>2. Transitioning to Real Programming (JavaScript & Python)</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>When kids are ready to move beyond blocks, these platforms provide a gentle but powerful "real world" coding experience:</p>
                  <ul style={{ fontSize: 13, paddingLeft: 20, margin: 0 }}>
                    <li><a href="https://codeguppy.com/" target="_blank" rel="noreferrer">CodeGuppy</a>: Excellent for kids (10+) ready to move from blocks to text-based JavaScript. It is 100% free with no feature restrictions and focuses on creative, visual outputs like animations and games.</li>
                    <li style={{ marginTop: 8 }}><a href="https://www.khanacademy.org/computing/computer-programming" target="_blank" rel="noreferrer">Khan Academy</a>: Their computer science track is high-quality and completely free. It uses a very visual version of JavaScript that provides instant feedback, making it much less intimidating than standard coding environments.</li>
                    <li style={{ marginTop: 8 }}><a href="https://replit.com/" target="_blank" rel="noreferrer">Replit</a>: <strong>(Ages 13+)</strong> For teens or advanced pre-teens. It provides a "pro" development environment in the browser. It supports almost any language (Python, C++, HTML/CSS) and is what professional developers use to collaborate.</li>
                  </ul>
                </div>

                <div style={{ padding: 16, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--pink, #ec4899)' }}>3. Game-Based Learning (Actually Educational)</h3>
                  <ul style={{ fontSize: 13, paddingLeft: 20, margin: 0 }}>
                    <li><a href="https://code.org/" target="_blank" rel="noreferrer">Code.org</a>: The best curated path for structured learning. It has excellent, themed "Hour of Code" tutorials (Minecraft, Star Wars, AI) that are highly engaging and build foundational logic.</li>
                    <li style={{ marginTop: 8 }}><a href="https://education.minecraft.net/" target="_blank" rel="noreferrer">Minecraft: Education Edition</a>: If you already have access to Minecraft, the Education Edition is an incredible, free-to-use platform (if your school or organization provides a login) for teaching engineering, chemistry, and coding via Redstone.</li>
                  </ul>
                </div>

                <div style={{ padding: 16, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--color-event)' }}>Why these are "Worth It" vs. Paid Alternatives</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Most paid apps use "subscription traps"—they lock progress behind a paywall and rely on gamified loops that lose their appeal after a few weeks. The free platforms above are "worth it" because:</p>
                  <ul style={{ fontSize: 13, paddingLeft: 20, margin: 0 }}>
                    <li><strong>Open-Ended Creativity:</strong> They allow kids to build anything rather than just solving pre-set puzzles.</li>
                    <li style={{ marginTop: 8 }}><strong>Professional Parity:</strong> The skills learned in these tools (like JavaScript on CodeGuppy or 3D modeling in Tinkercad) translate directly to real-world career skills.</li>
                    <li style={{ marginTop: 8 }}><strong>Community & Safety:</strong> Platforms like Scratch are carefully moderated, allowing kids to learn from others in a safe environment.</li>
                  </ul>
                </div>

                <div style={{ padding: 16, background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--green)' }}>Recommendation</h3>
                  <ul style={{ fontSize: 13, paddingLeft: 20, margin: 0 }}>
                    <li><strong>If your child is under 10:</strong> Stick with Scratch and Code.org. They are the most robust, well-supported, and purely educational options.</li>
                    <li style={{ marginTop: 8 }}><strong>If your child is 10-14:</strong> Transition them to CodeGuppy or Khan Academy's coding courses. They provide the best "bridge" to actual professional programming without the cost of a bootcamp.</li>
                  </ul>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, marginBottom: 0, fontWeight: 500 }}>Does your child have a specific interest, like building games, robotics, or just making "cool stuff" on the computer?</p>
                </div>
              </div>
            )}
            
            {activeView === 'subjects' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {studyPlan.map((s, i) => {
                  const isExpanded = expandedSubject === i;
                  return (
                    <div key={i} onClick={() => setExpandedSubject(isExpanded ? null : i)} style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 24 }}>{getEmoji(s.name)}</span>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{s.name}</div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        • {s.topics.length} topics covered<br />
                        {s.testDate ? <span style={{ color: 'var(--color-test)', fontWeight: 600 }}>• Test on {s.testDate}</span> : '• No test scheduled'}<br />
                        {s.seaDate ? <span style={{ color: 'var(--pink, #ec4899)', fontWeight: 600 }}>• SEA on {s.seaDate}</span> : '• No SEA scheduled'}
                      </div>
                      
                      {isExpanded && s.topics.length > 0 && (
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                           <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Topics Covered</div>
                          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {s.topics.map((t, idx) => {
                              const geminiPrompt = `Act as an expert, fun, and encouraging tutor for an 8-year-old (Grade 3).\n\nYour task is to explain the ${s.name} topic: "${t.name}".\n\nContext: ${getSubjectContext(s.name)}\n\nPlease format your response like this:\n1. 🌟 The Big Idea: Explain the core concept using a fun, real-world analogy that an 8-year-old will immediately understand.\n2. 🚀 Why It's Cool: Give 4 exciting examples of how this is used in real life (e.g., video games, space, nature, robots, etc).\n3. 🧠 Quick Quiz: Give 2 multiple-choice questions to test their understanding. Ask them to answer before you reveal the truth!\n4. 📺 Deep Dive Resources: Provide 2 exact YouTube search terms or kid-friendly video links (like Dr. Binocs, Crash Course Kids) and 1 interactive online game/tool (like Khan Academy, Scratch) where they can practice this.`;
                              return (
                                <li key={idx} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                  <a 
                                    href="#"
                                    style={{ color: 'var(--blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                                    onClick={(e) => handleGeminiClick(e, geminiPrompt)}
                                    title="Deep Dive with Gemini"
                                  >
                                    <span>{t.name}</span>
                                    <span style={{ fontSize: 12 }}>✨</span>
                                  </a>
                                  {t.subTopics.length > 0 && <span style={{ color: 'var(--text-muted)' }}> ({t.subTopics.join(', ')})</span>}
                                  {t.videoLink && (
                                    <a 
                                      href="#"
                                      style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-test)', textDecoration: 'none' }}
                                      onClick={(e) => handleLinkClick(e, t.videoLink)}
                                    >
                                      [▶️ Watch Original Video]
                                    </a>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeView === 'tests' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {studyPlan.filter(s => s.testDate).length > 0 ? (
                  studyPlan.filter(s => s.testDate).map((s, i) => (
                    <div key={i} style={{ padding: 16, background: 'rgba(245, 158, 11, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-test)' }}>{getEmoji(s.name)} {s.name} Periodic Test</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>📅 {s.testDate}</span>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>{s.testTopics}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a href="#" className="btn btn-sm" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)' }} onClick={(e) => handleLinkClick(e, `https://www.youtube.com/results?search_query=Grade+3+${encodeURIComponent(s.name)}+${encodeURIComponent(s.testTopics)}`)}>🔍 YouTube Search</a>
                        <a href="#" className="btn btn-sm" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)' }} onClick={(e) => handleGeminiClick(e, `Act as a fun, encouraging teacher. Create a 5-question practice quiz for an 8-year-old studying ${s.name} on the topic of "${s.testTopics}".\n\nContext: ${getSubjectContext(s.name)}\n\nMake the questions interactive. Ask them one at a time, wait for my child's answer, and provide a helpful, cheerful hint if they get it wrong!`)}>✨ Generate Quiz with Gemini</a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No upcoming tests!</div>
                )}
              </div>
            )}

            {activeView === 'seas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {studyPlan.filter(s => s.seaDate).length > 0 ? (
                  studyPlan.filter(s => s.seaDate).map((s, i) => (
                    <div key={i} style={{ padding: 16, background: 'rgba(236, 72, 153, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--pink, #ec4899)' }}>{getEmoji(s.name)} {s.name} Subject Enrichment Activity (SEA)</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>📅 {s.seaDate}</span>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>{s.seaTopics}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a href="#" className="btn btn-sm" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)' }} onClick={(e) => handleGeminiClick(e, `Act as a creative learning expert for kids. Give me 3 incredibly fun, hands-on project ideas for a 3rd grade ${s.name} Enrichment Activity about "${s.seaTopics}".\n\nContext: ${getSubjectContext(s.name)}\n\nFor each idea, include:\n- A catchy title\n- What simple household materials we need\n- Step-by-step instructions for an 8-year-old.`)}>✨ Brainstorm Ideas with Gemini</a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No upcoming SEAs!</div>
                )}
              </div>
            )}

            {activeView === 'topics' && (
              <table className="data-table" style={{ margin: 0, border: 'none' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)' }}>
                  <tr>
                    <th style={{ padding: '12px 20px', width: '20%' }}>Subject</th>
                    <th style={{ padding: '12px 20px', width: '20%' }}>Last Covered</th>
                    <th style={{ padding: '12px 20px', width: '40%' }}>Topic Details</th>
                    <th style={{ padding: '12px 20px', width: '20%' }}>Resources</th>
                  </tr>
                </thead>
                <tbody>
                  {studyPlan.flatMap(s => s.topics.map((t, idx) => {
                    const geminiPrompt = `Act as an expert, fun, and encouraging tutor for an 8-year-old (Grade 3).\n\nYour task is to explain the ${s.name} topic: "${t.name}".\n\nContext: ${getSubjectContext(s.name)}\n\nPlease format your response like this:\n1. 🌟 The Big Idea: Explain the core concept using a fun, real-world analogy that an 8-year-old will immediately understand.\n2. 🚀 Why It's Cool: Give 4 exciting examples of how this is used in real life (e.g., video games, space, nature, robots, etc).\n3. 🧠 Quick Quiz: Give 2 multiple-choice questions to test their understanding. Ask them to answer before you reveal the truth!\n4. 📺 Deep Dive Resources: Provide 2 exact YouTube search terms or kid-friendly video links (like Dr. Binocs, Crash Course Kids) and 1 interactive online game/tool (like Khan Academy, Scratch) where they can practice this.`;
                    return (
                      <tr key={`${s.name}-${idx}`}>
                        <td style={{ padding: '12px 20px', fontWeight: 600 }}>{getEmoji(s.name)} {s.name}</td>
                        <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{t.lastCovered}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <div style={{ fontWeight: 500 }}>{t.name}</div>
                          {t.subTopics.length > 0 && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Subtopics: {t.subTopics.join(', ')}</div>}
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          <a href="#" className="btn btn-sm" style={{ padding: '6px 12px', fontSize: 11, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--blue)', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', gap: 6, width: 'max-content' }} onClick={(e) => handleGeminiClick(e, geminiPrompt)}>
                            ✨ Deep Dive with Gemini
                          </a>
                          {t.videoLink && (
                            <a href="#" className="btn btn-sm" style={{ padding: '6px 12px', marginTop: 8, fontSize: 11, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: 6, width: 'max-content' }} onClick={(e) => handleLinkClick(e, t.videoLink)}>
                              ▶️ Watch Video
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
