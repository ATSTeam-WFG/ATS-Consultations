'use client'

import { useState, useEffect, useMemo, ReactNode } from 'react'
import Link from 'next/link'
import Fuse, { FuseResultMatch } from 'fuse.js'
import { Plus, ExternalLink, Pencil, Trash2, X, Search } from 'lucide-react'
import type { ToolRecommendation, ATSSize } from '@/lib/types'

// ============================================================
// Highlight helper
// ============================================================
function highlight(text: string, ranges: readonly [number, number][] | undefined): ReactNode {
  if (!ranges || ranges.length === 0) return text
  const nodes: ReactNode[] = []
  let cursor = 0
  for (const [start, end] of ranges) {
    if (start > cursor) nodes.push(text.slice(cursor, start))
    nodes.push(
      <mark
        key={start}
        style={{
          background: 'rgba(196,165,116,0.25)',
          borderRadius: '2px',
          fontWeight: 600,
          color: 'inherit',
        }}
      >
        {text.slice(start, end + 1)}
      </mark>
    )
    cursor = end + 1
  }
  if (cursor < text.length) nodes.push(text.slice(cursor))
  return <>{nodes}</>
}

function getRangesForKey(matches: readonly FuseResultMatch[] | undefined, key: string): readonly [number, number][] | undefined {
  return matches?.find((m) => m.key === key)?.indices as readonly [number, number][] | undefined
}

// ============================================================
// Edit Modal
// ============================================================
interface ToolEditModalProps {
  tool: ToolRecommendation
  onClose: () => void
  onSave: (updated: ToolRecommendation) => void
  onDelete: (id: string) => void
}

