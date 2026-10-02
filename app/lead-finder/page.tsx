'use client';

import { useState, useEffect, useRef } from 'react';
import Topbar from '@/components/dashboard/Topbar';
import { FALLBACK_COUNTRIES, type StaticCountry } from '@/lib/countries';
import { getProjects, type Project } from '@/lib/api';

interface Country {
  name: {
    common: string;
    official: string;
  };
  flags: {
    png: string;
    svg: string;
    alt?: string;
  };
  cca2: string;
}

export default function LeadFinderPage() {
  const [formData, setFormData] = useState({
    country: 'Germany',
    city: 'Frankfurt',
    niche: 'Wellness Center',
    numberOfLeads: 200,
    projectId: '', // Add project selection
  });

  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('Germany');
  const [selectedCountryFlag, setSelectedCountryFlag] = useState('🇩🇪');

  const countryInputRef = useRef<HTMLInputElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Convert static country to API format
  const convertStaticToApiFormat = (staticCountry: StaticCountry): Country => ({
    name: staticCountry.name,
    flags: {
      png: staticCountry.flags.png,
      svg: staticCountry.flags.svg,
    },
    cca2: staticCountry.cca2
  });

  // Use fallback countries - moved outside of fetchCountries to fix hooks rule
  const applyFallbackCountries = () => {
    console.log('Using fallback country data');
    const fallbackCountriesApi = FALLBACK_COUNTRIES.map(convertStaticToApiFormat);
    setCountries(fallbackCountriesApi);
    setUsingFallbackData(true);
  };

  // Fetch countries from REST Countries API with timeout and fallback
  const fetchCountries = async () => {
    if (countries.length > 0) return; // Already fetched
    
    setCountriesLoading(true);
    
    try {
      console.log('Attempting to fetch countries from API...');
      
      // Create fetch with 5-second timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: Country[] = await response.json();
      console.log('Successfully fetched countries from API:', data.length, 'countries');
      
      // Sort countries alphabetically by common name
      const sortedCountries = data.sort((a, b) => 
        a.name.common.localeCompare(b.name.common)
      );
      setCountries(sortedCountries);
      setUsingFallbackData(false);
      
    } catch (error) {
      // Log the actual error for debugging
      console.error('Error fetching countries from API:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Silently fall back to static data
      applyFallbackCountries();
    } finally {
      setCountriesLoading(false);
    }
  };

  // Load countries on component mount
  useEffect(() => {
    fetchCountries();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const fetchedProjects = await getProjects();
      setProjects(fetchedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Keep empty array on error
    } finally {
      setProjectsLoading(false);
    }
  };

  // Filter countries based on search term
  const filteredCountries = countries.filter(country =>
    country.name.common.toLowerCase().includes(countrySearchTerm.toLowerCase())
  ).slice(0, 10); // Limit to 10 results for performance

  // Handle country input focus
  const handleCountryInputFocus = () => {
    setShowCountryDropdown(true);
    fetchCountries(); // Fetch if not already fetched
  };

  // Handle country selection from dropdown
  const handleCountrySelect = (country: Country) => {
    setFormData(prev => ({ ...prev, country: country.name.common }));
    setCountrySearchTerm(country.name.common);
    
    // Use emoji for fallback data, PNG URL for API data
    if (usingFallbackData) {
      const fallbackCountry = FALLBACK_COUNTRIES.find(c => c.cca2 === country.cca2);
      setSelectedCountryFlag(fallbackCountry?.flags.emoji || '🏳️');
    } else {
      setSelectedCountryFlag(country.flags.png);
    }
    
    setShowCountryDropdown(false);
  };

  // Handle country input change
  const handleCountryInputChange = (value: string) => {
    setCountrySearchTerm(value);
    setFormData(prev => ({ ...prev, country: value }));
    setShowCountryDropdown(true);
    
    // Find matching country for flag
    const matchingCountry = countries.find(country => 
      country.name.common.toLowerCase() === value.toLowerCase()
    );
    
    if (matchingCountry) {
      if (usingFallbackData) {
        const fallbackCountry = FALLBACK_COUNTRIES.find(c => c.cca2 === matchingCountry.cca2);
        setSelectedCountryFlag(fallbackCountry?.flags.emoji || '🏳️');
      } else {
        setSelectedCountryFlag(matchingCountry.flags.png);
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        countryDropdownRef.current && 
        !countryDropdownRef.current.contains(event.target as Node) &&
        !countryInputRef.current?.contains(event.target as Node)
      ) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    // Update form data if needed
    setFormData(prev => ({ ...prev, projectId: projectId === 'all' ? '' : projectId }));
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFindLeads = () => {
    // Placeholder for future API call
    console.log('Finding leads with:', formData);
    alert('Lead finding functionality will be implemented in the next phase!');
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gray-50">
      {/* Top bar */}
      <Topbar
        selectedProject={selectedProject}
        onProjectChange={handleProjectChange}
      />

      {/* Page content */}
      <div className="flex-1 px-7 py-6 space-y-6 max-w-[1400px] w-full mx-auto">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find New Leads</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Search businesses in your target location and niche.
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Form card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-5">
              {/* Country field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                    {selectedCountryFlag.startsWith('http') && !usingFallbackData ? (
                      <img 
                        src={selectedCountryFlag} 
                        alt="Flag" 
                        className="w-4 h-3 object-cover rounded-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-sm">{selectedCountryFlag}</span>
                    )}
                  </div>
                  <input
                    ref={countryInputRef}
                    type="text"
                    value={countrySearchTerm}
                    onChange={(e) => handleCountryInputChange(e.target.value)}
                    onFocus={handleCountryInputFocus}
                    placeholder="Search countries..."
                    className="w-full pl-12 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  />
                  
                  {countriesLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}

                  {/* Dropdown */}
                  {showCountryDropdown && (
                    <div 
                      ref={countryDropdownRef}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20"
                    >
                      {countriesLoading ? (
                        <div className="p-3 text-sm text-gray-500 flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading countries...
                        </div>
                      ) : filteredCountries.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">
                          No countries found matching &quot;{countrySearchTerm}&quot;
                        </div>
                      ) : (
                        <>
                          {usingFallbackData && (
                            <div className="p-2 text-xs text-blue-600 bg-blue-50 border-b border-blue-100">
                              Using offline country data
                            </div>
                          )}
                          {filteredCountries.map((country) => {
                            const fallbackCountry = usingFallbackData ? 
                              FALLBACK_COUNTRIES.find(c => c.cca2 === country.cca2) : null;
                            
                            return (
                              <button
                                key={country.cca2}
                                type="button"
                                onClick={() => handleCountrySelect(country)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                              >
                                {usingFallbackData && fallbackCountry ? (
                                  <span className="text-sm shrink-0">{fallbackCountry.flags.emoji}</span>
                                ) : (
                                  <img 
                                    src={country.flags.png} 
                                    alt={`Flag of ${country.name.common}`}
                                    className="w-5 h-4 object-cover rounded-sm shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                                <span className="text-gray-900">{country.name.common}</span>
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* City field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Frankfurt"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>

              {/* Niche / Industry field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niche / Industry
                </label>
                <input
                  type="text"
                  value={formData.niche}
                  onChange={(e) => handleInputChange('niche', e.target.value)}
                  placeholder="Wellness Center"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>

              {/* Number of Leads field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Leads
                </label>
                <input
                  type="number"
                  value={formData.numberOfLeads}
                  onChange={(e) => handleInputChange('numberOfLeads', parseInt(e.target.value) || 0)}
                  placeholder="200"
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>

              {/* Project field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project (Optional)
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => handleInputChange('projectId', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all appearance-none"
                  disabled={projectsLoading}
                >
                  <option value="">No Project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Find Leads button */}
              <button
                onClick={handleFindLeads}
                className="w-full bg-accent hover:bg-accent-hover text-white font-medium py-3 px-4 rounded-lg transition-colors duration-150 mt-6"
              >
                Find {formData.numberOfLeads} Leads
              </button>

              {/* What happens next info box */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      What happens next?
                    </h4>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      We&apos;ll find businesses using TomTom, scrape their websites for emails, 
                      and save everything to your leads list. This may take a few minutes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Search Preview card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Preview</h3>
            
            {/* Map placeholder */}
            <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center mb-6 relative overflow-hidden">
              {/* Simple map-like background pattern */}
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" viewBox="0 0 400 300" className="w-full h-full">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#cbd5e0" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
              {/* Map pin */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white shadow-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-600 mt-1 font-medium">Frankfurt</span>
              </div>
            </div>

            {/* Summary list */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Country</span>
                <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  {selectedCountryFlag.startsWith('http') && !usingFallbackData ? (
                    <img 
                      src={selectedCountryFlag} 
                      alt="Flag" 
                      className="w-4 h-3 object-cover rounded-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{selectedCountryFlag}</span>
                  )}
                  {formData.country}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">City</span>
                <span className="text-sm font-medium text-gray-900">{formData.city}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Niche</span>
                <span className="text-sm font-medium text-gray-900">{formData.niche}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Leads</span>
                <span className="text-sm font-medium text-gray-900">{formData.numberOfLeads}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
