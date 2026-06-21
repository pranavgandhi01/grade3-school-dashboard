import { useState } from 'react';
import { EVENTS, HOLIDAYS, SPA_ACTIVITIES, EXTERNAL_EXAMS } from '../data/schoolData';
import { downloadICS } from '../utils/calendarExport';

const categoryConfig = {
  holiday: { icon: '🏖️', color: 'var(--color-holiday)', label: 'Holiday', tagClass: 'tag-red' },
  school_event: { icon: '🎪', color: 'var(--color-event)', label: 'School Event', tagClass: 'tag-blue' },
  ptm: { icon: '👨‍👩‍👧', color: 'var(--color-ptm)', label: 'PTM', tagClass: 'tag-green' },
  field_trip: { icon: '🚌', color: 'var(--color-trip)', label: 'Field Trip', tagClass: 'tag-violet' },
  competition: { icon: '🏆', color: 'var(--color-competition)', label: 'Competition', tagClass: 'tag-pink' },
  picnic: { icon: '🎡', color: 'var(--color-trip)', label: 'Picnic', tagClass: 'tag-violet' },
};

export default function Events() {
  const [activeTab, setActiveTab] = useState('events');
  const [expandedEvent, setExpandedEvent] = useState(null);

  // Build events list with categories
  const allEvents = [
    ...EVENTS.map(e => ({
      ...e,
      category: e.category || 'school_event',
    })),
  ].sort((a, b) => {
    const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    const parse = (d) => {
      if (!d) return 0;
      let m = d.match(/(\d{1,2})-(\w{3})-(\d{2,4})/);
      if (m) { let yr = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]); return new Date(yr, months[m[2]], parseInt(m[1])).getTime(); }
      return 0;
    };
    return parse(a.date) - parse(b.date);
  });

  const tabs = [
    { id: 'events', label: `Events (${allEvents.length})` },
    { id: 'holidays', label: `Holidays (${HOLIDAYS.length})` },
    { id: 'activities', label: `Activities (${SPA_ACTIVITIES.length})` },
    { id: 'exams', label: 'External Exams' },
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-title">🎯 Events & Activities</div>
        <div className="page-subtitle">Everything happening at VIBGYOR Rise this academic year</div>
      </div>

      <div className="page-body">
        <div className="tabs" style={{ marginBottom: 24 }}>
          {tabs.map(t => (
            <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'events' && (
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allEvents.map((event, i) => {
              const config = categoryConfig[event.category] || categoryConfig.school_event;
              const isExpanded = expandedEvent === i;

              return (
                <div className="card" key={i} style={{ cursor: 'pointer' }} onClick={() => setExpandedEvent(isExpanded ? null : i)}>
                  <div className="card-body" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ fontSize: 28, width: 44, textAlign: 'center' }}>{config.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{event.name}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                          <span className={`tag ${config.tagClass}`}>{config.label}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📅 {event.date}</span>
                        </div>
                      </div>
                      <button
                        className="btn btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadICS([{ name: event.name, date: event.date, description: event.details || '' }], `${event.name.replace(/\s+/g, '-')}.ics`);
                        }}
                      >
                        📅
                      </button>
                    </div>

                    {isExpanded && event.details && (
                      <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                          {event.details}
                        </p>
                        {event.things_to_carry && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-light)', marginBottom: 4 }}>🎒 Things to Carry</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{event.things_to_carry}</div>
                          </div>
                        )}
                        {event.cost && <div style={{ marginTop: 8, fontSize: 13 }}>💰 Cost: <strong>{event.cost}</strong></div>}
                        {event.reporting_time && <div style={{ fontSize: 13 }}>⏰ Reporting: {event.reporting_time}</div>}
                        {event.materials && <div style={{ fontSize: 13 }}>🎨 Materials: {event.materials}</div>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'holidays' && (
          <div className="card">
            <div className="card-body">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Holiday</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                  </tr>
                </thead>
                <tbody>
                  {HOLIDAYS.map((h, i) => (
                    <tr key={i}>
                      <td>{h.sr_no}</td>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>🏖️ {h.name}</td>
                      <td>{h.from_date}</td>
                      <td>{h.to_date}</td>
                      <td><span className="tag tag-red">{h.days} day{h.days > 1 ? 's' : ''}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="grid-auto stagger">
            {SPA_ACTIVITIES.map((activity, i) => {
              const activityEmojis = ['🏏', '💃', '🥋', '🤾', '🎭', '⚽'];
              return (
                <div className="card" key={i}>
                  <div className="card-header">
                    <span className="card-title">
                      <span style={{ fontSize: 24 }}>{activityEmojis[i % activityEmojis.length]}</span>
                      {activity.name}
                    </span>
                  </div>
                  <div className="card-body">
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      Grades: {activity.grades}
                    </div>
                    <div style={{ fontSize: 12, marginBottom: 12 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.08em' }}>Schedule</div>
                      {Object.entries(activity.schedule || {}).map(([day, time]) => (
                        <div key={day} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>{day}</span>
                          <span style={{ color: 'var(--accent-light)' }}>{time.start} – {time.end}</span>
                        </div>
                      ))}
                    </div>
                    {activity.fee_half_yearly && (
                      <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>₹{activity.fee_half_yearly}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}> / half year</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'exams' && (
          <div>
            {EXTERNAL_EXAMS.exams ? (
              <>
                <div className="card" style={{ marginBottom: 20 }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        📅 Registration Deadline: <strong style={{ color: 'var(--color-test)' }}>{EXTERNAL_EXAMS.registration_deadline}</strong>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        🌐 Portal: <strong>{EXTERNAL_EXAMS.portal}</strong>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        📞 Contact: <strong>{EXTERNAL_EXAMS.contact}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid-auto stagger">
                  {EXTERNAL_EXAMS.exams.map((exam, i) => (
                    <div className="card" key={i}>
                      <div className="card-body" style={{ textAlign: 'center', padding: 28 }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>{['🧠', '🌿', '🔬'][i]}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{exam.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{exam.type}</div>
                        <span className="tag tag-violet">Grades: {exam.grades}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">External exam information not yet available</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
