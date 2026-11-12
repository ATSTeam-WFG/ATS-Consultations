export function SiteFooter() {
  return (
    <footer
      style={{
        background: 'var(--midnight-900)',
        borderTop: '1px solid var(--midnight-line)',
        padding: '1.5rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}
    >
      {/* Logo small */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg width="18" height="18" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <polygon
            points="6,1.5 9.9,3.75 9.9,8.25 6,10.5 2.1,8.25 2.1,3.75"
            stroke="var(--wfg-gold)"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          <circle cx="6" cy="6" r="1.35" fill="var(--wfg-gold)" />
        </svg>
        <span
          style={{
            fontFamily: 'var(--font-manrope)',
            fontWeight: 700,
            fontSize: '0.8125rem',
            color: 'var(--on-midnight-muted)',
          }}
        >
          ATS Consultation Hub
        </span>
      </div>

      {/* Email */}
      <a
        href="mailto:ATSteam@wfgtitle.com"
        style={{
          fontFamily: 'var(--font-manrope)',
          fontSize: '0.8125rem',
          color: 'var(--wfg-gold)',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        ATSteam@wfgtitle.com
      </a>

      {/* Copyright */}
      <span
        style={{
          fontFamily: 'var(--font-manrope)',
          fontSize: '0.75rem',
          color: 'var(--on-midnight-subtle)',
        }}
      >
        © {new Date().getFullYear()} WFG National Title Insurance Company
      </span>
    </footer>
  )
}
