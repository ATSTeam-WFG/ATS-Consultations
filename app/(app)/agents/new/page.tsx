import { AgentForm } from '@/components/agents/AgentForm'

export default function NewAgentPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">New Title Agent</h1>
      </div>
      <div className="page-body">
        <div className="ats-card" style={{ maxWidth: '680px' }}>
          <AgentForm />
        </div>
      </div>
    </>
  )
}
