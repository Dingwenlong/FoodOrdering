import { mockCategories, mockOrders, mockStoreSession, mockNotices, mockComments } from '../mock/data';
import type {
  BindTablePayload,
  BindTableResult,
  Category,
  CreateOrderPayload,
  Dish,
  Order,
  PrepayPayload,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketMessage,
  UrgeOrderResult,
  WechatLoginResult,
} from '../types/index';

const MOCK_FLAG_KEY = 'MP_USE_MOCK';
const API_BASE_URL_KEY = 'MP_API_BASE_URL';
const MOCK_ORDERS_KEY = 'MP_MOCK_ORDERS';
const MOCK_COMMENTS_KEY = 'MP_MOCK_COMMENTS';
const MOCK_SUPPORT_TICKETS_KEY = 'MP_MOCK_SUPPORT_TICKETS';
const MOCK_SUPPORT_MESSAGES_KEY = 'MP_MOCK_SUPPORT_MESSAGES';

const BASE_URL = (wx.getStorageSync(API_BASE_URL_KEY) as string) || 'http://localhost:8080';
const API_PREFIX = '/api/v1';

export const STORAGE_KEYS = {
  session: 'storeSession',
  cart: 'cart',
  cartRemark: 'cartRemark',
  lastOrderId: 'lastOrderId',
  clientToken: 'clientToken',
  clientUser: 'clientUser',
};

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
  timestamp?: string;
};

type RequestResult<T> = {
  data: T;
  statusCode: number;
  message?: string;
};

type UrlInfo = {
  path: string;
  query: Record<string, string>;
};

const mockState = {
  orders: initMockOrders(),
  comments: initMockComments(),
  supportTickets: initMockSupportTickets(),
  supportMessages: initMockSupportMessages(),
};

function cloneOrders(list: Order[]): Order[] {
  return list.map((order) => ({
    ...order,
    items: order.items.map((item) => ({ ...item })),
  }));
}

function cloneComments(list: Array<Record<string, any>>) {
  return list.map((item) => ({ ...item }));
}

function initMockOrders(): Order[] {
  const cached = wx.getStorageSync(MOCK_ORDERS_KEY);
  if (Array.isArray(cached) && cached.length > 0) {
    return cloneOrders(cached as Order[]);
  }
  const seed = cloneOrders(mockOrders);
  wx.setStorageSync(MOCK_ORDERS_KEY, seed);
  return seed;
}

function initMockComments(): Array<Record<string, any>> {
  const cached = wx.getStorageSync(MOCK_COMMENTS_KEY);
  if (Array.isArray(cached) && cached.length > 0) {
    return cloneComments(cached as Array<Record<string, any>>);
  }
  const seed = cloneComments(mockComments);
  wx.setStorageSync(MOCK_COMMENTS_KEY, seed);
  return seed;
}

function initMockSupportTickets(): SupportTicket[] {
  const cached = wx.getStorageSync(MOCK_SUPPORT_TICKETS_KEY);
  if (Array.isArray(cached) && cached.length > 0) {
    return cached as SupportTicket[];
  }
  const now = new Date().toISOString();
  const seed: SupportTicket[] = [
    { id: 'st_1', nickname: '匿名用户', topic: '支付失败如何处理？', lastMessageAt: now, status: 'OPEN' },
  ];
  wx.setStorageSync(MOCK_SUPPORT_TICKETS_KEY, seed);
  return seed;
}

function initMockSupportMessages(): SupportTicketMessage[] {
  const cached = wx.getStorageSync(MOCK_SUPPORT_MESSAGES_KEY);
  if (Array.isArray(cached) && cached.length > 0) {
    return cached as SupportTicketMessage[];
  }
  const now = new Date().toISOString();
  const seed: SupportTicketMessage[] = [
    {
      id: 'stm_1',
      ticketId: 'st_1',
      senderType: 'USER',
      senderId: 'mock_user',
      senderName: '匿名用户',
      content: '支付时提示失败，但订单还在待支付。',
      isRead: false,
      createdAt: now,
    },
    {
      id: 'stm_2',
      ticketId: 'st_1',
      senderType: 'ADMIN',
      senderId: 'admin',
      senderName: '店长',
      content: '您好，可以重新发起支付；如果仍失败，我们会帮您核查。',
      isRead: false,
      createdAt: now,
    },
  ];
  wx.setStorageSync(MOCK_SUPPORT_MESSAGES_KEY, seed);
  return seed;
}

