/**
 * Generate .ics (iCalendar) file content for Google Calendar import.
 */

const TIMEZONE = 'Asia/Kolkata';

function formatDate(dateStr) {
  // Parse dates like "3-Apr-26", "25-Apr-2026", "23-Jul-2026"
  const months = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
    January: '01', February: '02', March: '03', April: '04',
    June: '06', July: '07', August: '08', September: '09',
    October: '10', November: '11', December: '12',
  };

  // Try "3-Apr-26" format
  let match = dateStr.match(/(\d{1,2})-(\w{3})-(\d{2,4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = months[match[2]] || '01';
    let year = match[3];
    if (year.length === 2) year = '20' + year;
    return `${year}${month}${day}`;
  }

  // Try "25 April 2026" or "Friday, 3 July 2026"
  match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = months[match[2]] || '01';
    return `${match[3]}${month}${day}`;
  }

  // Try "25-Apr-2026"
  match = dateStr.match(/(\d{1,2})-(\w+)-(\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = months[match[2]] || '01';
    return `${match[3]}${month}${day}`;
  }

  return null;
}

function createEvent(summary, dateStr, description = '', category = '') {
  const date = formatDate(dateStr);
  if (!date) return '';

  const uid = `${date}-${summary.replace(/\s+/g, '-').toLowerCase()}@vibgyor-dashboard`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${date}`,
    `DTEND;VALUE=DATE:${date}`,
    `DTSTAMP:${stamp}`,
    `UID:${uid}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description.replace(/\n/g, '\\n')}` : '',
    category ? `CATEGORIES:${category}` : '',
    'END:VEVENT',
  ].filter(Boolean).join('\r\n');
}

export function generateICS(events, title = 'VIBGYOR Grade 3B - School Calendar') {
  const icsEvents = events
    .map(e => createEvent(
      e.name || e.summary,
      e.date || e.from_date,
      e.details || e.description || '',
      e.category || ''
    ))
    .filter(Boolean);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//VIBGYOR Dashboard//Grade3B//EN`,
    `X-WR-CALNAME:${title}`,
    `X-WR-TIMEZONE:${TIMEZONE}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...icsEvents,
    'END:VCALENDAR',
  ].join('\r\n');

  return ics;
}

export function downloadICS(events, filename = 'vibgyor-calendar.ics') {
  const ics = generateICS(events);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportHolidays(holidays) {
  const events = holidays.map(h => ({
    name: `🏖️ ${h.name}`,
    date: h.from_date,
    category: 'Holiday',
    description: `School Holiday - ${h.days} day(s)`,
  }));
  downloadICS(events, 'vibgyor-holidays-2026-27.ics');
}

export function exportAllEvents(holidays, events) {
  const allEvents = [
    ...holidays.map(h => ({
      name: `🏖️ ${h.name}`,
      date: h.from_date,
      category: 'Holiday',
      description: `School Holiday - ${h.days} day(s)`,
    })),
    ...events.map(e => ({
      name: `📌 ${e.name}`,
      date: e.date,
      category: e.category || 'Event',
      description: e.details || '',
    })),
  ];
  downloadICS(allEvents, 'vibgyor-all-events-2026-27.ics');
}
