import React, { useState } from 'react';
import { Shield, Lock, EyeOff, MessageSquare, ArrowRight, CheckCircle2, AlertTriangle, ChevronRight, FileText } from 'lucide-react';
import { Category } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface HomePageProps {
  onNavigate: (path: string) => void;
  categories: Category[];
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, categories }) => {
  const [trackInput, setTrackInput] = useState('');
  const [trackError, setTrackError] = useState('');

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = trackInput.trim().toUpperCase();
    if (!clean) {
      setTrackError('Please enter your tracking code.');
      return;
    }
    setTrackError('');
    onNavigate(`/track/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium">
          <Shield className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
          <span>Independent & Confidential Campus Grievance System</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight text-balance">
          Safe, Confidential University Case Reporting
        </h1>

        <p className="max-w-xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
          Report grievances, academic concerns, or misconduct with guaranteed anonymity. Track inquiry status and communicate directly with reviewers using your private code.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <Button
            variant="primary"
            size="lg"
            onClick={() => onNavigate('/submit')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Submit a Case
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => onNavigate('/how-it-works')}
            className="w-full sm:w-auto"
          >
            How It Works
          </Button>
        </div>

        {/* Direct Tracking Code Card */}
        <Card className="max-w-md mx-auto mt-6 text-left border-slate-200 shadow-xs">
          <label htmlFor="hero-tracking-input" className="block text-xs font-semibold text-slate-800 mb-2">
            Track Existing Case
          </label>
          <form onSubmit={handleTrackSubmit} className="flex gap-2">
            <input
              id="hero-tracking-input"
              type="text"
              value={trackInput}
              onChange={(e) => {
                setTrackInput(e.target.value);
                if (trackError) setTrackError('');
              }}
              placeholder="CB-XXXX-XXXX-XXXX"
              aria-label="Tracking code input"
              aria-describedby={trackError ? 'hero-track-error' : undefined}
              className="flex-1 text-sm font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
            <Button type="submit" variant="primary" size="md">
              Track
            </Button>
          </form>
          {trackError && (
            <p id="hero-track-error" className="text-xs text-rose-600 font-medium mt-1.5" role="alert">
              {trackError}
            </p>
          )}
        </Card>
      </section>

      {/* 4 Core Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Pillar 1 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5 shadow-2xs hover:border-blue-200 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Zero Identity Persistence</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              No personal names, student IDs, or emails are ever requested or stored in our database.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5 shadow-2xs hover:border-blue-200 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Lock className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Cryptographic Security</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              High-entropy hashed tracking credentials prevent unauthorized lookup or enumeration.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5 shadow-2xs hover:border-blue-200 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Two-Way Dialogue</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct, encrypted messaging with reviewers while fully preserving your anonymity.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5 shadow-2xs hover:border-blue-200 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Timely Resolution</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enforced review deadlines and automated escalation for overdue cases ensure prompt action.
            </p>
          </div>
        </div>
      </section>

      {/* Scope of Reportable Grievances */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Grievance Categories
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                Reportable Areas
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('/submit')}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Start a Report
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-slate-900">{cat.name}</h3>
                  <span className="text-[11px] text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded">
                    {cat.slaDays}d SLA
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Non-Retaliation Policy Alert Banner */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 sm:p-5 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs sm:text-sm text-slate-800 space-y-0.5">
            <h3 className="font-semibold text-slate-900">Whistleblower Protection Guarantee</h3>
            <p className="text-slate-600 leading-relaxed">
              University policy strictly prohibits retaliation or grading bias against any student or staff member reporting concerns in good faith.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