function persistMockState() {
  wx.setStorageSync(MOCK_ORDERS_KEY, cloneOrders(mockState.orders));
  wx.setStorageSync(MOCK_COMMENTS_KEY, cloneComments(mockState.comments));
  wx.setStorageSync(MOCK_SUPPORT_TICKETS_KEY, mockState.supportTickets.map((item) => ({ ...item })));
  wx.setStorageSync(MOCK_SUPPORT_MESSAGES_KEY, mockState.supportMessages.map((item) => ({ ...item })));
}

export function shouldUseMock(): boolean {
  return wx.getStorageSync(MOCK_FLAG_KEY) !== false;
}

const successEnvelope = <T>(data: T): ApiEnvelope<T> => ({
  code: 0,
  message: 'OK',
  data,
  timestamp: new Date().toISOString(),
});

const unwrapEnvelope = <T>(payload: any): { data: T; message: string } => {
  if (payload && typeof payload === 'object' && typeof payload.code === 'number' && 'data' in payload) {
    if (payload.code !== 0) {
      throw new Error(payload.message || '请求失败');
    }
    return { data: payload.data as T, message: payload.message || 'OK' };
  }
  return { data: payload as T, message: 'OK' };
};

const requestDelay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function parseUrl(rawUrl: string): UrlInfo {
  const [rawPath, rawQuery = ''] = rawUrl.split('?');
  const path = rawPath || '/';
  const query: Record<string, string> = {};
  if (!rawQuery) {
    return { path, query };
  }

  rawQuery.split('&').forEach((kv) => {
    if (!kv) return;
    const [k, v = ''] = kv.split('=');
    if (!k) return;
    query[decodeURIComponent(k)] = decodeURIComponent(v);
  });
  return { path, query };
}

function normalizeApiPath(path: string): string {
  if (path.startsWith(API_PREFIX)) {
    const normalized = path.slice(API_PREFIX.length);
    return normalized || '/';
  }
  if (path.startsWith('/api/v1')) {
    const normalized = path.slice('/api/v1'.length);
    return normalized || '/';
  }
  return path;
}

function resolveUrl(rawUrl: string): string {
  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }
  if (rawUrl.startsWith('/api/')) {
    return `${BASE_URL}${rawUrl}`;
  }
  if (rawUrl.startsWith('/')) {
    return `${BASE_URL}${API_PREFIX}${rawUrl}`;
  }
  return `${BASE_URL}${API_PREFIX}/${rawUrl}`;
}

function wxLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code);
          return;
        }
        reject(new Error('微信登录未返回 code'));
      },
      fail: (err) => reject(new Error(err.errMsg || '微信登录失败')),
    });
  });
}

async function ensureClientToken(): Promise<string> {
  const cached = wx.getStorageSync(STORAGE_KEYS.clientToken);
  if (cached && typeof cached === 'string') {
    return cached;
  }

  const code = await wxLogin();
  const result = await rawRequest<WechatLoginResult>({
    url: '/auth/wechat-login',
    method: 'POST',
    data: { code },
  });
  if (!result.data?.token) {
    throw new Error('登录态获取失败');
  }
  wx.setStorageSync(STORAGE_KEYS.clientToken, result.data.token);
  wx.setStorageSync(STORAGE_KEYS.clientUser, result.data.user);
  return result.data.token;
}

function getMethod(options: WechatMiniprogram.RequestOption): string {
  return (options.method || 'GET').toUpperCase();
}

function findDishById(dishId: string): Dish | null {
  for (const category of mockCategories) {
    const dish = category.dishes.find((item) => item.id === dishId);
    if (dish) return dish;
  }
  return null;
}

