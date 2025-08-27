'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface IOSRadioGroupProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

interface IOSRadioItemProps {
  value: string
  children: React.ReactNode
  disabled?: boolean
}

const IOSRadioContext = React.createContext<{
  value: string
  onChange: (value: string) => void
}>({
  value: '',
  onChange: () => {}
})

export function IOSRadioGroup({ value, onValueChange, children, className }: IOSRadioGroupProps) {
  return (
    <IOSRadioContext.Provider value={{ value, onChange: onValueChange }}>
      <div className={cn("space-y-2", className)}>
        {children}
      </div>
    </IOSRadioContext.Provider>
  )
}

export function IOSRadioItem({ value, children, disabled = false }: IOSRadioItemProps) {
  const { value: selectedValue, onChange } = React.useContext(IOSRadioContext)
  const isSelected = selectedValue === value

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      disabled={disabled}
      onClick={() => !disabled && onChange(value)}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3.5 rounded-xl",
        "bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl",
        "border border-gray-200/50 dark:border-gray-700/50",
        "transition-all duration-200",
        isSelected && "bg-blue-50 dark:bg-blue-900/20 border-blue-500/50",
        !disabled && "hover:bg-gray-50 dark:hover:bg-gray-800/80",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className={cn(
        "text-left font-medium",
        isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-gray-100"
      )}>
        {children}
      </span>
      <div className="ml-3">
        <div className={cn(
          "w-5 h-5 rounded-full border-2 relative",
          "transition-all duration-200",
          isSelected 
            ? "border-blue-500 bg-blue-500" 
            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        )}>
          {isSelected && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-2 h-2 rounded-full bg-white animate-scale-in" />
            </div>
          )}
        </div>
      </div>
    </button>
  )
}