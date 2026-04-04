import { useState, useMemo, useCallback, useEffect } from 'react';
import { Database, Plus, Trash2, Copy, Check, Settings, LogOut, Sun, Moon, PanelLeftClose, PanelLeft } from 'lucide-react';
import type { Bucket } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { UI_DELAYS } from '../constants';

interface SidebarProps {
    buckets: Bucket[];
    selectedBucket: string | null;
    searchQuery: string;
    loading: boolean;
    sidebarOpen: boolean;
    collapsed: boolean;
    onToggleCollapse: () => void;
    activeConnectionName?: string;
    theme: 'dark' | 'light';
    onToggleTheme: () => void;
    onSearchChange: (value: string) => void;
    onBucketSelect: (name: string) => void;
    onNewBucket: () => void;
    onDeleteBucket: (name: string) => void;
    onCloseSidebar: () => void;
    onNavigateHome: () => void;
    onOpenConnections?: () => void;
    onLogout?: () => void;
}

export function Sidebar({
    buckets,
    selectedBucket,
    searchQuery,
    loading,
    sidebarOpen,
    collapsed,
    onToggleCollapse,
    activeConnectionName,
    theme,
    onToggleTheme,
    onSearchChange,
    onBucketSelect,
    onNewBucket,
    onDeleteBucket,
    onCloseSidebar,
    onNavigateHome,
    onOpenConnections,
    onLogout,
}: SidebarProps) {
    const [copiedBucket, setCopiedBucket] = useState<string | null>(null);
    const [localSearch, setLocalSearch] = useState(searchQuery);

    const debouncedSearch = useDebounce(localSearch, UI_DELAYS.SEARCH_DEBOUNCE);

    useEffect(() => {
        if (debouncedSearch !== searchQuery) onSearchChange(debouncedSearch);
    }, [debouncedSearch, searchQuery, onSearchChange]);

    useEffect(() => {
        if (searchQuery !== localSearch && searchQuery !== debouncedSearch) setLocalSearch(searchQuery);
    }, [searchQuery]);

    const filteredBuckets = useMemo(() =>
        buckets.filter(b => !debouncedSearch.trim() || b.name.toLowerCase().includes(debouncedSearch.toLowerCase())),
        [buckets, debouncedSearch]
    );

    const handleCopyBucketName = useCallback(async (e: React.MouseEvent, bucketName: string) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(bucketName);
            setCopiedBucket(bucketName);
            setTimeout(() => setCopiedBucket(null), 2000);
        } catch {
            try {
                const textArea = document.createElement('textarea');
                textArea.value = bucketName;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                setCopiedBucket(bucketName);
                setTimeout(() => setCopiedBucket(null), 2000);
            } catch { /* ignore */ }
        }
    }, []);

    // On mobile, always show the full expanded sidebar (collapsed is desktop-only)
    // The mobile sidebar uses sidebarOpen for the slide-in overlay

    return (
        <>
            {/* Mobile overlay backdrop */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onCloseSidebar} />
            )}

            {/* ── Collapsed icon strip (desktop only) ── */}
            <aside
                className={`hidden md:flex flex-col items-center border-r border-border bg-background-secondary flex-shrink-0 py-2 gap-1 transition-[width,opacity] duration-200 ease-in-out overflow-hidden ${
                    collapsed ? 'w-[52px] opacity-100' : 'w-0 opacity-0 border-r-0'
                }`}
                style={{ minWidth: collapsed ? 52 : 0 }}
                role="navigation"
                aria-label="Sidebar navigation (collapsed)"
                aria-hidden={!collapsed}
            >
                {/* Expand */}
                <button
                    onClick={onToggleCollapse}
                    className="w-9 h-9 flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors flex-shrink-0"
                    aria-label="Expand sidebar"
                    title="Expand sidebar"
                >
                    <PanelLeft className="w-[18px] h-[18px]" />
                </button>

                {/* Logo */}
                <button
                    onClick={onNavigateHome}
                    className="w-9 h-9 flex items-center justify-center transition-colors my-1 flex-shrink-0"
                    aria-label="Home"
                    title="S3 Explorer"
                >
                    <img src="/logo.svg" alt="S3 Explorer" className="w-6 h-6 logo-themed" />
                </button>

                {/* New bucket */}
                <button
                    onClick={onNewBucket}
                    className="w-9 h-9 flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors flex-shrink-0"
                    aria-label="Create bucket"
                    title="Create bucket"
                >
                    <Plus className="w-4 h-4" />
                </button>

                <div className="w-6 h-px bg-border my-1 flex-shrink-0" />

                {/* Bucket icons */}
                <div className="flex-1 flex flex-col items-center gap-0.5 overflow-y-auto min-h-0 bucket-scrollable w-full px-1.5">
                    {buckets.map(bucket => (
                        <button
                            key={bucket.name}
                            onClick={() => onBucketSelect(bucket.name)}
                            className={`w-9 h-9 flex items-center justify-center rounded transition-colors flex-shrink-0 ${
                                selectedBucket === bucket.name
                                    ? 'text-accent-pink bg-accent-pink/10'
                                    : 'text-foreground-muted hover:text-foreground'
                            }`}
                            aria-label={`Bucket: ${bucket.name}`}
                            title={bucket.name}
                        >
                            <Database className="w-4 h-4" />
                        </button>
                    ))}
                </div>

                {/* Bottom actions */}
                <div className="w-6 h-px bg-border my-1 flex-shrink-0" />

                <button
                    onClick={onToggleTheme}
                    className="w-9 h-9 flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors flex-shrink-0"
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                    title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {onOpenConnections && (
                    <button
                        onClick={onOpenConnections}
                        className="w-9 h-9 flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors flex-shrink-0"
                        aria-label="Connections"
                        title={activeConnectionName || 'Connections'}
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                )}

                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="w-9 h-9 flex items-center justify-center text-foreground-muted hover:text-accent-red transition-colors flex-shrink-0"
                        aria-label="Logout"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                )}
            </aside>

            {/* ── Expanded sidebar ── */}
            <aside
                className={`flex flex-col border-r border-border bg-background-secondary flex-shrink-0 fixed md:relative inset-y-0 left-0 z-50 transition-all duration-200 ease-in-out ${
                    // Mobile: slide in/out via sidebarOpen
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                } ${
                    // Desktop: collapse to 0 width when collapsed
                    collapsed ? 'md:w-0 md:opacity-0 md:border-r-0 md:overflow-hidden' : 'w-[276px] sm:w-[252px]'
                }`}
                style={collapsed ? { minWidth: 0 } : undefined}
                role="navigation"
                aria-label="Sidebar navigation"
                aria-hidden={collapsed}
            >
                {/* Header */}
                <div className="h-14 flex items-center justify-between pl-4 pr-2 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-2.5 cursor-pointer group transition-all duration-300 hover:opacity-80" onClick={onNavigateHome} role="button" tabIndex={collapsed ? -1 : 0} onKeyDown={(e) => e.key === 'Enter' && onNavigateHome()}>
                        <img
                            src="/logo.svg"
                            alt="S3 Explorer logo"
                            className="w-7 h-7 2xl:w-8 2xl:h-8 logo-spin logo-themed"
                        />
                        <span className="font-semibold text-base transition-all duration-300 group-hover:text-foreground group-hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.15)]">
                            S3 Explorer
                        </span>
                    </div>
                    <div className="flex items-center">
                        <button
                            onClick={onToggleTheme}
                            className="p-2 text-foreground-muted hover:text-foreground transition-colors"
                            tabIndex={collapsed ? -1 : 0}
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
                        </button>
                        <button
                            onClick={onToggleCollapse}
                            className="p-2 text-foreground-muted hover:text-foreground transition-colors hidden md:flex items-center justify-center"
                            aria-label="Collapse sidebar"
                        >
                            <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="px-3 pt-3 pb-1 flex-shrink-0">
                    <label htmlFor="bucket-search" className="sr-only">Search buckets</label>
                    <input
                        id="bucket-search"
                        type="search"
                        name="bucket-search"
                        placeholder="Search buckets…"
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                        className="input h-10 text-base sm:text-sm sm:h-10 !rounded-md"
                        tabIndex={collapsed ? -1 : 0}
                        aria-label="Search buckets"
                        autoComplete="off"
                        spellCheck="false"
                        enterKeyHint="search"
                    />
                </div>

                {/* Buckets section header */}
                <div className="flex items-center justify-between pl-5 pr-2 py-2 flex-shrink-0">
                    <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider" id="buckets-heading">Buckets</span>
                    <button onClick={onNewBucket} className="create-bucket-btn p-2 text-foreground-secondary hover:text-foreground transition-all" tabIndex={collapsed ? -1 : 0} aria-label="Create new bucket">
                        <Plus className="w-4 h-4" aria-hidden="true" />
                    </button>
                </div>

                {/* Buckets list */}
                <div className="flex-1 overflow-y-auto px-3 min-h-0 bucket-scrollable" role="list" aria-labelledby="buckets-heading">
                    <div className="space-y-0 sm:space-y-1">
                        {filteredBuckets.map((bucket, i) => (
                            <div
                                key={bucket.name}
                                className={`sidebar-item group stagger-item h-10 !rounded-md ${selectedBucket === bucket.name ? 'active' : ''}`}
                                style={{ animationDelay: `${i * 30}ms` }}
                                onClick={() => onBucketSelect(bucket.name)}
                                onKeyDown={(e) => e.key === 'Enter' && onBucketSelect(bucket.name)}
                                role="listitem"
                                tabIndex={collapsed ? -1 : 0}
                                aria-selected={selectedBucket === bucket.name}
                                aria-label={`Bucket: ${bucket.name}`}
                            >
                                <Database className="sidebar-icon w-4 h-4 flex-shrink-0" aria-hidden="true" />
                                <span className="flex-1 truncate text-base sm:text-sm">{bucket.name}</span>
                                <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={e => handleCopyBucketName(e, bucket.name)}
                                        className="flex items-center justify-center w-8 h-8 rounded-md text-foreground-secondary hover:text-accent-purple hover:bg-transparent active:bg-transparent active:scale-95 transition-all focus-visible:ring-0 focus-visible:outline-none"
                                        tabIndex={collapsed ? -1 : 0}
                                        aria-label={`Copy bucket name: ${bucket.name}`}
                                    >
                                        {copiedBucket === bucket.name ? (
                                            <Check className="w-3.5 h-3.5 text-accent-green" aria-hidden="true" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                        )}
                                    </button>
                                    <button
                                        onClick={e => { e.stopPropagation(); onDeleteBucket(bucket.name); }}
                                        className="flex items-center justify-center w-8 h-8 rounded-md text-foreground-secondary hover:text-accent-red hover:bg-transparent active:bg-transparent active:scale-95 transition-all focus-visible:ring-0 focus-visible:outline-none"
                                        tabIndex={collapsed ? -1 : 0}
                                        aria-label={`Delete bucket: ${bucket.name}`}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredBuckets.length === 0 && !loading && (
                        <div className="py-8 text-center" role="status">
                            <p className="text-sm text-foreground-muted">{debouncedSearch ? 'No matches' : 'No buckets'}</p>
                        </div>
                    )}
                </div>

                {/* Bottom section */}
                <div className="flex-shrink-0 border-t border-border p-3 pb-safe space-y-1">
                    {onOpenConnections && (
                        <button onClick={onOpenConnections} className="sidebar-item w-full justify-start" tabIndex={collapsed ? -1 : 0} aria-label={activeConnectionName ? `Connection settings - Connected to: ${activeConnectionName}` : 'Connection settings'}>
                            <Settings className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                            <span className="flex-1 truncate text-base sm:text-sm text-left">{activeConnectionName ? `${activeConnectionName}` : 'Connections'}</span>
                        </button>
                    )}
                    {onLogout && (
                        <button onClick={onLogout} className="sidebar-item w-full justify-start hover:text-accent-red" tabIndex={collapsed ? -1 : 0} aria-label="Logout">
                            <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                            <span className="text-base sm:text-sm">Logout</span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}