function normalizeMenu(payload: any): { storeId: string; storeName: string; categories: Category[] } {
  if (Array.isArray(payload)) {
    return {
      storeId: mockStoreSession.storeId,
      storeName: mockStoreSession.storeName,
      categories: payload as Category[],
    };
  }

  if (payload && typeof payload === 'object' && Array.isArray(payload.categories)) {
    return {
      storeId: String(payload.storeId || mockStoreSession.storeId),
      storeName: String(payload.storeName || mockStoreSession.storeName),
      categories: payload.categories as Category[],
    };
  }

  return {
    storeId: mockStoreSession.storeId,
    storeName: mockStoreSession.storeName,
    categories: [],
  };
}

function normalizeOrder(rawOrder: any): Order {
  const rawItems = Array.isArray(rawOrder?.items) ? rawOrder.items : [];

  const items = rawItems.map((item: any) => {
    const unitPriceFen = item?.unitPriceFen ?? item?.unitPrice?.amountFen ?? 0;
    return {
      dishId: String(item?.dishId || ''),
      dishName: String(item?.dishName || ''),
      unitPriceFen: Number(unitPriceFen) || 0,
      qty: Number(item?.qty) || 0,
    };
  });

  const totalPriceFen = Number(rawOrder?.totalPriceFen ?? rawOrder?.totalPrice?.amountFen ?? 0) || 0;

  return {
    id: String(rawOrder?.id || ''),
    storeId: String(rawOrder?.storeId || mockStoreSession.storeId),
    tableId: String(rawOrder?.tableId || mockStoreSession.tableId),
    tableName: String(rawOrder?.tableName || mockStoreSession.tableName),
    status: String(rawOrder?.status || 'PENDING_PAY') as Order['status'],
    items,
    totalPriceFen,
    remark: rawOrder?.remark ? String(rawOrder.remark) : '',
    createdAt: String(rawOrder?.createdAt || new Date().toISOString()),
  };
}

function buildMockOrder(payload: CreateOrderPayload | Record<string, any>): Order {
  const tableId = String(payload.tableId || mockStoreSession.tableId);
  const tableName = tableId === mockStoreSession.tableId ? mockStoreSession.tableName : `桌号${tableId}`;
  const sourceItems = Array.isArray(payload.items) ? payload.items : [];

  const items: Order['items'] = [];
  let totalPriceFen = 0;

  sourceItems.forEach((rawItem: any) => {
    const dishId = String(rawItem?.dishId || '');
    const qty = Number(rawItem?.qty ?? rawItem?.quantity ?? 0);
    if (!dishId || !Number.isFinite(qty) || qty <= 0) return;

    const dish = findDishById(dishId);
    if (!dish || dish.onSale === false || dish.soldOut) return;

    items.push({
      dishId,
      dishName: dish.name,
      unitPriceFen: dish.priceFen,
      qty,
    });
    totalPriceFen += dish.priceFen * qty;
  });

  if (items.length === 0) {
    throw new Error('购物车为空或菜品不可下单');
  }

  return {
    id: String(Date.now()),
    storeId: String(payload.storeId || mockStoreSession.storeId),
    tableId,
    tableName,
    status: 'PENDING_PAY',
    items,
    totalPriceFen,
    remark: payload.remark ? String(payload.remark).trim() : '',
    createdAt: new Date().toISOString(),
  };
}

function resolveErrorMessage(payload: any, fallback: string): string {
  if (payload && typeof payload === 'object') {
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
  }
  return fallback;
}

