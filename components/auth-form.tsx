import Form from 'next/form';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Input } from './ui/input';
import { Label } from './ui/label';

export function AuthForm({
  action,
  children,
  defaultEmail = '',
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
}) {
  const turnstileRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);

  useEffect(() => {
    console.log('🔄 Initializing Turnstile widget');
    
    // Function to initialize Turnstile
    const initTurnstile = () => {
      if (!turnstileRef.current) return;
      
      console.log('✅ Turnstile API loaded, attempting to render');
      try {
        // @ts-ignore
        window.turnstile.render(turnstileRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
          callback: function(token: string) {
            console.log('🎫 Turnstile token received:', token.slice(0, 10) + '...');
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'cf-turnstile-response';
            input.value = token;
            formRef.current?.appendChild(input);
            console.log('✅ Token input added to form');
            setTurnstileLoaded(true);
          },
          appearance: 'interaction-only'
        });
      } catch (error) {
        console.error('❌ Error rendering Turnstile:', error);
      }
    };

    // Check if Turnstile is already loaded
    // @ts-ignore
    if (window.turnstile) {
      initTurnstile();
    } else {
      // If not loaded, wait for the script to load
      const checkTurnstile = setInterval(() => {
        // @ts-ignore
        if (window.turnstile) {
          clearInterval(checkTurnstile);
          initTurnstile();
        }
      }, 100);

      // Clear interval after 10 seconds to prevent infinite checking
      setTimeout(() => clearInterval(checkTurnstile), 10000);
    }
  }, []);

  const handleSubmit = async (formData: FormData) => {
    if (!turnstileLoaded) {
      console.log('⚠️ Turnstile not yet loaded');
      toast.error('Please wait a moment and try again');
      return;
    }
    
    console.log('📝 Form submission:', {
      email: formData.get('email'),
      hasPassword: !!formData.get('password'),
      hasTurnstileResponse: !!formData.get('cf-turnstile-response')
    });
    
    if (typeof action === 'function') {
      return action(formData);
    }
  };

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
      <Form ref={formRef} action={handleSubmit} className="flex flex-col gap-4 px-4">
        <input
          type="email"
          name="email"
          defaultValue={defaultEmail}
          placeholder="your@email.com"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-gray-400 focus:outline-none"
        />
        <input
          type="password"
          name="password"
          placeholder="your_password"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-gray-400 focus:outline-none"
        />
        <div ref={turnstileRef} />
        {children}
      </Form>
    </>
  );
}
