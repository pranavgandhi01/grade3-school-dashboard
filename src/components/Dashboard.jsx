import { useState } from 'react';
import { HOLIDAYS, EVENTS, DAILY_UPDATES, REVIEW_SCHEDULE, DICTATION_WORDS, SPA_ACTIVITIES } from '../data/schoolData';

function getNextEvent(events, holidays) {
  const now = new Date();
  const allEvents = [
    ...holidays.map(h => ({ name: h.name, date: h.from_date, type: 'holiday' })),
    ...events.map(e => ({ name: e.name, date: e.date, type: e.category || 'event' })),
  ];

  const parseDate = (d) => {
    if (!d) return null;
    const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    let m = d.match(/(\d{1,2})-(\w{3})-(\d{2,4})/);
    if (m) {
      let yr = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
      return new Date(yr, months[m[2]], parseInt(m[1]));
    }
    m = d.match(/(\d{1,2})-(\w+)-(\d{4})/);
    if (m) return new Date(parseInt(m[3]), months[m[2]?.slice(0,3)], parseInt(m[1]));
    return null;
  };

  const upcoming = allEvents
    .map(e => ({ ...e, dateObj: parseDate(e.date) }))
    .filter(e => e.dateObj && e.dateObj >= now)
    .sort((a, b) => a.dateObj - b.dateObj);

  return upcoming;
}

