import { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useUpdatesContext } from '../context/UpdatesContext';

export default function AdminPortal() {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const { updates } = useUpdatesContext();

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const processUpdate = async () => {
    if (!text && files.length === 0) {
      setError("Please paste some text or attach files.");
      return;
    }
    
    setError(null);
    setLoading(true);
    setStatus('Parsing text with Gemini AI...');

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setError("VITE_GEMINI_API_KEY is not set in your .env.local file.");
      setLoading(false);
      return;
    }

    try {
      let parsedData = {};

      if (text) {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `
          You are a parser that reads school WhatsApp group updates and extracts the schedule.
          The text often contains the date, the grade (like 3B), and a list of subjects taught.

          Extract this information into a structured JSON format exactly matching this schema:
          {
            "date": "DD MMMM YYYY", // E.g., "19 JUNE 2026"
            "grade": "3B",
            "periods": [
              {
                "period": 1, // number
                "subject": "ENGLISH", // string (uppercase)
                "topic": "Topic name", // string or null
                "sub_topic": "Sub topic", // string or null
                "classwork": "What was taught", // string or null
                "homework": "What homework was given", // string or null
                "submission_date": "DD/MM/YYYY" // string or null
              }
            ]
          }

          If the text does not look like a daily update, just guess the date from the context or return today's date in DD MMMM YYYY format.
          Here is the WhatsApp message:
          """
          ${text}
          """
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        
        parsedData = JSON.parse(response.text);
      } else {
        // If no text, just use today's date
        const today = new Date();
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        parsedData = {
          date: `${today.getDate().toString().padStart(2, '0')} ${monthNames[today.getMonth()]} ${today.getFullYear()}`,
          grade: "3B",
          periods: []
        };
      }

      if (!parsedData.date) {
        throw new Error("Gemini failed to extract a valid date.");
      }

      // Upload files
      const uploadedAttachments = [];
      if (files.length > 0) {
        setStatus(`Uploading ${files.length} file(s)...`);
        for (const file of files) {
          const docId = parsedData.date.replace(/ /g, '_');
          const fileRef = ref(storage, `daily_updates/${docId}/${file.name}`);
          await uploadBytesResumable(fileRef, file);
          const downloadUrl = await getDownloadURL(fileRef);
          uploadedAttachments.push({
            name: file.name,
            url: downloadUrl,
            type: file.type
          });
        }
      }

      parsedData.attachments = uploadedAttachments;

      setStatus('Saving to Firestore...');
      const docId = parsedData.date.replace(/ /g, '_');
      await setDoc(doc(db, 'daily_updates', docId), parsedData, { merge: true });

      setStatus('✅ Update successfully published!');
      setTimeout(() => {
        setStatus('');
        setText('');
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 3000);

    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">⚙️ Admin Portal</div>
        <div className="page-subtitle">Post daily updates & upload files</div>
      </div>

      <div className="page-body">
        <div className="card" style={{ maxWidth: 800 }}>
          <div className="card-header">
            <span className="card-title">New Daily Update</span>
          </div>
          <div className="card-body">
            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Paste WhatsApp Message (CBSE MALAD WEST 3B S1)</label>
              <textarea 
                className="form-control"
                style={{ width: '100%', minHeight: '150px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
                placeholder="Paste the daily update text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Attach Files (PDFs, Images)</label>
              <input 
                type="file" 
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ width: '100%', padding: '12px', border: '2px dashed var(--border)', borderRadius: '8px', cursor: 'pointer' }}
              />
              {files.length > 0 && (
                <div style={{ marginTop: 8, fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Selected: {files.map(f => f.name).join(', ')}
                </div>
              )}
            </div>

            <button 
              className="btn btn-primary" 
              onClick={processUpdate}
              disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: 8 }}
            >
              {loading ? (
                <span>⏳ {status}</span>
              ) : (
                <span>🚀 Process & Publish Update</span>
              )}
            </button>
            
            {status && !loading && (
              <div style={{ marginTop: 16, color: 'var(--green)', fontWeight: 500, textAlign: 'center' }}>
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
