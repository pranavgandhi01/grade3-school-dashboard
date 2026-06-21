import { useState } from 'react';
import { HOLIDAYS, EVENTS, REVIEW_SCHEDULE } from '../data/schoolData';
import { exportHolidays, exportAllEvents } from '../utils/calendarExport';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS_MAP = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };

function parseDate(d) {
  if (!d) return null;
  const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  
  // Try matching "DD-MMM-YYYY" or "DD-MMMM-YYYY"
  let m = d.match(/(\d{1,2})-(\w{3,})-(\d{2,4})/);
  if (m) {
    let yr = m[3].length === 2 ? 2000 + parseInt(m[3]) : parseInt(m[3]);
    return new Date(yr, months[m[2].slice(0,3)], parseInt(m[1]));
  }

  // Try matching "Day, DD Month YYYY" (e.g., "Friday, 3 July 2026")
  m = d.match(/(\d{1,2})\s+(\w{3,})\s+(\d{4})/);
  if (m) {
    return new Date(parseInt(m[3]), months[m[2].slice(0,3)], parseInt(m[1]));
  }

  return null;
}

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const days = [];

  // Previous month padding
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, otherMonth: true });
  }
  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), otherMonth: false });
  }
  // Next month padding
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), otherMonth: true });
  }
  return days;
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function isInRange(date, fromStr, toStr) {
  const from = parseDate(fromStr);
  const to = parseDate(toStr);
  if (!from) return false;
  if (!to) return isSameDay(date, from);
  return date >= from && date <= to;
}

