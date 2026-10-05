import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchIcon,
  CloseIcon,
  SpinnerIcon,
  CompanyIcon,
  ResourcesIcon,
  CodingIcon,
  MockTestIcon,
  AptitudeIcon,
  ChevronRightIcon,
} from '../ui/Icons.jsx';
import searchService from '../../services/searchService.js';

export function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input when opened & reset state
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(null);
      setError(null);
      setActiveIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Debounced search query
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      setError(null);
      setActiveIndex(0);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const data = await searchService.globalSearch(trimmed, 4);
        setResults(data);
        setActiveIndex(0);
      } catch (err) {
        console.error('[GlobalSearch] Search failed:', err);
        setError('Unable to complete search. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Flattened list of results for keyboard arrow navigation
  const flatResults = [];
  if (results) {
    if (results.companies?.length) {
      results.companies.forEach((item) =>
        flatResults.push({ ...item, categoryLabel: 'Company' })
      );
    }
    if (results.resources?.length) {
      results.resources.forEach((item) =>
        flatResults.push({ ...item, categoryLabel: 'Study Material' })
      );
    }
    if (results.coding?.length) {
      results.coding.forEach((item) =>
        flatResults.push({ ...item, categoryLabel: 'Coding Problem' })
      );
    }
    if (results.mockTests?.length) {
      results.mockTests.forEach((item) =>
        flatResults.push({ ...item, categoryLabel: 'Mock Test' })
      );
    }
    if (results.aptitude?.length) {
      results.aptitude.forEach((item) =>
        flatResults.push({ ...item, categoryLabel: 'Aptitude Practice' })
      );
    }
  }

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (flatResults.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % flatResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = flatResults[activeIndex];
        if (selected?.link) {
          onClose();
          navigate(selected.link);
        }
      }
    },
    [flatResults, activeIndex, onClose, navigate]
  );

  const handleSelect = (item) => {
    if (item.link) {
      onClose();
      navigate(item.link);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global search dialog"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-start justify-center p-3 sm:p-4 pt-12 sm:pt-20 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <SearchIcon className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies, coding problems, study materials, mock tests..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
            aria-autocomplete="list"
            aria-controls="global-search-results"
          />

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {loading && <SpinnerIcon className="w-4 h-4 text-[#166534] animate-spin" />}
            {query && !loading && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                aria-label="Clear query"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono font-medium text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results / Empty / Initial States */}
        <div id="global-search-results" className="overflow-y-auto p-3 sm:p-4 space-y-4 flex-1">
          {error ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-red-600 font-medium">{error}</p>
              <button
                type="button"
                onClick={() => setQuery((q) => q + ' ')}
                className="text-xs text-[#166534] hover:underline font-semibold"
              >
                Retry
              </button>
            </div>
          ) : !query.trim() ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <SearchIcon className="w-5 h-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                Quick Search RecruitReady
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Search companies (e.g., TCS, Google), coding problems (e.g., Two Sum), mock assessments, or study materials.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                {['TCS', 'Infosys', 'Two Sum', 'Aptitude', 'DBMS', 'Mock Test'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-[#DCFCE7] hover:text-[#166534] text-slate-600 rounded-lg transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results && results.totalResults === 0 && !loading ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                No results found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Check your spelling or search by general keyword like company name, programming language, or topic.
              </p>
            </div>
          ) : results ? (
            <div className="space-y-4">
              {/* Companies */}
              {results.companies?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <CompanyIcon className="w-3.5 h-3.5 text-[#166534]" />
                    <span>Companies ({results.companies.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.companies.map((item) => {
                      const itemIdx = flatResults.findIndex((r) => r.id === item.id);
                      const isSelected = activeIndex === itemIdx;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#F0FDF4] border border-[#BBF7D0]'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 block truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {item.subtitle}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] shrink-0">
                            Company
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Coding Problems */}
              {results.coding?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <CodingIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Coding Practice ({results.coding.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.coding.map((item) => {
                      const itemIdx = flatResults.findIndex((r) => r.id === item.id);
                      const isSelected = activeIndex === itemIdx;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#F0FDF4] border border-[#BBF7D0]'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 block truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {item.subtitle}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                            Problem
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Study Materials */}
              {results.resources?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <ResourcesIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span>Study Materials ({results.resources.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.resources.map((item) => {
                      const itemIdx = flatResults.findIndex((r) => r.id === item.id);
                      const isSelected = activeIndex === itemIdx;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#F0FDF4] border border-[#BBF7D0]'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 block truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {item.subtitle}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 shrink-0">
                            Resource
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mock Tests */}
              {results.mockTests?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <MockTestIcon className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mock Assessments ({results.mockTests.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.mockTests.map((item) => {
                      const itemIdx = flatResults.findIndex((r) => r.id === item.id);
                      const isSelected = activeIndex === itemIdx;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#F0FDF4] border border-[#BBF7D0]'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 block truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {item.subtitle}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 shrink-0">
                            Mock Test
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Aptitude Topics */}
              {results.aptitude?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <AptitudeIcon className="w-3.5 h-3.5 text-[#166534]" />
                    <span>Aptitude Topics ({results.aptitude.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.aptitude.map((item) => {
                      const itemIdx = flatResults.findIndex((r) => r.id === item.id);
                      const isSelected = activeIndex === itemIdx;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#F0FDF4] border border-[#BBF7D0]'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 block truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {item.subtitle}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] shrink-0">
                            Aptitude
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                ↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">
                ↵
              </kbd>
              Open
            </span>
          </div>

          <span className="text-slate-400">RecruitReady Search</span>
        </div>
      </div>
    </div>
  );
}

export default GlobalSearchModal;
