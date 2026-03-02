import type {
  AdminUser,
  AppUser,
  Category,
  Comment,
  Dish,
  DishSales,
  Feedback,
  Notice,
  Order,
  OrderStatus,
  SupportTicket,
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
