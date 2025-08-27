'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface IOSSegmentedControlProps {
  value: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  className?: string
}

export function IOSSegmentedControl({ 
  value, 
  onValueChange, 
  options,
  className 
}: IOSSegmentedControlProps) {
  const [activeIndex, setActiveIndex] = React.useState(
    options.findIndex(opt => opt.value === value)
  )

  React.useEffect(() => {
    setActiveIndex(options.findIndex(opt => opt.value === value))
  }, [value, options])

  return (
    <div className={cn(
      "inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl",
      className
    )}>
      <div className="relative flex">
        {/* Sliding background */}
        <div
          className={cn(
            "absolute top-0 h-full bg-white dark:bg-gray-700 rounded-lg",
            "shadow-sm transition-all duration-200 ease-out"
          )}
          style={{
            width: `${100 / options.length}%`,
            left: `${(activeIndex * 100) / options.length}%`
          }}
        />
        
        {/* Options */}
        {options.map((option, index) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setActiveIndex(index)
              onValueChange(option.value)
            }}
            className={cn(
              "relative z-10 px-4 py-2 text-sm font-medium rounded-lg",
              "transition-colors duration-200",
              value === option.value
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}