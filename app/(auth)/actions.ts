'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { createUser, getUser } from '@/lib/db/queries';
import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  'cf-turnstile-response': z.string(),
});

async function verifyTurnstileToken(token: string) {
  const idempotencyKey = uuidv4();
  console.log('🔑 Initiating Turnstile verification:', {
    tokenLength: token?.length,
    idempotencyKey,
    appUrl: process.env.APP_URL
  });
  
  try {
    const verifyUrl = new URL('/api/turnstile', process.env.APP_URL).toString();
    console.log('📡 Making verification request to:', verifyUrl);

    const result = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        idempotencyKey,
      }),
      cache: 'no-store',
    });

    if (!result.ok) {
      console.error('❌ Verification request failed:', {
        status: result.status,
        statusText: result.statusText,
        url: result.url
      });
      return false;
    }

    const outcome = await result.json();
    console.log('📝 Turnstile verification result:', {
      success: outcome.success,
      error: outcome.error,
      status: result.status
    });
    return outcome.success;
  } catch (error) {
    console.error('❌ Turnstile verification failed:', error);
    return false;
  }
}

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    console.log('🔐 Login attempt initiated');
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      'cf-turnstile-response': formData.get('cf-turnstile-response'),
    });
    console.log('✅ Form data validation passed');

    const isValidTurnstile = await verifyTurnstileToken(validatedData['cf-turnstile-response']);
    console.log('🔒 Turnstile validation result:', isValidTurnstile);
    
    if (!isValidTurnstile) {
      console.log('❌ Turnstile validation failed');
      return { status: 'failed' };
    }

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });
    console.log('✅ Login successful');

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Form validation error:', error.errors);
      return { status: 'invalid_data' };
    }
    console.error('❌ Login error:', error);
    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      'cf-turnstile-response': formData.get('cf-turnstile-response'),
    });

    const [user] = await getUser(validatedData.email);

    if (user) {
      return { status: 'user_exists' } as RegisterActionState;
    }
    await createUser(validatedData.email, validatedData.password);
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};
