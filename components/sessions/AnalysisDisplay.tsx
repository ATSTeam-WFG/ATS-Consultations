'use client'

import type { SessionAnalysis } from '@/lib/types'

interface AnalysisDisplayProps {
  analysis: SessionAnalysis
}

export function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Summary */}
      {analysis.summary && (
        <div className="ats-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
            AI Summary
          </div>
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>{analysis.summary}</p>
        </div>
      )}

      {/* Pain points */}
      {analysis.pain_points?.length > 0 && (
        <div className="ats-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
            Pain Points ({analysis.pain_points.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {analysis.pain_points.map((pp, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  padding: '0.75rem',
                  background: 'var(--muted)',
                  borderRadius: '0.375rem',
                }}
              >
                <span className={`badge badge-${pp.severity}`} style={{ flexShrink: 0, marginTop: '0.125rem' }}>
                  {pp.severity}
                </span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.125rem' }}>{pp.description}</div>
                  {pp.category && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{pp.category}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Problem tags */}
      {analysis.problem_tags?.length > 0 && (
        <div className="ats-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
            Problem Tags
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {analysis.problem_tags.map((tag) => (
              <span key={tag} className="tag-pill">{tag.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}

      {/* Tool recommendations */}
      {analysis.tool_recommendations?.length > 0 && (
        <div className="ats-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
            Recommended Tools
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {analysis.tool_recommendations.map((tool, i) => (
              <div
                key={i}
                style={{
                  padding: '0.875rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  background: 'var(--background)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{tool.name}</span>
                  <span className={`badge badge-${tool.priority === 'high' ? 'critical' : tool.priority === 'medium' ? 'medium' : 'low'}`}>
                    {tool.priority}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>{tool.category}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{tool.rationale}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roadmap */}
      {analysis.roadmap_steps?.length > 0 && (
        <div className="ats-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>
            Implementation Roadmap
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {analysis.roadmap_steps.map((step, i) => (
              <div
                key={i}
                style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
              >
                <div
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    background: 'var(--ats-blue)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  W{step.week}
                </div>
                <div style={{ flex: 1, paddingBottom: '0.625rem', borderBottom: i < analysis.roadmap_steps.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{step.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>{step.description}</div>
                  {step.owner && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                      Owner: {step.owner}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ROI */}
      {analysis.roi_estimate && (
        <div className="ats-card" style={{ background: 'var(--ats-blue-light)', borderColor: 'var(--ats-blue)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ats-blue-dark)', marginBottom: '0.75rem' }}>
            ROI Estimate
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--ats-blue-dark)' }}>
                {analysis.roi_estimate.time_saved_hours_per_week}h
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ats-blue-dark)' }}>saved / week</div>
            </div>
            <div>
              <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--ats-blue-dark)' }}>
                {analysis.roi_estimate.revenue_impact}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ats-blue-dark)' }}>revenue impact</div>
            </div>
            <div>
              <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--ats-blue-dark)' }}>
                {analysis.roi_estimate.confidence}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ats-blue-dark)' }}>confidence</div>
            </div>
          </div>
          {analysis.roi_estimate.notes && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--ats-blue-dark)' }}>
              {analysis.roi_estimate.notes}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
