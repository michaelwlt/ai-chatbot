import Form from 'next/form';

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
  return (
    <Form action={action} className="flex flex-col gap-4 px-4">
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
        placeholder="never gonna give you up"
        required
        className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-gray-400 focus:outline-none"
      />
      {children}
    </Form>
  );
}
