import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseWhatsAppMessage(messageText) {
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

If the text does not look like a daily update, return an empty JSON object {}.

Here is the WhatsApp message:
"""
${messageText}
"""
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text;
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini Parsing Error:", e);
    return null;
  }
}
