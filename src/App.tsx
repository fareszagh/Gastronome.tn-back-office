import { useState, useEffect } from 'react'
import './App.css'

const API = 'http://localhost:3000'

interface Category {
  id: string
  name: string
  imageUrl: string | null
  description: string | null
  createdAt: string
}

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

interface Order {
  id: string
  orderDate: string
  totalAmount: string
  status: OrderStatus
  restaurantId: string
  restaurant: {
    id: string
    businessName: string
  }
  createdAt: string
}

interface Product {
  id: string
  name: string
  imageUrl: string | null
  description: string | null
  price: string
  unit: string
  stockQuantity: number
  categoryId: string
  category: Category
  createdAt: string
  updatedAt: string
}

// ── Category Modal ─────────────────────────────────────────
interface CategoryForm {
  name: string
  imageUrl: string
  description: string
}

interface CategoryModalProps {
  onClose: () => void
  onSave: (form: CategoryForm) => void
}

function CategoryModal({ onClose, onSave }: CategoryModalProps) {
  const [form, setForm] = useState<CategoryForm>({ name: '', imageUrl: '', description: '' })
  const [errors, setErrors] = useState<Partial<CategoryForm>>({})

  const validate = () => {
    const e: Partial<CategoryForm> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    return e
  }

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave(form)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
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
              onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Description <span className="optional">(optional)</span></label>
            <textarea
              placeholder="Short description of this category…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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

// ── Product Modal ──────────────────────────────────────────
interface ProductForm {
  name: string
  imageUrl: string
  description: string
  price: string
  unit: string
  stockQuantity: string
  categoryId: string
}

interface ProductModalProps {
  onClose: () => void
  onSave: (form: ProductForm) => void
  categoryOptions: { id: string; name: string }[]
}

function ProductModal({ onClose, onSave, categoryOptions }: ProductModalProps) {
  const [form, setForm] = useState<ProductForm>({
    name: '', imageUrl: '', description: '',
    price: '', unit: '', stockQuantity: '', categoryId: '',
  })
  const [errors, setErrors] = useState<Partial<ProductForm>>({})

  const set = (field: keyof ProductForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const e: Partial<ProductForm> = {}
    if (!form.name.trim())            e.name          = 'Name is required'
    if (!form.price.trim())           e.price         = 'Price is required'
    else if (isNaN(Number(form.price)) || Number(form.price) < 0)
                                      e.price         = 'Enter a valid price'
    if (!form.unit.trim())            e.unit          = 'Unit is required'
    if (!form.stockQuantity.trim())   e.stockQuantity = 'Stock quantity is required'
    else if (!Number.isInteger(Number(form.stockQuantity)) || Number(form.stockQuantity) < 0)
                                      e.stockQuantity = 'Enter a valid whole number'
    if (!form.categoryId)             e.categoryId    = 'Category is required'
    return e
  }

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave(form)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Product</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-group">
            <label>Name <span className="required">*</span></label>
            <input type="text" placeholder="e.g. King Prawns (5kg)" value={form.name} onChange={set('name')} className={errors.name ? 'input-error' : ''} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          {/* Price + Unit */}
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

          {/* Stock + Category */}
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
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <span className="field-error">{errors.categoryId}</span>}
            </div>
          </div>

          {/* Image URL */}
          <div className="form-group">
            <label>Image URL <span className="optional">(optional)</span></label>
            <input type="url" placeholder="https://example.com/image.png" value={form.imageUrl} onChange={set('imageUrl')} />
          </div>

          {/* Description */}
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

// ── SVG Icons ─────────────────────────────────────────────
const ForkKnifeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
  </svg>
)

const AnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)


const BoxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)


const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)


const PackageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
)

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const TrendingUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
)


const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)

