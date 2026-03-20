'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export function ThemeToggleDebug() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleThemeChange = (newTheme: string) => {
    console.log('Theme changing to:', newTheme);
    setTheme(newTheme);
    setIsOpen(false);
  };

  React.useEffect(() => {
    console.log('Current theme:', theme);
  }, [theme]);

  return (
    <div className="relative">
      <button
        onClick={() => {
          console.log('Button clicked, isOpen:', isOpen);
          setIsOpen(!isOpen);
        }}
        className="relative z-50 inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
        aria-label="Toggle theme"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-40 rounded-md border border-gray-200 bg-white shadow-lg z-[100] dark:bg-neutral-950 dark:border-neutral-800">
          <div className="py-1">
            <button
              onClick={() => handleThemeChange('light')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              ☀️ Light
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              🌙 Dark
            </button>
            <button
              onClick={() => handleThemeChange('system')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              💻 System
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
