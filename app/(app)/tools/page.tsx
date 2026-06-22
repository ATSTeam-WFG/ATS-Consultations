'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, ExternalLink } from 'lucide-react'
import type { ToolRecommendation } from '@/lib/types'

export default function ToolsPage() {
  const [tools, setTools] = useState<ToolRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tools')
      .then((r) => r.json())
      .then((j) => setTools(j.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Tools Database</h1>
        <Link
          href="/tools/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.5rem 1rem',
            background: 'var(--ats-blue)',
            color: '#fff',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <Plus size={16} />
          Add tool
        </Link>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        ) : tools.length === 0 ? (
          <div className="ats-card">
            <div className="empty-state">
              <p style={{ fontWeight: 600 }}>No tools added yet</p>
              <p style={{ fontSize: '0.875rem' }}>Add tools to your database for Claude to reference when making recommendations.</p>
              <Link
                href="/tools/new"
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'var(--ats-blue)',
                  color: '#fff',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Add first tool
              </Link>
            </div>
          </div>
        ) : (
          <div className="ats-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="ats-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>ATS Size Fit</th>
                  <th>Description</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr key={tool.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{tool.name}</div>
                    </td>
                    <td style={{ color: 'var(--muted-foreground)' }}>{tool.category ?? '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {tool.ats_size_fit?.map((size) => (
                          <span key={size} className="badge badge-processed" style={{ fontSize: '0.6875rem' }}>
                            {size}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', maxWidth: '280px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tool.description ?? '—'}
                      </div>
                    </td>
                    <td>
                      {tool.website_url && (
                        <a
                          href={tool.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--ats-blue)', textDecoration: 'none' }}
                        >
                          <ExternalLink size={12} />
                          Visit
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
