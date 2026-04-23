"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = exports.shouldUseMock = exports.STORAGE_KEYS = void 0;
const data_1 = require("../mock/data");
const MOCK_FLAG_KEY = 'MP_USE_MOCK';
const API_BASE_URL_KEY = 'MP_API_BASE_URL';
const MOCK_ORDERS_KEY = 'MP_MOCK_ORDERS';
const MOCK_COMMENTS_KEY = 'MP_MOCK_COMMENTS';
const MOCK_SUPPORT_TICKETS_KEY = 'MP_MOCK_SUPPORT_TICKETS';
const MOCK_SUPPORT_MESSAGES_KEY = 'MP_MOCK_SUPPORT_MESSAGES';
const BASE_URL = wx.getStorageSync(API_BASE_URL_KEY) || 'http://localhost:8080';
const API_PREFIX = '/api/v1';
exports.STORAGE_KEYS = {
    session: 'storeSession',
    cart: 'cart',
    cartRemark: 'cartRemark',
    lastOrderId: 'lastOrderId',
    clientToken: 'clientToken',
    clientUser: 'clientUser',
};
const mockState = {
    orders: initMockOrders(),
    comments: initMockComments(),
    supportTickets: initMockSupportTickets(),
    supportMessages: initMockSupportMessages(),
};
function cloneOrders(list) {
    return list.map((order) => (Object.assign(Object.assign({}, order), { items: order.items.map((item) => (Object.assign({}, item))) })));
}
function cloneComments(list) {
    return list.map((item) => (Object.assign({}, item)));
}
function initMockOrders() {
    const cached = wx.getStorageSync(MOCK_ORDERS_KEY);
    if (Array.isArray(cached) && cached.length > 0) {
        return cloneOrders(cached);
    }
    const seed = cloneOrders(data_1.mockOrders);
    wx.setStorageSync(MOCK_ORDERS_KEY, seed);
    return seed;
}
function initMockComments() {
    const cached = wx.getStorageSync(MOCK_COMMENTS_KEY);
    if (Array.isArray(cached) && cached.length > 0) {
        return cloneComments(cached);
    }
    const seed = cloneComments(data_1.mockComments);
    wx.setStorageSync(MOCK_COMMENTS_KEY, seed);
    return seed;
}
function initMockSupportTickets() {
    const cached = wx.getStorageSync(MOCK_SUPPORT_TICKETS_KEY);
    if (Array.isArray(cached) && cached.length > 0) {
        return cached;
    }
    const now = new Date().toISOString();
    const seed = [
        { id: 'st_1', nickname: '匿名用户', topic: '支付失败如何处理？', lastMessageAt: now, status: 'OPEN' },
    ];
    wx.setStorageSync(MOCK_SUPPORT_TICKETS_KEY, seed);
    return seed;
}
function initMockSupportMessages() {
    const cached = wx.getStorageSync(MOCK_SUPPORT_MESSAGES_KEY);
    if (Array.isArray(cached) && cached.length > 0) {
        return cached;
    }
    const now = new Date().toISOString();
    const seed = [
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
    wx.setStorageSync(MOCK_SUPPORT_TICKETS_KEY, mockState.supportTickets.map((item) => (Object.assign({}, item))));
    wx.setStorageSync(MOCK_SUPPORT_MESSAGES_KEY, mockState.supportMessages.map((item) => (Object.assign({}, item))));
}
function shouldUseMock() {
    return wx.getStorageSync(MOCK_FLAG_KEY) !== false;
}
exports.shouldUseMock = shouldUseMock;
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
const requestDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
function wxLogin() {
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
function ensureClientToken() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const cached = wx.getStorageSync(exports.STORAGE_KEYS.clientToken);
        if (cached && typeof cached === 'string') {
            return cached;
        }
        const code = yield wxLogin();
        const result = yield rawRequest({
            url: '/auth/wechat-login',
            method: 'POST',
            data: { code },
        });
        if (!((_a = result.data) === null || _a === void 0 ? void 0 : _a.token)) {
            throw new Error('登录态获取失败');
        }
        wx.setStorageSync(exports.STORAGE_KEYS.clientToken, result.data.token);
        wx.setStorageSync(exports.STORAGE_KEYS.clientUser, result.data.user);
        return result.data.token;
    });
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
    var _a, _b, _c;
    const rawItems = Array.isArray(rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.items) ? rawOrder.items : [];
    const items = rawItems.map((item) => {
        var _a, _b, _c;
        const unitPriceFen = (_c = (_a = item === null || item === void 0 ? void 0 : item.unitPriceFen) !== null && _a !== void 0 ? _a : (_b = item === null || item === void 0 ? void 0 : item.unitPrice) === null || _b === void 0 ? void 0 : _b.amountFen) !== null && _c !== void 0 ? _c : 0;
        return {
            dishId: String((item === null || item === void 0 ? void 0 : item.dishId) || ''),
            dishName: String((item === null || item === void 0 ? void 0 : item.dishName) || ''),
            unitPriceFen: Number(unitPriceFen) || 0,
            qty: Number(item === null || item === void 0 ? void 0 : item.qty) || 0,
        };
    });
    const totalPriceFen = Number((_c = (_a = rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.totalPriceFen) !== null && _a !== void 0 ? _a : (_b = rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.totalPrice) === null || _b === void 0 ? void 0 : _b.amountFen) !== null && _c !== void 0 ? _c : 0) || 0;
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
    const tableId = String(payload.tableId || data_1.mockStoreSession.tableId);
    const tableName = tableId === data_1.mockStoreSession.tableId ? data_1.mockStoreSession.tableName : `桌号${tableId}`;
    const sourceItems = Array.isArray(payload.items) ? payload.items : [];
    const items = [];
    let totalPriceFen = 0;
    sourceItems.forEach((rawItem) => {
        var _a, _b;
        const dishId = String((rawItem === null || rawItem === void 0 ? void 0 : rawItem.dishId) || '');
        const qty = Number((_b = (_a = rawItem === null || rawItem === void 0 ? void 0 : rawItem.qty) !== null && _a !== void 0 ? _a : rawItem === null || rawItem === void 0 ? void 0 : rawItem.quantity) !== null && _b !== void 0 ? _b : 0);
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
    return __awaiter(this, void 0, void 0, function* () {
        const method = getMethod(options);
        const urlInfo = parseUrl(String(options.url || '/'));
        const path = normalizeApiPath(urlInfo.path);
        const body = (options.data || {});
        yield requestDelay(280);
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
            persistMockState();
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
            persistMockState();
            result = mockState.orders[index];
        }
        else if (path === '/auth/wechat-login' && method === 'POST') {
            result = {
                token: 'mock_client_token',
                user: {
                    id: 'mock_user',
                    nickname: '匿名用户',
                    avatar: '',
                    openid: 'mock_openid',
                },
            };
        }
        else if (path === '/notices' && method === 'GET') {
            result = data_1.mockNotices;
        }
        else if (path === '/comments' && method === 'GET') {
            result = mockState.comments;
        }
        else if (path === '/comments' && method === 'POST') {
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
        }
        else if (path === '/support/tickets' && method === 'GET') {
            result = [...mockState.supportTickets].sort((a, b) => String(b.lastMessageAt).localeCompare(String(a.lastMessageAt)));
        }
        else if (path === '/support/tickets' && method === 'POST') {
            const topic = String(body.topic || '').trim();
            const content = String(body.content || '').trim();
            if (!topic)
                throw new Error('问题主题不能为空');
            if (!content)
                throw new Error('消息内容不能为空');
            const now = new Date().toISOString();
            const ticket = {
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
        }
        else if (/^\/support\/tickets\/[^/]+$/.test(path) && method === 'GET') {
            const ticketId = path.split('/').pop() || '';
            const ticket = mockState.supportTickets.find((item) => item.id === ticketId);
            if (!ticket)
                throw new Error('工单不存在');
            result = Object.assign(Object.assign({}, ticket), { createdAt: ticket.lastMessageAt, updatedAt: ticket.lastMessageAt });
        }
        else if (/^\/support\/tickets\/[^/]+\/messages$/.test(path) && method === 'GET') {
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
        }
        else if (/^\/support\/tickets\/[^/]+\/messages$/.test(path) && method === 'POST') {
            const segments = path.split('/');
            const ticketId = segments[segments.length - 2] || '';
            const ticket = mockState.supportTickets.find((item) => item.id === ticketId);
            if (!ticket)
                throw new Error('工单不存在');
            if (ticket.status !== 'OPEN')
                throw new Error('工单已关闭，无法继续发送消息');
            const content = String(body.content || '').trim();
            if (!content)
                throw new Error('消息内容不能为空');
            const now = new Date().toISOString();
            const message = {
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
        }
        else {
            throw new Error(`Mock route not found: ${method} ${path}`);
        }
        const unwrapped = unwrapEnvelope(successEnvelope(result));
        return { data: unwrapped.data, statusCode: 200, message: unwrapped.message };
    });
}
const request = (options) => __awaiter(void 0, void 0, void 0, function* () {
    if (shouldUseMock()) {
        return handleMockRequest(options);
    }
    return rawRequest(options, true);
});
exports.request = request;
function rawRequest(options, withAuth = false, retried = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = resolveUrl(String(options.url || '/'));
        const method = getMethod(options);
        const path = normalizeApiPath(parseUrl(String(options.url || '/')).path);
        const token = withAuth && path !== '/auth/wechat-login' ? yield ensureClientToken() : '';
        return new Promise((resolve, reject) => {
            const header = Object.assign(Object.assign({}, (options.header || {})), (token ? { Authorization: `Bearer ${token}` } : {}));
            wx.request(Object.assign(Object.assign({}, options), { method: method, url,
                header, success: (res) => {
                    const statusCode = res.statusCode || 500;
                    if (statusCode < 200 || statusCode >= 300) {
                        if (statusCode === 401 && withAuth && !retried) {
                            wx.removeStorageSync(exports.STORAGE_KEYS.clientToken);
                            wx.removeStorageSync(exports.STORAGE_KEYS.clientUser);
                            rawRequest(options, withAuth, true).then(resolve).catch(reject);
                            return;
                        }
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
                        resolve({ data: data, statusCode, message: unwrapped.message });
                    }
                    catch (err) {
                        reject(err);
                    }
                }, fail: (err) => reject(err) }));
        });
    });
}