function daysUntil(dateStr) {
  const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  let m = dateStr?.match(/(\d{1,2})-(\w{3})-(\d{2,4})/);
  if (!m) return null;
  let yr = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
  const target = new Date(yr, months[m[2]], parseInt(m[1]));
  const now = new Date();
  now.setHours(0,0,0,0);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

export default function Dashboard({ setActivePage }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const upcoming = getNextEvent(EVENTS, HOLIDAYS);
  const nextHoliday = upcoming.find(e => e.type === 'holiday');
  const nextEvent = upcoming.find(e => e.type !== 'holiday');

  // Find tests from review schedule
  const testsCount = REVIEW_SCHEDULE.filter(r => r.periodic_test_date).length;
  const seaCount = REVIEW_SCHEDULE.filter(r => r.sea_date).length;

  // Latest daily update
  const latestUpdate = DAILY_UPDATES.length > 0 ? DAILY_UPDATES[DAILY_UPDATES.length - 1] : null;

  // New words today
  const totalWords = DICTATION_WORDS.length;

  const categoryColors = {
    holiday: 'var(--color-holiday)',
    school_event: 'var(--color-event)',
    ptm: 'var(--color-ptm)',
    field_trip: 'var(--color-trip)',
    competition: 'var(--color-competition)',
    picnic: 'var(--color-trip)',
    event: 'var(--color-event)',
  };

  const [expandedEventIndex, setExpandedEventIndex] = useState(null);
  const [activeStat, setActiveStat] = useState(null);

  return (
    <>
      <div className="page-header">
        <div className="page-title">👋 Good {today.getHours() < 12 ? 'Morning' : today.getHours() < 17 ? 'Afternoon' : 'Evening'}!</div>
        <div className="page-subtitle">{dateStr} • VIBGYOR Rise Malad • Grade 3B</div>
      </div>

      <div className="page-body">
        {/* Stat Cards */}
        <div className="stat-grid stagger" style={{ marginBottom: activeStat ? 16 : 28 }}>
          <div className={`stat-card ${activeStat === 'holidays' ? 'active-stat' : ''}`} style={{ cursor: 'pointer', border: activeStat === 'holidays' ? '2px solid var(--accent)' : '' }} onClick={() => setActiveStat(activeStat === 'holidays' ? null : 'holidays')}>
            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>🏖️</div>
            <div className="stat-info">
              <div className="stat-value">{nextHoliday ? daysUntil(nextHoliday.date) : '—'}</div>
              <div className="stat-label">Days to Next Holiday</div>
              <div className="stat-detail">{nextHoliday?.name || 'No upcoming'}</div>
            </div>
          </div>

          <div className={`stat-card ${activeStat === 'assessments' ? 'active-stat' : ''}`} style={{ cursor: 'pointer', border: activeStat === 'assessments' ? '2px solid var(--accent)' : '' }} onClick={() => setActiveStat(activeStat === 'assessments' ? null : 'assessments')}>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>📝</div>
            <div className="stat-info">
              <div className="stat-value">{testsCount + seaCount}</div>
              <div className="stat-label">Upcoming Assessments</div>
              <div className="stat-detail">{testsCount} tests, {seaCount} SEAs</div>
            </div>
          </div>

          <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setActivePage && setActivePage('dictation')}>
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>📖</div>
            <div className="stat-info">
              <div className="stat-value">{totalWords}</div>
              <div className="stat-label">Dictation Words</div>
              <div className="stat-detail">From {DAILY_UPDATES.length} daily updates</div>
            </div>
          </div>

          <div className={`stat-card ${activeStat === 'events' ? 'active-stat' : ''}`} style={{ cursor: 'pointer', border: activeStat === 'events' ? '2px solid var(--accent)' : '' }} onClick={() => setActiveStat(activeStat === 'events' ? null : 'events')}>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>🎯</div>
            <div className="stat-info">
              <div className="stat-value">{upcoming.length}</div>
              <div className="stat-label">Upcoming Events</div>
              <div className="stat-detail">{HOLIDAYS.length} holidays this year</div>
            </div>
          </div>
        </div>

        {/* Dynamic Stat Details Panel */}
        {activeStat && (
          <div className="card animate-in" style={{ marginBottom: 28, border: '2px solid var(--accent)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="card-title">
                {activeStat === 'holidays' && '🏖️ Upcoming Holidays'}
                {activeStat === 'assessments' && '📝 Upcoming Assessments (Tests & SEAs)'}
                {activeStat === 'words' && '📖 All Dictation Words'}
                {activeStat === 'events' && '🎯 All Upcoming Events'}
              </span>
              <button className="btn btn-sm" onClick={() => setActiveStat(null)}>✕ Close</button>
            </div>
            <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto', padding: activeStat === 'words' ? 20 : 0 }}>
              
              {activeStat === 'holidays' && (
                <table className="data-table" style={{ margin: 0, border: 'none' }}>
                  <tbody>
                    {HOLIDAYS.map((h, i) => (
                      <tr key={i}>
                        <td style={{ width: '120px', fontWeight: 600 }}>{h.date}</td>
                        <td style={{ fontWeight: 500, color: 'var(--color-holiday)' }}>{h.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{h.day}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeStat === 'assessments' && (
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {REVIEW_SCHEDULE.map((r, i) => (
                    <div key={i} style={{ padding: 16, background: 'rgba(245, 158, 11, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-test)', marginBottom: 8 }}>{r.subject}</div>
                      {r.periodic_test_date && (
                        <div style={{ marginBottom: 8 }}>
                          <span className="tag tag-yellow">Test: {r.periodic_test_date}</span>
                          <div style={{ marginTop: 4, fontSize: 13 }}>{r.periodic_test_topic}</div>
                        </div>
                      )}
                      {r.sea_date && (
                        <div>
                          <span className="tag tag-pink">SEA: {r.sea_date}</span>
                          <div style={{ marginTop: 4, fontSize: 13 }}>{r.sea_topic}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeStat === 'events' && (
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {upcoming.map((e, i) => (
                    <div key={i} style={{ padding: 12, background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>{e.name}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{e.date}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase' }}>{e.type}</div>
                      {e.details && <div style={{ fontSize: 13, marginTop: 8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{e.details}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Two column layout */}
        <div className="grid-2" style={{ marginBottom: 28 }}>
          {/* Upcoming Events */}
          <div className="card animate-in">
            <div className="card-header">
              <span className="card-title">📌 Upcoming Events</span>
              <span className="tag tag-violet">{upcoming.slice(0, 8).length} next</span>
            </div>
            <div className="card-body">
              <div className="event-list">
                {upcoming.slice(0, 8).map((e, i) => {
                  const isExpanded = expandedEventIndex === i;
                  return (
                    <div 
                      className="event-item" 
                      key={i} 
                      style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer' }}
                      onClick={() => setExpandedEventIndex(isExpanded ? null : i)}
                    >
                      <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                        <div className="event-dot" style={{ background: categoryColors[e.type] || 'var(--accent)' }} />
                        <div className="event-info" style={{ flex: 1 }}>
                          <div className="event-name">{e.name}</div>
                          <div className="event-date">{e.date} • {daysUntil(e.date) != null ? `${daysUntil(e.date)} days away` : ''}</div>
                        </div>
                        <span className="tag tag-blue" style={{ fontSize: 10 }}>{e.type}</span>
                      </div>
                      {isExpanded && (
                        <div style={{ marginTop: 12, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                            {e.details || "No additional details available for this event."}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Latest Daily Update */}
          <div className="card animate-in">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="card-title">📝 Latest Daily Update</span>
                {latestUpdate && <span className="tag tag-green">{latestUpdate.date}</span>}
              </div>
              {latestUpdate?.source_file && (
                <a 
                  href={`/docs/${latestUpdate.source_file}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-sm"
                  style={{ textDecoration: 'none' }}
                  title="Click to open PDF"
                >
                  📄 View PDF
                </a>
              )}
            </div>
            <div className="card-body">
              {latestUpdate ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {latestUpdate.periods.slice(0, 6).map((p, i) => (
                    <div className="period-card" key={i}>
                      <div className="period-number">Period {p.period}</div>
                      <div className="period-subject">{p.subject}</div>
                      {p.topic && <div className="period-topic">{p.topic}</div>}
                    </div>
                  ))}
                  {latestUpdate.new_words.length > 0 && (
                    <div style={{ marginTop: 8, padding: '12px 16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-accent)' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-light)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>New Words</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {latestUpdate.new_words.map((w, i) => (
                          <span className="tag tag-violet" key={i}>{w}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📝</div>
                  <div className="empty-state-text">No daily updates yet</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Review Schedule & SPA Activities */}
        <div className="grid-2">
          {/* Review Schedule */}
          <div className="card animate-in">
            <div className="card-header">
              <span className="card-title">📋 Review Schedule</span>
              <span className="tag tag-yellow">Term 1</span>
            </div>
            <div className="card-body">
              {REVIEW_SCHEDULE.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Test Date</th>
                      <th>SEA Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REVIEW_SCHEDULE.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.subject}</td>
                        <td>{r.periodic_test_date || '—'}</td>
                        <td>{r.sea_date || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-text">No review schedule available</div>
                </div>
              )}
            </div>
          </div>

          {/* SPA Activities */}
          <div className="card animate-in">
            <div className="card-header">
              <span className="card-title">🏅 SPA Activities</span>
              <span className="tag tag-orange">{SPA_ACTIVITIES.length} activities</span>
            </div>
            <div className="card-body">
              <div className="event-list">
                {SPA_ACTIVITIES.map((a, i) => (
                  <div className="event-item" key={i}>
                    <div className="event-dot" style={{ background: ['var(--violet)', 'var(--blue)', 'var(--green)', 'var(--yellow)', 'var(--orange)', 'var(--red)'][i % 6] }} />
                    <div className="event-info">
                      <div className="event-name">{a.name}</div>
                      <div className="event-date">
                        {Object.entries(a.schedule || {}).map(([day, time]) => `${day} ${time.start}-${time.end}`).join(' • ') || 'Schedule TBD'}
                      </div>
                    </div>
                    {a.fee_half_yearly && <span className="tag tag-green">₹{a.fee_half_yearly}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
