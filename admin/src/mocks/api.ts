import type {
  AdminUser,
  AdminAccount,
  AppUser,
  AppUserDetail,
  AuditLog,
  Category,
  Comment,
  Dish,
  DishSales,
  Feedback,
  Notice,
  Order,
  OrderStatus,
  PageResult,
  QrPayload,
  Role,
  StatsSummary,
  StatsTrendPoint,
  SupportTicket,
  SupportTicketDetail,
  SystemSettings,
  Table,
  TableStatus,
} from '@/types'
import {
  mockAdminAccounts,
  mockCreateDish,
  mockCreateNotice,
  mockDeleteDish,
  mockDeleteNotice,
  mockAdminUser,
  mockAuditLogs,
  mockCategories,
  mockComments,
  mockDishSales,
  mockDishes,
  mockFeedbacks,
  mockNotices,
  mockOrders,
  mockSupportTickets,
  mockSystemSettings,
  mockTables,
  mockRoles,
  mockUpdateDish,
  mockUpdateFeedback,
  mockUpdateOrderStatus,
  mockUpdateSupportTicket,
  mockUpdateNotice,
  mockUpdateUserStatus,
  mockUsers,
} from './db'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function mockLogin(payload: { username: string; password: string }): Promise<{
  token: string
  user: AdminUser
}> {
  await delay(300)
  if (payload.username === 'admin' && payload.password === 'admin123') {
    return { token: 'mock_token_admin', user: mockAdminUser }
  }
  throw new Error('账号或密码错误（Mock：admin/admin123）')
}

export async function mockGetProfile(): Promise<AdminUser> {
  await delay(120)
  return mockAdminUser
}

export async function mockListNotices(): Promise<Notice[]> {
  await delay(160)
  return [...mockNotices].sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
}

export async function mockListUsers(): Promise<AppUser[]> {
  await delay(200)
  return [...mockUsers]
}

export async function mockListUsersPaged(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: AppUser['status']
}): Promise<PageResult<AppUser>> {
  await delay(220)
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.max(1, Math.min(200, params?.pageSize ?? 20))
  const keyword = (params?.keyword ?? '').trim().toLowerCase()
  const status = params?.status

  const filtered = [...mockUsers].filter((u) => {
    if (status && u.status !== status) return false
    if (!keyword) return true
    return (
      u.nickname.toLowerCase().includes(keyword) ||
      (u.phone ?? '').toLowerCase().includes(keyword) ||
      u.id.toLowerCase().includes(keyword)
    )
  })

  const total = filtered.length
  const start = (page - 1) * pageSize
  const list = filtered.slice(start, start + pageSize)
  return { list, total, page, pageSize }
}

export async function mockGetUserDetail(userId: string): Promise<AppUserDetail> {
  await delay(160)
  const user = mockUsers.find((u) => u.id === userId)
  if (!user) throw new Error('用户不存在')
  return {
    ...user,
    email: `${user.id}@example.com`,
    avatar: undefined,
  }
}

export async function mockListMenu(): Promise<{ categories: Category[]; dishes: Dish[] }> {
  await delay(220)
  return {
    categories: [...mockCategories].sort((a, b) => a.sort - b.sort),
    dishes: [...mockDishes],
  }
}

