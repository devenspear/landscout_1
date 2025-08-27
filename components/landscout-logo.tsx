import Image from 'next/image'

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
    sm: 'h-6',
    md: 'h-8', 
    lg: 'h-12'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo PNG */}
      <div className={`${sizeClasses[size]} relative`}>
        <Image
          src="/LandScout_logo2.png"
          alt="LandScout Logo"
          width={200}
          height={100}
          className={`${sizeClasses[size]} w-auto object-contain`}
          priority
        />
      </div>

      {/* Text - only show if showText is true and we want additional branding */}
      {showText && size !== 'sm' && (
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
            Land Intelligence
          </span>
        </div>
      )}
    </div>
  )
}