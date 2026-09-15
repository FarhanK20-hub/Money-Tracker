# Money Tracker

A beautifully crafted, mobile-first web application designed for independently tracking personal and business finances. Built with a local-first architecture for absolute privacy and zero-latency performance.

## Features

- **Premium UI/UX:** Built with a modern glassmorphic design system, deep dark mode, smooth micro-interactions, and premium typography (Outfit & JetBrains Mono).
- **Dual-System Architecture:** Completely separate tracking for Personal and Business finances in one unified dashboard.
- **Fixed Deposits Manager:** Log business funds into Fixed Deposits and track locked capital vs. liquid cash.
- **Local-First Sync:** Zero loading screens. Data is read from and written to `localStorage` instantly, with secure background syncing to a private GitHub Gist for multi-device access.
- **iOS Automation API:** Includes a secure Webhook endpoint designed to receive transaction payloads directly from Apple Shortcuts or automated banking SMS triggers.
- **Review Queue:** Automatically intercepts unverified income (e.g., from unknown API sources) and holds them in a dedicated queue for manual classification.
- **PWA Ready:** Installable directly to iOS/Android home screens for a native app experience.
- **Secure Access:** Protected by a local passcode authentication system.

## Tech Stack

- **Framework:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS v4
- **Storage:** Browser `localStorage` + GitHub Gist API (Local-First Sync)
- **Deployment:** Vercel

## Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/FarhanK20-hub/Money-Tracker.git
   cd Money-Tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Rename `.env.local.example` to `.env.local` and add your passcode, API secret key, and GitHub Gist token.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## License

MIT License.
