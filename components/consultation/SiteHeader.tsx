export function SiteHeader() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--midnight-900)',
        borderBottom: '1px solid var(--midnight-line)',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
      }}
    >
      {/* Logo lockup */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <svg width="30" height="30" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <polygon
            points="6,1.5 9.9,3.75 9.9,8.25 6,10.5 2.1,8.25 2.1,3.75"
            stroke="var(--wfg-gold)"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <polygon
            points="6,3 8.6,4.5 8.6,7.5 6,9 3.4,7.5 3.4,4.5"
            stroke="var(--wfg-gold)"
            strokeWidth="0.5"
            strokeLinejoin="round"
            opacity="0.45"
          />
          <circle cx="6" cy="6" r="1.35" fill="var(--wfg-gold)" />
        </svg>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-manrope)',
              fontWeight: 800,
              fontSize: '0.9375rem',
              color: 'var(--on-midnight-primary)',
              lineHeight: 1.2,
            }}
          >
            ATS Consultation Hub
          </div>
          <div
            style={{
              fontFamily: 'var(--font-manrope)',
              fontWeight: 600,
              fontSize: '0.5625rem',
              color: 'var(--wfg-gold)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            WFG Agency Technology Services
          </div>
        </div>
      </div>

      {/* Tagline */}
      <span
        style={{
          fontSize: '0.8125rem',
          color: 'var(--on-midnight-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span style={{ color: 'var(--wfg-gold)' }}>✦</span>
        Your white-glove ATS partner
      </span>
    </header>
  )
}
