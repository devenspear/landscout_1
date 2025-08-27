'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-9 w-16 items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
      aria-label="Toggle theme"
    >
      <div
        className={`absolute flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-out dark:bg-gray-900 ${
          theme === 'dark' ? 'translate-x-3.5' : '-translate-x-3.5'
        }`}
      >
        {theme === 'light' ? (
          <Sun className="h-4 w-4 text-yellow-500" />
        ) : (
          <Moon className="h-4 w-4 text-blue-400" />
        )}
      </div>
    </button>
  )
}