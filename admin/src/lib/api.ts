import axios, { AxiosHeaders } from 'axios'
import { envBool } from '@/lib/env'
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
  SendMessageRequest,
  StatsSummary,
  StatsTrendPoint,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketMessage,
  SystemSettings,
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
  mockListOrdersPaged,
  mockGetOrderDetail,
  mockGetStatsSummary,
  mockGetStatsTrend,
  mockGetSystemSettings,
  mockUpdateSystemSettings,
  mockGetTableQrPayload,
  mockListAdminAccounts,
  mockCreateAdminAccount,
  mockUpdateAdminAccount,
  mockUpdateAdminAccountStatus,
  mockResetAdminPassword,
  mockListRoles,
  mockListAuditLogs,
  mockCreateCategoryApi,
  mockUpdateCategoryApi,
  mockDeleteCategoryApi,
  mockListTablesPaged,
  mockGetTableDetail,
  mockCreateTable,
  mockUpdateTable,
  mockDeleteTable,
  mockUpdateTableStatus,
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
    const pageResult = await fromHttp<PageResult<Order>>(() => http.get(`${ADMIN_API_PREFIX}/orders`, { params }))
    return pageResult.list
  },

  async listOrdersPaged(params?: {
    page?: number
    pageSize?: number
    status?: OrderStatus
    keyword?: string
    tableId?: string
    userId?: string
    from?: string
    to?: string
  }): Promise<PageResult<Order>> {
    if (useMock()) return fromMock(() => mockListOrdersPaged(params))
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/orders`, { params }))
  },

  async getOrderDetail(orderId: string): Promise<Order> {
    if (useMock()) return fromMock(() => mockGetOrderDetail(orderId))
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/orders/${orderId}`))
  },

  async updateOrderStatus(payload: { orderId: string; status: OrderStatus }): Promise<Order> {
    if (useMock()) return fromMock(() => mockUpdateOrder(payload))
    return fromHttp(() => http.post(`${ADMIN_API_PREFIX}/orders/${payload.orderId}/status`, { status: payload.status }))
  },

  async getDishSales(): Promise<DishSales[]> {
    if (useMock()) return fromMock(() => mockGetDishSales())
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/stats/dish-sales`))
  },

  async getStatsSummary(params?: { from?: string; to?: string }): Promise<StatsSummary> {
    if (useMock()) return fromMock(() => mockGetStatsSummary(params))
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/stats/summary`, { params }))
  },

  async getStatsTrend(params?: { from?: string; to?: string }): Promise<StatsTrendPoint[]> {
    if (useMock()) return fromMock(() => mockGetStatsTrend(params))
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/stats/trend`, { params }))
  },

  async getSystemSettings(): Promise<SystemSettings> {
    if (useMock()) return fromMock(() => mockGetSystemSettings())
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/settings`))
  },

  async updateSystemSettings(payload: SystemSettings): Promise<SystemSettings> {
    if (useMock()) return fromMock(() => mockUpdateSystemSettings(payload))
    return fromHttp(() => http.put(`${ADMIN_API_PREFIX}/settings`, payload))
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
    description?: string
    image?: string
    sort?: number
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
    description?: string
    image?: string
    sort?: number
  }): Promise<Dish> {
    if (useMock()) return fromMock(() => mockUpdateDishApi(payload))
    const { dishId, ...body } = payload
    return fromHttp(() => http.put(`${ADMIN_API_PREFIX}/dishes/${dishId}`, body))
  },

  async deleteDish(dishId: string): Promise<void> {
    if (useMock()) return fromMock(() => mockDeleteDishApi({ dishId }))
    return fromHttp(() => http.delete(`${ADMIN_API_PREFIX}/dishes/${dishId}`))
  },

  async createCategory(payload: { name: string; sort: number; enabled?: boolean }): Promise<Category> {
    if (useMock()) return fromMock(() => mockCreateCategoryApi(payload))
    return fromHttp(() => http.post(`${ADMIN_API_PREFIX}/categories`, payload))
  },

  async updateCategory(payload: { categoryId: string; name: string; sort: number; enabled?: boolean }): Promise<Category> {
    if (useMock()) return fromMock(() => mockUpdateCategoryApi(payload))
    const { categoryId, ...body } = payload
    return fromHttp(() => http.put(`${ADMIN_API_PREFIX}/categories/${categoryId}`, body))
  },

  async deleteCategory(categoryId: string): Promise<void> {
    if (useMock()) return fromMock(() => mockDeleteCategoryApi({ categoryId }))
    return fromHttp(() => http.delete(`${ADMIN_API_PREFIX}/categories/${categoryId}`))
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
    if (useMock()) return fromMock(() => mockListTablesPaged(params))
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/tables`, { params }))
  },

  async getTableDetail(tableId: string): Promise<Table> {
    if (useMock()) return fromMock(() => mockGetTableDetail(tableId))
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/tables/${tableId}`))
  },

  async createTable(payload: {
    tableNo: string
    capacity: number
    location?: string
    area?: string
  }): Promise<Table> {
    if (useMock()) return fromMock(() => mockCreateTable(payload))
    return fromHttp(() => http.post(`${ADMIN_API_PREFIX}/tables`, payload))
  },

  async updateTable(payload: {
    tableId: string
    tableNo: string
    capacity: number
    location?: string
    area?: string
  }): Promise<Table> {
    if (useMock()) return fromMock(() => mockUpdateTable(payload))
    const { tableId, ...body } = payload
    return fromHttp(() => http.put(`${ADMIN_API_PREFIX}/tables/${tableId}`, body))
  },

  async deleteTable(tableId: string): Promise<void> {
    if (useMock()) return fromMock(() => mockDeleteTable(tableId))
    return fromHttp(() => http.delete(`${ADMIN_API_PREFIX}/tables/${tableId}`))
  },

  async updateTableStatus(payload: { tableId: string; status: TableStatus }): Promise<Table> {
    if (useMock()) return fromMock(() => mockUpdateTableStatus(payload))
    const { tableId, status } = payload
    return fromHttp(() => http.patch(`${ADMIN_API_PREFIX}/tables/${tableId}/status`, { status }))
  },

  async getTableQrPayload(tableId: string): Promise<QrPayload> {
    if (useMock()) return fromMock(() => mockGetTableQrPayload(tableId))
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/tables/${tableId}/qr-payload`))
  },

  async listAdminAccounts(params?: {
    page?: number
    pageSize?: number
    keyword?: string
    roleName?: string
    status?: AdminAccount['status']
  }): Promise<PageResult<AdminAccount>> {
    if (useMock()) return fromMock(() => mockListAdminAccounts(params))
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/admin-users`, { params }))
  },

  async createAdminAccount(payload: {
    username: string
    password: string
    displayName: string
    roleName: string
    enabled: boolean
  }): Promise<AdminAccount> {
    if (useMock()) return fromMock(() => mockCreateAdminAccount(payload))
    return fromHttp(() => http.post(`${ADMIN_API_PREFIX}/admin-users`, payload))
  },

  async updateAdminAccount(payload: {
    adminUserId: string
    username: string
    displayName: string
    roleName: string
    enabled: boolean
  }): Promise<AdminAccount> {
    if (useMock()) return fromMock(() => mockUpdateAdminAccount(payload))
    const { adminUserId, ...body } = payload
    return fromHttp(() => http.put(`${ADMIN_API_PREFIX}/admin-users/${adminUserId}`, body))
  },

  async updateAdminAccountStatus(payload: { adminUserId: string; status: AdminAccount['status'] }): Promise<AdminAccount> {
    if (useMock()) return fromMock(() => mockUpdateAdminAccountStatus(payload))
    const { adminUserId, status } = payload
    return fromHttp(() => http.patch(`${ADMIN_API_PREFIX}/admin-users/${adminUserId}/status`, { status }))
  },

  async resetAdminPassword(payload: { adminUserId: string; password: string }): Promise<AdminAccount> {
    if (useMock()) return fromMock(() => mockResetAdminPassword(payload))
    const { adminUserId, password } = payload
    return fromHttp(() => http.post(`${ADMIN_API_PREFIX}/admin-users/${adminUserId}/reset-password`, { password }))
  },

  async listRoles(): Promise<Role[]> {
    if (useMock()) return fromMock(() => mockListRoles())
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/roles`))
  },

  async listAuditLogs(params?: {
    page?: number
    pageSize?: number
    keyword?: string
    result?: AuditLog['result']
  }): Promise<PageResult<AuditLog>> {
    if (useMock()) return fromMock(() => mockListAuditLogs(params))
    return fromHttp(() => http.get(`${ADMIN_API_PREFIX}/audit-logs`, { params }))
  },
}
