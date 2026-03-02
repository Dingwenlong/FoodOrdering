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

function nowIso(): string {
  return new Date().toISOString()
}

function money(amountFen: number) {
  return { currency: 'CNY' as const, amountFen }
}

export const mockAdminUser: AdminUser = {
  id: 'admin_1',
  username: 'admin',
  displayName: '店长',
  roleName: '超级管理员',
}

export const mockNotices: Notice[] = [
  {
    id: 'notice_1',
    title: '新品上线：香辣鸡腿堡',
    content: '本周上新，欢迎品尝。',
    createdAt: '2026-03-01T08:00:00.000Z',
    isPinned: true,
  },
  {
    id: 'notice_2',
    title: '营业时间调整',
    content: '周末延长营业至 23:00。',
    createdAt: '2026-02-25T06:00:00.000Z',
    isPinned: false,
  },
]

export const mockUsers: AppUser[] = [
  {
    id: 'u_1',
    nickname: '小张',
    phone: '138****0001',
    createdAt: '2026-01-12T04:10:00.000Z',
    lastActiveAt: nowIso(),
    orderCount: 5,
    status: 'ACTIVE',
  },
  {
    id: 'u_2',
    nickname: '小李',
    createdAt: '2026-02-03T09:22:00.000Z',
    lastActiveAt: '2026-02-28T10:00:00.000Z',
    orderCount: 2,
    status: 'INACTIVE',
  },
]

export const mockCategories: Category[] = [
  { id: 'c_1', name: '主食', sort: 10 },
  { id: 'c_2', name: '小吃', sort: 20 },
  { id: 'c_3', name: '饮品', sort: 30 },
]

export const mockDishes: Dish[] = [
  {
    id: 'd_1',
    categoryId: 'c_1',
    name: '牛肉饭',
    priceFen: 2800,
    onSale: true,
    soldOut: false,
  },
  {
    id: 'd_2',
    categoryId: 'c_2',
    name: '炸鸡翅',
    priceFen: 1600,
    onSale: true,
    soldOut: false,
  },
  {
    id: 'd_3',
    categoryId: 'c_3',
    name: '柠檬茶',
    priceFen: 1200,
    onSale: true,
    soldOut: true,
  },
]

function calcTotal(items: Order['items']): Order['totalPrice'] {
  const total = items.reduce((sum, it) => sum + it.unitPrice.amountFen * it.qty, 0)
  return money(total)
}

export const mockOrders: Order[] = [
  {
    id: 'o_10001',
    storeId: 'store_1',
    tableId: 't_8',
    tableName: '8号桌',
    status: 'PAID',
    items: [
      {
        dishId: 'd_1',
        dishName: '牛肉饭',
        unitPrice: money(2800),
        qty: 1,
      },
      {
        dishId: 'd_2',
        dishName: '炸鸡翅',
        unitPrice: money(1600),
        qty: 1,
      },
    ],
    totalPrice: money(0),
    remark: '少辣',
    createdAt: '2026-03-01T07:30:00.000Z',
  },
  {
    id: 'o_10002',
    storeId: 'store_1',
    tableId: 't_3',
    tableName: '3号桌',
    status: 'COOKING',
    items: [
      {
        dishId: 'd_1',
        dishName: '牛肉饭',
        unitPrice: money(2800),
        qty: 2,
      },
    ],
    totalPrice: money(0),
    createdAt: '2026-03-01T06:50:00.000Z',
  },
  {
    id: 'o_10003',
    storeId: 'store_1',
    tableId: 't_1',
    tableName: '1号桌',
    status: 'DONE',
    items: [
      {
        dishId: 'd_3',
        dishName: '柠檬茶',
        unitPrice: money(1200),
        qty: 2,
      },
    ],
    totalPrice: money(0),
    createdAt: '2026-02-28T11:15:00.000Z',
  },
]

for (const o of mockOrders) {
  o.totalPrice = calcTotal(o.items)
}

export const mockDishSales: DishSales[] = [
  { dishId: 'd_1', dishName: '牛肉饭', soldQty: 128 },
  { dishId: 'd_2', dishName: '炸鸡翅', soldQty: 96 },
  { dishId: 'd_3', dishName: '柠檬茶', soldQty: 72 },
]

export const mockComments: Comment[] = [
  {
    id: 'cm_1',
    orderId: 'o_10003',
    dishName: '柠檬茶',
    nickname: '小李',
    rating: 5,
    content: '口感清爽，点赞。',
    createdAt: '2026-02-28T12:00:00.000Z',
  },
]

