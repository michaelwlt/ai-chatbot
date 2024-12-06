'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { login, type LoginActionState } from '../actions';
import { BetterGPTIcon, GitIcon, LogoGoogle, LogoDiscord, LogoSpotify } from '@/components/icons';

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  useEffect(() => {
    if (state.status === 'failed') {
      toast.error('Invalid credentials!');
    } else if (state.status === 'invalid_data') {
      toast.error('Failed validating your submission!');
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      router.refresh();
    }
  }, [state.status, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center">
          <div className="flex items-center gap-2">
            <div onContextMenu={(e) => e.preventDefault()} style={{ pointerEvents: 'none' }}>
              <BetterGPTIcon size={40} />
            </div>
            <h3 className="text-2xl font-semibold">Sign In to BetterGPT</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-4">
          <button className="flex items-center justify-center gap-2 rounded-lg border p-2 hover:bg-gray-50">
            <GitIcon />
            GitHub
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border p-2 hover:bg-gray-50">
            <LogoDiscord />
            Discord
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border p-2 hover:bg-gray-50">
            <LogoSpotify />
            Spotify
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border p-2 hover:bg-gray-50">
            <LogoGoogle />
            Google
          </button>
        </div>

        <div className="flex items-center gap-2 px-4">
          <div className="h-px flex-1 bg-gray-200"></div>
          <span className="text-sm text-gray-500">or</span>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>

        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign In</SubmitButton>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>
              Need an account?{' '}
              <Link href="/register" className="text-purple-600 hover:underline">
                Sign up
              </Link>
            </p>
            <p className="mt-2">
              Forgot your password?{' '}
              <Link href="/reset-password" className="text-purple-600 hover:underline">
                Reset it
              </Link>
            </p>
          </div>
        </AuthForm>
      </div>
    </div>
  );
}
