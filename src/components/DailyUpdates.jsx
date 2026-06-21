import { useState } from 'react';
import { useUpdatesContext } from '../context/UpdatesContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const subjectColors = {
  'ENGLISH': 'var(--blue)',
  'MATH': 'var(--green)',
  'SCIENCE': 'var(--yellow)',
  'HINDI': 'var(--orange)',
  'SOCIAL STUDIES': 'var(--violet)',
  'SPA': 'var(--red)',
  'ART': 'var(--pink, #ec4899)',
  'ROBOTICS': 'var(--indigo)',
  'Marathi': 'var(--orange)',
  'SKILL PROGRAMME': 'var(--green)',
};

function getSubjectColor(subject) {
  if (!subject) return 'var(--accent)';
  const key = Object.keys(subjectColors).find(k => subject.toUpperCase().includes(k.toUpperCase()));
  return subjectColors[key] || 'var(--accent)';
}

export default function DailyUpdates() {
  const { updates, loading } = useUpdatesContext();
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (loading) {
    return <div className="page-header"><div className="page-title">Loading...</div></div>;
  }

  // Ensure index is within bounds
  const safeIndex = selectedIndex >= updates.length ? updates.length - 1 : selectedIndex;
  const update = updates[safeIndex];
  const sorted = [...updates].reverse();

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="page-title">📝 Daily Updates</div>
          <div className="page-subtitle">{updates.length} days of updates from class 3B WhatsApp group</div>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Date Selector */}
          <div style={{ width: 240, flexShrink: 0 }}>
            <div className="card" style={{ position: 'sticky', top: 90 }}>
              <div className="card-header">
                <span className="card-title">📅 Dates</span>
              </div>
              <div className="card-body" style={{ padding: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {sorted.map((u, i) => {
                    const realIndex = updates.length - 1 - i;
                    return (
                      <div
                        key={i}
                        className={`nav-item ${safeIndex === realIndex ? 'active' : ''}`}
                        onClick={() => setSelectedIndex(realIndex)}
                        style={{ padding: '8px 12px' }}
                      >
                        <span style={{ fontSize: 13 }}>{u.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Update Detail */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', overflow: 'hidden' }}>
            {update ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
                      {update.date}
                    </h2>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Grade {update.grade} • {update.periods.length} periods
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {update.source_file && (
                      <a href={`/docs/${update.source_file}`} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ marginRight: 8, textDecoration: 'none' }}>
                        📄 View Original PDF
                      </a>
                    )}
                    <button className="btn btn-sm" disabled={selectedIndex <= 0} onClick={() => setSelectedIndex(i => i - 1)}>← Prev</button>
                    <button className="btn btn-sm" disabled={selectedIndex >= updates.length - 1} onClick={() => setSelectedIndex(i => i + 1)}>Next →</button>
                  </div>
                </div>

                {/* 3-Panel Grid Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gridTemplateRows: '1fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
                  
                  {/* Left Column: What was taught today (Full Height) */}
                  <div className="card" style={{ gridRow: '1 / span 2', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '8px 12px' }}>
                      <span className="card-title" style={{ fontSize: 14 }}>🏫 What was Taught Today</span>
                    </div>
                    <div className="card-body" style={{ overflowY: 'auto', padding: 0 }}>
                      <table className="data-table" style={{ margin: 0, border: 'none' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
                          <tr>
                            <th style={{ padding: '6px 12px', fontSize: 12 }}>Sub</th>
                            <th style={{ padding: '6px 12px', fontSize: 12 }}>Topic & Classwork</th>
                          </tr>
                        </thead>
                        <tbody>
                          {update.periods.map((p, i) => (
                            <tr key={i}>
                              <td style={{ padding: '6px 12px', borderLeft: `3px solid ${getSubjectColor(p.subject)}` }}>
                                <span style={{ fontWeight: 600, fontSize: 11 }}>{p.subject?.split(' ')[0]}</span>
                              </td>
                              <td style={{ padding: '6px 12px' }}>
                                {p.topic && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{p.topic}</div>}
                                {p.classwork && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{p.classwork}</div>}
                                {!p.topic && !p.classwork && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Top Right: Homework */}
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '8px 12px' }}>
                      <span className="card-title" style={{ fontSize: 14 }}>📌 Homework Today</span>
                    </div>
                    <div className="card-body" style={{ overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {update.periods.filter(p => p.homework).length > 0 ? (
                        update.periods.filter(p => p.homework).map((p, i) => (
                          <div key={i} style={{ padding: 10, background: 'rgba(245, 158, 11, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-homework)' }}>{p.subject} {p.topic ? `(${p.topic})` : ''}</span>
                              {p.submission_date && <span style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', background: '#fee2e2', padding: '2px 6px', borderRadius: 4 }}>🚨 Due: {p.submission_date}</span>}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{p.homework}</div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-state" style={{ padding: '20px 0' }}>
                          <span style={{ fontSize: 20 }}>🎉</span>
                          <div className="empty-state-text" style={{ fontSize: 12 }}>No homework today!</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Right: Special Notes & New Words Merged */}
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="card-header" style={{ padding: '8px 12px' }}>
                      <span className="card-title" style={{ fontSize: 14 }}>ℹ️ Notes & Words</span>
                    </div>
                    <div className="card-body" style={{ overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Special Notes Section */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Special Notes</div>
                        {update.additional_info ? (
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                            {update.additional_info}
                          </p>
                        ) : (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No special notes.</div>
                        )}
                      </div>

                      {/* New Words Section */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>New Words Introduced</div>
                        {update.new_words?.length > 0 ? (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {update.new_words.map((w, i) => (
                              <span key={i} className="tag tag-blue" style={{ fontSize: 11, padding: '4px 8px', background: 'rgba(59, 130, 246, 0.1)' }}>{w}</span>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No new words.</div>
                        )}
                      </div>
                      {/* Attachments Section */}
                      {update.attachments && update.attachments.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Attachments</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {update.attachments.map((file, i) => (
                              <a 
                                key={i} 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ 
                                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', 
                                  background: 'var(--bg-secondary)', borderRadius: '6px', 
                                  color: 'var(--blue)', textDecoration: 'none', fontSize: 13, fontWeight: 500
                                }}
                              >
                                📎 {file.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <div className="empty-state-text">Select a date to view daily update</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
