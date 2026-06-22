import { PlaybookForm } from '@/components/playbooks/PlaybookForm'

export default function NewPlaybookPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">New Playbook</h1>
      </div>
      <div className="page-body">
        <div className="ats-card" style={{ maxWidth: '760px' }}>
          <PlaybookForm />
        </div>
      </div>
    </>
  )
}
