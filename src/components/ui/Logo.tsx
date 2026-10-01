import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'dark' | 'light';
  subtitle?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  variant = 'dark',
  subtitle,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 34, text: 'text-lg', sub: 'text-[10px]' },
    md: { icon: 42, text: 'text-xl', sub: 'text-xs' },
    lg: { icon: 50, text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 60, text: 'text-3xl', sub: 'text-sm' },
  };

  const { icon, text, sub } = sizeMap[size];
  const isLight = variant === 'light';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* High-Visibility Vector Emblem */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 group-hover:scale-105 drop-shadow-sm"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cb-badge-grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>
          <linearGradient id="cb-arch-glow" x1="8" y1="14" x2="36" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>

        {/* Premium Rounded Shield/Chassis */}
        <rect x="2" y="2" width="40" height="40" rx="11" fill="url(#cb-badge-grad)" />
        <rect x="2" y="2" width="40" height="40" rx="11" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />

        {/* Left & Right Bridge Foundation Pillars */}
        <rect x="9.5" y="19" width="4.5" height="13" rx="1.5" fill="#BFDBFE" />
        <rect x="30" y="19" width="4.5" height="13" rx="1.5" fill="#BFDBFE" />

        {/* Bold Roadway Deck Span */}
        <rect x="8" y="25" width="28" height="3" rx="1.5" fill="#FFFFFF" />

        {/* Bold Sweeping Bridge Arch */}
        <path
          d="M10 25C13 14 31 14 34 25"
          stroke="url(#cb-arch-glow)"
          strokeWidth="3.4"
          strokeLinecap="round"
        />

        {/* Center Vertical Support */}
        <line x1="22" y1="16.5" x2="22" y2="25" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.95" />

        {/* Keystone Beacon of Trust & Ethical Resolution */}
        <circle cx="22" cy="11.5" r="2.5" fill="#38BDF8" />
        <circle cx="22" cy="11.5" r="1.2" fill="#FFFFFF" />
      </svg>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center tracking-tight">
            <span
              className={`font-black tracking-tight ${text} ${
                isLight ? 'text-white' : 'text-slate-900'
              }`}
            >
              Case
            </span>
            <span
              className={`font-bold tracking-tight ${text} ${
                isLight ? 'text-blue-400' : 'text-blue-600'
              }`}
            >
              Bridge
            </span>
          </div>

          {subtitle && (
            <span
              className={`font-medium tracking-wide uppercase font-mono ${sub} ${
                isLight ? 'text-slate-400' : 'text-slate-500'
              } mt-1`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
