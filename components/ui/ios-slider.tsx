'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface IOSSliderProps {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  label?: string
  showValue?: boolean
  className?: string
}

export function IOSSlider({ 
  value, 
  onValueChange, 
  min = 0, 
  max = 100, 
  step = 1,
  disabled = false,
  label,
  showValue = true,
  className 
}: IOSSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100
  const sliderRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const handleMove = React.useCallback((clientX: number) => {
    if (!sliderRef.current) return
    
    const rect = sliderRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const newPercentage = (x / rect.width) * 100
    const newValue = Math.round((newPercentage / 100) * (max - min) / step) * step + min
    
    onValueChange(Math.max(min, Math.min(max, newValue)))
  }, [min, max, step, onValueChange])

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    e.preventDefault()
    handleMove(e.clientX)
  }, [handleMove])

  const handleTouchMove = React.useCallback((e: TouchEvent) => {
    e.preventDefault()
    handleMove(e.touches[0].clientX)
  }, [handleMove])

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const handleTouchEnd = React.useCallback(() => {
    setIsDragging(false)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }, [handleTouchMove])

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragging(true)
    handleMove(e.clientX)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [disabled, handleMove, handleMouseMove, handleMouseUp])

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragging(true)
    handleMove(e.touches[0].clientX)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
  }, [disabled, handleMove, handleTouchMove, handleTouchEnd])

  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd])

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {value}
            </span>
          )}
        </div>
      )}
      <div
        ref={sliderRef}
        className={cn(
          "relative h-7 flex items-center cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Track */}
        <div className="absolute inset-x-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          {/* Filled track */}
          <div 
            className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-75"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Thumb */}
        <div
          className={cn(
            "absolute w-7 h-7 -ml-3.5 bg-white rounded-full",
            "shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)]",
            "border border-gray-200/50 dark:border-gray-600/50",
            "transition-transform duration-75",
            isDragging && "scale-110",
            !disabled && "hover:scale-105"
          )}
          style={{ left: `${percentage}%` }}
        >
          {/* Inner circle for iOS look */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white to-gray-50" />
        </div>
      </div>
    </div>
  )
}