'use client';

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react';
import Topbar from '@/components/dashboard/Topbar';
import { FALLBACK_COUNTRIES, type StaticCountry } from '@/lib/countries';
import {
  getAutomations,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  getProjects,
  getTemplates,
  type ApiAutomation,
  type Project,
  type Template,
  type CreateAutomationPayload,
  type AutomationFinderConfig,
} from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Country {
  name:  { common: string; official: string };
  flags: { png: string; svg: string; alt?: string };
  cca2:  string;
}

interface AutomationFormData {
  name: string;
  projectId: string;
  templateId: string;
  dailyLimit: number;
  scheduledTime: string;
  leadSource: 'existing' | 'finder';
  finderCountry: string;
  finderCity: string;
  finderAllCities: boolean;
  finderNiches: string[];
  finderLeadsPerDay: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_NICHES = 10;

const EMPTY_FORM: AutomationFormData = {
  name: '',
  projectId: '',
  templateId: '',
  dailyLimit: 50,
  scheduledTime: '09:00',
  leadSource: 'existing',
  finderCountry: 'Germany',
  finderCity: 'Frankfurt',
  finderAllCities: false,
  finderNiches: [],
  finderLeadsPerDay: 50,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FlagImg({ flag, size = 'sm' }: { flag: string; size?: 'sm' | 'xs' }) {
  const cls = size === 'sm' ? 'w-5 h-4' : 'w-4 h-3';
  if (flag && flag.startsWith('http')) {
    return (
      <img
        src={flag}
        alt="flag"
        className={`${cls} object-cover rounded-sm shrink-0`}
        onError={e => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return <span className="text-sm shrink-0">{flag || '🏳️'}</span>;
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' +
    date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  );
}

function formatLastRunSummary(automation: ApiAutomation): string {
  const sentCount = automation.lastRunSentCount ?? 0;
  const sentText = `Sent ${sentCount}`;

  if (automation.lastRunFinderStatus === 'ok') {
    const foundCount = automation.lastRunFoundCount ?? 0;
    return `Found ${foundCount} new lead${foundCount !== 1 ? 's' : ''} · ${sentText}`;
  }

  if (automation.lastRunFinderStatus === 'failed') {
    const reason = automation.lastRunFinderMessage ? ` (${automation.lastRunFinderMessage})` : '';
    return `Lead finding failed${reason} · ${sentText}`;
  }

  if (automation.lastRunFinderStatus === 'skipped') {
    return `Lead finding skipped · ${sentText}`;
  }

  if (typeof automation.lastRunFoundCount === 'number') {
    const foundCount = automation.lastRunFoundCount;
    return `Found ${foundCount} new lead${foundCount !== 1 ? 's' : ''} · ${sentText}`;
  }

  return sentCount > 0 ? `Sent ${sentCount} emails` : '0 emails sent';
}

function formatFinderBadge(finder?: AutomationFinderConfig): string {
  if (!finder) return 'Auto lead finding';
  const location = finder.allCities ? 'All cities' : (finder.city || finder.country || 'All cities');
  const niches = Array.isArray(finder.niches) && finder.niches.length > 0 ? finder.niches.join(', ') : '';
  const rate = finder.leadsPerDay ? `${finder.leadsPerDay}/day` : '';
  const parts = [location, niches, rate].filter(Boolean);
  return parts.length > 0
    ? `Auto lead finding: ${parts.join(' · ')}`
    : 'Auto lead finding';
}

/** Pull a plain string id out of a populated-or-string field.
 *  Returns '' when the reference is null (deleted document). */
function getId(field: { _id: string } | string | null | undefined): string {
  if (field == null) return '';
  return typeof field === 'object' ? field._id : field;
}

/** Pull a display name out of a populated-or-string field.
 *  Returns the fallback when the reference is null (deleted document). */
function getName(
  field: { name: string } | string | null | undefined,
  fallback = '—'
): string {
  if (field == null) return fallback;
  return typeof field === 'object' ? field.name : fallback;
}

// ─── Sub-component: Status toggle ─────────────────────────────────────────────

function StatusToggle({
  status,
  disabled,
  onToggle,
}: {
  status: 'active' | 'paused';
  disabled?: boolean;
  onToggle: () => void;
}) {
  const isActive = status === 'active';
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      title={isActive ? 'Click to pause' : 'Click to activate'}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
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

  // ── Data state ───────────────────────────────────────────────────────────────
  const [automations, setAutomations] = useState<ApiAutomation[]>([]);
  const [projects, setProjects]       = useState<Project[]>([]);
  const [templates, setTemplates]     = useState<Template[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // ── Country state ────────────────────────────────────────────────────────────
  const [countries, setCountries]                     = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading]       = useState(false);
  const [usingFallbackData, setUsingFallbackData]     = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm]     = useState('Germany');
  const [selectedCountryFlag, setSelectedCountryFlag] = useState('🇩🇪');
  const countryInputRef    = useRef<HTMLInputElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // ── Niche input state ────────────────────────────────────────────────────────
  const [nicheInput, setNicheInput] = useState('');
  const nicheInputRef = useRef<HTMLInputElement>(null);

  // ── Form / modal state ───────────────────────────────────────────────────────
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState<AutomationFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState<Record<string, string>>({});
  const [saving, setSaving]           = useState(false);

  // ── Delete state ─────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<ApiAutomation | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // ── Toggle-in-flight set (prevents double-clicks) ────────────────────────────
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  // ── Toast ────────────────────────────────────────────────────────────────────
  const [toast, setToast]             = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Country helpers ─────────────────────────────────────────────────────────

  const convertStaticToApiFormat = (s: StaticCountry): Country => ({
    name:  s.name,
    flags: { png: s.flags.png, svg: s.flags.svg },
    cca2:  s.cca2,
  });

  const applyFallbackCountries = () => {
    setCountries(FALLBACK_COUNTRIES.map(convertStaticToApiFormat));
    setUsingFallbackData(true);
  };

  const fetchCountries = async () => {
    if (countries.length > 0) return;
    setCountriesLoading(true);
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2', { signal: controller.signal });
      clearTimeout(tid);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Country[] = await res.json();
      setCountries(data.sort((a, b) => a.name.common.localeCompare(b.name.common)));
      setUsingFallbackData(false);
    } catch {
      applyFallbackCountries();
    } finally {
      setCountriesLoading(false);
    }
  };

  const getFlag = (country: Country) =>
    usingFallbackData
      ? FALLBACK_COUNTRIES.find(c => c.cca2 === country.cca2)?.flags.emoji ?? '🏳️'
      : country.flags.png;

  const filteredCountries = countries
    .filter(c => c.name.common.toLowerCase().includes(countrySearchTerm.toLowerCase()))
    .slice(0, 10);

  const handleCountrySelect = (country: Country) => {
    setForm(f => ({ ...f, finderCountry: country.name.common }));
    setCountrySearchTerm(country.name.common);
    setSelectedCountryFlag(getFlag(country));
    setShowCountryDropdown(false);
  };

  const handleCountryInputChange = (value: string) => {
    setCountrySearchTerm(value);
    setForm(f => ({ ...f, finderCountry: value }));
    setShowCountryDropdown(true);
    const match = countries.find(c => c.name.common.toLowerCase() === value.toLowerCase());
    if (match) setSelectedCountryFlag(getFlag(match));
  };

  // Click outside to close country dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(e.target as Node) &&
        !countryInputRef.current?.contains(e.target as Node)
      ) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Niche tag helpers ───────────────────────────────────────────────────────

  const addNiche = () => {
    const val = nicheInput.trim();
    if (!val || form.finderNiches.length >= MAX_NICHES) return;
    if (form.finderNiches.some(n => n.toLowerCase() === val.toLowerCase())) {
      setNicheInput('');
      return;
    }
    setForm(f => ({ ...f, finderNiches: [...f.finderNiches, val] }));
    setNicheInput('');
    nicheInputRef.current?.focus();
  };

  const removeNiche = (index: number) => {
    setForm(f => ({ ...f, finderNiches: f.finderNiches.filter((_, i) => i !== index) }));
  };

  const handleNicheKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addNiche();
    }
    if (e.key === 'Backspace' && nicheInput === '' && form.finderNiches.length > 0) {
      setForm(f => ({ ...f, finderNiches: f.finderNiches.slice(0, -1) }));
    }
  };

  // ─── Load data ────────────────────────────────────────────────────────────────

  const loadAutomations = useCallback(async () => {
    try {
      setError(null);
      const data = await getAutomations();
      setAutomations(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load automations';
      setError(msg);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        fetchCountries();
        const [, projectsData, templatesData] = await Promise.all([
          loadAutomations(),
          getProjects(),
          getTemplates(),
        ]);
        setProjects(projectsData);
        setTemplates(templatesData);
      } catch {
        // individual errors already handled inside each function
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAutomations]);

  // ─── Form helpers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setCountrySearchTerm('Germany');
    setSelectedCountryFlag('🇩🇪');
    setNicheInput('');
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (automation: ApiAutomation) => {
    setEditingId(automation._id);
    const isFinder = automation.leadSource === 'finder';
    const country = automation.finder?.country || 'Germany';

    setForm({
      name:              automation.name,
      projectId:         getId(automation.projectId),
      templateId:        getId(automation.templateId),
      dailyLimit:        automation.dailyLimit,
      scheduledTime:     automation.scheduledTime,
      leadSource:        isFinder ? 'finder' : 'existing',
      finderCountry:     country,
      finderCity:        automation.finder?.city || (automation.finder?.allCities ? '' : 'Frankfurt'),
      finderAllCities:   Boolean(automation.finder?.allCities),
      finderNiches:      Array.isArray(automation.finder?.niches) ? [...automation.finder.niches] : [],
      finderLeadsPerDay: typeof automation.finder?.leadsPerDay === 'number' ? automation.finder.leadsPerDay : 50,
    });

    setCountrySearchTerm(country);
    const match = countries.find(c => c.name.common.toLowerCase() === country.toLowerCase());
    if (match) {
      setSelectedCountryFlag(getFlag(match));
    } else {
      const fallbackMatch = FALLBACK_COUNTRIES.find(c => c.name.common.toLowerCase() === country.toLowerCase());
      setSelectedCountryFlag(fallbackMatch?.flags.emoji ?? '🇩🇪');
    }
    setNicheInput('');
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setNicheInput('');
    setShowCountryDropdown(false);
    setFormErrors({});
  };

  // Form validity check for Save button state
  const isFinderValid =
    form.leadSource === 'existing' ||
    (
      form.finderCountry.trim().length > 0 &&
      (form.finderAllCities || form.finderCity.trim().length > 0) &&
      form.finderNiches.length >= 1 &&
      form.finderNiches.length <= MAX_NICHES &&
      form.finderLeadsPerDay >= 5 &&
      form.finderLeadsPerDay <= 100
    );

  const isBaseFormValid =
    form.name.trim().length > 0 &&
    form.projectId.length > 0 &&
    form.templateId.length > 0 &&
    form.dailyLimit >= 1 &&
    form.scheduledTime.length > 0;

  const isFormValid = isBaseFormValid && isFinderValid;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim())     errors.name          = 'Name is required';
    if (!form.projectId)       errors.projectId     = 'Select a project';
    if (!form.templateId)      errors.templateId    = 'Select a template';
    if (!form.dailyLimit || form.dailyLimit < 1) errors.dailyLimit = 'Must be at least 1';
    if (!form.scheduledTime)   errors.scheduledTime = 'Pick a time';

    if (form.leadSource === 'finder') {
      if (!form.finderCountry.trim()) {
        errors.finderCountry = 'Country is required';
      }
      if (!form.finderAllCities && !form.finderCity.trim()) {
        errors.finderCity = 'City is required';
      }
      if (form.finderNiches.length === 0) {
        errors.finderNiches = 'Add at least 1 niche';
      }
      if (!form.finderLeadsPerDay || form.finderLeadsPerDay < 5 || form.finderLeadsPerDay > 100) {
        errors.finderLeadsPerDay = 'Must be between 5 and 100';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload: CreateAutomationPayload = {
        name:          form.name.trim(),
        projectId:     form.projectId,
        templateId:    form.templateId,
        dailyLimit:    form.dailyLimit,
        scheduledTime: form.scheduledTime,
        leadSource:    form.leadSource,
        ...(form.leadSource === 'finder'
          ? {
              finder: {
                country:     form.finderCountry.trim(),
                city:        form.finderAllCities ? '' : form.finderCity.trim(),
                allCities:   form.finderAllCities,
                niches:      form.finderNiches,
                leadsPerDay: form.finderLeadsPerDay,
              },
            }
          : {}),
      };

      if (editingId) {
        await updateAutomation(editingId, payload);
        showToast('Automation updated successfully.');
      } else {
        await createAutomation(payload);
        showToast('Automation created and activated.');
      }

      closeForm();
      await loadAutomations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save automation';
      setFormErrors({ _api: msg });
    } finally {
      setSaving(false);
    }
  };

  // ─── Status toggle ─────────────────────────────────────────────────────────

  const handleToggleStatus = async (automation: ApiAutomation) => {
    const id = automation._id;
    if (togglingIds.has(id)) return;

    const newStatus = automation.status === 'active' ? 'paused' : 'active';

    // Optimistic update
    setTogglingIds(prev => new Set(prev).add(id));
    setAutomations(prev =>
      prev.map(a => (a._id === id ? { ...a, status: newStatus } : a))
    );

    try {
      await updateAutomation(id, { status: newStatus });
    } catch (err: unknown) {
      // Roll back on failure
      setAutomations(prev =>
        prev.map(a => (a._id === id ? { ...a, status: automation.status } : a))
      );
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      showToast(`Error: ${msg}`);
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAutomation(deleteTarget._id);
      setDeleteTarget(null);
      showToast('Automation deleted.');
      await loadAutomations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete automation';
      showToast(`Error: ${msg}`);
    } finally {
      setDeleting(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

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

          {/* ── Loading ── */}
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-4" />
              <p className="text-sm font-medium text-gray-700">Loading automations…</p>
            </div>
          ) : error ? (
            /* ── Error ── */
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-3 text-red-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">Failed to load automations</p>
              <p className="text-xs text-gray-400 mb-4">{error}</p>
              <button
                onClick={loadAutomations}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : automations.length === 0 ? (
            /* ── Empty state ── */
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-24 text-center px-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
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
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Create Automation
              </button>
            </div>
          ) : (
            /* ── Table ── */
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Automation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Run</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {automations.map((automation) => (
                    <tr key={automation._id} className="hover:bg-gray-50 transition-colors">
                      {/* Name / Project / Template / Lead Finder Badge */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          {automation.name}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {automation.projectId == null ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                              ⚠ Project deleted
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {getName(automation.projectId)}
                            </span>
                          )}
                          {automation.templateId == null ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                              ⚠ Template deleted
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                              {getName(automation.templateId)}
                            </span>
                          )}
                          {automation.leadSource === 'finder' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-600">
                                <circle cx="11" cy="11" r="8"/>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                              </svg>
                              {formatFinderBadge(automation.finder)}
                            </span>
                          )}
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
                        {automation.lastRunAt ? (
                          <div>
                            <div className="text-sm text-gray-900 font-medium">
                              {formatDate(automation.lastRunAt)}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {formatLastRunSummary(automation)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Never run yet</span>
                        )}
                      </td>

                      {/* Status toggle */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <StatusToggle
                            status={automation.status}
                            disabled={togglingIds.has(automation._id)}
                            onToggle={() => handleToggleStatus(automation)}
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
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(automation)}
                            title="Delete"
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
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

      {/* ── Create / Edit Modal ────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-base font-semibold text-gray-900">
                {editingId ? 'Edit Automation' : 'Create Automation'}
              </h2>
              <button
                onClick={closeForm}
                disabled={saving}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
              {/* API-level error */}
              {formErrors._api && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3.5 py-3">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-xs text-red-700">{formErrors._api}</p>
                </div>
              )}

              {/* Name */}
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
                {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
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
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                {projects.length === 0 && (
                  <p className="mt-1 text-xs text-gray-400">No projects found — create one in Settings first.</p>
                )}
                {formErrors.projectId && <p className="mt-1 text-xs text-red-500">{formErrors.projectId}</p>}
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
                  {templates.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className="mt-1 text-xs text-gray-400">No templates found — create one in Templates first.</p>
                )}
                {formErrors.templateId && <p className="mt-1 text-xs text-red-500">{formErrors.templateId}</p>}
              </div>

              {/* ── Lead source ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead source
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`relative flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      form.leadSource === 'existing'
                        ? 'border-accent bg-accent/5 ring-1 ring-accent'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="leadSource"
                      value="existing"
                      checked={form.leadSource === 'existing'}
                      onChange={() => setForm(f => ({ ...f, leadSource: 'existing' }))}
                      className="mt-0.5 h-4 w-4 text-accent border-gray-300 focus:ring-accent cursor-pointer"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Use existing leads in this project
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                        Sends to contacts already saved in this project.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`relative flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      form.leadSource === 'finder'
                        ? 'border-accent bg-accent/5 ring-1 ring-accent'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="leadSource"
                      value="finder"
                      checked={form.leadSource === 'finder'}
                      onChange={() => {
                        setForm(f => ({ ...f, leadSource: 'finder' }));
                        fetchCountries();
                      }}
                      className="mt-0.5 h-4 w-4 text-accent border-gray-300 focus:ring-accent cursor-pointer"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        Find new leads automatically
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                        Finds and verifies leads right before sending.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* ── Conditional: Find new leads automatically fields ── */}
              {form.leadSource === 'finder' && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Auto Lead Finding Settings
                    </span>
                    <span className="text-[11px] text-accent font-medium bg-accent/10 px-2 py-0.5 rounded">
                      Runs before email sending
                    </span>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center z-10">
                        <FlagImg flag={selectedCountryFlag} size="xs" />
                      </div>
                      <input
                        ref={countryInputRef}
                        type="text"
                        value={countrySearchTerm}
                        onChange={e => handleCountryInputChange(e.target.value)}
                        onFocus={() => { setShowCountryDropdown(true); fetchCountries(); }}
                        placeholder="Search countries…"
                        className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ${
                          formErrors.finderCountry ? 'border-red-400' : 'border-gray-200'
                        }`}
                      />
                      {countriesLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                        </div>
                      )}
                      {showCountryDropdown && (
                        <div ref={countryDropdownRef} className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
                          {countriesLoading ? (
                            <div className="p-3 text-sm text-gray-500">Loading countries…</div>
                          ) : filteredCountries.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500">No countries found for &quot;{countrySearchTerm}&quot;</div>
                          ) : (
                            <>
                              {usingFallbackData && (
                                <div className="p-2 text-xs text-blue-600 bg-blue-50 border-b border-blue-100">
                                  Using offline country data
                                </div>
                              )}
                              {filteredCountries.map(country => (
                                <button
                                  key={country.cca2}
                                  type="button"
                                  onClick={() => handleCountrySelect(country)}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
                                >
                                  <FlagImg flag={getFlag(country)} size="sm" />
                                  <span className="text-gray-900">{country.name.common}</span>
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {formErrors.finderCountry && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.finderCountry}</p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        City {!form.finderAllCities && <span className="text-red-500">*</span>}
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.finderAllCities}
                          onChange={e => {
                            const checked = e.target.checked;
                            setForm(f => ({
                              ...f,
                              finderAllCities: checked,
                              finderCity: checked ? '' : f.finderCity,
                            }));
                          }}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-accent focus:ring-accent/30 cursor-pointer"
                        />
                        <span className="text-xs text-gray-500">Search all cities in this country</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={form.finderCity}
                      onChange={e => setForm(f => ({ ...f, finderCity: e.target.value }))}
                      disabled={form.finderAllCities}
                      placeholder={form.finderAllCities ? 'Searching entire country…' : 'e.g. Frankfurt'}
                      className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${
                        formErrors.finderCity && !form.finderAllCities ? 'border-red-400' : 'border-gray-200'
                      }`}
                    />
                    {form.finderAllCities && (
                      <p className="mt-1 text-xs text-amber-600">
                        ⚠ Whole-country searches may return more varied results and take a bit longer.
                      </p>
                    )}
                    {formErrors.finderCity && !form.finderAllCities && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.finderCity}</p>
                    )}
                  </div>

                  {/* Niches */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Niches <span className="text-red-500">*</span>
                      </label>
                      <span className="text-xs text-gray-400">{form.finderNiches.length}/{MAX_NICHES}</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        ref={nicheInputRef}
                        type="text"
                        value={nicheInput}
                        onChange={e => setNicheInput(e.target.value)}
                        onKeyDown={handleNicheKeyDown}
                        disabled={form.finderNiches.length >= MAX_NICHES}
                        placeholder={form.finderNiches.length >= MAX_NICHES ? `Max ${MAX_NICHES} niches reached` : 'e.g. Jewelry Store, Cafe'}
                        className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:bg-gray-100 disabled:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={addNiche}
                        disabled={!nicheInput.trim() || form.finderNiches.length >= MAX_NICHES}
                        className="px-3.5 py-2.5 bg-accent hover:bg-accent-hover disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                      >
                        Add
                      </button>
                    </div>

                    <p className="mt-1.5 text-xs text-gray-400">
                      Press{' '}
                      <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-gray-500 font-mono text-[10px]">Enter</kbd>
                      {' '}to add,{' '}
                      <kbd className="px-1 py-0.5 bg-white border border-gray-200 rounded text-gray-500 font-mono text-[10px]">Backspace</kbd>
                      {' '}on empty to remove last
                    </p>

                    {form.finderNiches.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {form.finderNiches.map((niche, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-accent/10 text-accent text-xs font-medium px-2.5 py-1 rounded-md">
                            {niche}
                            <button
                              type="button"
                              onClick={() => removeNiche(i)}
                              className="text-accent/50 hover:text-accent ml-0.5 leading-none"
                              aria-label={`Remove ${niche}`}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {formErrors.finderNiches && (
                      <p className="mt-1.5 text-xs text-red-500">{formErrors.finderNiches}</p>
                    )}
                  </div>

                  {/* New leads per day */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      New leads per day <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={form.finderLeadsPerDay}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        setForm(f => ({ ...f, finderLeadsPerDay: isNaN(val) ? 0 : val }));
                      }}
                      className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent ${
                        formErrors.finderLeadsPerDay ? 'border-red-400' : 'border-gray-200'
                      }`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">Min 5, max 100 leads per daily run</span>
                    </div>
                    {formErrors.finderLeadsPerDay && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.finderLeadsPerDay}</p>
                    )}
                  </div>

                  {/* Info note */}
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Runs first, then sending runs in the same run. If lead finding fails, sending still continues with existing leads. Older unsent leads are sent first.
                    </p>
                  </div>
                </div>
              )}

              {/* Info box for existing leads */}
              {form.leadSource === 'existing' && (
                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-lg px-3.5 py-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    This automation will automatically find all new &ldquo;Valid&rdquo; leads in the selected project that haven&rsquo;t received this template yet, every time it runs.
                  </p>
                </div>
              )}

              {/* Daily Limit + Time */}
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
                  {formErrors.dailyLimit && <p className="mt-1 text-xs text-red-500">{formErrors.dailyLimit}</p>}
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
                  {formErrors.scheduledTime && <p className="mt-1 text-xs text-red-500">{formErrors.scheduledTime}</p>}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl shrink-0">
              <button
                onClick={closeForm}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !isFormValid}
                className="px-5 py-2 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {editingId ? 'Save Changes' : 'Create Automation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────────── */}
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
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
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
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {deleting && (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex items-center gap-2.5 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 shrink-0">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
