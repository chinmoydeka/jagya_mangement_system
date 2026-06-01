import React from 'react';

export default function JcmsLogo({ size = 40, className = '' }) {
    return (
        <div
            className={`flex items-center gap-3 ${className}`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
            {/* Logo Icon */}
            <div
                style={{
                    width: size,
                    height: size,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
                    flexShrink: 0,
                }}
            >
                {/* Building / J icon */}
                <svg
                    width={size * 0.6}
                    height={size * 0.6}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <path d="M9 3v18" />
                    <path d="M3 9h18" />
                    <path d="M3 15h18" />
                </svg>
            </div>

            {/* Text */}
            <div>
                <div
                    style={{
                        fontSize: size * 0.45,
                        fontWeight: 800,
                        lineHeight: 1.1,
                        background: 'linear-gradient(135deg, #f59e0b, #dc2626)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '-0.02em',
                    }}
                >
                    JCMS
                </div>
                <div
                    style={{
                        fontSize: size * 0.22,
                        color: 'currentColor',
                        opacity: 0.6,
                        fontWeight: 500,
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Jagya Construction
                </div>
            </div>
        </div>
    );
}