const categoryColors = {
  holiday: 'var(--color-holiday)',
  school_event: 'var(--color-event)',
  ptm: 'var(--color-ptm)',
  field_trip: 'var(--color-trip)',
  competition: 'var(--color-competition)',
  picnic: 'var(--color-trip)',
  test: 'var(--yellow)',
  sea: 'var(--pink, #ec4899)',
};

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [filter, setFilter] = useState('all');

  const days = getMonthDays(currentYear, currentMonth);
  const today = new Date();

  const prev = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const next = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const getEventsForDay = (date) => {
    const items = [];
    HOLIDAYS.forEach(h => {
      if (isInRange(date, h.from_date, h.to_date)) {
        items.push({ name: h.name, type: 'holiday', color: categoryColors.holiday });
      }
    });
    EVENTS.forEach(e => {
      const ed = parseDate(e.date);
      if (ed && isSameDay(date, ed)) {
        items.push({ name: e.name, type: e.category || 'event', color: categoryColors[e.category] || 'var(--accent)', details: e.details });
      }
    });
    REVIEW_SCHEDULE.forEach(r => {
      if (r.periodic_test_date) {
        const pd = parseDate(r.periodic_test_date);
        if (pd && isSameDay(date, pd)) {
          items.push({ name: `${r.subject} Test`, type: 'test', color: categoryColors.test, details: r.periodic_test_topic });
        }
      }
      if (r.sea_date) {
        const sd = parseDate(r.sea_date);
        if (sd && isSameDay(date, sd)) {
          items.push({ name: `${r.subject} SEA`, type: 'sea', color: categoryColors.sea, details: r.sea_topic });
        }
      }
    });
    return items;
  };

  const getUpcomingEvents = () => {
    const items = [];
    const now = new Date();
    now.setHours(0,0,0,0);
    HOLIDAYS.forEach(h => {
      const hd = parseDate(h.from_date);
      if (hd && hd >= now) {
        items.push({ name: h.name, type: 'holiday', color: categoryColors.holiday, date: hd });
      }
    });
    EVENTS.forEach(e => {
      const ed = parseDate(e.date);
      if (ed && ed >= now) {
        items.push({ name: e.name, type: e.category || 'event', color: categoryColors[e.category] || 'var(--accent)', date: ed });
      }
    });
    REVIEW_SCHEDULE.forEach(r => {
      if (r.periodic_test_date) {
        const pd = parseDate(r.periodic_test_date);
        if (pd && pd >= now) {
          items.push({ name: `${r.subject} Test`, type: 'test', color: categoryColors.test, date: pd });
        }
      }
      if (r.sea_date) {
        const sd = parseDate(r.sea_date);
        if (sd && sd >= now) {
          items.push({ name: `${r.subject} SEA`, type: 'sea', color: categoryColors.sea, date: sd });
        }
      }
    });
    items.sort((a, b) => a.date - b.date);
    return items;
  };

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'holiday', label: 'Holidays' },
    { id: 'event', label: 'Events' },
  ];

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-title">📅 Academic Calendar</div>
            <div className="page-subtitle">AY 2026-27 • {HOLIDAYS.length} holidays • {EVENTS.length} events</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={() => exportHolidays(HOLIDAYS)}>📥 Export Holidays</button>
            <button className="btn btn-primary btn-sm" onClick={() => exportAllEvents(HOLIDAYS, EVENTS)}>📅 Export All to Google Calendar</button>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div className="month-nav">
            <button className="month-nav-btn" onClick={prev}>←</button>
            <div className="month-name">{MONTH_NAMES[currentMonth]} {currentYear}</div>
            <button className="month-nav-btn" onClick={next}>→</button>
          </div>
          <div className="tabs">
            {filters.map(f => (
              <button key={f.id} className={`tab ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          {/* Calendar Grid */}
          <div style={{ flex: 1 }}>
            <div className="card">
              <div className="card-body" style={{ padding: 12 }}>
                <div className="calendar-grid">
                  {DAY_NAMES.map(d => (
                    <div className="calendar-header-cell" key={d}>{d}</div>
                  ))}
                  {days.map((day, i) => {
                    const events = getEventsForDay(day.date);
                    const isToday = !day.otherMonth && isSameDay(day.date, today);
                    const isHoliday = events.some(e => e.type === 'holiday');
                    const hasEvent = events.length > 0;
                    const isSelected = selectedDay && isSameDay(day.date, selectedDay);
                    const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;

                    const filteredEvents = filter === 'all' ? events :
                      filter === 'holiday' ? events.filter(e => e.type === 'holiday') :
                      events.filter(e => e.type !== 'holiday');

                    return (
                      <div
                        key={i}
                        className={`calendar-cell ${day.otherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isHoliday ? 'holiday' : ''} ${hasEvent ? 'has-event' : ''}`}
                        style={{
                          ...(isSelected ? { background: 'rgba(139, 92, 246, 0.2)', borderColor: 'var(--accent)' } : {}),
                          ...(isWeekend && !day.otherMonth ? { background: 'rgba(255,255,255,0.02)' } : {}),
                        }}
                        onClick={() => setSelectedDay(day.date)}
                      >
                        <span className="calendar-day-num" style={isToday ? { color: 'var(--accent)', fontWeight: 800 } : isHoliday ? { color: 'var(--color-holiday)' } : {}}>
                          {day.date.getDate()}
                        </span>
                        {filteredEvents.length > 0 && (
                          <div className="calendar-dots">
                            {filteredEvents.slice(0, 3).map((e, j) => (
                              <div key={j} className="calendar-dot-indicator" style={{ background: e.color }} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
              {Object.entries(categoryColors).map(([key, color]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  {key.replace(/_/g, ' ')}
                </div>
              ))}
            </div>
          </div>

          {/* Day Detail Panel */}
          <div style={{ width: 320, flexShrink: 0 }}>
            <div className="card" style={{ position: 'sticky', top: 90 }}>
              <div className="card-header">
                <span className="card-title">
                  {selectedDay ? selectedDay.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Select a date'}
                </span>
              </div>
              <div className="card-body">
                {selectedEvents.length > 0 ? (
                  <div className="event-list">
                    {selectedEvents.map((e, i) => (
                      <div key={i} style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderLeftWidth: 3, borderLeftColor: e.color }}>
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: e.color, marginBottom: 4 }}>{e.type}</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{e.name}</div>
                        {e.details && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>{e.details.slice(0, 200)}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="empty-state" style={{ padding: 24, borderBottom: selectedDay ? 'none' : '1px solid var(--border)' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                      <div className="empty-state-text">{selectedDay ? 'No events on this day' : 'Click a date to see details'}</div>
                    </div>
                    
                    {!selectedDay && (
                      <div style={{ padding: '16px' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Next Upcoming</div>
                        <div className="event-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {getUpcomingEvents()
                            .filter(e => {
                              if (filter === 'all') return true;
                              if (filter === 'holiday') return e.type === 'holiday';
                              return e.type !== 'holiday';
                            })
                            .slice(0, 8)
                            .map((e, i) => (
                              <div key={i} style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-glass)', borderLeft: `3px solid ${e.color}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{e.name}</div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
                                <span>{e.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                <span style={{ color: e.color, fontWeight: 500, textTransform: 'uppercase' }}>{e.type}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