// ── Products List Modal ─────────────────────────────────────
function ProductsListModal({ products, onClose, onDelete }: {
  products: Product[]
  onClose: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>All Products ({products.length})</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="products-list-modal-body">
          {products.length === 0 ? (
            <p className="cat-status">No products yet.</p>
          ) : (
            <ul className="products-list plist-modal">
              {products.map(product => {
                const isOut = product.stockQuantity === 0
                const isLow = product.stockQuantity > 0 && product.stockQuantity <= 10
                const stockLabel = isOut ? 'Out of Stock' : isLow ? 'Low' : 'In Stock'
                const stockCls   = isOut || isLow ? 'product-stock-low' : ''
                return (
                  <li key={product.id} className="product-item">
                    <div className="product-img"><BoxIcon /></div>
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-meta">
                        {product.category.name} ·{' '}
                        <span className={stockCls}>{stockLabel}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                      <span className="inv-price-sm">DT {parseFloat(product.price).toFixed(2)}</span>
                      <div className="product-actions">
                        <button title="Delete" onClick={() => onDelete(product.id)}>
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Inventory View ─────────────────────────────────────────
function stockStatus(qty: number): { label: string; cls: string } {
  if (qty === 0)  return { label: 'Out of Stock', cls: 'stock-out' }
  if (qty <= 10)  return { label: 'Low Stock',    cls: 'stock-low' }
  return            { label: 'In Stock',      cls: 'stock-ok'  }
}

function InventoryView() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [edited, setEdited] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'in' | 'low' | 'out'>('all')

  useEffect(() => {
    fetch(`${API}/products`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: Product[]) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const updateQty = (id: string, qty: number) => {
    if (qty < 0) return
    setEdited(prev => ({ ...prev, [id]: qty }))
  }

  const save = async (id: string) => {
    const newQty = edited[id]
    setSaving(prev => ({ ...prev, [id]: true }))
    try {
      await fetch(`${API}/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newQty }),
      })
      setItems(prev => prev.map(p => p.id === id ? { ...p, stockQuantity: newQty } : p))
      setEdited(prev => { const n = { ...prev }; delete n[id]; return n })
    } finally {
      setSaving(prev => { const n = { ...prev }; delete n[id]; return n })
    }
  }

  const cancel = (id: string) => {
    setEdited(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  const filtered = items.filter(item => {
    const s = search.toLowerCase()
    const matchSearch = item.name.toLowerCase().includes(s) || item.category.name.toLowerCase().includes(s)
    const qty = edited[item.id] ?? item.stockQuantity
    const matchFilter =
      filter === 'all' ? true :
      filter === 'in'  ? qty > 10 :
      filter === 'low' ? qty > 0 && qty <= 10 :
                         qty === 0
    return matchSearch && matchFilter
  })

  return (
    <div className="dashboard-body">
      <div className="inv-toolbar">
        <div className="search-bar inv-search">
          <SearchIcon />
          <input
            placeholder="Search products or categories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="inv-filters">
          {(['all', 'in', 'low', 'out'] as const).map(f => (
            <button
              key={f}
              className={`filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'in' ? 'In Stock' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}
        </div>
      </div>

      <div className="section-card">
        {loading ? (
          <div className="inv-empty">Loading products…</div>
        ) : (
          <table className="orders-table inv-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Unit</th>
                <th>Stock Quantity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const qty = edited[item.id] ?? item.stockQuantity
                const changed = edited[item.id] !== undefined
                const { label, cls } = stockStatus(qty)
                return (
                  <tr key={item.id}>
                    <td className="order-id-cell">{item.name}</td>
                    <td style={{ color: '#555', fontSize: '13px' }}>{item.category.name}</td>
                    <td className="total-cell">DT {parseFloat(item.price).toFixed(2)}</td>
                    <td style={{ color: '#888', fontSize: '12.5px' }}>{item.unit}</td>
                    <td>
                      <div className="qty-stepper">
                        <button className="qty-btn" onClick={() => updateQty(item.id, qty - 1)}>−</button>
                        <input
                          type="number"
                          className={`qty-input${changed ? ' qty-changed' : ''}`}
                          value={qty}
                          min={0}
                          onChange={e => updateQty(item.id, parseInt(e.target.value) || 0)}
                        />
                        <button className="qty-btn" onClick={() => updateQty(item.id, qty + 1)}>+</button>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${cls}`}>{label}</span>
                    </td>
                    <td>
                      {changed ? (
                        <div className="row-actions">
                          <button className="action-approve" title="Save" onClick={() => save(item.id)} disabled={saving[item.id]}>
                            <CheckIcon />
                          </button>
                          <button className="action-reject" title="Discard" onClick={() => cancel(item.id)}>
                            <XIcon />
                          </button>
                        </div>
                      ) : (
                        <span className="action-completed">Saved</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="inv-empty">No products found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Data ───────────────────────────────────────────────────
const AVATAR_COLORS = ['#c0834a', '#3b82f6', '#8e44ad', '#27ae60', '#e67e22', '#e74c3c', '#1abc9c']
const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length]
const initials    = (name: string) => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
const shortId     = (id: string)   => `#${id.slice(-6).toUpperCase()}`




const navItems = [
  { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
  { id: 'inventory', label: 'Inventory', icon: <BoxIcon /> },
]

// ── Component ──────────────────────────────────────────────
export default function App() {
  const [activeNav, setActiveNav] = useState('analytics')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showProductsListModal, setShowProductsListModal] = useState(false)

  // ── Restaurant (active users) count ──
  const [restaurantCount, setRestaurantCount] = useState<number | null>(null)

  useEffect(() => {
    fetch(`${API}/restaurant/count`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: { count: number }) => setRestaurantCount(data.count))
      .catch(() => setRestaurantCount(0))
  }, [])

  // ── Inbox users ──
  interface InboxUser { id: string; firstName: string; lastName: string; email: string; createdAt: string; restaurant: { businessName: string } | null }
  const [inboxUsers, setInboxUsers] = useState<InboxUser[]>([])

  useEffect(() => {
    fetch(`${API}/restaurant/users`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: InboxUser[]) => setInboxUsers(data))
      .catch(() => {})
  }, [])

  // ── Orders state ──
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/order`)
      .then(r => { if (!r.ok) throw new Error('Failed to load orders'); return r.json() })
      .then((data: Order[]) => setOrders(data))
      .catch((err: Error) => setOrdersError(err.message))
      .finally(() => setOrdersLoading(false))
  }, [])

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      const res = await fetch(`${API}/order/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update order')
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    } catch (err) {
      console.error(err)
    }
  }

  // ── Categories state ──
  const [categories, setCategories] = useState<Category[]>([])
  const [catLoading, setCatLoading] = useState(true)
  const [catError, setCatError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/category`)
      .then(r => { if (!r.ok) throw new Error('Failed to load categories'); return r.json() })
      .then((data: Category[]) => setCategories(data))
      .catch((err: Error) => setCatError(err.message))
      .finally(() => setCatLoading(false))
  }, [])

  const handleSaveCategory = async (form: CategoryForm) => {
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
      if (!res.ok) throw new Error('Failed to create category')
      const created: Category = await res.json()
      setCategories(prev => [...prev, created])
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`${API}/category/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete category')
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  // ── Products state ──
  const [products, setProducts] = useState<Product[]>([])
  const [prodLoading, setProdLoading] = useState(true)
  const [prodError, setProdError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/products`)
      .then(r => { if (!r.ok) throw new Error('Failed to load products'); return r.json() })
      .then((data: Product[]) => setProducts(data))
      .catch((err: Error) => setProdError(err.message))
      .finally(() => setProdLoading(false))
  }, [])

  const handleSaveProduct = async (form: ProductForm) => {
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
      if (!res.ok) throw new Error('Failed to create product')
      const created: Product = await res.json()
      setProducts(prev => [created, ...prev])
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`${API}/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete product')
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const categoryOptions = categories.map(c => ({ id: c.id, name: c.name }))

  return (
    <div className="dashboard">
      {/* ── Left Sidebar ─── */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <ForkKnifeIcon />
          </div>
          <div>
            <div className="logo-title">Gastronome.tn</div>
            <div className="logo-sub">Premium Supply Hub</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item${activeNav === item.id ? ' active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

      </aside>

      {/* ── Main Content ─── */}
      <main className="main">
        {/* Header */}
        <header className="header">
          <h1>{activeNav === 'inventory' ? 'Inventory Management' : 'Management Overview'}</h1>
          <div className="header-right">
            <div className="search-bar">
              <SearchIcon />
              <input placeholder="Search orders, products, or suppliers..." />
            </div>
            <button className="icon-btn">
              <BellIcon />
              <span className="notif-dot" />
            </button>
            <div className="user-avatar">U</div>
          </div>
        </header>

        {/* Inventory view */}
        {activeNav === 'inventory' && <InventoryView />}

        {/* Dashboard body */}
        {activeNav === 'analytics' && <div className="dashboard-body">
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrap">
                <PackageIcon />
              </div>
              <div className="stat-text">
                <div className="stat-label">Pending Orders</div>
                <div className="stat-value">{orders.filter(o => o.status === 'PENDING').length}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrap blue">
                <UsersIcon />
              </div>
              <div className="stat-text">
                <div className="stat-label">Active Users</div>
                <div className="stat-value">{restaurantCount ?? '—'}</div>
              </div>
            </div>

            <div className="stat-card revenue">
              <div className="stat-label">Total Revenue (All Orders)</div>
              <div className="stat-value">
                DT {orders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="revenue-trend">
                <TrendingUpIcon />
                {orders.length} orders
                <span className="trend-sub">total</span>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="section-card">
            <div className="section-header">
              <h2>Recent Orders</h2>
              <a href="#" className="view-all-link">View All Orders</a>
            </div>
            {ordersLoading && <p className="cat-status">Loading…</p>}
            {ordersError   && <p className="cat-status cat-error">{ordersError}</p>}
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Restaurant</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const name = order.restaurant.businessName
                  const isPending = order.status === 'PENDING'
                  const isActive  = isPending || order.status === 'CONFIRMED' || order.status === 'PROCESSING'
                  return (
                    <tr key={order.id}>
                      <td className="order-id-cell">{shortId(order.id)}</td>
                      <td>
                        <div className="restaurant-cell">
                          <div className="rest-avatar" style={{ background: avatarColor(order.restaurantId) }}>
                            {initials(name)}
                          </div>
                          {name}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="total-cell">DT {parseFloat(order.totalAmount).toFixed(2)}</td>
                      <td>
                        {isActive ? (
                          <div className="row-actions">
                            <button className="action-approve" title="Confirm" onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}>
                              <CheckIcon />
                            </button>
                            <button className="action-reject" title="Cancel" onClick={() => updateOrderStatus(order.id, 'CANCELLED')}>
                              <XIcon />
                            </button>
                          </div>
                        ) : (
                          <span className="action-completed">{order.status}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Categories + Products */}
          <div className="bottom-grid">
            {/* Manage Categories */}
            <div className="section-card">
              <div className="section-header">
                <h2>Manage Categories</h2>
                <button className="add-category-btn" title="Add category" onClick={() => setShowCategoryModal(true)}>+</button>
              </div>
              {catLoading && <p className="cat-status">Loading…</p>}
              {catError   && <p className="cat-status cat-error">{catError}</p>}
              <ul className="categories-list">
                {categories.map((cat) => (
                  <li key={cat.id} className="category-item">
                    <div className="category-icon"><ForkKnifeIcon /></div>
                    <span className="category-name">{cat.name}</span>
                    <button className="trash-btn" title="Delete" onClick={() => handleDeleteCategory(cat.id)}>
                      <TrashIcon />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent Products */}
            <div className="section-card">
              <div className="section-header">
                <h2>Recent Products</h2>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="add-category-btn" title="Add product" onClick={() => setShowProductModal(true)}>+</button>
                  <button className="products-icon-btn" title="View all products" onClick={() => setShowProductsListModal(true)}>
                    <ListIcon />
                  </button>
                </div>
              </div>
              {prodLoading && <p className="cat-status">Loading…</p>}
              {prodError   && <p className="cat-status cat-error">{prodError}</p>}
              <ul className="products-list">
                {products.slice(0, 5).map((product) => {
                  const isOut = product.stockQuantity === 0
                  const isLow = product.stockQuantity > 0 && product.stockQuantity <= 10
                  const stockLabel = isOut ? 'Out of Stock' : isLow ? 'Low' : 'In Stock'
                  const stockCls   = isOut || isLow ? 'product-stock-low' : ''
                  return (
                    <li key={product.id} className="product-item">
                      <div className="product-img"><BoxIcon /></div>
                      <div className="product-info">
                        <div className="product-name">{product.name}</div>
                        <div className="product-meta">
                          {product.category.name} ·{' '}
                          <span className={stockCls}>{stockLabel}</span>
                        </div>
                      </div>
                      <div className="product-actions">
                        <button title="Delete" onClick={() => handleDeleteProduct(product.id)}>
                          <TrashIcon />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>}
      </main>

      {/* ── Right Sidebar ─── */}
      <aside className="right-sidebar">
        {/* Chefs Inbox */}
        <div className="chefs-inbox">
          <div className="chefs-inbox-header">
            <h3>Chefs Inbox</h3>
            <button className="inbox-menu-btn">⋮</button>
          </div>
          <div className="message-items">
            {inboxUsers.map((u) => {
              const fullName = `${u.firstName} ${u.lastName}`
              const preview = u.restaurant?.businessName ?? u.email
              const time = new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <div key={u.id} className="message-item">
                  <div className="msg-avatar" style={{ background: avatarColor(u.id) }}>
                    {initials(fullName)}
                  </div>
                  <div className="msg-body">
                    <div className="msg-name">{fullName}</div>
                    <div className="msg-preview">{preview}</div>
                  </div>
                  <div className="msg-time">{time}</div>
                </div>
              )
            })}
          </div>
          <button className="open-messenger-btn">Open Full Messenger</button>
        </div>
      </aside>


      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowCategoryModal(false)}
          onSave={handleSaveCategory}
        />
      )}

      {showProductModal && (
        <ProductModal
          onClose={() => setShowProductModal(false)}
          onSave={handleSaveProduct}
          categoryOptions={categoryOptions}
        />
      )}

      {showProductsListModal && (
        <ProductsListModal
          products={products}
          onClose={() => setShowProductsListModal(false)}
          onDelete={(id) => { handleDeleteProduct(id) }}
        />
      )}
    </div>
  )
}
