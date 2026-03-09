import axios, { AxiosHeaders } from 'axios'
import { envBool } from '@/lib/env'
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
  SendMessageRequest,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketMessage,
  Table,
  TableStatus,
} from '@/types'
import {
  mockCreateDishApi,
  mockCreateNoticeApi,
  mockDeleteDishApi,
  mockDeleteNoticeApi,
  mockGetDishSales,
  mockGetProfile,
  mockListComments,
  mockListFeedbacks,
  mockListMenu,
  mockListNotices,
  mockListOrders,
  mockListSupportTickets,
  mockListSupportTicketsPaged,
  mockListUsers,
  mockListUsersPaged,
  mockLogin,
  mockUpdateDishApi,
  mockUpdateFeedbackStatusApi,
  mockUpdateOrder,
  mockUpdateNoticeApi,
  mockUpdateSupportTicketStatusApi,
  mockUpdateUserStatusApi,
  mockGetUserDetail,
  mockGetSupportTicketDetail,
} from '@/mocks/api'

export const ADMIN_TOKEN_KEY = 'admin_token'
const API_PREFIX = (import.meta.env.VITE_API_PREFIX as string | undefined) ?? '/api/v1'
const ADMIN_API_PREFIX = `${API_PREFIX}/admin`

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  timestamp?: string
}

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

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
    }
    return Promise.reject(new Error(resolveErrorMessage(error)))
  },
)

function wrapMock<T>(data: T): ApiEnvelope<T> {
  return {
    code: 0,
    message: 'OK',
    data,
    timestamp: new Date().toISOString(),
  }
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (!payload || typeof payload !== 'object') return payload as T
  const maybeEnvelope = payload as Partial<ApiEnvelope<T>>
  if (typeof maybeEnvelope.code === 'number' && 'data' in maybeEnvelope) {
    if (maybeEnvelope.code !== 0) {
      throw new Error(maybeEnvelope.message || '请求失败')
    }
    return maybeEnvelope.data as T
  }
  return payload as T
}

function resolveErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : '请求失败'
  }
  const payload = error.response?.data
  if (payload && typeof payload === 'object') {
    const maybeMessage = (payload as { message?: unknown }).message
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage
    }
  }
  return error.message || '请求失败'
}

async function fromHttp<T>(executor: () => Promise<{ data: unknown }>): Promise<T> {
  const { data } = await executor()
  return unwrapEnvelope<T>(data)
}

async function fromMock<T>(executor: () => Promise<T>): Promise<T> {
  const data = await executor()
  return unwrapEnvelope<T>(wrapMock(data))
}

