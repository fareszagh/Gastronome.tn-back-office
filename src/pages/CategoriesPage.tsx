import { useState, useEffect } from 'react'
import { API } from '../api'
import type { Category } from '../types'
import { TrashIcon } from '../icons'

// Gradient palette — picked to evoke culinary materials
const CAT_GRADIENTS = [
  ['#0e4d3a', '#1a8c5e'],
  ['#0d3d52', '#1a6e8c'],
  ['#4a1a1a', '#8b3a3a'],
  ['#3d2a0d', '#7d5228'],
  ['#1a2a4a', '#2d4a8c'],
  ['#3a1a4a', '#6b3a8c'],
  ['#4a3a0d', '#8c6b1a'],
  ['#1a3a3a', '#2d7a7a'],
]

const catGradient = (id: string) =>
  CAT_GRADIENTS[id.charCodeAt(0) % CAT_GRADIENTS.length]

interface CategoryForm {
  name: string
  imageUrl: string
  description: string
}

function CategoryModal({ onClose, onSave }: { onClose: () => void; onSave: (f: CategoryForm) => void }) {
  const [form, setForm] = useState<CategoryForm>({ name: '', imageUrl: '', description: '' })
  const [errors, setErrors] = useState<Partial<CategoryForm>>({})

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs: Partial<CategoryForm> = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave(form)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Category</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name <span className="required">*</span></label>
            <input
              type="text"
              placeholder="e.g. Dairy & Eggs"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={errors.name ? 'input-error' : ''}
              autoFocus
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label>Image URL <span className="optional">(optional)</span></label>
            <input
              type="url"
              placeholder="https://example.com/image.png"
              value={form.imageUrl}
              onChange={e => setForm({ ...form, imageUrl: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Description <span className="optional">(optional)</span></label>
            <textarea
              placeholder="Short description of this category…"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save">Add Category</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetch(`${API}/category`)
      .then(r => { if (!r.ok) throw new Error('Failed to load categories'); return r.json() })
      .then((data: Category[]) => setCategories(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (form: CategoryForm) => {
    try {
      const res = await fetch(`${API}/category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          ...(form.imageUrl    && { imageUrl:    form.imageUrl }),
          ...(form.description && { description: form.description }),
        }),
      })
      if (!res.ok) throw new Error()
      const created: Category = await res.json()
      setCategories(prev => [...prev, created])
    } catch {}
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API}/category/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch {}
  }

  return (
    <div className="dashboard-body">
      <div className="section-card">
        {/* Header */}
        <div className="section-header">
          <div className="cat-page-title-row">
            <h2>Categories</h2>
            {!loading && (
              <span className="cat-count-chip">{categories.length}</span>
            )}
          </div>
          <button className="cat-add-btn-primary" onClick={() => setShowModal(true)}>
            + Add Category
          </button>
        </div>

        {loading && <p className="cat-status">Loading…</p>}
        {error   && <p className="cat-status cat-error">{error}</p>}

        {/* Card Grid */}
        <div className="cat-grid">
          {categories.map(cat => {
            const [c0, c1] = catGradient(cat.id)
            return (
              <div key={cat.id} className="cat-card">
                {/* Cover */}
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="cat-card-img" />
                ) : (
                  <div
                    className="cat-card-placeholder"
                    style={{ background: `linear-gradient(145deg, ${c0}, ${c1})` }}
                  >
                    <span className="cat-card-initial">{cat.name[0]}</span>
                  </div>
                )}

                {/* Body */}
                <div className="cat-card-body">
                  <div className="cat-card-title">{cat.name}</div>
                  {cat.description && (
                    <div className="cat-card-desc">{cat.description}</div>
                  )}
                  <div className="cat-card-footer">
                    <span className="cat-card-date">
                      {new Date(cat.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                    <button
                      className="cat-card-delete"
                      title="Delete category"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Add-category slot */}
          {!loading && (
            <button className="cat-add-card" onClick={() => setShowModal(true)}>
              <div className="cat-add-icon">+</div>
              <span className="cat-add-label">New Category</span>
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <CategoryModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  )
}
