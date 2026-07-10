import { useState, useEffect } from 'react'
import { API } from '../api'
import type { Category, Product } from '../types'
import { BoxIcon, TrashIcon } from '../icons'

interface ProductForm {
  name: string
  imageUrl: string
  description: string
  price: string
  unit: string
  stockQuantity: string
  categoryId: string
}

function ProductModal({
  onClose,
  onSave,
  categoryOptions,
}: {
  onClose: () => void
  onSave: (f: ProductForm) => void
  categoryOptions: { id: string; name: string }[]
}) {
  const [form, setForm] = useState<ProductForm>({
    name: '', imageUrl: '', description: '',
    price: '', unit: '', stockQuantity: '', categoryId: '',
  })
  const [errors, setErrors] = useState<Partial<ProductForm>>({})

  const set = (field: keyof ProductForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs: Partial<ProductForm> = {}
    if (!form.name.trim())          errs.name          = 'Name is required'
    if (!form.price.trim())         errs.price         = 'Price is required'
    else if (isNaN(Number(form.price)) || Number(form.price) < 0) errs.price = 'Enter a valid price'
    if (!form.unit.trim())          errs.unit          = 'Unit is required'
    if (!form.stockQuantity.trim()) errs.stockQuantity = 'Stock quantity is required'
    else if (!Number.isInteger(Number(form.stockQuantity)) || Number(form.stockQuantity) < 0) errs.stockQuantity = 'Enter a valid whole number'
    if (!form.categoryId)           errs.categoryId    = 'Category is required'
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave(form)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Product</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name <span className="required">*</span></label>
            <input type="text" placeholder="e.g. King Prawns (5kg)" value={form.name} onChange={set('name')} className={errors.name ? 'input-error' : ''} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Price (DT) <span className="required">*</span></label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={set('price')} className={errors.price ? 'input-error' : ''} />
              {errors.price && <span className="field-error">{errors.price}</span>}
            </div>
            <div className="form-group">
              <label>Unit <span className="required">*</span></label>
              <input type="text" placeholder="e.g. kg, piece, box" value={form.unit} onChange={set('unit')} className={errors.unit ? 'input-error' : ''} />
              {errors.unit && <span className="field-error">{errors.unit}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Stock Quantity <span className="required">*</span></label>
              <input type="number" min="0" step="1" placeholder="0" value={form.stockQuantity} onChange={set('stockQuantity')} className={errors.stockQuantity ? 'input-error' : ''} />
              {errors.stockQuantity && <span className="field-error">{errors.stockQuantity}</span>}
            </div>
            <div className="form-group">
              <label>Category <span className="required">*</span></label>
              <select value={form.categoryId} onChange={set('categoryId')} className={errors.categoryId ? 'input-error' : ''}>
                <option value="">Select a category…</option>
                {categoryOptions.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <span className="field-error">{errors.categoryId}</span>}
            </div>
          </div>
          <div className="form-group">
            <label>Image URL <span className="optional">(optional)</span></label>
            <input type="url" placeholder="https://example.com/image.png" value={form.imageUrl} onChange={set('imageUrl')} />
          </div>
          <div className="form-group">
            <label>Description <span className="optional">(optional)</span></label>
            <textarea placeholder="Short description of this product…" value={form.description} onChange={set('description')} rows={3} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save">Add Product</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`${API}/products`).then(r => r.json()),
      fetch(`${API}/category`).then(r => r.json()),
    ])
      .then(([prods, cats]: [Product[], Category[]]) => {
        setProducts(prods)
        setCategories(cats)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (form: ProductForm) => {
    try {
      const res = await fetch(`${API}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          price: parseFloat(form.price),
          unit: form.unit,
          stockQuantity: parseInt(form.stockQuantity),
          categoryId: form.categoryId,
          ...(form.imageUrl    && { imageUrl:    form.imageUrl }),
          ...(form.description && { description: form.description }),
        }),
      })
      if (!res.ok) throw new Error()
      const created: Product = await res.json()
      setProducts(prev => [created, ...prev])
    } catch {}
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API}/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch {}
  }

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat ? p.categoryId === filterCat : true
    return matchSearch && matchCat
  })

  return (
    <div className="dashboard-body">
      <div className="section-card">
        <div className="section-header">
          <h2>All Products</h2>
          <button className="add-category-btn" title="Add product" onClick={() => setShowModal(true)}>+</button>
        </div>

        <div className="inv-toolbar">
          <input
            className="prod-search-input"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="prod-cat-filter"
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {loading && <p className="cat-status">Loading…</p>}
        {error   && <p className="cat-status cat-error">{error}</p>}

        <table className="orders-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Unit</th>
              <th>Stock</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => {
              const isOut = product.stockQuantity === 0
              const isLow = product.stockQuantity > 0 && product.stockQuantity <= 10
              const stockLabel = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'
              const stockCls   = isOut ? 'stock-out' : isLow ? 'stock-low' : 'stock-ok'
              return (
                <tr key={product.id}>
                  <td>
                    <div className="restaurant-cell">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                      ) : (
                        <div className="product-img"><BoxIcon /></div>
                      )}
                      <span className="product-name">{product.name}</span>
                    </div>
                  </td>
                  <td style={{ color: '#555', fontSize: '13px' }}>{product.category.name}</td>
                  <td className="total-cell">DT {parseFloat(product.price).toFixed(2)}</td>
                  <td style={{ color: '#888', fontSize: '12.5px' }}>{product.unit}</td>
                  <td style={{ color: '#555', fontSize: '13px' }}>{product.stockQuantity}</td>
                  <td>
                    <span className={`badge ${stockCls}`}>{stockLabel}</span>
                  </td>
                  <td>
                    <button className="trash-btn" title="Delete" onClick={() => handleDelete(product.id)}>
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              )
            })}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="inv-empty">No products found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ProductModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          categoryOptions={categories.map(c => ({ id: c.id, name: c.name }))}
        />
      )}
    </div>
  )
}
