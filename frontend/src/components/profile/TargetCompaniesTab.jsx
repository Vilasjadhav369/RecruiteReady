import React, { useState, useEffect, useRef, useMemo, useId, useCallback } from "react";
import { getCompanies } from "../../services/companyService.js";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from "../ui/index.js";
import {
  SearchIcon,
  CloseIcon,
  CheckIcon,
  PlusIcon,
  AlertCircleIcon,
  CompanyIcon,
} from "../ui/Icons.jsx";

const FALLBACK_POPULAR_COMPANIES = [
  "Tata Consultancy Services",
  "Infosys",
  "Amazon",
  "Wipro",
  "Cognizant",
  "Accenture",
];

/**
 * Normalize company name for comparison:
 * Trims leading/trailing whitespace and compresses consecutive spaces.
 */
function normalizeCompanyName(name) {
  if (!name || typeof name !== "string") return "";
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * TargetCompaniesTab — Searchable, accessible target company picker.
 * Follows RecruitReady Design System: Apple + Linear + Premium University.
 * 
 * Features:
 * - Real catalog search debounced 300ms against existing GET /api/companies
 * - Combobox / Listbox ARIA accessibility with keyboard navigation (Up/Down/Enter/Escape)
 * - Case-insensitive & whitespace-normalized duplicate prevention
 * - Preservation of legacy custom companies
 * - Polished chips with accessible removal controls
 * - Polite live-region announcements for screen readers
 */
export default function TargetCompaniesTab({
  targetCompanies = [],
  onAddCompany,
  onRemoveCompany,
  disabled = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [catalogSuggestions, setCatalogSuggestions] = useState(FALLBACK_POPULAR_COMPANIES);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const inputRef = useRef(null);
  const listboxRef = useRef(null);
  const containerRef = useRef(null);
  const activeSearchRequestRef = useRef(0);

  const inputId = useId();
  const listboxId = `${inputId}-listbox`;

  // Fetch initial popular catalog companies on mount
  useEffect(() => {
    let isMounted = true;
    getCompanies({ limit: 12 })
      .then((data) => {
        if (isMounted && data?.companies && data.companies.length > 0) {
          const names = data.companies.map((c) => c.name);
          setCatalogSuggestions(names);
        }
      })
      .catch(() => {
        // Fallback default suggestions are preserved
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Debounced search when user types query
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsLoading(false);
      setSearchError("");
      setActiveIndex(-1);
      return;
    }

    setIsLoading(true);
    setSearchError("");
    const requestId = ++activeSearchRequestRef.current;

    const timer = setTimeout(async () => {
      try {
        const data = await getCompanies({ search: trimmed, limit: 8 });
        // Discard stale response if a newer query was fired
        if (activeSearchRequestRef.current === requestId) {
          const companies = data?.companies || [];
          setSearchResults(companies);
          setIsLoading(false);
          setActiveIndex(-1);
        }
      } catch {
        if (activeSearchRequestRef.current === requestId) {
          setSearchError("Unable to search company catalog. You can still add this name manually.");
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Click outside listener to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Set of normalized selected target company names
  const normalizedSelectedSet = useMemo(() => {
    return new Set(targetCompanies.map((c) => normalizeCompanyName(c)));
  }, [targetCompanies]);

  const isCompanySelected = useCallback(
    (name) => normalizedSelectedSet.has(normalizeCompanyName(name)),
    [normalizedSelectedSet]
  );

  // Suggestions excluding already selected companies
  const availableQuickSuggestions = useMemo(() => {
    return catalogSuggestions.filter((name) => !isCompanySelected(name)).slice(0, 8);
  }, [catalogSuggestions, isCompanySelected]);

  // Handle adding a company name
  const handleSelect = (nameToAdd) => {
    if (disabled) return;
    const cleanName = typeof nameToAdd === "string" ? nameToAdd.trim().replace(/\s+/g, " ") : "";
    if (!cleanName) return;

    if (isCompanySelected(cleanName)) {
      setLiveAnnouncement(`${cleanName} is already in your target companies.`);
      return;
    }

    onAddCompany(cleanName);
    setLiveAnnouncement(`Added ${cleanName} to target companies.`);
    setSearchQuery("");
    setSearchResults([]);
    setIsDropdownOpen(false);
    setActiveIndex(-1);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle removing a company name
  const handleRemove = (nameToRemove) => {
    if (disabled) return;
    onRemoveCompany(nameToRemove);
    setLiveAnnouncement(`Removed ${nameToRemove} from target companies.`);
  };

  // Keyboard navigation for Combobox
  const handleKeyDown = (e) => {
    if (disabled) return;

    const trimmed = searchQuery.trim();
    // Total options: search results + 1 custom add option (if query doesn't match any exactly)
    const canAddCustom = trimmed.length > 0 && !searchResults.some((r) => normalizeCompanyName(r.name) === normalizeCompanyName(trimmed));
    const totalOptions = searchResults.length + (canAddCustom ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isDropdownOpen) {
        setIsDropdownOpen(true);
      }
      if (totalOptions > 0) {
        setActiveIndex((prev) => (prev + 1) % totalOptions);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (totalOptions > 0) {
        setActiveIndex((prev) => (prev <= 0 ? totalOptions - 1 : prev - 1));
      }
    } else if (e.key === "Enter") {
      // Prevent profile form submission on combobox selection
      e.preventDefault();
      if (isDropdownOpen && activeIndex >= 0) {
        if (activeIndex < searchResults.length) {
          const selected = searchResults[activeIndex];
          handleSelect(selected.name);
        } else if (canAddCustom) {
          handleSelect(trimmed);
        }
      } else if (trimmed) {
        // If there's an exact search result, select it; otherwise add as custom
        const exactMatch = searchResults.find(
          (r) => normalizeCompanyName(r.name) === normalizeCompanyName(trimmed)
        );
        if (exactMatch) {
          handleSelect(exactMatch.name);
        } else {
          handleSelect(trimmed);
        }
      }
    } else if (e.key === "Escape") {
      if (isDropdownOpen) {
        e.preventDefault();
        setIsDropdownOpen(false);
        setActiveIndex(-1);
      }
    }
  };

  return (
    <Card className="border-slate-200/90 shadow-xs">
      {/* Screen Reader Live Region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>

      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Target Companies</CardTitle>
              <Badge variant="primary">
                {targetCompanies.length} {targetCompanies.length === 1 ? "Target" : "Targets"}
              </Badge>
            </div>
            <CardDescription>
              Organizations whose recruitment tracks, syllabus, and assessments you are targeting.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ================= 1. SELECTED TARGETS CHIPS ================= */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 tracking-tight mb-2">
            Selected Target Companies
          </label>

          <div
            className="flex flex-wrap gap-2 min-h-[46px] p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 items-center"
            role="region"
            aria-label="Selected target companies list"
          >
            {targetCompanies.map((company) => (
              <span
                key={company}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs hover:border-slate-300 transition-colors group"
              >
                <span className="w-4 h-4 rounded bg-primary-tint text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                  {company.charAt(0).toUpperCase()}
                </span>
                <span className="font-semibold text-slate-800">{company}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(company)}
                  disabled={disabled}
                  className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer p-0.5 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
                  aria-label={`Remove ${company} from target companies`}
                  title={`Remove ${company}`}
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}

            {targetCompanies.length === 0 && (
              <span className="text-xs text-slate-400 italic py-1 px-1">
                No target companies selected yet. Search the catalog or pick from popular organizations below.
              </span>
            )}
          </div>
        </div>

        {/* ================= 2. SEARCHABLE COMBOBOX ================= */}
        <div ref={containerRef} className="relative max-w-lg">
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 tracking-tight mb-1.5"
          >
            Search Company Catalog
          </label>

          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
              <SearchIcon className="w-4 h-4" />
            </div>

            <input
              ref={inputRef}
              id={inputId}
              type="text"
              role="combobox"
              aria-expanded={isDropdownOpen}
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={
                activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setIsDropdownOpen(true);
                }
              }}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="Search companies (e.g. Amazon, Google, TCS)..."
              className="w-full h-10 pl-9 pr-9 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs disabled:bg-slate-50 disabled:cursor-not-allowed"
            />

            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}

            {searchQuery && !isLoading && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setIsDropdownOpen(false);
                  setActiveIndex(-1);
                  if (inputRef.current) inputRef.current.focus();
                }}
                disabled={disabled}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                aria-label="Clear search input"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Combobox Dropdown Results */}
          {isDropdownOpen && searchQuery.trim() && (
            <div
              id={listboxId}
              ref={listboxRef}
              role="listbox"
              className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100"
            >
              {searchResults.map((company, index) => {
                const isSelected = isCompanySelected(company.name);
                const isFocused = activeIndex === index;

                return (
                  <div
                    key={company._id || company.name}
                    id={`${inputId}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (!isSelected) {
                        handleSelect(company.name);
                      }
                    }}
                    className={`p-3 text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-colors ${
                      isFocused ? "bg-primary-soft/50" : "hover:bg-slate-50"
                    } ${isSelected ? "opacity-75 bg-slate-50/50 cursor-default" : ""}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-700 font-bold text-xs">
                        {company.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">
                          {company.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                          <span>{company.industry || "Technology"}</span>
                          {company.roles && company.roles.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{company.roles.slice(0, 2).join(", ")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckIcon className="w-3 h-3 text-emerald-600" />
                          Selected
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-primary group-hover:text-primary-dark flex items-center gap-1">
                          <PlusIcon className="w-3 h-3" />
                          Add
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* No results from catalog */}
              {!isLoading && searchResults.length === 0 && !searchError && (
                <div className="p-4 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    No verified catalog entries matching &ldquo;<span className="font-semibold text-slate-700">{searchQuery}</span>&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSelect(searchQuery)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors cursor-pointer shadow-2xs"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Add &ldquo;{searchQuery.trim()}&rdquo; as Custom Target
                  </button>
                </div>
              )}

              {/* Custom Organization Option when not matched exactly */}
              {!isLoading &&
                searchResults.length > 0 &&
                !searchResults.some(
                  (r) => normalizeCompanyName(r.name) === normalizeCompanyName(searchQuery)
                ) &&
                !isCompanySelected(searchQuery) && (
                  <div
                    id={`${inputId}-option-${searchResults.length}`}
                    role="option"
                    aria-selected="false"
                    onClick={() => handleSelect(searchQuery)}
                    className={`p-3 text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100 ${
                      activeIndex === searchResults.length ? "bg-primary-soft/60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CompanyIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-slate-700">
                        Add &ldquo;<span className="font-semibold text-slate-900">{searchQuery.trim()}</span>&rdquo; as custom organization
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                      <PlusIcon className="w-3 h-3" />
                      Add
                    </span>
                  </div>
                )}

              {searchError && (
                <div className="p-3 text-xs text-rose-600 bg-rose-50 flex items-center gap-2">
                  <AlertCircleIcon className="w-4 h-4 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= 3. QUICK CATALOG SUGGESTIONS ================= */}
        {availableQuickSuggestions.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Popular Catalog Companies:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {availableQuickSuggestions.map((suggested) => (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => handleSelect(suggested)}
                  disabled={disabled}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-primary-tint hover:text-primary-dark hover:border-primary-border border border-slate-200/80 text-xs font-medium text-slate-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Add ${suggested} to targets`}
                >
                  <PlusIcon className="w-3 h-3" />
                  <span>{suggested}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
