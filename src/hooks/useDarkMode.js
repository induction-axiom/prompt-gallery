import { useState, useEffect } from 'react';

export default function useDarkMode() {
    // State to store the user's explicit preference ('light', 'dark', or null for system)
    const [preference, setPreference] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme'); // logic: returns 'light', 'dark', or null
        }
        return null;
    });

    // State to store the current system preference
    const [systemTheme, setSystemTheme] = useState(() => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    });

    // Listen for system theme changes
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Determine the actual active theme
    // If preference is set, use it. Otherwise, use systemTheme.
    const activeTheme = preference || systemTheme;

    // Apply the theme to the HTML element
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(activeTheme);
    }, [activeTheme]);

    // Update localStorage when preference changes
    useEffect(() => {
        if (preference) {
            localStorage.setItem('theme', preference);
        } else {
            localStorage.removeItem('theme');
        }
    }, [preference]);

    // Toggle function: explicitly sets the opposite of the current active theme
    const toggleTheme = () => {
        const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
        setPreference(newTheme);
    };

    // Return current active theme and the toggle function
    // (Note: The Header expects [theme, setTheme], so we adapt to that interface
    // but the setter is now our smart toggle or direct setter)
    return [activeTheme, toggleTheme];
}
