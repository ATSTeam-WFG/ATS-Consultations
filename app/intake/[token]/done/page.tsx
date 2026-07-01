export default async function IntakeDonePage({
  searchParams,
}: {
  searchParams: Promise<{ agency?: string }>
}) {
  const { agency } = await searchParams
  const agencyName = agency ? decodeURIComponent(agency) : 'your agency'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1117 0%, #1a1f2e 60%, #0f172a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      color: '#f1f5f9',
      textAlign: 'center',
      padding: '2rem',
    }}>
      {/* Logo mark */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '2.5rem',
        padding: '0.5rem 1rem',
        borderRadius: '2rem',
        background: 'rgba(99,102,241,0.12)',
        border: '1px solid rgba(99,102,241,0.25)',
        fontSize: '0.8125rem',
        color: '#a5b4fc',
        fontWeight: 600,
        letterSpacing: '0.05em',
      }}>
        WFG ATS
      </div>

      {/* Check icon */}
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(129,140,248,0.15))',
        border: '1px solid rgba(99,102,241,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 0 40px rgba(99,102,241,0.2)',
      }}>
        ✓
      </div>

      <h1 style={{
        fontSize: 'clamp(1.625rem, 5vw, 2.25rem)',
        fontWeight: 700,
        lineHeight: 1.2,
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        maxWidth: '480px',
      }}>
        Thank you, {agencyName}.
      </h1>

      <p style={{
        fontSize: '1.0625rem',
        color: '#64748b',
        maxWidth: '400px',
        lineHeight: 1.6,
        marginBottom: '1rem',
      }}>
        We&apos;ll see you soon.
      </p>

      <p style={{
        fontSize: '0.875rem',
        color: '#475569',
        maxWidth: '360px',
        lineHeight: 1.6,
      }}>
        Your responses have been received. Your WFG rep will review them before your consultation to make the most of your time together.
      </p>
    </div>
  )
}
