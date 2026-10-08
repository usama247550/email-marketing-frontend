'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import Topbar from '@/components/dashboard/Topbar';
import { FALLBACK_COUNTRIES, type StaticCountry } from '@/lib/countries';
import {
  getProjects,
  triggerMultiNicheSearch,
  pollLeadFinderJob,
  startSmartSearch,
  getSmartSearchStatus,
  saveSmartSearch,
  stopSmartSearch,
  type Project,
  type MultiNicheSearchResult,
  type LeadFinderJobProgress,
  type SmartSearchLead,
  type SmartSearchParsedParams,
  type SmartSearchSummary,
} from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Country {
  name:  { common: string; official: string };
  flags: { png: string; svg: string; alt?: string };
  cca2:  string;
}

type ActiveTab  = 'multi' | 'smart';
type SmartStage = 'idle' | 'running' | 'results' | 'saved';

const MAX_NICHES = 10;

// Step labels for the Smart Search progress indicator
// Indexes map to backend stages: 0=analyzing, 1=searching, 2=checking, 3=filtering
const PROGRESS_STEPS = [
  { id: 'analyze', label: 'Analyzing your request…' },
  { id: 'search',  label: 'Searching businesses…'   },
  { id: 'check',   label: 'Checking websites…'      },
  { id: 'filter',  label: 'Filtering matches…'      },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadFinderPage() {

  // ── Shared state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]             = useState<ActiveTab>('multi');
  const [selectedProject, setSelectedProject] = useState('all');
  const [projects, setProjects]               = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // ── Country state ────────────────────────────────────────────────────────────
  const [countries, setCountries]                     = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading]       = useState(false);
  const [usingFallbackData, setUsingFallbackData]     = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm]     = useState('Germany');
  const [selectedCountryFlag, setSelectedCountryFlag] = useState('🇩🇪');
  const countryInputRef    = useRef<HTMLInputElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // ── Tab 1: Multi-Niche ───────────────────────────────────────────────────────
  const [multiForm, setMultiForm] = useState({
    projectId:  '',
    country:    'Germany',
    city:       'Frankfurt',
    niches:     [] as string[],
    totalLeads: 100,
  });
  const [allCities, setAllCities]   = useState(false);
  const [nicheInput, setNicheInput] = useState('');
  const nicheInputRef = useRef<HTMLInputElement>(null);

  // ── Tab 1: async search state ────────────────────────────────────────────────
  type MultiStage = 'idle' | 'loading' | 'done' | 'error';
  const [multiStage, setMultiStage]       = useState<MultiStage>('idle');
  const [multiResult, setMultiResult]     = useState<MultiNicheSearchResult | null>(null);
  const [multiError, setMultiError]       = useState<string>('');
  const [multiProgress, setMultiProgress] = useState<LeadFinderJobProgress | null>(null);
  // Stable ref to the poll-interval timer so we can clear it from anywhere
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Tab 2: Smart Search ──────────────────────────────────────────────────────
  const [smartForm, setSmartForm] = useState({
    projectId:   '',
    description: '',
    leadsCount:  20,
    strictness:  'normal',
  });
  const [smartStage, setSmartStage]             = useState<SmartStage>('idle');
  const [currentStep, setCurrentStep]           = useState(-1);
  const [completedSteps, setCompletedSteps]     = useState<Set<number>>(new Set());
  const [resultLeads, setResultLeads]           = useState<SmartSearchLead[]>([]);
  const [checkedEmails, setCheckedEmails]       = useState<Set<string>>(new Set());
  const [smartParsedParams, setSmartParsedParams] = useState<SmartSearchParsedParams | null>(null);
  const [smartSummary, setSmartSummary]         = useState<SmartSearchSummary | null>(null);
  const [smartError, setSmartError]             = useState<string>('');
  const [smartSaveResult, setSmartSaveResult]   = useState<{ batchId: string; batchName: string; savedCount: number } | null>(null);
  const [smartSaving, setSmartSaving]           = useState(false);
  const [smartCheckDetail, setSmartCheckDetail] = useState<string>('');
  const [smartElapsed, setSmartElapsed]         = useState(0);  // seconds since job started
  // Refs
  const smartJobIdRef   = useRef<string>('');
  const smartPollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const smartElapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear both timers on unmount
  useEffect(() => {
    return () => {
      if (smartPollRef.current)    clearInterval(smartPollRef.current);
      if (smartElapsedRef.current) clearInterval(smartElapsedRef.current);
      if (pollTimerRef.current)    clearInterval(pollTimerRef.current);
    };
  }, []);

  // ─── Data loading ─────────────────────────────────────────────────────────

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

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      setProjects(await getProjects());
    } catch { /* keep empty */ } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
    fetchProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node) &&
        !countryInputRef.current?.contains(e.target as Node)
      ) setShowCountryDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Country helpers ─────────────────────────────────────────────────────────

  const filteredCountries = countries
    .filter(c => c.name.common.toLowerCase().includes(countrySearchTerm.toLowerCase()))
    .slice(0, 10);

  const getFlag = (country: Country) =>
    usingFallbackData
      ? FALLBACK_COUNTRIES.find(c => c.cca2 === country.cca2)?.flags.emoji ?? '🏳️'
      : country.flags.png;

  const handleCountrySelect = (country: Country) => {
    setMultiForm(f => ({ ...f, country: country.name.common }));
    setCountrySearchTerm(country.name.common);
    setSelectedCountryFlag(getFlag(country));
    setShowCountryDropdown(false);
  };

  const handleCountryInputChange = (value: string) => {
    setCountrySearchTerm(value);
    setMultiForm(f => ({ ...f, country: value }));
    setShowCountryDropdown(true);
    const match = countries.find(c => c.name.common.toLowerCase() === value.toLowerCase());
    if (match) setSelectedCountryFlag(getFlag(match));
  };

  // ─── Niche tag helpers ───────────────────────────────────────────────────────

  const addNiche = () => {
    const val = nicheInput.trim();
    if (!val || multiForm.niches.length >= MAX_NICHES) return;
    if (multiForm.niches.some(n => n.toLowerCase() === val.toLowerCase())) { setNicheInput(''); return; }
    setMultiForm(f => ({ ...f, niches: [...f.niches, val] }));
    setNicheInput('');
    nicheInputRef.current?.focus();
  };

  const removeNiche = (index: number) =>
    setMultiForm(f => ({ ...f, niches: f.niches.filter((_, i) => i !== index) }));

  const handleNicheKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addNiche(); }
    if (e.key === 'Backspace' && nicheInput === '' && multiForm.niches.length > 0)
      setMultiForm(f => ({ ...f, niches: f.niches.slice(0, -1) }));
  };

  // ─── Topbar sync ─────────────────────────────────────────────────────────────

  const handleTopbarProjectChange = (id: string) => setSelectedProject(id);

  // ─── Tab 1: submit ────────────────────────────────────────────────────────────

  const canFindLeads =
    !!multiForm.projectId && !!multiForm.country &&
    (allCities || multiForm.city.trim() !== '') && multiForm.niches.length > 0;

  const handleFindLeads = async () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    setMultiStage('loading');
    setMultiResult(null);
    setMultiError('');
    setMultiProgress(null);

    let jobId: string;
    try {
      const startResp = await triggerMultiNicheSearch({
        projectId:  multiForm.projectId,
        country:    multiForm.country,
        city:       allCities ? '' : multiForm.city,
        niches:     multiForm.niches,
        totalLeads: multiForm.totalLeads,
      });
      jobId = startResp.jobId;
    } catch (err) {
      setMultiError(err instanceof Error ? err.message : 'Failed to start search.');
      setMultiStage('error');
      return;
    }

    const POLL_INTERVAL_MS  = 2500;
    const MAX_POLL_ATTEMPTS = 120;  // 120 × 2.5 s = 5 minutes max
    let   attempts          = 0;

    pollTimerRef.current = setInterval(async () => {
      attempts++;

      if (attempts > MAX_POLL_ATTEMPTS) {
        clearInterval(pollTimerRef.current!);
        pollTimerRef.current = null;
        setMultiError(
          'The search is taking longer than expected. Check the Leads page in a few minutes — the batch may still complete in the background.'
        );
        setMultiStage('error');
        return;
      }

      try {
        const status = await pollLeadFinderJob(jobId);

        if (status.progress) setMultiProgress(status.progress);

        if (status.status === 'done' && status.result) {
          clearInterval(pollTimerRef.current!);
          pollTimerRef.current = null;
          setMultiResult(status.result);
          setMultiStage('done');
          return;
        }

        if (status.status === 'error') {
          clearInterval(pollTimerRef.current!);
          pollTimerRef.current = null;
          setMultiError(status.error || 'The search failed on the server.');
          setMultiStage('error');
        }
      } catch (err) {
        console.warn('[LeadFinder] Poll error (will retry):', err);
      }
    }, POLL_INTERVAL_MS);
  };

  // ─── Tab 2: Smart Search helpers ─────────────────────────────────────────────

  const canSmartSearch = !!smartForm.projectId && smartForm.description.trim().length > 0;

  const stageToStep = (stage: string): number => {
    if (stage === 'analyzing') return 0;
    if (stage === 'searching') return 1;
    if (stage === 'checking')  return 2;
    if (stage === 'filtering') return 3;
    return -1;
  };

  const stopElapsedTimer = () => {
    if (smartElapsedRef.current) { clearInterval(smartElapsedRef.current); smartElapsedRef.current = null; }
  };

  const stopPollTimer = () => {
    if (smartPollRef.current) { clearInterval(smartPollRef.current); smartPollRef.current = null; }
  };

  const formatElapsed = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  // ─── Tab 2: start smart search ───────────────────────────────────────────────

  const handleSmartSearch = async () => {
    stopPollTimer();
    stopElapsedTimer();

    setSmartStage('running');
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setResultLeads([]);
    setCheckedEmails(new Set());
    setSmartParsedParams(null);
    setSmartSummary(null);
    setSmartError('');
    setSmartSaveResult(null);
    setSmartCheckDetail('');
    setSmartElapsed(0);

    let jobId: string;
    try {
      const resp = await startSmartSearch({
        projectId:       smartForm.projectId,
        instructionText: smartForm.description.trim(),
        leadsCount:      smartForm.leadsCount,
        strictness:      smartForm.strictness,
      });
      jobId = resp.jobId;
      smartJobIdRef.current = jobId;
    } catch (err) {
      setSmartError(err instanceof Error ? err.message : 'Failed to start search.');
      setSmartStage('idle');
      return;
    }

    // Elapsed timer — cosmetic, ticks every second
    const jobStartTs = Date.now();
    smartElapsedRef.current = setInterval(() => {
      setSmartElapsed(Math.floor((Date.now() - jobStartTs) / 1000));
    }, 1000);

    const POLL_MS = 2500;

    smartPollRef.current = setInterval(async () => {
      try {
        const status = await getSmartSearchStatus(jobId);

        if (status.parsedParams) setSmartParsedParams(status.parsedParams);

        const stepIdx = stageToStep(status.stage);
        if (stepIdx >= 0) {
          setCurrentStep(stepIdx);
          setCompletedSteps(prev => {
            const next = new Set(prev);
            for (let i = 0; i < stepIdx; i++) next.add(i);
            return next;
          });
        }
        if (status.progress?.detail) setSmartCheckDetail(status.progress.detail);

        // Show partial results as they arrive
        if (status.results && status.results.length > 0) {
          const sorted = [...status.results].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
          setResultLeads(sorted);
        }

        if (status.status === 'done') {
          stopPollTimer();
          stopElapsedTimer();
          setCompletedSteps(new Set([0, 1, 2, 3]));
          setCurrentStep(-1);
          const leads = status.results ?? [];
          const sorted = [...leads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
          setResultLeads(sorted);
          setCheckedEmails(new Set(sorted.map(l => l.email)));
          setSmartSummary(status.summary ?? null);
          setSmartStage('results');
          return;
        }

        if (status.status === 'error') {
          stopPollTimer();
          stopElapsedTimer();
          // Show results screen if there are partial leads; otherwise idle with error msg
          const partialLeads = status.results ?? [];
          if (partialLeads.length > 0) {
            const sorted = [...partialLeads].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
            setResultLeads(sorted);
            setCheckedEmails(new Set(sorted.map(l => l.email)));
            setSmartSummary(status.summary ?? null);
            setSmartError(status.error || 'Search ended early.');
            setSmartStage('results');
          } else {
            setSmartError(status.error || 'The search failed on the server.');
            setSmartStage('idle');
          }
        }
        // 'running' → keep polling
      } catch (err) {
        console.warn('[SmartSearch] Poll error (will retry):', err);
      }
    }, POLL_MS);
  };

  // Request a graceful stop; keep polling — backend will finish current batch then complete
  const handleStopSearch = async () => {
    if (!smartJobIdRef.current) return;
    try {
      await stopSmartSearch(smartJobIdRef.current);
    } catch (err) {
      console.warn('[SmartSearch] Stop request failed:', err);
    }
  };

  // ─── Tab 2: results actions ───────────────────────────────────────────────────

  const toggleLead = (email: string) =>
    setCheckedEmails(prev => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });

  const allChecked  = resultLeads.length > 0 && checkedEmails.size === resultLeads.length;
  const noneChecked = checkedEmails.size === 0;

  const handleSelectAll = () =>
    setCheckedEmails(allChecked ? new Set() : new Set(resultLeads.map(l => l.email)));

  const handleSaveLeads = async () => {
    if (smartSaving) return;
    setSmartSaving(true);
    try {
      const selected = resultLeads.filter(l => checkedEmails.has(l.email)).map(l => l.email);
      const result = await saveSmartSearch(smartJobIdRef.current, selected);
      setSmartSaveResult(result);
      setSmartStage('saved');
    } catch (err) {
      setSmartError(err instanceof Error ? err.message : 'Failed to save leads.');
    } finally {
      setSmartSaving(false);
    }
  };

  const handleStartOver = () => {
    stopPollTimer();
    stopElapsedTimer();
    setSmartStage('idle');
    setResultLeads([]);
    setCheckedEmails(new Set());
    setCurrentStep(-1);
    setCompletedSteps(new Set());
    setSmartParsedParams(null);
    setSmartSummary(null);
    setSmartError('');
    setSmartSaveResult(null);
    setSmartCheckDetail('');
    setSmartElapsed(0);
  };

  // ─── Shared flag render ───────────────────────────────────────────────────────

  const FlagImg = ({ flag, size = 'sm' }: { flag: string; size?: 'sm' | 'xs' }) => {
    const cls = size === 'sm' ? 'w-5 h-4' : 'w-4 h-3';
    if (flag.startsWith('http'))
      return <img src={flag} alt="flag" className={`${cls} object-cover rounded-sm shrink-0`} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
    return <span className="text-sm shrink-0">{flag}</span>;
  };

  // ─── Per-niche breakdown helper ───────────────────────────────────────────────
  const getNicheBreakdown = (total: number, count: number): number[] => {
    if (count === 0) return [];
    const base      = Math.floor(total / count);
    const remainder = total % count;
    return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
  };

  // ─── Score badge helper ───────────────────────────────────────────────────────
  const ScoreBadge = ({ score }: { score: number }) => {
    let cls = 'bg-green-100 text-green-800';
    if (score < 50) cls = 'bg-red-100 text-red-700';
    else if (score < 70) cls = 'bg-amber-100 text-amber-800';
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums ${cls}`}>
        {score}
      </span>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      <Topbar selectedProject={selectedProject} onProjectChange={handleTopbarProjectChange} />

      <div className="flex-1 px-7 py-6 max-w-[1400px] w-full mx-auto space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find New Leads</h1>
          <p className="text-sm text-gray-400 mt-0.5">Search businesses in your target location and niche.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          <button onClick={() => setActiveTab('multi')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'multi' ? 'bg-accent text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Multi-Niche Search
          </button>
          <button onClick={() => setActiveTab('smart')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'smart' ? 'bg-accent text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            Smart Search (AI)
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1 — MULTI-NICHE SEARCH
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'multi' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Left: form ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="space-y-5">

                {/* Project */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={multiForm.projectId}
                    onChange={e => setMultiForm(f => ({ ...f, projectId: e.target.value }))}
                    disabled={projectsLoading}
                    className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent appearance-none"
                  >
                    <option value="">Select a project…</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                  {projects.length === 0 && !projectsLoading && (
                    <p className="mt-1 text-xs text-gray-400">No projects found — create one in Settings first.</p>
                  )}
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
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
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
                        {countriesLoading
                          ? <div className="p-3 text-sm text-gray-500">Loading countries…</div>
                          : filteredCountries.length === 0
                            ? <div className="p-3 text-sm text-gray-500">No countries found for &quot;{countrySearchTerm}&quot;</div>
                            : <>
                                {usingFallbackData && <div className="p-2 text-xs text-blue-600 bg-blue-50 border-b border-blue-100">Using offline country data</div>}
                                {filteredCountries.map(country => (
                                  <button key={country.cca2} type="button" onClick={() => handleCountrySelect(country)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50"
                                  >
                                    <FlagImg flag={getFlag(country)} size="sm" />
                                    <span className="text-gray-900">{country.name.common}</span>
                                  </button>
                                ))}
                              </>
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* City */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">
                      City {!allCities && <span className="text-red-500">*</span>}
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allCities}
                        onChange={e => {
                          setAllCities(e.target.checked);
                          if (e.target.checked) setMultiForm(f => ({ ...f, city: '' }));
                        }}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-accent focus:ring-accent/30 cursor-pointer"
                      />
                      <span className="text-xs text-gray-500">All cities in country</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={multiForm.city}
                    onChange={e => setMultiForm(f => ({ ...f, city: e.target.value }))}
                    disabled={allCities}
                    placeholder={allCities ? 'Searching entire country…' : 'e.g. Frankfurt'}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  />
                  {allCities && (
                    <p className="mt-1 text-xs text-amber-600">
                      ⚠ Whole-country searches may return more varied results and take a bit longer.
                    </p>
                  )}
                </div>

                {/* Niches */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Niches <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-gray-400">{multiForm.niches.length}/{MAX_NICHES}</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      ref={nicheInputRef}
                      type="text"
                      value={nicheInput}
                      onChange={e => setNicheInput(e.target.value)}
                      onKeyDown={handleNicheKeyDown}
                      disabled={multiForm.niches.length >= MAX_NICHES}
                      placeholder={multiForm.niches.length >= MAX_NICHES ? `Max ${MAX_NICHES} niches reached` : 'e.g. Jewelry Store'}
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={addNiche}
                      disabled={!nicheInput.trim() || multiForm.niches.length >= MAX_NICHES}
                      className="px-3.5 py-2.5 bg-accent hover:bg-accent-hover disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                    >
                      Add
                    </button>
                  </div>

                  <p className="mt-1.5 text-xs text-gray-400">
                    Press{' '}
                    <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[10px]">Enter</kbd>
                    {' '}to add,{' '}
                    <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[10px]">Backspace</kbd>
                    {' '}on empty to remove last
                  </p>

                  {multiForm.niches.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {multiForm.niches.map((niche, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-accent/10 text-accent text-xs font-medium px-2.5 py-1 rounded-md">
                          {niche}
                          <button type="button" onClick={() => removeNiche(i)}
                            className="text-accent/50 hover:text-accent ml-0.5 leading-none"
                            aria-label={`Remove ${niche}`}
                          >✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Number of Leads */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Leads</label>
                  <input
                    type="number"
                    value={multiForm.totalLeads}
                    onChange={e => setMultiForm(f => ({ ...f, totalLeads: parseInt(e.target.value) || 1 }))}
                    min={1} max={5000}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                  {multiForm.niches.length > 1 && (
                    <p className="mt-1 text-xs text-gray-400">
                      ~{Math.ceil(multiForm.totalLeads / multiForm.niches.length)} per niche across {multiForm.niches.length} niches
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  onClick={handleFindLeads} disabled={!canFindLeads || multiStage === 'loading'}
                  className="w-full bg-accent hover:bg-accent-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2"
                >
                  {multiStage === 'loading' ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Searching…
                    </>
                  ) : multiForm.niches.length > 1 ? `Find Leads across ${multiForm.niches.length} Niches` : 'Find Leads'}
                </button>

                {/* Loading state: live progress */}
                {multiStage === 'loading' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3.5 py-3.5 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <svg className="animate-spin h-4 w-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <p className="text-sm font-medium text-blue-800">
                        {multiProgress ? `Searching "${multiProgress.currentNiche}"…` : 'Starting search…'}
                      </p>
                    </div>
                    {multiProgress && (
                      <div className="flex items-center gap-4 text-xs text-blue-700 font-medium">
                        <span><span className="text-blue-900 font-bold tabular-nums">{multiProgress.checked}</span> businesses checked</span>
                        <span className="text-blue-400">·</span>
                        <span><span className="text-blue-900 font-bold tabular-nums">{multiProgress.validFound}</span> valid leads found</span>
                        <span className="text-blue-400">·</span>
                        <span>target: {multiProgress.target}</span>
                      </div>
                    )}
                    <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: multiProgress && multiProgress.target > 0 ? `${Math.min(100, Math.round((multiProgress.validFound / multiProgress.target) * 100))}%` : '4%' }}
                      />
                    </div>
                    <p className="text-xs text-blue-600">
                      {multiProgress
                        ? `${Math.min(100, Math.round((multiProgress.validFound / multiProgress.target) * 100))}% of target · scraping websites for emails`
                        : `Querying TomTom across ${multiForm.niches.length} niche${multiForm.niches.length > 1 ? 's' : ''} in ${allCities ? multiForm.country : `${multiForm.city}, ${multiForm.country}`}…`
                      }
                    </p>
                  </div>
                )}

                {/* Success state */}
                {multiStage === 'done' && multiResult && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3.5 py-3 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 shrink-0 mt-0.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-green-800">
                          Found {multiResult.totalFound} valid lead{multiResult.totalFound !== 1 ? 's' : ''} across {multiForm.niches.length} niche{multiForm.niches.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-green-700 mt-0.5">
                          Checked {multiResult.checkedCount} businesses · {multiResult.tomtomCallCount} TomTom API calls · saved to a new batch
                        </p>
                      </div>
                    </div>

                    {multiResult.stopReason && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <p className="text-xs text-amber-800">
                          {multiResult.stopReason === 'rate_limit'
                            ? `Search stopped early — TomTom API quota reached. Got ${multiResult.totalFound} of ${multiForm.totalLeads} requested leads.`
                            : `Search reached the per-niche business cap. Got ${multiResult.totalFound} of ${multiForm.totalLeads} requested leads.`
                          }
                        </p>
                      </div>
                    )}

                    {multiResult.perNicheBreakdown.length > 1 && (
                      <div className="ml-6 space-y-1">
                        {multiResult.perNicheBreakdown.map(nb => (
                          <div key={nb.niche} className="flex items-center justify-between text-xs text-green-700">
                            <span className="font-medium">
                              {nb.niche}
                              {nb.skipped && <span className="ml-1 text-amber-600">(skipped)</span>}
                              {nb.stoppedEarly && !nb.skipped && <span className="ml-1 text-amber-600">(stopped early)</span>}
                            </span>
                            <span>{nb.skipped ? '—' : `${nb.validFound} valid from ${nb.totalChecked} checked`}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="ml-6">
                      <a href={`/leads?batch=${multiResult.batchId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-900 underline underline-offset-2"
                      >
                        View batch in Leads
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                )}

                {/* Error state */}
                {multiStage === 'error' && multiError && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800">Search failed</p>
                      <p className="text-xs text-red-600 mt-0.5">{multiError}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-3.5 py-3">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    We&apos;ll search each niche separately via TomTom, scrape websites for emails, and save everything to your leads list.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Right: Search Preview ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Search Preview</h3>

              <div className="w-full h-44 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center mb-5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <svg width="100%" height="100%" viewBox="0 0 400 300">
                    <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#cbd5e0" strokeWidth="0.5"/></pattern></defs>
                    <rect width="100%" height="100%" fill="url(#grid)"/>
                  </svg>
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white shadow-lg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z"/>
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600 mt-1 font-medium">{multiForm.city || '—'}</span>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-sm text-gray-500">Project</span>
                  <span className="text-sm font-medium text-gray-900">
                    {projects.find(p => p._id === multiForm.projectId)?.name || <span className="text-gray-400 font-normal">Not selected</span>}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-sm text-gray-500">Country</span>
                  <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                    <FlagImg flag={selectedCountryFlag} size="xs" />{multiForm.country || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-sm text-gray-500">City</span>
                  <span className="text-sm font-medium text-gray-900">
                    {allCities ? <span className="text-accent font-medium">All cities</span> : multiForm.city || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-start py-2.5">
                  <span className="text-sm text-gray-500 shrink-0 mr-4">Niches</span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {multiForm.niches.length === 0
                      ? <span className="text-sm text-gray-400 font-normal">None added yet</span>
                      : multiForm.niches.map((n, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent">{n}</span>
                        ))}
                  </div>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-sm text-gray-500">Total Leads</span>
                  <span className="text-sm font-semibold text-accent">{multiForm.totalLeads}</span>
                </div>
                {multiForm.niches.length > 1 && (() => {
                  const breakdown = getNicheBreakdown(multiForm.totalLeads, multiForm.niches.length);
                  const unique = Array.from(new Set(breakdown)).sort((a, b) => b - a);
                  const summaryText = unique.length === 1
                    ? `${unique[0]} per niche`
                    : unique.map(v => { const count = breakdown.filter(x => x === v).length; return `${v}×${count}`; }).join(', ') + ' per niche';
                  return (
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-sm text-gray-400">Split ({multiForm.niches.length} niches)</span>
                      <span className="text-xs text-gray-500 font-medium">{summaryText}</span>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2 — SMART SEARCH (AI)
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'smart' && (
          <>
            {/* ── IDLE: search form + explainer ── */}
            {smartStage === 'idle' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="space-y-5">

                    {/* Project */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Project <span className="text-red-500">*</span>
                      </label>
                      <select value={smartForm.projectId} onChange={e => setSmartForm(f => ({ ...f, projectId: e.target.value }))} disabled={projectsLoading}
                        className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent appearance-none"
                      >
                        <option value="">Select a project…</option>
                        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                      {projects.length === 0 && !projectsLoading && (
                        <p className="mt-1 text-xs text-gray-400">No projects found — create one in Settings first.</p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Describe what you&apos;re looking for <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={smartForm.description}
                        onChange={e => setSmartForm(f => ({ ...f, description: e.target.value }))}
                        rows={4}
                        placeholder="e.g. Find restaurants in Frankfurt with outdated websites"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
                      />
                      <p className="mt-1 text-xs text-gray-400">Be as specific as you like — include location, industry, website quality, size, etc.</p>
                    </div>

                    {/* Number of leads + Strictness — side by side */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of leads</label>
                        <input
                          type="number"
                          value={smartForm.leadsCount}
                          onChange={e => {
                            const v = Math.max(5, Math.min(100, parseInt(e.target.value) || 20));
                            setSmartForm(f => ({ ...f, leadsCount: v }));
                          }}
                          min={5} max={100}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                        />
                        <p className="mt-1 text-xs text-gray-400">5 – 100</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Match strictness</label>
                        <select
                          value={smartForm.strictness}
                          onChange={e => setSmartForm(f => ({ ...f, strictness: e.target.value }))}
                          className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent appearance-none"
                        >
                          <option value="strict">Strict (score ≥ 70)</option>
                          <option value="normal">Normal (score ≥ 50)</option>
                          <option value="loose">Loose (score ≥ 30)</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-400">How closely leads must match</p>
                      </div>
                    </div>

                    {/* Error from previous run */}
                    {smartError && (
                      <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-3">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-0.5">
                          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-red-800">Search failed</p>
                          <p className="text-xs text-red-600 mt-0.5">{smartError}</p>
                        </div>
                      </div>
                    )}

                    {/* Submit */}
                    <button onClick={handleSmartSearch} disabled={!canSmartSearch}
                      className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                      </svg>
                      Find Leads with AI
                    </button>

                    <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-lg px-3.5 py-3">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mt-0.5 shrink-0">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Our AI will analyze your request, search for matching businesses, check their websites, and only save the ones that match your criteria.
                      </p>
                    </div>
                  </div>
                </div>

                {/* How it works panel */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">How Smart Search works</h3>
                  <p className="text-sm text-gray-400 mb-6">AI-powered lead discovery in four steps.</p>
                  <div className="space-y-5">
                    {[
                      { step: '1', title: 'Understand your request',  desc: 'The AI extracts country, city, niche, and quality criteria from your description.',                                     color: 'bg-blue-100 text-blue-700'   },
                      { step: '2', title: 'Search businesses',        desc: 'Searches TomTom POI database for matching businesses with websites in your target location.',                            color: 'bg-purple-100 text-purple-700' },
                      { step: '3', title: 'Check websites',           desc: 'Visits each site to scrape the email address and extract quality signals (SSL, mobile, copyright year, etc.).',         color: 'bg-amber-100 text-amber-700'  },
                      { step: '4', title: 'Filter & match',           desc: 'AI evaluates each candidate against your criteria using the signals. Only matching leads are kept.',                    color: 'bg-green-100 text-green-700'  },
                    ].map(({ step, title, desc, color }) => (
                      <div key={step} className="flex gap-4">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${color} flex items-center justify-center text-sm font-bold`}>{step}</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── RUNNING: real progress from backend ── */}
            {smartStage === 'running' && (
              <div className="max-w-xl mx-auto w-full">
                <div className="bg-white rounded-xl border border-gray-200 p-8">

                  {/* Header row: title + elapsed time */}
                  <div className="flex items-start justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent animate-spin" style={{ animationDuration: '2s' }}>
                          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-gray-900">AI is finding your leads</h2>
                        <p className="text-xs text-gray-400 mt-0.5 italic truncate max-w-xs">&ldquo;{smartForm.description}&rdquo;</p>
                      </div>
                    </div>
                    {/* Elapsed timer */}
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-mono text-gray-400 tabular-nums">{formatElapsed(smartElapsed)}</span>
                      <p className="text-[10px] text-gray-300">elapsed</p>
                    </div>
                  </div>

                  {/* "Understood as" box — shown once parsedParams arrive */}
                  {smartParsedParams && (
                    <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-3">
                      <p className="text-xs font-medium text-gray-600 mb-1.5">Understood your request as:</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-700">
                        <span><span className="text-gray-400">Niche</span> {smartParsedParams.niche}</span>
                        <span>
                          <span className="text-gray-400">Location</span>{' '}
                          {smartParsedParams.city ? `${smartParsedParams.city}, ${smartParsedParams.country}` : smartParsedParams.country}
                          {!smartParsedParams.city && <span className="text-gray-400"> (all cities)</span>}
                        </span>
                        <span><span className="text-gray-400">Target</span> {smartParsedParams.leadsCount} leads</span>
                        {smartParsedParams.criteria
                          ? <span><span className="text-gray-400">Criteria</span> {smartParsedParams.criteria}</span>
                          : <span className="text-gray-400 italic">No quality criteria — all businesses accepted</span>}
                      </div>
                    </div>
                  )}

                  {/* Step list */}
                  <div className="space-y-4">
                    {PROGRESS_STEPS.map((step, idx) => {
                      const isDone   = completedSteps.has(idx);
                      const isActive = currentStep === idx;
                      const detailLabel = isActive && idx === 2 && smartCheckDetail ? smartCheckDetail : step.label;
                      return (
                        <div key={step.id} className="flex items-center gap-4">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isDone ? 'bg-green-100' : isActive ? 'bg-accent/10' : 'bg-gray-100'}`}>
                            {isDone
                              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"/></svg>
                              : isActive
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                : <div className="w-2 h-2 rounded-full bg-gray-300"/>
                            }
                          </div>
                          <span className={`text-sm transition-all duration-300 ${isDone ? 'text-gray-500 line-through' : isActive ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>
                            {detailLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${((completedSteps.size + (currentStep >= 0 ? 0.5 : 0)) / PROGRESS_STEPS.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    {currentStep >= 0 ? `Step ${currentStep + 1} of ${PROGRESS_STEPS.length}` : 'Finishing up…'}
                  </p>

                  {/* Live partial result count */}
                  {resultLeads.length > 0 && (
                    <p className="text-xs text-green-600 font-medium text-center mt-2">
                      {resultLeads.length} matching lead{resultLeads.length !== 1 ? 's' : ''} found so far…
                    </p>
                  )}

                  {/* Stop button */}
                  <div className="mt-6 pt-5 border-t border-gray-100 flex justify-center">
                    <button
                      onClick={handleStopSearch}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-400 rounded-lg px-4 py-2 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <rect x="4" y="4" width="16" height="16" rx="2"/>
                      </svg>
                      Stop and show results so far
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── RESULTS: review real leads ── */}
            {smartStage === 'results' && (
              <div className="space-y-4">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {resultLeads.length > 0
                        ? `Found ${resultLeads.length} matching lead${resultLeads.length !== 1 ? 's' : ''}`
                        : 'No matching leads found'}
                    </h2>
                    <p className="text-sm text-gray-400 mt-0.5 italic">&ldquo;{smartForm.description}&rdquo;</p>
                  </div>
                  <button onClick={handleStartOver}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
                    </svg>
                    Start Over
                  </button>
                </div>

                {/* "Understood as" box */}
                {smartParsedParams && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-700">
                    <span className="font-medium text-gray-500 shrink-0">Understood as:</span>
                    <span><span className="text-gray-400">Niche</span> <span className="font-medium">{smartParsedParams.niche}</span></span>
                    <span><span className="text-gray-400">Location</span> <span className="font-medium">{smartParsedParams.city ? `${smartParsedParams.city}, ${smartParsedParams.country}` : smartParsedParams.country}</span></span>
                    {smartParsedParams.criteria
                      ? <span><span className="text-gray-400">Criteria</span> <span className="font-medium">{smartParsedParams.criteria}</span></span>
                      : <span className="text-gray-400 italic">No quality criteria</span>}
                  </div>
                )}

                {/* Summary stats — full funnel */}
                {smartSummary && (
                  <div className="text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-wrap gap-x-3 gap-y-1 items-center">
                    <span>Found <strong>{smartSummary.candidatesFound}</strong> candidates</span>
                    <span className="text-gray-300">→</span>
                    <span>checked <strong>{smartSummary.homepagesChecked}</strong> sites</span>
                    {smartSummary.passedPrefilter < smartSummary.homepagesChecked && (
                      <>
                        <span className="text-gray-300">→</span>
                        <span><strong>{smartSummary.passedPrefilter}</strong> looked outdated</span>
                      </>
                    )}
                    <span className="text-gray-300">→</span>
                    <span><strong>{smartSummary.withEmail}</strong> had an email</span>
                    <span className="text-gray-300">→</span>
                    <span><strong>{smartSummary.matched}</strong> matched</span>
                    {smartSummary.totalElapsedSec != null && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-400">completed in <strong>{formatElapsed(smartSummary.totalElapsedSec)}</strong></span>
                      </>
                    )}
                  </div>
                )}

                {/* Stopped early notice */}
                {smartSummary?.stoppedEarlyReason && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <p className="text-xs text-amber-800">
                      {smartSummary.stoppedEarlyReason === 'cancelled'
                        ? 'Search was stopped early at your request. Showing results collected so far.'
                        : smartSummary.stoppedEarlyReason === 'time_limit' || smartSummary.stoppedEarlyReason === 'Time limit reached'
                          ? 'Search reached the 4-minute time limit. Showing all results collected within the time budget.'
                          : smartSummary.stoppedEarlyReason === 'rate_limit'
                            ? 'Search stopped early — TomTom API quota reached. Results may be fewer than requested.'
                            : `Search stopped early: ${smartSummary.stoppedEarlyReason}`}
                    </p>
                  </div>
                )}

                {/* Error from backend (non-fatal, partial results exist) */}
                {smartError && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-3">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <p className="text-sm text-red-700">{smartError}</p>
                  </div>
                )}

                {/* Zero results empty state */}
                {resultLeads.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-10 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-800 mb-1">No matches found</h3>
                    <p className="text-sm text-gray-500 max-w-xs">
                      {smartParsedParams?.criteria
                        ? 'Your criteria is strict — none of the businesses found matched it. Try a broader description or use Loose strictness.'
                        : 'No businesses with usable emails were found for this location and niche. Try a broader search.'}
                    </p>
                    <button onClick={handleStartOver} className="mt-5 text-sm text-accent hover:underline font-medium">Try a different search</button>
                  </div>
                ) : (
                  <>
                    {/* Strict criteria hint */}
                    {smartSummary && smartParsedParams && smartSummary.matched < smartParsedParams.leadsCount && smartParsedParams.criteria && (
                      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3.5 py-2.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 shrink-0 mt-0.5">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        <p className="text-xs text-blue-700">Your criteria matched fewer leads than requested. Try Loose strictness to get more results.</p>
                      </div>
                    )}

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {/* Select all header */}
                      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input type="checkbox" checked={allChecked}
                            ref={el => { if (el) el.indeterminate = !allChecked && !noneChecked; }}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent/30 cursor-pointer"
                          />
                          <span className="text-sm font-medium text-gray-700">{allChecked ? 'Deselect All' : 'Select All'}</span>
                        </label>
                        <span className="text-xs text-gray-500">{checkedEmails.size} of {resultLeads.length} selected · sorted by score</span>
                      </div>

                      {/* Lead rows */}
                      <div className="divide-y divide-gray-100">
                        {resultLeads.map((lead, idx) => {
                          const checked = checkedEmails.has(lead.email);
                          return (
                            <div key={idx} onClick={() => toggleLead(lead.email)}
                              className={`flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer ${checked ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/60 hover:bg-gray-50'}`}
                            >
                              <div className="pt-0.5 shrink-0">
                                <input type="checkbox" checked={checked}
                                  onChange={() => toggleLead(lead.email)}
                                  onClick={e => e.stopPropagation()}
                                  className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent/30 cursor-pointer"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className={`text-sm font-semibold ${checked ? 'text-gray-900' : 'text-gray-400'}`}>{lead.company}</span>
                                  {/* Score badge */}
                                  {lead.score != null && <ScoreBadge score={lead.score} />}
                                  <a href={lead.website} target="_blank" rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="text-xs text-accent hover:underline truncate max-w-[160px]"
                                  >
                                    {lead.website.replace(/^https?:\/\//, '')}
                                  </a>
                                  <span className={`text-xs ${checked ? 'text-gray-500' : 'text-gray-400'}`}>{lead.email}</span>
                                </div>
                                {lead.reason && (
                                  <div className="mt-1.5 flex items-center gap-1.5">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0">
                                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                                    </svg>
                                    <span className="text-[11px] text-gray-400 italic">{lead.reason}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer actions */}
                      <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
                        <button onClick={handleStartOver} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
                        <button onClick={handleSaveLeads}
                          disabled={noneChecked || smartSaving}
                          className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                        >
                          {smartSaving
                            ? <><svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>Saving…</>
                            : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save {checkedEmails.size} Lead{checkedEmails.size !== 1 ? 's' : ''} to Batch</>
                          }
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── SAVED: success screen ── */}
            {smartStage === 'saved' && (
              <div className="max-w-xl mx-auto w-full">
                <div className="bg-white rounded-xl border border-gray-200 p-10 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    {smartSaveResult ? `${smartSaveResult.savedCount} lead${smartSaveResult.savedCount !== 1 ? 's' : ''} saved!` : 'Leads saved!'}
                  </h2>
                  {smartSaveResult && (
                    <p className="text-sm text-gray-500 mb-1">Saved to batch &quot;{smartSaveResult.batchName}&quot;</p>
                  )}
                  <p className="text-sm text-gray-400">Find them in the Leads page.</p>
                  <div className="mt-5 flex gap-3">
                    <a href="/leads" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-accent hover:bg-accent-hover px-4 py-2 rounded-lg transition-colors">
                      View in Leads
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </a>
                    <button onClick={handleStartOver} className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-4 py-2 bg-white hover:bg-gray-50 transition-colors">
                      New Search
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
