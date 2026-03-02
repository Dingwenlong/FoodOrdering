"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = exports.STORAGE_KEYS = void 0;
const data_1 = require("../mock/data");
const MOCK_FLAG_KEY = 'MP_USE_MOCK';
const API_BASE_URL_KEY = 'MP_API_BASE_URL';
const USE_MOCK = wx.getStorageSync(MOCK_FLAG_KEY) !== false;
const BASE_URL = wx.getStorageSync(API_BASE_URL_KEY) || 'http://localhost:8080';
const API_PREFIX = '/api/v1';
exports.STORAGE_KEYS = {
    session: 'storeSession',
    cart: 'cart',
    cartRemark: 'cartRemark',
    lastOrderId: 'lastOrderId',
};
const mockState = {
    orders: cloneOrders(data_1.mockOrders),
};
function cloneOrders(list) {
    return list.map((order) => (Object.assign(Object.assign({}, order), { items: order.items.map((item) => (Object.assign({}, item))) })));
}
const successEnvelope = (data) => ({
    code: 0,
    message: 'OK',
    data,
    timestamp: new Date().toISOString(),
});
const unwrapEnvelope = (payload) => {
    if (payload && typeof payload === 'object' && typeof payload.code === 'number' && 'data' in payload) {
        if (payload.code !== 0) {
            throw new Error(payload.message || '请求失败');
        }
        return { data: payload.data, message: payload.message || 'OK' };
    }
    return { data: payload, message: 'OK' };
};
function parseUrl(rawUrl) {
    const [rawPath, rawQuery = ''] = rawUrl.split('?');
    const path = rawPath || '/';
    const query = {};
    if (!rawQuery) {
        return { path, query };
    }
    rawQuery.split('&').forEach((kv) => {
        if (!kv)
            return;
        const [k, v = ''] = kv.split('=');
        if (!k)
            return;
        query[decodeURIComponent(k)] = decodeURIComponent(v);
    });
    return { path, query };
}
function normalizeApiPath(path) {
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
function resolveUrl(rawUrl) {
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
function getMethod(options) {
    return (options.method || 'GET').toUpperCase();
}
function findDishById(dishId) {
    for (const category of data_1.mockCategories) {
        const dish = category.dishes.find((item) => item.id === dishId);
        if (dish)
            return dish;
    }
    return null;
}
function normalizeMenu(payload) {
    if (Array.isArray(payload)) {
        return {
            storeId: data_1.mockStoreSession.storeId,
            storeName: data_1.mockStoreSession.storeName,
            categories: payload,
        };
    }
    if (payload && typeof payload === 'object' && Array.isArray(payload.categories)) {
        return {
            storeId: String(payload.storeId || data_1.mockStoreSession.storeId),
            storeName: String(payload.storeName || data_1.mockStoreSession.storeName),
            categories: payload.categories,
        };
    }
    return {
        storeId: data_1.mockStoreSession.storeId,
        storeName: data_1.mockStoreSession.storeName,
        categories: [],
    };
}
function normalizeOrder(rawOrder) {
    const rawItems = Array.isArray(rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.items) ? rawOrder.items : [];
    const items = rawItems.map((item) => {
        const unitPriceFen = item && item.unitPriceFen !== undefined
            ? item.unitPriceFen
            : (((item === null || item === void 0 ? void 0 : item.unitPrice) && item.unitPrice.amountFen) || 0);
        return {
            dishId: String((item === null || item === void 0 ? void 0 : item.dishId) || ''),
            dishName: String((item === null || item === void 0 ? void 0 : item.dishName) || ''),
            unitPriceFen: Number(unitPriceFen) || 0,
            qty: Number(item === null || item === void 0 ? void 0 : item.qty) || 0,
        };
    });
    const totalPriceFen = Number((rawOrder && rawOrder.totalPriceFen !== undefined)
        ? rawOrder.totalPriceFen
        : (((rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.totalPrice) && rawOrder.totalPrice.amountFen) || 0)) || 0;
    return {
        id: String((rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.id) || ''),
        storeId: String((rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.storeId) || data_1.mockStoreSession.storeId),
        tableId: String((rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.tableId) || data_1.mockStoreSession.tableId),
        tableName: String((rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.tableName) || data_1.mockStoreSession.tableName),
        status: String((rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.status) || 'PENDING_PAY'),
        items,
        totalPriceFen,
        remark: (rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.remark) ? String(rawOrder.remark) : '',
        createdAt: String((rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.createdAt) || new Date().toISOString()),
    };
}
function buildMockOrder(payload) {
    var _a, _b;
    const tableId = String(payload.tableId || data_1.mockStoreSession.tableId);
    const tableName = tableId === data_1.mockStoreSession.tableId ? data_1.mockStoreSession.tableName : `桌号${tableId}`;
    const sourceItems = Array.isArray(payload.items) ? payload.items : [];
    const items = [];
    let totalPriceFen = 0;
    sourceItems.forEach((rawItem) => {
        const dishId = String((rawItem === null || rawItem === void 0 ? void 0 : rawItem.dishId) || '');
        const qty = Number((_a = rawItem === null || rawItem === void 0 ? void 0 : rawItem.qty) !== null && _a !== void 0 ? _a : (_b = rawItem === null || rawItem === void 0 ? void 0 : rawItem.quantity) !== null && _b !== void 0 ? _b : 0);
        if (!dishId || !Number.isFinite(qty) || qty <= 0)
            return;
        const dish = findDishById(dishId);
        if (!dish || dish.onSale === false || dish.soldOut)
            return;
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
        storeId: String(payload.storeId || data_1.mockStoreSession.storeId),
        tableId,
        tableName,
        status: 'PENDING_PAY',
        items,
        totalPriceFen,
        remark: payload.remark ? String(payload.remark).trim() : '',
        createdAt: new Date().toISOString(),
    };
}
function resolveErrorMessage(payload, fallback) {
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
function handleMockRequest(options) {
    return new Promise((resolve, reject) => {
        const method = getMethod(options);
        const urlInfo = parseUrl(String(options.url || '/'));
        const path = normalizeApiPath(urlInfo.path);
        const body = options.data || {};
        setTimeout(() => {
            try {
                let result;
                if (path === '/session/bind-table' && method === 'POST') {
                    const payload = body;
                    if (!payload.tableId) {
                        throw new Error('tableId 不能为空');
                    }
                    result = {
                        storeId: String(payload.storeId || data_1.mockStoreSession.storeId),
                        storeName: data_1.mockStoreSession.storeName,
                        tableId: String(payload.tableId),
                        tableName: payload.tableId === data_1.mockStoreSession.tableId ? data_1.mockStoreSession.tableName : `桌号${payload.tableId}`,
                    };
                }
                else if (path === '/menu' && method === 'GET') {
                    result = {
                        storeId: urlInfo.query.storeId || data_1.mockStoreSession.storeId,
                        storeName: data_1.mockStoreSession.storeName,
                        categories: data_1.mockCategories,
                    };
                }
                else if (path === '/orders' && method === 'POST') {
                    const order = buildMockOrder(body);
                    mockState.orders.unshift(order);
                    result = order;
                }
                else if (/^\/orders\/.+/.test(path) && method === 'GET') {
                    const orderId = path.split('/').pop() || '';
                    const order = mockState.orders.find((item) => item.id === orderId);
                    if (!order) {
                        throw new Error('订单不存在');
                    }
                    result = order;
                }
                else if (/^\/orders\/.+\/urge$/.test(path) && method === 'POST') {
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
                    };
                }
                else if (path === '/pay/wechat/prepay' && method === 'POST') {
                    const payload = body;
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
                }
                else if (path === '/pay/wechat/confirm' && method === 'POST') {
                    const payload = body;
                    if (!payload.orderId) {
                        throw new Error('orderId 不能为空');
                    }
                    const index = mockState.orders.findIndex((item) => item.id === payload.orderId);
                    if (index < 0) {
                        throw new Error('订单不存在');
                    }
                    mockState.orders[index] = Object.assign(Object.assign({}, mockState.orders[index]), { status: 'PAID' });
                    result = mockState.orders[index];
                }
                else {
                    throw new Error(`Mock route not found: ${method} ${path}`);
                }
                const unwrapped = unwrapEnvelope(successEnvelope(result));
                resolve({ data: unwrapped.data, statusCode: 200, message: unwrapped.message });
            }
            catch (error) {
                reject(error);
            }
        }, 280);
    });
}
const request = (options) => {
    if (USE_MOCK) {
        return handleMockRequest(options);
    }
    const method = getMethod(options);
    const rawUrl = String(options.url || '/');
    const path = normalizeApiPath(parseUrl(rawUrl).path);
    return new Promise((resolve, reject) => {
        wx.request(Object.assign(Object.assign({}, options), { method, url: resolveUrl(rawUrl), success: (res) => {
                const statusCode = res.statusCode || 500;
                if (statusCode < 200 || statusCode >= 300) {
                    reject(new Error(resolveErrorMessage(res.data, `HTTP ${statusCode}`)));
                    return;
                }
                try {
                    const unwrapped = unwrapEnvelope(res.data);
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
                    resolve({ data, statusCode, message: unwrapped.message });
                }
                catch (err) {
                    reject(err);
                }
            }, fail: (err) => reject(err) }));
    });
};
exports.request = request;