async function handleMockRequest<T = any>(options: WechatMiniprogram.RequestOption): Promise<RequestResult<T>> {
  const method = getMethod(options);
  const urlInfo = parseUrl(String(options.url || '/'));
  const path = normalizeApiPath(urlInfo.path);
  const body = (options.data || {}) as Record<string, any>;

  await requestDelay(280);

  let result: any;

  if (path === '/session/bind-table' && method === 'POST') {
    const payload = body as Partial<BindTablePayload>;
    if (!payload.tableId) {
      throw new Error('tableId 不能为空');
    }
    result = {
      storeId: String(payload.storeId || mockStoreSession.storeId),
      storeName: mockStoreSession.storeName,
      tableId: String(payload.tableId),
      tableName: payload.tableId === mockStoreSession.tableId ? mockStoreSession.tableName : `桌号${payload.tableId}`,
    } as BindTableResult;
  } else if (path === '/menu' && method === 'GET') {
    result = {
      storeId: urlInfo.query.storeId || mockStoreSession.storeId,
      storeName: mockStoreSession.storeName,
      categories: mockCategories,
    };
  } else if (path === '/orders' && method === 'POST') {
    const order = buildMockOrder(body as CreateOrderPayload);
    mockState.orders.unshift(order);
    persistMockState();
    result = order;
  } else if (/^\/orders\/.+/.test(path) && method === 'GET') {
    const orderId = path.split('/').pop() || '';
    const order = mockState.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new Error('订单不存在');
    }
    result = order;
  } else if (/^\/orders\/.+\/urge$/.test(path) && method === 'POST') {
    const segments = path.split('/');
    const orderId = segments[segments.length - 2] || '';
    const order = mockState.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new Error('订单不存在');
    }
    if (order.status !== 'PAID' && order.status !== 'COOKING') {
      throw new Error('当前订单状态不支持催单');
    }
    result = {
      orderId,
      status: order.status,
      message: '催单成功，商家将尽快处理',
      urgedAt: new Date().toISOString(),
    } as UrgeOrderResult;
  } else if (path === '/pay/wechat/prepay' && method === 'POST') {
    const payload = body as Partial<PrepayPayload>;
    if (!payload.orderId) {
      throw new Error('orderId 不能为空');
    }
    result = {
      timeStamp: String(Math.floor(Date.now() / 1000)),
      nonceStr: `mock_${Date.now()}`,
      prepayPackage: `prepay_id=mock_${payload.orderId}`,
      signType: 'MD5',
      paySign: 'mock-pay-sign',
    };
  } else if (path === '/pay/wechat/confirm' && method === 'POST') {
    const payload = body as Partial<PrepayPayload>;
    if (!payload.orderId) {
      throw new Error('orderId 不能为空');
    }
    const index = mockState.orders.findIndex((item) => item.id === payload.orderId);
    if (index < 0) {
      throw new Error('订单不存在');
    }
    mockState.orders[index] = {
      ...mockState.orders[index],
      status: 'PAID',
    };
    persistMockState();
    result = mockState.orders[index];
  } else if (path === '/auth/wechat-login' && method === 'POST') {
    result = {
      token: 'mock_client_token',
      user: {
        id: 'mock_user',
        nickname: '匿名用户',
        avatar: '',
        openid: 'mock_openid',
      },
    } as WechatLoginResult;
  } else if (path === '/notices' && method === 'GET') {
    result = mockNotices;
  } else if (path === '/comments' && method === 'GET') {
    result = mockState.comments;
  } else if (path === '/comments' && method === 'POST') {
    const orderId = String(body.orderId || '').trim();
    const rating = Number(body.rating || 0);
    const content = String(body.content || '').trim();
    if (!orderId) {
      throw new Error('orderId 不能为空');
    }
    const order = mockState.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new Error('订单不存在');
    }
    if (order.status !== 'DONE') {
      throw new Error('仅已完成订单可评价');
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new Error('评分需在 1~5 之间');
    }
    if (!content) {
      throw new Error('评价内容不能为空');
    }
    const existed = mockState.comments.find((item) => String(item.orderId || '') === orderId);
    if (existed) {
      throw new Error('该订单已评价');
    }
    const newComment = {
      id: String(Date.now()),
      orderId,
      userName: '匿名用户',
      rating,
      content,
      createdAt: new Date().toISOString(),
    };
    mockState.comments.unshift(newComment);
    persistMockState();
    result = newComment;
  } else if (path === '/support/tickets' && method === 'GET') {
    result = [...mockState.supportTickets].sort((a, b) => String(b.lastMessageAt).localeCompare(String(a.lastMessageAt)));
  } else if (path === '/support/tickets' && method === 'POST') {
    const topic = String(body.topic || '').trim();
    const content = String(body.content || '').trim();
    if (!topic) throw new Error('问题主题不能为空');
    if (!content) throw new Error('消息内容不能为空');
    const now = new Date().toISOString();
    const ticket: SupportTicketDetail = {
      id: `st_${Date.now()}`,
      nickname: '匿名用户',
      topic,
      lastMessageAt: now,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };
    mockState.supportTickets.unshift(ticket);
    mockState.supportMessages.push({
      id: `stm_${Date.now()}`,
      ticketId: ticket.id,
      senderType: 'USER',
      senderId: 'mock_user',
      senderName: '匿名用户',
      content,
      isRead: false,
      createdAt: now,
    });
    persistMockState();
    result = ticket;
  } else if (/^\/support\/tickets\/[^/]+$/.test(path) && method === 'GET') {
    const ticketId = path.split('/').pop() || '';
    const ticket = mockState.supportTickets.find((item) => item.id === ticketId);
    if (!ticket) throw new Error('工单不存在');
    result = {
      ...ticket,
      createdAt: ticket.lastMessageAt,
      updatedAt: ticket.lastMessageAt,
    } as SupportTicketDetail;
  } else if (/^\/support\/tickets\/[^/]+\/messages$/.test(path) && method === 'GET') {
    const segments = path.split('/');
    const ticketId = segments[segments.length - 2] || '';
    const list = mockState.supportMessages
      .filter((item) => item.ticketId === ticketId)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    result = {
      list,
      total: list.length,
      page: Number(urlInfo.query.page || 1),
      pageSize: Number(urlInfo.query.pageSize || 20),
    };
  } else if (/^\/support\/tickets\/[^/]+\/messages$/.test(path) && method === 'POST') {
    const segments = path.split('/');
    const ticketId = segments[segments.length - 2] || '';
    const ticket = mockState.supportTickets.find((item) => item.id === ticketId);
    if (!ticket) throw new Error('工单不存在');
    if (ticket.status !== 'OPEN') throw new Error('工单已关闭，无法继续发送消息');
    const content = String(body.content || '').trim();
    if (!content) throw new Error('消息内容不能为空');
    const now = new Date().toISOString();
    const message: SupportTicketMessage = {
      id: `stm_${Date.now()}`,
      ticketId,
      senderType: 'USER',
      senderId: 'mock_user',
      senderName: '匿名用户',
      content,
      isRead: false,
      createdAt: now,
    };
    mockState.supportMessages.push(message);
    ticket.lastMessageAt = now;
    persistMockState();
    result = message;
  } else {
    throw new Error(`Mock route not found: ${method} ${path}`);
  }

  const unwrapped = unwrapEnvelope<T>(successEnvelope(result));
  return { data: unwrapped.data, statusCode: 200, message: unwrapped.message };
}

