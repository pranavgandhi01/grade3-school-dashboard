# WhatsApp Sync & Dynamic Dashboard Architecture

This is a major enhancement that will upgrade your dashboard from a "static" website to a live, dynamic application. Because WhatsApp does not have a simple API for personal accounts, and because the dashboard is hosted on the internet, we need a robust architecture to make this seamless.

## User Review Required

> [!WARNING]
> **WhatsApp Policy:** Using third-party tools (like `whatsapp-web.js`) technically violates WhatsApp's Terms of Service for personal accounts. While extremely common for personal side-projects, there is always a tiny risk of your WhatsApp number being temporarily suspended if it sends out mass spam. Since our script will be strictly **read-only** (only reading a specific school group), the risk is near zero, but you should be aware!

> [!IMPORTANT]
> **Mac Must Be On:** Because the WhatsApp sync relies on your personal WhatsApp account, the sync script must run in the background on your MacBook. This means the 2:30 PM daily sync will only fire if your MacBook is powered on and connected to the internet at that time.

## Proposed Architecture

To solve this, we will implement the following system:

### 1. The Local WhatsApp Daemon (Runs on your Mac)
We will create a Node.js script on your Mac that uses `whatsapp-web.js`. 
- The first time you run it, it will show a QR code in your terminal. You scan it with your phone just like WhatsApp Web.
- It stays logged in and runs in the background.
- It uses `node-cron` to automatically check the specific school WhatsApp group at 2:30 PM on weekdays.
- It can download any attached media (PDFs, images).

### 2. The AI Parser (Gemini API)
When the daemon finds a new message from the school, it will send the unstructured text to the **Gemini AI API**. Gemini will intelligently extract:
- The Date
- The Subject
- What was taught (Classwork)
- Homework & Deadlines
- Upcoming Events/Tests

### 3. Firebase Firestore & Cloud Storage (The Cloud Database)
Currently, all your data is hardcoded in `schoolData.js`. If we keep it this way, your Mac would have to automatically rebuild and redeploy the website every single day. 
Instead, we will activate **Firebase Firestore** (a free cloud database) and **Firebase Storage** (for the PDFs). 
- The local Mac daemon will upload the extracted data and PDFs directly to Firebase.
- Your React Dashboard will be updated to read data live from Firebase. This means the moment the script runs, your phone dashboard updates instantly without needing a deployment.

### 4. "On-Demand" Sync Button
Since the web dashboard runs on the internet and the script runs on your Mac, how does the button communicate with your Mac?
- When you click "Sync Now" on the web dashboard, it will update a tiny flag in the Firebase Database (`sync_requested: true`).
- Your Mac daemon will listen to the database in real-time. When it sees that flag turn true, it will instantly wake up, scrape the latest WhatsApp messages, process them, and upload them back!

---

## Proposed Changes

### Database Setup
#### [NEW] Firebase Firestore & Storage
- Initialize Firebase Firestore in your existing `grade3-dashboard-pranav` project.
- Migrate the static `DAILY_UPDATES` from `schoolData.js` into the Firestore database.

### Local Sync Script (Node.js)
#### [NEW] `scripts/whatsapp-sync/`
- `index.js`: The main background daemon that connects to WhatsApp.
- `geminiParser.js`: The logic that talks to the Google Gemini API to structure the WhatsApp messages.
- `firebaseClient.js`: Handles uploading the structured JSON and PDF media to your Firebase project.

### Dashboard App (React)
#### [MODIFY] `src/App.jsx` & Data Fetching
- Integrate the Firebase JS SDK (`npm install firebase`).
- Replace the static imports of `DAILY_UPDATES` with a live React hook (`useEffect`) that fetches the data from Firestore.
#### [MODIFY] `src/components/DailyUpdates.jsx`
- Add the "Sync Now" button.
- Add loading states (e.g., "Syncing with WhatsApp...") that listen to the database status.

---

## Open Questions

1. **WhatsApp Group Name**: What is the exact name of the WhatsApp group where the updates are posted? The script needs this to know which chat to read.
2. **Gemini API Key**: Do you have a Google AI Studio account to get a free Gemini API key for the parsing script? If not, I can guide you on how to click a link to generate one for free.
3. **Database Migration**: Since moving to a live database requires some rewriting of how the dashboard loads data, are you comfortable with us shifting `DAILY_UPDATES` to Firestore while leaving `HOLIDAYS` and `EVENTS` as static code for now, to keep the transition smooth?
