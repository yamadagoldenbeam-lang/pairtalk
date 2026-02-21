import { cn } from "../_lib/utils"

interface MascotProps {
  className?: string
}

export function MascotIcon({ className }: MascotProps) {
  return (
    <div className={cn("relative animate-float", className)}>
      <img 
        src="/talklens/20260125_oshiosare.png" 
        alt="チルピ マスコット" 
        className="w-full h-full object-contain"
      />
    </div>
  )
}

export function MascotThinking({ className }: MascotProps) {
  return (
    <div className={cn("relative animate-wiggle", className)}>
      <div className="absolute inset-0 blur-lg bg-yellow-300/40 rounded-full scale-110" />
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative drop-shadow-lg">
        <circle cx="32" cy="32" r="24" fill="#FFD93D" />
        <circle cx="24" cy="28" r="4" fill="#334155" />
        <circle cx="40" cy="28" r="4" fill="#334155" />
        <path d="M24 40 Q32 44 40 40" stroke="#334155" strokeWidth="2" fill="none" />
        <ellipse cx="18" cy="34" rx="3" ry="2" fill="#FFB6C1" opacity="0.6" />
        <ellipse cx="46" cy="34" rx="3" ry="2" fill="#FFB6C1" opacity="0.6" />
      </svg>
    </div>
  )
}

export function MascotIdea({ className }: MascotProps) {
  return (
    <div className={cn("relative animate-float", className)} style={{ animationDelay: "0.5s" }}>
      <div className="absolute inset-0 blur-lg bg-yellow-300/40 rounded-full scale-110" />
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative drop-shadow-lg">
        <circle cx="32" cy="32" r="24" fill="#FFD93D" />
        <circle cx="24" cy="28" r="5" fill="white" />
        <circle cx="40" cy="28" r="5" fill="white" />
        <circle cx="24" cy="28" r="3" fill="#334155" />
        <circle cx="40" cy="28" r="3" fill="#334155" />
        <path d="M26 40 Q32 46 38 40" stroke="#334155" strokeWidth="2" fill="none" />
        {/* Animated idea sparkle */}
        <circle cx="50" cy="12" r="4" fill="#0ea5e9" className="animate-pulse" />
      </svg>
    </div>
  )
}
