import { useState, useEffect } from 'react';

export default function useDarkMode() {
    const [theme, setThemeState] = useState(null);

    // 1. Initial Load Logic
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const systemTheme = systemQuery.matches ? 'dark' : 'light';

        setThemeState(savedTheme || systemTheme);

        // 2. Listen for System changes
        const handleSystemChange = (e) => {
            const newSystemTheme = e.matches ? 'dark' : 'light';
            // When system changes, we follow it and clear manual override
            setThemeState(newSystemTheme);
            localStorage.removeItem('theme');
        };

        systemQuery.addEventListener('change', handleSystemChange);
        return () => systemQuery.removeEventListener('change', handleSystemChange);
    }, []);

    // 3. Apply Theme to DOM & Storage
    useEffect(() => {
        if (!theme) return;

        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        root.style.colorScheme = theme;
    }, [theme]);

    // Custom setter to handle the "Manual" part of the override
    const toggleTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return [theme, toggleTheme];
}