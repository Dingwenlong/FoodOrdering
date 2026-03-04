import type {
  AdminUser,
  AppUser,
  AppUserDetail,
  Category,
  Comment,
  Dish,
  DishSales,
  Feedback,
  Notice,
  Order,
  OrderStatus,
  PageResult,
  SupportTicket,
  SupportTicketDetail,
} from '@/types'
import {
  mockCreateDish,
  mockCreateNotice,
  mockDeleteDish,
  mockDeleteNotice,
  mockAdminUser,
  mockCategories,
  mockComments,
  mockDishSales,
  mockDishes,
  mockFeedbacks,
  mockNotices,
  mockOrders,
  mockSupportTickets,
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

export async function mockUpdateOrder(payload: { orderId: string; status: OrderStatus }): Promise<Order> {
  await delay(180)
  return mockUpdateOrderStatus(payload.orderId, payload.status)
}

export async function mockGetDishSales(): Promise<DishSales[]> {
  await delay(180)
  return [...mockDishSales]
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
}): Promise<Dish> {
  await delay(180)
  return mockUpdateDish(payload)
}

export async function mockDeleteDishApi(payload: { dishId: string }): Promise<void> {
  await delay(120)
  mockDeleteDish(payload.dishId)
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
