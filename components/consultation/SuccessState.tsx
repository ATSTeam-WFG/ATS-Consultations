'use client'

interface SuccessStateProps {
  agencyName: string
  repName: string
}

const PROGRESS_STEPS = [
  { label: 'Submitted', desc: 'Request received' },
  { label: 'ATS Review', desc: 'Team reviewing details' },
  { label: 'Scheduling', desc: 'Confirm your time slot' },
  { label: 'Completed', desc: 'Your consultation' },
]

export function SuccessState({ agencyName, repName }: SuccessStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        maxWidth: '560px',
        margin: '0 auto',
      }}
    >
      {/* Animated check */}
      <div
        style={{
          animation: 'scale-in 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both',
          marginBottom: '1.75rem',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(99,102,241,0.1)',
            border: '2px solid var(--ats-indigo)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="18" cy="18" r="17" stroke="var(--ats-indigo)" strokeWidth="1.5" opacity="0.3" />
            <path
              d="M10 18.5 L15.5 24 L26 13"
              stroke="var(--ats-indigo)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="60"
              strokeDashoffset="0"
              style={{ animation: 'check-draw 0.5s 0.3s ease both' }}
            />
          </svg>
        </div>
      </div>

      {/* Headline + body */}
      <div style={{ animation: 'fade-up 0.4s 0.2s both' }}>
        <h2
          style={{
            fontFamily: 'var(--font-manrope)',
            fontSize: '1.625rem',
            fontWeight: 800,
            color: '#111827',
            margin: '0 0 0.625rem',
          }}
        >
          Request Submitted!
        </h2>
        <p
          style={{
            fontSize: '0.9375rem',
            color: '#6b7280',
            lineHeight: 1.7,
            margin: '0 0 2rem',
          }}
        >
          Thank you{repName ? `, ${repName}` : ''} — our team will be in touch with{' '}
          <strong style={{ color: '#111827' }}>{agencyName}</strong> within 1 business day.
        </p>

        {/* Progress steps */}
        <div
          style={{
            background: '#f6f7fb',
            border: '1px solid #e4e8f0',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#9ca3af',
              marginBottom: '1rem',
              fontFamily: 'var(--font-manrope)',
            }}
          >
            What happens next
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0' }}>
            {PROGRESS_STEPS.map((step, i) => (
              <div
                key={step.label}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
              >
                {/* Connector line */}
                {i < PROGRESS_STEPS.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '50%',
                      width: '100%',
                      height: '2px',
                      background: i === 0 ? 'var(--ats-indigo)' : '#e5e7eb',
                    }}
                  />
                )}
                {/* Dot */}
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: i === 0 ? 'var(--ats-indigo)' : '#e5e7eb',
                    border: `2px solid ${i === 0 ? 'var(--ats-indigo)' : '#e5e7eb'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 1,
                    flexShrink: 0,
                  }}
                >
                  {i === 0 && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <path d="M2 5L4.5 7.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                {/* Label */}
                <div
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.6875rem',
                    fontWeight: i === 0 ? 700 : 500,
                    color: i === 0 ? 'var(--ats-indigo)' : '#9ca3af',
                    textAlign: 'center',
                    fontFamily: 'var(--font-manrope)',
                  }}
                >
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            background: 'rgba(201,164,92,0.08)',
            border: '1px solid rgba(201,164,92,0.3)',
            borderRadius: '999px',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Questions?</span>
          <a
            href="mailto:ATSteam@wfgtitle.com"
            style={{
              fontSize: '0.8125rem',
              color: 'var(--wfg-gold)',
              fontWeight: 700,
              textDecoration: 'none',
              fontFamily: 'var(--font-manrope)',
            }}
          >
            ATSteam@wfgtitle.com
          </a>
        </div>
      </div>
    </div>
  )
}
