import React, { FormEvent, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Logo } from './ui/Logo';

interface StaffPortalGateProps {
  onUnlock: () => void;
}

const PORTAL_PASSWORD = 'ARK Ecosystem';

export const StaffPortalGate: React.FC<StaffPortalGateProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isCorrect = password === PORTAL_PASSWORD;
    setHasError(!isCorrect);

    if (isCorrect) {
      onUnlock();
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm" aria-labelledby="staff-portal-access-title">
        <div className="flex justify-center">
          <Logo size="lg" showText={false} />
        </div>
        <div className="mt-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 id="staff-portal-access-title" className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Staff Portal Access
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Enter the access password to continue to the authorized staff portal.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="staff-portal-password" className="sr-only">
              Staff portal password
            </label>
            <input
              id="staff-portal-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (hasError) setHasError(false);
              }}
              placeholder="Enter access password"
              autoComplete="off"
              autoFocus
              className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              aria-invalid={hasError}
              aria-describedby={hasError ? 'staff-portal-password-error' : undefined}
            />
          </div>
          {hasError && (
            <p id="staff-portal-password-error" className="text-sm text-rose-600" role="alert">
              Incorrect password. Please try again.
            </p>
          )}
          <button
            type="submit"
            className="h-12 w-full rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Enter Staff Portal
          </button>
        </form>
      </section>
    </main>
  );
};