function ToolEditModal({ tool, onClose, onSave, onDelete }: ToolEditModalProps) {
  const [form, setForm] = useState({
    name: tool.name,
    category: tool.category ?? '',
    description: tool.description ?? '',
    ats_size_fit: tool.ats_size_fit?.join(', ') ?? '',
    website_url: tool.website_url ?? '',
    notes: tool.notes ?? '',
    source: tool.source ?? 'external',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/tools/${tool.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category || null,
          description: form.description || null,
          ats_size_fit: form.ats_size_fit ? form.ats_size_fit.split(',').map((s) => s.trim()).filter(Boolean) : [],
          website_url: form.website_url || null,
          notes: form.notes || null,
          source: form.source,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'Save failed')
      onSave(j.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${tool.name}"? This cannot be undone.`)) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/tools/${tool.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error ?? 'Delete failed')
      }
      onDelete(tool.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setDeleting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Edit Tool</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '0.25rem' }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.625rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {/* Source toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Source</span>
            <div style={{ display: 'flex', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
              {(['ats', 'external'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, source: s })}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                    background: form.source === s ? 'var(--color-gold, #c4a574)' : 'transparent',
                    color: form.source === s ? '#fff' : 'var(--muted-foreground)',
                  }}
                >
                  {s === 'ats' ? 'Developed by ATS' : 'External Recommended'}
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Name
            <input
              className="ats-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tool name"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Category
            <input
              className="ats-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. CRM, E-Sign, Title Plant"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Description
            <textarea
              className="ats-input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
            ATS Size Fit <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(comma-separated)</span>
            <input
              className="ats-input"
              value={form.ats_size_fit}
              onChange={(e) => setForm({ ...form, ats_size_fit: e.target.value })}
              placeholder="small, mid, large"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Website URL
            <input
              className="ats-input"
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              placeholder="https://..."
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>
            Notes
            <textarea
              className="ats-input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Internal notes"
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.875rem',
              background: 'none',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: deleting ? 'not-allowed' : 'pointer',
              opacity: deleting ? 0.6 : 1,
            }}
          >
            <Trash2 size={14} />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 0.875rem',
                background: 'none',
                color: 'var(--muted-foreground)',
                border: '1px solid var(--border)',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--ats-blue)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: saving || !form.name.trim() ? 'not-allowed' : 'pointer',
                opacity: saving || !form.name.trim() ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Tool Row
// ============================================================
interface ToolRowProps {
  tool: ToolRecommendation
  matches?: readonly FuseResultMatch[]
  onEdit: (tool: ToolRecommendation) => void
}

function ToolRow({ tool, matches, onEdit }: ToolRowProps) {
  return (
    <tr key={tool.id}>
      <td>
        <div style={{ fontWeight: 500 }}>
          {highlight(tool.name, getRangesForKey(matches, 'name'))}
        </div>
      </td>
      <td style={{ color: 'var(--muted-foreground)' }}>
        {tool.category
          ? highlight(tool.category, getRangesForKey(matches, 'category'))
          : '—'}
      </td>
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
          {tool.description
            ? highlight(tool.description, getRangesForKey(matches, 'description'))
            : '—'}
        </div>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
          <button
            onClick={() => onEdit(tool)}
            title="Edit tool"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted-foreground)',
              padding: '0.25rem',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <Pencil size={13} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ============================================================
// Tools Section
// ============================================================
interface SectionProps {
  title: string
  tools: ToolRecommendation[]
  matchMap: Map<string, readonly FuseResultMatch[]>
  onEdit: (tool: ToolRecommendation) => void
}

function ToolSection({ title, tools, matchMap, onEdit }: SectionProps) {
  if (tools.length === 0) return null
  return (
    <div>
      <h3
        style={{
          fontSize: '0.9375rem',
          fontWeight: 700,
          margin: '0 0 0.75rem 0',
          paddingBottom: '0.5rem',
          borderBottom: '2px solid var(--color-gold, #c4a574)',
          color: 'var(--foreground)',
          letterSpacing: '0.01em',
        }}
      >
        {title}
        <span
          style={{
            marginLeft: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--muted-foreground)',
          }}
        >
          ({tools.length})
        </span>
      </h3>
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
              <ToolRow
                key={tool.id}
                tool={tool}
                matches={matchMap.get(tool.id)}
                onEdit={onEdit}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// Filter Chip
// ============================================================
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.3rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.8125rem',
        fontWeight: active ? 600 : 400,
        border: active ? '1.5px solid var(--color-gold, #c4a574)' : '1px solid var(--border)',
        background: active ? 'rgba(196,165,116,0.12)' : 'transparent',
        color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

// ============================================================
// Page
// ============================================================
const ATS_SIZES: ATSSize[] = ['small', 'mid', 'large', 'enterprise']

export default function ToolsPage() {
  const [tools, setTools] = useState<ToolRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTool, setEditingTool] = useState<ToolRecommendation | null>(null)

  const [query, setQuery] = useState('')
  const [filterSource, setFilterSource] = useState<'all' | 'ats' | 'external'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterSize, setFilterSize] = useState<ATSSize | 'all'>('all')

  useEffect(() => {
    fetch('/api/tools')
      .then((r) => r.json())
      .then((j) => setTools(j.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  function handleSave(updated: ToolRecommendation) {
    setTools((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setEditingTool(null)
  }

  function handleDelete(id: string) {
    setTools((prev) => prev.filter((t) => t.id !== id))
    setEditingTool(null)
  }

  const categories = useMemo(() => {
    const cats = new Set(tools.map((t) => t.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [tools])

  const fuse = useMemo(
    () =>
      new Fuse(tools, {
        keys: [
          { name: 'name', weight: 3 },
          { name: 'category', weight: 2 },
          { name: 'description', weight: 1.5 },
          { name: 'use_cases', weight: 1 },
          { name: 'notes', weight: 0.5 },
        ],
        threshold: 0.35,
        includeMatches: true,
        ignoreLocation: true,
      }),
    [tools]
  )

  const { filteredTools, matchMap } = useMemo(() => {
    const map = new Map<string, readonly FuseResultMatch[]>()
    let result: ToolRecommendation[]

    if (query.trim()) {
      const fuseResults = fuse.search(query.trim())
      fuseResults.forEach((r) => {
        if (r.matches) map.set(r.item.id, r.matches)
      })
      result = fuseResults.map((r) => r.item)
    } else {
      result = tools
    }

    if (filterSource !== 'all') {
      result = result.filter((t) => (t.source ?? 'external') === filterSource)
    }
    if (filterCategory !== 'all') {
      result = result.filter((t) => t.category === filterCategory)
    }
    if (filterSize !== 'all') {
      result = result.filter((t) => t.ats_size_fit?.includes(filterSize))
    }

    return { filteredTools: result, matchMap: map }
  }, [query, filterSource, filterCategory, filterSize, fuse, tools])

  const atsTools = filteredTools.filter((t) => (t.source ?? 'external') === 'ats')
  const externalTools = filteredTools.filter((t) => (t.source ?? 'external') === 'external')

  const hasAnyFilters = query.trim() || filterSource !== 'all' || filterCategory !== 'all' || filterSize !== 'all'

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Search bar */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.875rem',
                  color: 'var(--muted-foreground)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools by name, category, description…"
                style={{
                  width: '100%',
                  padding: '0.625rem 2.5rem 0.625rem 2.5rem',
                  borderRadius: '9999px',
                  border: '1px solid var(--border)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  background: '#fff',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-gold, #c4a574)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(196,165,116,0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  style={{
                    position: 'absolute',
                    right: '0.875rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted-foreground)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.125rem',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter chips */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Source chips */}
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'nowrap', overflowX: 'auto' }}>
                {(['all', 'ats', 'external'] as const).map((s) => (
                  <Chip
                    key={s}
                    label={s === 'all' ? 'All Sources' : s === 'ats' ? 'ATS' : 'External'}
                    active={filterSource === s}
                    onClick={() => setFilterSource(s)}
                  />
                ))}
              </div>

              <div style={{ width: '1px', height: '1.5rem', background: 'var(--border)' }} />

              {/* Category chips */}
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'nowrap', overflowX: 'auto' }}>
                <Chip label="All Categories" active={filterCategory === 'all'} onClick={() => setFilterCategory('all')} />
                {categories.map((cat) => (
                  <Chip key={cat} label={cat} active={filterCategory === cat} onClick={() => setFilterCategory(cat)} />
                ))}
              </div>

              <div style={{ width: '1px', height: '1.5rem', background: 'var(--border)' }} />

              {/* Size chips */}
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'nowrap', overflowX: 'auto' }}>
                <Chip label="All Sizes" active={filterSize === 'all'} onClick={() => setFilterSize('all')} />
                {ATS_SIZES.map((size) => (
                  <Chip
                    key={size}
                    label={size.charAt(0).toUpperCase() + size.slice(1)}
                    active={filterSize === size}
                    onClick={() => setFilterSize(size)}
                  />
                ))}
              </div>
            </div>

            {/* Results */}
            {filteredTools.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: 'var(--muted-foreground)',
                  fontSize: '0.875rem',
                }}
              >
                No tools match your search{hasAnyFilters ? ' and filters' : ''}.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <ToolSection
                  title="Developed by ATS"
                  tools={atsTools}
                  matchMap={matchMap}
                  onEdit={setEditingTool}
                />

                {atsTools.length > 0 && externalTools.length > 0 && (
                  <hr
                    style={{
                      border: 'none',
                      borderTop: '1px solid rgba(196,165,116,0.3)',
                      margin: 0,
                    }}
                  />
                )}

                <ToolSection
                  title="External Recommended AI Tools"
                  tools={externalTools}
                  matchMap={matchMap}
                  onEdit={setEditingTool}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {editingTool && (
        <ToolEditModal
          tool={editingTool}
          onClose={() => setEditingTool(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
