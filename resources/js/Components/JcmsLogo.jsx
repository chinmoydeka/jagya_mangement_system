import React from 'react';

export default function JcmsLogo({ size = 40, className = '', layout = 'horizontal', iconOnly = false }) {
    // Unique ID for SVG gradients to prevent collisions if multiple instances are rendered on the page
    const gradientId = React.useId ? React.useId().replace(/:/g, '') : 'jcms-gold-gradient';
    const isVertical = layout === 'vertical';

    return (
        <div
            className={`flex ${isVertical ? 'flex-col items-center text-center gap-3' : 'items-center gap-3'} ${className}`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
            {/* Logo Icon SVG */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
                style={{
                    filter: 'drop-shadow(0px 2px 6px rgba(0, 0, 0, 0.25)) drop-shadow(0px 4px 12px rgba(245, 185, 66, 0.15))',
                }}
            >
                <defs>
                    <linearGradient id={`gold-grad-${gradientId}`} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FFF2D4" />
                        <stop offset="25%" stopColor="#F5B942" />
                        <stop offset="50%" stopColor="#D49525" />
                        <stop offset="75%" stopColor="#F5B942" />
                        <stop offset="100%" stopColor="#8A5A0B" />
                    </linearGradient>
                </defs>

                {/* Outer frame with bottom cutout */}
                <path
                    d="M 36 90 L 10 90 L 10 10 L 90 10 L 90 90 L 64 90 L 64 82 L 82 82 L 82 18 L 18 18 L 18 82 L 36 82 Z"
                    fill={`url(#gold-grad-${gradientId})`}
                />

                {/* Left Building */}
                <path
                    d="M 36 90 L 36 54 L 44 40 L 44 90 Z"
                    fill={`url(#gold-grad-${gradientId})`}
                />

                {/* Middle Building */}
                <path
                    d="M 50 90 L 50 48 L 46 48 L 46 35 L 50 28 L 50 25 L 54 32 L 54 90 Z"
                    fill={`url(#gold-grad-${gradientId})`}
                />

                {/* Right Building */}
                <path
                    d="M 56 90 L 56 35 L 64 49 L 64 90 Z"
                    fill={`url(#gold-grad-${gradientId})`}
                />
            </svg>

            {/* Logo Text */}
            {!iconOnly && (
                <div className={`flex flex-col ${isVertical ? 'items-center mt-1' : 'justify-center'}`} style={{ userSelect: 'none' }}>
                    <div
                        style={{
                            fontSize: isVertical ? size * 0.45 : size * 0.45,
                            fontWeight: 800,
                            lineHeight: 1.0,
                            background: 'linear-gradient(135deg, #FFF2D4 0%, #F5B942 50%, #C58B24 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            letterSpacing: '0.04em',
                        }}
                    >
                        JAGYA
                    </div>
                    <div
                        style={{
                            fontSize: isVertical ? size * 0.16 : size * 0.16,
                            fontWeight: 700,
                            lineHeight: 1.0,
                            marginTop: isVertical ? '4px' : '2px',
                            background: 'linear-gradient(135deg, #F5B942 0%, #D49525 50%, #8A5A0B 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            letterSpacing: '0.22em',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        CONSTRUCTION
                    </div>
                </div>
            )}
        </div>
    );
}