export const request = async <T = any>(options: WechatMiniprogram.RequestOption): Promise<RequestResult<T>> => {
  if (shouldUseMock()) {
    return handleMockRequest<T>(options);
  }

  return rawRequest<T>(options, true);
};

async function rawRequest<T = any>(
  options: WechatMiniprogram.RequestOption,
  withAuth = false,
  retried = false,
): Promise<RequestResult<T>> {
  const url = resolveUrl(String(options.url || '/'));
  const method = getMethod(options);
  const path = normalizeApiPath(parseUrl(String(options.url || '/')).path);
  const token = withAuth && path !== '/auth/wechat-login' ? await ensureClientToken() : '';

  return new Promise((resolve, reject) => {
    const header = {
      ...(options.header || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    wx.request({
      ...options,
      method: method as WechatMiniprogram.RequestOption['method'],
      url,
      header,
      success: (res) => {
        const statusCode = res.statusCode || 500;
        if (statusCode < 200 || statusCode >= 300) {
          if (statusCode === 401 && withAuth && !retried) {
            wx.removeStorageSync(STORAGE_KEYS.clientToken);
            wx.removeStorageSync(STORAGE_KEYS.clientUser);
            rawRequest<T>(options, withAuth, true).then(resolve).catch(reject);
            return;
          }
          reject(new Error(resolveErrorMessage(res.data, `HTTP ${statusCode}`)));
          return;
        }

        try {
          const unwrapped = unwrapEnvelope<any>(res.data);
          let data = unwrapped.data;

          if (path === '/menu') {
            data = normalizeMenu(data);
          }
          if (path === '/orders' && method === 'POST') {
            data = normalizeOrder(data);
          }
          if (/^\/orders\/.+/.test(path) && method === 'GET') {
            data = normalizeOrder(data);
          }

          resolve({ data: data as T, statusCode, message: unwrapped.message });
        } catch (err) {
          reject(err);
        }
      },
      fail: (err) => reject(err),
    });
  });
}
