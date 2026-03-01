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
  },
  {
    id: 'u_2',
    nickname: '小李',
    createdAt: '2026-02-03T09:22:00.000Z',
    lastActiveAt: '2026-02-28T10:00:00.000Z',
    orderCount: 2,
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
