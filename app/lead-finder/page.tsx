'use client';

import { useState, useEffect, useRef, KeyboardEvent, useCallback } from 'react';
import Topbar from '@/components/dashboard/Topbar';
import { FALLBACK_COUNTRIES, type StaticCountry } from '@/lib/countries';
import { getProjects, type Project } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Country {
  name:  { common: string; official: string };
  flags: { png: string; svg: string; alt?: string };
  cca2:  string;
}

type ActiveTab   = 'multi' | 'smart';
type SmartStage  = 'idle' | 'running' | 'results' | 'saved';

const MAX_NICHES = 10;

// ─── Mock AI result data ──────────────────────────────────────────────────────

interface MockLead {
  id:      string;
  company: string;
  website: string;
  email:   string;
  reason:  string;
}

const MOCK_LEADS: MockLead[] = [
  { id: 'ml1', company: 'Ristorante Da Marco',         website: 'damarco-berlin.de',          email: 'info@damarco-berlin.de',          reason: 'Site last updated 2018, no SSL, missing meta tags' },
  { id: 'ml2', company: 'Gasthaus Zum Goldenen Löwen', website: 'goldener-loewen-muenchen.de', email: 'kontakt@goldener-loewen.de',       reason: 'Flash-based site, no mobile version, outdated design' },
  { id: 'ml3', company: 'Café Brennstein',             website: 'cafe-brennstein.com',         email: 'hallo@cafe-brennstein.com',        reason: 'WordPress 4.9, expired SSL, slow load (8.4s)' },
  { id: 'ml4', company: 'Trattoria Bella Napoli',      website: 'bella-napoli-hamburg.de',     email: 'info@bella-napoli-hamburg.de',     reason: 'No online menu, HTML tables layout, last crawled 2020' },
  { id: 'ml5', company: 'Restaurant Zur Alten Post',   website: 'zur-alten-post.com',          email: 'post@zur-alten-post.com',          reason: 'No Google Maps embed, PageSpeed 22/100, no HTTPS' },
  { id: 'ml6', company: "Wirtshaus Lederhos'n",        website: 'lederhosnwirt.de',            email: 'reservierung@lederhosnwirt.de',    reason: 'Broken contact form, images not optimised, 2017 copyright' },
  { id: 'ml7', company: 'Osteria Piccolo Mondo',       website: 'piccolomondo-koeln.de',       email: 'tisch@piccolomondo-koeln.de',      reason: 'No GDPR cookie banner, no reviews widget, outdated navbar' },
  { id: 'ml8', company: 'Biergarten Am Stadtpark',     website: 'biergarten-stadtpark.de',     email: 'info@biergarten-stadtpark.de',     reason: 'Static HTML site, no booking system, no social links' },
];

const PROGRESS_STEPS = [
  { id: 'analyze', label: 'Analyzing your request…'  },
  { id: 'search',  label: 'Searching businesses…'    },
  { id: 'check',   label: 'Checking websites…'       },
  { id: 'filter',  label: 'Filtering matches…'       },
];

