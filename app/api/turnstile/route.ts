import { NextResponse } from 'next/server';

const TURNSTILE_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, idempotencyKey } = body;
    console.log('🔒 Turnstile verification request:', { 
      token: token?.slice(0, 10) + '...', // Only log part of the token for security
      idempotencyKey,
      hasSecretKey: !!TURNSTILE_SECRET_KEY
    });

    if (!token) {
      console.error('❌ No token provided');
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 400 });
    }

    if (!TURNSTILE_SECRET_KEY) {
      console.error('❌ No secret key configured');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const ip = request.headers.get('CF-Connecting-IP');
    console.log('📍 Client IP:', ip);

    const result = await fetch(TURNSTILE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
        idempotency_key: idempotencyKey
      })
    });

    if (!result.ok) {
      console.error('❌ Cloudflare verification failed:', await result.text());
      return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
    }

    const outcome = await result.json();
    console.log('✅ Turnstile verification response:', {
      success: outcome.success,
      errorCodes: outcome['error-codes'],
      challengeTs: outcome.challenge_ts,
      hostname: outcome.hostname,
      action: outcome.action
    });

    return NextResponse.json(outcome);
  } catch (error) {
    console.error('❌ Turnstile verification error:', error);
    return NextResponse.json({ success: false, error: 'Failed to verify Turnstile token' }, { status: 500 });
  }
} 