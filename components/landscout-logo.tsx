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
    md: 'h-10', 
    lg: 'h-16'
  }

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo PNG - Full width of navigation */}
      <div className="w-full flex justify-center">
        <Image
          src="/LandScout_logo2.png"
          alt="LandScout Logo"
          width={200}
          height={100}
          className={`${sizeClasses[size]} w-auto object-contain max-w-full`}
          priority
        />
      </div>
    </div>
  )
}