'use client';

import { useState } from 'react';
import Topbar from '@/components/dashboard/Topbar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Automation {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  templateId: string;
  templateName: string;
  dailyLimit: number;
  scheduledTime: string; // "HH:MM" 24h
  status: 'active' | 'paused';
  lastRunAt: string | null;      // ISO string or null
  lastRunSentCount: number | null;
  createdAt: string;
}

interface AutomationFormData {
  name: string;
  projectId: string;
  templateId: string;
  dailyLimit: number;
  scheduledTime: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROJECTS = [
  { id: 'p1', name: 'SaaS Outreach' },
  { id: 'p2', name: 'Agency Pipeline' },
  { id: 'p3', name: 'E-commerce Leads' },
];

const MOCK_TEMPLATES = [
  { id: 't1', name: 'Cold Intro — Short' },
  { id: 't2', name: 'Follow-up #1' },
  { id: 't3', name: 'Partnership Request' },
  { id: 't4', name: 'Product Demo Invite' },
];

const INITIAL_AUTOMATIONS: Automation[] = [
  {
    id: 'a1',
    name: 'SaaS Daily Outreach',
    projectId: 'p1',
    projectName: 'SaaS Outreach',
    templateId: 't1',
    templateName: 'Cold Intro — Short',
    dailyLimit: 50,
    scheduledTime: '09:00',
    status: 'active',
    lastRunAt: '2026-10-04T09:00:00.000Z',
    lastRunSentCount: 42,
    createdAt: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 'a2',
    name: 'Agency Follow-ups',
    projectId: 'p2',
    projectName: 'Agency Pipeline',
    templateId: 't2',
    templateName: 'Follow-up #1',
    dailyLimit: 30,
    scheduledTime: '11:30',
    status: 'paused',
    lastRunAt: '2026-10-01T11:30:00.000Z',
    lastRunSentCount: 28,
    createdAt: '2026-09-25T14:30:00.000Z',
  },
  {
    id: 'a3',
    name: 'E-comm Partnership Blast',
    projectId: 'p3',
    projectName: 'E-commerce Leads',
    templateId: 't3',
    templateName: 'Partnership Request',
    dailyLimit: 20,
    scheduledTime: '14:00',
    status: 'active',
    lastRunAt: null,
    lastRunSentCount: null,
    createdAt: '2026-10-05T08:15:00.000Z',
  },
];

const EMPTY_FORM: AutomationFormData = {
  name: '',
  projectId: '',
  templateId: '',
  dailyLimit: 50,
  scheduledTime: '09:00',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(time: string) {
  // "09:00" → "9:00 AM"
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatLastRun(lastRunAt: string | null, lastRunSentCount: number | null): string {
  if (!lastRunAt) return 'Never run yet';
  const date = new Date(lastRunAt);
  const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const count = lastRunSentCount !== null ? ` · sent ${lastRunSentCount} emails` : '';
  return `Last ran: ${formatted}${count}`;
}

function generateId() {
  return 'a' + Math.random().toString(36).slice(2, 9);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusToggle({
  status,
  onToggle,
}: {
  status: 'active' | 'paused';
  onToggle: () => void;
}) {
  const isActive = status === 'active';
  return (
    <button
      onClick={onToggle}
      title={isActive ? 'Click to pause' : 'Click to activate'}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
        isActive ? 'bg-accent focus:ring-accent/40' : 'bg-gray-300 focus:ring-gray-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          isActive ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const [selectedProject, setSelectedProject] = useState('all');
  const [automations, setAutomations] = useState<Automation[]>(INITIAL_AUTOMATIONS);

  // Modal / form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AutomationFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<Automation | null>(null);

  // Success toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Form helpers ─────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (automation: Automation) => {
    setEditingId(automation.id);
    setForm({
      name: automation.name,
      projectId: automation.projectId,
      templateId: automation.templateId,
      dailyLimit: automation.dailyLimit,
      scheduledTime: automation.scheduledTime,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.projectId) errors.projectId = 'Select a project';
    if (!form.templateId) errors.templateId = 'Select a template';
    if (!form.dailyLimit || form.dailyLimit < 1) errors.dailyLimit = 'Must be at least 1';
    if (!form.scheduledTime) errors.scheduledTime = 'Pick a time';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const project = MOCK_PROJECTS.find(p => p.id === form.projectId)!;
    const template = MOCK_TEMPLATES.find(t => t.id === form.templateId)!;

    if (editingId) {
      setAutomations(prev =>
        prev.map(a =>
          a.id === editingId
            ? {
                ...a,
                name: form.name.trim(),
                projectId: form.projectId,
                projectName: project.name,
                templateId: form.templateId,
                templateName: template.name,
                dailyLimit: form.dailyLimit,
                scheduledTime: form.scheduledTime,
              }
            : a
        )
      );
      showToast('Automation updated successfully.');
    } else {
      const newAutomation: Automation = {
        id: generateId(),
        name: form.name.trim(),
        projectId: form.projectId,
        projectName: project.name,
        templateId: form.templateId,
        templateName: template.name,
        dailyLimit: form.dailyLimit,
        scheduledTime: form.scheduledTime,
        status: 'active',
        lastRunAt: null,
        lastRunSentCount: null,
        createdAt: new Date().toISOString(),
      };
      setAutomations(prev => [newAutomation, ...prev]);
      showToast('Automation created and activated.');
    }
    closeForm();
  };

  // ── Status toggle ─────────────────────────────────────────────────────────────

  const handleToggleStatus = (id: string) => {
    setAutomations(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, status: a.status === 'active' ? 'paused' : 'active' }
          : a
      )
    );
  };

  // ── Delete ────────────────────────────────────────────────────────────────────

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setAutomations(prev => prev.filter(a => a.id !== deleteTarget.id));
    setDeleteTarget(null);
    showToast('Automation deleted.');
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      <Topbar selectedProject={selectedProject} onProjectChange={setSelectedProject} />

      <div className="flex-1 px-7 py-6">
        <div className="max-w-[1400px] w-full mx-auto">

          {/* ── Header ── */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Automation</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Automatically send emails to new leads as they come in.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shrink-0"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Automation
            </button>
          </div>

          {/* ── List ── */}
          {automations.length === 0 ? (
            /* Empty state */
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-24 text-center px-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">No automations yet</p>
              <p className="text-xs text-gray-400 mb-4">
                Click &lsquo;Create Automation&rsquo; to get started.
              </p>
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create Automation
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Automation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Run
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {automations.map((automation) => (
                    <tr key={automation.id} className="hover:bg-gray-50 transition-colors">
                      {/* Name / Project / Template */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          {automation.name}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {automation.projectName}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            {automation.templateName}
                          </span>
                        </div>
                      </td>

                      {/* Schedule */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {formatTime(automation.scheduledTime)} daily
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {automation.dailyLimit} emails/day max
                        </div>
                      </td>

                      {/* Last Run */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {formatLastRun(automation.lastRunAt, automation.lastRunSentCount)}
                        </span>
                      </td>

                      {/* Status toggle */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <StatusToggle
                            status={automation.status}
                            onToggle={() => handleToggleStatus(automation.id)}
                          />
                          <span className={`text-xs font-medium ${
                            automation.status === 'active' ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {automation.status === 'active' ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(automation)}
                            title="Edit"
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(automation)}
                            title="Delete"
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                {editingId ? 'Edit Automation' : 'Create Automation'}
              </h2>
              <button
                onClick={closeForm}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {/* Automation Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Automation Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. SaaS Daily Outreach"
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all ${
                    formErrors.name ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                )}
              </div>

              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.projectId}
                  onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all bg-white ${
                    formErrors.projectId ? 'border-red-400' : 'border-gray-200'
                  }`}
                >
                  <option value="">Select a project…</option>
                  {MOCK_PROJECTS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {formErrors.projectId && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.projectId}</p>
                )}
              </div>

              {/* Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Template <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.templateId}
                  onChange={e => setForm(f => ({ ...f, templateId: e.target.value }))}
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all bg-white ${
                    formErrors.templateId ? 'border-red-400' : 'border-gray-200'
                  }`}
                >
                  <option value="">Select a template…</option>
                  {MOCK_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {formErrors.templateId && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.templateId}</p>
                )}
              </div>

              {/* Source explanation — read-only info box */}
              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-lg px-3.5 py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs text-blue-700 leading-relaxed">
                  This automation will automatically find all new &ldquo;Valid&rdquo; leads in the selected project that haven&rsquo;t received this template yet, every time it runs.
                </p>
              </div>

              {/* Daily Limit + Scheduled Time — side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Max emails per day <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={form.dailyLimit}
                    onChange={e => setForm(f => ({ ...f, dailyLimit: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Run daily at <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={form.scheduledTime}
                    onChange={e => setForm(f => ({ ...f, scheduledTime: e.target.value }))}
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all ${
                      formErrors.scheduledTime ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />
                  {formErrors.scheduledTime && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.scheduledTime}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={closeForm}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors"
              >
                {editingId ? 'Save Changes' : 'Create Automation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">Delete Automation</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Are you sure you want to delete this automation?
                  </p>
                  <p className="text-sm text-gray-500">
                    &ldquo;<strong>{deleteTarget.name}</strong>&rdquo; will be permanently removed. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast notification ───────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2.5 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
