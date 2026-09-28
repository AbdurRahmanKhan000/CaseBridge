import React, { useState } from 'react';
import { Category } from '../../types';
import { store } from '../../services/store';
import { Layers, Plus, CheckCircle2, Edit2 } from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(store.getCategories(false));
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slaDays, setSlaDays] = useState(7);
  const [message, setMessage] = useState<string | null>(null);

  const refreshCats = () => {
    setCategories(store.getCategories(false));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    store.addCategory({
      name: name.trim(),
      description: description.trim(),
      slaDays: Number(slaDays) || 7,
      isActive: true,
    });

    setMessage(`Category "${name}" successfully added.`);
    setShowAddModal(false);
    setName('');
    setDescription('');
    refreshCats();
  };

  const handleToggleActive = (cat: Category) => {
    store.updateCategory(cat.id, { isActive: !cat.isActive });
    setMessage(`Updated status for "${cat.name}"`);
    refreshCats();
  };

  const handleUpdateSla = (cat: Category, newSla: number) => {
    store.updateCategory(cat.id, { slaDays: newSla });
    setMessage(`SLA for "${cat.name}" updated to ${newSla} days`);
    refreshCats();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Complaint Categories Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure reportable scopes, investigation SLA targets, and active availability for anonymous submission.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Category</span>
        </button>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg p-3 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Scope Description</th>
                <th className="py-3 px-4">Standard SLA (Days)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {c.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-sm">
                    {c.description}
                  </td>
                  <td className="py-3.5 px-4">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={c.slaDays}
                      onChange={(e) => handleUpdateSla(c, parseInt(e.target.value) || 1)}
                      className="w-16 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-center font-mono font-bold"
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                      c.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleToggleActive(c)}
                      className={`text-xs px-2.5 py-1 rounded transition-colors ${
                        c.isActive
                          ? 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                          : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                      }`}
                    >
                      {c.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Add Grievance Category</h2>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Research Ethics Violation"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Scope Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what incidents fall under this classification..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default SLA Target (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={slaDays}
                  onChange={(e) => setSlaDays(parseInt(e.target.value) || 7)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
