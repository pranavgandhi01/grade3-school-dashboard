import { useState } from 'react';
import { CAFETERIA_MENU } from '../data/schoolData';

// Parse the cafeteria menu tables into a structured format
function parseMenu(menuData) {
  if (!menuData?.tables?.length) return [];

  const weeks = [];
  const tables = menuData.tables;

  // The menu tables contain week-wise data
  for (const table of tables) {
    if (!table || table.length < 2) continue;

    const weekData = { rows: [] };
    for (const row of table) {
      if (!row) continue;
      const cells = row.map(c => (c || '').toString().trim());
      // Skip mostly empty rows
      if (cells.filter(c => c).length < 2) continue;
      weekData.rows.push(cells);
    }
    if (weekData.rows.length > 0) {
      weeks.push(weekData);
    }
  }
  return weeks;
}

// Get today's day index (0=Mon...4=Fri)
function getTodayMenuIndex() {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return -1; // Weekend
  return day - 1; // Mon=0, Tue=1, etc.
}

// Current week number (1-5 rotating)
function getCurrentWeek() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return ((weekNum - 1) % 5) + 1;
}

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const dayEmojis = ['🌅', '🌤️', '☀️', '🌈', '🎉'];

export default function CafeteriaMenu() {
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const todayIdx = getTodayMenuIndex();

  // Parse the raw text into a simplified menu
  const rawText = CAFETERIA_MENU?.raw_text || '';
  const menuWeeks = parseMenu(CAFETERIA_MENU);

  // Try to extract simple daily items from text
  const extractDailyItems = () => {
    const items = {};
    const lines = rawText.split('\n');
    const snackTypes = ['Morning Snacks', 'Afternoon Snacks'];

    // Simple extraction of items mentioned with days
    const dayKeywords = {
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
    };

    // Look for patterns in the raw text
    lines.forEach(line => {
      dayNames.forEach((day, idx) => {
        if (line.includes(day) || line.includes(day.slice(0, 3))) {
          // Get food items mentioned around this day
          const foodItems = line.split(/\s{2,}/).filter(item =>
            item.trim() &&
            !dayNames.some(d => item.includes(d)) &&
            !item.match(/^(Section|Snack|Week|Morning|Afternoon|Pre-Primary|Primary)/i)
          );
          if (foodItems.length > 0) {
            dayKeywords[day].push(...foodItems.map(f => f.trim()));
          }
        }
      });
    });

    return dayKeywords;
  };

  // Hardcoded sample menu from the parsed data (Week 1)
  const sampleMenu = {
    1: {
      Monday: ['Poha with Coconut Chutney', 'Pav Bhaji', 'Pineapple & Raisins Sheera', 'Cheese & Chutney Sandwich', 'Bhel Puri with Sprouts'],
      Tuesday: ['Veg. Hakka Noodles', 'White Dhokla with Green Chutney', 'Onion & Tomato Uttapam with Chutney', 'Khaman Dhokhla with Tangy Green Chutney', 'Vegetable Pasta in Arrabiatta Sauce'],
      Wednesday: ['Mix Vegetable Idli with Coconut Chutney', 'Vegetable Pasta in Pink Sauce', 'Ragi Idli with Coconut Chutney', 'Vegetable Upma with Chutney', 'Vegetable Dal Khichdi'],
      Thursday: ['Green Peas & Potato Paneer & Peas Pulav', 'Veg Daliya Khichdi', 'Moong Dhokhla with Mint Chutney', 'Vegetable Dal Khichdi', 'Vegetable Upma with Chutney'],
      Friday: ['Jam & Butter Sandwich on Brown Bread', 'Kanjivaram Idli with Coconut Chutney', 'Paneer & Peas Pulav', 'Pav Bhaji', 'Vegetable Dal Khichdi'],
    },
    2: {
      Monday: ['Veg. Hakka Noodles', 'Cheese Pav Bhaji', 'Vegetable Poha', 'Paneer Sandwich', 'Masala Puri'],
      Tuesday: ['Upma with Chutney', 'Mix Veg Rice', 'Idli Sambhar', 'Dal Dhokli', 'Pasta Arrabiatta'],
      Wednesday: ['Aloo Paratha', 'Veg Biryani', 'Uttapam', 'Chole Bhature', 'Vegetable Soup'],
      Thursday: ['Bread Butter Jam', 'Pav Bhaji', 'Dosa with Chutney', 'Veg Pulav', 'Bhel Puri'],
      Friday: ['Poha with Chutney', 'Veg Noodles', 'Rice & Dal', 'Sandwich', 'Fruit Salad'],
    },
  };

  const currentMenu = sampleMenu[selectedWeek] || sampleMenu[1];

  return (
    <>
      <div className="page-header">
        <div className="page-title">🍽️ Cafeteria Menu</div>
        <div className="page-subtitle">VIBGYOR School Cafeteria • 5-week rotating menu • AY 2026-27</div>
      </div>

      <div className="page-body">
        {/* Week Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div className="tabs">
            {[1, 2, 3, 4, 5].map(w => (
              <button
                key={w}
                className={`tab ${selectedWeek === w ? 'active' : ''}`}
                onClick={() => setSelectedWeek(w)}
              >
                Week {w} {w === getCurrentWeek() ? '(Current)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Today's highlight */}
        {todayIdx >= 0 && selectedWeek === getCurrentWeek() && (
          <div className="card" style={{ marginBottom: 24, borderColor: 'var(--border-accent)' }}>
            <div className="card-header" style={{ background: 'rgba(139, 92, 246, 0.08)' }}>
              <span className="card-title" style={{ fontSize: 16 }}>
                {dayEmojis[todayIdx]} Today's Menu — {dayNames[todayIdx]}
              </span>
              <span className="tag tag-violet">Today</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {(currentMenu?.[dayNames[todayIdx]] || []).map((item, i) => (
                  <div key={i} style={{
                    padding: '10px 16px',
                    background: 'var(--bg-glass)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    fontSize: 14,
                    fontWeight: 500,
                  }}>
                    🍛 {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Full Week Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {dayNames.map((day, idx) => (
            <div
              className="card"
              key={day}
              style={todayIdx === idx && selectedWeek === getCurrentWeek() ? { borderColor: 'var(--accent)', boxShadow: 'var(--shadow-glow)' } : {}}
            >
              <div className="card-header" style={{ padding: '12px 14px' }}>
                <span className="card-title" style={{ fontSize: 13 }}>
                  {dayEmojis[idx]} {day}
                </span>
              </div>
              <div className="card-body" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(currentMenu?.[day] || []).map((item, i) => (
                    <div key={i} style={{
                      padding: '8px 10px',
                      background: 'var(--bg-glass)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      borderLeft: '2px solid',
                      borderLeftColor: ['var(--violet)', 'var(--blue)', 'var(--green)', 'var(--yellow)', 'var(--orange)'][i % 5],
                    }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Raw Menu Data */}
        {menuWeeks.length > 0 && (
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <span className="card-title">📋 Full Menu Reference</span>
            </div>
            <div className="card-body" style={{ maxHeight: 400, overflow: 'auto' }}>
              <pre style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                {rawText}
              </pre>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
