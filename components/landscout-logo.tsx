interface LandScoutLogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function LandScoutLogo({ 
  className = "", 
  showText = true, 
  size = 'md' 
}: LandScoutLogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          fill="none"
        >
          {/* Sun/Moon background */}
          <circle
            cx="50"
            cy="35"
            r="25"
            className="fill-amber-400 dark:fill-amber-300"
          />
          
          {/* Rolling hills */}
          <path
            d="M10 60 C30 45, 40 55, 50 50 C60 45, 70 55, 90 45 L90 90 L10 90 Z"
            className="fill-green-600 dark:fill-green-500"
          />
          
          {/* Front hill */}
          <path
            d="M15 70 C35 55, 45 65, 55 60 C65 55, 75 65, 85 60 L85 90 L15 90 Z"
            className="fill-green-700 dark:fill-green-600"
          />
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-gray-900 dark:text-white ${textSizeClasses[size]} leading-tight`}>
            LandScout
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
              Land Intelligence
            </span>
          )}
        </div>
      )}
    </div>
  )
}