export async function mockListOrders(params?: { status?: OrderStatus }): Promise<Order[]> {
  await delay(240)
  const list = [...mockOrders]
  const filtered = params?.status ? list.filter((o) => o.status === params.status) : list
  return filtered.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function mockListOrdersPaged(params?: {
  page?: number
  pageSize?: number
  status?: OrderStatus
  keyword?: string
  tableId?: string
  userId?: string
  from?: string
  to?: string
}): Promise<PageResult<Order>> {
  await delay(240)
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.max(1, Math.min(200, params?.pageSize ?? 20))
  const keyword = (params?.keyword ?? '').trim().toLowerCase()
  const filtered = [...mockOrders].filter((o) => {
    if (params?.status && o.status !== params.status) return false
    if (params?.tableId && o.tableId !== params.tableId) return false
    if (params?.userId && o.user?.id !== params.userId) return false
    if (params?.from && o.createdAt.slice(0, 10) < params.from) return false
    if (params?.to && o.createdAt.slice(0, 10) > params.to) return false
    if (!keyword) return true
    return (
      o.id.toLowerCase().includes(keyword) ||
      (o.orderNo ?? '').toLowerCase().includes(keyword) ||
      o.tableName.toLowerCase().includes(keyword) ||
      (o.user?.nickname ?? '').toLowerCase().includes(keyword)
    )
  })
  filtered.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const total = filtered.length
  const start = (page - 1) * pageSize
  return { list: filtered.slice(start, start + pageSize), total, page, pageSize }
}

export async function mockGetOrderDetail(orderId: string): Promise<Order> {
  await delay(160)
  const order = mockOrders.find((o) => o.id === orderId)
  if (!order) throw new Error('订单不存在')
  return order
}

export async function mockUpdateOrder(payload: { orderId: string; status: OrderStatus }): Promise<Order> {
  await delay(180)
  return mockUpdateOrderStatus(payload.orderId, payload.status)
}

export async function mockGetDishSales(): Promise<DishSales[]> {
  await delay(180)
  return [...mockDishSales]
}

export async function mockGetStatsSummary(params?: { from?: string; to?: string }): Promise<StatsSummary> {
  const orders = (await mockListOrdersPaged({ ...params, page: 1, pageSize: 200 })).list
  const paid = orders.filter((o) => ['PAID', 'COOKING', 'DONE'].includes(o.status))
  const revenue = paid.reduce((sum, o) => sum + o.totalPrice.amountFen, 0)
  return {
    revenue: { currency: 'CNY', amountFen: revenue },
    orderCount: orders.length,
    paidOrderCount: paid.length,
    averageOrderValue: { currency: 'CNY', amountFen: paid.length ? Math.round(revenue / paid.length) : 0 },
    paymentSuccessRate: orders.length ? paid.length / orders.length : 0,
  }
}

export async function mockGetStatsTrend(params?: { from?: string; to?: string }): Promise<StatsTrendPoint[]> {
  await delay(180)
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - idx))
    return d.toISOString().slice(0, 10)
  })
  return days.map((date) => {
    const dayOrders = mockOrders.filter((o) => o.createdAt.slice(0, 10) === date)
    const paid = dayOrders.filter((o) => ['PAID', 'COOKING', 'DONE'].includes(o.status))
    return {
      date,
      revenue: { currency: 'CNY' as const, amountFen: paid.reduce((sum, o) => sum + o.totalPrice.amountFen, 0) },
      orderCount: dayOrders.length,
      paidOrderCount: paid.length,
    }
  }).filter((point) => {
    if (params?.from && point.date < params.from) return false
    if (params?.to && point.date > params.to) return false
    return true
  })
}

export async function mockGetSystemSettings(): Promise<SystemSettings> {
  await delay(120)
  return { ...mockSystemSettings }
}

export async function mockUpdateSystemSettings(payload: SystemSettings): Promise<SystemSettings> {
  await delay(180)
  Object.assign(mockSystemSettings, payload)
  return { ...mockSystemSettings }
}

export async function mockListComments(): Promise<Comment[]> {
  await delay(180)
  return [...mockComments]
}

export async function mockListFeedbacks(): Promise<Feedback[]> {
  await delay(180)
  return [...mockFeedbacks]
}

export async function mockListSupportTickets(): Promise<SupportTicket[]> {
  await delay(180)
  return [...mockSupportTickets]
}

export async function mockListSupportTicketsPaged(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: SupportTicket['status']
}): Promise<PageResult<SupportTicket>> {
  await delay(220)
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.max(1, Math.min(200, params?.pageSize ?? 20))
  const keyword = (params?.keyword ?? '').trim().toLowerCase()
  const status = params?.status

  const filtered = [...mockSupportTickets].filter((t) => {
    if (status && t.status !== status) return false
    if (!keyword) return true
    return (
      t.nickname.toLowerCase().includes(keyword) ||
      t.topic.toLowerCase().includes(keyword) ||
      t.id.toLowerCase().includes(keyword)
    )
  })

  filtered.sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1))
  const total = filtered.length
  const start = (page - 1) * pageSize
  const list = filtered.slice(start, start + pageSize)
  return { list, total, page, pageSize }
}

export async function mockGetSupportTicketDetail(ticketId: string): Promise<SupportTicketDetail> {
  await delay(160)
  const ticket = mockSupportTickets.find((t) => t.id === ticketId)
  if (!ticket) throw new Error('工单不存在')
  return {
    ...ticket,
    createdAt: '2026-03-01T07:30:00.000Z',
    updatedAt: ticket.lastMessageAt,
  }
}

export async function mockCreateNoticeApi(payload: {
  title: string
  content: string
  isPinned: boolean
}): Promise<Notice> {
  await delay(180)
  return mockCreateNotice(payload)
}

export async function mockUpdateNoticeApi(payload: {
  noticeId: string
  title: string
  content: string
  isPinned: boolean
}): Promise<Notice> {
  await delay(180)
  return mockUpdateNotice(payload)
}

