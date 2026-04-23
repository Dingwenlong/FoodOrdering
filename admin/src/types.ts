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
  orderNo?: string
  storeId: ID
  tableId: ID
  tableName: string
  status: OrderStatus
  items: OrderItem[]
  totalPrice: Money
  user?: { id: ID; nickname: string; phone?: string } | null
  payments?: Payment[]
  remark?: string
  createdAt: string
  completedAt?: string | null
  updatedAt?: string | null
}

export type AdminUser = {
  id: ID
  username: string
  displayName: string
  roleName: string
  permissions: string[]
}

export type AdminAccount = AdminUser & {
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

export type Role = {
  name: string
  permissions: string[]
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

export type AppUserDetail = AppUser & {
  email?: string
  avatar?: string
}

export type PageResult<T> = {
  list: T[]
  total: number
  page: number
  pageSize: number
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
  description?: string
  image?: string
  sort: number
}

export type Payment = {
  id: ID
  paymentNo: string
  method: 'ALIPAY' | 'WECHAT' | 'CASH' | 'UNKNOWN'
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  amount: Money
  transactionId?: string
  paidAt?: string
  createdAt: string
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

export type SupportTicketDetail = SupportTicket & {
  createdAt: string
  updatedAt: string
}

export type SupportTicketMessage = {
  id: ID
  ticketId: ID
  senderType: 'USER' | 'ADMIN'
  senderId: string
  senderName: string
  content: string
  isRead: boolean
  createdAt: string
}

export type SendMessageRequest = {
  content: string
}

export type TableStatus = 'IDLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE'

export type Table = {
  id: ID
  tableNo: string
  capacity: number
  status: TableStatus
  location?: string
  area?: string
  createdAt: string
  updatedAt: string
}

export type StatsSummary = {
  revenue: Money
  orderCount: number
  paidOrderCount: number
  averageOrderValue: Money
  paymentSuccessRate: number
}

export type StatsTrendPoint = {
  date: string
  revenue: Money
  orderCount: number
  paidOrderCount: number
}

export type SystemSettings = {
  storeId: string
  storeName: string
  openTime: string
  closeTime: string
  autoAccept: boolean
  printerEnabled: boolean
}

export type QrPayload = {
  tableId: ID
  tableNo: string
  payload: string
}

export type AuditLog = {
  id: ID
  adminId?: ID
  adminName?: string
  action: string
  resourceType?: string
  resourceId?: string
  requestPath: string
  result: 'SUCCESS' | 'FAILED'
  message?: string
  createdAt: string
}
