export function PageHero() {
  return (
    <section
      style={{
        background: 'var(--midnight-800)',
        borderBottom: '1px solid var(--midnight-line)',
        padding: '2.5rem 2rem',
        textAlign: 'center',
      }}
    >
      {/* Eyebrow */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.875rem',
        }}
      >
        <span
          style={{
            width: '20px',
            height: '1px',
            background: 'var(--wfg-gold)',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-manrope)',
            fontWeight: 700,
            fontSize: '0.75rem',
            color: 'var(--wfg-gold)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          White-Glove Consultation Request
        </span>
        <span
          style={{
            width: '20px',
            height: '1px',
            background: 'var(--wfg-gold)',
            display: 'inline-block',
          }}
        />
      </div>

      {/* Headline */}
      <h1
        style={{
          fontFamily: 'var(--font-manrope)',
          fontWeight: 800,
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          color: 'var(--on-midnight-primary)',
          margin: '0 0 0.625rem',
          lineHeight: 1.2,
        }}
      >
        Book your{' '}
        <em
          style={{
            fontStyle: 'normal',
            color: 'var(--ats-indigo)',
          }}
        >
          ATS consultation
        </em>
      </h1>

      {/* Subline */}
      <p
        style={{
          fontFamily: 'var(--font-manrope)',
          fontSize: '0.9375rem',
          color: 'var(--on-midnight-muted)',
          maxWidth: '480px',
          margin: '0 auto',
          lineHeight: 1.65,
        }}
      >
        Tell us about your agency in four quick steps — our team will reach out within 1 business day to confirm scheduling.
      </p>
    </section>
  )
}
