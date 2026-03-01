import axios, { AxiosHeaders } from 'axios'
import { envBool } from '@/lib/env'
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
  mockGetDishSales,
  mockGetProfile,
  mockListComments,
  mockListFeedbacks,
  mockListMenu,
  mockListNotices,
  mockListOrders,
  mockListSupportTickets,
  mockListUsers,
  mockLogin,
  mockUpdateOrder,
} from '@/mocks/api'

export const ADMIN_TOKEN_KEY = 'admin_token'

function useMock(): boolean {
  return envBool('VITE_USE_MOCK', true)
}

const http = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '',
  timeout: 10_000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (token) {
    if (!config.headers) config.headers = new AxiosHeaders()
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set('Authorization', `Bearer ${token}`)
    } else {
      const headers = config.headers as Record<string, unknown>
      headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

export const api = {
  async login(payload: { username: string; password: string }): Promise<{ token: string; user: AdminUser }> {
    if (useMock()) return mockLogin(payload)
    const { data } = await http.post('/api/v1/admin/auth/login', payload)
    return data
  },

  async getProfile(): Promise<AdminUser> {
    if (useMock()) return mockGetProfile()
    const { data } = await http.get('/api/v1/admin/profile')
    return data
  },

  async listNotices(): Promise<Notice[]> {
    if (useMock()) return mockListNotices()
    const { data } = await http.get('/api/v1/admin/notices')
    return data
  },

  async listUsers(): Promise<AppUser[]> {
    if (useMock()) return mockListUsers()
    const { data } = await http.get('/api/v1/admin/users')
    return data
  },

  async listMenu(): Promise<{ categories: Category[]; dishes: Dish[] }> {
    if (useMock()) return mockListMenu()
    const { data } = await http.get('/api/v1/admin/menu')
    return data
  },

  async listOrders(params?: { status?: OrderStatus }): Promise<Order[]> {
    if (useMock()) return mockListOrders(params)
    const { data } = await http.get('/api/v1/admin/orders', { params })
    return data
  },

  async updateOrderStatus(payload: { orderId: string; status: OrderStatus }): Promise<Order> {
    if (useMock()) return mockUpdateOrder(payload)
    const { data } = await http.post(`/api/v1/admin/orders/${payload.orderId}/status`, { status: payload.status })
    return data
  },

  async getDishSales(): Promise<DishSales[]> {
    if (useMock()) return mockGetDishSales()
    const { data } = await http.get('/api/v1/admin/stats/dish-sales')
    return data
  },

  async listComments(): Promise<Comment[]> {
    if (useMock()) return mockListComments()
    const { data } = await http.get('/api/v1/admin/comments')
    return data
  },

  async listFeedbacks(): Promise<Feedback[]> {
    if (useMock()) return mockListFeedbacks()
    const { data } = await http.get('/api/v1/admin/feedbacks')
    return data
  },

  async listSupportTickets(): Promise<SupportTicket[]> {
    if (useMock()) return mockListSupportTickets()
    const { data } = await http.get('/api/v1/admin/support/tickets')
    return data
  },
}
