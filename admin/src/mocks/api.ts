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
  mockAdminUser,
  mockCategories,
  mockComments,
  mockDishSales,
  mockDishes,
  mockFeedbacks,
  mockNotices,
  mockOrders,
  mockSupportTickets,
  mockUpdateOrderStatus,
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
