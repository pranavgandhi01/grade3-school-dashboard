import { useState, useEffect } from 'react';
import { DICTATION_WORDS } from '../data/schoolData';

const PROGRESS_KEY = 'vibgyor-dictation-progress';

function loadProgress() {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

export default function DictationWords() {
  const [search, setSearch] = useState('');
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [showWord, setShowWord] = useState(false);
  const [progress, setProgress] = useState(loadProgress);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  // Detect language
  const detectLang = (word) => {
    if (/[\u0900-\u097F]/.test(word)) return 'Hindi/Marathi';
    return 'English';
  };

  const words = DICTATION_WORDS.map(w => ({
    ...w,
    language: detectLang(w.word),
    mastered: progress[w.word]?.mastered || false,
    attempts: progress[w.word]?.attempts || 0,
  }));

  const filtered = words.filter(w => {
    if (search && !w.word.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'english') return w.language === 'English';
    if (filter === 'hindi') return w.language === 'Hindi/Marathi';
    if (filter === 'mastered') return w.mastered;
    if (filter === 'unmastered') return !w.mastered;
    return true;
  });

  const masteredCount = words.filter(w => w.mastered).length;

  const toggleMastered = (word) => {
    setProgress(prev => ({
      ...prev,
      [word]: {
        ...prev[word],
        mastered: !prev[word]?.mastered,
        attempts: (prev[word]?.attempts || 0) + 1,
      }
    }));
  };

  // Practice mode
  const practiceWords = words.filter(w => !w.mastered);
  const currentPracticeWord = practiceWords[currentWordIdx];

  const nextWord = () => {
    setShowWord(false);
    setCurrentWordIdx(i => (i + 1) % Math.max(practiceWords.length, 1));
  };

  const markCorrect = () => {
    if (currentPracticeWord) {
      toggleMastered(currentPracticeWord.word);
    }
    nextWord();
  };

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="page-title">📖 Dictation Words</div>
            <div className="page-subtitle">{words.length} words • {masteredCount} mastered • {words.length - masteredCount} to practice</div>
          </div>
          <button className={`btn ${practiceMode ? '' : 'btn-primary'}`} onClick={() => setPracticeMode(!practiceMode)}>
            {practiceMode ? '📋 Word List' : '🎯 Practice Mode'}
          </button>
        </div>
      </div>

      <div className="page-body">
        {practiceMode ? (
          /* Practice Mode */
          <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
            <div className="stat-grid" style={{ marginBottom: 32, gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat-card">
                <div className="stat-info" style={{ textAlign: 'center', width: '100%' }}>
                  <div className="stat-value">{practiceWords.length}</div>
                  <div className="stat-label">To Practice</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-info" style={{ textAlign: 'center', width: '100%' }}>
                  <div className="stat-value">{masteredCount}</div>
                  <div className="stat-label">Mastered</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-info" style={{ textAlign: 'center', width: '100%' }}>
                  <div className="stat-value">{Math.round((masteredCount / Math.max(words.length, 1)) * 100)}%</div>
                  <div className="stat-label">Progress</div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 8, background: 'var(--bg-glass)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 32 }}>
              <div style={{
                height: '100%',
                width: `${(masteredCount / Math.max(words.length, 1)) * 100}%`,
                background: 'linear-gradient(90deg, var(--accent-dark), var(--green))',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.5s var(--ease)',
              }} />
            </div>

            {currentPracticeWord ? (
              <div className="card" style={{ padding: 48 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Word {currentWordIdx + 1} of {practiceWords.length}
                </div>

                {showWord ? (
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, marginBottom: 8, color: 'var(--accent-light)' }}>
                      {currentPracticeWord.word}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {currentPracticeWord.language} • From: {currentPracticeWord.date}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🤔</div>
                    <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
                      Can you spell this word?
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      Hint: {currentPracticeWord.language} word from {currentPracticeWord.date}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  {!showWord ? (
                    <button className="btn btn-primary" onClick={() => setShowWord(true)} style={{ fontSize: 16, padding: '12px 32px' }}>
                      👁️ Reveal Word
                    </button>
                  ) : (
                    <>
                      <button className="btn" onClick={nextWord} style={{ fontSize: 14, padding: '10px 24px' }}>
                        ❌ Try Again
                      </button>
                      <button className="btn btn-primary" onClick={markCorrect} style={{ fontSize: 14, padding: '10px 24px' }}>
                        ✅ Got It!
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: 48 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>All words mastered!</div>
                <div style={{ color: 'var(--text-secondary)' }}>Amazing work! All {words.length} dictation words have been practiced.</div>
                <button className="btn" onClick={() => setProgress({})} style={{ marginTop: 20 }}>Reset Progress</button>
              </div>
            )}
          </div>
        ) : (
          /* Word List Mode */
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
              <input
                className="input"
                placeholder="Search words..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 300 }}
              />
              <div className="tabs">
                {[
                  { id: 'all', label: `All (${words.length})` },
                  { id: 'english', label: 'English' },
                  { id: 'hindi', label: 'Hindi/Marathi' },
                  { id: 'mastered', label: `Mastered (${masteredCount})` },
                  { id: 'unmastered', label: `To Learn (${words.length - masteredCount})` },
                ].map(f => (
                  <button key={f.id} className={`tab ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-auto stagger">
              {filtered.map((w, i) => (
                <div className="word-card" key={i} onClick={() => toggleMastered(w.word)} style={{ cursor: 'pointer' }}>
                  <div>
                    <div className="word-text" style={{ color: w.mastered ? 'var(--green)' : 'var(--text-primary)' }}>
                      {w.mastered ? '✅ ' : ''}{w.word}
                    </div>
                    <div className="word-meta" style={{ marginTop: 4 }}>
                      {w.language} • {w.date}
                    </div>
                  </div>
                  <span className={`tag ${w.language === 'English' ? 'tag-blue' : 'tag-orange'}`}>
                    {w.language === 'English' ? 'EN' : 'HI'}
                  </span>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📖</div>
                <div className="empty-state-text">No words match your search</div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
