import { useState, useEffect } from 'react'
import { API } from '../api'
import type { Category } from '../types'
import { ForkKnifeIcon, TrashIcon } from '../icons'

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
        <div className="section-header">
          <h2>Manage Categories</h2>
          <button className="add-category-btn" title="Add category" onClick={() => setShowModal(true)}>+</button>
        </div>

        {loading && <p className="cat-status">Loading…</p>}
        {error   && <p className="cat-status cat-error">{error}</p>}

        {!loading && !error && categories.length === 0 && (
          <p className="cat-status">No categories yet.</p>
        )}

        <div className="categories-full-grid">
          {categories.map(cat => (
            <div key={cat.id} className="cat-full-card">
              {cat.imageUrl ? (
                <img src={cat.imageUrl} alt={cat.name} className="cat-full-img" />
              ) : (
                <div className="cat-full-img cat-full-img-placeholder">
                  <ForkKnifeIcon />
                </div>
              )}
              <div className="cat-full-info">
                <div className="cat-full-name">{cat.name}</div>
                {cat.description && (
                  <div className="cat-full-desc">{cat.description}</div>
                )}
                <div className="cat-full-date">
                  Added {new Date(cat.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <button className="trash-btn" title="Delete" onClick={() => handleDelete(cat.id)}>
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <CategoryModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  )
}
