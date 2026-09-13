# Money Tracker 💸

A beautiful, mobile-first web application for independently tracking Personal and Business finances. Designed to be completely free to host and operate, with a strict single-user architecture and a seamless iOS Shortcuts integration for automated transaction logging.

## Features ✨

- **Dual-System Architecture:** Completely separate tracking for Personal and Business finances.
- **Fixed Deposits Manager:** Log business funds into Fixed Deposits and track interest earned. 
- **Real-Time Data Sync:** Built with Firebase Firestore's `onSnapshot` global data provider for instant, zero-loading page transitions.
- **Automated iOS Logging API:** Secure Webhook API designed to receive transaction payloads directly from iOS Shortcuts or banking SMS triggers.
- **Review Queue:** Automatically catches unverified income (e.g. unknown senders via the API) and places them in a dedicated review queue for manual classification.
- **PWA Ready:** Installable as an app on iOS/Android home screens for a native feel.
- **Single-User Lock:** Hardcoded email verification blocks all other accounts from logging in.

## Tech Stack 🛠️

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS v4
- **Backend/Database:** Firebase (Firestore, Authentication)
- **Hosting Target:** Vercel (Hobby Tier)
- **API:** Next.js API Routes + Firebase Admin SDK

## Local Development 💻

1. **Clone the repository:**
   ```bash
   git clone https://github.com/FarhanK20-hub/Money-Tracker.git
   cd Money-Tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Firebase Environment Variables:**
   Rename `.env.local.example` to `.env.local` and fill in your Firebase configuration keys and Admin SDK credentials.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## iOS Shortcut Webhook API 📱

The app includes a secure POST endpoint at `/api/transactions` designed for Apple Shortcuts.

**Headers required:**
- `Authorization: Bearer <API_SECRET_KEY>`

**JSON Payload Example:**
```json
{
  "amount": 450,
  "direction": "debit",
  "rawSender": "Zomato UPI",
  "notes": "Lunch"
}
```

The API automatically parses the direction and sender:
- `debit` goes to `personal_expense`.
- `credit` matching `MOM_ACCOUNT_IDENTIFIERS` goes to `personal_income`.
- `credit` from an unknown source is flagged as `unverified_income` for the Review Queue.

## License
MIT License. Created for personal use.