export async function mockDeleteNoticeApi(payload: { noticeId: string }): Promise<void> {
  await delay(120)
  mockDeleteNotice(payload.noticeId)
}

export async function mockCreateDishApi(payload: {
  categoryId: string
  name: string
  priceFen: number
  onSale: boolean
  soldOut: boolean
  description?: string
  image?: string
  sort?: number
}): Promise<Dish> {
  await delay(180)
  return mockCreateDish(payload)
}

export async function mockUpdateDishApi(payload: {
  dishId: string
  categoryId: string
  name: string
  priceFen: number
  onSale: boolean
  soldOut: boolean
  description?: string
  image?: string
  sort?: number
}): Promise<Dish> {
  await delay(180)
  return mockUpdateDish(payload)
}

export async function mockDeleteDishApi(payload: { dishId: string }): Promise<void> {
  await delay(120)
  mockDeleteDish(payload.dishId)
}

export async function mockCreateCategoryApi(payload: { name: string; sort: number; enabled?: boolean }): Promise<Category> {
  await delay(160)
  const category = { id: `c_${Date.now()}`, name: payload.name, sort: payload.sort }
  mockCategories.push(category)
  return category
}

export async function mockUpdateCategoryApi(payload: { categoryId: string; name: string; sort: number; enabled?: boolean }): Promise<Category> {
  await delay(160)
  const idx = mockCategories.findIndex((c) => c.id === payload.categoryId)
  if (idx < 0) throw new Error('分类不存在')
  mockCategories[idx] = { id: payload.categoryId, name: payload.name, sort: payload.sort }
  return mockCategories[idx]
}

export async function mockDeleteCategoryApi(payload: { categoryId: string }): Promise<void> {
  await delay(120)
  const idx = mockCategories.findIndex((c) => c.id === payload.categoryId)
  if (idx < 0) throw new Error('分类不存在')
  mockCategories.splice(idx, 1)
}

export async function mockUpdateUserStatusApi(payload: {
  userId: string
  status: 'ACTIVE' | 'INACTIVE'
}): Promise<{ id: string; status: 'ACTIVE' | 'INACTIVE' }> {
  await delay(140)
  const user = mockUpdateUserStatus(payload)
  return { id: user.id, status: user.status }
}

export async function mockUpdateFeedbackStatusApi(payload: {
  feedbackId: string
  status: Feedback['status']
}): Promise<Feedback> {
  await delay(140)
  return mockUpdateFeedback(payload)
}

export async function mockUpdateSupportTicketStatusApi(payload: {
  ticketId: string
  status: SupportTicket['status']
}): Promise<SupportTicket> {
  await delay(140)
  return mockUpdateSupportTicket(payload)
}

export async function mockListTablesPaged(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: TableStatus
  area?: string
}): Promise<PageResult<Table>> {
  await delay(180)
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.max(1, Math.min(200, params?.pageSize ?? 20))
  const keyword = (params?.keyword ?? '').trim().toLowerCase()
  const filtered = [...mockTables].filter((t) => {
    if (params?.status && t.status !== params.status) return false
    if (params?.area && t.area !== params.area) return false
    if (!keyword) return true
    return t.id.includes(keyword) || t.tableNo.toLowerCase().includes(keyword) || (t.location ?? '').toLowerCase().includes(keyword)
  })
  const total = filtered.length
  const start = (page - 1) * pageSize
  return { list: filtered.slice(start, start + pageSize), total, page, pageSize }
}

export async function mockGetTableDetail(tableId: string): Promise<Table> {
  await delay(120)
  const table = mockTables.find((t) => t.id === tableId)
  if (!table) throw new Error('桌台不存在')
  return table
}

