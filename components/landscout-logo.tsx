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
          viewBox="0 0 100 60"
          className="h-full w-full"
          fill="none"
        >
          {/* Golden sun arc - matches the image */}
          <path
            d="M10 25 Q50 10 90 25 Q50 15 10 25 Z"
            fill="#D4AF37"
            className="opacity-90"
          />
          
          {/* Back rolling hill - darker green */}
          <path
            d="M0 35 Q25 25 50 32 Q75 25 100 35 L100 60 L0 60 Z"
            fill="#2F5233"
            className="dark:fill-green-800"
          />
          
          {/* Front rolling hill - brighter green */}
          <path
            d="M0 40 Q20 30 40 37 Q60 30 80 38 Q90 35 100 40 L100 60 L0 60 Z"
            fill="#4A7C59"
            className="dark:fill-green-600"
          />
          
          {/* White/cream separator curve - matches the image */}
          <path
            d="M15 32 Q35 28 55 32 Q75 28 85 32"
            stroke="#F5F5DC"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
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