export const mockFeedbacks: Feedback[] = [
  {
    id: 'fb_1',
    nickname: '小张',
    content: '希望增加不辣选项提示。',
    createdAt: '2026-03-01T07:10:00.000Z',
    status: 'OPEN',
  },
]

export const mockSupportTickets: SupportTicket[] = [
  {
    id: 'st_1',
    nickname: '小王',
    topic: '支付失败如何处理？',
    lastMessageAt: '2026-03-01T07:40:00.000Z',
    status: 'OPEN',
  },
]

export function mockUpdateOrderStatus(orderId: string, status: OrderStatus): Order {
  const found = mockOrders.find((o) => o.id === orderId)
  if (!found) throw new Error('订单不存在')
  found.status = status
  return found
}

function idSeq(prefix: string, source: { id: string }[]): string {
  const nums = source
    .map((it) => {
      const match = it.id.match(/(\d+)$/)
      return match ? Number(match[1]) : 0
    })
    .filter((n) => Number.isFinite(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${next}`
}

export function mockCreateNotice(payload: { title: string; content: string; isPinned: boolean }): Notice {
  const notice: Notice = {
    id: idSeq('notice_', mockNotices),
    title: payload.title,
    content: payload.content,
    isPinned: payload.isPinned,
    createdAt: nowIso(),
  }
  mockNotices.unshift(notice)
  return notice
}

export function mockUpdateNotice(payload: { noticeId: string; title: string; content: string; isPinned: boolean }): Notice {
  const idx = mockNotices.findIndex((n) => n.id === payload.noticeId)
  if (idx < 0) throw new Error('公告不存在')
  const current = mockNotices[idx]
  const next: Notice = {
    ...current,
    title: payload.title,
    content: payload.content,
    isPinned: payload.isPinned,
  }
  mockNotices[idx] = next
  return next
}

export function mockDeleteNotice(noticeId: string): void {
  const idx = mockNotices.findIndex((n) => n.id === noticeId)
  if (idx < 0) throw new Error('公告不存在')
  mockNotices.splice(idx, 1)
}

export function mockCreateDish(payload: {
  categoryId: string
  name: string
  priceFen: number
  onSale: boolean
  soldOut: boolean
}): Dish {
  const dish: Dish = {
    id: idSeq('d_', mockDishes),
    categoryId: payload.categoryId,
    name: payload.name,
    priceFen: payload.priceFen,
    onSale: payload.onSale,
    soldOut: payload.soldOut,
  }
  mockDishes.unshift(dish)
  return dish
}

export function mockUpdateDish(payload: {
  dishId: string
  categoryId: string
  name: string
  priceFen: number
  onSale: boolean
  soldOut: boolean
}): Dish {
  const idx = mockDishes.findIndex((d) => d.id === payload.dishId)
  if (idx < 0) throw new Error('菜品不存在')
  const next: Dish = {
    id: payload.dishId,
    categoryId: payload.categoryId,
    name: payload.name,
    priceFen: payload.priceFen,
    onSale: payload.onSale,
    soldOut: payload.soldOut,
  }
  mockDishes[idx] = next
  return next
}

export function mockDeleteDish(dishId: string): void {
  const idx = mockDishes.findIndex((d) => d.id === dishId)
  if (idx < 0) throw new Error('菜品不存在')
  mockDishes.splice(idx, 1)
}

export function mockUpdateUserStatus(payload: { userId: string; status: 'ACTIVE' | 'INACTIVE' }): AppUser {
  const idx = mockUsers.findIndex((u) => u.id === payload.userId)
  if (idx < 0) throw new Error('用户不存在')
  const current = mockUsers[idx]
  const next: AppUser = {
    ...current,
    status: payload.status,
  }
  mockUsers[idx] = next
  return next
}

export function mockUpdateFeedback(payload: { feedbackId: string; status: Feedback['status'] }): Feedback {
  const idx = mockFeedbacks.findIndex((f) => f.id === payload.feedbackId)
  if (idx < 0) throw new Error('留言不存在')
  const current = mockFeedbacks[idx]
  const next: Feedback = {
    ...current,
    status: payload.status,
  }
  mockFeedbacks[idx] = next
  return next
}

export function mockUpdateSupportTicket(payload: { ticketId: string; status: SupportTicket['status'] }): SupportTicket {
  const idx = mockSupportTickets.findIndex((t) => t.id === payload.ticketId)
  if (idx < 0) throw new Error('工单不存在')
  const current = mockSupportTickets[idx]
  const next: SupportTicket = {
    ...current,
    status: payload.status,
    lastMessageAt: nowIso(),
  }
  mockSupportTickets[idx] = next
  return next
}
