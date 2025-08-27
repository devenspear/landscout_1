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
      <div className="ml-3 grid place-items-center">
        <div
          className={cn(
            "w-7 h-7 rounded-full grid place-items-center transition-all duration-200",
            isSelected
              ? "bg-blue-100 dark:bg-blue-900/30"
              : "bg-gray-100/80 dark:bg-gray-700/50"
          )}
        >
          <div
            className={cn(
              "rounded-full box-border grid place-items-center ring-2",
              isSelected ? "bg-blue-500 ring-blue-500" : "bg-transparent ring-gray-300 dark:ring-gray-600"
            )}
            style={{ width: '18px', height: '18px' }}
          >
            <div
              className={cn(
                "rounded-full transition-transform duration-200",
                isSelected ? "bg-white" : "bg-transparent"
              )}
              style={{ width: '8px', height: '8px' }}
            />
          </div>
        </div>
      </div>
    </button>
  )
}