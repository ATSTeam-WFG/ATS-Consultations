import '@/styles/ats-consultation.css'

export default function RequestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <div
        className="consultation-page"
        style={{ minHeight: '100vh', background: '#0a0d14', display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </div>
    </>
  )
}
