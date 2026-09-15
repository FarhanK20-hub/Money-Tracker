# Money Tracker

A mobile-first web application for tracking personal and business finances. Built with a local-first architecture for instant performance and GitHub Gist for free multi-device syncing.

## Features

- **Dual-System Architecture:** Separate tracking for Personal and Business finances.
- **Fixed Deposits Manager:** Log business funds into Fixed Deposits and track interest. 
- **Local-First Sync:** Zero loading screens. Data is read from and written to `localStorage` instantly, with background syncing to a private GitHub Gist.
- **Automated iOS Logging API:** Webhook endpoint designed to receive transaction payloads directly from iOS Shortcuts or banking SMS triggers.
- **Review Queue:** Automatically catches unverified income (e.g., unknown senders via the API) and places them in a dedicated review queue for manual classification.
- **PWA Ready:** Installable as an app on iOS/Android home screens for a native feel.
- **Passcode Protection:** Local passcode required to access the app.

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS v4
- **Storage:** `localStorage` + GitHub Gist API
- **Hosting Target:** Vercel

## Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/FarhanK20-hub/Money-Tracker.git
   cd Money-Tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Rename `.env.local.example` to `.env.local` and add your passcode and API secret key.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## License
MIT License.