export async function mockCreateTable(payload: { tableNo: string; capacity: number; location?: string; area?: string }): Promise<Table> {
  await delay(160)
  const table: Table = {
    id: String(Date.now()),
    tableNo: payload.tableNo,
    capacity: payload.capacity,
    status: 'IDLE',
    location: payload.location,
    area: payload.area,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  mockTables.unshift(table)
  return table
}

export async function mockUpdateTable(payload: { tableId: string; tableNo: string; capacity: number; location?: string; area?: string }): Promise<Table> {
  await delay(160)
  const idx = mockTables.findIndex((t) => t.id === payload.tableId)
  if (idx < 0) throw new Error('桌台不存在')
  mockTables[idx] = {
    ...mockTables[idx],
    tableNo: payload.tableNo,
    capacity: payload.capacity,
    location: payload.location,
    area: payload.area,
    updatedAt: new Date().toISOString(),
  }
  return mockTables[idx]
}

export async function mockDeleteTable(tableId: string): Promise<void> {
  await delay(120)
  const idx = mockTables.findIndex((t) => t.id === tableId)
  if (idx < 0) throw new Error('桌台不存在')
  mockTables.splice(idx, 1)
}

export async function mockUpdateTableStatus(payload: { tableId: string; status: TableStatus }): Promise<Table> {
  await delay(120)
  const table = mockTables.find((t) => t.id === payload.tableId)
  if (!table) throw new Error('桌台不存在')
  table.status = payload.status
  table.updatedAt = new Date().toISOString()
  return table
}

export async function mockGetTableQrPayload(tableId: string): Promise<QrPayload> {
  await delay(100)
  const table = mockTables.find((t) => t.id === tableId)
  if (!table) throw new Error('桌台不存在')
  return { tableId: table.id, tableNo: table.tableNo, payload: `${mockSystemSettings.storeId ? `storeId=${mockSystemSettings.storeId}&` : ''}tableId=${table.id}` }
}

export async function mockListAdminAccounts(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  roleName?: string
  status?: AdminAccount['status']
}): Promise<PageResult<AdminAccount>> {
  await delay(180)
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.max(1, Math.min(200, params?.pageSize ?? 20))
  const keyword = (params?.keyword ?? '').trim().toLowerCase()
  const filtered = mockAdminAccounts.filter((a) => {
    if (params?.roleName && a.roleName !== params.roleName) return false
    if (params?.status && a.status !== params.status) return false
    if (!keyword) return true
    return a.username.toLowerCase().includes(keyword) || a.displayName.toLowerCase().includes(keyword)
  })
  const total = filtered.length
  const start = (page - 1) * pageSize
  return { list: filtered.slice(start, start + pageSize), total, page, pageSize }
}

export async function mockCreateAdminAccount(payload: {
  username: string
  password: string
  displayName: string
  roleName: string
  enabled: boolean
}): Promise<AdminAccount> {
  await delay(180)
  const role = mockRoles.find((r) => r.name === payload.roleName)
  const account: AdminAccount = {
    id: `admin_${Date.now()}`,
    username: payload.username,
    displayName: payload.displayName,
    roleName: payload.roleName,
    permissions: role?.permissions ?? [],
    status: payload.enabled ? 'ACTIVE' : 'INACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  mockAdminAccounts.unshift(account)
  return account
}

export async function mockUpdateAdminAccount(payload: {
  adminUserId: string
  username: string
  displayName: string
  roleName: string
  enabled: boolean
}): Promise<AdminAccount> {
  await delay(180)
  const idx = mockAdminAccounts.findIndex((a) => a.id === payload.adminUserId)
  if (idx < 0) throw new Error('管理员不存在')
  const role = mockRoles.find((r) => r.name === payload.roleName)
  mockAdminAccounts[idx] = {
    ...mockAdminAccounts[idx],
    username: payload.username,
    displayName: payload.displayName,
    roleName: payload.roleName,
    permissions: role?.permissions ?? [],
    status: payload.enabled ? 'ACTIVE' : 'INACTIVE',
    updatedAt: new Date().toISOString(),
  }
  return mockAdminAccounts[idx]
}

export async function mockUpdateAdminAccountStatus(payload: { adminUserId: string; status: AdminAccount['status'] }): Promise<AdminAccount> {
  await delay(120)
  const account = mockAdminAccounts.find((a) => a.id === payload.adminUserId)
  if (!account) throw new Error('管理员不存在')
  account.status = payload.status
  account.updatedAt = new Date().toISOString()
  return account
}

export async function mockResetAdminPassword(payload: { adminUserId: string; password: string }): Promise<AdminAccount> {
  await delay(120)
  const account = mockAdminAccounts.find((a) => a.id === payload.adminUserId)
  if (!account) throw new Error('管理员不存在')
  account.updatedAt = new Date().toISOString()
  return account
}

export async function mockListRoles(): Promise<Role[]> {
  await delay(100)
  return mockRoles
}

export async function mockListAuditLogs(params?: {
  page?: number
  pageSize?: number
  keyword?: string
  result?: AuditLog['result']
}): Promise<PageResult<AuditLog>> {
  await delay(160)
  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.max(1, Math.min(200, params?.pageSize ?? 20))
  const keyword = (params?.keyword ?? '').trim().toLowerCase()
  const filtered = mockAuditLogs.filter((log) => {
    if (params?.result && log.result !== params.result) return false
    if (!keyword) return true
    return (log.adminName ?? '').toLowerCase().includes(keyword) || log.requestPath.toLowerCase().includes(keyword)
  })
  const total = filtered.length
  const start = (page - 1) * pageSize
  return { list: filtered.slice(start, start + pageSize), total, page, pageSize }
}
