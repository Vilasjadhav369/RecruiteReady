import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
} from '../ui/Icons.jsx';
import searchService from '../../services/searchService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useRecentlyViewed } from '../../lib/recentlyViewed.js';

export function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef(null);
  const previousFocusRef = useRef(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { isDark, setTheme } = useTheme();
  const recent = useRecentlyViewed();

  // Static commands. Every `link` is a real route in AppRoutes.jsx.
  const allCommands = [
    { id: 'cmd-dashboard', title: 'Dashboard', subtitle: 'Go to your overview', link: '/dashboard' },
    { id: 'cmd-aptitude', title: 'Aptitude Practice', subtitle: 'Start or resume practice', link: '/aptitude' },
    ...(isCodingEnabled() ? [{ id: 'cmd-coding', title: 'Coding Practice', subtitle: 'Browse coding problems', link: '/coding' }] : []),
    { id: 'cmd-mock', title: 'Mock Tests', subtitle: 'Timed assessments', link: '/mock-tests' },
    { id: 'cmd-companies', title: 'Companies', subtitle: 'Company preparation tracks', link: '/companies' },
    { id: 'cmd-resources', title: 'Study Materials', subtitle: 'Notes, PDFs and links', link: '/resources' },
    { id: 'cmd-progress', title: 'Progress & Analytics', subtitle: 'Your performance trends', link: '/progress' },
    { id: 'cmd-saved', title: 'Saved Items', subtitle: 'Your bookmarks', link: '/saved' },
    { id: 'cmd-leaderboard', title: 'Leaderboard', subtitle: 'Student rankings', link: '/leaderboard' },
    { id: 'cmd-notifications', title: 'Notifications', subtitle: 'Updates and reminders', link: '/notifications' },
    { id: 'cmd-profile', title: 'Profile', subtitle: 'Edit your details and goals', link: '/profile' },
    { id: 'cmd-settings', title: 'Account & Security', subtitle: 'Password and sessions', link: '/settings' },
    ...(isAdmin ? [{ id: 'cmd-admin', title: 'Admin Console', subtitle: 'Platform administration', link: '/admin' }] : []),
    { id: 'cmd-theme', title: isDark ? 'Switch to light theme' : 'Switch to dark theme', subtitle: 'Toggle appearance', action: () => setTheme(isDark ? 'light' : 'dark') },
  ];
  const q = query.trim().toLowerCase();
  const commands = q
    ? allCommands.filter((c) => `${c.title} ${c.subtitle}`.toLowerCase().includes(q))
    : allCommands;
  const recentItems = !q
    ? recent.slice(0, 5).map((r) => ({ id: `recent-${r.type}-${r.id}`, title: r.title, subtitle: `Recently viewed · ${r.type.replace('-', ' ')}`, link: r.link }))
    : [];

  // Focus input when opened, reset state & restore focus on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      setQuery('');
      setResults(null);
      setError(null);
      setActiveIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    } else if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  // Debounced server search
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchService.search(searchQuery.trim());
      setResults(data);
      setActiveIndex(0);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search is temporarily unavailable. You can still navigate via commands below.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 200);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Calculate flat list of items for keyboard navigation
  const flatResults = React.useMemo(() => {
    if (!results) {
      return [...commands, ...recentItems];
    }
    const list = [];
    if (results.companies?.length) list.push(...results.companies.map((c) => ({ ...c, kind: 'company', link: `/companies/${c.id}` })));
    if (isCodingEnabled() && results.coding?.length) list.push(...results.coding.map((c) => ({ ...c, kind: 'coding', link: `/coding/${c.id}` })));
    if (results.resources?.length) list.push(...results.resources.map((r) => ({ ...r, kind: 'resource', link: `/resources/${r.id}` })));
    if (results.mockTests?.length) list.push(...results.mockTests.map((m) => ({ ...m, kind: 'mockTest', link: `/mock-tests/${m.id}` })));
    if (results.aptitude?.length) list.push(...results.aptitude.map((a) => ({ ...a, kind: 'aptitude', link: `/aptitude?topic=${encodeURIComponent(a.title)}` })));
    if (commands.length) list.push(...commands);
    return list;
  }, [results, commands, recentItems]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(1, flatResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flatResults.length) % Math.max(1, flatResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = flatResults[activeIndex];
      if (selected) {
        handleSelect(selected);
      }
    }
  };

  const handleSelect = (item) => {
    if (item.action) {
      onClose();
      item.action();
    } else if (item.link) {
      onClose();
      navigate(item.link);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette and search"
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-4 pt-16 sm:pt-24 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-border bg-card">
          <SearchIcon className="w-5 h-5 text-ink-2 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search, or jump to a page…"
            className="w-full bg-transparent text-sm sm:text-base text-ink placeholder:text-ink-2 focus:outline-none"
            aria-autocomplete="list"
            aria-controls="global-search-results"
          />

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {loading && <SpinnerIcon className="w-4 h-4 text-ink animate-spin" />}
            {query && !loading && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-ink-2 hover:text-ink rounded-md cursor-pointer"
                aria-label="Clear query"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono font-medium text-ink-2 bg-primary-soft border border-border rounded">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results / Empty / Initial States */}
        <div id="global-search-results" className="overflow-y-auto p-3 sm:p-4 space-y-4 flex-1">
          {/* Quick tips shown only when query is empty and no recent items exist */}
          {!query.trim() && recentItems.length === 0 && (
            <div className="py-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary-soft text-ink-2 mx-auto flex items-center justify-center">
                <SearchIcon className="w-5 h-5" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-ink">
                Quick Search RecruitReady
              </h4>
              <p className="text-xs text-ink-2 max-w-sm mx-auto leading-relaxed">
                {isCodingEnabled() ? 'Search companies (e.g., TCS, Google), coding problems (e.g., Two Sum), mock assessments, or study materials.' : 'Search companies (e.g., TCS, Google), aptitude topics, mock assessments, or study materials.'}
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                {['TCS', 'Infosys', 'Two Sum', 'Aptitude', 'DBMS', 'Mock Test'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 text-xs bg-primary-soft hover:bg-primary-tint hover:text-ink text-ink-2 border border-border rounded-lg transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(commands.length > 0 || recentItems.length > 0) && (
            <div className="space-y-3">
              {[
                ['Pages & actions', commands],
                ['Recently viewed', recentItems],
              ].map(([label, items]) =>
                items.length === 0 ? null : (
                  <div key={label}>
                    <div className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-2">{label}</div>
                    <div className="space-y-0.5" role="listbox" aria-label={label}>
                      {items.map((item) => {
                        const itemIdx = flatResults.findIndex((r) => r.id === item.id);
                        const isSelected = activeIndex === itemIdx;
                        return (
                          <button
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            onMouseMove={() => setActiveIndex(itemIdx)}
                            className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors border ${
                              isSelected
                                ? 'bg-primary-tint text-ink border-border font-medium'
                                : 'border-transparent text-ink-2'
                            }`}
                          >
                            <span className="min-w-0">
                              <span className="text-xs sm:text-sm font-semibold text-ink block truncate">{item.title}</span>
                              <span className="text-[11px] text-ink-2 block truncate">{item.subtitle}</span>
                            </span>
                            {isSelected && <span className="text-[10px] font-mono text-ink-2 shrink-0">↵</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
          {error ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-danger font-medium">{error}</p>
              <button
                type="button"
                onClick={() => setQuery((q) => q + ' ')}
                className="text-xs text-ink hover:underline font-semibold"
              >
                Retry
              </button>
            </div>
          ) : results && results.totalResults === 0 && !loading && commands.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-semibold text-ink">
                No results found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-ink-2 max-w-sm mx-auto">
                Check your spelling or search by general keyword like company name, programming language, or topic.
              </p>
            </div>
          ) : results ? (
            <div className="space-y-4">
              {/* Companies */}
              {results.companies?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-2">
                    <CompanyIcon className="w-3.5 h-3.5 text-ink" />
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
                          onMouseMove={() => setActiveIndex(itemIdx)}
                          className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-primary-tint border-border text-ink'
                              : 'border-transparent text-ink-2'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-semibold text-ink block truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-ink-2 block truncate">
                              {item.subtitle}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-primary-soft text-ink border border-border shrink-0">
                            Company
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Coding Problems */}
              {isCodingEnabled() && results.coding?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-2">
                    <CodingIcon className="w-3.5 h-3.5 text-ink" />
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
                          onMouseMove={() => setActiveIndex(itemIdx)}
                          className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-primary-tint border-border text-ink'
                              : 'border-transparent text-ink-2'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-semibold text-ink block truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-ink-2 block truncate">
                              {item.subtitle}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-primary-soft text-ink border border-border shrink-0">
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
                  <div className="flex items-center gap-2 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-2">
                    <ResourcesIcon className="w-3.5 h-3.5 text-ink" />
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
                          onMouseMove={() => setActiveIndex(itemIdx)}
                          className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-primary-tint border-border text-ink'
                              : 'border-transparent text-ink-2'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-semibold text-ink block truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-ink-2 block truncate">
                              {item.subtitle}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-primary-soft text-ink border border-border shrink-0">
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
                  <div className="flex items-center gap-2 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-2">
                    <MockTestIcon className="w-3.5 h-3.5 text-ink" />
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
                          onMouseMove={() => setActiveIndex(itemIdx)}
                          className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-primary-tint border-border text-ink'
                              : 'border-transparent text-ink-2'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-semibold text-ink block truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-ink-2 block truncate">
                              {item.subtitle}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-primary-soft text-ink border border-border shrink-0">
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
                  <div className="flex items-center gap-2 px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-2">
                    <AptitudeIcon className="w-3.5 h-3.5 text-ink" />
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
                          onMouseMove={() => setActiveIndex(itemIdx)}
                          className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                            isSelected
                              ? 'bg-primary-tint border-border text-ink'
                              : 'border-transparent text-ink-2'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-semibold text-ink block truncate">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-ink-2 block truncate">
                              {item.subtitle}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-primary-soft text-ink border border-border shrink-0">
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

        {/* Footer shortcuts (Neutral styling, no orange/red) */}
        <div className="px-4 py-2.5 bg-primary-soft border-t border-border flex items-center justify-between text-[11px] text-ink-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-card text-ink-2 border border-border rounded font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1 py-0.5 bg-card text-ink-2 border border-border rounded font-mono text-[10px]">
                ↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-card text-ink-2 border border-border rounded font-mono text-[10px]">
                ↵
              </kbd>
              Open
            </span>
          </div>

          <span className="text-ink-2">RecruitReady Search</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default GlobalSearchModal;
