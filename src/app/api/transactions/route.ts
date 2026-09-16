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

// ─── GitHub Gist Integration ──────────────────────────────────────────────

const GIST_TOKEN = process.env.NEXT_PUBLIC_GIST_TOKEN || '';
const GIST_ID = process.env.NEXT_PUBLIC_GIST_ID || '';
const GIST_API = `https://api.github.com/gists/${GIST_ID}`;

async function appendToGist(entry: Record<string, unknown>) {
  if (!GIST_TOKEN || !GIST_ID) return;

  // 1. Fetch current gist
  const res = await fetch(GIST_API, {
    headers: { Authorization: `token ${GIST_TOKEN}`, 'Cache-Control': 'no-cache' },
  });
  if (!res.ok) throw new Error('Failed to fetch gist');
  
  const gistData = await res.json();
  const fileContent = gistData?.files?.['money-tracker-data.json']?.content;
  if (!fileContent) return;

  const payload = JSON.parse(fileContent);
  
  // 2. Append transaction
  payload.transactions = payload.transactions || [];
  payload.transactions.push(entry);
  payload.lastUpdated = new Date().toISOString();

  // 3. Save back to gist
  await fetch(GIST_API, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${GIST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        'money-tracker-data.json': {
          content: JSON.stringify(payload)
        }
      }
    }),
  });
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
  let body: WebhookPayload & { rawSms?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let { amount, direction, rawSender = '', notes = '', timestamp } = body;

  // 2.5 Optional: Auto-parse from raw SMS if provided
  if (body.rawSms) {
    const sms = body.rawSms;
    notes = sms; // Save the raw SMS in notes for reference

    // Try expense format
    const expenseMatch = sms.match(/Sent Rs\.?([0-9,.]+)/i);
    // Try income format
    const incomeMatch = sms.match(/Credit Alert!.*?Rs\.?([0-9,.]+)/is) || sms.match(/Rs\.?([0-9,.]+).*credited/is);

    if (expenseMatch) {
      amount = parseFloat(expenseMatch[1].replace(/,/g, ''));
      direction = 'debit';
      const merchantMatch = sms.match(/To (.*?)\n/i);
      rawSender = merchantMatch ? merchantMatch[1].trim() : 'Unknown Merchant';
    } else if (incomeMatch) {
      amount = parseFloat(incomeMatch[1].replace(/,/g, ''));
      direction = 'credit';
      const senderMatch = sms.match(/from VPA\n(.*?) \(/i) || sms.match(/from (.*?) \(/i);
      rawSender = senderMatch ? senderMatch[1].trim() : 'Unknown Sender';
    } else {
      return NextResponse.json({ error: 'Could not parse SMS format on server' }, { status: 400 });
    }
  }

  if (typeof amount !== 'number' || amount <= 0 || isNaN(amount)) {
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

  // 5. Save directly to Gist (client will pick it up on next sync)
  try {
    await appendToGist(entry);
  } catch (err) {
    console.error('Failed to append to gist from webhook', err);
    return NextResponse.json({ error: 'Failed to save transaction' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: entry.id, category }, { status: 200 });
}
