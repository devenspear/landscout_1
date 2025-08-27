'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface IOSSwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  className?: string
}

export function IOSSwitch({ 
  checked, 
  onCheckedChange, 
  disabled = false,
  label,
  className 
}: IOSSwitchProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {label && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">
          {label}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full",
          "transition-colors duration-200 ease-in-out",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-6 w-6 transform rounded-full",
            "bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
            "shadow-[0_2px_4px_rgba(0,0,0,0.2)]",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  )
}