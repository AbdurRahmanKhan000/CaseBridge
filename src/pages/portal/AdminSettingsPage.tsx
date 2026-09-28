import React, { useState } from 'react';
import { store } from '../../services/store';
import { Settings, Save, CheckCircle2, RotateCcw } from 'lucide-react';
import { SystemSettings } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(store.getSettings());
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo cases, users, and audit logs to original factory test data?')) {
      store.resetToFactoryDefaults();
      setSettings(store.getSettings());
      setSaved(true);
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          System Configuration & Institutional SLAs
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure response deadlines, emergency escalation contacts, and institutional retention policies.
        </p>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg p-3 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>System configuration successfully updated.</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 text-xs">
        {/* Institutional Identity */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
            Institutional Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Institution / Office Name</label>
              <input
                type="text"
                value={settings.institutionName}
                onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Compliance Helpdesk Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Campus Emergency Dispatch Number</label>
              <input
                type="text"
                value={settings.emergencyPhone}
                onChange={(e) => setSettings({ ...settings, emergencyPhone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Post-Resolution Retention (Days)</label>
              <input
                type="number"
                value={settings.dataRetentionDays}
                onChange={(e) => setSettings({ ...settings, dataRetentionDays: parseInt(e.target.value) || 180 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* SLA Thresholds */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
            Resolution SLA Deadlines (Triggers Overdue Flag)
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Critical (Hours)</label>
              <input
                type="number"
                value={settings.slaDaysCriticalHours}
                onChange={(e) => setSettings({ ...settings, slaDaysCriticalHours: parseInt(e.target.value) || 24 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">High Priority (Days)</label>
              <input
                type="number"
                value={settings.slaDaysHigh}
                onChange={(e) => setSettings({ ...settings, slaDaysHigh: parseInt(e.target.value) || 3 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Medium Priority (Days)</label>
              <input
                type="number"
                value={settings.slaDaysMedium}
                onChange={(e) => setSettings({ ...settings, slaDaysMedium: parseInt(e.target.value) || 7 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Low Priority (Days)</label>
              <input
                type="number"
                value={settings.slaDaysLow}
                onChange={(e) => setSettings({ ...settings, slaDaysLow: parseInt(e.target.value) || 14 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <button
            type="button"
            onClick={handleResetData}
            className="text-xs text-rose-700 hover:text-rose-900 flex items-center gap-1 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data to Defaults</span>
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save System Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
