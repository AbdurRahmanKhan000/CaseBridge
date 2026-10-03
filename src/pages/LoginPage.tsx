import React, { useState } from 'react';
import { Lock, ArrowRight, CheckCircle2, Mail, RefreshCw, KeyRound, Loader2 } from 'lucide-react';
import { User } from '../types';
import { store } from '../services/store';
import { Button } from '../components/ui/Button';
import { FormField, TextInput } from '../components/ui/FormField';
import { Alert } from '../components/ui/Alert';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/ui/Logo';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const allUsers = store.getUsers();
  // Display only the approved institutional staff reviewers
  const users = allUsers.filter((u) => !u.email.endsWith('@university.edu'));
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [email, setEmail] = useState(users[0]?.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [cooldown, setCooldown] = useState(0);

  const handleSelectStaff = (user: User) => {
    setSelectedUserId(user.id);
    setEmail(user.email);
    setError(null);
  };

  const handleRequestOtp = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setError(null);
    setInfoMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your institutional email address.');
      return;
    }

    setIsSending(true);

    try {
      const res = store.requestLoginOtp(cleanEmail);
      if (!res.success) {
        setError(res.error || 'Unregistered email address. Access is restricted to approved staff accounts.');
        setIsSending(false);
        return;
      }

      const matchedUser = store.findUserByEmail(cleanEmail);

      // Dispatch real email via backend SMTP endpoint to the exact address entered
      try {
        const mailRes = await fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            code: res.debugOtp,
            staffName: matchedUser?.fullName || 'Staff Member',
          }),
        });

        const contentType = mailRes.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          setError('The backend email service endpoint is not responding with JSON. Please try again.');
          setIsSending(false);
          return;
        }

        const mailData = await mailRes.json();
        if (!mailRes.ok || !mailData.success) {
          const backendError = String(mailData?.error || 'Failed to dispatch email. Please verify SMTP settings and try again.');
          const helpfulError = backendError.includes('Email delivery failed')
            ? `${backendError} If you use Gmail, SMTP_USER and SMTP_FROM_EMAIL must be the same account and SMTP_PASSWORD must be a Google App Password.`
            : backendError;
          setError(helpfulError);
          setIsSending(false);
          return;
        }
      } catch (mailErr: any) {
        setError(`Failed to reach email service: ${mailErr?.message || 'Network error'}. Please try again.`);
        setIsSending(false);
        return;
      }

      setInfoMessage(`A 5-digit verification code has been dispatched to ${cleanEmail}. Please check your inbox (and spam folder) and enter the code below.`);
      setStep('otp');
      setOtpCode(''); // Blank: staff member must retrieve code from real email inbox
      setCooldown(15);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 5) {
      setError('Please enter the exact 5-digit code received in your email.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = store.verifyLoginOtp(email, cleanCode);
      if (!res.success || !res.user) {
        setError(res.error || 'Invalid verification code. Please check your email and try again.');
        return;
      }

      onLoginSuccess(res.user);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Logo size="lg" variant="dark" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Staff Portal Access
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">
            Authorized sign-in for Ethics Review Committee members and administrators.
          </p>
        </div>
      </div>

      {/* Login Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        {/* Approved Staff Profile Fast Selector */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Approved Staff Reviewers:
          </span>
          <div className="space-y-1.5" role="radiogroup" aria-label="Approved staff account selector">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                role="radio"
                aria-checked={selectedUserId === u.id}
                onClick={() => handleSelectStaff(u)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between border transition-all ${
                  selectedUserId === u.id
                    ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-semibold shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                }`}
              >
                <div>
                  <span className="font-semibold block text-slate-900">{u.fullName}</span>
                  <span className="text-[11px] text-slate-500 font-normal font-mono">{u.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                    {u.role.replace('_', ' ')}
                  </span>
                  {!u.isActive && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                      Disabled
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <Alert variant="error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {infoMessage && step === 'otp' && (
          <Alert variant="success">
            {infoMessage}
          </Alert>
        )}

        {/* Step 1: Email Form */}
        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <FormField id="staff-email" label="Institutional Staff Email" required>
              <TextInput
                id="staff-email"
                type="email"
                placeholder="officer@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isSending}
              leftIcon={isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            >
              {isSending ? 'Sending Verification Code...' : 'Send Verification Code (OTP)'}
            </Button>
          </form>
        ) : (
          /* Step 2: OTP Verification Form (No simulation display; user must enter received code) */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <FormField id="otp-code" label="5-Digit Verification Code" required helpText="Enter the 5-digit verification code delivered to your email inbox.">
              <TextInput
                id="otp-code"
                type="text"
                maxLength={5}
                placeholder="•••••"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="text-center font-mono text-lg tracking-widest"
                required
                autoFocus
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isVerifying || otpCode.length !== 5}
              leftIcon={isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            >
              {isVerifying ? 'Verifying...' : 'Verify Code & Sign In'}
            </Button>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={isSending || cooldown > 0}
                className={`flex items-center gap-1 font-medium transition-colors ${
                  cooldown > 0 || isSending
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${isSending ? 'animate-spin' : ''}`} />
                {isSending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError(null);
                  setInfoMessage(null);
                  setOtpCode('');
                }}
                className="text-slate-500 hover:text-slate-800 underline transition-colors"
              >
                Use different email
              </button>
            </div>
          </form>
        )}

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
