import { useState, useEffect } from 'react'
import './App.css'
import { API } from './api'
import type { Category, Order, Product, OrderStatus, InboxUser } from './types'
import {
  ForkKnifeIcon, AnalyticsIcon, BoxIcon, SearchIcon, BellIcon,
  PackageIcon, UsersIcon, TrendingUpIcon, TrashIcon, CheckIcon, XIcon, ListIcon, TagIcon, ClipboardIcon,
} from './icons'
import { avatarColor, initials, shortId } from './utils'
import OrdersPage     from './pages/OrdersPage'
import CategoriesPage from './pages/CategoriesPage'
import ProductsPage   from './pages/ProductsPage'
import InventoryPage  from './pages/InventoryPage'

// ── Category Modal ─────────────────────────────────────────
interface CategoryForm { name: string; imageUrl: string; description: string }

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

// ── Product Modal ──────────────────────────────────────────
interface ProductForm {
  name: string; imageUrl: string; description: string
  price: string; unit: string; stockQuantity: string; categoryId: string
}

function ProductModal({ onClose, onSave, categoryOptions }: {
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
                {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

// ── Products List Modal ────────────────────────────────────
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
                        {product.category.name} · <span className={stockCls}>{stockLabel}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                      <span className="inv-price-sm">DT {parseFloat(product.price).toFixed(2)}</span>
                      <div className="product-actions">
                        <button title="Delete" onClick={() => onDelete(product.id)}><TrashIcon /></button>
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

// ── Nav items ──────────────────────────────────────────────
const navItems = [
  { id: 'analytics',  label: 'Analytics',  icon: <AnalyticsIcon /> },
  { id: 'orders',     label: 'Orders',      icon: <PackageIcon /> },
  { id: 'categories', label: 'Categories',  icon: <TagIcon /> },
  { id: 'products',   label: 'Products',    icon: <BoxIcon /> },
  { id: 'inventory',  label: 'Inventory',   icon: <ClipboardIcon /> },
]

const pageTitle: Record<string, string> = {
  analytics:  'Management Overview',
  orders:     'Orders',
  categories: 'Categories',
  products:   'Products',
  inventory:  'Inventory Management',
}

// ── App ────────────────────────────────────────────────────
export default function App() {
  const [activeNav, setActiveNav] = useState('analytics')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showProductsListModal, setShowProductsListModal] = useState(false)

  // ── Restaurant count ──
  const [restaurantCount, setRestaurantCount] = useState<number | null>(null)
  useEffect(() => {
    fetch(`${API}/restaurant/count`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: { count: number }) => setRestaurantCount(data.count))
      .catch(() => setRestaurantCount(0))
  }, [])

  // ── Inbox users ──
  const [inboxUsers, setInboxUsers] = useState<InboxUser[]>([])
  useEffect(() => {
    fetch(`${API}/restaurant/users`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((data: InboxUser[]) => setInboxUsers(data))
      .catch(() => {})
  }, [])

  // ── Orders (analytics overview) ──
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
      if (!res.ok) throw new Error()
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    } catch {}
  }

  // ── Categories (analytics overview) ──
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
      if (!res.ok) throw new Error()
      const created: Category = await res.json()
      setCategories(prev => [...prev, created])
    } catch {}
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      const res = await fetch(`${API}/category/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch {}
  }

  // ── Products (analytics overview) ──
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
      if (!res.ok) throw new Error()
      const created: Product = await res.json()
      setProducts(prev => [created, ...prev])
    } catch {}
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`${API}/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch {}
  }

  const categoryOptions = categories.map(c => ({ id: c.id, name: c.name }))

  return (
    <div className="dashboard">
      {/* ── Left Sidebar ─── */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon"><ForkKnifeIcon /></div>
          <div>
            <div className="logo-title">Gastronome.tn</div>
            <div className="logo-sub">Premium Supply Hub</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
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
        <header className="header">
          <h1>{pageTitle[activeNav]}</h1>
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

        {/* ── Page Router ── */}
        {activeNav === 'orders'     && <OrdersPage />}
        {activeNav === 'categories' && <CategoriesPage />}
        {activeNav === 'products'   && <ProductsPage />}
        {activeNav === 'inventory'  && <InventoryPage />}

        {/* ── Analytics Dashboard ── */}
        {activeNav === 'analytics' && (
          <div className="dashboard-body">
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrap"><PackageIcon /></div>
                <div className="stat-text">
                  <div className="stat-label">Pending Orders</div>
                  <div className="stat-value">{orders.filter(o => o.status === 'PENDING').length}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrap blue"><UsersIcon /></div>
                <div className="stat-text">
                  <div className="stat-label">Active Users</div>
                  <div className="stat-value">{restaurantCount ?? '—'}</div>
                </div>
              </div>
              <div className="stat-card revenue">
                <div className="stat-label">Total Revenue (All Orders)</div>
                <div className="stat-value">
                  DT {orders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0)
                    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="revenue-trend">
                  <TrendingUpIcon />
                  {orders.length} orders <span className="trend-sub">total</span>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="section-card">
              <div className="section-header">
                <h2>Recent Orders</h2>
                <button className="view-all-link" onClick={() => setActiveNav('orders')}>View All Orders</button>
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
                  {orders.slice(0, 5).map(order => {
                    const name = order.restaurant.businessName
                    const isActive = order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'PROCESSING'
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
                          <span className={`badge ${order.status.toLowerCase()}`}>{order.status}</span>
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
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="add-category-btn" title="Add category" onClick={() => setShowCategoryModal(true)}>+</button>
                    <button className="view-all-link" style={{ fontSize: '12px' }} onClick={() => setActiveNav('categories')}>View All</button>
                  </div>
                </div>
                {catLoading && <p className="cat-status">Loading…</p>}
                {catError   && <p className="cat-status cat-error">{catError}</p>}
                <ul className="categories-list">
                  {categories.slice(0, 5).map(cat => (
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
                  {products.slice(0, 5).map(product => {
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
                            {product.category.name} · <span className={stockCls}>{stockLabel}</span>
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
          </div>
        )}
      </main>

      {/* ── Right Sidebar ─── */}
      <aside className="right-sidebar">
        <div className="chefs-inbox">
          <div className="chefs-inbox-header">
            <h3>Chefs Inbox</h3>
            <button className="inbox-menu-btn">⋮</button>
          </div>
          <div className="message-items">
            {inboxUsers.map(u => {
              const fullName = `${u.firstName} ${u.lastName}`
              const preview  = u.restaurant?.businessName ?? u.email
              const time     = new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

      {/* ── Modals ── */}
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
          onDelete={handleDeleteProduct}
        />
      )}
    </div>
  )
}
