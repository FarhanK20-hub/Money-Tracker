import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// ─── Mom's Account Detection ─────────────────────────────────────────

function isMomAccount(rawSender: string): boolean {
  const identifiers = (process.env.MOM_ACCOUNT_IDENTIFIERS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (identifiers.length === 0) return false;

  const senderLower = rawSender.toLowerCase();
  return identifiers.some((id) => senderLower.includes(id));
}

// ─── POST /api/transactions ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Authenticate with API key
  const authHeader = request.headers.get('Authorization');
  const apiKey = process.env.API_SECRET_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server misconfigured: API_SECRET_KEY not set' },
      { status: 500 }
    );
  }

  if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse body
  let body: {
    amount?: number;
    direction?: 'credit' | 'debit';
    rawSender?: string;
    category?: string;
    timestamp?: string;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { amount, direction, rawSender, category, timestamp, notes } = body;

  // Validate required fields
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
  }

  if (!direction || !['credit', 'debit'].includes(direction)) {
    return NextResponse.json({ error: 'direction must be "credit" or "debit"' }, { status: 400 });
  }

  // ─── Classification Logic ───────────────────────────────────────────

  let finalCategory: string;

  if (direction === 'debit') {
    // Outgoing money — must have category from Shortcuts
    if (category && ['personal_expense', 'business_expense'].includes(category)) {
      finalCategory = category;
    } else {
      // Default to personal_expense if not specified
      finalCategory = 'personal_expense';
    }
  } else {
    // Incoming money (credit)
    if (category && ['personal_income', 'business_income'].includes(category)) {
      // Explicitly classified by Shortcuts
      finalCategory = category;
    } else if (rawSender && isMomAccount(rawSender)) {
      // Auto-classify Mom's account as Personal Income
      finalCategory = 'personal_income';
    } else {
      // Unknown sender → goes to review queue
      finalCategory = 'unverified_income';
    }
  }

  // ─── Write to Firestore ─────────────────────────────────────────────

  try {
    const adminDb = getAdminDb();
    const docRef = await adminDb.collection('transactions').add({
      amount,
      direction,
      category: finalCategory,
      rawSender: rawSender || '',
      notes: notes || '',
      source: 'webhook',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      createdAt: FieldValue.serverTimestamp(),
      reviewedAt: null,
    });

    return NextResponse.json(
      {
        success: true,
        id: docRef.id,
        category: finalCategory,
        message:
          finalCategory === 'unverified_income'
            ? 'Transaction added to review queue'
            : `Transaction classified as ${finalCategory}`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Firestore write error:', err);
    return NextResponse.json({ error: 'Failed to write transaction' }, { status: 500 });
  }
}

// ─── Reject other methods ────────────────────────────────────────────

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
