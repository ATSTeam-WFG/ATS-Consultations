'use client'

interface PortalNavProps {
  activeTab: 'chat' | 'tools' | 'stepper'
  onTabChange: (tab: 'chat' | 'tools' | 'stepper') => void
}

const LogoMark = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
    <svg width="26" height="26" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <polygon points="24,4 44,40 4,40" fill="none" stroke="#c9a45c" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="24,14 36,36 12,36" fill="#c9a45c" opacity="0.18" />
    </svg>
    <span
      style={{
        fontFamily: 'var(--font-manrope)',
        fontWeight: 800,
        fontSize: '0.9375rem',
        color: '#f4f5fa',
        letterSpacing: '-0.01em',
      }}
    >
      ATS Hub
    </span>
  </div>
)

export function PortalNav({ activeTab, onTabChange }: PortalNavProps) {
  const isStepperActive = activeTab === 'stepper'

  return (
    <nav
      style={{
        background: 'rgba(10,13,20,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: '60px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0 1.5rem',
        flexShrink: 0,
      }}
      role="navigation"
      aria-label="Portal navigation"
    >
      {/* ── Left cluster: logo + (back button in stepper mode) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <LogoMark />

        {isStepperActive && (
          <>
            <div
              aria-hidden="true"
              style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)', margin: '0 0.125rem' }}
            />
            <button
              onClick={() => onTabChange('chat')}
              aria-label="Back to Chat"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3125rem',
                background: 'none',
                border: 'none',
                padding: '0.375rem 0.625rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'var(--font-manrope)',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'var(--on-midnight-muted)',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f4f5fa'
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--on-midnight-muted)'
                e.currentTarget.style.background = 'none'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to Chat
            </button>
          </>
        )}
      </div>

      {/* ── Center: tabs (normal) or breadcrumb title (stepper) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {isStepperActive ? (
          <span
            style={{
              fontFamily: 'var(--font-manrope)',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'rgba(255,255,255,0.22)',
              letterSpacing: '0.01em',
              userSelect: 'none',
            }}
          >
            Request a Consultation
          </span>
        ) : (
          (['chat', 'tools'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`tab-link${activeTab === tab ? ' active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-manrope)',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'color 0.15s, border-color 0.15s',
                textTransform: 'capitalize',
              }}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              {tab === 'chat' ? 'Chat' : 'Tools'}
            </button>
          ))
        )}
      </div>

      {/* ── Right: CTA (normal) or empty spacer (stepper) ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!isStepperActive && (
          <button
            onClick={() => onTabChange('stepper')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0 1.125rem',
              height: '38px',
              background: 'var(--ats-indigo)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'var(--font-manrope)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ats-action-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--ats-indigo)' }}
          >
            Request Consultation →
          </button>
        )}
      </div>
    </nav>
  )
}
