export type ID = string

export type Money = { currency: 'CNY'; amountFen: number }

export type OrderStatus = 'PENDING_PAY' | 'PAID' | 'COOKING' | 'DONE' | 'CANCELED'

export type OrderItem = {
  dishId: ID
  dishName: string
  skuId?: ID
  skuName?: string
  unitPrice: Money
  qty: number
}

export type Order = {
  id: ID
  storeId: ID
  tableId: ID
  tableName: string
  status: OrderStatus
  items: OrderItem[]
  totalPrice: Money
  remark?: string
  createdAt: string
}

export type AdminUser = {
  id: ID
  username: string
  displayName: string
  roleName: string
}

export type Notice = {
  id: ID
  title: string
  content: string
  createdAt: string
  isPinned: boolean
}

export type AppUser = {
  id: ID
  nickname: string
  phone?: string
  createdAt: string
  lastActiveAt: string
  orderCount: number
  status: 'ACTIVE' | 'INACTIVE'
}

export type Category = {
  id: ID
  name: string
  sort: number
}

export type Dish = {
  id: ID
  categoryId: ID
  name: string
  priceFen: number
  onSale: boolean
  soldOut: boolean
}

export type DishSales = {
  dishId: ID
  dishName: string
  soldQty: number
}

export type Comment = {
  id: ID
  orderId: ID
  dishName: string
  nickname: string
  rating: 1 | 2 | 3 | 4 | 5
  content: string
  createdAt: string
}

export type Feedback = {
  id: ID
  nickname: string
  content: string
  createdAt: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
}

export type SupportTicket = {
  id: ID
  nickname: string
  topic: string
  lastMessageAt: string
  status: 'OPEN' | 'CLOSED'
}
