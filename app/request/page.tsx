'use client'

import { useState } from 'react'
import { EmailGate } from '@/components/consultation/EmailGate'
import { PortalNav } from '@/components/consultation/PortalNav'
import { DiscoveryBot } from '@/components/consultation/DiscoveryBot'
import { ToolsShowcase } from '@/components/consultation/ToolsShowcase'
import { SimpleRequestForm } from '@/components/consultation/SimpleRequestForm'

export default function RequestPage() {
  const [email, setEmail] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem('wfg_email')
  })
  const [activeTab, setActiveTab] = useState<'chat' | 'tools' | 'stepper'>('chat')

  if (!email) {
    return <EmailGate onVerify={setEmail} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0d14', overflow: 'hidden' }}>
      <PortalNav activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'chat' && <DiscoveryBot email={email} />}
      {activeTab === 'tools' && <ToolsShowcase />}
      {activeTab === 'stepper' && <SimpleRequestForm email={email} />}
    </div>
  )
}
