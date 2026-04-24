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

const API_BASE_URL_KEY = 'MP_API_BASE_URL';

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
  const baseUrl = String(wx.getStorageSync(API_BASE_URL_KEY) || 'http://localhost:8080').replace(/\/+$/, '');
  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }
  if (rawUrl.startsWith('/api/')) {
    return `${baseUrl}${rawUrl}`;
  }
  if (rawUrl.startsWith('/')) {
    return `${baseUrl}${API_PREFIX}${rawUrl}`;
  }
  return `${baseUrl}${API_PREFIX}/${rawUrl}`;
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

function normalizeMenu(payload: any): { storeId: string; storeName: string; categories: Category[] } {
  if (Array.isArray(payload)) {
    return {
      storeId: '',
      storeName: '',
      categories: payload as Category[],
    };
  }

  if (payload && typeof payload === 'object' && Array.isArray(payload.categories)) {
    return {
      storeId: String(payload.storeId || ''),
      storeName: String(payload.storeName || ''),
      categories: payload.categories as Category[],
    };
  }

  return {
    storeId: '',
    storeName: '',
    categories: [],
  };
}

function normalizeOrder(rawOrder: any): Order {
  const rawItems = Array.isArray(rawOrder?.items) ? rawOrder.items : [];

  const items = rawItems.map((item: any) => {
    const unitPriceFen = item?.unitPriceFen ?? item?.unitPrice?.amountFen ?? 0;
    return {
      cartKey: `${String(item?.dishId || '')}::${String(item?.skuName || '')}`,
      dishId: String(item?.dishId || ''),
      dishName: String(item?.dishName || ''),
      skuName: item?.skuName ? String(item.skuName) : '',
      unitPriceFen: Number(unitPriceFen) || 0,
      qty: Number(item?.qty) || 0,
    };
  });

  const totalPriceFen = Number(rawOrder?.totalPriceFen ?? rawOrder?.totalPrice?.amountFen ?? 0) || 0;

  return {
    id: String(rawOrder?.id || ''),
    storeId: String(rawOrder?.storeId || ''),
    tableId: String(rawOrder?.tableId || ''),
    tableName: String(rawOrder?.tableName || ''),
    status: String(rawOrder?.status || 'PENDING_PAY') as Order['status'],
    items,
    totalPriceFen,
    remark: rawOrder?.remark ? String(rawOrder.remark) : '',
    createdAt: String(rawOrder?.createdAt || new Date().toISOString()),
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

export const request = async <T = any>(options: WechatMiniprogram.RequestOption): Promise<RequestResult<T>> => {
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
          if (path === '/orders' && method === 'GET' && Array.isArray(data)) {
            data = data.map((item) => normalizeOrder(item));
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
