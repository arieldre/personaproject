import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
    persist(
        (set, get) => ({
            theme: 'light',

            // Initialize theme from system preference or stored value
            initialize: () => {
                const stored = localStorage.getItem('theme-storage');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.state?.theme) {
                        get().applyTheme(parsed.state.theme);
                        return;
                    }
                }

                // Check system preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = prefersDark ? 'dark' : 'light';
                set({ theme });
                get().applyTheme(theme);
            },

            // Apply theme to document
            applyTheme: (theme) => {
                const root = document.documentElement;
                if (theme === 'dark') {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            },

            // Toggle between light and dark
            toggleTheme: () => {
                const newTheme = get().theme === 'light' ? 'dark' : 'light';
                set({ theme: newTheme });
                get().applyTheme(newTheme);
            },

            // Set specific theme
            setTheme: (theme) => {
                set({ theme });
                get().applyTheme(theme);
            },

            // Check if dark mode
            isDark: () => get().theme === 'dark',
        }),
        {
            name: 'theme-storage',
            partialize: (state) => ({ theme: state.theme }),
        }
    )
);

export default useThemeStore;
