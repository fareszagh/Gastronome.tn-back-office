import { useState, useEffect } from 'react'
import { API } from '../api'
import type { Order, OrderStatus } from '../types'
import { CheckIcon, XIcon } from '../icons'
import { avatarColor, initials, shortId } from '../utils'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/order`)
      .then(r => { if (!r.ok) throw new Error('Failed to load orders'); return r.json() })
      .then((data: Order[]) => setOrders(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const updateStatus = async (id: string, status: OrderStatus) => {
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

  const pending   = orders.filter(o => o.status === 'PENDING').length
  const confirmed = orders.filter(o => o.status === 'CONFIRMED').length
  const delivered = orders.filter(o => o.status === 'DELIVERED').length

  return (
    <div className="dashboard-body">
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-text">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{orders.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-text">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{pending}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-text">
            <div className="stat-label">Confirmed</div>
            <div className="stat-value">{confirmed}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-text">
            <div className="stat-label">Delivered</div>
            <div className="stat-value">{delivered}</div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2>All Orders</h2>
          <span style={{ color: '#888', fontSize: '13px' }}>{orders.length} total</span>
        </div>

        {loading && <p className="cat-status">Loading…</p>}
        {error   && <p className="cat-status cat-error">{error}</p>}

        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Restaurant</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const name = order.restaurant.businessName
              const isActive =
                order.status === 'PENDING' ||
                order.status === 'CONFIRMED' ||
                order.status === 'PROCESSING'
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
                  <td style={{ color: '#888', fontSize: '12.5px' }}>
                    {new Date(order.orderDate).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
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
                        <button
                          className="action-approve"
                          title="Confirm"
                          onClick={() => updateStatus(order.id, 'CONFIRMED')}
                        >
                          <CheckIcon />
                        </button>
                        <button
                          className="action-reject"
                          title="Cancel"
                          onClick={() => updateStatus(order.id, 'CANCELLED')}
                        >
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
    </div>
  )
}
