import { useState, useRef, useEffect } from 'react';
import useDarkMode from '../../hooks/useDarkMode';
import { Sun, Moon, RefreshCw, Github } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../firebase';
import { useTemplatesContext } from '../../context/TemplatesContext';

const Header = ({ onLogout, onCreate }) => {
    const { user, state } = useTemplatesContext();
    const status = state.status;

    const [theme, setTheme] = useDarkMode();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const dropdownRef = useRef(null);

    const [headerHeight, setHeaderHeight] = useState(0);
    const headerRef = useRef(null);

    useEffect(() => {
        const updateHeight = () => {
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.offsetHeight);
            }
        };

        // Initial measurement
        updateHeight();

        // Observe resizes
        const observer = new ResizeObserver(updateHeight);
        if (headerRef.current) {
            observer.observe(headerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const controlNavbar = () => {
            if (typeof window !== 'undefined') {
                if (window.scrollY > lastScrollY && window.scrollY > 100) {
                    setIsVisible(false);
                } else {
                    setIsVisible(true);
                }
                setLastScrollY(window.scrollY);
            }
        };
        window.addEventListener('scroll', controlNavbar);
        return () => window.removeEventListener('scroll', controlNavbar);
    }, [lastScrollY]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'U';

    const handleSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            const functions = getFunctions(app, 'us-central1');
            const syncSystemPrompts = httpsCallable(functions, 'syncSystemPrompts');
            await syncSystemPrompts();
            alert('System prompts synced successfully!');
        } catch (error) {
            console.error('Sync failed:', error);
            alert(`Sync failed: ${error.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <>
            <div style={{ height: headerHeight }} />
            <header
                ref={headerRef}
                className={`fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'
                    }`}
            >
                <div className="bg-blue-50 border-b border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 text-blue-700 dark:text-blue-200 text-center py-2 px-4 text-sm font-medium">
                    Now only Googlers can have access to this website and this firebase project uses Google's billing account
                </div>
                <div className="max-w-[1600px] mx-auto px-4 py-3 md:px-6 md:py-4 flex justify-between items-center bg-transparent">
                    <div className="flex items-center gap-2 md:gap-3">
                        <a href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity">
                            <img src="/favicon.svg" alt="Logo" className="w-8 h-8 md:w-10 md:h-10" />
                            <div className="flex flex-col">
                                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-firebase-yellow via-firebase-orange to-firebase-red bg-clip-text text-transparent">
                                    Prompt Gallery
                                </h1>
                                <span className={`text-[10px] md:text-xs font-medium mt-0.5 md:mt-1 ${status === 'Ready' ? 'text-green-600' : 'text-gray-500'}`}>
                                    {status}
                                </span>
                            </div>
                        </a>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <a
                            href="https://github.com/induction-axiom/prompt-gallery"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:block p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg cursor-pointer"
                            aria-label="GitHub Repository"
                        >
                            <Github size={20} />
                        </a>

                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-1.5 md:p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors rounded-lg cursor-pointer"
                            aria-label="Toggle Dark Mode"
                        >
                            {theme === 'dark' ? <Sun size={20} className="w-5 h-5 md:w-6 md:h-6" /> : <Moon size={20} className="w-5 h-5 md:w-6 md:h-6" />}
                        </button>

                        <button
                            onClick={onCreate}
                            className="px-3 py-2 md:px-5 md:py-2.5 bg-transparent border border-firebase-orange text-gray-900 dark:text-white hover:bg-firebase-orange hover:text-gray-900 dark:hover:text-gray-900 text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                            <span className="text-lg leading-none">+</span> <span className="hidden md:inline">Upload Prompt</span>
                        </button>

                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-white dark:bg-gray-800 overflow-hidden cursor-pointer"
                            >
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <div className="w-full h-full bg-firebase-yellow/20 flex items-center justify-center text-firebase-orange font-bold text-lg rounded-full">
                                        {getInitials(user?.displayName || user?.email)}
                                    </div>
                                )}
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50">
                                    <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                            {user?.displayName || "User"}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                            {user?.email}
                                        </p>
                                    </div>
                                    <div className="py-1">
                                        {user?.email === 'jongluo@google.com' && (
                                            <>
                                                <button
                                                    onClick={() => { setIsDropdownOpen(false); handleSync(); }}
                                                    disabled={isSyncing}
                                                    className="w-full text-left px-5 py-2.5 text-sm text-firebase-orange hover:bg-firebase-orange/5 dark:text-firebase-orange dark:hover:bg-firebase-orange/10 font-medium flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                                                >
                                                    {isSyncing ? 'Syncing...' : 'Sync System Prompts'}
                                                    <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        setIsDropdownOpen(false);
                                                        if (!window.confirm("Rebuild global tag list?")) return;
                                                        try {
                                                            const functions = getFunctions(app, 'us-central1');
                                                            const rebuildFn = httpsCallable(functions, 'manualRebuildTags');
                                                            await rebuildFn();
                                                            alert('Tag list rebuilt successfully!');
                                                        } catch (error) {
                                                            console.error(error);
                                                            alert('Rebuild failed: ' + error.message);
                                                        }
                                                    }}
                                                    className="w-full text-left px-5 py-2.5 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/10 font-medium flex items-center gap-2 cursor-pointer"
                                                >
                                                    Rebuild Tag List
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => { setIsDropdownOpen(false); onLogout(); }}
                                            className="w-full text-left px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 font-medium cursor-pointer"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;