import { useState, useEffect } from 'react';

export default function useDarkMode() {
    // Initialize based on what the script in index.html already did
    const [theme, setThemeState] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        }
        return 'light';
    });

    useEffect(() => {
        const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleSystemChange = (e) => {
            const newSystemTheme = e.matches ? 'dark' : 'light';
            // When system changes, follow it and clear manual preference
            setThemeState(newSystemTheme);
            localStorage.removeItem('theme');
        };

        systemQuery.addEventListener('change', handleSystemChange);
        return () => systemQuery.removeEventListener('change', handleSystemChange);
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;

        // Apply classes
        root.classList.remove('light', 'dark');
        root.classList.add(theme);

        // Sync browser UI (scrollbars, address bar colors)
        root.style.colorScheme = theme;
        root.style.backgroundColor = theme === 'dark' ? '#030712' : '#f5f5f5';
    }, [theme]);

    const toggleTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return [theme, toggleTheme];
}