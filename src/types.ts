export interface Category {
  id: string
  name: string
  imageUrl: string | null
  description: string | null
  createdAt: string
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'

export interface Order {
  id: string
  orderDate: string
  totalAmount: string
  status: OrderStatus
  restaurantId: string
  restaurant: { id: string; businessName: string }
  createdAt: string
}

export interface Product {
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

export interface InboxUser {
  id: string
  firstName: string
  lastName: string
  email: string
  createdAt: string
  restaurant: { businessName: string } | null
}