const STEP_DELAY_MS = 1400;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadFinderPage() {

  // ── Shared state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]               = useState<ActiveTab>('multi');
  const [selectedProject, setSelectedProject]   = useState('all');
  const [projects, setProjects]                 = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading]   = useState(true);

  // ── Country state ────────────────────────────────────────────────────────────
  const [countries, setCountries]                   = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading]     = useState(false);
  const [usingFallbackData, setUsingFallbackData]   = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm]   = useState('Germany');
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
  const [nicheInput, setNicheInput] = useState('');
  const nicheInputRef = useRef<HTMLInputElement>(null);
  const [multiSearched, setMultiSearched] = useState(false);

  // ── Tab 2: Smart Search ──────────────────────────────────────────────────────
  const [smartForm, setSmartForm] = useState({ projectId: '', description: '' });
  const [smartStage, setSmartStage]           = useState<SmartStage>('idle');
  const [currentStep, setCurrentStep]         = useState(-1);
  const [completedSteps, setCompletedSteps]   = useState<Set<number>>(new Set());
  const [resultLeads, setResultLeads]         = useState<MockLead[]>([]);
  const [checkedIds, setCheckedIds]           = useState<Set<string>>(new Set());

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
    multiForm.city.trim() !== '' && multiForm.niches.length > 0;

  const handleFindLeads = () => {
    console.log('[LeadFinder] Multi-Niche payload:', {
      projectId: multiForm.projectId, country: multiForm.country,
      city: multiForm.city, niches: multiForm.niches, totalLeads: multiForm.totalLeads,
    });
    setMultiSearched(true);
  };

  // ─── Tab 2: animated progress then results ────────────────────────────────────

  const canSmartSearch = !!smartForm.projectId && smartForm.description.trim().length > 0;

  const runSmartProgress = useCallback(() => {
    setSmartStage('running');
    setCurrentStep(0);
    setCompletedSteps(new Set());
    PROGRESS_STEPS.forEach((_, idx) => {
      setTimeout(() => {
        setCompletedSteps(prev => { const next = new Set(prev); if (idx > 0) next.add(idx - 1); return next; });
        setCurrentStep(idx);
      }, idx * STEP_DELAY_MS);
    });
    const totalDelay = PROGRESS_STEPS.length * STEP_DELAY_MS;
    setTimeout(() => { setCompletedSteps(new Set([0, 1, 2, 3])); setCurrentStep(-1); }, totalDelay);
    setTimeout(() => {
      setResultLeads(MOCK_LEADS);
      setCheckedIds(new Set(MOCK_LEADS.map(l => l.id)));
      setSmartStage('results');
    }, totalDelay + 400);
  }, []);

  const handleSmartSearch = () => { console.log('[LeadFinder] Smart Search payload:', smartForm); runSmartProgress(); };

  // ─── Tab 2: results actions ───────────────────────────────────────────────────

  const toggleLead = (id: string) => setCheckedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const allChecked  = checkedIds.size === resultLeads.length;
  const noneChecked = checkedIds.size === 0;
  const handleSelectAll = () => setCheckedIds(allChecked ? new Set() : new Set(resultLeads.map(l => l.id)));

  const handleSaveLeads = () => {
    console.log('[LeadFinder] Saving leads:', resultLeads.filter(l => checkedIds.has(l.id)));
    setSmartStage('saved');
    setTimeout(() => {
      setSmartStage('idle'); setSmartForm({ projectId: '', description: '' });
      setResultLeads([]); setCheckedIds(new Set()); setCurrentStep(-1); setCompletedSteps(new Set());
    }, 1800);
  };

  const handleStartOver = () => {
    setSmartStage('idle'); setResultLeads([]); setCheckedIds(new Set());
    setCurrentStep(-1); setCompletedSteps(new Set());
  };

  // ─── Shared flag render ───────────────────────────────────────────────────────

  const FlagImg = ({ flag, size = 'sm' }: { flag: string; size?: 'sm' | 'xs' }) => {
    const cls = size === 'sm' ? 'w-5 h-4' : 'w-4 h-3';
    if (flag.startsWith('http'))
      return <img src={flag} alt="flag" className={`${cls} object-cover rounded-sm shrink-0`} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
    return <span className="text-sm shrink-0">{flag}</span>;
  };

  // ─── Per-niche breakdown helper ───────────────────────────────────────────────
  // Distributes totalLeads as evenly as possible across niches.
  // Returns array of per-niche counts that sum to exactly totalLeads.
  const getNicheBreakdown = (total: number, count: number): number[] => {
    if (count === 0) return [];
    const base = Math.floor(total / count);
    const remainder = total % count;
    return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={multiForm.city}
                    onChange={e => setMultiForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="e.g. Frankfurt"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                </div>

                {/* ── Niches — clean input + separate tag row below ── */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Niches <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-gray-400">{multiForm.niches.length}/{MAX_NICHES}</span>
                  </div>

                  {/* Input row — clean text input + Add button */}
                  <div className="flex gap-2">
                    <input
                      ref={nicheInputRef}
                      type="text"
                      value={nicheInput}
                      onChange={e => setNicheInput(e.target.value)}
                      onKeyDown={handleNicheKeyDown}
                      disabled={multiForm.niches.length >= MAX_NICHES}
                      placeholder={
                        multiForm.niches.length >= MAX_NICHES
                          ? `Max ${MAX_NICHES} niches reached`
                          : 'e.g. Jewelry Store'
                      }
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

                  {/* Tags row — separate area below the input, only shown when there are tags */}
                  {multiForm.niches.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {multiForm.niches.map((niche, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 bg-accent/10 text-accent text-xs font-medium px-2.5 py-1 rounded-md"
                        >
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
                </div>

                {/* ── Number of Leads (total across all niches) ── */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Number of Leads
                  </label>
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
                  onClick={handleFindLeads} disabled={!canFindLeads}
                  className="w-full bg-accent hover:bg-accent-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors mt-2"
                >
                  {multiForm.niches.length > 1 ? `Find Leads across ${multiForm.niches.length} Niches` : 'Find Leads'}
                </button>

                {multiSearched && (
                  <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-lg px-3.5 py-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 shrink-0 mt-0.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-800">Search queued!</p>
                      <p className="text-xs text-green-700 mt-0.5">
                        Searching {multiForm.niches.length} niche{multiForm.niches.length > 1 ? 's' : ''} in {multiForm.city}, {multiForm.country} — up to {multiForm.totalLeads} leads total. Backend wiring coming in the next step.
                      </p>
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

              {/* Map placeholder */}
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

              {/* Summary rows */}
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
                  <span className="text-sm font-medium text-gray-900">{multiForm.city || '—'}</span>
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

                {/* Total Leads row */}
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-sm text-gray-500">Total Leads</span>
                  <span className="text-sm font-semibold text-accent">{multiForm.totalLeads}</span>
                </div>

                {/* Per-niche breakdown — only when 2+ niches */}
                {multiForm.niches.length > 1 && (() => {
                  const breakdown = getNicheBreakdown(multiForm.totalLeads, multiForm.niches.length);
                  // Show compact breakdown: "34, 33, 33 per niche"
                  const unique = Array.from(new Set(breakdown)).sort((a, b) => b - a);
                  const summaryText = unique.length === 1
                    ? `${unique[0]} per niche`
                    : unique.map((v, i) => {
                        const count = breakdown.filter(x => x === v).length;
                        return `${v}×${count}`;
                      }).join(', ') + ' per niche';
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Project <span className="text-red-500">*</span></label>
                      <select value={smartForm.projectId} onChange={e => setSmartForm(f => ({ ...f, projectId: e.target.value }))} disabled={projectsLoading}
                        className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent appearance-none"
                      >
                        <option value="">Select a project…</option>
                        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Describe what you&apos;re looking for <span className="text-red-500">*</span></label>
                      <textarea value={smartForm.description} onChange={e => setSmartForm(f => ({ ...f, description: e.target.value }))} rows={5}
                        placeholder="e.g. Find restaurants in Germany with outdated websites"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
                      />
                      <p className="mt-1 text-xs text-gray-400">Be as specific as you like — include location, industry, website quality, size, etc.</p>
                    </div>
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
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">How Smart Search works</h3>
                  <p className="text-sm text-gray-400 mb-6">AI-powered lead discovery in three steps.</p>
                  <div className="space-y-5">
                    {[
                      { step: '1', title: 'Understand your request', desc: 'The AI parses your description to extract industry, location, quality signals, and any special filters you mentioned.', color: 'bg-blue-100 text-blue-700' },
                      { step: '2', title: 'Search & scrape', desc: 'It searches business directories, visits each website, and extracts contact info, emails, and quality indicators.', color: 'bg-purple-100 text-purple-700' },
                      { step: '3', title: 'Filter & save', desc: 'Only businesses that genuinely match your criteria are saved to your leads list — no noise, no manual filtering.', color: 'bg-green-100 text-green-700' },
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
                  <div className="mt-8 flex items-center gap-2 p-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 shrink-0">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="text-xs text-gray-500">Smart Search backend is being wired up. The UI is ready — full functionality coming in the next step.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── RUNNING: animated progress steps ── */}
            {smartStage === 'running' && (
              <div className="max-w-xl mx-auto w-full">
                <div className="bg-white rounded-xl border border-gray-200 p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent animate-spin" style={{ animationDuration: '2s' }}>
                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">AI is finding your leads</h2>
                      <p className="text-xs text-gray-400 mt-0.5 italic truncate max-w-xs">&ldquo;{smartForm.description}&rdquo;</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {PROGRESS_STEPS.map((step, idx) => {
                      const isDone   = completedSteps.has(idx);
                      const isActive = currentStep === idx;
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
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${((completedSteps.size + (currentStep >= 0 ? 0.5 : 0)) / PROGRESS_STEPS.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">Step {Math.min(currentStep + 1, PROGRESS_STEPS.length)} of {PROGRESS_STEPS.length}</p>
                </div>
              </div>
            )}

            {/* ── RESULTS: review and save ── */}
            {smartStage === 'results' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Found {resultLeads.length} matching leads</h2>
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
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input type="checkbox" checked={allChecked}
                        ref={el => { if (el) el.indeterminate = !allChecked && !noneChecked; }}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent/30 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700">{allChecked ? 'Deselect All' : 'Select All'}</span>
                    </label>
                    <span className="text-xs text-gray-500">{checkedIds.size} of {resultLeads.length} selected</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {resultLeads.map(lead => {
                      const checked = checkedIds.has(lead.id);
                      return (
                        <div key={lead.id} onClick={() => toggleLead(lead.id)}
                          className={`flex items-start gap-4 px-5 py-4 transition-colors cursor-pointer ${checked ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/60 hover:bg-gray-50'}`}
                        >
                          <div className="pt-0.5 shrink-0">
                            <input type="checkbox" checked={checked} onChange={() => toggleLead(lead.id)} onClick={e => e.stopPropagation()}
                              className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent/30 cursor-pointer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-3 flex-wrap">
                              <span className={`text-sm font-semibold ${checked ? 'text-gray-900' : 'text-gray-400'}`}>{lead.company}</span>
                              <a href={`https://${lead.website}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                className="text-xs text-accent hover:underline truncate">{lead.website}</a>
                              <span className={`text-xs ${checked ? 'text-gray-500' : 'text-gray-400'}`}>{lead.email}</span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0">
                                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                              </svg>
                              <span className="text-[11px] text-gray-400 italic">{lead.reason}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
                    <button onClick={handleStartOver} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
                    <button onClick={handleSaveLeads} disabled={checkedIds.size === 0}
                      className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                      </svg>
                      Save {checkedIds.size} Lead{checkedIds.size !== 1 ? 's' : ''} to Batch
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── SAVED: flash success ── */}
            {smartStage === 'saved' && (
              <div className="max-w-xl mx-auto w-full">
                <div className="bg-white rounded-xl border border-gray-200 p-10 flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Leads saved!</h2>
                  <p className="text-sm text-gray-500">Your selected leads have been added to a new batch. Find them in the Leads page.</p>
                  <p className="text-xs text-gray-400 mt-3">Resetting in a moment…</p>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
