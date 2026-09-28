import React from 'react';
import { Shield, Users, Award, Building2, CheckCircle2, Layers, Cpu, Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium">
          <Building2 className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
          <span>Privacy & Accountability</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight text-balance">
          About CaseBridge
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          CaseBridge is a privacy-focused case and complaint management platform designed to give people a clear, structured way to report concerns, follow case progress, and communicate with authorized reviewers.
        </p>
      </div>

      {/* Purpose & Mission */}
      <Card className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Our Purpose</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          CaseBridge is designed around a simple principle: a person should have a clear way to raise a concern without being forced into an unnecessarily complicated reporting process. The platform provides a structured path from submission to review, communication, resolution, and closure while applying privacy, access control, and accountability throughout the case lifecycle.
        </p>
      </Card>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900">Private Reporting</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Anonymous case submission is designed without requiring a name, student ID, phone number, or email address. A private tracking code gives the submitter a way to return to the case.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900">Neutral Review</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Cases are handled through an authorized review workflow, with role-based access, controlled case assignment, structured status changes, and communication between the submitter and permitted reviewers.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-slate-900">Documented Outcomes</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Important case actions are recorded through a structured timeline and audit trail, helping authorized reviewers maintain accountability from submission through resolution and closure.
          </p>
        </div>
      </div>

      {/* ARK Ecosystem Section */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">ARK Ecosystem</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          CaseBridge is part of the broader ARK Ecosystem, a collection of software projects and technical experiments built around practical problem solving, software engineering, artificial intelligence, cybersecurity, DevOps, data systems, and modern application development.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          The ecosystem represents an ongoing development journey rather than a single product. Projects explore different technical areas while maintaining a common focus on useful software, clear architecture, thoughtful user experience, security-aware development, and continuous improvement.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          CaseBridge contributes a privacy-focused institutional workflow system to this ecosystem, complementing other ARK projects across AI, software engineering, security, data, and developer tooling.
        </p>
      </Card>

      {/* Built Through Continuous Exploration */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-blue-600" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Built Through Continuous Exploration</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          The ARK development journey includes work across multiple areas of computing, including full-stack software development, AI-assisted systems, offline-first applications, cybersecurity, DevOps, databases, data processing, and developer tools.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          The broader project portfolio includes systems such as arkBrowse, arkEngine, arkDownload, arkSnap, arkType, DevCost-Lens, Trust Wrap, GitGuard, and Media-Forensics-Pipeline. Each project explores a different problem or technical direction while contributing to a broader engineering portfolio.
        </p>
      </Card>

      {/* Engineering Philosophy */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-600" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Engineering Philosophy</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Useful before unnecessary. Secure by design. Clear before complicated. Modular before monolithic. Fast before overloaded. Every feature should have a reason to exist, and every technical decision should support reliability, maintainability, usability, or future evolution.
        </p>
      </Card>

      {/* Committee Structure & Separation of Powers */}
      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Review Roles & Responsibilities
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Committee Members
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review assigned case statements, communicate with submitters, and prepare inquiry findings.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Committee Lead
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Triages incoming submissions, assigns primary investigators, and approves final resolutions.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              System Admin
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Maintains category configurations, SLAs, and user permissions without access to alter case content.
            </p>
          </div>
        </div>
      </Card>

      {/* Action CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Button variant="primary" size="md" onClick={() => onNavigate('/submit')}>
          Submit a Case
        </Button>
        <Button variant="secondary" size="md" onClick={() => onNavigate('/how-it-works')}>
          View Review Timeline
        </Button>
      </div>
    </div>
  );
};