export const api = {
  async login(payload: { username: string; password: string }): Promise<{ token: string; user: AdminUser }> {
    if (useMock()) return fromMock(() => mockLogin(payload))
    return fromHttp(() => http.post(`${ADMIN_API_PREFIX}/auth/login`, payload))
  },

  async getProfile(): Promise<AdminUser> {
    if (useMock()) return fromMock(() => mockGetProfile())
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/profile`))
  },

  async listNotices(): Promise<Notice[]> {
    if (useMock()) return fromMock(() => mockListNotices())
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/notices`))
  },

  async listUsers(): Promise<AppUser[]> {
    if (useMock()) return fromMock(() => mockListUsers())
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/users`))
  },

  async listUsersPaged(params?: {
    page?: number
    pageSize?: number
    keyword?: string
    status?: AppUser['status']
  }): Promise<PageResult<AppUser>> {
    if (useMock()) return fromMock(() => mockListUsersPaged(params))
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/users`, { params }))
  },

  async getUserDetail(userId: string): Promise<AppUserDetail> {
    if (useMock()) return fromMock(() => mockGetUserDetail(userId))
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/users/${userId}`))
  },

  async listMenu(): Promise<{ categories: Category[]; dishes: Dish[] }> {
    if (useMock()) return fromMock(() => mockListMenu())
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/menu`))
  },

  async listOrders(params?: { status?: OrderStatus }): Promise<Order[]> {
    if (useMock()) return fromMock(() => mockListOrders(params))
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/orders`, { params }))
  },

  async updateOrderStatus(payload: { orderId: string; status: OrderStatus }): Promise<Order> {
    if (useMock()) return fromMock(() => mockUpdateOrder(payload))
    return fromHttp(() => http.post(`${ADMIN_API_PREFIX}/orders/${payload.orderId}/status`, { status: payload.status }))
  },

  async getDishSales(): Promise<DishSales[]> {
    if (useMock()) return fromMock(() => mockGetDishSales())
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/stats/dish-sales`))
  },

  async listComments(): Promise<Comment[]> {
    if (useMock()) return fromMock(() => mockListComments())
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/comments`))
  },

  async listFeedbacks(): Promise<Feedback[]> {
    if (useMock()) return fromMock(() => mockListFeedbacks())
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/feedbacks`))
  },

  async listSupportTickets(): Promise<SupportTicket[]> {
    if (useMock()) return fromMock(() => mockListSupportTickets())
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/support/tickets`))
  },

  async listSupportTicketsPaged(params?: {
    page?: number
    pageSize?: number
    keyword?: string
    status?: SupportTicket['status']
  }): Promise<PageResult<SupportTicket>> {
    if (useMock()) return fromMock(() => mockListSupportTicketsPaged(params))
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/support/tickets`, { params }))
  },

  async getSupportTicketDetail(ticketId: string): Promise<SupportTicketDetail> {
    if (useMock()) return fromMock(() => mockGetSupportTicketDetail(ticketId))
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/support/tickets/${ticketId}`))
  },

  async createNotice(payload: { title: string; content: string; isPinned: boolean }): Promise<Notice> {
    if (useMock()) return fromMock(() => mockCreateNoticeApi(payload))
    return fromHttp(() => http.post(`${ADMIN_API_PREFIX}/notices`, payload))
  },

  async updateNotice(payload: { noticeId: string; title: string; content: string; isPinned: boolean }): Promise<Notice> {
    if (useMock()) return fromMock(() => mockUpdateNoticeApi(payload))
    const { noticeId, ...body } = payload
    return fromHttp(() => http.put(`${ADMIN_API_PREFIX}/notices/${noticeId}`, body))
  },

  async deleteNotice(noticeId: string): Promise<void> {
    if (useMock()) return fromMock(() => mockDeleteNoticeApi({ noticeId }))
    return fromHttp(() => http.delete(`${ADMIN_API_PREFIX}/notices/${noticeId}`))
  },

  async createDish(payload: {
    categoryId: string
    name: string
    priceFen: number
    onSale: boolean
    soldOut: boolean
  }): Promise<Dish> {
    if (useMock()) return fromMock(() => mockCreateDishApi(payload))
    return fromHttp(() => http.post(`${ADMIN_API_PREFIX}/dishes`, payload))
  },

  async updateDish(payload: {
    dishId: string
    categoryId: string
    name: string
    priceFen: number
    onSale: boolean
    soldOut: boolean
  }): Promise<Dish> {
    if (useMock()) return fromMock(() => mockUpdateDishApi(payload))
    const { dishId, ...body } = payload
    return fromHttp(() => http.put(`${ADMIN_API_PREFIX}/dishes/${dishId}`, body))
  },

  async deleteDish(dishId: string): Promise<void> {
    if (useMock()) return fromMock(() => mockDeleteDishApi({ dishId }))
    return fromHttp(() => http.delete(`${ADMIN_API_PREFIX}/dishes/${dishId}`))
  },

  async updateUserStatus(payload: { userId: string; status: 'ACTIVE' | 'INACTIVE' }): Promise<{ id: string; status: 'ACTIVE' | 'INACTIVE' }> {
    if (useMock()) return fromMock(() => mockUpdateUserStatusApi(payload))
    const { userId, status } = payload
    return fromHttp(() => http.patch(`${ADMIN_API_PREFIX}/users/${userId}/status`, { status }))
  },

  async updateFeedbackStatus(payload: { feedbackId: string; status: Feedback['status'] }): Promise<Feedback> {
    if (useMock()) return fromMock(() => mockUpdateFeedbackStatusApi(payload))
    const { feedbackId, status } = payload
    return fromHttp(() => http.patch(`${ADMIN_API_PREFIX}/feedbacks/${feedbackId}/status`, { status }))
  },

  async updateSupportTicketStatus(payload: { ticketId: string; status: SupportTicket['status'] }): Promise<SupportTicket> {
    if (useMock()) return fromMock(() => mockUpdateSupportTicketStatusApi(payload))
    const { ticketId, status } = payload
    return fromHttp(() => http.patch(`${ADMIN_API_PREFIX}/support/tickets/${ticketId}/status`, { status }))
  },

  async listTicketMessages(ticketId: string, params?: { page?: number; pageSize?: number }): Promise<PageResult<SupportTicketMessage>> {
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/support/tickets/${ticketId}/messages`, { params }))
  },

  async sendTicketMessage(ticketId: string, request: SendMessageRequest): Promise<SupportTicketMessage> {
    return fromHttp(() => http.post(`${ADMIN_API_PREFIX}/support/tickets/${ticketId}/messages`, request))
  },

  async listTablesPaged(params?: {
    page?: number
    pageSize?: number
    keyword?: string
    status?: TableStatus
    area?: string
  }): Promise<PageResult<Table>> {
    if (useMock()) {
      const mockTables: Table[] = [
        { id: '1', tableNo: 'A01', capacity: 4, status: 'IDLE', location: '一楼大厅', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', tableNo: 'A02', capacity: 6, status: 'OCCUPIED', location: '一楼大厅', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '3', tableNo: 'B01', capacity: 8, status: 'IDLE', location: '二楼包间', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '4', tableNo: 'B02', capacity: 4, status: 'MAINTENANCE', location: '二楼包间', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ]
      return fromMock(() => Promise.resolve({
        list: mockTables,
        total: mockTables.length,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 20,
      }))
    }
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/tables`, { params }))
  },

  async getTableDetail(tableId: string): Promise<Table> {
    if (useMock()) {
      return fromMock(() => Promise.resolve({
        id: tableId,
        tableNo: 'A01',
        capacity: 4,
        status: 'IDLE',
        location: '一楼大厅',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    }
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/tables/${tableId}`))
  },

  async createTable(payload: {
    tableNo: string
    capacity: number
    location?: string
    area?: string
  }): Promise<Table> {
    if (useMock()) {
      return fromMock(() => Promise.resolve({
        id: String(Date.now()),
        tableNo: payload.tableNo,
        capacity: payload.capacity,
        status: 'IDLE',
        location: payload.location,
        area: payload.area,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    }
    return fromHttp(() => http.post(`${ADMIN_API_PREFIX}/tables`, payload))
  },

  async updateTable(payload: {
    tableId: string
    tableNo: string
    capacity: number
    location?: string
    area?: string
  }): Promise<Table> {
    if (useMock()) {
      return fromMock(() => Promise.resolve({
        id: payload.tableId,
        tableNo: payload.tableNo,
        capacity: payload.capacity,
        status: 'IDLE',
        location: payload.location,
        area: payload.area,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    }
    const { tableId, ...body } = payload
    return fromHttp(() => http.put(`${ADMIN_API_PREFIX}/tables/${tableId}`, body))
  },

  async deleteTable(tableId: string): Promise<void> {
    if (useMock()) {
      return fromMock(() => Promise.resolve())
    }
    return fromHttp(() => http.delete(`${ADMIN_API_PREFIX}/tables/${tableId}`))
  },

  async updateTableStatus(payload: { tableId: string; status: TableStatus }): Promise<Table> {
    if (useMock()) {
      return fromMock(() => Promise.resolve({
        id: payload.tableId,
        tableNo: 'A01',
        capacity: 4,
        status: payload.status,
        location: '一楼大厅',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    }
    const { tableId, status } = payload
    return fromHttp(() => http.patch(`${ADMIN_API_PREFIX}/tables/${tableId}/status`, { status }))
  },
}
