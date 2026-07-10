import { useState, useEffect } from 'react'
import { API } from '../api'
import type { Product } from '../types'
import { SearchIcon, CheckIcon, XIcon } from '../icons'

function stockStatus(qty: number): { label: string; cls: string } {
  if (qty === 0)  return { label: 'Out of Stock', cls: 'stock-out' }
  if (qty <= 10)  return { label: 'Low Stock',    cls: 'stock-low' }
  return            { label: 'In Stock',      cls: 'stock-ok'  }
}

export default function InventoryPage() {
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
