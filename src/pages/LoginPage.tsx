import React, { useState } from 'react';
import { Shield, Lock, UserCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { store } from '../services/store';
import { Button } from '../components/ui/Button';
import { FormField, TextInput } from '../components/ui/FormField';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const users = store.getUsers();
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [email, setEmail] = useState(users[0]?.email || '');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  const handleSelectDemoUser = (user: User) => {
    setSelectedUserId(user.id);
    setEmail(user.email);
    setPassword('password123');
    setError(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!matched) {
      setError('Invalid email address or unassigned staff account.');
      return;
    }
    const logged = store.loginUser(matched.id);
    if (logged) {
      onLoginSuccess(logged);
    } else {
      setError('Account is currently inactive or disabled.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center mx-auto shadow-xs">
          <Shield className="w-5 h-5" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Staff Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Authorized access for Ethics Review Committee members and administrators.
        </p>
      </div>

      {/* Login Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        {/* Testing Profile Selector */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Select Reviewer Profile (Demonstration):
          </span>
          <div className="space-y-1.5" role="radiogroup" aria-label="Demo role selector">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                role="radio"
                aria-checked={selectedUserId === u.id}
                onClick={() => handleSelectDemoUser(u)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between border transition-all ${
                  selectedUserId === u.id
                    ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-semibold shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                }`}
              >
                <div>
                  <span className="font-semibold block text-slate-900">{u.fullName}</span>
                  <span className="text-[11px] text-slate-500 font-normal">{u.department}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                  {u.role.replace('_', ' ')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <FormField id="staff-email" label="Institutional Email" required>
            <TextInput
              id="staff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>

          <FormField id="staff-password" label="Password" required>
            <TextInput
              id="staff-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
          >
            Authenticate to Portal
          </Button>
        </form>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
          >
            Return to Public Website
          </button>
        </div>
      </Card>
    </div>
  );
};
