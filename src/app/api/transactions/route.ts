import { NextRequest, NextResponse } from 'next/server';

// ─── Types ────────────────────────────────────────────────────────────────

interface WebhookPayload {
  amount: number;
  direction: 'credit' | 'debit';
  rawSender?: string;
  notes?: string;
  timestamp?: string; // ISO string, optional — defaults to now
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getMomIdentifiers(): string[] {
  const raw = process.env.MOM_ACCOUNT_IDENTIFIERS || '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function classifyCredit(rawSender: string): 'personal_income' | 'business_income' | 'unverified_income' {
  const sender = rawSender.toLowerCase();
  const momIds = getMomIdentifiers();
  if (momIds.some((id) => sender.includes(id))) {
    return 'personal_income';
  }
  return 'unverified_income';
}

// ─── localStorage-based storage (server-side) ─────────────────────────────
// Since this app is client-side localStorage, the webhook writes to a
// server-side queue file that the client picks up on next load.

import { promises as fs } from 'fs';
import path from 'path';

const QUEUE_FILE = path.join(process.cwd(), '.webhook-queue.json');

async function appendToQueue(entry: Record<string, unknown>) {
  let queue: Record<string, unknown>[] = [];
  try {
    const raw = await fs.readFile(QUEUE_FILE, 'utf-8');
    queue = JSON.parse(raw);
  } catch {
    // File doesn't exist yet — start fresh
  }
  queue.push(entry);
  await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8');
}

// ─── GET /api/transactions — health check / queue drain ──────────────────

export async function GET(req: NextRequest) {
  // Validate the bearer token
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const expected = process.env.API_SECRET_KEY;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return queued transactions and clear the file
  let queue: Record<string, unknown>[] = [];
  try {
    const raw = await fs.readFile(QUEUE_FILE, 'utf-8');
    queue = JSON.parse(raw);
    await fs.writeFile(QUEUE_FILE, '[]', 'utf-8');
  } catch {
    // No file — empty queue
  }

  return NextResponse.json({ ok: true, queued: queue }, { status: 200 });
}

// ─── POST /api/transactions — receive webhook from iOS Shortcuts ──────────

export async function POST(req: NextRequest) {
  // 1. Validate the bearer token
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const expected = process.env.API_SECRET_KEY;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse the body
  let body: WebhookPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { amount, direction, rawSender = '', notes = '', timestamp } = body;

  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }
  if (direction !== 'credit' && direction !== 'debit') {
    return NextResponse.json({ error: 'direction must be "credit" or "debit"' }, { status: 400 });
  }

  // 3. Determine category
  let category: string;
  if (direction === 'debit') {
    category = 'personal_expense';
  } else {
    category = classifyCredit(rawSender);
  }

  // 4. Build entry
  const entry = {
    id: Math.random().toString(36).substring(2, 11),
    amount,
    direction,
    category,
    rawSender,
    notes,
    source: 'webhook',
    timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  // 5. Queue the entry (client will pick it up and merge into localStorage)
  await appendToQueue(entry);

  return NextResponse.json({ ok: true, id: entry.id, category }, { status: 200 });
}
